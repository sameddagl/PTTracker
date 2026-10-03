import "server-only";
import { randomBytes } from "node:crypto";
import { and, asc, desc, eq, gt, isNull, sql } from "drizzle-orm";
import { authUsers } from "drizzle-orm/supabase";
import { INVITE_DAYS, INVITE_TOKEN_PATTERN, nextTeamColor, type TeamColor } from "@/lib/team";
import { adminDb, type Tx } from "./client";
import type { Member } from "./membership";
import { hashToken } from "./portal";
import { accountInvites, accountMembers, lessonAttendees, lessons, trainers, type PayRule } from "./schema";

// A studio's team: its members (the owner and invited instructors) and the
// invitations still open. Everything with `tx` runs under RLS in the current
// account; the invite lookup and acceptance run signed-out or across accounts,
// so they use the owner connection and check the token themselves.

export type TeamMember = {
  id: string;
  /** Null once the person deleted their login. */
  userId: string | null;
  role: Member["role"];
  fullName: string;
  bio: string | null;
  photoPath: string | null;
  color: string | null;
  payRule: PayRule | null;
  active: boolean;
};

const memberCols = {
  id: accountMembers.id,
  userId: accountMembers.userId,
  role: accountMembers.role,
  fullName: accountMembers.fullName,
  bio: accountMembers.bio,
  photoPath: accountMembers.photoPath,
  color: accountMembers.color,
  payRule: accountMembers.payRule,
  active: accountMembers.active,
};

/** The account's members, owner first, then by the order they joined. */
export async function listMembers(tx: Tx, accountId: string, { includeInactive = false } = {}): Promise<TeamMember[]> {
  return tx
    .select(memberCols)
    .from(accountMembers)
    .where(and(eq(accountMembers.accountId, accountId), includeInactive ? undefined : eq(accountMembers.active, true)))
    .orderBy(sql`${accountMembers.role} = 'owner' desc`, asc(accountMembers.createdAt));
}

/** True once someone besides the owner works in the account: the studio parts of the UI turn on. */
export async function isStudio(tx: Tx, accountId: string) {
  const [row] = await tx
    .select({ n: sql<number>`count(*)::int` })
    .from(accountMembers)
    .where(and(eq(accountMembers.accountId, accountId), eq(accountMembers.active, true)));
  return (row?.n ?? 0) > 1;
}

export async function getMemberRow(tx: Tx, accountId: string, id: string) {
  const [row] = await tx
    .select(memberCols)
    .from(accountMembers)
    .where(and(eq(accountMembers.id, id), eq(accountMembers.accountId, accountId)));
  return row ?? null;
}

// ---- Invitations ----

export type InviteInput = { email: string; fullName: string; color: TeamColor | null };

export type InviteResult = { ok: true; token: string; id: string } | { ok: false; reason: "member" | "pending" };

/**
 * Creates an invitation and returns the token for the e-mail link. Refuses if
 * the address already belongs to an active member or has an open invitation.
 */
export async function createInvite(tx: Tx, accountId: string, input: InviteInput): Promise<InviteResult> {
  const email = input.email.trim().toLowerCase();
  // auth.users isn't readable under RLS; the account id was resolved by withTrainer.
  const [existing] = await adminDb
    .select({ id: accountMembers.id })
    .from(accountMembers)
    .innerJoin(authUsers, eq(authUsers.id, accountMembers.userId))
    .where(and(eq(accountMembers.accountId, accountId), eq(accountMembers.active, true), sql`lower(${authUsers.email}) = ${email}`));
  if (existing) return { ok: false, reason: "member" };
  const [open] = await tx
    .select({ id: accountInvites.id })
    .from(accountInvites)
    .where(and(eq(accountInvites.accountId, accountId), eq(accountInvites.email, email), ...openInvite()));
  if (open) return { ok: false, reason: "pending" };

  const color = input.color ?? nextTeamColor((await listMembers(tx, accountId)).map((m) => m.color));
  const token = randomBytes(24).toString("base64url");
  const [row] = await tx
    .insert(accountInvites)
    .values({
      accountId,
      email,
      fullName: input.fullName.trim(),
      color,
      tokenHash: hashToken(token),
      expiresAt: sql`now() + make_interval(days => ${INVITE_DAYS})`,
    })
    .returning({ id: accountInvites.id });
  return { ok: true, token, id: row.id };
}

