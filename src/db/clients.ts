import "server-only";
import { and, eq, gt, inArray, isNotNull, isNull, notExists, sql } from "drizzle-orm";
import type { Tx } from "./index";
import { revokePortalLinks } from "./portal";
import { applications, clients, lessonAttendees, lessons } from "./schema";

/** Lessons the client is booked into that haven't started yet. */
const upcomingAttendance = (tx: Tx, clientId: string) =>
  and(
    eq(lessonAttendees.clientId, clientId),
    eq(lessonAttendees.status, "scheduled"),
    inArray(
      lessonAttendees.lessonId,
      tx
        .select({ id: lessons.id })
        .from(lessons)
        .where(and(gt(lessons.startsAt, sql`now()`), eq(lessons.status, "scheduled"))),
    ),
  );

/** Deletes the given lessons that are left with nobody booked into them. */
async function deleteEmptyLessons(tx: Tx, trainerId: string, lessonIds: string[]) {
  if (lessonIds.length === 0) return;
  await tx
    .delete(lessons)
    .where(
      and(
        eq(lessons.trainerId, trainerId),
        inArray(lessons.id, lessonIds),
        notExists(tx.select({ id: lessonAttendees.id }).from(lessonAttendees).where(eq(lessonAttendees.lessonId, lessons.id))),
      ),
    );
}

export async function countUpcomingLessons(tx: Tx, clientId: string) {
  const rows = await tx.select({ id: lessonAttendees.id }).from(lessonAttendees).where(upcomingAttendance(tx, clientId));
  return rows.length;
}

/**
 * Takes a client off the lists while keeping their history. Their future
 * bookings are dropped (a lesson nobody else is in is removed), open
 * applications are closed and the portal link stops working.
 */
export async function archiveClient(tx: Tx, trainerId: string, clientId: string) {
  const [row] = await tx
    .update(clients)
    .set({ archivedAt: new Date() })
    .where(and(eq(clients.id, clientId), eq(clients.trainerId, trainerId), isNull(clients.archivedAt)))
    .returning({ id: clients.id });
  if (!row) return false;

  const dropped = await tx
    .delete(lessonAttendees)
    .where(upcomingAttendance(tx, clientId))
    .returning({ lessonId: lessonAttendees.lessonId });
  await deleteEmptyLessons(tx, trainerId, dropped.map((d) => d.lessonId));
  await tx
    .update(applications)
    .set({ status: "rejected", decidedAt: new Date() })
    .where(and(eq(applications.clientId, clientId), eq(applications.status, "pending")));
  await revokePortalLinks(tx, clientId);
  return true;
}

export async function restoreClient(tx: Tx, trainerId: string, clientId: string) {
  const [row] = await tx
    .update(clients)
    .set({ archivedAt: null })
    .where(and(eq(clients.id, clientId), eq(clients.trainerId, trainerId), isNotNull(clients.archivedAt)))
    .returning({ id: clients.id });
  return Boolean(row);
}

/**
 * Erases an archived client and everything recorded about them (packages,
 * attendance, payments, receipts, answers, consents) — for KVKK deletion
 * requests. Only archived clients can be erased, so it's always two steps.
 */
export async function deleteClient(tx: Tx, trainerId: string, clientId: string) {
  const booked = await tx
    .select({ lessonId: lessonAttendees.lessonId })
    .from(lessonAttendees)
    .where(eq(lessonAttendees.clientId, clientId));
  const [row] = await tx
    .delete(clients)
    .where(and(eq(clients.id, clientId), eq(clients.trainerId, trainerId), isNotNull(clients.archivedAt)))
    .returning({ id: clients.id });
  if (!row) return false;

  // Lessons that were only theirs would linger as empty slots.
  await deleteEmptyLessons(tx, trainerId, [...new Set(booked.map((b) => b.lessonId))]);
  return true;
}

export async function listArchivedClients(tx: Tx, trainerId: string) {
  return tx
    .select({
      id: clients.id,
      fullName: clients.fullName,
      archivedAt: clients.archivedAt,
    })
    .from(clients)
    .where(and(eq(clients.trainerId, trainerId), eq(clients.status, "active"), isNotNull(clients.archivedAt)))
    .orderBy(sql`${clients.archivedAt} desc`);
}

export async function countArchivedClients(tx: Tx, trainerId: string) {
  const rows = await tx
    .select({ n: sql<number>`count(*)::int` })
    .from(clients)
    .where(and(eq(clients.trainerId, trainerId), eq(clients.status, "active"), isNotNull(clients.archivedAt)));
  return rows[0].n;
}
