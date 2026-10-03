import "server-only";
import { and, asc, eq, gte, inArray, lt, sql } from "drizzle-orm";
import { addDays } from "@/lib/dates";
import { computeSlots, toHHMM, type Busy, type DaySlots } from "@/lib/slots";
import type { Tx } from "./index";
import { setAttendance } from "./lessons";
import { accountMembers, availabilityRules, clientPackageBalances, clientPackages, lessonAttendees, lessons, timeOff, trainers } from "./schema";

// ---- Trainer settings (RLS transaction) ----

/** Weekly hours and days off; with `instructorId`, just that studio member's. */
export async function getAvailability(tx: Tx, trainerId: string, instructorId?: string | null) {
  const rules = await tx
    .select()
    .from(availabilityRules)
    .where(and(eq(availabilityRules.trainerId, trainerId), instructorId ? eq(availabilityRules.instructorId, instructorId) : undefined))
    .orderBy(asc(availabilityRules.weekday), asc(availabilityRules.startMinute));
  const off = await tx
    .select()
    .from(timeOff)
    .where(and(eq(timeOff.trainerId, trainerId), instructorId ? eq(timeOff.instructorId, instructorId) : undefined, gte(timeOff.endsOn, sql`current_date - 1`)))
    .orderBy(asc(timeOff.startsOn));
  return { rules, off };
}

export type RuleInput = { weekday: number; startMinute: number; endMinute: number };

/** The account owner's member id: whose hours they are when no instructor is named. */
async function ownerMemberId(tx: Tx, trainerId: string) {
  const [m] = await tx
    .select({ id: accountMembers.id })
    .from(accountMembers)
    .where(and(eq(accountMembers.accountId, trainerId), eq(accountMembers.role, "owner")));
  return m.id;
}

/** Replaces one instructor's whole weekly schedule (the editor always submits all of it); the owner's by default. */
export async function replaceAvailabilityRules(tx: Tx, trainerId: string, rules: RuleInput[], instructorId?: string) {
  instructorId ??= await ownerMemberId(tx, trainerId);
  await tx.delete(availabilityRules).where(and(eq(availabilityRules.trainerId, trainerId), eq(availabilityRules.instructorId, instructorId)));
  if (rules.length > 0) await tx.insert(availabilityRules).values(rules.map((r) => ({ ...r, trainerId, instructorId })));
}

export async function addTimeOff(tx: Tx, trainerId: string, input: { startsOn: string; endsOn: string; note: string | null }, instructorId?: string) {
  await tx.insert(timeOff).values({ ...input, trainerId, instructorId: instructorId ?? null });
}

export async function deleteTimeOff(tx: Tx, trainerId: string, id: string) {
  await tx.delete(timeOff).where(and(eq(timeOff.id, id), eq(timeOff.trainerId, trainerId)));
}

// ---- Client side (owner connection, scoped to the client from the portal link) ----

type Who = { trainerId: string; clientId: string };

/** Local "now" for a timezone: date and minute of day. */
function localNow(timeZone: string, d = new Date()) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
      .formatToParts(d)
      .map((p) => [p.type, p.value]),
  );
  return { date: `${parts.year}-${parts.month}-${parts.day}`, minute: Number(parts.hour) * 60 + Number(parts.minute) };
}

/** Packages a client can book from: private, live, with an unreserved credit left. */
async function bookablePackages(tx: Tx, who: Who) {
  return tx
    .select({
      id: clientPackages.id,
      name: clientPackages.name,
      expiresOn: clientPackageBalances.effectiveExpiresOn,
      free: sql<number>`(${clientPackageBalances.remainingSessions} - ${clientPackageBalances.scheduledSessions})::int`,
      /** Studios: only with these instructors (null = anyone). */
      instructorIds: clientPackages.instructorIds,
    })
    .from(clientPackages)
    .innerJoin(clientPackageBalances, eq(clientPackageBalances.clientPackageId, clientPackages.id))
    .where(
      and(
        eq(clientPackages.clientId, who.clientId),
        eq(clientPackages.trainerId, who.trainerId),
        eq(clientPackages.sessionType, "private"),
        eq(clientPackageBalances.state, "active"),
        sql`${clientPackageBalances.remainingSessions} - ${clientPackageBalances.scheduledSessions} > 0`,
      ),
    )
    .orderBy(sql`${clientPackageBalances.effectiveExpiresOn} asc nulls last`, asc(clientPackages.startsOn));
}