const openInvite = () => [isNull(accountInvites.acceptedAt), isNull(accountInvites.revokedAt), gt(accountInvites.expiresAt, sql`now()`)];

export async function listOpenInvites(tx: Tx, accountId: string) {
  return tx
    .select({ id: accountInvites.id, email: accountInvites.email, fullName: accountInvites.fullName, expiresAt: accountInvites.expiresAt })
    .from(accountInvites)
    .where(and(eq(accountInvites.accountId, accountId), ...openInvite()))
    .orderBy(desc(accountInvites.createdAt));
}

/** Sends the same person a fresh link: the old one stops working. */
export async function renewInvite(tx: Tx, accountId: string, id: string) {
  const token = randomBytes(24).toString("base64url");
  const [row] = await tx
    .update(accountInvites)
    .set({ tokenHash: hashToken(token), expiresAt: sql`now() + make_interval(days => ${INVITE_DAYS})` })
    .where(and(eq(accountInvites.id, id), eq(accountInvites.accountId, accountId), isNull(accountInvites.acceptedAt), isNull(accountInvites.revokedAt)))
    .returning({ email: accountInvites.email, fullName: accountInvites.fullName });
  return row ? { ...row, token } : null;
}

export async function revokeInvite(tx: Tx, accountId: string, id: string) {
  const rows = await tx
    .update(accountInvites)
    .set({ revokedAt: new Date() })
    .where(and(eq(accountInvites.id, id), eq(accountInvites.accountId, accountId), isNull(accountInvites.acceptedAt)))
    .returning({ id: accountInvites.id });
  return rows.length > 0;
}

/** An open invitation by its link token, with the studio's name. Signed-out safe. */
export async function inviteByToken(token: string) {
  if (!INVITE_TOKEN_PATTERN.test(token)) return null;
  const [row] = await adminDb
    .select({
      id: accountInvites.id,
      accountId: accountInvites.accountId,
      email: accountInvites.email,
      fullName: accountInvites.fullName,
      color: accountInvites.color,
      studio: sql<string>`coalesce(nullif(${trainers.businessName}, ''), ${trainers.fullName})`,
    })
    .from(accountInvites)
    .innerJoin(trainers, eq(trainers.id, accountInvites.accountId))
    .where(and(eq(accountInvites.tokenHash, hashToken(token)), ...openInvite()));
  return row ?? null;
}

export type AcceptResult = { ok: true; accountId: string } | { ok: false; reason: "invalid" | "email" | "owner" };

/**
 * Joins the signed-in user to the inviting account as an instructor. The
 * invitation is for one e-mail address; someone signed in with another one is
 * told to switch. A former member is reactivated.
 */
export async function acceptInvite(token: string, user: { id: string; email: string | null }): Promise<AcceptResult> {
  return adminDb.transaction(async (tx) => {
    const invite = await inviteByToken(token);
    if (!invite) return { ok: false, reason: "invalid" } as const;
    if ((user.email ?? "").toLowerCase() !== invite.email) return { ok: false, reason: "email" } as const;
    if (invite.accountId === user.id) return { ok: false, reason: "owner" } as const;
    await tx
      .insert(accountMembers)
      .values({ accountId: invite.accountId, userId: user.id, role: "instructor", fullName: invite.fullName, color: invite.color })
      .onConflictDoUpdate({ target: [accountMembers.accountId, accountMembers.userId], set: { active: true, updatedAt: new Date() } });
    await tx.update(accountInvites).set({ acceptedAt: new Date() }).where(eq(accountInvites.id, invite.id));
    return { ok: true, accountId: invite.accountId } as const;
  });
}

// ---- Members ----

/** Owner: colour and pay rule of a member. */
export async function updateMember(tx: Tx, accountId: string, id: string, patch: { color?: TeamColor; payRule?: PayRule | null }) {
  const rows = await tx
    .update(accountMembers)
    .set({ ...patch, updatedAt: new Date() })
    .where(and(eq(accountMembers.id, id), eq(accountMembers.accountId, accountId)))
    .returning({ id: accountMembers.id });
  return rows.length > 0;
}

