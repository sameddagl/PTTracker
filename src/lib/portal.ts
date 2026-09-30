import "server-only";
import { and, asc, desc, eq, gte, inArray, isNull, lt, or } from "drizzle-orm";
import { adminDb, type Tx } from "@/db";
import { getBookingView, upcomingForClient } from "@/db/booking";
import { renewablePackages } from "@/db/engagement";
import { getClientThread } from "@/db/messages";
import { getGroupView } from "@/db/groups";
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
      notifyPrefs: clients.notifyPrefs,
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

  // Recent applications: the pending ones show as "waiting for approval", the latest decides the rejected message.
  const appRows = await adminDb
    .select({
      id: applications.id,
      templateId: applications.templateId,
      status: applications.status,
      createdAt: applications.createdAt,
      packageName: packageTemplates.name,
      price: packageTemplates.price,
      compareAtPrice: packageTemplates.compareAtPrice,
      installmentPrice: packageTemplates.installmentPrice,
      templateInstallments: packageTemplates.installments,
      installments: applications.installments,
    })
    .from(applications)
    .innerJoin(packageTemplates, eq(packageTemplates.id, applications.templateId))
    .where(eq(applications.clientId, link.clientId))
    .orderBy(desc(applications.createdAt))
    .limit(10);
  const application = appRows[0];
  const pendingApplications = appRows.filter((a) => a.status === "pending");

  // What the client can buy next, in the trainer's own order.
  const offers = await adminDb
    .select({
      id: packageTemplates.id,
      name: packageTemplates.name,
      sessionType: packageTemplates.sessionType,
      sessionCount: packageTemplates.sessionCount,
      validityDays: packageTemplates.validityDays,
      price: packageTemplates.price,
      compareAtPrice: packageTemplates.compareAtPrice,
      installmentPrice: packageTemplates.installmentPrice,
      installments: packageTemplates.installments,
      isTrial: packageTemplates.isTrial,
    })
    .from(packageTemplates)
    .where(and(eq(packageTemplates.trainerId, link.trainerId), eq(packageTemplates.isActive, true), eq(packageTemplates.isPublic, true)))
    .orderBy(asc(packageTemplates.sortOrder), asc(packageTemplates.createdAt));

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
  const { groups, booking, bookable, messages } = await adminDb.transaction(async (tx) => ({
    // First: it creates this week's group lessons and places fixed members, which the list below shows.
    groups: await getGroupView(tx as unknown as Tx, who),
    booking: await getBookingView(tx as unknown as Tx, who),
    bookable: await upcomingForClient(tx as unknown as Tx, who),
    messages: await getClientThread(tx as unknown as Tx, who),
  }));
  const renewable = await renewablePackages(adminDb as unknown as Tx, who, client.timezone);
  // Trials are for newcomers: hide them once the client has a package or has applied.
  const [anyPackage] = await adminDb
    .select({ id: clientPackages.id })
    .from(clientPackages)
    .where(eq(clientPackages.clientId, link.clientId))
    .limit(1);
  const newcomer = !anyPackage && appRows.every((a) => a.status === "rejected");

  await adminDb.update(portalTokens).set({ lastUsedAt: now }).where(eq(portalTokens.id, link.id));

  return {
    client,
    packages,
    upcoming,
    recent,
    application: application ?? null,
    pendingApplications,
    offers: offers.filter((o) => newcomer || !o.isTrial),
    renewable,
    messages,
    reported,
    booking,
    bookable,
    groups,
  };
}
