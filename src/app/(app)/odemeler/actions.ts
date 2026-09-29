"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { withTrainer } from "@/db";
import { deletePayment, recordPayment } from "@/db/payments";
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
