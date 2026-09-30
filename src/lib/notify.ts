import "server-only";
import { eq } from "drizzle-orm";
import { authUsers } from "drizzle-orm/supabase";
import { adminDb, type Tx } from "@/db";
import { getActivePortalTokens } from "@/db/portal";
import { clients, trainers } from "@/db/schema";
import { siteUrl } from "./config";
import { layout, sendMail } from "./mail";
import { clientWants, trainerWants, type ClientKind, type TrainerKind } from "./notify-prefs";
import { portalUrl } from "./portal";
import { sendPush } from "./push";

// One place for "tell the trainer" / "tell the client". Each message has a
// kind; the recipient's choices (src/lib/notify-prefs.ts) decide whether it
// goes out as push, e-mail, both or not at all. Mails that must always arrive
// (a client's personal link after sign-up or approval) are sent directly with
// sendMail by their callers instead.

type EmailContent = { subject: string; heading: string; lines: string[]; cta: string };

/** Tells the trainer something. `path` is an in-app path such as "/danisanlar/basvurular". */
export async function notifyTrainer(
  trainerId: string,
  kind: TrainerKind,
  msg: { title: string; body: string; path: string; tag?: string; email?: EmailContent },
) {
  const [t] = await adminDb.select({ prefs: trainers.notifyPrefs }).from(trainers).where(eq(trainers.id, trainerId));
  if (!t) return;
  if (trainerWants(t.prefs, kind, "push")) await sendPush({ trainerId, clientId: null }, { title: msg.title, body: msg.body, url: msg.path, tag: msg.tag });
  if (msg.email && trainerWants(t.prefs, kind, "email")) {
    const to = await trainerEmail(trainerId);
    if (!to) return;
    const { html, text } = layout({ heading: msg.email.heading, lines: msg.email.lines, cta: { label: msg.email.cta, url: appUrl(msg.path) } });
    await sendMail({ to, subject: msg.email.subject, html, text });
  }
}

/** The client's portal URL (with an optional #hash), or null without an active link. */
export async function clientPortalUrl(clientId: string, hash = "") {
  const tokens = await getActivePortalTokens(adminDb as unknown as Tx, [clientId]);
  const token = tokens.get(clientId);
  return token ? `${portalUrl(token)}${hash}` : null;
}

/** Tells a client something, on the channels they chose. Nothing goes out without an active portal link. */
export async function notifyClient(
  target: { trainerId: string; clientId: string },
  kind: ClientKind,
  msg: { title: string; body: string; hash?: string; tag?: string; email?: EmailContent },
): Promise<{ push: number; email: boolean }> {
  const sent = { push: 0, email: false };
  const [c] = await adminDb
    .select({ email: clients.email, prefs: clients.notifyPrefs })
    .from(clients)
    .where(eq(clients.id, target.clientId));
  if (!c) return sent;
  const url = await clientPortalUrl(target.clientId, msg.hash);
  if (!url) return sent;
  if (clientWants(c.prefs, kind, "push")) sent.push = await sendPush(target, { title: msg.title, body: msg.body, url, tag: msg.tag });
  if (msg.email && c.email && clientWants(c.prefs, kind, "email")) {
    const { html, text } = layout({ heading: msg.email.heading, lines: msg.email.lines, cta: { label: msg.email.cta, url } });
    sent.email = await sendMail({ to: c.email, subject: msg.email.subject, html, text });
  }
  return sent;
}

/** The trainer's login e-mail, for e-mails sent on their behalf. */
export async function trainerEmail(trainerId: string) {
  const [u] = await adminDb.select({ email: authUsers.email }).from(authUsers).where(eq(authUsers.id, trainerId));
  return u?.email ?? null;
}

export const appUrl = (path: string) => `${siteUrl()}${path}`;
