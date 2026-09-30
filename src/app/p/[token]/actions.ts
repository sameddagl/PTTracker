"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { adminDb, type Tx } from "@/db";
import { requestPackage } from "@/db/applications";
import { MAX_RECEIPT_BYTES, RECEIPT_TYPES, recordClientPayment } from "@/db/payments";
import { clients } from "@/db/schema";
import { formatTRY, todayISO } from "@/lib/format";
import { notifyTrainer } from "@/lib/notify";
import { resolvePortalToken } from "@/lib/portal";

export type ReportState = { errors?: Record<string, string>; savedAt?: number };

const reportSchema = z.object({
  clientPackageId: z.uuid(),
  note: z
    .string()
    .trim()
    .max(300)
    .transform((v) => v || null),
});

/**
 * "Ödemeyi yaptım": the client reports a transfer for their next installment.
 * The amount comes from the trainer's payment plan, not from the form.
 */
export async function reportPaymentAction(token: string, _prev: ReportState, formData: FormData): Promise<ReportState> {
  const link = await resolvePortalToken(token);
  if (!link) return { errors: { form: "Bu link artık geçerli değil." } };

  const parsed = reportSchema.safeParse({
    clientPackageId: formData.get("clientPackageId")?.toString() ?? "",
    note: formData.get("note")?.toString() ?? "",
  });
  if (!parsed.success) return { errors: { form: "Bir sorun oldu. Sayfayı yenileyip tekrar dene." } };

  const file = formData.get("receipt");
  let receipt: { mimeType: string; data: Buffer } | null = null;
  if (file instanceof File && file.size > 0) {
    if (!(RECEIPT_TYPES as readonly string[]).includes(file.type)) return { errors: { receipt: "Fotoğraf ya da PDF yükle." } };
    if (file.size > MAX_RECEIPT_BYTES) return { errors: { receipt: "Dosya en fazla 1,5 MB olabilir." } };
    receipt = { mimeType: file.type, data: Buffer.from(await file.arrayBuffer()) };
  }

  const result = await adminDb.transaction((tx) =>
    recordClientPayment(tx, link, { ...parsed.data, paidOn: todayISO(), receipt }),
  );
  if (!result.ok) {
    const message = {
      package: "Paket bulunamadı.",
      nothing_due: "Bu paket için ödenecek taksit kalmadı.",
      too_many: "Onay bekleyen ödeme bildirimlerin var. Eğitmenin onaylayınca tekrar dene.",
      receipt: "Dekont yüklenemedi.",
    }[result.reason];
    return { errors: { [result.reason === "receipt" ? "receipt" : "form"]: message } };
  }
  const label = result.of > 1 ? `${result.seq}. taksit (${formatTRY(result.amount)})` : formatTRY(result.amount);

  // Tell the trainer (best effort).
  const [who] = await adminDb.select({ name: clients.fullName }).from(clients).where(eq(clients.id, link.clientId));
  if (who) {
    const line = `${who.name}, ${label} için havale yaptığını bildirdi${receipt ? " ve dekont ekledi" : ""}.`;
    await notifyTrainer(link.trainerId, "payment", {
      title: `Ödeme bildirimi: ${who.name}`,
      body: `${label} için havale yaptığını bildirdi.`,
      path: "/odemeler",
      email: { subject: `Ödeme bildirimi: ${who.name}`, heading: "Ödeme bildirimi", lines: [line, "Para hesabına geçtiyse Ödemeler'den onaylayabilirsin."], cta: "Ödemeleri aç" },
    });
  }

  revalidatePath(`/p/${token}`);
  return { savedAt: Date.now() };
}

/** "Bu paketi istiyorum": an existing client asks for another package; the trainer approves it like a sign-up. */
export async function requestPackageAction(
  token: string,
  templateId: string,
  installments: number,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const link = await resolvePortalToken(token);
  if (!link || !z.uuid().safeParse(templateId).success || !Number.isInteger(installments)) return { ok: false, error: "Bir sorun oldu. Sayfayı yenileyip tekrar dene." };

  const result = await adminDb.transaction((tx) => requestPackage(tx as unknown as Tx, link, { templateId, installments }));
  if (!result.ok) {
    return {
      ok: false,
      error: {
        not_found: "Bu paket artık satışta değil.",
        already: "Bu paket için başvurun zaten onay bekliyor.",
        limited: "Bugünlük başvuru sınırına geldin. Yarın tekrar dene.",
        trial: "Deneme dersi yalnızca ilk kez gelenler için.",
        option: "Ödeme şeklini seç.",
      }[result.reason],
    };
  }

  const [who] = await adminDb.select({ name: clients.fullName }).from(clients).where(eq(clients.id, link.clientId));
  if (who) {
    await notifyTrainer(link.trainerId, "application", {
      title: `Paket talebi: ${who.name}`,
      body: `${result.packageName} paketini almak istiyor.`,
      path: "/danisanlar/basvurular",
      email: {
        subject: `Paket talebi: ${who.name}`,
        heading: "Yeni paket talebi",
        lines: [`${who.name}, ${result.packageName} paketini almak istiyor.`, "Başvurular ekranından onaylayabilirsin."],
        cta: "Başvuruyu gör",
      },
    });
  }
  revalidatePath(`/p/${token}`);
  return { ok: true };
}
