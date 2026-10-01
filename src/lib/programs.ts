import { z } from "zod";
import type { MuscleKey } from "./muscles";

// Workout and nutrition programs: the editor's input shape and the starter
// exercise library every trainer gets on first use (they can edit or remove any).

export const EXERCISE_CATEGORIES = ["Bacak", "Kalça", "Göğüs", "Sırt", "Omuz", "Kol", "Core", "Kardiyo", "Reformer", "Mat pilates", "Esneme"] as const;

export const STARTER_EXERCISES: { name: string; category: (typeof EXERCISE_CATEGORIES)[number]; primary: MuscleKey[]; secondary: MuscleKey[] }[] = [
  // Bacak
  { name: "Squat", category: "Bacak", primary: ["quadriceps", "gluteal"], secondary: ["hamstring", "adductor", "lower-back"] },
  { name: "Goblet squat", category: "Bacak", primary: ["quadriceps", "gluteal"], secondary: ["hamstring", "abs"] },
  { name: "Front squat", category: "Bacak", primary: ["quadriceps"], secondary: ["gluteal", "abs"] },
  { name: "Bulgarian split squat", category: "Bacak", primary: ["quadriceps", "gluteal"], secondary: ["hamstring", "adductor"] },
  { name: "Lunge", category: "Bacak", primary: ["quadriceps", "gluteal"], secondary: ["hamstring", "calves"] },
  { name: "Walking lunge", category: "Bacak", primary: ["quadriceps", "gluteal"], secondary: ["hamstring", "calves"] },
  { name: "Leg press", category: "Bacak", primary: ["quadriceps"], secondary: ["gluteal", "hamstring"] },
  { name: "Leg extension", category: "Bacak", primary: ["quadriceps"], secondary: [] },
  { name: "Leg curl", category: "Bacak", primary: ["hamstring"], secondary: ["calves"] },
  { name: "Romanian deadlift", category: "Bacak", primary: ["hamstring", "gluteal"], secondary: ["lower-back"] },
  { name: "Step-up", category: "Bacak", primary: ["quadriceps", "gluteal"], secondary: ["hamstring", "calves"] },
  { name: "Calf raise", category: "Bacak", primary: ["calves"], secondary: [] },
  { name: "Wall sit", category: "Bacak", primary: ["quadriceps"], secondary: ["gluteal"] },
  // Kalça
  { name: "Hip thrust", category: "Kalça", primary: ["gluteal"], secondary: ["hamstring"] },
  { name: "Glute bridge", category: "Kalça", primary: ["gluteal"], secondary: ["hamstring", "lower-back"] },
  { name: "Tek bacak glute bridge", category: "Kalça", primary: ["gluteal"], secondary: ["hamstring", "abs"] },
  { name: "Cable kickback", category: "Kalça", primary: ["gluteal"], secondary: ["hamstring"] },
  { name: "Hip abduction", category: "Kalça", primary: ["abductors"], secondary: ["gluteal"] },
  { name: "Clamshell", category: "Kalça", primary: ["abductors"], secondary: ["gluteal"] },
  { name: "Donkey kick", category: "Kalça", primary: ["gluteal"], secondary: ["hamstring"] },
  // Göğüs
  { name: "Bench press", category: "Göğüs", primary: ["chest"], secondary: ["triceps", "front-deltoids"] },
  { name: "Incline dumbbell press", category: "Göğüs", primary: ["chest", "front-deltoids"], secondary: ["triceps"] },
  { name: "Dumbbell fly", category: "Göğüs", primary: ["chest"], secondary: ["front-deltoids"] },
  { name: "Cable crossover", category: "Göğüs", primary: ["chest"], secondary: ["front-deltoids"] },
  { name: "Şınav", category: "Göğüs", primary: ["chest"], secondary: ["triceps", "front-deltoids", "abs"] },
  { name: "Diz üstü şınav", category: "Göğüs", primary: ["chest"], secondary: ["triceps", "front-deltoids"] },
  { name: "Chest press makinesi", category: "Göğüs", primary: ["chest"], secondary: ["triceps", "front-deltoids"] },
  // Sırt
  { name: "Deadlift", category: "Sırt", primary: ["hamstring", "gluteal", "lower-back"], secondary: ["quadriceps", "trapezius", "forearm"] },
  { name: "Barfiks", category: "Sırt", primary: ["upper-back"], secondary: ["biceps", "forearm"] },
  { name: "Lat pulldown", category: "Sırt", primary: ["upper-back"], secondary: ["biceps"] },
  { name: "Seated cable row", category: "Sırt", primary: ["upper-back"], secondary: ["biceps", "back-deltoids"] },
  { name: "Dumbbell row", category: "Sırt", primary: ["upper-back"], secondary: ["biceps", "back-deltoids"] },
  { name: "Barbell row", category: "Sırt", primary: ["upper-back"], secondary: ["biceps", "lower-back", "back-deltoids"] },
  { name: "Face pull", category: "Sırt", primary: ["back-deltoids"], secondary: ["trapezius", "upper-back"] },
  { name: "Back extension", category: "Sırt", primary: ["lower-back"], secondary: ["gluteal", "hamstring"] },
  { name: "Superman", category: "Sırt", primary: ["lower-back"], secondary: ["gluteal"] },
  // Omuz
  { name: "Overhead press", category: "Omuz", primary: ["front-deltoids"], secondary: ["triceps", "trapezius"] },
  { name: "Dumbbell shoulder press", category: "Omuz", primary: ["front-deltoids"], secondary: ["triceps"] },
  { name: "Lateral raise", category: "Omuz", primary: ["front-deltoids", "back-deltoids"], secondary: ["trapezius"] },
  { name: "Front raise", category: "Omuz", primary: ["front-deltoids"], secondary: [] },
  { name: "Rear delt fly", category: "Omuz", primary: ["back-deltoids"], secondary: ["trapezius", "upper-back"] },
  { name: "Arnold press", category: "Omuz", primary: ["front-deltoids"], secondary: ["triceps"] },
  // Kol
  { name: "Biceps curl", category: "Kol", primary: ["biceps"], secondary: ["forearm"] },
  { name: "Hammer curl", category: "Kol", primary: ["biceps", "forearm"], secondary: [] },
  { name: "Triceps pushdown", category: "Kol", primary: ["triceps"], secondary: [] },
  { name: "Overhead triceps extension", category: "Kol", primary: ["triceps"], secondary: [] },
  { name: "Dips", category: "Kol", primary: ["triceps", "chest"], secondary: ["front-deltoids"] },
  // Core
  { name: "Plank", category: "Core", primary: ["abs"], secondary: ["obliques", "front-deltoids"] },
  { name: "Yan plank", category: "Core", primary: ["obliques"], secondary: ["abs", "abductors"] },
  { name: "Dead bug", category: "Core", primary: ["abs"], secondary: ["obliques"] },
  { name: "Bird dog", category: "Core", primary: ["lower-back", "abs"], secondary: ["gluteal"] },
  { name: "Crunch", category: "Core", primary: ["abs"], secondary: [] },
  { name: "Bicycle crunch", category: "Core", primary: ["abs", "obliques"], secondary: [] },
  { name: "Russian twist", category: "Core", primary: ["obliques"], secondary: ["abs"] },
  { name: "Mountain climber", category: "Core", primary: ["abs"], secondary: ["front-deltoids", "quadriceps"] },
  { name: "Hanging leg raise", category: "Core", primary: ["abs"], secondary: ["forearm", "obliques"] },
  { name: "Pallof press", category: "Core", primary: ["obliques", "abs"], secondary: [] },
  // Kardiyo
  { name: "Koşu bandı", category: "Kardiyo", primary: ["quadriceps", "calves"], secondary: ["hamstring", "gluteal"] },
  { name: "Bisiklet", category: "Kardiyo", primary: ["quadriceps"], secondary: ["calves", "hamstring"] },
  { name: "Kürek makinesi", category: "Kardiyo", primary: ["upper-back", "quadriceps"], secondary: ["biceps", "hamstring"] },
  { name: "İp atlama", category: "Kardiyo", primary: ["calves"], secondary: ["quadriceps"] },
  { name: "Burpee", category: "Kardiyo", primary: ["quadriceps", "chest"], secondary: ["abs", "front-deltoids"] },
  { name: "Kettlebell swing", category: "Kardiyo", primary: ["gluteal", "hamstring"], secondary: ["lower-back", "front-deltoids"] },
  { name: "Jumping jack", category: "Kardiyo", primary: ["calves"], secondary: ["abductors", "front-deltoids"] },
  // Reformer
  { name: "Footwork", category: "Reformer", primary: ["quadriceps", "calves"], secondary: ["gluteal", "hamstring"] },
  { name: "Hundred", category: "Reformer", primary: ["abs"], secondary: ["front-deltoids"] },
  { name: "Frog", category: "Reformer", primary: ["adductor"], secondary: ["gluteal", "abs"] },
  { name: "Leg circles", category: "Reformer", primary: ["adductor", "abs"], secondary: ["abductors"] },
  { name: "Short spine", category: "Reformer", primary: ["abs", "hamstring"], secondary: ["lower-back"] },
  { name: "Elephant", category: "Reformer", primary: ["abs", "hamstring"], secondary: ["front-deltoids"] },
  { name: "Knee stretches", category: "Reformer", primary: ["abs"], secondary: ["front-deltoids", "quadriceps"] },
  { name: "Long stretch", category: "Reformer", primary: ["abs", "front-deltoids"], secondary: ["chest"] },
  { name: "Rowing", category: "Reformer", primary: ["upper-back", "back-deltoids"], secondary: ["biceps", "abs"] },
  { name: "Side splits", category: "Reformer", primary: ["adductor", "abductors"], secondary: ["gluteal"] },
  { name: "Feet in straps", category: "Reformer", primary: ["hamstring", "adductor"], secondary: ["abs"] },
  { name: "Bridging", category: "Reformer", primary: ["gluteal", "hamstring"], secondary: ["lower-back"] },
  // Mat pilates
  { name: "Roll up", category: "Mat pilates", primary: ["abs"], secondary: [] },
  { name: "Single leg stretch", category: "Mat pilates", primary: ["abs"], secondary: [] },
  { name: "Double leg stretch", category: "Mat pilates", primary: ["abs"], secondary: [] },
  { name: "Spine stretch forward", category: "Mat pilates", primary: ["hamstring", "lower-back"], secondary: [] },
  { name: "Saw", category: "Mat pilates", primary: ["obliques", "hamstring"], secondary: ["upper-back"] },
  { name: "Swan", category: "Mat pilates", primary: ["lower-back"], secondary: ["gluteal", "upper-back"] },
  { name: "Swimming", category: "Mat pilates", primary: ["lower-back", "gluteal"], secondary: ["back-deltoids"] },
  { name: "Side kick series", category: "Mat pilates", primary: ["abductors", "gluteal"], secondary: ["obliques"] },
  { name: "Teaser", category: "Mat pilates", primary: ["abs"], secondary: ["quadriceps"] },
  { name: "Rolling like a ball", category: "Mat pilates", primary: ["abs"], secondary: [] },
  // Esneme
  { name: "Hamstring esneme", category: "Esneme", primary: ["hamstring"], secondary: [] },
  { name: "Kalça fleksör esneme", category: "Esneme", primary: ["quadriceps"], secondary: [] },
  { name: "Göğüs açma", category: "Esneme", primary: ["chest"], secondary: ["front-deltoids"] },
  { name: "Kedi-deve", category: "Esneme", primary: ["lower-back", "upper-back"], secondary: ["abs"] },
  { name: "Çocuk pozu", category: "Esneme", primary: ["lower-back", "upper-back"], secondary: [] },
  { name: "Thoracic rotation", category: "Esneme", primary: ["upper-back", "obliques"], secondary: [] },
];

