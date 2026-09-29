import "server-only";
import { and, count, desc, eq, inArray, ne } from "drizzle-orm";
import { paymentOptions, pickOption } from "@/lib/pricing";
import type { Tx } from "./index";
import { expiryFor, sellPackage } from "./packages";
import { applications, clients, packageTemplates } from "./schema";

type TrainerRef = { id: string; timezone: string };

export async function countPendingApplications(tx: Tx, trainerId: string) {
  const [row] = await tx
    .select({ n: count() })
    .from(applications)
    .where(and(eq(applications.trainerId, trainerId), eq(applications.status, "pending")));
  return row?.n ?? 0;
}

const applicationFields = {
  id: applications.id,
  status: applications.status,
  message: applications.message,
  createdAt: applications.createdAt,
  decidedAt: applications.decidedAt,
  clientPackageId: applications.clientPackageId,
  clientId: clients.id,
  clientName: clients.fullName,
  clientPhone: clients.phone,
  clientEmail: clients.email,
  // "active" means the person was already the trainer's client before applying.
  clientStatus: clients.status,
  templateId: packageTemplates.id,
  packageName: packageTemplates.name,
  // Current template prices; `installments` is the option the applicant picked.
  price: packageTemplates.price,
  compareAtPrice: packageTemplates.compareAtPrice,
  installmentPrice: packageTemplates.installmentPrice,
  templateInstallments: packageTemplates.installments,
  installments: applications.installments,
  sessionCount: packageTemplates.sessionCount,
  sessionType: packageTemplates.sessionType,
};

export async function listApplications(tx: Tx, trainerId: string, { status }: { status: "pending" | "decided" }) {
  return tx
    .select(applicationFields)
    .from(applications)
    .innerJoin(clients, eq(clients.id, applications.clientId))
    .innerJoin(packageTemplates, eq(packageTemplates.id, applications.templateId))
    .where(
      and(
        eq(applications.trainerId, trainerId),
        status === "pending" ? eq(applications.status, "pending") : ne(applications.status, "pending"),
      ),
    )
    .orderBy(desc(applications.createdAt))
    .limit(status === "pending" ? 100 : 30);
}

export async function getApplication(tx: Tx, trainerId: string, id: string) {
  const [row] = await tx
    .select(applicationFields)
    .from(applications)
    .innerJoin(clients, eq(clients.id, applications.clientId))
    .innerJoin(packageTemplates, eq(packageTemplates.id, applications.templateId))
    .where(and(eq(applications.id, id), eq(applications.trainerId, trainerId)));
  return row ?? null;
}

/**
 * Approves a pending application: the client becomes active and gets the
 * package from the template (as it is now), starting on `startsOn`.
 */
export async function approveApplication(tx: Tx, trainer: TrainerRef, id: string, { startsOn }: { startsOn: string }) {
  const [app] = await tx
    .select({
      id: applications.id,
      clientId: applications.clientId,
      templateId: applications.templateId,
      installments: applications.installments,
    })
    .from(applications)
    .where(and(eq(applications.id, id), eq(applications.trainerId, trainer.id), eq(applications.status, "pending")))
    .for("update");
  if (!app) return null;

  const [t] = await tx.select().from(packageTemplates).where(eq(packageTemplates.id, app.templateId));
  // The option the applicant picked, at today's template prices.
  const option = pickOption(t, app.installments);
  const clientPackageId = await sellPackage(tx, trainer.id, {
    clientId: app.clientId,
    templateId: t.id,
    name: t.name,
    sessionType: t.sessionType,
    totalSessions: t.sessionCount,
    startsOn,
    expiresOn: expiryFor(startsOn, t.validityDays),
    price: option?.total ?? 0,
    makeupAllowance: t.makeupAllowance,
    installments: option?.installments ?? 1,
    payment: null,
  });

  await tx
    .update(applications)
    .set({ status: "approved", clientPackageId, decidedAt: new Date() })
    .where(eq(applications.id, id));
  await tx.update(clients).set({ status: "active" }).where(eq(clients.id, app.clientId));
  return { clientId: app.clientId, clientPackageId };
}

/**
 * Rejects a pending application. A person who was only an applicant (never a
 * client) is archived unless they still have another open application.
 */
export async function rejectApplication(tx: Tx, trainerId: string, id: string) {
  const [app] = await tx
    .update(applications)
    .set({ status: "rejected", decidedAt: new Date() })
    .where(and(eq(applications.id, id), eq(applications.trainerId, trainerId), eq(applications.status, "pending")))
    .returning({ clientId: applications.clientId });
  if (!app) return null;

  const [open] = await tx
    .select({ n: count() })
    .from(applications)
    .where(and(eq(applications.clientId, app.clientId), inArray(applications.status, ["pending", "approved"])));
  if (open.n === 0) {
    await tx
      .update(clients)
      .set({ archivedAt: new Date() })
      .where(and(eq(clients.id, app.clientId), eq(clients.status, "applicant")));
  }
  return { clientId: app.clientId };
}

export type RequestResult =
  | { ok: true; packageName: string }
  | { ok: false; reason: "not_found" | "already" | "limited" | "option" };

/**
 * An existing client asks for another package from their portal. Same review
 * as a sign-up (the trainer approves), without the form: answers and consents
 * are already on file.
 */
export async function requestPackage(
  tx: Tx,
  who: { trainerId: string; clientId: string },
  { templateId, installments }: { templateId: string; installments: number },
): Promise<RequestResult> {
  const [t] = await tx
    .select()
    .from(packageTemplates)
    .where(
      and(
        eq(packageTemplates.id, templateId),
        eq(packageTemplates.trainerId, who.trainerId),
        eq(packageTemplates.isActive, true),
        eq(packageTemplates.isPublic, true),
      ),
    );
  if (!t) return { ok: false, reason: "not_found" };
  const options = paymentOptions(t);
  if (options.length > 0 && !options.some((o) => o.installments === installments)) return { ok: false, reason: "option" };

  const mine = await tx
    .select({ templateId: applications.templateId, status: applications.status, createdAt: applications.createdAt })
    .from(applications)
    .where(and(eq(applications.clientId, who.clientId), eq(applications.trainerId, who.trainerId)));
  if (mine.some((a) => a.status === "pending" && a.templateId === templateId)) return { ok: false, reason: "already" };
  // Same cap as sign-ups: three requests a day per person.
  if (mine.filter((a) => a.createdAt.getTime() > Date.now() - 86_400_000).length >= 3) return { ok: false, reason: "limited" };

  await tx.insert(applications).values({
    trainerId: who.trainerId,
    clientId: who.clientId,
    templateId,
    installments: options.length > 0 ? installments : 1,
  });
  return { ok: true, packageName: t.name };
}
