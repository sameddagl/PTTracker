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
    .orderBy(asc(packageTemplates.sortOrder), asc(packageTemplates.createdAt));
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
  compareAtPrice: number | null;
  /** Installment total and count; null/1 when the package is cash only. */
  installmentPrice: number | null;
  installments: number;
  makeupAllowance: number;
  isPublic: boolean;
  /** A one-off trial lesson: shown first on the public page, once per person. */
  isTrial: boolean;
  description: string | null;
  features: string[];
};

const toMoney = (v: number | null) => (v === null ? null : v.toFixed(2));

const templateRow = (input: TemplateInput) => {
  const hasPlan = input.installments > 1 && input.installmentPrice !== null;
  return {
    ...input,
    price: toMoney(input.price),
    compareAtPrice: toMoney(input.compareAtPrice),
    installmentPrice: hasPlan ? toMoney(input.installmentPrice) : null,
    installments: hasPlan ? input.installments : 1,
  };
};

/** New templates go to the end of the list. */
export async function createTemplate(tx: Tx, trainerId: string, input: TemplateInput) {
  const [{ next }] = await tx
    .select({ next: sql<number>`coalesce(max(${packageTemplates.sortOrder}), -1)::int + 1` })
    .from(packageTemplates)
    .where(eq(packageTemplates.trainerId, trainerId));
  const [row] = await tx
    .insert(packageTemplates)
    .values({ ...templateRow(input), sortOrder: next, trainerId })
    .returning({ id: packageTemplates.id });
  return row.id;
}

/** Saves a drag-and-drop order: `ids` is the full list, top first. Unknown ids are ignored. */
export async function reorderTemplates(tx: Tx, trainerId: string, ids: string[]) {
  for (const [i, id] of ids.entries()) {
    await tx
      .update(packageTemplates)
      .set({ sortOrder: i })
      .where(and(eq(packageTemplates.id, id), eq(packageTemplates.trainerId, trainerId)));
  }
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
export async function pickPackage(tx: Tx, clientId: string, sessionType: SessionType, { strict = false } = {}) {
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

  const same = candidates.find((c) => c.sessionType === sessionType);
  // Strict: only a package of this session type (group classes never draw on private credits).
  return (same ?? (strict ? undefined : candidates[0]))?.id ?? null;
}
