import "server-only";
import { and, asc, eq, inArray, isNull, or, sql } from "drizzle-orm";
import type { Tx } from "./index";
import { clientPackageBalances, clientPackages, clients, trainers } from "./schema";

// All functions take a Tx from withTrainer(), so RLS scopes every query to
// the signed-in trainer. The trainer_id filters are for index use, not security.

type TrainerRef = { id: string; timezone: string };

const todayIn = (tz: string) => sql`(now() at time zone ${tz})::date`;

export async function getTrainer(tx: Tx, trainerId: string) {
  const [row] = await tx.select().from(trainers).where(eq(trainers.id, trainerId));
  return row;
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
      overdue: clientPackageBalances.overdueAmount,
      state: clientPackageBalances.state,
      lowBalance: sql<boolean>`${clientPackageBalances.remainingSessions} <= 2`,
      expiringSoon: sql<boolean>`coalesce(${clientPackageBalances.effectiveExpiresOn} <= ${today} + 7, false)`,
      // Only installments already due count as debt; later ones aren't late yet.
      hasDebt: sql<boolean>`${clientPackageBalances.overdueAmount} > 0`,
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
          sql`${clientPackageBalances.overdueAmount} > 0`,
        ),
      ),
    )
    .orderBy(asc(clientPackageBalances.remainingSessions), asc(clients.fullName));
}

export async function listClients(tx: Tx, trainerId: string) {
  const rows = await tx
    .select({ id: clients.id, fullName: clients.fullName, phone: clients.phone, tags: clients.tags })
    .from(clients)
    .where(and(eq(clients.trainerId, trainerId), eq(clients.status, "active"), isNull(clients.archivedAt)));
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
