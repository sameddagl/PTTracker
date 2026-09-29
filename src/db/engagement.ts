import "server-only";
import { and, asc, desc, eq, gt, gte, inArray, isNotNull, isNull, lt, lte, or, sql } from "drizzle-orm";
import { addDays } from "@/lib/dates";
import { todayISO } from "@/lib/format";
import type { Tx } from "./index";
import {
  clientPackageBalances,
  clientPackages,
  clients,
  lessonAttendees,
  lessons,
  packageTemplates,
  payments,
  trainers,
} from "./schema";

// Keeping clients engaged: "Geliyor musun?" confirmations and reminders,
// renewal offers, the weekly summary and clients who stopped coming. The
// cron-side functions run on the owner connection across all trainers.

/** Hours before a lesson the "Geliyor musun?" reminder goes out. */
export const REMINDER_HOURS = 36;
/** No reminder closer than this to the start: it would arrive too late to act on. */
const REMINDER_MIN_HOURS = 2;
/** Don't remind about a booking made moments ago. */
const FRESH_BOOKING_HOURS = 6;
/** A client with no lesson in this many days and nothing booked counts as "lost". */
export const LOST_AFTER_DAYS = 21;

type Who = { trainerId: string; clientId: string };

// ---- Client side (portal) ----

/** "Geliyorum": the client confirms an upcoming lesson. */
export async function confirmAttendance(tx: Tx, who: Who, attendeeId: string) {
  const rows = await tx
    .update(lessonAttendees)
    .set({ confirmedAt: new Date() })
    .where(
      and(
        eq(lessonAttendees.id, attendeeId),
        eq(lessonAttendees.clientId, who.clientId),
        eq(lessonAttendees.trainerId, who.trainerId),
        eq(lessonAttendees.status, "scheduled"),
        inArray(
          lessonAttendees.lessonId,
          tx
            .select({ id: lessons.id })
            .from(lessons)
            .where(and(eq(lessons.status, "scheduled"), gt(lessons.startsAt, sql`now()`))),
        ),
      ),
    )
    .returning({ id: lessonAttendees.id });
  return rows.length > 0;
}

/**
 * The client's live packages that are running out (≤2 lessons or ending
 * within a week) and can be renewed from their template.
 */
export async function renewablePackages(tx: Tx, who: Who, timezone: string) {
  const today = todayISO(timezone);
  return tx
    .select({
      clientPackageId: clientPackages.id,
      name: clientPackages.name,
      templateId: packageTemplates.id,
      remaining: clientPackageBalances.remainingSessions,
      expiresOn: clientPackageBalances.effectiveExpiresOn,
      installments: clientPackages.installments,
    })
    .from(clientPackages)
    .innerJoin(clientPackageBalances, eq(clientPackageBalances.clientPackageId, clientPackages.id))
    .innerJoin(packageTemplates, eq(packageTemplates.id, clientPackages.templateId))
    .where(
      and(
        eq(clientPackages.clientId, who.clientId),
        eq(clientPackages.trainerId, who.trainerId),
        eq(clientPackageBalances.state, "active"),
        eq(packageTemplates.isActive, true),
        eq(packageTemplates.isTrial, false),
        or(
          lte(clientPackageBalances.remainingSessions, 2),
          sql`${clientPackageBalances.effectiveExpiresOn} <= ${today}::date + 7`,
        ),
      ),
    );
}

// ---- Trainer side (RLS transaction) ----

export type LostClient = { clientId: string; name: string; phone: string | null; lastLessonOn: string };

