"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { withTrainer } from "@/db";
import { listMeasurementTypes } from "@/db/progress";
import { measurementTypes, trainers } from "@/db/schema";
import { BUILTIN_METRICS, DEFAULT_METRICS } from "@/lib/measurements";

type Result = { ok: true } | { ok: false; error: string };
const FAIL = "Bir sorun oldu. Sayfayı yenileyip tekrar dene.";

/** The metrics on the "Ölçüm ekle" form, in the given order. */
export async function saveMetricSetAction(keys: string[]): Promise<Result> {
  if (!Array.isArray(keys) || keys.length > 30) return { ok: false, error: FAIL };
  if (keys.length === 0) return { ok: false, error: "En az bir ölçü seç." };
  await withTrainer(async (tx, trainerId) => {
    const custom = new Set((await listMeasurementTypes(tx, trainerId)).filter((t) => !t.archivedAt).map((t) => t.id));
    const builtin = new Set<string>(BUILTIN_METRICS.map((m) => m.key));
    const clean = [...new Set(keys)].filter((k) => builtin.has(k) || custom.has(k));
    await tx.update(trainers).set({ measureMetrics: clean }).where(eq(trainers.id, trainerId));
  });
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function setSelfWeighAction(on: boolean): Promise<Result> {
  await withTrainer((tx, trainerId) => tx.update(trainers).set({ clientsSelfWeigh: Boolean(on) }).where(eq(trainers.id, trainerId)));
  revalidatePath("/", "layout");
  return { ok: true };
}

const customSchema = z.object({
  label: z.string().trim().min(1, "Ölçünün adını yaz.").max(40, "En fazla 40 karakter."),
  unit: z.string().trim().max(12, "Birim en fazla 12 karakter."),
  decimals: z.coerce.number().int().min(0).max(2),
});

export async function addCustomMetricAction(input: { label: string; unit: string; decimals: number }): Promise<Result> {
  const parsed = customSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  await withTrainer(async (tx, trainerId) => {
    const [row] = await tx.insert(measurementTypes).values({ trainerId, ...parsed.data }).returning({ id: measurementTypes.id });
    // A new metric goes straight onto the form.
    const [t] = await tx.select({ keys: trainers.measureMetrics, discipline: trainers.discipline }).from(trainers).where(eq(trainers.id, trainerId));
    const keys = t.keys && t.keys.length > 0 ? t.keys : DEFAULT_METRICS[t.discipline];
    await tx.update(trainers).set({ measureMetrics: [...keys, row.id] }).where(eq(trainers.id, trainerId));
  });
  revalidatePath("/", "layout");
  return { ok: true };
}

/** Archived, not deleted: old readings keep their label. */
export async function archiveCustomMetricAction(id: string): Promise<Result> {
  if (!z.uuid().safeParse(id).success) return { ok: false, error: FAIL };
  await withTrainer(async (tx, trainerId) => {
    await tx
      .update(measurementTypes)
      .set({ archivedAt: new Date() })
      .where(and(eq(measurementTypes.id, id), eq(measurementTypes.trainerId, trainerId)));
    const [t] = await tx.select({ keys: trainers.measureMetrics }).from(trainers).where(eq(trainers.id, trainerId));
    if (t.keys) await tx.update(trainers).set({ measureMetrics: t.keys.filter((k) => k !== id) }).where(eq(trainers.id, trainerId));
  });
  revalidatePath("/", "layout");
  return { ok: true };
}
