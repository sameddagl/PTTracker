"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { withTrainer } from "@/db";
import {
  addLessonNote,
  addNote,
  cleanNote,
  deleteMeasurements,
  deleteNote,
  grantHealthConsent,
  listMeasurementTypes,
  saveMeasurements,
  setMeasureInterval,
  setNoteVisibility,
} from "@/db/progress";
import { getTrainer } from "@/db/queries";
import { metricCatalog, parseMetricValue } from "@/lib/measurements";
import { MEASURE_EVERY_OPTIONS } from "@/lib/templates";
import { isISODate } from "@/lib/dates";
import { todayISO } from "@/lib/format";

type Result = { ok: true } | { ok: false; error: string };

const uuid = z.uuid();
const FAIL = "Bir sorun oldu. Sayfayı yenileyip tekrar dene.";
const NOTE_ERROR = "Not boş olamaz, en fazla 2000 karakter olabilir.";

const refresh = (clientId: string) => revalidatePath(`/danisanlar/${clientId}`);

export async function addNoteAction(clientId: string, body: string, visibleToClient: boolean): Promise<Result> {
  const text = cleanNote(body);
  if (!uuid.safeParse(clientId).success) return { ok: false, error: FAIL };
  if (!text) return { ok: false, error: NOTE_ERROR };
  const id = await withTrainer((tx, trainerId) => addNote(tx, { trainerId, clientId }, { body: text, visibleToClient: Boolean(visibleToClient) }));
  if (!id) return { ok: false, error: "Danışan bulunamadı." };
  refresh(clientId);
  return { ok: true };
}

/** "Not ekle" on an attendance row: a private note tied to that lesson. */
export async function addLessonNoteAction(attendeeId: string, body: string): Promise<Result> {
  const text = cleanNote(body);
  if (!uuid.safeParse(attendeeId).success) return { ok: false, error: FAIL };
  if (!text) return { ok: false, error: NOTE_ERROR };
  const id = await withTrainer((tx, trainerId) => addLessonNote(tx, trainerId, attendeeId, text));
  if (!id) return { ok: false, error: FAIL };
  return { ok: true };
}

export async function setNoteVisibilityAction(noteId: string, visible: boolean): Promise<Result> {
  if (!uuid.safeParse(noteId).success) return { ok: false, error: FAIL };
  const clientId = await withTrainer((tx, trainerId) => setNoteVisibility(tx, trainerId, noteId, Boolean(visible)));
  if (!clientId) return { ok: false, error: FAIL };
  refresh(clientId);
  return { ok: true };
}

export async function deleteNoteAction(noteId: string): Promise<Result> {
  if (!uuid.safeParse(noteId).success) return { ok: false, error: FAIL };
  const clientId = await withTrainer((tx, trainerId) => deleteNote(tx, trainerId, noteId));
  if (!clientId) return { ok: false, error: FAIL };
  refresh(clientId);
  return { ok: true };
}

/** The trainer records that the client gave explicit consent (as on the client form). */
export async function attestHealthConsentAction(clientId: string): Promise<Result> {
  if (!uuid.safeParse(clientId).success) return { ok: false, error: FAIL };
  await withTrainer((tx, trainerId) => grantHealthConsent(tx, { trainerId, clientId }));
  refresh(clientId);
  return { ok: true };
}

export type MeasureResult = { ok: true; saved: number } | { ok: false; error: string; field?: string };

export async function saveMeasurementsAction(clientId: string, measuredOn: string, values: Record<string, string>): Promise<MeasureResult> {
  if (!uuid.safeParse(clientId).success || !isISODate(measuredOn)) return { ok: false, error: FAIL };
  return withTrainer(async (tx, trainerId) => {
    const trainer = await getTrainer(tx, trainerId);
    if (measuredOn > todayISO(trainer.timezone)) return { ok: false, error: "Ölçüm tarihi ileri bir gün olamaz.", field: "date" } as const;
    const catalog = metricCatalog((await listMeasurementTypes(tx, trainerId)).filter((t) => !t.archivedAt));
    const parsed: { metric: string; value: number }[] = [];
    for (const [metric, raw] of Object.entries(values ?? {})) {
      const def = catalog.get(metric);
      if (!def || typeof raw !== "string") continue;
      const r = parseMetricValue(raw, def);
      if ("error" in r) return { ok: false, error: r.error, field: metric } as const;
      if (r.value !== null) parsed.push({ metric, value: r.value });
    }
    if (parsed.length === 0) return { ok: false, error: "En az bir ölçü yaz." } as const;
    const res = await saveMeasurements(tx, { trainerId, clientId }, measuredOn, parsed);
    if (!res.ok) return { ok: false, error: res.reason === "consent" ? "Önce danışanın açık rızası gerekiyor." : "Danışan bulunamadı." } as const;
    refresh(clientId);
    return { ok: true, saved: res.saved } as const;
  });
}

export async function deleteMeasurementDayAction(clientId: string, measuredOn: string): Promise<Result> {
  if (!uuid.safeParse(clientId).success || !isISODate(measuredOn)) return { ok: false, error: FAIL };
  await withTrainer((tx, trainerId) => deleteMeasurements(tx, { trainerId, clientId }, measuredOn));
  refresh(clientId);
  return { ok: true };
}

export async function setMeasureIntervalAction(clientId: string, days: number | null): Promise<Result> {
  if (!uuid.safeParse(clientId).success) return { ok: false, error: FAIL };
  if (days !== null && !(MEASURE_EVERY_OPTIONS as readonly number[]).includes(days)) return { ok: false, error: FAIL };
  const ok = await withTrainer((tx, trainerId) => setMeasureInterval(tx, trainerId, clientId, days));
  if (!ok) return { ok: false, error: FAIL };
  refresh(clientId);
  revalidatePath("/bugun");
  return { ok: true };
}
