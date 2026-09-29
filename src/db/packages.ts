import "server-only";
import { and, asc, eq, inArray, sql } from "drizzle-orm";
import type { Tx } from "./index";
import { clientPackageBalances, clientPackages, packageTemplates, payments } from "./schema";

export type SessionType = (typeof packageTemplates.$inferSelect)["sessionType"];
export type PaymentMethod = (typeof payments.$inferSelect)["method"];

export async function listTemplates(tx: Tx, trainerId: string, { activeOnly = false } = {}) {
  const rows = await tx
    .select()
    .from(packageTemplates)
    .where(
      and(eq(packageTemplates.trainerId, trainerId), activeOnly ? eq(packageTemplates.isActive, true) : undefined),
    )
    .orderBy(asc(packageTemplates.sortOrder), asc(packageTemplates.sessionType), asc(packageTemplates.sessionCount));
  return rows;
}

export async function getTemplate(tx: Tx, trainerId: string, id: string) {
  const [row] = await tx
    .select()
    .from(packageTemplates)
    .where(and(eq(packageTemplates.id, id), eq(packageTemplates.trainerId, trainerId)));
  return row ?? null;
}

export type TemplateInput = {
  name: string;
  sessionType: SessionType;
  sessionCount: number;
  validityDays: number | null;
  price: number | null;
  makeupAllowance: number;
  isPublic: boolean;
  description: string | null;
  features: string[];
  sortOrder: number;
  installments: number;
};

const templateRow = (input: TemplateInput) => ({
  ...input,
  price: input.price === null ? null : input.price.toFixed(2),
});

export async function createTemplate(tx: Tx, trainerId: string, input: TemplateInput) {
  await tx.insert(packageTemplates).values({ ...templateRow(input), trainerId });
}

/** Edits a template. Packages already sold keep their own snapshot. */
export async function updateTemplate(tx: Tx, trainerId: string, id: string, input: TemplateInput) {
  const [row] = await tx
    .update(packageTemplates)
    .set(templateRow(input))
    .where(and(eq(packageTemplates.id, id), eq(packageTemplates.trainerId, trainerId)))
    .returning({ id: packageTemplates.id });
  return !!row;
}

export async function setTemplateActive(tx: Tx, trainerId: string, id: string, isActive: boolean) {
  await tx
    .update(packageTemplates)
    .set({ isActive })
    .where(and(eq(packageTemplates.id, id), eq(packageTemplates.trainerId, trainerId)));
}

/** "2026-10-01" + 30 days → "2026-10-30" (the package is valid on its last day). */
export function expiryFor(startsOn: string, validityDays: number | null) {
  if (!validityDays) return null;
  const d = new Date(`${startsOn}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + validityDays - 1);
  return d.toISOString().slice(0, 10);
}

export type SellInput = {
  clientId: string;
  templateId: string | null;
  name: string;
  sessionType: SessionType;
  totalSessions: number;
  startsOn: string;
  expiresOn: string | null;
  price: number;
  makeupAllowance: number;
  installments: number;
  payment: { amount: number; method: PaymentMethod } | null;
};

export async function sellPackage(tx: Tx, trainerId: string, input: SellInput) {
  const { payment, price, ...pkg } = input;
  const [row] = await tx
    .insert(clientPackages)
    .values({ ...pkg, price: price.toFixed(2), trainerId })
    .returning({ id: clientPackages.id });

  if (payment && payment.amount > 0) {
    await tx.insert(payments).values({
      trainerId,
      clientId: input.clientId,
      clientPackageId: row.id,
      amount: payment.amount.toFixed(2),
      method: payment.method,
      paidOn: input.startsOn,
    });
  }
  return row.id;
}

/**
 * The package a new lesson should draw from: live, not used up, same session
 * type if possible, soonest to expire first (so older packages are used up
 * before newer ones).
 */
export async function pickPackage(tx: Tx, clientId: string, sessionType: SessionType) {
  const candidates = await tx
    .select({
      id: clientPackages.id,
      sessionType: clientPackages.sessionType,
    })
    .from(clientPackages)
    .innerJoin(clientPackageBalances, eq(clientPackageBalances.clientPackageId, clientPackages.id))
    .where(
      and(
        eq(clientPackages.clientId, clientId),
        inArray(clientPackageBalances.state, ["active"]),
        // Lessons already booked count against the balance too.
        sql`${clientPackageBalances.remainingSessions} - ${clientPackageBalances.scheduledSessions} > 0`,
      ),
    )
    .orderBy(
      sql`${clientPackageBalances.effectiveExpiresOn} asc nulls last`,
      asc(clientPackages.startsOn),
    );

  return (candidates.find((c) => c.sessionType === sessionType) ?? candidates[0])?.id ?? null;
}
