"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireOwner, withTrainer } from "@/db";
import { expiryFor, sellPackage } from "@/db/packages";
import { fieldErrors, parseTRY, readForm, type FormState } from "@/lib/forms";

const FIELDS = [
  "clientId",
  "templateId",
  "name",
  "sessionType",
  "totalSessions",
  "startsOn",
  "validityDays",
  "price",
  "makeupAllowance",
  "paymentAmount",
  "paymentMethod",
  "installments",
] as const;
export type SellField = (typeof FIELDS)[number];

const money = (message: string) =>
  z
    .string()
    .transform(parseTRY)
    .refine((v) => v === null || (Number.isFinite(v) && v >= 0), message);

const sellSchema = z
  .object({
    clientId: z.uuid(),
    templateId: z
      .string()
      .transform((v) => v || null)
      .pipe(z.uuid().nullable()),
    name: z.string().trim().min(2, "Paket adı en az 2 karakter olmalı.").max(80),
    sessionType: z.enum(["private", "duet", "trio", "group"], { error: "Ders türü seç." }),
    totalSessions: z.coerce.number().int().min(1, "Ders sayısı en az 1 olmalı.").max(200, "Ders sayısı en fazla 200 olabilir."),
    startsOn: z.iso.date({ error: "Başlangıç tarihi seç." }),
    validityDays: z
      .string()
      .trim()
      .transform((v) => (v === "" ? null : Number(v)))
      .refine((v) => v === null || (Number.isInteger(v) && v >= 1 && v <= 730), "Geçerlilik 1 ile 730 gün arasında olmalı."),
    price: money("Fiyatı kontrol et."),
    makeupAllowance: z.coerce.number().int().min(0).max(50, "Telafi hakkı en fazla 50 olabilir."),
    paymentAmount: money("Ödeme tutarını kontrol et."),
    paymentMethod: z.enum(["cash", "bank_transfer", "card", "other"]),
    installments: z.coerce.number().int().min(1).max(12, "En fazla 12 taksit olabilir."),
  })
  .refine((v) => (v.paymentAmount ?? 0) <= (v.price ?? 0) || (v.price ?? 0) === 0, {
    path: ["paymentAmount"],
    message: "Alınan tutar paket fiyatını geçemez.",
  });

export async function sellPackageAction(_prev: FormState<SellField>, formData: FormData): Promise<FormState<SellField>> {
  await requireOwner();
  const raw = readForm(formData, FIELDS);
  const parsed = sellSchema.safeParse(raw);
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values: raw };

  const d = parsed.data;
  await withTrainer((tx, trainerId) =>
    sellPackage(tx, trainerId, {
      clientId: d.clientId,
      templateId: d.templateId,
      name: d.name,
      sessionType: d.sessionType,
      totalSessions: d.totalSessions,
      startsOn: d.startsOn,
      expiresOn: expiryFor(d.startsOn, d.validityDays),
      price: d.price ?? 0,
      makeupAllowance: d.makeupAllowance,
      installments: d.installments,
      payment: d.paymentAmount ? { amount: d.paymentAmount, method: d.paymentMethod } : null,
    }),
  );

  revalidatePath(`/danisanlar/${d.clientId}`);
  redirect(`/danisanlar/${d.clientId}`);
}
