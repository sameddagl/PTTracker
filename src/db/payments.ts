import "server-only";
import { and, desc, eq, gt, isNull, ne, sql } from "drizzle-orm";
import type { Tx } from "./index";
import type { PaymentMethod } from "./packages";
import { clientPackageBalances, clientPackages, clients, paymentReceipts, payments } from "./schema";

type TrainerRef = { id: string; timezone: string };

const monthStart = (tz: string) => sql`date_trunc('month', (now() at time zone ${tz})::date)::date`;

export async function getPaymentSummary(tx: Tx, trainer: TrainerRef) {
  const start = monthStart(trainer.timezone);
  const byMethod = await tx
    .select({
      method: payments.method,
      total: sql<string>`coalesce(sum(${payments.amount}), 0)`,
    })
    .from(payments)
    .where(and(eq(payments.trainerId, trainer.id), eq(payments.status, "confirmed"), sql`${payments.paidOn} >= ${start}`))
    .groupBy(payments.method);

  const [lastMonth] = await tx
    .select({ total: sql<string>`coalesce(sum(${payments.amount}), 0)` })
    .from(payments)
    .where(
      and(
        eq(payments.trainerId, trainer.id),
        eq(payments.status, "confirmed"),
        sql`${payments.paidOn} >= ${start} - interval '1 month'`,
        sql`${payments.paidOn} < ${start}`,
      ),
    );

  const [outstanding] = await tx
    .select({ total: sql<string>`coalesce(sum(${clientPackageBalances.dueAmount}), 0)` })
    .from(clientPackageBalances)
    .innerJoin(clients, eq(clients.id, clientPackageBalances.clientId))
    .where(
      and(
        eq(clientPackageBalances.trainerId, trainer.id),
        ne(clientPackageBalances.state, "cancelled"),
        isNull(clients.archivedAt),
      ),
    );

  return {
    thisMonth: byMethod.reduce((sum, r) => sum + Number(r.total), 0),
    lastMonth: Number(lastMonth.total),
    outstanding: Number(outstanding.total),
    byMethod: Object.fromEntries(byMethod.map((r) => [r.method, Number(r.total)])) as Partial<Record<PaymentMethod, number>>,
  };
}

export type Debtor = Awaited<ReturnType<typeof listDebtors>>[number];

/** Clients who owe money on any non-cancelled package, largest debt first. */
export async function listDebtors(tx: Tx, trainerId: string) {
  const rows = await tx
    .select({
      clientId: clients.id,
      fullName: clients.fullName,
      phone: clients.phone,
      clientPackageId: clientPackages.id,
      packageName: clientPackages.name,
      due: clientPackageBalances.dueAmount,
    })
    .from(clientPackageBalances)
    .innerJoin(clientPackages, eq(clientPackages.id, clientPackageBalances.clientPackageId))
    .innerJoin(clients, eq(clients.id, clientPackageBalances.clientId))
    .where(
      and(
        eq(clientPackageBalances.trainerId, trainerId),
        ne(clientPackageBalances.state, "cancelled"),
        gt(clientPackageBalances.dueAmount, "0"),
        isNull(clients.archivedAt),
      ),
    )
    .orderBy(clientPackages.startsOn);

  const byClient = new Map<
    string,
    { clientId: string; fullName: string; phone: string | null; total: number; packages: { id: string; name: string; due: number }[] }
  >();
  for (const r of rows) {
    const d = byClient.get(r.clientId) ?? { clientId: r.clientId, fullName: r.fullName, phone: r.phone, total: 0, packages: [] };
    d.total += Number(r.due);
    d.packages.push({ id: r.clientPackageId, name: r.packageName, due: Number(r.due) });
    byClient.set(r.clientId, d);
  }
  return [...byClient.values()].sort((a, b) => b.total - a.total);
}

export async function listRecentPayments(tx: Tx, trainerId: string, { clientId, limit = 20 }: { clientId?: string; limit?: number } = {}) {
  return tx
    .select({
      id: payments.id,
      amount: payments.amount,
      method: payments.method,
      paidOn: payments.paidOn,
      note: payments.note,
      clientId: clients.id,
      clientName: clients.fullName,
      packageName: clientPackages.name,
    })
    .from(payments)
    .innerJoin(clients, eq(clients.id, payments.clientId))
    .leftJoin(clientPackages, eq(clientPackages.id, payments.clientPackageId))
    .where(
      and(
        eq(payments.trainerId, trainerId),
        eq(payments.status, "confirmed"),
        clientId ? eq(payments.clientId, clientId) : undefined,
      ),
    )
    .orderBy(desc(payments.paidOn), desc(payments.createdAt))
    .limit(limit);
}

