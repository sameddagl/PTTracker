import "server-only";
import { and, asc, desc, eq, gt, isNull, sql } from "drizzle-orm";
import type { Tx } from "./index";
import type { Message } from "./messages";
import { supportMessages, supportThreads, trainers } from "./schema";

// Messages to the Stüdyom team. Landing threads come from the contact form
// (owner connection); a trainer's thread lives under RLS (withTrainer); the
// /yonetim side reads and answers everything as owner.

export const SUPPORT_MAX_LENGTH = 4000;
/** Contact-form threads one e-mail address may open per day. */
export const LANDING_DAILY_LIMIT = 3;

export function cleanSupportBody(body: unknown) {
  if (typeof body !== "string") return null;
  const t = body.trim();
  return t.length >= 1 && t.length <= SUPPORT_MAX_LENGTH ? t : null;
}

// ---- Landing contact form ----

export async function createLandingThread(tx: Tx, input: { name: string; email: string; phone: string | null; body: string }) {
  const [{ n }] = await tx
    .select({ n: sql<number>`count(*)::int` })
    .from(supportThreads)
    .where(and(eq(supportThreads.source, "landing"), sql`lower(${supportThreads.email}) = lower(${input.email})`, gt(supportThreads.createdAt, sql`now() - interval '1 day'`)));
  if (n >= LANDING_DAILY_LIMIT) return { ok: false as const, reason: "rate_limited" as const };
  const [thread] = await tx
    .insert(supportThreads)
    .values({ source: "landing", name: input.name, email: input.email, phone: input.phone })
    .returning({ id: supportThreads.id });
  await tx.insert(supportMessages).values({ threadId: thread.id, trainerId: null, sender: "user", body: input.body });
  return { ok: true as const, id: thread.id };
}

// ---- A trainer's thread (RLS) ----

/** The trainer's side as chat messages: theirs are "trainer", ours are "client". */
const asChat = (rows: { id: string; sender: "user" | "admin"; body: string; createdAt: Date; readAt: Date | null }[]): Message[] =>
  rows.map((r) => ({ id: r.id, sender: r.sender === "user" ? "trainer" : "client", body: r.body, createdAt: r.createdAt, readAt: r.readAt }));

export async function trainerSupportMessages(tx: Tx, trainerId: string): Promise<Message[]> {
  const rows = await tx
    .select({ id: supportMessages.id, sender: supportMessages.sender, body: supportMessages.body, createdAt: supportMessages.createdAt, readAt: supportMessages.readAt })
    .from(supportMessages)
    .where(eq(supportMessages.trainerId, trainerId))
    .orderBy(asc(supportMessages.createdAt));
  return asChat(rows);
}

export async function sendTrainerSupport(tx: Tx, trainerId: string, body: string): Promise<{ message: Message; threadId: string }> {
  let [thread] = await tx.select({ id: supportThreads.id }).from(supportThreads).where(eq(supportThreads.trainerId, trainerId));
  if (!thread) {
    const [t] = await tx.select({ fullName: trainers.fullName, businessName: trainers.businessName }).from(trainers).where(eq(trainers.id, trainerId));
    [thread] = await tx
      .insert(supportThreads)
      .values({ trainerId, source: "app", name: (t?.businessName || t?.fullName || "Eğitmen").slice(0, 120) })
      .returning({ id: supportThreads.id });
  }
  const [row] = await tx
    .insert(supportMessages)
    .values({ threadId: thread.id, trainerId, sender: "user", body })
    .returning({ id: supportMessages.id, sender: supportMessages.sender, body: supportMessages.body, createdAt: supportMessages.createdAt, readAt: supportMessages.readAt });
  await tx.update(supportThreads).set({ lastMessageAt: new Date(), closedAt: null }).where(eq(supportThreads.id, thread.id));
  return { message: asChat([row])[0], threadId: thread.id };
}

