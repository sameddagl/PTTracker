"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireOwner, withTrainer } from "@/db";
import { confirmPayment, deletePayment, recordPayment, rejectPayment } from "@/db/payments";
import { getTrainer } from "@/db/queries";
import { notifyClient as tellClient } from "@/lib/notify";
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
  await requireOwner();
  const raw = readForm(formData, FIELDS);
  const parsed = paymentSchema.safeParse(raw);
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values: raw };

  const result = await withTrainer((tx, trainerId) => recordPayment(tx, trainerId, parsed.data));
  if (!result.ok) {
    const message =
      result.reason === "overpay"
        ? `Bu paketin kalan borcu ${formatTRY(result.due)}; daha fazlasını giremezsin.`
        : "Paket bulunamadı.";
    return { errors: { [result.reason === "overpay" ? "amount" : "clientPackageId"]: message }, values: raw };
  }

  revalidateAll(parsed.data.clientId);
  redirect(safeNext(formData.get("next")?.toString(), "/odemeler"));
}

export async function deletePaymentAction(id: string): Promise<{ ok: boolean }> {
  await requireOwner();
  const parsed = z.uuid().safeParse(id);
  if (!parsed.success) return { ok: false };
  const row = await withTrainer((tx, trainerId) => deletePayment(tx, trainerId, parsed.data));
  if (!row) return { ok: false };
  revalidateAll(row.clientId);
  return { ok: true };
}

async function notifyClient(clientId: string, heading: string, lines: string[]) {
  const info = await withTrainer(async (tx, trainerId) => {
    const trainer = await getTrainer(tx, trainerId);
    return { trainerId, trainerName: trainer.businessName || trainer.fullName };
  });
  await tellClient({ trainerId: info.trainerId, clientId }, "package", {
    title: heading,
    body: lines[0],
    hash: "#paketler",
    tag: `payment-${clientId}`,
    email: { subject: `${info.trainerName} · ${heading}`, heading, lines, cta: "Sayfamı aç" },
  });
}

export async function confirmPaymentAction(id: string): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireOwner();
  const parsed = z.uuid().safeParse(id);
  if (!parsed.success) return { ok: false, error: "Bir sorun oldu. Sayfayı yenileyip tekrar dene." };
  const result = await withTrainer((tx, trainerId) => confirmPayment(tx, trainerId, parsed.data));
  if (!result.ok) {
    return {
      ok: false,
      error:
        result.reason === "overpay"
          ? `Bu paketin kalan borcu ${formatTRY(result.due ?? 0)}, bildirilen tutar bundan fazla. Bildirimi reddet ve danışanla konuş.`
          : "Bildirim bulunamadı ya da daha önce onaylanmış veya reddedilmiş.",
    };
  }
  revalidateAll(result.clientId);
  await notifyClient(result.clientId, "Ödemen onaylandı", [`${formatTRY(result.amount)} ödemen onaylandı ve paketine işlendi. Teşekkürler!`]);
  return { ok: true };
}

export async function rejectPaymentAction(id: string, reason: string): Promise<{ ok: boolean }> {
  await requireOwner();
  const parsed = z.uuid().safeParse(id);
  if (!parsed.success) return { ok: false };
  const why = reason.trim().slice(0, 200) || null;
  const row = await withTrainer((tx, trainerId) => rejectPayment(tx, trainerId, parsed.data, why));
  if (!row) return { ok: false };
  revalidateAll(row.clientId);
  await notifyClient(row.clientId, "Ödeme bildirimin onaylanmadı", [
    why ? `Eğitmenin notu: ${why}` : "Eğitmenin bu bildirimi onaylamadı.",
    "Ayrıntı için eğitmenine yazabilirsin.",
  ]);
  return { ok: true };
}
