import "server-only";
import { and, asc, eq, gt, gte, inArray, isNull, lt, or, sql } from "drizzle-orm";
import { addDays, recurringDates } from "@/lib/dates";
import { todayISO } from "@/lib/format";
import type { Tx } from "./index";
import { pickPackage } from "./packages";
import { clientPackageBalances, clientPackages, clients, groupClasses, groupClassMembers, lessonAttendees, lessons, trainers } from "./schema";

// Group classes: a weekly class with a number of places. Occurrences are
// created as lessons GROUP_HORIZON_DAYS ahead whenever a group screen, the
// calendar or a portal is opened, and fixed members are placed into them.

export const GROUP_HORIZON_DAYS = 28;

type TrainerRef = { id: string; timezone: string };
export type JoinMode = (typeof groupClasses.$inferSelect)["joinMode"];

export const JOIN_MODE_LABELS: Record<JoinMode, string> = {
  drop_in: "Derse tek tek katılım",
  fixed: "Sabit yer",
  both: "Sabit yer + boş yerlere katılım",
};

/** Attendance that holds a place: booked, came, or didn't show. Cancels free it. */
const HOLDS_PLACE = ["scheduled", "attended", "no_show"] as const;

const localToTs = (date: string, time: string, tz: string) => sql`((${date}::date + ${time}::time) at time zone ${tz})`;

// Written out: in a single-table select Drizzle leaves ${lessons.id} unqualified,
// which inside this subquery would bind to la.id.
const takenCount = sql<number>`(select count(*)::int from ${lessonAttendees} la
  where la.lesson_id = "lessons"."id" and la.status in ('scheduled', 'attended', 'no_show'))`;

const liveClass = (today: string) => or(isNull(groupClasses.endsOn), gte(groupClasses.endsOn, today));

/**
 * Creates missing occurrences of the trainer's live classes up to the
 * horizon, places fixed members into upcoming ones that have room, and gives
 * package-less group bookings a package once one has credit. Idempotent.
 */
export async function ensureGroupOccurrences(tx: Tx, trainer: TrainerRef, { classId }: { classId?: string } = {}) {
  const today = todayISO(trainer.timezone);
  const until = addDays(today, GROUP_HORIZON_DAYS - 1);
  const classes = await tx
    .select()
    .from(groupClasses)
    .where(and(eq(groupClasses.trainerId, trainer.id), liveClass(today), classId ? eq(groupClasses.id, classId) : undefined));
  if (classes.length === 0) return;

  for (const c of classes) {
    const from = c.startsOn > today ? c.startsOn : today;
    const to = c.endsOn && c.endsOn < until ? c.endsOn : until;
    if (from > to) continue;
    const dates = recurringDates(from, to, c.weekdays);
    if (dates.length === 0) continue;
    await tx
      .insert(lessons)
      .values(
        dates.map((d) => {
          const startsAt = localToTs(d, c.startTime, trainer.timezone);
          return {
            trainerId: trainer.id,
            groupClassId: c.id,
            occurrenceDate: d,
            capacity: c.capacity,
            title: c.title,
            instructorId: c.instructorId,
            sessionType: "group" as const,
            startsAt,
            endsAt: sql`${startsAt} + make_interval(mins => ${c.durationMinutes})`,
          };
        }),
      )
      .onConflictDoNothing({ target: [lessons.groupClassId, lessons.occurrenceDate] });
  }

  // Fixed members missing from upcoming occurrences (never re-added once they cancelled one).
  const ids = classes.map((c) => c.id);
  const missing = await tx
    .select({ lessonId: lessons.id, clientId: groupClassMembers.clientId, capacity: lessons.capacity, taken: takenCount })
    .from(lessons)
    .innerJoin(
      groupClassMembers,
      and(
        eq(groupClassMembers.groupClassId, lessons.groupClassId),
        isNull(groupClassMembers.endedAt),
        sql`${groupClassMembers.startsOn} <= ${lessons.occurrenceDate}`,
      ),
    )
    .where(
      and(
        inArray(lessons.groupClassId, ids),
        eq(lessons.status, "scheduled"),
        gt(lessons.startsAt, sql`now()`),
        sql`not exists (select 1 from ${lessonAttendees} la where la.lesson_id = "lessons"."id" and la.client_id = "group_class_members"."client_id")`,
      ),
    )
    .orderBy(asc(lessons.startsAt));
  const added = new Map<string, number>();
  // Sequential: each placement reserves a credit the next pickPackage must see.
  for (const m of missing) {
    const taken = m.taken + (added.get(m.lessonId) ?? 0);
    if (m.capacity !== null && taken >= m.capacity) continue;
    await tx.insert(lessonAttendees).values({
      trainerId: trainer.id,
      lessonId: m.lessonId,
      clientId: m.clientId,
      clientPackageId: await pickPackage(tx, m.clientId, "group", { strict: true }),
    });
    added.set(m.lessonId, (added.get(m.lessonId) ?? 0) + 1);
  }

  // A member booked while out of credit gets the package bought since.
  const unpaid = await tx
    .select({ id: lessonAttendees.id, clientId: lessonAttendees.clientId })
    .from(lessonAttendees)
    .innerJoin(lessons, eq(lessons.id, lessonAttendees.lessonId))
    .where(
      and(
        inArray(lessons.groupClassId, ids),
        eq(lessonAttendees.status, "scheduled"),
        isNull(lessonAttendees.clientPackageId),
        gt(lessons.startsAt, sql`now()`),
      ),
    )
    .orderBy(asc(lessons.startsAt));
  for (const a of unpaid) {
    const pkg = await pickPackage(tx, a.clientId, "group", { strict: true });
    if (pkg) await tx.update(lessonAttendees).set({ clientPackageId: pkg }).where(eq(lessonAttendees.id, a.id));
  }
}

