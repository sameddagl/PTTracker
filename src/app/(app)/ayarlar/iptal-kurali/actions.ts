"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { withTrainer } from "@/db";
import { trainers } from "@/db/schema";
import type { FormState } from "@/lib/forms";
import { LATE_CANCEL_OPTIONS } from "./options";

const schema = z.coerce
  .number()
  .int()
  .refine((h) => (LATE_CANCEL_OPTIONS as readonly number[]).includes(h), "Listeden bir süre seç.");

export async function saveLateCancelAction(_prev: FormState<"lateCancelHours">, formData: FormData): Promise<FormState<"lateCancelHours">> {
  const parsed = schema.safeParse(formData.get("lateCancelHours"));
  if (!parsed.success) return { errors: { lateCancelHours: parsed.error.issues[0].message } };
  await withTrainer((tx, trainerId) => tx.update(trainers).set({ lateCancelHours: parsed.data }).where(eq(trainers.id, trainerId)));
  // Portals, Bugün and the help page all quote the rule.
  revalidatePath("/", "layout");
  return { savedAt: Date.now() };
}
