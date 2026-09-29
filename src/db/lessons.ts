import "server-only";
import { and, asc, eq, gte, inArray, lt, ne, sql } from "drizzle-orm";
import { addDays, recurringDates } from "@/lib/dates";
import type { Tx } from "./index";
import { pickPackage, type SessionType } from "./packages";
import { clientPackageBalances, clientPackages, clients, lessonAttendees, lessonSeries, lessons } from "./schema";

export type AttendanceStatus = (typeof lessonAttendees.$inferSelect)["status"];

type TrainerRef = { id: string; timezone: string };

/** Wall-clock date + time in the trainer's timezone → timestamptz. */
const localToTs = (date: string, time: string, tz: string) => sql`((${date}::date + ${time}::time) at time zone ${tz})`;

export type Repeat = { weekdays: number[]; weeks: number };

export type LessonInput = {
  date: string; // YYYY-MM-DD in the trainer's timezone
  time: string; // HH:MM
  durationMinutes: number;
  sessionType: SessionType;
  clientIds: string[];
  /** "attended" logs a lesson that already happened in one step. */
  status: "scheduled" | "attended";
  note: string | null;
  /** Weekly repeat starting at `date`. Only for scheduled lessons. */
  repeat: Repeat | null;
};

/** The concrete dates a lesson input produces (one, or every occurrence of a weekly repeat). */
export function lessonDates(input: Pick<LessonInput, "date" | "repeat">) {
  if (!input.repeat) return [input.date];
  const until = addDays(input.date, input.repeat.weeks * 7 - 1);
  return recurringDates(input.date, until, input.repeat.weekdays);
}

export type Conflict = { date: string; startsAt: Date; endsAt: Date; names: string };

/**
 * The trainer's other scheduled lessons overlapping any of the given slots
 * (same time and duration on each date). One query for the whole series.
 */
export async function findConflicts(
  tx: Tx,
  trainer: TrainerRef,
  { dates, time, durationMinutes, excludeLessonId }: { dates: string[]; time: string; durationMinutes: number; excludeLessonId?: string },
): Promise<Conflict[]> {
  if (dates.length === 0) return [];
  const slotStart = sql`((s.d + ${time}::time) at time zone ${trainer.timezone})`;
  const rows = await tx.execute<{ date: string; starts_at: string; ends_at: string; names: string | null }>(sql`
    select to_char(s.d, 'YYYY-MM-DD') as date, l.starts_at, l.ends_at,
           (select string_agg(c.full_name, ', ' order by c.full_name)
              from ${lessonAttendees} la join ${clients} c on c.id = la.client_id
             where la.lesson_id = l.id) as names
    from unnest(array[${sql.join(
      dates.map((d) => sql`${d}::date`),
      sql`, `,
    )}]) as s(d)
    join ${lessons} l
      on l.trainer_id = ${trainer.id}
     and l.status = 'scheduled'
     and l.starts_at < ${slotStart} + make_interval(mins => ${durationMinutes})
     and l.ends_at > ${slotStart}
     ${excludeLessonId ? sql`and l.id <> ${excludeLessonId}` : sql``}
    order by l.starts_at
  `);
  // postgres-js returns the rows array; PGlite wraps it in { rows }.
  const list = (Array.isArray(rows) ? rows : (rows as unknown as { rows: typeof rows }).rows) as unknown as {
    date: string;
    starts_at: string | Date;
    ends_at: string | Date;
    names: string | null;
  }[];
  return list.map((r) => ({
    date: r.date,
    startsAt: new Date(r.starts_at),
    endsAt: new Date(r.ends_at),
    names: r.names ?? "",
  }));
}

/** Creates one lesson, or every occurrence of a weekly series. Returns the first lesson's id. */
export async function createLessons(tx: Tx, trainer: TrainerRef, input: LessonInput) {
  const dates = lessonDates(input);
  let seriesId: string | null = null;
  if (input.repeat && dates.length > 1) {
    const [series] = await tx
      .insert(lessonSeries)
      .values({
        trainerId: trainer.id,
        sessionType: input.sessionType,
        weekdays: input.repeat.weekdays,
        startTime: input.time,
        durationMinutes: input.durationMinutes,
        startsOn: dates[0],
        endsOn: dates.at(-1)!,
      })
      .returning({ id: lessonSeries.id });
    seriesId = series.id;
  }

  let firstId: string | null = null;
  // Sequential: each occurrence books a credit that the next pickPackage must see.
  for (const date of dates) {
    const startsAt = localToTs(date, input.time, trainer.timezone);
    const [lesson] = await tx
      .insert(lessons)
      .values({
        trainerId: trainer.id,
        seriesId,
        sessionType: input.sessionType,
        startsAt,
        endsAt: sql`${startsAt} + make_interval(mins => ${input.durationMinutes})`,
        notes: input.note,
      })
      .returning({ id: lessons.id });
    firstId ??= lesson.id;

    for (const clientId of input.clientIds) {
      const clientPackageId = await pickPackage(tx, clientId, input.sessionType);
      await tx.insert(lessonAttendees).values({
        trainerId: trainer.id,
        lessonId: lesson.id,
        clientId,
        clientPackageId,
        status: input.status,
        markedAt: input.status === "scheduled" ? null : new Date(),
      });
    }
  }
  return firstId!;
}

