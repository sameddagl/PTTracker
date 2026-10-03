import "server-only";
import { and, asc, desc, eq, gte, inArray, isNotNull, isNull, sql } from "drizzle-orm";
import { cleanMuscles, type MuscleKey } from "@/lib/muscles";
import { STARTER_EXERCISES, cleanVideoUrl, toInputDays, type ProgramInput } from "@/lib/programs";
import type { Tx } from "./index";
import { clients, exercises, programCheckins, programDays, programItems, programs } from "./schema";

// Workout and nutrition programs. Trainer-side functions run under RLS;
// the portal ones take a resolved { trainerId, clientId }.

type Who = { trainerId: string; clientId: string };
export type ProgramKind = "workout" | "nutrition";

// ---- Exercise library ----

export type Exercise = {
  id: string;
  name: string;
  category: string | null;
  videoUrl: string | null;
  note: string | null;
  primary: MuscleKey[];
  secondary: MuscleKey[];
  /** Studios: the member who added it (null = starter list or the owner). */
  createdBy: string | null;
};

/**
 * Adds the starter exercises this trainer doesn't have yet: all of them for a
 * new library, and the ones added to the starter list later for an existing one.
 * A name the trainer already has (even one they deleted) is left alone.
 */
export async function ensureExerciseLibrary(tx: Tx, trainerId: string) {
  const have = new Set(
    (await tx.select({ name: exercises.name }).from(exercises).where(eq(exercises.trainerId, trainerId))).map((r) => r.name.toLocaleLowerCase("tr")),
  );
  const missing = STARTER_EXERCISES.filter((e) => !have.has(e.name.toLocaleLowerCase("tr")));
  if (missing.length === 0) return;
  await tx
    .insert(exercises)
    .values(missing.map((e) => ({ trainerId, name: e.name, category: e.category, primaryMuscles: e.primary, secondaryMuscles: e.secondary })));
}

export async function listExercises(tx: Tx, trainerId: string): Promise<Exercise[]> {
  const rows = await tx
    .select({
      id: exercises.id,
      name: exercises.name,
      category: exercises.category,
      videoUrl: exercises.videoUrl,
      note: exercises.note,
      primary: exercises.primaryMuscles,
      secondary: exercises.secondaryMuscles,
      createdBy: exercises.createdBy,
    })
    .from(exercises)
    .where(and(eq(exercises.trainerId, trainerId), isNull(exercises.archivedAt)))
    .orderBy(asc(exercises.category), asc(exercises.name));
  return rows.map((r) => ({ ...r, primary: cleanMuscles(r.primary), secondary: cleanMuscles(r.secondary) }));
}

export async function saveExercise(
  tx: Tx,
  trainerId: string,
  input: { id?: string | null; name: string; category: string | null; videoUrl: string | null; note: string | null; primary?: string[]; secondary?: string[] },
  createdBy: string | null = null,
) {
  const primaryMuscles = cleanMuscles(input.primary);
  const values = {
    name: input.name,
    category: input.category,
    videoUrl: cleanVideoUrl(input.videoUrl),
    note: input.note,
    primaryMuscles,
    secondaryMuscles: cleanMuscles(input.secondary).filter((m) => !primaryMuscles.includes(m)),
  };
  if (input.id) {
    const rows = await tx
      .update(exercises)
      .set(values)
      .where(and(eq(exercises.id, input.id), eq(exercises.trainerId, trainerId)))
      .returning({ id: exercises.id });
    return rows[0]?.id ?? null;
  }
  const [row] = await tx.insert(exercises).values({ trainerId, ...values, createdBy }).returning({ id: exercises.id });
  return row.id;
}

/** Who added an exercise (null = starter list or owner), or undefined if it isn't this account's. */
export async function exerciseCreator(tx: Tx, trainerId: string, id: string) {
  const [row] = await tx.select({ createdBy: exercises.createdBy }).from(exercises).where(and(eq(exercises.id, id), eq(exercises.trainerId, trainerId)));
  return row ? row.createdBy : undefined;
}