/** Same as above for every trainer of the given ids (portal: owner connection). */
export async function ensureGroupOccurrencesFor(tx: Tx, trainerId: string) {
  const [t] = await tx.select({ id: trainers.id, timezone: trainers.timezone }).from(trainers).where(eq(trainers.id, trainerId));
  if (t) await ensureGroupOccurrences(tx, t);
}

// ---- Trainer side (RLS transaction) ----

export type GroupClassInput = {
  title: string;
  weekdays: number[];
  startTime: string;
  durationMinutes: number;
  capacity: number;
  joinMode: JoinMode;
  startsOn: string;
  /** Studio member who teaches it; the owner when left out. */
  instructorId?: string | null;
};

export async function listGroupClasses(tx: Tx, trainer: TrainerRef) {
  const today = todayISO(trainer.timezone);
  return tx
    .select({
      id: groupClasses.id,
      title: groupClasses.title,
      weekdays: groupClasses.weekdays,
      startTime: groupClasses.startTime,
      durationMinutes: groupClasses.durationMinutes,
      capacity: groupClasses.capacity,
      joinMode: groupClasses.joinMode,
      startsOn: groupClasses.startsOn,
      endsOn: groupClasses.endsOn,
      members: sql<number>`(select count(*)::int from ${groupClassMembers} m where m.group_class_id = "group_classes"."id" and m.ended_at is null)`,
      live: sql<boolean>`(${groupClasses.endsOn} is null or ${groupClasses.endsOn} >= ${today})`,
    })
    .from(groupClasses)
    .where(eq(groupClasses.trainerId, trainer.id))
    .orderBy(sql`(${groupClasses.endsOn} is not null and ${groupClasses.endsOn} < ${today})`, asc(groupClasses.startTime));
}

export async function createGroupClass(tx: Tx, trainer: TrainerRef, input: GroupClassInput) {
  const [row] = await tx
    .insert(groupClasses)
    .values({ ...input, trainerId: trainer.id })
    .returning({ id: groupClasses.id });
  await ensureGroupOccurrences(tx, trainer, { classId: row.id });
  return row.id;
}

