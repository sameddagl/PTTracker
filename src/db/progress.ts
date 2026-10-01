import "server-only";
import { and, asc, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import { LEGAL } from "@/lib/legal";
import { metricCatalog, type CustomType, type Series } from "@/lib/measurements";
import type { Tx } from "./index";
import { clientNotes, clients, consents, lessonAttendees, lessons, measurementTypes, measurements, trainers } from "./schema";

// Client notes and measurements. Trainer-side functions run under RLS
// (withTrainer); the portal ones take a resolved { trainerId, clientId }.

type Who = { trainerId: string; clientId: string };

export const NOTE_MAX_LENGTH = 2000;

// ---- Consent ----

export async function hasHealthConsent(tx: Tx, clientId: string) {
  const [row] = await tx
    .select({ id: consents.id })
    .from(consents)
    .where(and(eq(consents.clientId, clientId), eq(consents.kind, "health_data"), isNull(consents.revokedAt)))
    .limit(1);
  return Boolean(row);
}

/** Records the client's explicit consent (given on their page, or attested by the trainer). Idempotent. */
export async function grantHealthConsent(tx: Tx, who: Who) {
  if (await hasHealthConsent(tx, who.clientId)) return;
  await tx.insert(consents).values({ ...who, kind: "health_data", textVersion: LEGAL.healthConsentVersion });
}

// ---- Notes ----

export type ClientNote = {
  id: string;
  body: string;
  visibleToClient: boolean;
  createdAt: Date;
  lessonId: string | null;
  lessonStartsAt: Date | null;
};

export function listNotes(tx: Tx, clientId: string, { visibleOnly = false, limit = 200 } = {}): Promise<ClientNote[]> {
  return tx
    .select({
      id: clientNotes.id,
      body: clientNotes.body,
      visibleToClient: clientNotes.visibleToClient,
      createdAt: clientNotes.createdAt,
      lessonId: clientNotes.lessonId,
      lessonStartsAt: lessons.startsAt,
    })
    .from(clientNotes)
    .leftJoin(lessons, eq(lessons.id, clientNotes.lessonId))
    .where(and(eq(clientNotes.clientId, clientId), visibleOnly ? eq(clientNotes.visibleToClient, true) : undefined))
    .orderBy(desc(clientNotes.createdAt))
    .limit(limit);
}

export function cleanNote(body: unknown) {
  if (typeof body !== "string") return null;
  const t = body.trim();
  return t.length >= 1 && t.length <= NOTE_MAX_LENGTH ? t : null;
}

export async function addNote(tx: Tx, who: Who, input: { body: string; visibleToClient: boolean; lessonId?: string | null }) {
  const [c] = await tx.select({ id: clients.id }).from(clients).where(and(eq(clients.id, who.clientId), eq(clients.trainerId, who.trainerId)));
  if (!c) return null;
  const [row] = await tx
    .insert(clientNotes)
    .values({ ...who, body: input.body, visibleToClient: input.visibleToClient, lessonId: input.lessonId ?? null })
    .returning({ id: clientNotes.id });
  return row.id;
}

/** A note about one lesson, from the attendance list: the attendee row names client and lesson. */
export async function addLessonNote(tx: Tx, trainerId: string, attendeeId: string, body: string) {
  const [a] = await tx
    .select({ clientId: lessonAttendees.clientId, lessonId: lessonAttendees.lessonId })
    .from(lessonAttendees)
    .where(and(eq(lessonAttendees.id, attendeeId), eq(lessonAttendees.trainerId, trainerId)));
  if (!a) return null;
  return addNote(tx, { trainerId, clientId: a.clientId }, { body, visibleToClient: false, lessonId: a.lessonId });
}

export async function setNoteVisibility(tx: Tx, trainerId: string, noteId: string, visible: boolean) {
  const rows = await tx
    .update(clientNotes)
    .set({ visibleToClient: visible, updatedAt: new Date() })
    .where(and(eq(clientNotes.id, noteId), eq(clientNotes.trainerId, trainerId)))
    .returning({ clientId: clientNotes.clientId });
  return rows[0]?.clientId ?? null;
}

export async function deleteNote(tx: Tx, trainerId: string, noteId: string) {
  const rows = await tx
    .delete(clientNotes)
    .where(and(eq(clientNotes.id, noteId), eq(clientNotes.trainerId, trainerId)))
    .returning({ clientId: clientNotes.clientId });
  return rows[0]?.clientId ?? null;
}

// ---- Measurement settings ----

export function listMeasurementTypes(tx: Tx, trainerId: string): Promise<CustomType[]> {
  return tx
    .select({ id: measurementTypes.id, label: measurementTypes.label, unit: measurementTypes.unit, decimals: measurementTypes.decimals, archivedAt: measurementTypes.archivedAt })
    .from(measurementTypes)
    .where(eq(measurementTypes.trainerId, trainerId))
    .orderBy(asc(measurementTypes.createdAt));
}

// ---- Measurements ----

export type MeasurementRow = { metric: string; measuredOn: string; value: number; source: "trainer" | "client" };

export async function listMeasurements(tx: Tx, clientId: string): Promise<MeasurementRow[]> {
  const rows = await tx
    .select({ metric: measurements.metric, measuredOn: measurements.measuredOn, value: measurements.value, source: measurements.source })
    .from(measurements)
    .where(eq(measurements.clientId, clientId))
    .orderBy(asc(measurements.measuredOn));
  return rows.map((r) => ({ ...r, value: Number(r.value) }));
}

/** One series per metric that has data, in the catalog's order (built-ins first, then the trainer's own). */
export function toSeries(rows: MeasurementRow[], custom: CustomType[]): Series[] {
  const catalog = metricCatalog(custom);
  const by = new Map<string, { date: string; value: number }[]>();
  for (const r of rows) {
    if (!catalog.has(r.metric)) continue;
    (by.get(r.metric) ?? by.set(r.metric, []).get(r.metric)!).push({ date: r.measuredOn, value: r.value });
  }
  return [...catalog.values()].filter((m) => by.has(m.key)).map((metric) => ({ metric, points: by.get(metric.key)! }));
}

/**
 * Saves one day's values (one per metric; a second entry the same day replaces
 * the first). Refuses without a health_data consent. Returns how many were saved.
 */
export async function saveMeasurements(
  tx: Tx,
  who: Who,
  measuredOn: string,
  values: { metric: string; value: number }[],
  source: "trainer" | "client" = "trainer",
): Promise<{ ok: true; saved: number } | { ok: false; reason: "consent" | "not_found" }> {
  const [c] = await tx.select({ id: clients.id }).from(clients).where(and(eq(clients.id, who.clientId), eq(clients.trainerId, who.trainerId)));
  if (!c) return { ok: false, reason: "not_found" };
  if (!(await hasHealthConsent(tx, who.clientId))) return { ok: false, reason: "consent" };
  if (values.length === 0) return { ok: true, saved: 0 };
  await tx
    .insert(measurements)
    .values(values.map((v) => ({ ...who, metric: v.metric, measuredOn, value: v.value.toFixed(2), source })))
    .onConflictDoUpdate({
      target: [measurements.clientId, measurements.metric, measurements.measuredOn],
      set: { value: sql`excluded.value`, source: sql`excluded.source`, createdAt: new Date() },
    });
  return { ok: true, saved: values.length };
}

/** Deletes a day's values (all metrics, or one). */
export async function deleteMeasurements(tx: Tx, who: Who, measuredOn: string, metric?: string) {
  const rows = await tx
    .delete(measurements)
    .where(
      and(
        eq(measurements.clientId, who.clientId),
        eq(measurements.trainerId, who.trainerId),
        eq(measurements.measuredOn, measuredOn),
        metric ? eq(measurements.metric, metric) : undefined,
      ),
    )
    .returning({ id: measurements.id });
  return rows.length;
}

// ---- Portal ----

/** What the client's "İlerlemem" tab needs. */
export async function portalProgress(tx: Tx, who: Who) {
  const [t] = await tx
    .select({ selfWeigh: trainers.clientsSelfWeigh })
    .from(trainers)
    .where(eq(trainers.id, who.trainerId));
  const consented = await hasHealthConsent(tx, who.clientId);
  const custom = await listMeasurementTypes(tx, who.trainerId);
  const rows = consented ? await listMeasurements(tx, who.clientId) : [];
  const notes = await listNotes(tx, who.clientId, { visibleOnly: true, limit: 50 });
  return { consented, selfWeigh: t?.selfWeigh ?? false, series: toSeries(rows, custom), notes };
}

/** Health-alert notes for a set of clients, for the ⚠ next to their names. */
export async function healthAlerts(tx: Tx, clientIds: string[]) {
  if (clientIds.length === 0) return new Map<string, string>();
  const rows = await tx
    .select({ id: clients.id, note: clients.healthNotes })
    .from(clients)
    .where(and(inArray(clients.id, clientIds), sql`nullif(trim(${clients.healthNotes}), '') is not null`));
  return new Map(rows.map((r) => [r.id, r.note!]));
}