const opt = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => v || null)
    .nullable()
    .optional()
    .transform((v) => v ?? null);

export const programItemSchema = z.object({
  exerciseId: z.uuid().nullable().optional().transform((v) => v ?? null),
  name: z.string().trim().min(1, "Hareketin adını yaz.").max(300),
  sets: z
    .union([z.number().int().min(1).max(50), z.null()])
    .optional()
    .transform((v) => v ?? null),
  reps: opt(20),
  load: opt(30),
  rest: opt(20),
  note: opt(300),
});

export const programDaySchema = z.object({
  title: z.string().trim().min(1, "Günün adını yaz.").max(60),
  items: z.array(programItemSchema).max(40),
});

export const programInputSchema = z.object({
  name: z.string().trim().min(1, "Programa bir ad ver.").max(80),
  note: opt(1000),
  startsOn: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .optional()
    .transform((v) => v ?? null),
  targets: z.record(z.string().max(20), z.string().trim().max(40)).optional().default({}),
  days: z.array(programDaySchema).min(1, "En az bir gün ekle.").max(14),
});

export type ProgramInput = z.infer<typeof programInputSchema>;

/** Nutrition plans: the daily targets the trainer can set. */
export const NUTRITION_TARGETS = [
  { key: "water", label: "Su", placeholder: "2,5 litre" },
  { key: "protein", label: "Protein", placeholder: "110 g" },
  { key: "steps", label: "Adım", placeholder: "8.000" },
  { key: "calories", label: "Kalori", placeholder: "1.800 kcal" },
] as const;