export type CalendarLesson = Awaited<ReturnType<typeof getLessons>>[number];
export type CalendarAttendee = CalendarLesson["attendees"][number];

/** Lessons starting on `from`…`to` (inclusive, trainer's local dates), with attendees and balances. */
export async function getLessons(
  tx: Tx,
  trainer: TrainerRef,
  { from, to, includeCancelled = false }: { from: string; to: string; includeCancelled?: boolean },
) {
  const tz = trainer.timezone;
  const rangeStart = sql`(${from}::date::timestamp at time zone ${tz})`;
  const rangeEnd = sql`((${to}::date + 1)::timestamp at time zone ${tz})`;
  const local = sql`(${lessons.startsAt} at time zone ${tz})`;

  const rows = await tx
    .select({
      lessonId: lessons.id,
      seriesId: lessons.seriesId,
      title: lessons.title,
      notes: lessons.notes,
      sessionType: lessons.sessionType,
      lessonStatus: lessons.status,
      bookedByClient: lessons.bookedByClient,
      groupClassId: lessons.groupClassId,
      capacity: lessons.capacity,
      startsAt: lessons.startsAt,
      endsAt: lessons.endsAt,
      localDate: sql<string>`to_char(${local}, 'YYYY-MM-DD')`,
      startMinute: sql<number>`(extract(hour from ${local}) * 60 + extract(minute from ${local}))::int`,
      durationMinutes: sql<number>`(extract(epoch from ${lessons.endsAt} - ${lessons.startsAt}) / 60)::int`,
      attendeeId: lessonAttendees.id,
      clientId: clients.id,
      clientName: clients.fullName,
      clientPhone: clients.phone,
      attendance: lessonAttendees.status,
      makeupUsed: lessonAttendees.makeupUsed,
      packageName: clientPackages.name,
      remaining: clientPackageBalances.remainingSessions,
    })
    .from(lessons)
    .leftJoin(lessonAttendees, eq(lessonAttendees.lessonId, lessons.id))
    .leftJoin(clients, eq(clients.id, lessonAttendees.clientId))
    .leftJoin(clientPackages, eq(clientPackages.id, lessonAttendees.clientPackageId))
    .leftJoin(clientPackageBalances, eq(clientPackageBalances.clientPackageId, lessonAttendees.clientPackageId))
    .where(
      and(
        eq(lessons.trainerId, trainer.id),
        includeCancelled ? undefined : eq(lessons.status, "scheduled"),
        gte(lessons.startsAt, rangeStart),
        lt(lessons.startsAt, rangeEnd),
      ),
    )
    .orderBy(asc(lessons.startsAt), asc(clients.fullName));

  type Row = (typeof rows)[number];
  type Attendee = {
    id: string;
    clientId: string;
    name: string;
    phone: string | null;
    status: NonNullable<Row["attendance"]>;
    makeupUsed: boolean;
    packageName: string | null;
    remaining: number | null;
  };
  type Lesson = Omit<Row, "attendeeId" | "clientId" | "clientName" | "clientPhone" | "attendance" | "makeupUsed" | "packageName" | "remaining"> & {
    attendees: Attendee[];
  };

  const byLesson = new Map<string, Lesson>();
  for (const r of rows) {
    const { attendeeId, clientId, clientName, clientPhone, attendance, makeupUsed, packageName, remaining, ...lesson } = r;
    const entry = byLesson.get(r.lessonId) ?? { ...lesson, attendees: [] };
    if (attendeeId && clientId && attendance) {
      entry.attendees.push({
        id: attendeeId,
        clientId,
        name: clientName ?? "",
        phone: clientPhone,
        status: attendance,
        makeupUsed: makeupUsed ?? false,
        packageName,
        remaining,
      });
    }
    byLesson.set(r.lessonId, entry);
  }
  return [...byLesson.values()];
}

/** One lesson by id with attendees, or null. */
export async function getLesson(tx: Tx, trainer: TrainerRef, lessonId: string) {
  const [row] = await tx
    .select({ startsAt: lessons.startsAt })
    .from(lessons)
    .where(and(eq(lessons.id, lessonId), eq(lessons.trainerId, trainer.id)));
  if (!row) return null;
  const local = new Intl.DateTimeFormat("en-CA", { timeZone: trainer.timezone }).format(row.startsAt);
  const list = await getLessons(tx, trainer, { from: local, to: local, includeCancelled: true });
  return list.find((l) => l.lessonId === lessonId) ?? null;
}

/**
 * Cancels a lesson (trainer-side, so nobody's credit is used). With
 * `following`, also cancels every later lesson of the same series.
 */
