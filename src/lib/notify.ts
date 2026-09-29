import "server-only";
import { eq } from "drizzle-orm";
import { authUsers } from "drizzle-orm/supabase";
import { adminDb, type Tx } from "@/db";
import { getActivePortalTokens } from "@/db/portal";
import { clients } from "@/db/schema";
import { siteUrl } from "./config";
import { layout, sendMail } from "./mail";
import { portalUrl } from "./portal";
import { sendPush } from "./push";

// One place for "tell the trainer" / "tell the client": push to their devices
// first; e-mail only as a fallback where noted, so nobody gets both.

/** Push to the trainer's devices. `path` is an in-app path such as "/danisanlar/basvurular". */
export async function pushTrainer(trainerId: string, title: string, body: string, path: string, tag?: string) {
  return sendPush({ trainerId, clientId: null }, { title, body, url: path, tag });
}

/** The client's portal URL (with an optional #hash), or null without an active link. */
export async function clientPortalUrl(clientId: string, hash = "") {
  const tokens = await getActivePortalTokens(adminDb as unknown as Tx, [clientId]);
  const token = tokens.get(clientId);
  return token ? `${portalUrl(token)}${hash}` : null;
}

/**
 * Tells a client something: push to their devices; if none received it and
 * `email` is given, e-mail them instead. Returns how it went out.
 */
export async function notifyClient(
  target: { trainerId: string; clientId: string },
  msg: { title: string; body: string; hash?: string; tag?: string; email?: { subject: string; heading: string; lines: string[]; cta: string } },
): Promise<"push" | "email" | "none"> {
  const url = await clientPortalUrl(target.clientId, msg.hash);
  if (!url) return "none";
  const pushed = await sendPush(target, { title: msg.title, body: msg.body, url, tag: msg.tag });
  if (pushed > 0) return "push";
  if (!msg.email) return "none";
  const [c] = await adminDb.select({ email: clients.email }).from(clients).where(eq(clients.id, target.clientId));
  if (!c?.email) return "none";
  const { html, text } = layout({ heading: msg.email.heading, lines: msg.email.lines, cta: { label: msg.email.cta, url } });
  return (await sendMail({ to: c.email, subject: msg.email.subject, html, text })) ? "email" : "none";
}

/** The trainer's login e-mail, for e-mails sent on their behalf. */
export async function trainerEmail(trainerId: string) {
  const [u] = await adminDb.select({ email: authUsers.email }).from(authUsers).where(eq(authUsers.id, trainerId));
  return u?.email ?? null;
}

export const appUrl = (path: string) => `${siteUrl()}${path}`;
