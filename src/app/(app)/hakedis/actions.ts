"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { withTrainer } from "@/db";
import { closePayrollMonth, payrollFor, reopenPayrollMonth, setPayrollPaid } from "@/db/payroll";
import { getTrainer } from "@/db/queries";
import { MONTH_PATTERN } from "@/lib/payroll";

type Result = { ok: true } | { ok: false; error: string };
const FAIL = "Kaydedilemedi, tekrar dene.";

/** Owner: freezes the month's pay for one instructor (later lesson changes no longer move it). */
export async function closeMonthAction(memberId: string, month: string): Promise<Result> {
  if (!z.uuid().safeParse(memberId).success || !MONTH_PATTERN.test(month)) return { ok: false, error: FAIL };
  const ok = await withTrainer(async (tx, trainerId, member) => {
    if (member.role !== "owner") return false;
    const trainer = await getTrainer(tx, trainerId);
    const [row] = await payrollFor(tx, trainerId, month, { tz: trainer.timezone, countsMissed: trainer.payrollCountsMissed, memberId });
    if (!row || row.closed) return false;
    return closePayrollMonth(tx, trainerId, memberId, month, row.summary);
  });
  revalidatePath("/hakedis");
  return ok ? { ok: true } : { ok: false, error: FAIL };
}

export async function reopenMonthAction(id: string): Promise<Result> {
  if (!z.uuid().safeParse(id).success) return { ok: false, error: FAIL };
  const ok = await withTrainer((tx, trainerId, member) => (member.role === "owner" ? reopenPayrollMonth(tx, trainerId, id) : Promise.resolve(false)));
  revalidatePath("/hakedis");
  return ok ? { ok: true } : { ok: false, error: "Ödendi işaretli bir ay yeniden açılamaz." };
}

export async function setPaidAction(id: string, paid: boolean): Promise<Result> {
  if (!z.uuid().safeParse(id).success) return { ok: false, error: FAIL };
  const ok = await withTrainer((tx, trainerId, member) => (member.role === "owner" ? setPayrollPaid(tx, trainerId, id, Boolean(paid)) : Promise.resolve(false)));
  revalidatePath("/hakedis");
  return ok ? { ok: true } : { ok: false, error: FAIL };
}
