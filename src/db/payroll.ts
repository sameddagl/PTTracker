import "server-only";
import { and, asc, eq, gte, lt, sql } from "drizzle-orm";
import { computePayroll, monthRange, type PayrollLessonInput, type PayrollSummary } from "@/lib/payroll";
import type { Tx } from "./index";
import { clientPackages, lessonAttendees, lessons, payrollMonths } from "./schema";
import { listMembers, type TeamMember } from "./team";

// Instructor pay for a month: open months are computed from the lessons as
// they are now; a closed month is the stored snapshot (payroll_months).

/** The month's lessons per instructor, with what each counted client's lesson was worth. */
async function monthLessons(tx: Tx, accountId: string, month: string, tz: string, memberId?: string) {
  const { from, to } = monthRange(month);
  const rows = await tx
    .select({
      lessonId: lessons.id,
      instructorId: lessons.instructorId,
      startsAt: lessons.startsAt,
      sessionType: lessons.sessionType,
      status: lessonAttendees.status,
      packagePrice: clientPackages.price,
      packageLessons: clientPackages.totalSessions,
    })
    .from(lessons)
    .leftJoin(lessonAttendees, eq(lessonAttendees.lessonId, lessons.id))
    .leftJoin(clientPackages, eq(clientPackages.id, lessonAttendees.clientPackageId))
    .where(
      and(
        eq(lessons.trainerId, accountId),
        eq(lessons.status, "scheduled"),
        memberId ? eq(lessons.instructorId, memberId) : undefined,
        gte(lessons.startsAt, sql`(${from}::date::timestamp at time zone ${tz})`),
        lt(lessons.startsAt, sql`(${to}::date::timestamp at time zone ${tz})`),
      ),
    )
    .orderBy(asc(lessons.startsAt));

  const byInstructor = new Map<string, Map<string, PayrollLessonInput>>();
  for (const r of rows) {
    if (!r.instructorId) continue;
    const mine = byInstructor.get(r.instructorId) ?? byInstructor.set(r.instructorId, new Map()).get(r.instructorId)!;
    const lesson = mine.get(r.lessonId) ?? mine.set(r.lessonId, { id: r.lessonId, startsAt: r.startsAt, sessionType: r.sessionType, attendees: [] }).get(r.lessonId)!;
    if (r.status) lesson.attendees.push({ status: r.status, packagePrice: r.packagePrice === null ? null : Number(r.packagePrice), packageLessons: r.packageLessons });
  }
  return new Map([...byInstructor].map(([id, m]) => [id, [...m.values()]]));
}

export type PayrollRow = {
  member: TeamMember;
  summary: PayrollSummary;
  closed: { id: string; closedAt: Date; paidAt: Date | null } | null;
};

/**
 * Pay for every instructor (or just `memberId`) in a month. Closed months
 * come from the snapshot; the owner has no pay rule and is left out.
 */
export async function payrollFor(tx: Tx, accountId: string, month: string, opts: { tz: string; countsMissed: boolean; memberId?: string }): Promise<PayrollRow[]> {
  const members = (await listMembers(tx, accountId, { includeInactive: true })).filter((m) => m.role === "instructor" && (!opts.memberId || m.id === opts.memberId));
  if (members.length === 0) return [];
  const closedRows = await tx
    .select()
    .from(payrollMonths)
    .where(and(eq(payrollMonths.trainerId, accountId), eq(payrollMonths.month, monthRange(month).from)));
  const closedBy = new Map(closedRows.map((c) => [c.memberId, c]));
  const live = await monthLessons(tx, accountId, month, opts.tz, opts.memberId);

  return members
    .map((member): PayrollRow => {
      const c = closedBy.get(member.id);
      if (c) return { member, summary: c.detail as PayrollSummary, closed: { id: c.id, closedAt: c.closedAt, paidAt: c.paidAt } };
      return { member, summary: computePayroll(live.get(member.id) ?? [], member.payRule, opts.countsMissed), closed: null };
    })
    .filter((r) => r.member.active || r.summary.lessons > 0 || r.closed);
}

/** Freezes a month's pay for one instructor. Returns false if it was already closed. */
export async function closePayrollMonth(tx: Tx, accountId: string, memberId: string, month: string, summary: PayrollSummary) {
  const rows = await tx
    .insert(payrollMonths)
    .values({ trainerId: accountId, memberId, month: monthRange(month).from, lessons: summary.lessons, amount: summary.amount.toFixed(2), detail: summary })
    .onConflictDoNothing()
    .returning({ id: payrollMonths.id });
  return rows.length > 0;
}

export async function reopenPayrollMonth(tx: Tx, accountId: string, id: string) {
  const rows = await tx
    .delete(payrollMonths)
    .where(and(eq(payrollMonths.id, id), eq(payrollMonths.trainerId, accountId), sql`${payrollMonths.paidAt} is null`))
    .returning({ id: payrollMonths.id });
  return rows.length > 0;
}

export async function setPayrollPaid(tx: Tx, accountId: string, id: string, paid: boolean) {
  const rows = await tx
    .update(payrollMonths)
    .set({ paidAt: paid ? new Date() : null })
    .where(and(eq(payrollMonths.id, id), eq(payrollMonths.trainerId, accountId)))
    .returning({ id: payrollMonths.id });
  return rows.length > 0;
}