/** Packages that can still take a payment, with what is left to pay. */
export async function listPayablePackages(tx: Tx, trainerId: string) {
  return tx
    .select({
      id: clientPackages.id,
      clientId: clientPackages.clientId,
      name: clientPackages.name,
      startsOn: clientPackages.startsOn,
      price: clientPackages.price,
      due: clientPackageBalances.dueAmount,
    })
    .from(clientPackages)
    .innerJoin(clientPackageBalances, eq(clientPackageBalances.clientPackageId, clientPackages.id))
    .where(and(eq(clientPackages.trainerId, trainerId), ne(clientPackageBalances.state, "cancelled")))
    .orderBy(desc(clientPackages.startsOn));
}

export type PaymentInput = {
  clientId: string;
  clientPackageId: string | null;
  amount: number;
  method: PaymentMethod;
  paidOn: string;
  note: string | null;
};

export type RecordPaymentResult =
  | { ok: true }
  | { ok: false; reason: "overpay"; due: number }
  | { ok: false; reason: "package_not_found" };

export async function recordPayment(tx: Tx, trainerId: string, input: PaymentInput): Promise<RecordPaymentResult> {
  if (input.clientPackageId) {
    // Lock the package so two payments entered at once can't both pass the check.
    const [pkg] = await tx
      .select({ price: clientPackages.price })
      .from(clientPackages)
      .where(and(eq(clientPackages.id, input.clientPackageId), eq(clientPackages.clientId, input.clientId)))
      .for("update");
    if (!pkg) return { ok: false, reason: "package_not_found" };
    const [balance] = await tx
      .select({ due: clientPackageBalances.dueAmount })
      .from(clientPackageBalances)
      .where(eq(clientPackageBalances.clientPackageId, input.clientPackageId));
    const due = Number(balance?.due ?? 0);
    // Packages sold without a price have nothing to overpay against.
    if (Number(pkg.price) > 0 && input.amount > due + 0.001) return { ok: false, reason: "overpay", due };
  }

  await tx.insert(payments).values({
    trainerId,
    clientId: input.clientId,
    clientPackageId: input.clientPackageId,
    amount: input.amount.toFixed(2),
    method: input.method,
    paidOn: input.paidOn,
    note: input.note,
  });
  return { ok: true };
}

export const MAX_RECEIPT_BYTES = 1_500_000;
export const RECEIPT_TYPES = ["image/webp", "image/jpeg", "image/png", "application/pdf"] as const;

export type ClientPaymentInput = {
  clientPackageId: string;
  amount: number;
  paidOn: string;
  note: string | null;
  receipt: { mimeType: string; data: Buffer } | null;
};

export type ClientPaymentResult = { ok: true } | { ok: false; reason: "package" | "overpay" | "too_many" | "receipt"; due?: number };

/**
 * A transfer reported by the client from their portal. Stored as pending
 * until the trainer confirms it. Runs on the owner connection (the client is
 * signed out), so every check is scoped to the client resolved from the link.
 */
export async function recordClientPayment(
  tx: Tx,
  { trainerId, clientId }: { trainerId: string; clientId: string },
  input: ClientPaymentInput,
): Promise<ClientPaymentResult> {
  if (input.receipt && (input.receipt.data.length > MAX_RECEIPT_BYTES || !(RECEIPT_TYPES as readonly string[]).includes(input.receipt.mimeType))) {
    return { ok: false, reason: "receipt" };
  }

  const [pkg] = await tx
    .select({ id: clientPackages.id, due: clientPackageBalances.dueAmount, state: clientPackageBalances.state })
    .from(clientPackages)
    .innerJoin(clientPackageBalances, eq(clientPackageBalances.clientPackageId, clientPackages.id))
    .where(and(eq(clientPackages.id, input.clientPackageId), eq(clientPackages.clientId, clientId), eq(clientPackages.trainerId, trainerId)));
  if (!pkg || pkg.state === "cancelled") return { ok: false, reason: "package" };
  if (input.amount > Number(pkg.due) + 0.001) return { ok: false, reason: "overpay", due: Number(pkg.due) };

  const [{ pending }] = await tx
    .select({ pending: sql<number>`count(*)::int` })
    .from(payments)
    .where(and(eq(payments.clientId, clientId), eq(payments.status, "pending")));
  if (pending >= 5) return { ok: false, reason: "too_many" };

  const [row] = await tx
    .insert(payments)
    .values({
      trainerId,
      clientId,
      clientPackageId: pkg.id,
      amount: input.amount.toFixed(2),
      method: "bank_transfer",
      paidOn: input.paidOn,
      note: input.note,
      status: "pending",
      reportedBy: "client",
    })
    .returning({ id: payments.id });
  if (input.receipt) {
    await tx.insert(paymentReceipts).values({
      paymentId: row.id,
      trainerId,
      mimeType: input.receipt.mimeType,
      size: input.receipt.data.length,
      data: input.receipt.data,
    });
  }
  return { ok: true };
}

