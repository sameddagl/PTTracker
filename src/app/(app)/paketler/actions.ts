"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { withTrainer } from "@/db";
import { createTemplate, reorderTemplates, setTemplateActive, updateTemplate } from "@/db/packages";
import { fieldErrors, parseTRY, readForm, type FormState } from "@/lib/forms";

const FIELDS = [
  "name",
  "sessionType",
  "sessionCount",
  "validityDays",
  "price",
  "compareAtPrice",
  "installmentPrice",
  "installments",
  "makeupAllowance",
  "isPublic",
  "description",
  "features",
] as const;
export type TemplateField = (typeof FIELDS)[number];

const intIn = (min: number, max: number, message: string) =>
  z.coerce.number({ error: message }).int(message).min(min, message).max(max, message);

const money = (message: string) =>
  z
    .string()
    .transform(parseTRY)
    .refine((v) => v === null || (Number.isFinite(v) && v >= 0), message);

const templateSchema = z
  .object({
    name: z.string().trim().min(2, "Paket adı en az 2 karakter olmalı.").max(80),
    sessionType: z.enum(["private", "duet", "trio", "group"], { error: "Ders türü seç." }),
    sessionCount: intIn(1, 200, "Ders sayısı 1 ile 200 arasında olmalı."),
    validityDays: z
      .string()
      .trim()
      .transform((v) => (v === "" ? null : Number(v)))
      .refine((v) => v === null || (Number.isInteger(v) && v >= 1 && v <= 730), "Geçerlilik 1–730 gün olmalı."),
    price: money("Fiyat geçersiz."),
    compareAtPrice: money("İndirimsiz fiyat geçersiz."),
    installmentPrice: money("Taksitli fiyat geçersiz."),
    installments: intIn(1, 12, "Taksit sayısı 1–12 olmalı."),
    makeupAllowance: intIn(0, 50, "Telafi hakkı 0 ile 50 arasında olmalı."),
    isPublic: z.string().transform((v) => v === "on"),
    description: z
      .string()
      .trim()
      .max(500, "Açıklama en fazla 500 karakter.")
      .transform((v) => v || null),
    // One bullet per line.
    features: z
      .string()
      .transform((v) =>
        v
          .split("\n")
          .map((l) => l.replace(/^[-•*]\s*/, "").trim())
          .filter(Boolean),
      )
      .refine((v) => v.length <= 8, "En fazla 8 madde.")
      .refine((v) => v.every((l) => l.length <= 80), "Her madde en fazla 80 karakter."),
  })
  .superRefine((v, ctx) => {
    if (v.compareAtPrice !== null) {
      if (v.price === null) ctx.addIssue({ code: "custom", path: ["compareAtPrice"], message: "Önce peşin fiyatı gir." });
      else if (v.compareAtPrice <= v.price)
        ctx.addIssue({ code: "custom", path: ["compareAtPrice"], message: "İndirimsiz fiyat, peşin fiyattan yüksek olmalı." });
    }
    if (v.installments > 1 && v.installmentPrice === null)
      ctx.addIssue({ code: "custom", path: ["installmentPrice"], message: "Taksitli toplam fiyatı gir." });
  });

export async function saveTemplateAction(
  _prev: FormState<TemplateField>,
  formData: FormData,
): Promise<FormState<TemplateField>> {
  const raw = readForm(formData, FIELDS);
  const parsed = templateSchema.safeParse(raw);
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values: raw };

  const id = z.uuid().safeParse(formData.get("id"));
  if (id.success) {
    const ok = await withTrainer((tx, trainerId) => updateTemplate(tx, trainerId, id.data, parsed.data));
    if (!ok) return { errors: { name: "Paket bulunamadı." }, values: raw };
  } else {
    await withTrainer((tx, trainerId) => createTemplate(tx, trainerId, parsed.data));
  }
  revalidatePath("/paketler", "layout");
  redirect("/paketler");
}

export async function toggleTemplateAction(id: string, isActive: boolean) {
  await withTrainer((tx, trainerId) => setTemplateActive(tx, trainerId, z.uuid().parse(id), isActive));
  revalidatePath("/paketler");
}

export async function reorderTemplatesAction(ids: string[]) {
  const parsed = z.array(z.uuid()).max(200).parse(ids);
  await withTrainer((tx, trainerId) => reorderTemplates(tx, trainerId, parsed));
  revalidatePath("/paketler");
}