/** Active clients who used to come, haven't had a lesson in LOST_AFTER_DAYS and have nothing booked. */
export async function lostClients(tx: Tx, trainer: { id: string; timezone: string }, limit = 10): Promise<LostClient[]> {
  const tz = trainer.timezone;
  const rows = await tx
    .select({
      clientId: clients.id,
      name: clients.fullName,
      phone: clients.phone,
      last: sql<string>`to_char(max(${lessons.startsAt} at time zone ${tz}), 'YYYY-MM-DD')`,
    })
    .from(clients)
    .innerJoin(lessonAttendees, eq(lessonAttendees.clientId, clients.id))
    .innerJoin(lessons, eq(lessons.id, lessonAttendees.lessonId))
    .where(
      and(
        eq(clients.trainerId, trainer.id),
        eq(clients.status, "active"),
        isNull(clients.archivedAt),
        eq(lessons.status, "scheduled"),
        inArray(lessonAttendees.status, ["attended", "no_show", "late_cancel"]),
        sql`not exists (
          select 1 from ${lessonAttendees} la join ${lessons} l on l.id = la.lesson_id
          where la.client_id = "clients"."id" and la.status = 'scheduled' and l.status = 'scheduled' and l.starts_at > now()
        )`,
      ),
    )
    .groupBy(clients.id)
    .having(sql`max(${lessons.startsAt}) < now() - make_interval(days => ${LOST_AFTER_DAYS})`)
    .orderBy(desc(sql`max(${lessons.startsAt})`))
    .limit(limit);
  return rows.map((r) => ({ clientId: r.clientId, name: r.name, phone: r.phone, lastLessonOn: r.last }));
}

export type TomorrowAttendee = {
  attendeeId: string;
  clientId: string;
  name: string;
  phone: string | null;
  startsAt: Date;
  title: string | null;
  confirmed: boolean;
};

/** Tomorrow's bookings, for the "Yarın gelecekler" list on Bugün. */
export async function tomorrowAttendees(tx: Tx, trainer: { id: string; timezone: string }): Promise<TomorrowAttendee[]> {
  const tomorrow = addDays(todayISO(trainer.timezone), 1);
  const tz = trainer.timezone;
  const rows = await tx
    .select({
      attendeeId: lessonAttendees.id,
      clientId: clients.id,
      name: clients.fullName,
      phone: clients.phone,
      startsAt: lessons.startsAt,
      title: lessons.title,
      confirmedAt: lessonAttendees.confirmedAt,
    })
    .from(lessonAttendees)
    .innerJoin(lessons, eq(lessons.id, lessonAttendees.lessonId))
    .innerJoin(clients, eq(clients.id, lessonAttendees.clientId))
    .where(
      and(
        eq(lessons.trainerId, trainer.id),
        eq(lessons.status, "scheduled"),
        eq(lessonAttendees.status, "scheduled"),
        gte(lessons.startsAt, sql`(${tomorrow}::date::timestamp at time zone ${tz})`),
        lt(lessons.startsAt, sql`((${tomorrow}::date + 1)::timestamp at time zone ${tz})`),
      ),
    )
    .orderBy(asc(lessons.startsAt), asc(clients.fullName));
  return rows.map(({ confirmedAt, ...r }) => ({ ...r, confirmed: confirmedAt !== null }));
}

// ---- Cron (owner connection, all trainers) ----

export type DueReminder = {
  attendeeId: string;
  trainerId: string;
  clientId: string;
  clientName: string;
  clientEmail: string | null;
  trainerName: string;
  timezone: string;
  startsAt: Date;
  title: string | null;
  sessionType: string;
};