export type PendingPayment = Awaited<ReturnType<typeof listPendingPayments>>[number];

/** Transfers clients reported from their portal, waiting for the trainer. */
export async function listPendingPayments(tx: Tx, trainerId: string) {
  return tx
    .select({
      id: payments.id,
      amount: payments.amount,
      paidOn: payments.paidOn,
      note: payments.note,
      createdAt: payments.createdAt,
      clientId: clients.id,
      clientName: clients.fullName,
      clientPackageId: payments.clientPackageId,
      packageName: clientPackages.name,
      due: clientPackageBalances.dueAmount,
      receiptType: paymentReceipts.mimeType,
    })
    .from(payments)
    .innerJoin(clients, eq(clients.id, payments.clientId))
    .leftJoin(clientPackages, eq(clientPackages.id, payments.clientPackageId))
    .leftJoin(clientPackageBalances, eq(clientPackageBalances.clientPackageId, payments.clientPackageId))
    .leftJoin(paymentReceipts, eq(paymentReceipts.paymentId, payments.id))
    .where(and(eq(payments.trainerId, trainerId), eq(payments.status, "pending")))
    .orderBy(desc(payments.createdAt));
}

export async function countPendingPayments(tx: Tx, trainerId: string) {
  const [row] = await tx
    .select({ n: sql<number>`count(*)::int` })
    .from(payments)
    .where(and(eq(payments.trainerId, trainerId), eq(payments.status, "pending")));
  return row?.n ?? 0;
}

export type ReviewResult =
  | { ok: true; clientId: string; clientEmail: string | null; clientName: string; amount: string }
  | { ok: false; reason: "not_found" | "overpay"; due?: number };

/**
 * Confirms a client-reported payment. Refuses if it would take a priced
 * package past its price (e.g. two reports for the same transfer).
 */
export async function confirmPayment(tx: Tx, trainerId: string, id: string, { amount }: { amount?: number } = {}): Promise<ReviewResult> {
  const [p] = await tx
    .select({
      id: payments.id,
      amount: payments.amount,
      clientId: payments.clientId,
      clientPackageId: payments.clientPackageId,
      clientName: clients.fullName,
      clientEmail: clients.email,
    })
    .from(payments)
    .innerJoin(clients, eq(clients.id, payments.clientId))
    .where(and(eq(payments.id, id), eq(payments.trainerId, trainerId), eq(payments.status, "pending")))
    .for("update", { of: payments });
  if (!p) return { ok: false, reason: "not_found" };

  const finalAmount = amount ?? Number(p.amount);
  if (p.clientPackageId) {
    const [pkg] = await tx
      .select({ price: clientPackages.price })
      .from(clientPackages)
      .where(eq(clientPackages.id, p.clientPackageId))
      .for("update");
    const [bal] = await tx
      .select({ due: clientPackageBalances.dueAmount })
      .from(clientPackageBalances)
      .where(eq(clientPackageBalances.clientPackageId, p.clientPackageId));
    const due = Number(bal?.due ?? 0);
    if (Number(pkg?.price ?? 0) > 0 && finalAmount > due + 0.001) return { ok: false, reason: "overpay", due };
  }

  await tx
    .update(payments)
    .set({ status: "confirmed", amount: finalAmount.toFixed(2), reviewedAt: new Date() })
    .where(eq(payments.id, id));
  return { ok: true, clientId: p.clientId, clientEmail: p.clientEmail, clientName: p.clientName, amount: finalAmount.toFixed(2) };
}

export async function rejectPayment(tx: Tx, trainerId: string, id: string, reason: string | null) {
  const [row] = await tx
    .update(payments)
    .set({ status: "rejected", rejectReason: reason, reviewedAt: new Date() })
    .where(and(eq(payments.id, id), eq(payments.trainerId, trainerId), eq(payments.status, "pending")))
    .returning({ clientId: payments.clientId });
  return row ?? null;
}

export async function getReceipt(tx: Tx, trainerId: string, paymentId: string) {
  const [row] = await tx
    .select({ mimeType: paymentReceipts.mimeType, data: paymentReceipts.data })
    .from(paymentReceipts)
    .where(and(eq(paymentReceipts.paymentId, paymentId), eq(paymentReceipts.trainerId, trainerId)));
  return row ?? null;
}

export async function deletePayment(tx: Tx, trainerId: string, id: string) {
  const [row] = await tx
    .delete(payments)
    .where(and(eq(payments.id, id), eq(payments.trainerId, trainerId)))
    .returning({ clientId: payments.clientId });
  return row ?? null;
}