export async function getGroupClass(tx: Tx, trainer: TrainerRef, id: string) {
  const [c] = await tx
    .select()
    .from(groupClasses)
    .where(and(eq(groupClasses.id, id), eq(groupClasses.trainerId, trainer.id)));
  if (!c) return null;
  const members = await tx
    .select({ id: groupClassMembers.id, clientId: clients.id, name: clients.fullName, startsOn: groupClassMembers.startsOn })
    .from(groupClassMembers)
    .innerJoin(clients, eq(clients.id, groupClassMembers.clientId))
    .where(and(eq(groupClassMembers.groupClassId, id), isNull(groupClassMembers.endedAt)))
    .orderBy(asc(clients.fullName));
  const upcoming = await tx
    .select({ id: lessons.id, startsAt: lessons.startsAt, status: lessons.status, capacity: lessons.capacity, taken: takenCount })
    .from(lessons)
    .where(and(eq(lessons.groupClassId, id), gt(lessons.endsAt, sql`now()`)))
    .orderBy(asc(lessons.startsAt))
    .limit(12);
  return { ...c, members, upcoming };
}

export type GroupUpdate = { title: string; capacity: number; joinMode: JoinMode; instructorId?: string };

/**
 * Renames the class or changes its places or join mode; upcoming occurrences
 * follow. Places can't drop below the fixed members. Day and time aren't
 * editable: end the class and start a new one (history stays with the old one).
 */
export async function updateGroupClass(tx: Tx, trainer: TrainerRef, id: string, input: GroupUpdate) {
  const [{ members }] = await tx
    .select({ members: sql<number>`count(*)::int` })
    .from(groupClassMembers)
    .where(and(eq(groupClassMembers.groupClassId, id), isNull(groupClassMembers.endedAt)));
  if (input.capacity < members) return { ok: false as const, reason: "below_members" as const, members };
  const [row] = await tx
    .update(groupClasses)
    .set(input)
    .where(and(eq(groupClasses.id, id), eq(groupClasses.trainerId, trainer.id)))
    .returning({ id: groupClasses.id });
  if (!row) return { ok: false as const, reason: "not_found" as const };
  await tx
    .update(lessons)
    .set({ title: input.title, capacity: input.capacity, ...(input.instructorId ? { instructorId: input.instructorId } : {}) })
    .where(and(eq(lessons.groupClassId, id), gt(lessons.startsAt, sql`now()`)));
  if (input.joinMode === "drop_in") {
    // No fixed places in drop-in mode; bookings already made stay.
    await tx.update(groupClassMembers).set({ endedAt: new Date() }).where(and(eq(groupClassMembers.groupClassId, id), isNull(groupClassMembers.endedAt)));
  }
  await ensureGroupOccurrences(tx, trainer, { classId: id });
  return { ok: true as const };
}

/** Ends the class today: later occurrences are cancelled without using anyone's credit. */
export async function endGroupClass(tx: Tx, trainer: TrainerRef, id: string) {
  const today = todayISO(trainer.timezone);
  const [row] = await tx
    .update(groupClasses)
    .set({ endsOn: today })
    .where(and(eq(groupClasses.id, id), eq(groupClasses.trainerId, trainer.id)))
    .returning({ id: groupClasses.id });
  if (!row) return false;
  const cancelled = await tx
    .update(lessons)
    .set({ status: "cancelled" })
    .where(and(eq(lessons.groupClassId, id), gt(lessons.startsAt, sql`now()`), eq(lessons.status, "scheduled")))
    .returning({ id: lessons.id });
  if (cancelled.length > 0) {
    await tx
      .update(lessonAttendees)
      .set({ status: "cancelled", makeupUsed: false, markedAt: new Date() })
      .where(inArray(lessonAttendees.lessonId, cancelled.map((l) => l.id)));
  }
  await tx.update(groupClassMembers).set({ endedAt: new Date() }).where(and(eq(groupClassMembers.groupClassId, id), isNull(groupClassMembers.endedAt)));
  return true;
}

export type AddMemberResult = { ok: true; skipped: number } | { ok: false; reason: "full" | "already" | "not_found" | "drop_in_only" };