async function busyLessons(tx: Tx, trainer: { id: string; timezone: string }, from: string, to: string, instructorId?: string | null): Promise<Busy[]> {
  const tz = trainer.timezone;
  const local = sql`(${lessons.startsAt} at time zone ${tz})`;
  const rows = await tx
    .select({
      date: sql<string>`to_char(${local}, 'YYYY-MM-DD')`,
      start: sql<number>`(extract(hour from ${local}) * 60 + extract(minute from ${local}))::int`,
      minutes: sql<number>`(extract(epoch from ${lessons.endsAt} - ${lessons.startsAt}) / 60)::int`,
    })
    .from(lessons)
    .where(
      and(
        eq(lessons.trainerId, trainer.id),
        instructorId ? eq(lessons.instructorId, instructorId) : undefined,
        eq(lessons.status, "scheduled"),
        gte(lessons.startsAt, sql`(${from}::date::timestamp at time zone ${tz})`),
        lt(lessons.startsAt, sql`((${to}::date + 1)::timestamp at time zone ${tz})`),
      ),
    );
  return rows.map((r) => ({ date: r.date, startMinute: r.start, endMinute: r.start + r.minutes }));
}

export type BookingView = {
  enabled: boolean;
  lessonMinutes: number;
  lateCancelHours: number;
  packages: { id: string; name: string; free: number; expiresOn: string | null }[];
  /** Free slots: one instructor's, or in a studio everyone's together ("Fark etmez"). */
  days: DaySlots[];
  /** Studios with more than one bookable instructor: each one's slots, for picking who. */
  instructors: { id: string; name: string; days: DaySlots[] }[];
};

type TrainerRow = typeof trainers.$inferSelect;
type Pkg = Awaited<ReturnType<typeof bookablePackages>>[number];

/** Instructors clients can book: members with weekly hours (a trainer working alone has their own). */
async function bookableInstructors(tx: Tx, trainerId: string) {
  return tx
    .selectDistinct({ id: accountMembers.id, name: accountMembers.fullName, createdAt: accountMembers.createdAt })
    .from(accountMembers)
    .innerJoin(availabilityRules, eq(availabilityRules.instructorId, accountMembers.id))
    .where(and(eq(accountMembers.accountId, trainerId), eq(accountMembers.active, true)))
    .orderBy(asc(accountMembers.createdAt));
}

const allows = (p: Pkg, instructorId: string) => !p.instructorIds || p.instructorIds.length === 0 || p.instructorIds.includes(instructorId);

/** One instructor's free slots between `from` and the horizon, limited by the packages that allow them. */
async function slotsFor(tx: Tx, t: TrainerRow, instructorId: string, packages: Pkg[], range: { from: string; to: string }) {
  const usable = packages.filter((p) => allows(p, instructorId));
  if (usable.length === 0) return [];
  const now = localNow(t.timezone);
  const { rules, off } = await getAvailability(tx, t.id, instructorId);
  const lastDate = usable.every((p) => p.expiresOn) ? usable.map((p) => p.expiresOn!).sort().at(-1)! : null;
  return computeSlots({
    rules,
    busy: await busyLessons(tx, t, range.from, range.to, instructorId),
    daysOff: off,
    today: now.date,
    nowMinute: now.minute,
    horizonDays: t.bookingHorizonDays,
    lessonMinutes: t.bookingLessonMinutes,
    minNoticeMinutes: t.bookingMinNoticeHours * 60,
    lastDate,
  });
}

/** Every instructor's slots on one list (a time shows once if anyone is free). */
function mergeSlots(lists: DaySlots[][]): DaySlots[] {
  const byDate = new Map<string, Set<number>>();
  for (const days of lists) for (const d of days) for (const m of d.minutes) (byDate.get(d.date) ?? byDate.set(d.date, new Set()).get(d.date)!).add(m);
  return [...byDate].sort(([a], [b]) => a.localeCompare(b)).map(([date, set]) => ({ date, minutes: [...set].sort((a, b) => a - b) }));
}

