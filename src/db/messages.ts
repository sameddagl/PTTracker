import "server-only";
import { and, asc, count, desc, eq, gte, isNull, sql } from "drizzle-orm";
import type { Tx } from "./index";
import { accountMembers, clients, messages } from "./schema";

// Trainer ↔ client chat, one thread per client. Trainer-side functions take a
// Tx from withTrainer() (RLS applies); portal-side functions take `who` from a
// resolved portal token and filter by both ids, since they run without RLS.

export const MESSAGE_MAX_LENGTH = 2000;
/** Portal senders: at most this many messages per window. */
export const CLIENT_RATE_LIMIT = { count: 20, minutes: 10 };

export type Message = {
  id: string;
  sender: "trainer" | "client";
  body: string;
  createdAt: Date;
  readAt: Date | null;
  /** Studios: first name of the team member who wrote a trainer-side message. */
  senderName?: string | null;
};
export type PortalWho = { trainerId: string; clientId: string };
export type SendResult =
  | { ok: true; message: Message; /** The other side had nothing unread from the last half hour: worth an email. */ firstUnread: boolean }
  | { ok: false; reason: "empty" | "too_long" | "not_found" | "rate_limited" };

const columns = { id: messages.id, sender: messages.sender, body: messages.body, createdAt: messages.createdAt, readAt: messages.readAt };

/** Trims and checks a message body; null when it is empty or too long. */
export function cleanBody(body: unknown): { ok: true; body: string } | { ok: false; reason: "empty" | "too_long" } {
  const text = typeof body === "string" ? body.replace(/\r\n/g, "\n").trim() : "";
  if (!text) return { ok: false, reason: "empty" };
  if ([...text].length > MESSAGE_MAX_LENGTH) return { ok: false, reason: "too_long" };
  return { ok: true, body: text };
}

const recentUnreadFrom = (tx: Tx, who: PortalWho, sender: Message["sender"]) =>
  tx
    .select({ n: count() })
    .from(messages)
    .where(
      and(
        eq(messages.trainerId, who.trainerId),
        eq(messages.clientId, who.clientId),
        eq(messages.sender, sender),
        isNull(messages.readAt),
        gte(messages.createdAt, sql`now() - interval '30 minutes'`),
      ),
    )
    .then(([r]) => r.n);

async function insertMessage(tx: Tx, who: PortalWho, sender: Message["sender"], body: string, senderMemberId: string | null = null): Promise<SendResult> {
  const firstUnread = (await recentUnreadFrom(tx, who, sender)) === 0;
  const [message] = await tx
    .insert(messages)
    .values({ trainerId: who.trainerId, clientId: who.clientId, sender, body, senderMemberId })
    .returning(columns);
  return { ok: true, message, firstUnread };
}

async function threadRows(tx: Tx, who: PortalWho, limit: number) {
  const rows = await tx
    .select({
      ...columns,
      // Names only matter when more than one person writes for the account.
      senderName: sql<string | null>`case when (select count(*) from ${accountMembers} m where m.account_id = ${who.trainerId} and m.active) > 1
        then split_part(${accountMembers.fullName}, ' ', 1) end`,
    })
    .from(messages)
    .leftJoin(accountMembers, eq(accountMembers.id, messages.senderMemberId))
    .where(and(eq(messages.trainerId, who.trainerId), eq(messages.clientId, who.clientId)))
    .orderBy(desc(messages.createdAt), desc(messages.id))
    .limit(limit);
  return rows.reverse();
}

async function markRead(tx: Tx, who: PortalWho, from: Message["sender"]) {
  const rows = await tx
    .update(messages)
    .set({ readAt: new Date() })
    .where(
      and(eq(messages.trainerId, who.trainerId), eq(messages.clientId, who.clientId), eq(messages.sender, from), isNull(messages.readAt)),
    )
    .returning({ id: messages.id });
  return rows.length;
}

// ---- Trainer side (withTrainer) ----

export type Thread = Awaited<ReturnType<typeof listThreads>>[number];