/** Bookings starting within REMINDER_HOURS that haven't been reminded yet. */
export async function dueReminders(tx: Tx, limit = 200): Promise<DueReminder[]> {
  return tx
    .select({
      attendeeId: lessonAttendees.id,
      trainerId: trainers.id,
      clientId: clients.id,
      clientName: clients.fullName,
      clientEmail: clients.email,
      trainerName: sql<string>`coalesce(nullif(${trainers.businessName}, ''), ${trainers.fullName})`,
      timezone: trainers.timezone,
      startsAt: lessons.startsAt,
      title: lessons.title,
      sessionType: lessons.sessionType,
    })
    .from(lessonAttendees)
    .innerJoin(lessons, eq(lessons.id, lessonAttendees.lessonId))
    .innerJoin(clients, eq(clients.id, lessonAttendees.clientId))
    .innerJoin(trainers, eq(trainers.id, lessons.trainerId))
    .where(
      and(
        eq(lessonAttendees.status, "scheduled"),
        eq(lessons.status, "scheduled"),
        isNull(lessonAttendees.reminderSentAt),
        isNull(lessonAttendees.confirmedAt),
        isNull(clients.archivedAt),
        gt(lessons.startsAt, sql`now() + make_interval(hours => ${REMINDER_MIN_HOURS})`),
        lte(lessons.startsAt, sql`now() + make_interval(hours => ${REMINDER_HOURS})`),
        lt(lessonAttendees.createdAt, sql`now() - make_interval(hours => ${FRESH_BOOKING_HOURS})`),
      ),
    )
    .orderBy(asc(lessons.startsAt))
    .limit(limit);
}

export async function markReminded(tx: Tx, attendeeIds: string[]) {
  if (attendeeIds.length === 0) return;
  await tx.update(lessonAttendees).set({ reminderSentAt: new Date() }).where(inArray(lessonAttendees.id, attendeeIds));
}

export type RenewalCandidate = {
  clientPackageId: string;
  trainerId: string;
  clientId: string;
  clientName: string;
  clientEmail: string | null;
  trainerName: string;
  packageName: string;
  remaining: number;
  expiresOn: string | null;
};

/** Packages that just started running out and whose client hasn't been told yet. */
export async function renewalCandidates(tx: Tx, limit = 200): Promise<RenewalCandidate[]> {
  return tx
    .select({
      clientPackageId: clientPackages.id,
      trainerId: trainers.id,
      clientId: clients.id,
      clientName: clients.fullName,
      clientEmail: clients.email,
      trainerName: sql<string>`coalesce(nullif(${trainers.businessName}, ''), ${trainers.fullName})`,
      packageName: clientPackages.name,
      remaining: clientPackageBalances.remainingSessions,
      expiresOn: clientPackageBalances.effectiveExpiresOn,
    })
    .from(clientPackages)
    .innerJoin(clientPackageBalances, eq(clientPackageBalances.clientPackageId, clientPackages.id))
    .innerJoin(clients, eq(clients.id, clientPackages.clientId))
    .innerJoin(trainers, eq(trainers.id, clientPackages.trainerId))
    .innerJoin(packageTemplates, eq(packageTemplates.id, clientPackages.templateId))
    .where(
      and(
        isNull(clientPackages.renewalOfferedAt),
        eq(clientPackageBalances.state, "active"),
        isNull(clients.archivedAt),
        eq(packageTemplates.isActive, true),
        eq(packageTemplates.isTrial, false),
        or(
          lte(clientPackageBalances.remainingSessions, 2),
          sql`${clientPackageBalances.effectiveExpiresOn} <= (now() at time zone ${trainers.timezone})::date + 7`,
        ),
      ),
    )
    .limit(limit);
}

export async function markRenewalOffered(tx: Tx, clientPackageIds: string[]) {
  if (clientPackageIds.length === 0) return;
  await tx.update(clientPackages).set({ renewalOfferedAt: new Date() }).where(inArray(clientPackages.id, clientPackageIds));
}

export type WeeklySummary = {
  trainerId: string;
  trainerName: string;
  week: string;
  lessons: number;
  attended: number;
  missed: number;
  income: number;
  newClients: number;
  endingSoon: number;
  lost: LostClient[];
};

/**
 * Trainers due a weekly summary: it's Monday 08:00 or later in their
 * timezone (or any later day of the week, if a run was missed) and this
 * week's summary hasn't gone out. Figures cover the previous Monday–Sunday.
 */
