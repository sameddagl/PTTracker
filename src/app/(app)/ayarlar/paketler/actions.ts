"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { withTrainer } from "@/db";
import { createTemplate, setTemplateActive } from "@/db/packages";
import { fieldErrors, parseTRY, readForm, type FormState } from "@/lib/forms";

const FIELDS = ["name", "sessionType", "sessionCount", "validityDays", "price", "makeupAllowance"] as const;

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
});

export async function createTemplateAction(
  _prev: FormState<(typeof FIELDS)[number]>,
  formData: FormData,
): Promise<FormState<(typeof FIELDS)[number]>> {
  const raw = readForm(formData, FIELDS);
  const parsed = templateSchema.safeParse(raw);
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values: raw };

  await withTrainer((tx, trainerId) => createTemplate(tx, trainerId, parsed.data));
  revalidatePath("/ayarlar/paketler");
  return { savedAt: Date.now() };
}

export async function toggleTemplateAction(formData: FormData) {
  const id = z.uuid().parse(formData.get("id"));
  const isActive = formData.get("active") === "true";
  await withTrainer((tx, trainerId) => setTemplateActive(tx, trainerId, id, isActive));
  revalidatePath("/ayarlar/paketler");
}
