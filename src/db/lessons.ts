import "server-only";
import { and, eq, ne, sql } from "drizzle-orm";
import type { Tx } from "./index";
import { pickPackage, type SessionType } from "./packages";
import { clientPackageBalances, clientPackages, clients, lessonAttendees, lessons } from "./schema";

export type AttendanceStatus = (typeof lessonAttendees.$inferSelect)["status"];

export type LessonInput = {
  date: string; // YYYY-MM-DD in the trainer's timezone
  time: string; // HH:MM
  durationMinutes: number;
  sessionType: SessionType;
  clientIds: string[];
  /** "attended" logs a lesson that already happened in one step. */
  status: "scheduled" | "attended";
  note: string | null;
};

export async function createLesson(tx: Tx, trainer: { id: string; timezone: string }, input: LessonInput) {
  // Wall-clock time in the trainer's timezone → timestamptz.
  const startsAt = sql`((${input.date}::date + ${input.time}::time) at time zone ${trainer.timezone})`;

  const [lesson] = await tx
    .insert(lessons)
    .values({
      trainerId: trainer.id,
      sessionType: input.sessionType,
      startsAt,
      endsAt: sql`${startsAt} + make_interval(mins => ${input.durationMinutes})`,
      notes: input.note,
    })
    .returning({ id: lessons.id });

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
  return lesson.id;
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
    .where(and(eq(clients.trainerId, trainerId), sql`${clients.archivedAt} is null`));
  return rows.sort((a, b) => a.fullName.localeCompare(b.fullName, "tr"));
}