/** Gives a client a fixed weekly place from `startsOn`. `skipped` = upcoming occurrences already full. */
export async function addGroupMember(
  tx: Tx,
  trainer: TrainerRef,
  { classId, clientId, startsOn }: { classId: string; clientId: string; startsOn: string },
): Promise<AddMemberResult> {
  const [c] = await tx
    .select({ capacity: groupClasses.capacity, joinMode: groupClasses.joinMode })
    .from(groupClasses)
    .where(and(eq(groupClasses.id, classId), eq(groupClasses.trainerId, trainer.id)))
    .for("update");
  if (!c) return { ok: false, reason: "not_found" };
  if (c.joinMode === "drop_in") return { ok: false, reason: "drop_in_only" };
  const active = await tx
    .select({ clientId: groupClassMembers.clientId })
    .from(groupClassMembers)
    .where(and(eq(groupClassMembers.groupClassId, classId), isNull(groupClassMembers.endedAt)));
  if (active.some((m) => m.clientId === clientId)) return { ok: false, reason: "already" };
  if (active.length >= c.capacity) return { ok: false, reason: "full" };

  await tx.insert(groupClassMembers).values({ trainerId: trainer.id, groupClassId: classId, clientId, startsOn });
  await ensureGroupOccurrences(tx, trainer, { classId });
  const [{ skipped }] = await tx
    .select({ skipped: sql<number>`count(*)::int` })
    .from(lessons)
    .where(
      and(
        eq(lessons.groupClassId, classId),
        eq(lessons.status, "scheduled"),
        gt(lessons.startsAt, sql`now()`),
        sql`${lessons.occurrenceDate} >= ${startsOn}`,
        sql`not exists (select 1 from ${lessonAttendees} la where la.lesson_id = "lessons"."id" and la.client_id = ${clientId})`,
      ),
    );
  return { ok: true, skipped };
}

/** Ends a fixed place; the member's upcoming bookings in the class are dropped. */
export async function removeGroupMember(tx: Tx, trainer: TrainerRef, memberId: string) {
  const [m] = await tx
    .update(groupClassMembers)
    .set({ endedAt: new Date() })
    .where(and(eq(groupClassMembers.id, memberId), eq(groupClassMembers.trainerId, trainer.id), isNull(groupClassMembers.endedAt)))
    .returning({ classId: groupClassMembers.groupClassId, clientId: groupClassMembers.clientId });
  if (!m) return false;
  await tx
    .delete(lessonAttendees)
    .where(
      and(
        eq(lessonAttendees.clientId, m.clientId),
        eq(lessonAttendees.status, "scheduled"),
        inArray(
          lessonAttendees.lessonId,
          tx
            .select({ id: lessons.id })
            .from(lessons)
            .where(and(eq(lessons.groupClassId, m.classId), gt(lessons.startsAt, sql`now()`))),
        ),
      ),
    );
  return true;
}

export type AddAttendeeResult = { ok: true } | { ok: false; reason: "not_found" | "full" | "already" };

/** Trainer adds a client to one lesson (any lesson; group lessons respect their places). */
export async function addAttendee(tx: Tx, trainer: TrainerRef, lessonId: string, clientId: string): Promise<AddAttendeeResult> {
  const [l] = await tx
    .select({ id: lessons.id, capacity: lessons.capacity, sessionType: lessons.sessionType, groupClassId: lessons.groupClassId, taken: takenCount })
    .from(lessons)
    .where(and(eq(lessons.id, lessonId), eq(lessons.trainerId, trainer.id), eq(lessons.status, "scheduled")))
    .for("update");
  if (!l) return { ok: false, reason: "not_found" };
  if (l.capacity !== null && l.taken >= l.capacity) return { ok: false, reason: "full" };
  const clientPackageId = await pickPackage(tx, clientId, l.sessionType, { strict: l.groupClassId !== null });
  const [existing] = await tx
    .select({ id: lessonAttendees.id, status: lessonAttendees.status })
    .from(lessonAttendees)
    .where(and(eq(lessonAttendees.lessonId, lessonId), eq(lessonAttendees.clientId, clientId)));
  if (existing && (HOLDS_PLACE as readonly string[]).includes(existing.status)) return { ok: false, reason: "already" };
  if (existing) {
    await tx
      .update(lessonAttendees)
      .set({ status: "scheduled", makeupUsed: false, markedAt: null, clientPackageId })
      .where(eq(lessonAttendees.id, existing.id));
  } else {
    await tx.insert(lessonAttendees).values({ trainerId: trainer.id, lessonId, clientId, clientPackageId });
  }
  return { ok: true };
}

