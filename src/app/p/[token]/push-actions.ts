"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { adminDb } from "@/db";
import { clients } from "@/db/schema";
import { cleanPrefs, notifyPrefsSchema } from "@/lib/notify-prefs";
import { resolvePortalToken } from "@/lib/portal";
import { deleteSubscription, saveSubscription } from "@/lib/push";
import { subscriptionSchema } from "@/lib/push-input";

export async function subscribeClientAction(token: string, input: unknown): Promise<{ ok: true } | { ok: false; error: string }> {
  const link = await resolvePortalToken(token);
  const sub = subscriptionSchema.safeParse(input);
  if (!link || !sub.success) return { ok: false, error: "Bildirim kaydedilemedi." };
  await saveSubscription(link, sub.data);
  return { ok: true };
}

export async function unsubscribeClientAction(token: string, endpoint: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const link = await resolvePortalToken(token);
  if (!link) return { ok: false, error: "Geçersiz link." };
  await deleteSubscription(link, endpoint);
  return { ok: true };
}

export async function saveClientPrefsAction(token: string, input: unknown): Promise<{ ok: true } | { ok: false; error: string }> {
  const link = await resolvePortalToken(token);
  const parsed = notifyPrefsSchema.safeParse(input);
  if (!link || !parsed.success) return { ok: false, error: "Tercihler kaydedilemedi." };
  await adminDb
    .update(clients)
    .set({ notifyPrefs: cleanPrefs("client", parsed.data) })
    .where(and(eq(clients.id, link.clientId), eq(clients.trainerId, link.trainerId)));
  revalidatePath(`/p/${token}`);
  return { ok: true };
}