/** Owner: removes (or brings back) an instructor. The owner can't be removed. */
export async function setMemberActive(tx: Tx, accountId: string, id: string, active: boolean) {
  const rows = await tx
    .update(accountMembers)
    .set({ active, updatedAt: new Date() })
    .where(and(eq(accountMembers.id, id), eq(accountMembers.accountId, accountId), eq(accountMembers.role, "instructor")))
    .returning({ id: accountMembers.id });
  return rows.length > 0;
}

/** A member's own profile (name, bio, photo). */
export async function updateOwnProfile(tx: Tx, member: Member, patch: { fullName?: string; bio?: string | null; photoPath?: string | null }) {
  await tx
    .update(accountMembers)
    .set({ ...patch, updatedAt: new Date() })
    .where(and(eq(accountMembers.id, member.id), eq(accountMembers.accountId, member.accountId)));
}

/** Accounts the user belongs to and has set up, for the account switcher. */
export async function myAccounts(userId: string) {
  return adminDb
    .select({
      accountId: accountMembers.accountId,
      role: accountMembers.role,
      name: sql<string>`coalesce(nullif(${trainers.businessName}, ''), ${trainers.fullName})`,
    })
    .from(accountMembers)
    .innerJoin(trainers, eq(trainers.id, accountMembers.accountId))
    .where(and(eq(accountMembers.userId, userId), eq(accountMembers.active, true), sql`${trainers.onboardedAt} is not null`))
    .orderBy(asc(accountMembers.createdAt));
}

/**
 * Who teaches a lesson being planned: an instructor always plans their own;
 * the owner may pick any active member (themselves by default).
 */
export async function resolveInstructor(tx: Tx, member: Member, requested: string | null | undefined) {
  if (member.role !== "owner" || !requested || requested === member.id) return member.id;
  const row = await getMemberRow(tx, member.accountId, requested);
  return row?.active ? row.id : member.id;
}

/** The owner manages every lesson; an instructor only the ones they teach. */
export async function mayManageLesson(tx: Tx, member: Member, lessonId: string) {
  if (member.role === "owner") return true;
  const [row] = await tx.select({ instructorId: lessons.instructorId }).from(lessons).where(and(eq(lessons.id, lessonId), eq(lessons.trainerId, member.accountId)));
  return row?.instructorId === member.id;
}

/** Same rule, by a place in a lesson (attendance, notes). */
export async function mayManageAttendee(tx: Tx, member: Member, attendeeId: string) {
  if (member.role === "owner") return true;
  const [row] = await tx
    .select({ instructorId: lessons.instructorId })
    .from(lessonAttendees)
    .innerJoin(lessons, eq(lessons.id, lessonAttendees.lessonId))
    .where(and(eq(lessonAttendees.id, attendeeId), eq(lessonAttendees.trainerId, member.accountId)));
  return row?.instructorId === member.id;
}

export async function lessonInstructorId(tx: Tx, accountId: string, lessonId: string) {
  const [row] = await tx.select({ id: lessons.instructorId }).from(lessons).where(and(eq(lessons.id, lessonId), eq(lessons.trainerId, accountId)));
  return row?.id ?? null;
}

/** Clients an instructor has taught or will teach (any lesson, not cancelled). */
export async function clientIdsTaughtBy(tx: Tx, accountId: string, memberId: string) {
  const rows = await tx
    .selectDistinct({ id: lessonAttendees.clientId })
    .from(lessonAttendees)
    .innerJoin(lessons, eq(lessons.id, lessonAttendees.lessonId))
    .where(and(eq(lessons.trainerId, accountId), eq(lessons.instructorId, memberId), sql`${lessonAttendees.status} <> 'cancelled'`));
  return new Set(rows.map((r) => r.id));
}

/**
 * Whether a member may open a client: the owner always; an instructor if they
 * teach the client or the studio lets instructors see everyone.
 */
export async function mayOpenClient(tx: Tx, member: Member, clientId: string) {
  if (member.role === "owner") return true;
  const [t] = await tx.select({ all: trainers.instructorsSeeAllClients }).from(trainers).where(eq(trainers.id, member.accountId));
  return Boolean(t?.all) || (await clientIdsTaughtBy(tx, member.accountId, member.id)).has(clientId);
}
