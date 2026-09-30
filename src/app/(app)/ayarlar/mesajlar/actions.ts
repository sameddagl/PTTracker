"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { withTrainer } from "@/db";
import { trainers } from "@/db/schema";
import type { FormState } from "@/lib/forms";
import { REMINDER_HOUR_OPTIONS, TEMPLATES, TEMPLATE_MAX_LENGTH, cleanTemplates, type TemplateKey } from "@/lib/templates";

type Key = "reminderHours" | TemplateKey;

export async function saveMessageSettingsAction(_prev: FormState<Key>, formData: FormData): Promise<FormState<Key>> {
  const hours = Number(formData.get("reminderHours"));
  if (!(REMINDER_HOUR_OPTIONS as readonly number[]).includes(hours)) return { errors: { reminderHours: "Listeden bir süre seç." } };

  const raw: Record<string, string> = {};
  const errors: FormState<Key>["errors"] = {};
  for (const key of Object.keys(TEMPLATES) as TemplateKey[]) {
    const v = formData.get(key)?.toString() ?? "";
    if (v.trim().length > TEMPLATE_MAX_LENGTH) errors[key] = `En fazla ${TEMPLATE_MAX_LENGTH} karakter olabilir.`;
    raw[key] = v;
  }
  if (Object.keys(errors).length > 0) return { errors };

  await withTrainer((tx, trainerId) =>
    tx
      .update(trainers)
      .set({
        remindersEnabled: formData.get("remindersEnabled") === "on",
        reminderHours: hours,
        renewalOffersEnabled: formData.get("renewalOffersEnabled") === "on",
        // An emptied box goes back to the default text.
        messageTemplates: cleanTemplates(raw),
      })
      .where(eq(trainers.id, trainerId)),
  );
  revalidatePath("/", "layout");
  return { savedAt: Date.now() };
}