/** Our replies the trainer has now seen. */
export async function markSupportReadByTrainer(tx: Tx, trainerId: string) {
  const rows = await tx
    .update(supportMessages)
    .set({ readAt: new Date() })
    .where(and(eq(supportMessages.trainerId, trainerId), eq(supportMessages.sender, "admin"), isNull(supportMessages.readAt)))
    .returning({ id: supportMessages.id });
  return rows.length;
}

export async function countUnreadSupport(tx: Tx, trainerId: string) {
  const [row] = await tx
    .select({ n: sql<number>`count(*)::int` })
    .from(supportMessages)
    .where(and(eq(supportMessages.trainerId, trainerId), eq(supportMessages.sender, "admin"), isNull(supportMessages.readAt)));
  return row?.n ?? 0;
}

// ---- /yonetim (owner) ----

export async function adminThreads(tx: Tx) {
  return tx
    .select({
      id: supportThreads.id,
      source: supportThreads.source,
      name: supportThreads.name,
      email: sql<string | null>`coalesce(${supportThreads.email}, (select u.email from auth.users u where u.id = ${supportThreads.trainerId}))`,
      closedAt: supportThreads.closedAt,
      lastMessageAt: supportThreads.lastMessageAt,
      unread: sql<number>`(select count(*)::int from ${supportMessages} m where m.thread_id = "support_threads"."id" and m.sender = 'user' and m.read_at is null)`,
      preview: sql<string>`(select m.body from ${supportMessages} m where m.thread_id = "support_threads"."id" order by m.created_at desc limit 1)`,
    })
    .from(supportThreads)
    .orderBy(desc(supportThreads.lastMessageAt))
    .limit(200);
}

export async function countUnreadForAdmin(tx: Tx) {
  const [row] = await tx
    .select({ n: sql<number>`count(*)::int` })
    .from(supportMessages)
    .where(and(eq(supportMessages.sender, "user"), isNull(supportMessages.readAt)));
  return row?.n ?? 0;
}

export async function adminThread(tx: Tx, id: string) {
  const [thread] = await tx
    .select({
      id: supportThreads.id,
      source: supportThreads.source,
      trainerId: supportThreads.trainerId,
      name: supportThreads.name,
      email: sql<string | null>`coalesce(${supportThreads.email}, (select u.email from auth.users u where u.id = ${supportThreads.trainerId}))`,
      phone: supportThreads.phone,
      closedAt: supportThreads.closedAt,
      createdAt: supportThreads.createdAt,
    })
    .from(supportThreads)
    .where(eq(supportThreads.id, id));
  if (!thread) return null;
  const messages = await tx
    .select({ id: supportMessages.id, sender: supportMessages.sender, body: supportMessages.body, createdAt: supportMessages.createdAt, readAt: supportMessages.readAt })
    .from(supportMessages)
    .where(eq(supportMessages.threadId, id))
    .orderBy(asc(supportMessages.createdAt));
  return { thread, messages };
}

export async function markSupportReadByAdmin(tx: Tx, threadId: string) {
  await tx
    .update(supportMessages)
    .set({ readAt: new Date() })
    .where(and(eq(supportMessages.threadId, threadId), eq(supportMessages.sender, "user"), isNull(supportMessages.readAt)));
}

export async function addAdminReply(tx: Tx, threadId: string, body: string) {
  const [thread] = await tx.select({ trainerId: supportThreads.trainerId }).from(supportThreads).where(eq(supportThreads.id, threadId));
  if (!thread) return null;
  await tx.insert(supportMessages).values({ threadId, trainerId: thread.trainerId, sender: "admin", body });
  await tx.update(supportThreads).set({ lastMessageAt: new Date() }).where(eq(supportThreads.id, threadId));
  return thread;
}

export async function setThreadClosed(tx: Tx, threadId: string, closed: boolean) {
  await tx.update(supportThreads).set({ closedAt: closed ? new Date() : null }).where(eq(supportThreads.id, threadId));
}
