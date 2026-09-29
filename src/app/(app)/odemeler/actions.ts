"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { withTrainer } from "@/db";
import { confirmPayment, deletePayment, recordPayment, rejectPayment } from "@/db/payments";
import { getActivePortalLink } from "@/db/portal";
import { getTrainer } from "@/db/queries";
import { clients } from "@/db/schema";
import { layout, sendMail } from "@/lib/mail";
import { notifyClient as pushClient } from "@/lib/notify";
import { portalUrl } from "@/lib/portal";
import { safeNext } from "@/lib/config";
import { formatTRY } from "@/lib/format";
import { fieldErrors, parseTRY, readForm, type FormState } from "@/lib/forms";

const FIELDS = ["clientId", "clientPackageId", "amount", "method", "paidOn", "note"] as const;
export type PaymentField = (typeof FIELDS)[number];

const paymentSchema = z.object({
  clientId: z.uuid({ error: "Danışan seç." }),
  clientPackageId: z
    .string()
    .transform((v) => v || null)
    .pipe(z.uuid().nullable()),
  amount: z
    .string()
    .transform(parseTRY)
    .refine((v): v is number => v !== null && Number.isFinite(v) && v > 0, "Tutar gir."),
  method: z.enum(["cash", "bank_transfer", "card", "other"]),
  paidOn: z.iso.date({ error: "Tarih seç." }),
  note: z
    .string()
    .trim()
    .max(300)
    .transform((v) => v || null),
});

function revalidateAll(clientId: string) {
  revalidatePath("/odemeler");
  revalidatePath("/bugun");
  revalidatePath("/danisanlar");
  revalidatePath(`/danisanlar/${clientId}`);
}

export async function recordPaymentAction(
  _prev: FormState<PaymentField>,
  formData: FormData,
): Promise<FormState<PaymentField>> {
  const raw = readForm(formData, FIELDS);
  const parsed = paymentSchema.safeParse(raw);
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values: raw };

  const result = await withTrainer((tx, trainerId) => recordPayment(tx, trainerId, parsed.data));
  if (!result.ok) {
    const message =
      result.reason === "overpay"
        ? `Bu paketin kalan borcu ${formatTRY(result.due)}. Daha fazlası girilemez.`
        : "Paket bulunamadı.";
    return { errors: { [result.reason === "overpay" ? "amount" : "clientPackageId"]: message }, values: raw };
  }

  revalidateAll(parsed.data.clientId);
  redirect(safeNext(formData.get("next")?.toString(), "/odemeler"));
}

export async function deletePaymentAction(id: string): Promise<{ ok: boolean }> {
  const parsed = z.uuid().safeParse(id);
  if (!parsed.success) return { ok: false };
  const row = await withTrainer((tx, trainerId) => deletePayment(tx, trainerId, parsed.data));
  if (!row) return { ok: false };
  revalidateAll(row.clientId);
  return { ok: true };
}

async function notifyClient(clientId: string, heading: string, lines: string[]) {
  const info = await withTrainer(async (tx, trainerId) => {
    const [c] = await tx.select({ email: clients.email }).from(clients).where(eq(clients.id, clientId));
    const trainer = await getTrainer(tx, trainerId);
    const link = await getActivePortalLink(tx, clientId);
    return { trainerId, email: c?.email ?? null, trainerName: trainer.businessName || trainer.fullName, token: link?.token ?? null };
  });
  await pushClient({ trainerId: info.trainerId, clientId }, { title: heading, body: lines[0], hash: "#paketler", tag: `payment-${clientId}` });
  if (!info.email) return;
  const { html, text } = layout({
    heading,
    lines,
    cta: info.token ? { label: "Sayfamı aç", url: portalUrl(info.token) } : undefined,
    footer: info.trainerName,
  });
  await sendMail({ to: info.email, subject: `${info.trainerName} · ${heading}`, html, text });
}

export async function confirmPaymentAction(id: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = z.uuid().safeParse(id);
  if (!parsed.success) return { ok: false, error: "Geçersiz istek." };
  const result = await withTrainer((tx, trainerId) => confirmPayment(tx, trainerId, parsed.data));
  if (!result.ok) {
    return {
      ok: false,
      error:
        result.reason === "overpay"
          ? `Bu paketin kalan borcu ${formatTRY(result.due ?? 0)}; bildirim daha büyük. Reddedip danışanla konuş.`
          : "Bildirim bulunamadı ya da zaten karara bağlanmış.",
    };
  }
  revalidateAll(result.clientId);
  await notifyClient(result.clientId, "Ödemen onaylandı", [`${formatTRY(result.amount)} ödemen alındı ve kaydedildi. Teşekkürler!`]);
  return { ok: true };
}

export async function rejectPaymentAction(id: string, reason: string): Promise<{ ok: boolean }> {
  const parsed = z.uuid().safeParse(id);
  if (!parsed.success) return { ok: false };
  const why = reason.trim().slice(0, 200) || null;
  const row = await withTrainer((tx, trainerId) => rejectPayment(tx, trainerId, parsed.data, why));
  if (!row) return { ok: false };
  revalidateAll(row.clientId);
  await notifyClient(row.clientId, "Ödeme bildirimin onaylanmadı", [
    why ? `Eğitmenin notu: ${why}` : "Eğitmenin bu bildirimi onaylamadı.",
    "Detaylar için eğitmeninle iletişime geçebilirsin.",
  ]);
  return { ok: true };
}