/** Archived, not deleted: programs keep their copy of the name either way. */
export async function archiveExercise(tx: Tx, trainerId: string, id: string) {
  const rows = await tx
    .update(exercises)
    .set({ archivedAt: new Date() })
    .where(and(eq(exercises.id, id), eq(exercises.trainerId, trainerId)))
    .returning({ id: exercises.id });
  return rows.length > 0;
}

// ---- Programs ----

export type ProgramDay = {
  id: string;
  title: string;
  items: {
    id: string;
    exerciseId: string | null;
    name: string;
    sets: number | null;
    reps: string | null;
    load: string | null;
    rest: string | null;
    note: string | null;
    videoUrl: string | null;
    primary: MuscleKey[];
    secondary: MuscleKey[];
  }[];
};

export type Program = {
  id: string;
  clientId: string | null;
  kind: ProgramKind;
  name: string;
  note: string | null;
  targets: Record<string, string>;
  startsOn: string | null;
  sentAt: Date | null;
  updatedAt: Date;
  /** Studios: the member who made it (null = the owner, or before studios). */
  createdBy: string | null;
  days: ProgramDay[];
};

const programCols = {
  id: programs.id,
  clientId: programs.clientId,
  kind: programs.kind,
  name: programs.name,
  note: programs.note,
  targets: programs.targets,
  startsOn: programs.startsOn,
  sentAt: programs.sentAt,
  updatedAt: programs.updatedAt,
  createdBy: programs.createdBy,
};

async function withDays(tx: Tx, rows: Omit<Program, "days">[]): Promise<Program[]> {
  if (rows.length === 0) return [];
  const days = await tx
    .select({ id: programDays.id, programId: programDays.programId, title: programDays.title })
    .from(programDays)
    .where(inArray(programDays.programId, rows.map((r) => r.id)))
    .orderBy(asc(programDays.sortOrder));
  const items =
    days.length === 0
      ? []
      : await tx
          .select({
            id: programItems.id,
            dayId: programItems.dayId,
            exerciseId: programItems.exerciseId,
            name: programItems.name,
            sets: programItems.sets,
            reps: programItems.reps,
            load: programItems.load,
            rest: programItems.rest,
            note: programItems.note,
            videoUrl: exercises.videoUrl,
            primaryMuscles: exercises.primaryMuscles,
            secondaryMuscles: exercises.secondaryMuscles,
          })
          .from(programItems)
          .leftJoin(exercises, eq(exercises.id, programItems.exerciseId))
          .where(inArray(programItems.dayId, days.map((d) => d.id)))
          .orderBy(asc(programItems.sortOrder));
  return rows.map((r) => ({
    ...r,
    days: days
      .filter((d) => d.programId === r.id)
      .map((d) => ({
        id: d.id,
        title: d.title,
        items: items
          .filter((i) => i.dayId === d.id)
          .map(({ primaryMuscles, secondaryMuscles, ...i }) => ({ ...i, primary: cleanMuscles(primaryMuscles), secondary: cleanMuscles(secondaryMuscles) })),
      })),
  }));
}

export async function getProgram(tx: Tx, trainerId: string, id: string) {
  const rows = await tx
    .select(programCols)
    .from(programs)
    .where(and(eq(programs.id, id), eq(programs.trainerId, trainerId), isNull(programs.archivedAt)));
  return (await withDays(tx, rows))[0] ?? null;
}

/** Templates (no client) of one kind, with a count of their days and who made them. */
export async function listTemplates(tx: Tx, trainerId: string, kind: ProgramKind) {
  return tx
    .select({
      id: programs.id,
      name: programs.name,
      updatedAt: programs.updatedAt,
      createdBy: programs.createdBy,
      days: sql<number>`(select count(*)::int from ${programDays} where ${programDays.programId} = "programs"."id")`,
    })
    .from(programs)
    .where(and(eq(programs.trainerId, trainerId), isNull(programs.clientId), eq(programs.kind, kind), isNull(programs.archivedAt)))
    .orderBy(desc(programs.updatedAt));
}

