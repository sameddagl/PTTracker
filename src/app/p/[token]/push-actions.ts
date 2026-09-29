"use server";

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
