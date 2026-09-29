import "server-only";
import { and, count, desc, eq, inArray, ne } from "drizzle-orm";
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
  packagePrice: packageTemplates.price,
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
    .select({ id: applications.id, clientId: applications.clientId, templateId: applications.templateId })
    .from(applications)
    .where(and(eq(applications.id, id), eq(applications.trainerId, trainer.id), eq(applications.status, "pending")))
    .for("update");
  if (!app) return null;

  const [t] = await tx.select().from(packageTemplates).where(eq(packageTemplates.id, app.templateId));
  const clientPackageId = await sellPackage(tx, trainer.id, {
    clientId: app.clientId,
    templateId: t.id,
    name: t.name,
    sessionType: t.sessionType,
    totalSessions: t.sessionCount,
    startsOn,
    expiresOn: expiryFor(startsOn, t.validityDays),
    price: Number(t.price ?? 0),
    makeupAllowance: t.makeupAllowance,
    installments: t.installments,
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