/** A client's programs of one kind, newest first (the first is the current one). */
export async function clientPrograms(tx: Tx, clientId: string, kind: ProgramKind) {
  const rows = await tx
    .select(programCols)
    .from(programs)
    .where(and(eq(programs.clientId, clientId), eq(programs.kind, kind), isNull(programs.archivedAt)))
    .orderBy(desc(programs.createdAt));
  return withDays(tx, rows);
}

async function writeDays(tx: Tx, trainerId: string, programId: string, days: ProgramInput["days"]) {
  await tx.delete(programDays).where(eq(programDays.programId, programId));
  for (const [d, day] of days.entries()) {
    const [row] = await tx.insert(programDays).values({ trainerId, programId, title: day.title, sortOrder: d }).returning({ id: programDays.id });
    if (day.items.length === 0) continue;
    await tx.insert(programItems).values(day.items.map((i, n) => ({ trainerId, dayId: row.id, ...i, sortOrder: n })));
  }
}

/**
 * Exercise ids must be the trainer's own; a workout item typed without one
 * joins the library under that name (so it can be picked next time).
 */
async function linkExercises(tx: Tx, trainerId: string, kind: ProgramKind, days: ProgramInput["days"]): Promise<ProgramInput["days"]> {
  if (kind !== "workout") return days.map((d) => ({ ...d, items: d.items.map((i) => ({ ...i, exerciseId: null })) }));
  const lib = await listExercises(tx, trainerId);
  const byId = new Set(lib.map((e) => e.id));
  const byName = new Map(lib.map((e) => [e.name.toLocaleLowerCase("tr"), e.id]));
  const out: ProgramInput["days"] = [];
  for (const d of days) {
    const items = [];
    for (const i of d.items) {
      let exerciseId = i.exerciseId && byId.has(i.exerciseId) ? i.exerciseId : (byName.get(i.name.toLocaleLowerCase("tr")) ?? null);
      if (!exerciseId && i.name.length <= 80) {
        exerciseId = await saveExercise(tx, trainerId, { name: i.name, category: null, videoUrl: null, note: null });
        if (exerciseId) byName.set(i.name.toLocaleLowerCase("tr"), exerciseId);
      }
      items.push({ ...i, exerciseId });
    }
    out.push({ ...d, items });
  }
  return out;
}

export async function createProgram(
  tx: Tx,
  trainerId: string,
  input: ProgramInput & { kind: ProgramKind; clientId: string | null; createdBy?: string | null },
): Promise<string | null> {
  if (input.clientId) {
    const [c] = await tx.select({ id: clients.id }).from(clients).where(and(eq(clients.id, input.clientId), eq(clients.trainerId, trainerId)));
    if (!c) return null;
  }
  const [row] = await tx
    .insert(programs)
    .values({
      trainerId,
      clientId: input.clientId,
      kind: input.kind,
      name: input.name,
      note: input.note,
      targets: input.targets,
      startsOn: input.startsOn,
      createdBy: input.createdBy ?? null,
    })
    .returning({ id: programs.id });
  await writeDays(tx, trainerId, row.id, await linkExercises(tx, trainerId, input.kind, input.days));
  return row.id;
}

export async function updateProgram(tx: Tx, trainerId: string, id: string, input: ProgramInput) {
  const [p] = await tx
    .update(programs)
    .set({ name: input.name, note: input.note, targets: input.targets, startsOn: input.startsOn, updatedAt: new Date() })
    .where(and(eq(programs.id, id), eq(programs.trainerId, trainerId), isNull(programs.archivedAt)))
    .returning({ id: programs.id, kind: programs.kind, clientId: programs.clientId });
  if (!p) return null;
  // Rewriting the days drops their check-ins; keep a day's check-ins when its title survives.
  const old = await tx
    .select({ title: programDays.title, doneOn: programCheckins.doneOn, clientId: programCheckins.clientId })
    .from(programCheckins)
    .innerJoin(programDays, eq(programDays.id, programCheckins.dayId))
    .where(eq(programCheckins.programId, id));
  await writeDays(tx, trainerId, id, await linkExercises(tx, trainerId, p.kind, input.days));
  if (old.length > 0) {
    const days = await tx.select({ id: programDays.id, title: programDays.title }).from(programDays).where(eq(programDays.programId, id));
    const byTitle = new Map(days.map((d) => [d.title, d.id]));
    const keep = old.filter((c) => byTitle.has(c.title)).map((c) => ({ trainerId, clientId: c.clientId, programId: id, dayId: byTitle.get(c.title)!, doneOn: c.doneOn }));
    if (keep.length > 0) await tx.insert(programCheckins).values(keep).onConflictDoNothing();
  }
  return p;
}

