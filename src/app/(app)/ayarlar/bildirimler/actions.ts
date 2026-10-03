"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireOwner, withTrainer } from "@/db";
import { trainers } from "@/db/schema";
import { cleanPrefs, notifyPrefsSchema } from "@/lib/notify-prefs";

export async function saveTrainerPrefsAction(input: unknown): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireOwner();
  const parsed = notifyPrefsSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Tercihler kaydedilemedi." };
  const prefs = cleanPrefs("trainer", parsed.data);
  await withTrainer((tx, trainerId) => tx.update(trainers).set({ notifyPrefs: prefs }).where(eq(trainers.id, trainerId)));
  revalidatePath("/ayarlar/bildirimler");
  return { ok: true };
}
