"use server";

import { getClaims } from "@/db";
import { deleteSubscription, saveSubscription } from "@/lib/push";
import { subscriptionSchema } from "@/lib/push-input";

export async function subscribeTrainerAction(input: unknown): Promise<{ ok: true } | { ok: false; error: string }> {
  const claims = await getClaims();
  const sub = subscriptionSchema.safeParse(input);
  if (!claims?.sub || !sub.success) return { ok: false, error: "Bildirim kaydedilemedi." };
  await saveSubscription({ trainerId: claims.sub, clientId: null }, sub.data);
  return { ok: true };
}

export async function unsubscribeTrainerAction(endpoint: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const claims = await getClaims();
  if (!claims?.sub) return { ok: false, error: "Oturumun kapanmış. Tekrar giriş yap." };
  await deleteSubscription({ trainerId: claims.sub, clientId: null }, endpoint);
  return { ok: true };
}