/** What the client's portal shows under "Randevu al". */
export async function getBookingView(tx: Tx, who: Who): Promise<BookingView | null> {
  const [t] = await tx.select().from(trainers).where(eq(trainers.id, who.trainerId));
  if (!t) return null;
  const packages = await bookablePackages(tx, who);
  const base = { enabled: t.bookingEnabled, lessonMinutes: t.bookingLessonMinutes, lateCancelHours: t.lateCancelHours, packages };
  if (!t.bookingEnabled || packages.length === 0) return { ...base, days: [], instructors: [] };

  const now = localNow(t.timezone);
  const range = { from: now.date, to: addDays(now.date, t.bookingHorizonDays) };
  const instructors = await bookableInstructors(tx, t.id);
  const each = [];
  for (const i of instructors) each.push({ id: i.id, name: i.name, days: await slotsFor(tx, t, i.id, packages, range) });
  const withSlots = each.filter((i) => i.days.length > 0);
  return { ...base, days: mergeSlots(withSlots.map((i) => i.days)), instructors: withSlots.length > 1 ? withSlots : [] };
}

export type BookResult =
  | { ok: true; lessonId: string; packageName: string; instructorId: string }
  | { ok: false; reason: "disabled" | "no_credit" | "slot_taken" };

/**
 * Books one private lesson for the client, from the soonest-expiring package
 * still valid on that date. With no instructor picked ("Fark etmez"), the
 * first instructor free at that time takes it. Locks the trainer row so two
 * clients can't take the same slot, then re-derives the slot list and checks
 * the requested one is still in it.
 */
export async function bookSlot(tx: Tx, who: Who, input: { date: string; minute: number; instructorId?: string | null }): Promise<BookResult> {
  const [t] = await tx.select().from(trainers).where(eq(trainers.id, who.trainerId)).for("update");
  if (!t?.bookingEnabled) return { ok: false, reason: "disabled" };

  const packages = (await bookablePackages(tx, who)).filter((p) => !p.expiresOn || p.expiresOn >= input.date);
  if (packages.length === 0) return { ok: false, reason: "no_credit" };

  const candidates = (await bookableInstructors(tx, t.id)).filter((i) => !input.instructorId || i.id === input.instructorId);
  let chosen: { instructorId: string; pkg: Pkg } | null = null;
  for (const c of candidates) {
    const pkg = packages.find((p) => allows(p, c.id));
    if (!pkg) continue;
    const days = await slotsFor(tx, t, c.id, [pkg], { from: input.date, to: input.date });
    if (days.find((d) => d.date === input.date)?.minutes.includes(input.minute)) {
      chosen = { instructorId: c.id, pkg };
      break;
    }
  }
  if (!chosen) return packages.some((p) => candidates.some((c) => allows(p, c.id))) ? { ok: false, reason: "slot_taken" } : { ok: false, reason: "no_credit" };

  const startsAt = sql`((${input.date}::date + ${toHHMM(input.minute)}::time) at time zone ${t.timezone})`;
  const [lesson] = await tx
    .insert(lessons)
    .values({
      trainerId: t.id,
      instructorId: chosen.instructorId,
      sessionType: "private",
      startsAt,
      endsAt: sql`${startsAt} + make_interval(mins => ${t.bookingLessonMinutes})`,
      bookedByClient: true,
    })
    .returning({ id: lessons.id });
  await tx.insert(lessonAttendees).values({
    trainerId: t.id,
    lessonId: lesson.id,
    clientId: who.clientId,
    clientPackageId: chosen.pkg.id,
    status: "scheduled",
  });
  return { ok: true, lessonId: lesson.id, packageName: chosen.pkg.name, instructorId: chosen.instructorId };
}

export type CancelResult =
  | { ok: true; late: boolean; makeupUsed: boolean; startsAt: Date }
  | { ok: false; reason: "not_found" | "past" }
  // Inside the notice window: the client must confirm that the lesson will be used.
  | { ok: false; reason: "confirm_late" };

