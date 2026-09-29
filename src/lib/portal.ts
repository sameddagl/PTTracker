import "server-only";
import { and, asc, desc, eq, gte, inArray, isNull, lt, or } from "drizzle-orm";
import { adminDb, type Tx } from "@/db";
import { getBookingView, upcomingForClient } from "@/db/booking";
import { PORTAL_TOKEN_PATTERN, hashToken } from "@/db/portal";
import {
  applications,
  clientPackageBalances,
  clientPackages,
  clients,
  lessonAttendees,
  lessons,
  packageTemplates,
  payments,
  portalTokens,
  trainers,
} from "@/db/schema";
import { siteUrl } from "./config";

export const portalUrl = (token: string) => `${siteUrl()}/p/${token}`;

/** The client and trainer a portal token belongs to, or null. */
export async function resolvePortalToken(token: string) {
  if (!PORTAL_TOKEN_PATTERN.test(token)) return null;
  const [link] = await adminDb
    .select({ clientId: portalTokens.clientId, trainerId: portalTokens.trainerId })
    .from(portalTokens)
    .where(and(eq(portalTokens.tokenHash, hashToken(token)), isNull(portalTokens.revokedAt)));
  return link ?? null;
}

/**
 * Resolves a portal token without a signed-in user. Uses adminDb (no RLS), so
 * every query below is filtered by the client id bound to the token.
 */
export async function getPortalData(token: string) {
  if (!PORTAL_TOKEN_PATTERN.test(token)) return null;

  const [link] = await adminDb
    .select({ id: portalTokens.id, clientId: portalTokens.clientId, trainerId: portalTokens.trainerId })
    .from(portalTokens)
    .where(and(eq(portalTokens.tokenHash, hashToken(token)), isNull(portalTokens.revokedAt)));
  if (!link) return null;

  const [client] = await adminDb
    .select({
      fullName: clients.fullName,
      trainerName: trainers.fullName,
      businessName: trainers.businessName,
      trainerPhone: trainers.phone,
      timezone: trainers.timezone,
      iban: trainers.iban,
      ibanHolder: trainers.ibanHolder,
    })
    .from(clients)
    .innerJoin(trainers, eq(trainers.id, clients.trainerId))
    // A rejected applicant is archived but should still see why their link shows no package.
    .where(and(eq(clients.id, link.clientId), or(isNull(clients.archivedAt), eq(clients.status, "applicant"))));
  if (!client) return null;

  const packages = await adminDb
    .select({
      id: clientPackages.id,
      name: clientPackages.name,
      total: clientPackages.totalSessions,
      price: clientPackages.price,
      startsOn: clientPackages.startsOn,
      installments: clientPackages.installments,
      paid: clientPackageBalances.paidAmount,
      remaining: clientPackageBalances.remainingSessions,
      expiresOn: clientPackageBalances.effectiveExpiresOn,
      due: clientPackageBalances.dueAmount,
      state: clientPackageBalances.state,
    })
    .from(clientPackages)
    .innerJoin(clientPackageBalances, eq(clientPackageBalances.clientPackageId, clientPackages.id))
    .where(and(eq(clientPackages.clientId, link.clientId), inArray(clientPackageBalances.state, ["active", "frozen"])))
    .orderBy(desc(clientPackages.startsOn));

  const now = new Date();
  const lessonRows = (when: "upcoming" | "past") =>
    adminDb
      .select({
        id: lessonAttendees.id,
        startsAt: lessons.startsAt,
        sessionType: lessons.sessionType,
        status: lessonAttendees.status,
        makeupUsed: lessonAttendees.makeupUsed,
      })
      .from(lessonAttendees)
      .innerJoin(lessons, eq(lessons.id, lessonAttendees.lessonId))
      .where(
        and(
          eq(lessonAttendees.clientId, link.clientId),
          eq(lessons.status, "scheduled"),
          when === "upcoming"
            ? and(eq(lessonAttendees.status, "scheduled"), gte(lessons.startsAt, now))
            : and(inArray(lessonAttendees.status, ["attended", "no_show", "late_cancel"]), lt(lessons.startsAt, now)),
        ),
      )
      .orderBy(when === "upcoming" ? asc(lessons.startsAt) : desc(lessons.startsAt))
      .limit(5);

  const upcoming = await lessonRows("upcoming");
  const recent = await lessonRows("past");

  // The latest sign-up from the public page, to show "waiting for approval".
  const [application] = await adminDb
    .select({
      status: applications.status,
      createdAt: applications.createdAt,
      packageName: packageTemplates.name,
      price: packageTemplates.price,
    })
    .from(applications)
    .innerJoin(packageTemplates, eq(packageTemplates.id, applications.templateId))
    .where(eq(applications.clientId, link.clientId))
    .orderBy(desc(applications.createdAt))
    .limit(1);

  // Transfers this client reported that are waiting, or were turned down recently.
  const reported = await adminDb
    .select({
      id: payments.id,
      clientPackageId: payments.clientPackageId,
      amount: payments.amount,
      paidOn: payments.paidOn,
      status: payments.status,
      rejectReason: payments.rejectReason,
    })
    .from(payments)
    .where(
      and(
        eq(payments.clientId, link.clientId),
        eq(payments.reportedBy, "client"),
        or(eq(payments.status, "pending"), and(eq(payments.status, "rejected"), gte(payments.reviewedAt, new Date(Date.now() - 14 * 86_400_000)))),
      ),
    )
    .orderBy(desc(payments.createdAt));

  const who = { trainerId: link.trainerId, clientId: link.clientId };
  const { booking, bookable } = await adminDb.transaction(async (tx) => ({
    booking: await getBookingView(tx as unknown as Tx, who),
    bookable: await upcomingForClient(tx as unknown as Tx, who),
  }));

  await adminDb.update(portalTokens).set({ lastUsedAt: now }).where(eq(portalTokens.id, link.id));

  return { client, packages, upcoming, recent, application: application ?? null, reported, booking, bookable };
}
