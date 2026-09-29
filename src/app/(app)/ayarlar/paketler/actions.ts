"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { withTrainer } from "@/db";
import { createTemplate, setTemplateActive, updateTemplate } from "@/db/packages";
import { fieldErrors, parseTRY, readForm, type FormState } from "@/lib/forms";

const FIELDS = [
  "name",
  "sessionType",
  "sessionCount",
  "validityDays",
  "price",
  "makeupAllowance",
  "isPublic",
  "description",
  "features",
  "sortOrder",
] as const;
export type TemplateField = (typeof FIELDS)[number];

const intIn = (min: number, max: number, message: string) =>
  z.coerce.number({ error: message }).int(message).min(min, message).max(max, message);

const templateSchema = z.object({
  name: z.string().trim().min(2, "Paket adı en az 2 karakter olmalı.").max(80),
  sessionType: z.enum(["private", "duet", "trio", "group"], { error: "Ders türü seç." }),
  sessionCount: intIn(1, 200, "Ders sayısı 1 ile 200 arasında olmalı."),
  validityDays: z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : Number(v)))
    .refine((v) => v === null || (Number.isInteger(v) && v >= 1 && v <= 730), "Geçerlilik 1–730 gün olmalı."),
  price: z
    .string()
    .transform(parseTRY)
    .refine((v) => v === null || (Number.isFinite(v) && v >= 0), "Fiyat geçersiz."),
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
    .transform((v) => v.split("\n").map((l) => l.replace(/^[-•*]\s*/, "").trim()).filter(Boolean))
    .refine((v) => v.length <= 8, "En fazla 8 madde.")
    .refine((v) => v.every((l) => l.length <= 80), "Her madde en fazla 80 karakter."),
  sortOrder: z
    .string()
    .transform((v) => (v.trim() === "" ? 0 : Number(v)))
    .refine((v) => Number.isInteger(v) && v >= 0 && v <= 99, "Sıra 0–99 arası olmalı."),
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
    if (!ok) return { errors: { name: "Şablon bulunamadı." }, values: raw };
  } else {
    await withTrainer((tx, trainerId) => createTemplate(tx, trainerId, parsed.data));
  }
  revalidatePath("/ayarlar/paketler", "layout");
  return { savedAt: Date.now() };
}

export async function toggleTemplateAction(formData: FormData) {
  const id = z.uuid().parse(formData.get("id"));
  const isActive = formData.get("active") === "true";
  await withTrainer((tx, trainerId) => setTemplateActive(tx, trainerId, id, isActive));
  revalidatePath("/ayarlar/paketler");
}