/** Meals offered when a nutrition plan starts empty. */
export const DEFAULT_MEALS = ["Kahvaltı", "Ara öğün", "Öğle", "Ara öğün", "Akşam"];

export const NUTRITION_DISCLAIMER =
  "Bu plan genel beslenme önerisidir, tıbbi diyet tedavisi değildir. Bir sağlık sorunun varsa diyetisyenine ya da doktoruna danış.";

/** "3 × 10–12 · 40 kg · 60 sn dinlenme" for the client's view. */
export function itemSummary(i: { sets: number | null; reps: string | null; load: string | null; rest: string | null }) {
  const volume = i.sets && i.reps ? `${i.sets} × ${i.reps}` : i.sets ? `${i.sets} set` : (i.reps ?? "");
  return [volume, i.load, i.rest && `${i.rest} dinlenme`].filter(Boolean).join(" · ");
}

/** Accepts YouTube/Instagram/any https link; returns null for anything else. */
export function cleanVideoUrl(raw: string | null | undefined) {
  const t = raw?.trim();
  if (!t) return null;
  try {
    const u = new URL(t);
    return u.protocol === "https:" ? u.toString() : null;
  } catch {
    return null;
  }
}

type ItemFields = { exerciseId: string | null; name: string; sets: number | null; reps: string | null; load: string | null; rest: string | null; note: string | null };

/** A stored program's days in the editor's (and copy's) input shape. */
export const toInputDays = (days: { title: string; items: ItemFields[] }[]) =>
  days.map((d) => ({
    title: d.title,
    items: d.items.map((i) => ({ exerciseId: i.exerciseId, name: i.name, sets: i.sets, reps: i.reps, load: i.load, rest: i.rest, note: i.note })),
  }));
