import { z } from "zod";

// Workout and nutrition programs: the editor's input shape and the starter
// exercise library every trainer gets on first use (they can edit or remove any).

export const EXERCISE_CATEGORIES = ["Bacak", "Kalça", "Göğüs", "Sırt", "Omuz", "Kol", "Core", "Kardiyo", "Reformer", "Mat pilates", "Esneme"] as const;

export const STARTER_EXERCISES: { name: string; category: (typeof EXERCISE_CATEGORIES)[number] }[] = [
  // Bacak
  { name: "Squat", category: "Bacak" },
  { name: "Goblet squat", category: "Bacak" },
  { name: "Front squat", category: "Bacak" },
  { name: "Bulgarian split squat", category: "Bacak" },
  { name: "Lunge", category: "Bacak" },
  { name: "Walking lunge", category: "Bacak" },
  { name: "Leg press", category: "Bacak" },
  { name: "Leg extension", category: "Bacak" },
  { name: "Leg curl", category: "Bacak" },
  { name: "Romanian deadlift", category: "Bacak" },
  { name: "Step-up", category: "Bacak" },
  { name: "Calf raise", category: "Bacak" },
  { name: "Wall sit", category: "Bacak" },
  // Kalça
  { name: "Hip thrust", category: "Kalça" },
  { name: "Glute bridge", category: "Kalça" },
  { name: "Tek bacak glute bridge", category: "Kalça" },
  { name: "Cable kickback", category: "Kalça" },
  { name: "Hip abduction", category: "Kalça" },
  { name: "Clamshell", category: "Kalça" },
  { name: "Donkey kick", category: "Kalça" },
  // Göğüs
  { name: "Bench press", category: "Göğüs" },
  { name: "Incline dumbbell press", category: "Göğüs" },
  { name: "Dumbbell fly", category: "Göğüs" },
  { name: "Cable crossover", category: "Göğüs" },
  { name: "Şınav", category: "Göğüs" },
  { name: "Diz üstü şınav", category: "Göğüs" },
  { name: "Chest press makinesi", category: "Göğüs" },
  // Sırt
  { name: "Deadlift", category: "Sırt" },
  { name: "Barfiks", category: "Sırt" },
  { name: "Lat pulldown", category: "Sırt" },
  { name: "Seated cable row", category: "Sırt" },
  { name: "Dumbbell row", category: "Sırt" },
  { name: "Barbell row", category: "Sırt" },
  { name: "Face pull", category: "Sırt" },
  { name: "Back extension", category: "Sırt" },
  { name: "Superman", category: "Sırt" },
  // Omuz
  { name: "Overhead press", category: "Omuz" },
  { name: "Dumbbell shoulder press", category: "Omuz" },
  { name: "Lateral raise", category: "Omuz" },
  { name: "Front raise", category: "Omuz" },
  { name: "Rear delt fly", category: "Omuz" },
  { name: "Arnold press", category: "Omuz" },
  // Kol
  { name: "Biceps curl", category: "Kol" },
  { name: "Hammer curl", category: "Kol" },
  { name: "Triceps pushdown", category: "Kol" },
  { name: "Overhead triceps extension", category: "Kol" },
  { name: "Dips", category: "Kol" },
  // Core
  { name: "Plank", category: "Core" },
  { name: "Yan plank", category: "Core" },
  { name: "Dead bug", category: "Core" },
  { name: "Bird dog", category: "Core" },
  { name: "Crunch", category: "Core" },
  { name: "Bicycle crunch", category: "Core" },
  { name: "Russian twist", category: "Core" },
  { name: "Mountain climber", category: "Core" },
  { name: "Hanging leg raise", category: "Core" },
  { name: "Pallof press", category: "Core" },
  // Kardiyo
  { name: "Koşu bandı", category: "Kardiyo" },
  { name: "Bisiklet", category: "Kardiyo" },
  { name: "Kürek makinesi", category: "Kardiyo" },
  { name: "İp atlama", category: "Kardiyo" },
  { name: "Burpee", category: "Kardiyo" },
  { name: "Kettlebell swing", category: "Kardiyo" },
  { name: "Jumping jack", category: "Kardiyo" },
  // Reformer
  { name: "Footwork", category: "Reformer" },
  { name: "Hundred", category: "Reformer" },
  { name: "Frog", category: "Reformer" },
  { name: "Leg circles", category: "Reformer" },
  { name: "Short spine", category: "Reformer" },
  { name: "Elephant", category: "Reformer" },
  { name: "Knee stretches", category: "Reformer" },
  { name: "Long stretch", category: "Reformer" },
  { name: "Rowing", category: "Reformer" },
  { name: "Side splits", category: "Reformer" },
  { name: "Feet in straps", category: "Reformer" },
  { name: "Bridging", category: "Reformer" },
  // Mat pilates
  { name: "Roll up", category: "Mat pilates" },
  { name: "Single leg stretch", category: "Mat pilates" },
  { name: "Double leg stretch", category: "Mat pilates" },
  { name: "Spine stretch forward", category: "Mat pilates" },
  { name: "Saw", category: "Mat pilates" },
  { name: "Swan", category: "Mat pilates" },
  { name: "Swimming", category: "Mat pilates" },
  { name: "Side kick series", category: "Mat pilates" },
  { name: "Teaser", category: "Mat pilates" },
  { name: "Rolling like a ball", category: "Mat pilates" },
  // Esneme
  { name: "Hamstring esneme", category: "Esneme" },
  { name: "Kalça fleksör esneme", category: "Esneme" },
  { name: "Göğüs açma", category: "Esneme" },
  { name: "Kedi-deve", category: "Esneme" },
  { name: "Çocuk pozu", category: "Esneme" },
  { name: "Thoracic rotation", category: "Esneme" },
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