export async function cancelLessons(tx: Tx, trainerId: string, lessonId: string, { following = false } = {}) {
  const [lesson] = await tx
    .select({ seriesId: lessons.seriesId, startsAt: lessons.startsAt })
    .from(lessons)
    .where(and(eq(lessons.id, lessonId), eq(lessons.trainerId, trainerId)));
  if (!lesson) return 0;

  const target =
    following && lesson.seriesId
      ? and(eq(lessons.seriesId, lesson.seriesId), gte(lessons.startsAt, lesson.startsAt), eq(lessons.status, "scheduled"))
      : eq(lessons.id, lessonId);

  const cancelled = await tx
    .update(lessons)
    .set({ status: "cancelled" })
    .where(and(eq(lessons.trainerId, trainerId), target))
    .returning({ id: lessons.id });
  if (cancelled.length > 0) {
    await tx
      .update(lessonAttendees)
      .set({ status: "cancelled", makeupUsed: false, markedAt: new Date() })
      .where(inArray(lessonAttendees.lessonId, cancelled.map((l) => l.id)));
  }
  return cancelled.length;
}

/** Undoes a trainer-side cancel: the lesson and its attendees go back to scheduled. */
export async function restoreLesson(tx: Tx, trainerId: string, lessonId: string) {
  const [lesson] = await tx
    .update(lessons)
    .set({ status: "scheduled" })
    .where(and(eq(lessons.id, lessonId), eq(lessons.trainerId, trainerId), eq(lessons.status, "cancelled")))
    .returning({ id: lessons.id });
  if (!lesson) return false;
  await tx
    .update(lessonAttendees)
    .set({ status: "scheduled", markedAt: null })
    .where(and(eq(lessonAttendees.lessonId, lessonId), eq(lessonAttendees.status, "cancelled")));
  return true;
}

export async function rescheduleLesson(
  tx: Tx,
  trainer: TrainerRef,
  lessonId: string,
  { date, time, durationMinutes }: { date: string; time: string; durationMinutes: number },
) {
  const startsAt = localToTs(date, time, trainer.timezone);
  const [row] = await tx
    .update(lessons)
    .set({ startsAt, endsAt: sql`${startsAt} + make_interval(mins => ${durationMinutes})` })
    .where(and(eq(lessons.id, lessonId), eq(lessons.trainerId, trainer.id)))
    .returning({ id: lessons.id });
  return !!row;
}

export type AttendanceResult = { status: AttendanceStatus; makeupUsed: boolean; remaining: number | null };

/**
 * Marks attendance. A late cancel is forgiven automatically while the
 * package still has makeup allowance left; otherwise it burns the lesson.
 */
export async function setAttendance(
  tx: Tx,
  trainerId: string,
  attendeeId: string,
  status: AttendanceStatus,
): Promise<AttendanceResult | null> {
  const [attendee] = await tx
    .select({ id: lessonAttendees.id, clientPackageId: lessonAttendees.clientPackageId })
    .from(lessonAttendees)
    .where(and(eq(lessonAttendees.id, attendeeId), eq(lessonAttendees.trainerId, trainerId)));
  if (!attendee) return null;

  let makeupUsed = false;
  if (status === "late_cancel" && attendee.clientPackageId) {
    // Lock the package so two late cancels can't both take the last makeup.
    const [pkg] = await tx
      .select({ makeupAllowance: clientPackages.makeupAllowance })
      .from(clientPackages)
      .where(eq(clientPackages.id, attendee.clientPackageId))
      .for("update");
    if (pkg && pkg.makeupAllowance > 0) {
      const [{ used }] = await tx
        .select({ used: sql<number>`count(*)::int` })
        .from(lessonAttendees)
        .where(
          and(
            eq(lessonAttendees.clientPackageId, attendee.clientPackageId),
            eq(lessonAttendees.makeupUsed, true),
            ne(lessonAttendees.id, attendeeId),
          ),
        );
      makeupUsed = used < pkg.makeupAllowance;
    }
  }

  await tx
    .update(lessonAttendees)
    .set({ status, makeupUsed, markedAt: status === "scheduled" ? null : new Date() })
    .where(eq(lessonAttendees.id, attendeeId));

  let remaining: number | null = null;
  if (attendee.clientPackageId) {
    const [row] = await tx
      .select({ remaining: clientPackageBalances.remainingSessions })
      .from(clientPackageBalances)
      .where(eq(clientPackageBalances.clientPackageId, attendee.clientPackageId));
    remaining = row?.remaining ?? null;
  }
  return { status, makeupUsed, remaining };
}

export async function listClientOptions(tx: Tx, trainerId: string) {
  const rows = await tx
    .select({ id: clients.id, fullName: clients.fullName })
    .from(clients)
    .where(and(eq(clients.trainerId, trainerId), eq(clients.status, "active"), sql`${clients.archivedAt} is null`));
  return rows.sort((a, b) => a.fullName.localeCompare(b.fullName, "tr"));
}