export async function dueWeeklySummaries(tx: Tx, now = new Date()): Promise<WeeklySummary[]> {
  const list = await tx
    .select({ id: trainers.id, timezone: trainers.timezone, fullName: trainers.fullName, businessName: trainers.businessName, week: trainers.weeklySummaryWeek })
    .from(trainers)
    .where(isNotNull(trainers.onboardedAt));
  const out: WeeklySummary[] = [];
  for (const t of list) {
    const parts = Object.fromEntries(
      new Intl.DateTimeFormat("en-CA", { timeZone: t.timezone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hourCycle: "h23", weekday: "short" })
        .formatToParts(now)
        .map((p) => [p.type, p.value]),
    );
    const today = `${parts.year}-${parts.month}-${parts.day}`;
    const dow = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].indexOf(parts.weekday);
    const monday = addDays(today, -dow);
    if (t.week && t.week >= monday) continue;
    if (dow === 0 && Number(parts.hour) < 8) continue;

    const from = addDays(monday, -7);
    const tz = t.timezone;
    const start = sql`(${from}::date::timestamp at time zone ${tz})`;
    const end = sql`(${monday}::date::timestamp at time zone ${tz})`;
    const [lessonStats] = await tx
      .select({
        lessons: sql<number>`count(distinct ${lessons.id})::int`,
        attended: sql<number>`count(*) filter (where ${lessonAttendees.status} = 'attended')::int`,
        missed: sql<number>`count(*) filter (where ${lessonAttendees.status} in ('no_show', 'late_cancel'))::int`,
      })
      .from(lessons)
      .leftJoin(lessonAttendees, eq(lessonAttendees.lessonId, lessons.id))
      .where(and(eq(lessons.trainerId, t.id), eq(lessons.status, "scheduled"), gte(lessons.startsAt, start), lt(lessons.startsAt, end)));
    const [incomeRow] = await tx
      .select({ total: sql<string>`coalesce(sum(${payments.amount}), 0)` })
      .from(payments)
      .where(and(eq(payments.trainerId, t.id), eq(payments.status, "confirmed"), gte(payments.paidOn, from), lt(payments.paidOn, monday)));
    const [newRow] = await tx
      .select({ n: sql<number>`count(*)::int` })
      .from(clients)
      .where(and(eq(clients.trainerId, t.id), eq(clients.status, "active"), gte(clients.createdAt, start), lt(clients.createdAt, end)));
    const [endingRow] = await tx
      .select({ n: sql<number>`count(*)::int` })
      .from(clientPackageBalances)
      .where(
        and(
          eq(clientPackageBalances.trainerId, t.id),
          eq(clientPackageBalances.state, "active"),
          or(lte(clientPackageBalances.remainingSessions, 2), sql`${clientPackageBalances.effectiveExpiresOn} <= ${today}::date + 7`),
        ),
      );
    out.push({
      trainerId: t.id,
      trainerName: t.businessName || t.fullName,
      week: monday,
      lessons: lessonStats?.lessons ?? 0,
      attended: lessonStats?.attended ?? 0,
      missed: lessonStats?.missed ?? 0,
      income: Number(incomeRow?.total ?? 0),
      newClients: newRow?.n ?? 0,
      endingSoon: endingRow?.n ?? 0,
      lost: await lostClients(tx, t, 5),
    });
  }
  return out;
}

export async function markWeeklySent(tx: Tx, trainerId: string, week: string) {
  await tx.update(trainers).set({ weeklySummaryWeek: week }).where(eq(trainers.id, trainerId));
}

/** Trainers with a live group class, so the cron keeps their occurrences (and reminders) ahead. */
export async function trainersWithGroups(tx: Tx): Promise<{ id: string; timezone: string }[]> {
  const rows = await tx.execute<{ id: string; timezone: string }>(sql`
    select distinct t.id, t.timezone from trainers t
    join group_classes g on g.trainer_id = t.id
    where g.ends_on is null or g.ends_on >= current_date
  `);
  // postgres-js returns the rows array; PGlite wraps it in { rows }.
  return (Array.isArray(rows) ? rows : (rows as unknown as { rows: { id: string; timezone: string }[] }).rows) as { id: string; timezone: string }[];
}
