"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { withTrainer } from "@/db";
import { createIntakeField, deleteIntakeField, moveIntakeField, updateIntakeField } from "@/db/intake";
import { fieldErrors, parseTRY, readForm, type FormState } from "@/lib/forms";
import { INTAKE_TYPES } from "@/lib/intake";

const FIELDS = ["label", "type", "helpText", "unit", "min", "max", "options", "required", "isHealth", "isActive"] as const;
export type IntakeFieldFormField = (typeof FIELDS)[number];

const optionalNumber = z
  .string()
  .transform((v) => parseTRY(v))
  .refine((v) => v === null || Number.isFinite(v), "Sayı gir.");

const fieldSchema = z
  .object({
    label: z.string().trim().min(1, "Soruyu yaz.").max(80, "En fazla 80 karakter."),
    type: z.enum(INTAKE_TYPES, { error: "Tip seç." }),
    helpText: z
      .string()
      .trim()
      .max(200, "En fazla 200 karakter.")
      .transform((v) => v || null),
    unit: z
      .string()
      .trim()
      .max(12, "En fazla 12 karakter.")
      .transform((v) => v || null),
    min: optionalNumber,
    max: optionalNumber,
    options: z.string().transform((v) => [...new Set(v.split("\n").map((l) => l.trim()).filter(Boolean))]),
    required: z.string().transform((v) => v === "on"),
    isHealth: z.string().transform((v) => v === "on"),
    isActive: z.string().transform((v) => v === "on"),
  })
  .superRefine((v, ctx) => {
    const choice = v.type === "single_choice" || v.type === "multi_choice";
    if (choice && v.options.length < 2) ctx.addIssue({ code: "custom", path: ["options"], message: "En az 2 seçenek yaz." });
    if (choice && v.options.length > 20) ctx.addIssue({ code: "custom", path: ["options"], message: "En fazla 20 seçenek." });
    if (v.options.some((o) => o.length > 60)) ctx.addIssue({ code: "custom", path: ["options"], message: "Her seçenek en fazla 60 karakter." });
    if (v.type === "number" && v.min !== null && v.max !== null && v.min > v.max)
      ctx.addIssue({ code: "custom", path: ["max"], message: "En çok, en azdan küçük olamaz." });
  })
  // Settings that don't apply to the chosen type are dropped, not stored.
  .transform((v) => ({
    ...v,
    unit: v.type === "number" ? v.unit : null,
    min: v.type === "number" ? v.min : null,
    max: v.type === "number" ? v.max : null,
    options: v.type === "single_choice" || v.type === "multi_choice" ? v.options : [],
  }));

export async function saveIntakeFieldAction(
  _prev: FormState<IntakeFieldFormField>,
  formData: FormData,
): Promise<FormState<IntakeFieldFormField>> {
  const raw = readForm(formData, FIELDS);
  const parsed = fieldSchema.safeParse(raw);
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values: raw };

  const id = z.uuid().safeParse(formData.get("id"));
  await withTrainer(async (tx, trainerId) => {
    if (id.success) await updateIntakeField(tx, trainerId, id.data, parsed.data);
    else await createIntakeField(tx, trainerId, parsed.data);
  });
  revalidatePath("/ayarlar/kayit-formu");
  return { savedAt: Date.now() };
}

export async function deleteIntakeFieldAction(id: string) {
  const parsed = z.uuid().safeParse(id);
  if (!parsed.success) return;
  await withTrainer((tx, trainerId) => deleteIntakeField(tx, trainerId, parsed.data));
  revalidatePath("/ayarlar/kayit-formu");
}

export async function moveIntakeFieldAction(id: string, direction: "up" | "down") {
  const parsed = z.uuid().safeParse(id);
  if (!parsed.success || (direction !== "up" && direction !== "down")) return;
  await withTrainer((tx, trainerId) => moveIntakeField(tx, trainerId, parsed.data, direction));
  revalidatePath("/ayarlar/kayit-formu");
}