/** A copy of a template (or another client's program) for one client, not sent yet. */
export async function copyProgram(tx: Tx, trainerId: string, sourceId: string, clientId: string, startsOn: string, createdBy: string | null = null) {
  const src = await getProgram(tx, trainerId, sourceId);
  if (!src) return null;
  const id = await createProgram(tx, trainerId, {
    kind: src.kind,
    clientId,
    name: src.name,
    note: src.note,
    targets: src.targets,
    startsOn,
    days: toInputDays(src.days),
    createdBy,
  });
  return id;
}

export async function archiveProgram(tx: Tx, trainerId: string, id: string) {
  const rows = await tx
    .update(programs)
    .set({ archivedAt: new Date() })
    .where(and(eq(programs.id, id), eq(programs.trainerId, trainerId)))
    .returning({ clientId: programs.clientId, kind: programs.kind });
  return rows[0] ?? null;
}

/** Shows the program on the client's page; an older sent program of the same kind steps back into history. */
export async function sendProgram(tx: Tx, trainerId: string, id: string) {
  const [p] = await tx
    .update(programs)
    .set({ sentAt: new Date(), updatedAt: new Date() })
    .where(and(eq(programs.id, id), eq(programs.trainerId, trainerId), isNotNull(programs.clientId), isNull(programs.archivedAt)))
    .returning({ clientId: programs.clientId, kind: programs.kind, name: programs.name });
  return p ?? null;
}

// ---- Check-ins ----

export async function recentCheckins(tx: Tx, clientId: string, sinceDays = 28) {
  return tx
    .select({ programId: programCheckins.programId, dayId: programCheckins.dayId, doneOn: programCheckins.doneOn })
    .from(programCheckins)
    .where(and(eq(programCheckins.clientId, clientId), gte(programCheckins.doneOn, sql`current_date - ${sinceDays}::int`)))
    .orderBy(desc(programCheckins.doneOn));
}

// ---- Portal ----

/** The client's current program of a kind: the newest one the trainer has sent. */
export async function portalProgram(tx: Tx, who: Who, kind: ProgramKind) {
  const rows = await tx
    .select(programCols)
    .from(programs)
    .where(
      and(
        eq(programs.clientId, who.clientId),
        eq(programs.trainerId, who.trainerId),
        eq(programs.kind, kind),
        isNotNull(programs.sentAt),
        isNull(programs.archivedAt),
      ),
    )
    .orderBy(desc(programs.sentAt))
    .limit(1);
  const [program] = await withDays(tx, rows);
  if (!program) return null;
  const checkins = kind === "workout" ? (await recentCheckins(tx, who.clientId)).filter((c) => c.programId === program.id) : [];
  return { program, checkins };
}

/** "Yaptım" (or undo) for one day of the client's current program on a date. */
export async function setCheckin(tx: Tx, who: Who, dayId: string, doneOn: string, done: boolean) {
  const [day] = await tx
    .select({ programId: programDays.programId })
    .from(programDays)
    .innerJoin(programs, eq(programs.id, programDays.programId))
    .where(
      and(
        eq(programDays.id, dayId),
        eq(programs.clientId, who.clientId),
        eq(programs.trainerId, who.trainerId),
        isNotNull(programs.sentAt),
        isNull(programs.archivedAt),
      ),
    );
  if (!day) return false;
  if (done) {
    await tx.insert(programCheckins).values({ ...who, programId: day.programId, dayId, doneOn }).onConflictDoNothing();
  } else {
    await tx.delete(programCheckins).where(and(eq(programCheckins.dayId, dayId), eq(programCheckins.doneOn, doneOn), eq(programCheckins.clientId, who.clientId)));
  }
  return true;
}
