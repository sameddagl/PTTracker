"use server";

import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { withTrainer } from "@/db";
import {
  archiveExercise,
  archiveProgram,
  copyProgram,
  createProgram,
  getProgram,
  saveExercise,
  sendProgram,
  updateProgram,
  type ProgramKind,
} from "@/db/programs";
import { getTrainer } from "@/db/queries";
import { safeNext } from "@/lib/config";
import { todayISO } from "@/lib/format";
import { notifyClient } from "@/lib/notify";
import { programInputSchema, toInputDays } from "@/lib/programs";

type Result = { ok: true } | { ok: false; error: string };
const FAIL = "Bir sorun oldu. Sayfayı yenileyip tekrar dene.";
const uuid = z.uuid();
const kindSchema = z.enum(["workout", "nutrition"]);

/** Where a client's program lives in the trainer app. */
const clientTab = (clientId: string, kind: ProgramKind) => `/danisanlar/${clientId}?sekme=${kind === "workout" ? "program" : "beslenme"}`;

export async function saveProgramAction(
  target: { id?: string; kind: ProgramKind; clientId?: string | null; next?: string },
  input: unknown,
): Promise<Result> {
  const kind = kindSchema.safeParse(target.kind);
  const parsed = programInputSchema.safeParse(input);
  if (!kind.success) return { ok: false, error: FAIL };
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  if (target.id && !uuid.safeParse(target.id).success) return { ok: false, error: FAIL };
  if (target.clientId && !uuid.safeParse(target.clientId).success) return { ok: false, error: FAIL };

  const saved = await withTrainer(async (tx, trainerId) => {
    if (target.id) {
      const p = await updateProgram(tx, trainerId, target.id, parsed.data);
      return p ? { id: target.id, clientId: p.clientId } : null;
    }
    const id = await createProgram(tx, trainerId, { ...parsed.data, kind: kind.data, clientId: target.clientId ?? null });
    return id ? { id, clientId: target.clientId ?? null } : null;
  });
  if (!saved) return { ok: false, error: FAIL };
  revalidatePath("/programlar");
  if (saved.clientId) revalidatePath(`/danisanlar/${saved.clientId}`);
  redirect(safeNext(target.next, saved.clientId ? clientTab(saved.clientId, kind.data) : `/programlar${kind.data === "nutrition" ? "?tur=beslenme" : ""}`));
}

/** "Program ver" with a template: the client gets an unsent copy, opened for editing. */
export async function giveProgramAction(clientId: string, templateId: string) {
  if (!uuid.safeParse(clientId).success || !uuid.safeParse(templateId).success) return;
  const id = await withTrainer(async (tx, trainerId) => {
    const t = await getTrainer(tx, trainerId);
    return copyProgram(tx, trainerId, templateId, clientId, todayISO(t.timezone));
  });
  if (!id) return;
  redirect(`/programlar/${id}`);
}

/** Saves a client's program as a new template. */
export async function saveAsTemplateAction(programId: string): Promise<Result> {
  if (!uuid.safeParse(programId).success) return { ok: false, error: FAIL };
  const id = await withTrainer(async (tx, trainerId) => {
    const p = await getProgram(tx, trainerId, programId);
    if (!p) return null;
    return createProgram(tx, trainerId, {
      kind: p.kind,
      clientId: null,
      name: p.name,
      note: p.note,
      targets: p.targets,
      startsOn: null,
      days: toInputDays(p.days),
    });
  });
  if (!id) return { ok: false, error: FAIL };
  revalidatePath("/programlar");
  return { ok: true };
}

export async function sendProgramAction(programId: string): Promise<Result> {
  if (!uuid.safeParse(programId).success) return { ok: false, error: FAIL };
  const out = await withTrainer(async (tx, trainerId) => {
    const p = await sendProgram(tx, trainerId, programId);
    if (!p?.clientId) return null;
    const trainer = await getTrainer(tx, trainerId);
    return { ...p, clientId: p.clientId, trainerId, trainerName: trainer.businessName || trainer.fullName };
  });
  if (!out) return { ok: false, error: FAIL };
  const what = out.kind === "workout" ? "antrenman programın" : "beslenme planın";
  after(() =>
    notifyClient({ trainerId: out.trainerId, clientId: out.clientId }, "program", {
      title: out.trainerName,
      body: `Yeni ${what} hazır: ${out.name}`,
      hash: out.kind === "workout" ? "#program" : "#beslenme",
      tag: `program-${programId}`,
    }),
  );
  revalidatePath(`/danisanlar/${out.clientId}`);
  return { ok: true };
}

export async function archiveProgramAction(programId: string): Promise<Result> {
  if (!uuid.safeParse(programId).success) return { ok: false, error: FAIL };
  const p = await withTrainer((tx, trainerId) => archiveProgram(tx, trainerId, programId));
  if (!p) return { ok: false, error: FAIL };
  revalidatePath("/programlar");
  if (p.clientId) revalidatePath(`/danisanlar/${p.clientId}`);
  return { ok: true };
}

const exerciseSchema = z.object({
  id: z.uuid().nullable().optional(),
  name: z.string().trim().min(1, "Hareketin adını yaz.").max(80, "En fazla 80 karakter."),
  category: z.string().trim().max(30).nullable().optional().transform((v) => v || null),
  videoUrl: z
    .string()
    .trim()
    .max(500)
    .nullable()
    .optional()
    .transform((v) => v || null)
    .refine((v) => !v || /^https:\/\//.test(v), "Video linki https:// ile başlamalı."),
  note: z.string().trim().max(300).nullable().optional().transform((v) => v || null),
  primary: z.array(z.string()).max(20).optional(),
  secondary: z.array(z.string()).max(20).optional(),
});

export async function saveExerciseAction(input: unknown): Promise<Result> {
  const parsed = exerciseSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const id = await withTrainer((tx, trainerId) =>
    saveExercise(tx, trainerId, {
      id: parsed.data.id ?? null,
      name: parsed.data.name,
      category: parsed.data.category,
      videoUrl: parsed.data.videoUrl,
      note: parsed.data.note,
      primary: parsed.data.primary,
      secondary: parsed.data.secondary,
    }),
  );
  if (!id) return { ok: false, error: FAIL };
  revalidatePath("/programlar/hareketler");
  return { ok: true };
}

export async function archiveExerciseAction(id: string): Promise<Result> {
  if (!uuid.safeParse(id).success) return { ok: false, error: FAIL };
  const ok = await withTrainer((tx, trainerId) => archiveExercise(tx, trainerId, id));
  if (!ok) return { ok: false, error: FAIL };
  revalidatePath("/programlar/hareketler");
  return { ok: true };
}
