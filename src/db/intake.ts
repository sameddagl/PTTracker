import "server-only";
import { and, asc, desc, eq } from "drizzle-orm";
import { DEFAULT_INTAKE_FIELDS, type IntakeFieldDef, type IntakeValue } from "@/lib/intake";
import type { Tx } from "./index";
import { intakeAnswers, intakeFields, trainers } from "./schema";

export type IntakeField = typeof intakeFields.$inferSelect;

/** The field as the parser and form expect it (numeric columns come back as strings). */
export const toDef = (f: IntakeField): IntakeFieldDef & { id: string } => ({
  id: f.id,
  label: f.label,
  type: f.type,
  helpText: f.helpText,
  unit: f.unit,
  min: f.min === null ? null : Number(f.min),
  max: f.max === null ? null : Number(f.max),
  options: f.options,
  required: f.required,
  isHealth: f.isHealth,
});

export async function listIntakeFields(tx: Tx, trainerId: string, { activeOnly = false } = {}) {
  return tx
    .select()
    .from(intakeFields)
    .where(and(eq(intakeFields.trainerId, trainerId), activeOnly ? eq(intakeFields.isActive, true) : undefined))
    .orderBy(asc(intakeFields.sortOrder), asc(intakeFields.createdAt));
}

type FieldInput = IntakeFieldDef & { isActive?: boolean };

const row = (def: FieldInput) => ({
  ...def,
  min: def.min === null ? null : String(def.min),
  max: def.max === null ? null : String(def.max),
});

/**
 * Gives a trainer the default questions once. Locks the trainer row so two
 * concurrent first visits don't seed twice.
 */
export async function ensureDefaultIntakeFields(tx: Tx, trainerId: string) {
  await tx.select({ id: trainers.id }).from(trainers).where(eq(trainers.id, trainerId)).for("update");
  const [existing] = await tx.select({ id: intakeFields.id }).from(intakeFields).where(eq(intakeFields.trainerId, trainerId)).limit(1);
  if (existing) return;
  await tx.insert(intakeFields).values(DEFAULT_INTAKE_FIELDS.map((f, i) => ({ ...row(f), trainerId, sortOrder: (i + 1) * 10 })));
}

export async function createIntakeField(tx: Tx, trainerId: string, def: FieldInput) {
  const fields = await listIntakeFields(tx, trainerId);
  const sortOrder = Math.max(0, ...fields.map((f) => f.sortOrder)) + 10;
  await tx.insert(intakeFields).values({ ...row(def), trainerId, sortOrder });
}

export async function updateIntakeField(tx: Tx, trainerId: string, id: string, def: FieldInput) {
  const [r] = await tx
    .update(intakeFields)
    .set(row(def))
    .where(and(eq(intakeFields.id, id), eq(intakeFields.trainerId, trainerId)))
    .returning({ id: intakeFields.id });
  return !!r;
}

/** Deleting keeps past answers (their field_id becomes null). */
export async function deleteIntakeField(tx: Tx, trainerId: string, id: string) {
  await tx.delete(intakeFields).where(and(eq(intakeFields.id, id), eq(intakeFields.trainerId, trainerId)));
}

/** Saves a drag-and-drop order: `ids` top first. Ids of other trainers' fields are ignored. */
export async function reorderIntakeFields(tx: Tx, trainerId: string, ids: string[]) {
  for (const [k, id] of ids.entries()) {
    await tx
      .update(intakeFields)
      .set({ sortOrder: (k + 1) * 10 })
      .where(and(eq(intakeFields.id, id), eq(intakeFields.trainerId, trainerId)));
  }
}

const valueColumns = (v: IntakeValue) => ({
  valueText: v.kind === "text" ? v.text : null,
  valueNumber: v.kind === "number" ? String(v.number) : null,
  valueDate: v.kind === "date" ? v.date : null,
  valueOptions: v.kind === "options" ? v.options : null,
  valueBool: v.kind === "bool" ? v.bool : null,
});

export async function saveIntakeAnswers(
  tx: Tx,
  { trainerId, clientId, applicationId, answers }: {
    trainerId: string;
    clientId: string;
    applicationId: string | null;
    answers: { field: IntakeField; value: IntakeValue }[];
  },
) {
  if (answers.length === 0) return;
  await tx.insert(intakeAnswers).values(
    answers.map(({ field, value }) => ({
      trainerId,
      clientId,
      applicationId,
      fieldId: field.id,
      label: field.label,
      type: field.type,
      unit: field.unit,
      isHealth: field.isHealth,
      sortOrder: field.sortOrder,
      ...valueColumns(value),
    })),
  );
}

/**
 * The trainer edits a client's answers. For each question the old answers
 * are replaced by the new one (or removed when cleared); the application the
 * previous answer came with is kept, so the application screen stays complete.
 */
export async function replaceClientAnswers(
  tx: Tx,
  { trainerId, clientId, answers }: { trainerId: string; clientId: string; answers: { field: IntakeField; value: IntakeValue | null }[] },
) {
  for (const { field, value } of answers) {
    const [previous] = await tx
      .select({ applicationId: intakeAnswers.applicationId })
      .from(intakeAnswers)
      .where(and(eq(intakeAnswers.clientId, clientId), eq(intakeAnswers.trainerId, trainerId), eq(intakeAnswers.fieldId, field.id)))
      .orderBy(desc(intakeAnswers.createdAt))
      .limit(1);
    await tx
      .delete(intakeAnswers)
      .where(and(eq(intakeAnswers.clientId, clientId), eq(intakeAnswers.trainerId, trainerId), eq(intakeAnswers.fieldId, field.id)));
    if (value) {
      await saveIntakeAnswers(tx, { trainerId, clientId, applicationId: previous?.applicationId ?? null, answers: [{ field, value }] });
    }
  }
}

export async function listIntakeAnswers(tx: Tx, where: { clientId: string } | { applicationId: string }) {
  return tx
    .select()
    .from(intakeAnswers)
    .where("clientId" in where ? eq(intakeAnswers.clientId, where.clientId) : eq(intakeAnswers.applicationId, where.applicationId))
    .orderBy(asc(intakeAnswers.createdAt), asc(intakeAnswers.sortOrder));
}
