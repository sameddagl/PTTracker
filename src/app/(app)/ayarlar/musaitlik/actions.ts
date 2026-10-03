"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireOwner, withTrainer } from "@/db";
import { addTimeOff, deleteTimeOff, replaceAvailabilityRules } from "@/db/booking";
import { trainers } from "@/db/schema";
import type { FormState } from "@/lib/forms";

const ruleSchema = z
  .object({
    weekday: z.number().int().min(1).max(7),
    startMinute: z.number().int().min(0).max(1439),
    endMinute: z.number().int().min(1).max(1440),
  })
  .refine((r) => r.endMinute > r.startMinute, "Bitiş saati başlangıçtan sonra olmalı.");

const settingsSchema = z.object({
  bookingEnabled: z.boolean(),
  bookingLessonMinutes: z.number().int().min(15).max(240),
  bookingMinNoticeHours: z.number().int().min(0).max(168),
  bookingHorizonDays: z.number().int().min(1).max(90),
  rules: z.array(ruleSchema).max(50),
});

export type AvailabilityField = "rules" | "bookingLessonMinutes" | "bookingMinNoticeHours" | "bookingHorizonDays";

export async function saveAvailabilityAction(
  _prev: FormState<AvailabilityField>,
  formData: FormData,
): Promise<FormState<AvailabilityField>> {
  await requireOwner();
  let rules: unknown;
  try {
    rules = JSON.parse(formData.get("rules")?.toString() ?? "[]");
  } catch {
    return { errors: { rules: "Saatler okunamadı." } };
  }
  const parsed = settingsSchema.safeParse({
    bookingEnabled: formData.get("bookingEnabled") === "on",
    bookingLessonMinutes: Number(formData.get("bookingLessonMinutes")),
    bookingMinNoticeHours: Number(formData.get("bookingMinNoticeHours")),
    bookingHorizonDays: Number(formData.get("bookingHorizonDays")),
    rules,
  });
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const key = (issue.path[0] === "rules" ? "rules" : issue.path[0]) as AvailabilityField;
    return { errors: { [key]: key === "rules" ? "Her aralığın bitişi başlangıcından sonra olmalı." : "Değeri kontrol et." } };
  }
  const { rules: ruleList, ...settings } = parsed.data;
  if (settings.bookingEnabled && ruleList.length === 0) {
    return { errors: { rules: "Randevuyu açmak için en az bir saat aralığı ekle." } };
  }

  await withTrainer(async (tx, trainerId) => {
    await tx.update(trainers).set(settings).where(eq(trainers.id, trainerId));
    await replaceAvailabilityRules(tx, trainerId, ruleList);
  });
  revalidatePath("/ayarlar", "layout");
  return { savedAt: Date.now() };
}

const offSchema = z
  .object({
    startsOn: z.iso.date({ error: "Başlangıç seç." }),
    endsOn: z.iso.date({ error: "Bitiş seç." }),
    note: z
      .string()
      .trim()
      .max(100)
      .transform((v) => v || null),
  })
  .refine((v) => v.endsOn >= v.startsOn, { path: ["endsOn"], message: "Bitiş tarihi başlangıçtan önce olamaz." });

export async function addTimeOffAction(_prev: FormState<"startsOn" | "endsOn">, formData: FormData): Promise<FormState<"startsOn" | "endsOn">> {
  await requireOwner();
  const parsed = offSchema.safeParse({
    startsOn: formData.get("startsOn")?.toString() ?? "",
    endsOn: formData.get("endsOn")?.toString() || formData.get("startsOn")?.toString() || "",
    note: formData.get("note")?.toString() ?? "",
  });
  if (!parsed.success) {
    const i = parsed.error.issues[0];
    return { errors: { [i.path[0] as "startsOn" | "endsOn"]: i.message } };
  }
  await withTrainer((tx, trainerId) => addTimeOff(tx, trainerId, parsed.data));
  revalidatePath("/ayarlar/musaitlik");
  return { savedAt: Date.now() };
}

export async function deleteTimeOffAction(id: string) {
  await requireOwner();
  const parsed = z.uuid().safeParse(id);
  if (!parsed.success) return;
  await withTrainer((tx, trainerId) => deleteTimeOff(tx, trainerId, parsed.data));
  revalidatePath("/ayarlar/musaitlik");
}