// ---- Client side (owner connection, scoped to the client from the portal link) ----

type Who = { trainerId: string; clientId: string };

/** Live group packages with an unreserved credit, soonest to expire first. */
async function groupCredits(tx: Tx, who: Who) {
  return tx
    .select({
      id: clientPackages.id,
      expiresOn: clientPackageBalances.effectiveExpiresOn,
      free: sql<number>`(${clientPackageBalances.remainingSessions} - ${clientPackageBalances.scheduledSessions})::int`,
    })
    .from(clientPackages)
    .innerJoin(clientPackageBalances, eq(clientPackageBalances.clientPackageId, clientPackages.id))
    .where(
      and(
        eq(clientPackages.clientId, who.clientId),
        eq(clientPackages.trainerId, who.trainerId),
        eq(clientPackages.sessionType, "group"),
        eq(clientPackageBalances.state, "active"),
        sql`${clientPackageBalances.remainingSessions} - ${clientPackageBalances.scheduledSessions} > 0`,
      ),
    )
    .orderBy(sql`${clientPackageBalances.effectiveExpiresOn} asc nulls last`);
}

export type GroupSlot = {
  lessonId: string;
  title: string;
  startsAt: Date;
  endsAt: Date;
  capacity: number;
  taken: number;
  /** The client already holds a place. */
  joined: boolean;
  /** The client can take a place now (room, credit, allowed by the class). */
  canJoin: boolean;
};

export type GroupView = { credits: number; fixed: { title: string; weekdays: number[]; startTime: string }[]; slots: GroupSlot[] };

/**
 * Upcoming group lessons for the portal: ones open to drop-ins, plus the
 * client's own fixed class (so a member who skipped a week can come back).
 */
export async function getGroupView(tx: Tx, who: Who): Promise<GroupView | null> {
  const [t] = await tx.select().from(trainers).where(eq(trainers.id, who.trainerId));
  if (!t) return null;
  await ensureGroupOccurrences(tx, t);
  const today = todayISO(t.timezone);

  const fixed = await tx
    .select({ id: groupClasses.id, title: groupClasses.title, weekdays: groupClasses.weekdays, startTime: groupClasses.startTime })
    .from(groupClassMembers)
    .innerJoin(groupClasses, eq(groupClasses.id, groupClassMembers.groupClassId))
    .where(and(eq(groupClassMembers.clientId, who.clientId), isNull(groupClassMembers.endedAt), liveClass(today)));
  const memberOf = fixed.map((f) => f.id);

  const rows = await tx
    .select({
      lessonId: lessons.id,
      title: lessons.title,
      startsAt: lessons.startsAt,
      endsAt: lessons.endsAt,
      capacity: lessons.capacity,
      taken: takenCount,
      joinMode: groupClasses.joinMode,
      groupClassId: groupClasses.id,
      mine: sql<string | null>`(select la.status::text from ${lessonAttendees} la where la.lesson_id = "lessons"."id" and la.client_id = ${who.clientId})`,
    })
    .from(lessons)
    .innerJoin(groupClasses, eq(groupClasses.id, lessons.groupClassId))
    .where(
      and(
        eq(lessons.trainerId, t.id),
        eq(lessons.status, "scheduled"),
        gt(lessons.startsAt, sql`now() + make_interval(hours => ${t.bookingMinNoticeHours})`),
        lt(lessons.startsAt, sql`now() + make_interval(days => ${t.bookingHorizonDays})`),
        memberOf.length > 0
          ? or(inArray(groupClasses.joinMode, ["drop_in", "both"]), inArray(groupClasses.id, memberOf))
          : inArray(groupClasses.joinMode, ["drop_in", "both"]),
      ),
    )
    .orderBy(asc(lessons.startsAt))
    .limit(30);

  const credits = await groupCredits(tx, who);
  const slots = rows.map((r) => {
    const joined = r.mine !== null && (HOLDS_PLACE as readonly string[]).includes(r.mine);
    // Once cancelled late, the credit is used; taking the place again would bill it twice.
    const lateCancelled = r.mine === "late_cancel";
    const room = r.capacity === null || r.taken < r.capacity;
    const hasCredit = credits.some((c) => !c.expiresOn || c.expiresOn >= r.startsAt.toISOString().slice(0, 10));
    return {
      lessonId: r.lessonId,
      title: r.title ?? "Grup dersi",
      startsAt: r.startsAt,
      endsAt: r.endsAt,
      capacity: r.capacity ?? 0,
      taken: r.taken,
      joined,
      canJoin: !joined && !lateCancelled && room && hasCredit,
    };
  });
  return { credits: credits.reduce((sum, c) => sum + c.free, 0), fixed, slots };
}

