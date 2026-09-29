import "server-only";
import { asc, eq, sql } from "drizzle-orm";
import type { Tx } from "./index";
import { clientPackageBalances, clientPackages, clients, intakeAnswers, lessonAttendees, lessons, payments } from "./schema";
import type { ExportData } from "@/lib/export";

type TrainerRef = { id: string; timezone: string };

/** Everything the trainer owns, as plain rows for buildExportWorkbook(). Queries run one after another (one connection per transaction). */
export async function loadExportData(tx: Tx, trainer: TrainerRef): Promise<ExportData> {
  const trainerId = trainer.id;
  const tz = trainer.timezone;

  const clientRows = await tx
    .select({
      fullName: clients.fullName,
      phone: clients.phone,
      email: clients.email,
      goals: clients.goals,
      notes: clients.notes,
      healthNotes: clients.healthNotes,
      status: clients.status,
      archivedAt: clients.archivedAt,
      createdAt: clients.createdAt,
    })
    .from(clients)
    .where(eq(clients.trainerId, trainerId));

  const packageRows = await tx
    .select({
      clientName: clients.fullName,
      name: clientPackages.name,
      sessionType: clientPackages.sessionType,
      totalSessions: clientPackages.totalSessions,
      usedSessions: clientPackageBalances.usedSessions,
      remainingSessions: clientPackageBalances.remainingSessions,
      startsOn: clientPackages.startsOn,
      expiresOn: clientPackageBalances.effectiveExpiresOn,
      price: clientPackages.price,
      paid: clientPackageBalances.paidAmount,
      due: clientPackageBalances.dueAmount,
      state: clientPackageBalances.state,
    })
    .from(clientPackages)
    .innerJoin(clientPackageBalances, eq(clientPackageBalances.clientPackageId, clientPackages.id))
    .innerJoin(clients, eq(clients.id, clientPackages.clientId))
    .where(eq(clientPackages.trainerId, trainerId))
    .orderBy(asc(clients.fullName), asc(clientPackages.startsOn));

  const local = sql`(${lessons.startsAt} at time zone ${tz})`;
  const lessonRows = await tx
    .select({
      date: sql<string>`to_char(${local}, 'YYYY-MM-DD')`,
      time: sql<string>`to_char(${local}, 'HH24:MI')`,
      durationMinutes: sql<number>`(extract(epoch from ${lessons.endsAt} - ${lessons.startsAt}) / 60)::int`,
      sessionType: lessons.sessionType,
      title: lessons.title,
      lessonStatus: lessons.status,
      clientName: clients.fullName,
      attendance: lessonAttendees.status,
    })
    .from(lessons)
    .leftJoin(lessonAttendees, eq(lessonAttendees.lessonId, lessons.id))
    .leftJoin(clients, eq(clients.id, lessonAttendees.clientId))
    .where(eq(lessons.trainerId, trainerId))
    .orderBy(asc(lessons.startsAt), asc(clients.fullName));

  const paymentRows = await tx
    .select({
      paidOn: payments.paidOn,
      clientName: clients.fullName,
      packageName: clientPackages.name,
      amount: payments.amount,
      method: payments.method,
      status: payments.status,
      reportedBy: payments.reportedBy,
      note: payments.note,
    })
    .from(payments)
    .innerJoin(clients, eq(clients.id, payments.clientId))
    .leftJoin(clientPackages, eq(clientPackages.id, payments.clientPackageId))
    .where(eq(payments.trainerId, trainerId))
    .orderBy(asc(payments.paidOn), asc(payments.createdAt));

  const answerRows = await tx
    .select({
      clientName: clients.fullName,
      label: intakeAnswers.label,
      type: intakeAnswers.type,
      unit: intakeAnswers.unit,
      isHealth: intakeAnswers.isHealth,
      valueText: intakeAnswers.valueText,
      valueNumber: intakeAnswers.valueNumber,
      valueDate: intakeAnswers.valueDate,
      valueOptions: intakeAnswers.valueOptions,
      valueBool: intakeAnswers.valueBool,
    })
    .from(intakeAnswers)
    .innerJoin(clients, eq(clients.id, intakeAnswers.clientId))
    .where(eq(intakeAnswers.trainerId, trainerId))
    .orderBy(asc(clients.fullName), asc(intakeAnswers.sortOrder), asc(intakeAnswers.createdAt));

  return { timezone: tz, clients: clientRows, packages: packageRows, lessons: lessonRows, payments: paymentRows, answers: answerRows };
}
