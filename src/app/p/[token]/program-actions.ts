"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { adminDb, type Tx } from "@/db";
import { setCheckin } from "@/db/programs";
import { trainers } from "@/db/schema";
import { todayISO } from "@/lib/format";
import { resolvePortalToken } from "@/lib/portal";

/** "Bugünkü antrenmanı yaptım" (or undo) on the client's Programım tab. */
export async function setCheckinAction(token: string, dayId: string, done: boolean): Promise<{ ok: boolean }> {
  const who = await resolvePortalToken(token);
  if (!who || !z.uuid().safeParse(dayId).success) return { ok: false };
  const [t] = await adminDb.select({ tz: trainers.timezone }).from(trainers).where(eq(trainers.id, who.trainerId));
  const ok = await adminDb.transaction((tx) => setCheckin(tx as unknown as Tx, who, dayId, todayISO(t?.tz ?? "Europe/Istanbul"), Boolean(done)));
  if (ok) revalidatePath(`/p/${token}`);
  return { ok };
}
