import "server-only";
import { and, asc, eq, gte, inArray, isNull, lt, or, sql } from "drizzle-orm";
import type { Tx } from "./index";
import { clientPackageBalances, clientPackages, clients, lessonAttendees, lessons, trainers } from "./schema";

// All functions take a Tx from withTrainer(), so RLS scopes every query to
// the signed-in trainer. The trainer_id filters are for index use, not security.

type TrainerRef = { id: string; timezone: string };

const todayIn = (tz: string) => sql`(now() at time zone ${tz})::date`;

export async function getTrainer(tx: Tx, trainerId: string) {
  const [row] = await tx.select().from(trainers).where(eq(trainers.id, trainerId));
  return row;
}

export type TodayLesson = Awaited<ReturnType<typeof getTodayLessons>>[number];
export type TodayAttendee = TodayLesson["attendees"][number];

export async function getTodayLessons(tx: Tx, trainer: TrainerRef) {
  const trainerId = trainer.id;
  // Midnight-to-midnight in the trainer's timezone.
  const dayStart = sql`(date_trunc('day', now() at time zone ${trainer.timezone}) at time zone ${trainer.timezone})`;

  const rows = await tx
    .select({
      lessonId: lessons.id,
      title: lessons.title,
      sessionType: lessons.sessionType,
      startsAt: lessons.startsAt,
      endsAt: lessons.endsAt,
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
        eq(lessons.trainerId, trainerId),
        eq(lessons.status, "scheduled"),
        gte(lessons.startsAt, dayStart),
        lt(lessons.startsAt, sql`${dayStart} + interval '1 day'`),
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
  const byLesson = new Map<string, Pick<Row, "lessonId" | "title" | "sessionType" | "startsAt" | "endsAt"> & { attendees: Attendee[] }>();
  for (const r of rows) {
    const lesson = byLesson.get(r.lessonId) ?? {
      lessonId: r.lessonId,
      title: r.title,
      sessionType: r.sessionType,
      startsAt: r.startsAt,
      endsAt: r.endsAt,
      attendees: [],
    };
    if (r.attendeeId && r.clientId && r.attendance) {
      lesson.attendees.push({
        id: r.attendeeId,
        clientId: r.clientId,
        name: r.clientName ?? "",
        phone: r.clientPhone,
        status: r.attendance,
        makeupUsed: r.makeupUsed ?? false,
        packageName: r.packageName,
        remaining: r.remaining,
      });
    }
    byLesson.set(r.lessonId, lesson);
  }
  return [...byLesson.values()];
}

export type PackageAlert = Awaited<ReturnType<typeof getPackageAlerts>>[number];

/** Live packages that are nearly used up, about to expire, or not fully paid. */
export async function getPackageAlerts(tx: Tx, trainer: TrainerRef) {
  const trainerId = trainer.id;
  const today = todayIn(trainer.timezone);
  return tx
    .select({
      clientPackageId: clientPackageBalances.clientPackageId,
      clientId: clients.id,
      clientName: clients.fullName,
      clientPhone: clients.phone,
      packageName: clientPackages.name,
      remaining: clientPackageBalances.remainingSessions,
      expiresOn: clientPackageBalances.effectiveExpiresOn,
      due: clientPackageBalances.dueAmount,
      state: clientPackageBalances.state,
      lowBalance: sql<boolean>`${clientPackageBalances.remainingSessions} <= 2`,
      expiringSoon: sql<boolean>`coalesce(${clientPackageBalances.effectiveExpiresOn} <= ${today} + 7, false)`,
      hasDebt: sql<boolean>`${clientPackageBalances.dueAmount} > 0`,
    })
    .from(clientPackageBalances)
    .innerJoin(clientPackages, eq(clientPackages.id, clientPackageBalances.clientPackageId))
    .innerJoin(clients, eq(clients.id, clientPackageBalances.clientId))
    .where(
      and(
        eq(clientPackageBalances.trainerId, trainerId),
        isNull(clients.archivedAt),
        inArray(clientPackageBalances.state, ["active", "frozen"]),
        or(
          sql`${clientPackageBalances.remainingSessions} <= 2`,
          sql`${clientPackageBalances.effectiveExpiresOn} <= ${today} + 7`,
          sql`${clientPackageBalances.dueAmount} > 0`,
        ),
      ),
    )
    .orderBy(asc(clientPackageBalances.remainingSessions), asc(clients.fullName));
}

export async function listClients(tx: Tx, trainerId: string) {
  const rows = await tx
    .select({ id: clients.id, fullName: clients.fullName, phone: clients.phone, tags: clients.tags })
    .from(clients)
    .where(and(eq(clients.trainerId, trainerId), isNull(clients.archivedAt)));
  rows.sort((a, b) => a.fullName.localeCompare(b.fullName, "tr"));

  if (rows.length === 0) return [];

  const packages = await tx
    .select({
      clientId: clientPackageBalances.clientId,
      name: clientPackages.name,
      remaining: clientPackageBalances.remainingSessions,
      total: clientPackages.totalSessions,
      state: clientPackageBalances.state,
      due: clientPackageBalances.dueAmount,
    })
    .from(clientPackageBalances)
    .innerJoin(clientPackages, eq(clientPackages.id, clientPackageBalances.clientPackageId))
    .where(
      and(
        eq(clientPackageBalances.trainerId, trainerId),
        inArray(clientPackageBalances.state, ["active", "frozen"]),
      ),
    )
    .orderBy(asc(clientPackages.startsOn));

  const byClient = new Map<string, typeof packages>();
  for (const p of packages) byClient.set(p.clientId, [...(byClient.get(p.clientId) ?? []), p]);
  return rows.map((c) => ({ ...c, packages: byClient.get(c.id) ?? [] }));
}
