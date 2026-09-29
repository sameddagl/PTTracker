// Payment plans: a package price split into equal monthly installments. The
// plan is derived (not stored) from price, count and start date, and must
// match the overdue calculation in the client_package_balances view.

import { addDays } from "./dates";

export const INSTALLMENT_OPTIONS = [1, 2, 3, 4, 6] as const;
export const INSTALLMENT_INTERVAL_DAYS = 30;

export const installmentLabel = (n: number) => (n <= 1 ? "Tek çekim" : `${n} taksit`);

export type Installment = { seq: number; amount: number; dueOn: string };

/**
 * Whole-lira installments; the remainder (including kuruş) goes on the first,
 * e.g. 4000 in 3 → 1334, 1333, 1333.
 */
export function installmentPlan(price: number, count: number, startsOn: string): Installment[] {
  const n = Math.max(1, Math.floor(count));
  if (price <= 0) return [];
  const base = Math.floor(price / n);
  const first = Math.round((price - base * (n - 1)) * 100) / 100;
  return Array.from({ length: n }, (_, i) => ({
    seq: i + 1,
    amount: i === 0 ? first : base,
    dueOn: addDays(startsOn, i * INSTALLMENT_INTERVAL_DAYS),
  }));
}

export type InstallmentStatus = "paid" | "pending" | "due" | "overdue" | "upcoming";

export type InstallmentState = Installment & {
  status: InstallmentStatus;
  /** Still to be paid or reported on this installment. */
  remaining: number;
};

/**
 * Applies confirmed payments, then pending reports, to installments in order.
 * An installment is "paid" when confirmed money covers it, "pending" when the
 * rest is covered by reports awaiting the trainer, otherwise due/overdue/upcoming.
 */
export function installmentStates(plan: Installment[], confirmed: number, pending: number, today: string): InstallmentState[] {
  let paidLeft = confirmed;
  let pendingLeft = pending;
  return plan.map((inst) => {
    const fromPaid = Math.min(paidLeft, inst.amount);
    paidLeft -= fromPaid;
    const fromPending = Math.min(pendingLeft, inst.amount - fromPaid);
    pendingLeft -= fromPending;
    const remaining = Math.round((inst.amount - fromPaid - fromPending) * 100) / 100;
    const status: InstallmentStatus =
      fromPaid >= inst.amount - 0.001
        ? "paid"
        : remaining <= 0.001
          ? "pending"
          : inst.dueOn < today
            ? "overdue"
            : inst.dueOn === today
              ? "due"
              : "upcoming";
    return { ...inst, status, remaining: Math.max(remaining, 0) };
  });
}

/** The installment a client should pay next, with its remaining amount. */
export const nextPayable = (states: InstallmentState[]) => states.find((s) => s.remaining > 0.001) ?? null;