export type JoinResult = { ok: true; title: string; startsAt: Date } | { ok: false; reason: "not_found" | "full" | "no_credit" | "already" | "too_late" };

/** The client takes a place in a group lesson, paid from their group package. */
export async function joinGroupLesson(tx: Tx, who: Who, lessonId: string): Promise<JoinResult> {
  const [l] = await tx
    .select({
      id: lessons.id,
      title: lessons.title,
      startsAt: lessons.startsAt,
      capacity: lessons.capacity,
      joinMode: groupClasses.joinMode,
      groupClassId: groupClasses.id,
      minNotice: trainers.bookingMinNoticeHours,
      taken: takenCount,
    })
    .from(lessons)
    .innerJoin(groupClasses, eq(groupClasses.id, lessons.groupClassId))
    .innerJoin(trainers, eq(trainers.id, lessons.trainerId))
    .where(and(eq(lessons.id, lessonId), eq(lessons.trainerId, who.trainerId), eq(lessons.status, "scheduled")))
    .for("update", { of: lessons });
  if (!l) return { ok: false, reason: "not_found" };
  if (l.startsAt.getTime() - Date.now() < l.minNotice * 3_600_000) return { ok: false, reason: "too_late" };

  if (l.joinMode === "fixed") {
    const [member] = await tx
      .select({ id: groupClassMembers.id })
      .from(groupClassMembers)
      .where(and(eq(groupClassMembers.groupClassId, l.groupClassId), eq(groupClassMembers.clientId, who.clientId), isNull(groupClassMembers.endedAt)));
    if (!member) return { ok: false, reason: "not_found" };
  }

  const [existing] = await tx
    .select({ id: lessonAttendees.id, status: lessonAttendees.status })
    .from(lessonAttendees)
    .where(and(eq(lessonAttendees.lessonId, lessonId), eq(lessonAttendees.clientId, who.clientId)));
  if (existing && existing.status !== "cancelled") return { ok: false, reason: "already" };
  if (l.capacity !== null && l.taken >= l.capacity) return { ok: false, reason: "full" };

  const day = l.startsAt.toISOString().slice(0, 10);
  const pkg = (await groupCredits(tx, who)).find((c) => !c.expiresOn || c.expiresOn >= day);
  if (!pkg) return { ok: false, reason: "no_credit" };

  if (existing) {
    await tx
      .update(lessonAttendees)
      .set({ status: "scheduled", makeupUsed: false, markedAt: null, clientPackageId: pkg.id })
      .where(eq(lessonAttendees.id, existing.id));
  } else {
    await tx.insert(lessonAttendees).values({ trainerId: who.trainerId, lessonId, clientId: who.clientId, clientPackageId: pkg.id });
  }
  return { ok: true, title: l.title ?? "Grup dersi", startsAt: l.startsAt };
}
