"use server";

import { getClaims, withTrainer } from "@/db";
import { deleteSubscription, saveSubscription } from "@/lib/push";
import { subscriptionSchema } from "@/lib/push-input";

export async function subscribeTrainerAction(input: unknown): Promise<{ ok: true } | { ok: false; error: string }> {
  const sub = subscriptionSchema.safeParse(input);
  if (!sub.success) return { ok: false, error: "Bildirim kaydedilemedi." };
  // The device belongs to this member in the account they work in.
  const member = await withTrainer(async (_tx, _id, m) => m);
  await saveSubscription({ trainerId: member.accountId, clientId: null, memberId: member.id }, sub.data);
  return { ok: true };
}

export async function unsubscribeTrainerAction(endpoint: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const claims = await getClaims();
  if (!claims?.sub) return { ok: false, error: "Oturumun kapanmış. Tekrar giriş yap." };
  const member = await withTrainer(async (_tx, _id, m) => m);
  await deleteSubscription({ trainerId: member.accountId, clientId: null }, endpoint);
  return { ok: true };
}