/** One row per client with messages, newest conversation first. */
export async function listThreads(tx: Tx, trainerId: string) {
  const last = await tx
    .selectDistinctOn([messages.clientId], {
      clientId: messages.clientId,
      fullName: clients.fullName,
      archived: sql<boolean>`${clients.archivedAt} is not null`,
      body: messages.body,
      sender: messages.sender,
      createdAt: messages.createdAt,
    })
    .from(messages)
    .innerJoin(clients, eq(clients.id, messages.clientId))
    .where(eq(messages.trainerId, trainerId))
    .orderBy(messages.clientId, desc(messages.createdAt), desc(messages.id));

  const unread = await tx
    .select({ clientId: messages.clientId, n: count() })
    .from(messages)
    .where(and(eq(messages.trainerId, trainerId), eq(messages.sender, "client"), isNull(messages.readAt)))
    .groupBy(messages.clientId);
  const unreadBy = new Map(unread.map((u) => [u.clientId, u.n]));

  return last
    .map((t) => ({ ...t, unread: unreadBy.get(t.clientId) ?? 0 }))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

/** The latest `limit` messages of a thread, oldest first. */
export function getThread(tx: Tx, trainerId: string, clientId: string, { limit = 200 }: { limit?: number } = {}) {
  return threadRows(tx, { trainerId, clientId }, limit);
}

/** Writes as the trainer. Only to the trainer's own, non-archived clients. */
export async function sendTrainerMessage(tx: Tx, trainerId: string, clientId: string, body: string, memberId: string | null = null): Promise<SendResult> {
  const clean = cleanBody(body);
  if (!clean.ok) return clean;
  const [client] = await tx
    .select({ id: clients.id })
    .from(clients)
    .where(and(eq(clients.id, clientId), eq(clients.trainerId, trainerId), isNull(clients.archivedAt)));
  if (!client) return { ok: false, reason: "not_found" };
  return insertMessage(tx, { trainerId, clientId }, "trainer", clean.body, memberId);
}

/** Marks the client's messages in this thread as seen by the trainer; returns how many changed. */
export function markThreadRead(tx: Tx, trainerId: string, clientId: string) {
  return markRead(tx, { trainerId, clientId }, "client");
}

/** Unread client messages across all threads (the nav badge). */
export async function countUnread(tx: Tx, trainerId: string) {
  const [row] = await tx
    .select({ n: count() })
    .from(messages)
    .where(and(eq(messages.trainerId, trainerId), eq(messages.sender, "client"), isNull(messages.readAt)));
  return row.n;
}

/** Active clients to start a conversation with, by name. */
export async function listMessageableClients(tx: Tx, trainerId: string) {
  return tx
    .select({ id: clients.id, fullName: clients.fullName })
    .from(clients)
    .where(and(eq(clients.trainerId, trainerId), eq(clients.status, "active"), isNull(clients.archivedAt)))
    .orderBy(asc(clients.fullName));
}

// ---- Portal side (adminDb, scoped by the token's ids) ----

export function getClientThread(tx: Tx, who: PortalWho, { limit = 200 }: { limit?: number } = {}) {
  return threadRows(tx, who, limit);
}

/** Writes as the client, at most CLIENT_RATE_LIMIT.count messages per window. */
export async function sendClientMessage(tx: Tx, who: PortalWho, body: string): Promise<SendResult> {
  const clean = cleanBody(body);
  if (!clean.ok) return clean;
  const [client] = await tx
    .select({ id: clients.id })
    .from(clients)
    .where(and(eq(clients.id, who.clientId), eq(clients.trainerId, who.trainerId), isNull(clients.archivedAt)));
  if (!client) return { ok: false, reason: "not_found" };

  const [recent] = await tx
    .select({ n: count() })
    .from(messages)
    .where(
      and(
        eq(messages.clientId, who.clientId),
        eq(messages.sender, "client"),
        gte(messages.createdAt, sql`now() - ${sql.raw(`interval '${CLIENT_RATE_LIMIT.minutes} minutes'`)}`),
      ),
    );
  if (recent.n >= CLIENT_RATE_LIMIT.count) return { ok: false, reason: "rate_limited" };
  return insertMessage(tx, who, "client", clean.body);
}

/** Marks the trainer's messages as seen by the client; returns how many changed. */
export function markReadByClient(tx: Tx, who: PortalWho) {
  return markRead(tx, who, "trainer");
}
