"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { authUsers } from "drizzle-orm/supabase";
import { z } from "zod";
import { adminDb } from "@/db";
import { MAX_RECEIPT_BYTES, RECEIPT_TYPES, recordClientPayment } from "@/db/payments";
import { clients } from "@/db/schema";
import { siteUrl } from "@/lib/config";
import { formatTRY, todayISO } from "@/lib/format";
import { parseTRY } from "@/lib/forms";
import { layout, sendMail } from "@/lib/mail";
import { resolvePortalToken } from "@/lib/portal";

export type ReportState = { errors?: Record<string, string>; savedAt?: number };

const reportSchema = z.object({
  clientPackageId: z.uuid(),
  amount: z
    .string()
    .transform(parseTRY)
    .refine((v): v is number => v !== null && Number.isFinite(v) && v > 0, "Gönderdiğin tutarı yaz."),
  paidOn: z.iso.date({ error: "Tarih seç." }),
  note: z
    .string()
    .trim()
    .max(300)
    .transform((v) => v || null),
});

export async function reportPaymentAction(token: string, _prev: ReportState, formData: FormData): Promise<ReportState> {
  const link = await resolvePortalToken(token);
  if (!link) return { errors: { form: "Bu link artık geçerli değil." } };

  const parsed = reportSchema.safeParse({
    clientPackageId: formData.get("clientPackageId")?.toString() ?? "",
    amount: formData.get("amount")?.toString() ?? "",
    paidOn: formData.get("paidOn")?.toString() ?? "",
    note: formData.get("note")?.toString() ?? "",
  });
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const i of parsed.error.issues) errors[String(i.path[0])] ??= i.message;
    return { errors };
  }
  if (parsed.data.paidOn > todayISO()) return { errors: { paidOn: "Gelecek bir tarih seçilemez." } };

  const file = formData.get("receipt");
  let receipt: { mimeType: string; data: Buffer } | null = null;
  if (file instanceof File && file.size > 0) {
    if (!(RECEIPT_TYPES as readonly string[]).includes(file.type)) return { errors: { receipt: "Fotoğraf ya da PDF yükle." } };
    if (file.size > MAX_RECEIPT_BYTES) return { errors: { receipt: "Dosya en fazla 1,5 MB olabilir." } };
    receipt = { mimeType: file.type, data: Buffer.from(await file.arrayBuffer()) };
  }

  const result = await adminDb.transaction((tx) => recordClientPayment(tx, link, { ...parsed.data, receipt }));
  if (!result.ok) {
    const message = {
      package: "Paket bulunamadı.",
      overpay: `Kalan tutar ${formatTRY(result.due ?? 0)}. Daha fazlası bildirilemez.`,
      too_many: "Onay bekleyen bildirimlerin var. Eğitmenin onayladıktan sonra tekrar dene.",
      receipt: "Dekont yüklenemedi.",
    }[result.reason];
    return { errors: { [result.reason === "overpay" ? "amount" : "form"]: message } };
  }

  // Tell the trainer (best effort).
  const [who] = await adminDb
    .select({ name: clients.fullName, trainerEmail: authUsers.email })
    .from(clients)
    .innerJoin(authUsers, eq(authUsers.id, clients.trainerId))
    .where(eq(clients.id, link.clientId));
  if (who?.trainerEmail) {
    const { html, text } = layout({
      heading: "Ödeme bildirimi",
      lines: [
        `${who.name}, ${formatTRY(parsed.data.amount)} havale yaptığını bildirdi${receipt ? " ve dekont ekledi" : ""}.`,
        "Hesabını kontrol edip onaylayabilirsin.",
      ],
      cta: { label: "Ödemeleri aç", url: `${siteUrl()}/odemeler` },
    });
    await sendMail({ to: who.trainerEmail, subject: `Ödeme bildirimi: ${who.name}`, html, text });
  }

  revalidatePath(`/p/${token}`);
  return { savedAt: Date.now() };
}