/**
 * The client cancels an upcoming lesson. In time: nothing is used and a
 * private lesson frees its slot. Inside the notice window (after the client
 * confirms): a late cancel, forgiven by the package's makeup allowance if any
 * is left.
 */
export async function cancelBooking(tx: Tx, who: Who, attendeeId: string, { confirmLate }: { confirmLate: boolean }): Promise<CancelResult> {
  const [row] = await tx
    .select({
      lessonId: lessons.id,
      startsAt: lessons.startsAt,
      lateCancelHours: trainers.lateCancelHours,
      groupClassId: lessons.groupClassId,
      attendees: sql<number>`(select count(*)::int from ${lessonAttendees} la where la.lesson_id = ${lessons.id})`,
    })
    .from(lessonAttendees)
    .innerJoin(lessons, eq(lessons.id, lessonAttendees.lessonId))
    .innerJoin(trainers, eq(trainers.id, lessons.trainerId))
    .where(
      and(
        eq(lessonAttendees.id, attendeeId),
        eq(lessonAttendees.clientId, who.clientId),
        eq(lessonAttendees.trainerId, who.trainerId),
        eq(lessonAttendees.status, "scheduled"),
        eq(lessons.status, "scheduled"),
      ),
    )
    .for("update", { of: lessonAttendees });
  if (!row) return { ok: false, reason: "not_found" };
  if (row.startsAt.getTime() <= Date.now()) return { ok: false, reason: "past" };

  const late = row.startsAt.getTime() - Date.now() < row.lateCancelHours * 3_600_000;
  if (late) {
    if (!confirmLate) return { ok: false, reason: "confirm_late" };
    const res = await setAttendance(tx, who.trainerId, attendeeId, "late_cancel");
    return { ok: true, late: true, makeupUsed: res?.makeupUsed ?? false, startsAt: row.startsAt };
  }

  await tx.update(lessonAttendees).set({ status: "cancelled", markedAt: new Date() }).where(eq(lessonAttendees.id, attendeeId));
  // A private lesson with nobody left frees the slot for others; a group class runs on.
  if (row.attendees <= 1 && !row.groupClassId) await tx.update(lessons).set({ status: "cancelled" }).where(eq(lessons.id, row.lessonId));
  return { ok: true, late: false, makeupUsed: false, startsAt: row.startsAt };
}

/** Upcoming lessons of a client with whether cancelling now would be late. */
export async function upcomingForClient(tx: Tx, who: Who) {
  const rows = await tx
    .select({
      attendeeId: lessonAttendees.id,
      startsAt: lessons.startsAt,
      endsAt: lessons.endsAt,
      sessionType: lessons.sessionType,
      title: lessons.title,
      lateCancelHours: trainers.lateCancelHours,
      confirmedAt: lessonAttendees.confirmedAt,
      // Studios: who teaches it (null for a trainer working alone).
      instructor: sql<string | null>`case when (select count(*) from ${accountMembers} m where m.account_id = ${lessons.trainerId} and m.active) > 1
        then ${accountMembers.fullName} end`,
    })
    .from(lessonAttendees)
    .innerJoin(lessons, eq(lessons.id, lessonAttendees.lessonId))
    .innerJoin(trainers, eq(trainers.id, lessons.trainerId))
    .leftJoin(accountMembers, eq(accountMembers.id, lessons.instructorId))
    .where(
      and(
        eq(lessonAttendees.clientId, who.clientId),
        eq(lessonAttendees.trainerId, who.trainerId),
        inArray(lessonAttendees.status, ["scheduled"]),
        eq(lessons.status, "scheduled"),
        gte(lessons.startsAt, sql`now()`),
      ),
    )
    .orderBy(asc(lessons.startsAt))
    .limit(10);
  return rows.map(({ confirmedAt, ...r }) => ({
    ...r,
    confirmed: confirmedAt !== null,
    lateIfCancelledNow: r.startsAt.getTime() - Date.now() < r.lateCancelHours * 3_600_000,
  }));
}
