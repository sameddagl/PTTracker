import "server-only";
import { and, eq, inArray, isNull } from "drizzle-orm";
import webpush from "web-push";
import { adminDb } from "@/db";
import { pushSubscriptions } from "@/db/schema";

// Web Push to installed devices. Delivery is best-effort: a failed push never
// fails the action that caused it, and subscriptions the push service reports
// as gone (404/410) are deleted.

export type PushPayload = { title: string; body: string; url: string; tag?: string };

const { NEXT_PUBLIC_VAPID_PUBLIC_KEY: publicKey, VAPID_PRIVATE_KEY: privateKey, VAPID_SUBJECT: subject } = process.env;
const configured = Boolean(publicKey && privateKey);
if (configured) webpush.setVapidDetails(subject ?? "mailto:destek@studyom.app", publicKey!, privateKey!);

/** A trainer's own devices (`clientId` null) or one client's devices. */
export type PushTarget = { trainerId: string; clientId: string | null };

export async function sendPush(target: PushTarget, payload: PushPayload): Promise<number> {
  if (!configured) {
    console.info("[push] not configured, skipped", payload.title);
    return 0;
  }
  const subs = await adminDb
    .select()
    .from(pushSubscriptions)
    .where(
      and(
        eq(pushSubscriptions.trainerId, target.trainerId),
        target.clientId ? eq(pushSubscriptions.clientId, target.clientId) : isNull(pushSubscriptions.clientId),
      ),
    );
  const gone: string[] = [];
  let sent = 0;
  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          JSON.stringify(payload),
          { TTL: 60 * 60 * 24 },
        );
        sent++;
      } catch (e) {
        const status = (e as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) gone.push(s.id);
        else console.error("[push] failed", { status });
      }
    }),
  );
  if (gone.length > 0) await adminDb.delete(pushSubscriptions).where(inArray(pushSubscriptions.id, gone));
  return sent;
}

export type SubscriptionInput = { endpoint: string; keys: { p256dh: string; auth: string } };

/** Stores (or moves) a device subscription. The endpoint is unique per browser install. */
export async function saveSubscription(target: PushTarget, sub: SubscriptionInput) {
  await adminDb
    .insert(pushSubscriptions)
    .values({ ...target, endpoint: sub.endpoint, p256dh: sub.keys.p256dh, auth: sub.keys.auth })
    .onConflictDoUpdate({
      target: pushSubscriptions.endpoint,
      set: { trainerId: target.trainerId, clientId: target.clientId, p256dh: sub.keys.p256dh, auth: sub.keys.auth },
    });
}

/** Removes a device, only if it belongs to `target` (an endpoint alone proves nothing). */
export async function deleteSubscription(target: PushTarget, endpoint: string) {
  await adminDb
    .delete(pushSubscriptions)
    .where(
      and(
        eq(pushSubscriptions.endpoint, endpoint),
        eq(pushSubscriptions.trainerId, target.trainerId),
        target.clientId ? eq(pushSubscriptions.clientId, target.clientId) : isNull(pushSubscriptions.clientId),
      ),
    );
}
