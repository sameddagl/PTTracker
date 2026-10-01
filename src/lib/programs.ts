import { z } from "zod";
import type { MuscleKey } from "./muscles";

// Workout and nutrition programs: the editor's input shape and the starter
// exercise library every trainer gets on first use (they can edit or remove any).

export const EXERCISE_CATEGORIES = ["Bacak", "Kalça", "Göğüs", "Sırt", "Omuz", "Kol", "Core", "Kardiyo", "Fonksiyonel", "Reformer", "Mat pilates", "Esneme"] as const;

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
  { name: "Hack squat", category: "Bacak", primary: ["quadriceps"], secondary: ["gluteal"] },
  { name: "Smith machine squat", category: "Bacak", primary: ["quadriceps", "gluteal"], secondary: ["hamstring"] },
  { name: "Sumo squat", category: "Bacak", primary: ["adductor", "gluteal"], secondary: ["quadriceps"] },
  { name: "Box squat", category: "Bacak", primary: ["quadriceps", "gluteal"], secondary: ["hamstring"] },
  { name: "Pistol squat", category: "Bacak", primary: ["quadriceps", "gluteal"], secondary: ["abs"] },
  { name: "Lying leg curl", category: "Bacak", primary: ["hamstring"], secondary: ["calves"] },
  { name: "Seated leg curl", category: "Bacak", primary: ["hamstring"], secondary: [] },
  { name: "Nordic curl", category: "Bacak", primary: ["hamstring"], secondary: ["calves"] },
  { name: "Reverse lunge", category: "Bacak", primary: ["quadriceps", "gluteal"], secondary: ["hamstring"] },
  { name: "Lateral lunge", category: "Bacak", primary: ["adductor", "quadriceps"], secondary: ["gluteal"] },
  { name: "Seated calf raise", category: "Bacak", primary: ["calves"], secondary: [] },
  { name: "Leg press calf raise", category: "Bacak", primary: ["calves"], secondary: [] },
  { name: "Adductor makinesi", category: "Bacak", primary: ["adductor"], secondary: [] },
  { name: "Sumo deadlift", category: "Bacak", primary: ["gluteal", "adductor", "hamstring"], secondary: ["quadriceps", "lower-back"] },
  { name: "Trap bar deadlift", category: "Bacak", primary: ["quadriceps", "gluteal"], secondary: ["hamstring", "lower-back", "trapezius"] },
  { name: "Tek bacak Romanian deadlift", category: "Bacak", primary: ["hamstring", "gluteal"], secondary: ["lower-back"] },
  // Kalça
  { name: "Hip thrust", category: "Kalça", primary: ["gluteal"], secondary: ["hamstring"] },
  { name: "Glute bridge", category: "Kalça", primary: ["gluteal"], secondary: ["hamstring", "lower-back"] },
  { name: "Tek bacak glute bridge", category: "Kalça", primary: ["gluteal"], secondary: ["hamstring", "abs"] },
  { name: "Cable kickback", category: "Kalça", primary: ["gluteal"], secondary: ["hamstring"] },
  { name: "Hip abduction", category: "Kalça", primary: ["abductors"], secondary: ["gluteal"] },
  { name: "Clamshell", category: "Kalça", primary: ["abductors"], secondary: ["gluteal"] },
  { name: "Donkey kick", category: "Kalça", primary: ["gluteal"], secondary: ["hamstring"] },
  { name: "Abductor makinesi", category: "Kalça", primary: ["abductors"], secondary: ["gluteal"] },
  { name: "Glute kickback makinesi", category: "Kalça", primary: ["gluteal"], secondary: ["hamstring"] },
  { name: "Frog pump", category: "Kalça", primary: ["gluteal"], secondary: ["adductor"] },
  { name: "Fire hydrant", category: "Kalça", primary: ["abductors", "gluteal"], secondary: [] },
  { name: "Bantla yan yürüyüş", category: "Kalça", primary: ["abductors"], secondary: ["gluteal"] },
  { name: "Cable pull-through", category: "Kalça", primary: ["gluteal", "hamstring"], secondary: ["lower-back"] },
  { name: "Smith machine hip thrust", category: "Kalça", primary: ["gluteal"], secondary: ["hamstring"] },
  // Göğüs
  { name: "Bench press", category: "Göğüs", primary: ["chest"], secondary: ["triceps", "front-deltoids"] },
  { name: "Incline dumbbell press", category: "Göğüs", primary: ["chest", "front-deltoids"], secondary: ["triceps"] },
  { name: "Dumbbell fly", category: "Göğüs", primary: ["chest"], secondary: ["front-deltoids"] },
  { name: "Cable crossover", category: "Göğüs", primary: ["chest"], secondary: ["front-deltoids"] },
  { name: "Şınav", category: "Göğüs", primary: ["chest"], secondary: ["triceps", "front-deltoids", "abs"] },
  { name: "Diz üstü şınav", category: "Göğüs", primary: ["chest"], secondary: ["triceps", "front-deltoids"] },
  { name: "Chest press makinesi", category: "Göğüs", primary: ["chest"], secondary: ["triceps", "front-deltoids"] },
  { name: "Pec deck (pectoral)", category: "Göğüs", primary: ["chest"], secondary: ["front-deltoids"] },
  { name: "Incline bench press", category: "Göğüs", primary: ["chest", "front-deltoids"], secondary: ["triceps"] },
  { name: "Decline bench press", category: "Göğüs", primary: ["chest"], secondary: ["triceps"] },
  { name: "Dumbbell bench press", category: "Göğüs", primary: ["chest"], secondary: ["triceps", "front-deltoids"] },
  { name: "Incline chest press makinesi", category: "Göğüs", primary: ["chest", "front-deltoids"], secondary: ["triceps"] },
  { name: "Smith machine bench press", category: "Göğüs", primary: ["chest"], secondary: ["triceps", "front-deltoids"] },
  { name: "Incline dumbbell fly", category: "Göğüs", primary: ["chest"], secondary: ["front-deltoids"] },
  { name: "Pullover", category: "Göğüs", primary: ["chest", "upper-back"], secondary: ["triceps"] },
  { name: "Cable fly (aşağıdan yukarı)", category: "Göğüs", primary: ["chest"], secondary: ["front-deltoids"] },
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
  { name: "Low row", category: "Sırt", primary: ["upper-back"], secondary: ["biceps", "back-deltoids"] },
  { name: "T-bar row", category: "Sırt", primary: ["upper-back"], secondary: ["biceps", "lower-back", "back-deltoids"] },
  { name: "Pendlay row", category: "Sırt", primary: ["upper-back"], secondary: ["biceps", "lower-back"] },
  { name: "Chest supported row", category: "Sırt", primary: ["upper-back"], secondary: ["back-deltoids", "biceps"] },
  { name: "Row makinesi", category: "Sırt", primary: ["upper-back"], secondary: ["biceps", "back-deltoids"] },
  { name: "Close grip lat pulldown", category: "Sırt", primary: ["upper-back"], secondary: ["biceps"] },
  { name: "Straight arm pulldown", category: "Sırt", primary: ["upper-back"], secondary: ["triceps"] },
  { name: "Destekli barfiks", category: "Sırt", primary: ["upper-back"], secondary: ["biceps"] },
  { name: "Inverted row", category: "Sırt", primary: ["upper-back"], secondary: ["biceps", "back-deltoids"] },
  { name: "Rack pull", category: "Sırt", primary: ["lower-back", "gluteal"], secondary: ["hamstring", "trapezius"] },
  { name: "Good morning", category: "Sırt", primary: ["hamstring", "lower-back"], secondary: ["gluteal"] },
  { name: "Shrug", category: "Sırt", primary: ["trapezius"], secondary: ["forearm"] },
  { name: "Dumbbell shrug", category: "Sırt", primary: ["trapezius"], secondary: ["forearm"] },
  // Omuz
  { name: "Overhead press", category: "Omuz", primary: ["front-deltoids"], secondary: ["triceps", "trapezius"] },
  { name: "Dumbbell shoulder press", category: "Omuz", primary: ["front-deltoids"], secondary: ["triceps"] },
  { name: "Lateral raise", category: "Omuz", primary: ["front-deltoids", "back-deltoids"], secondary: ["trapezius"] },
  { name: "Front raise", category: "Omuz", primary: ["front-deltoids"], secondary: [] },
  { name: "Rear delt fly", category: "Omuz", primary: ["back-deltoids"], secondary: ["trapezius", "upper-back"] },
  { name: "Arnold press", category: "Omuz", primary: ["front-deltoids"], secondary: ["triceps"] },
  { name: "Shoulder press makinesi", category: "Omuz", primary: ["front-deltoids"], secondary: ["triceps"] },
  { name: "Cable lateral raise", category: "Omuz", primary: ["front-deltoids"], secondary: ["trapezius"] },
  { name: "Reverse pec deck", category: "Omuz", primary: ["back-deltoids"], secondary: ["trapezius", "upper-back"] },
  { name: "Upright row", category: "Omuz", primary: ["front-deltoids", "trapezius"], secondary: ["biceps"] },
  { name: "Landmine press", category: "Omuz", primary: ["front-deltoids", "chest"], secondary: ["triceps"] },
  { name: "Push press", category: "Omuz", primary: ["front-deltoids"], secondary: ["triceps", "quadriceps"] },
  // Kol
  { name: "Biceps curl", category: "Kol", primary: ["biceps"], secondary: ["forearm"] },
  { name: "Hammer curl", category: "Kol", primary: ["biceps", "forearm"], secondary: [] },
  { name: "Triceps pushdown", category: "Kol", primary: ["triceps"], secondary: [] },
  { name: "Overhead triceps extension", category: "Kol", primary: ["triceps"], secondary: [] },
  { name: "Dips", category: "Kol", primary: ["triceps", "chest"], secondary: ["front-deltoids"] },
  { name: "Arm curl makinesi", category: "Kol", primary: ["biceps"], secondary: ["forearm"] },
  { name: "Arm extension makinesi", category: "Kol", primary: ["triceps"], secondary: [] },
  { name: "Preacher curl", category: "Kol", primary: ["biceps"], secondary: ["forearm"] },
  { name: "Concentration curl", category: "Kol", primary: ["biceps"], secondary: [] },
  { name: "Cable curl", category: "Kol", primary: ["biceps"], secondary: ["forearm"] },
  { name: "Incline dumbbell curl", category: "Kol", primary: ["biceps"], secondary: [] },
  { name: "EZ bar curl", category: "Kol", primary: ["biceps"], secondary: ["forearm"] },
  { name: "Skull crusher", category: "Kol", primary: ["triceps"], secondary: [] },
  { name: "Close grip bench press", category: "Kol", primary: ["triceps", "chest"], secondary: ["front-deltoids"] },
  { name: "Triceps kickback", category: "Kol", primary: ["triceps"], secondary: [] },
  { name: "Bench dips", category: "Kol", primary: ["triceps"], secondary: ["chest", "front-deltoids"] },
  { name: "Rope pushdown", category: "Kol", primary: ["triceps"], secondary: [] },
  { name: "Wrist curl", category: "Kol", primary: ["forearm"], secondary: [] },
  { name: "Reverse curl", category: "Kol", primary: ["forearm", "biceps"], secondary: [] },
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
  { name: "Cable crunch", category: "Core", primary: ["abs"], secondary: ["obliques"] },
  { name: "Ab wheel rollout", category: "Core", primary: ["abs"], secondary: ["front-deltoids", "lower-back"] },
  { name: "Leg raise", category: "Core", primary: ["abs"], secondary: [] },
  { name: "Reverse crunch", category: "Core", primary: ["abs"], secondary: [] },
  { name: "Sit-up", category: "Core", primary: ["abs"], secondary: [] },
  { name: "V-up", category: "Core", primary: ["abs"], secondary: [] },
  { name: "Hollow hold", category: "Core", primary: ["abs"], secondary: [] },
  { name: "Woodchopper", category: "Core", primary: ["obliques"], secondary: ["abs"] },
  { name: "Side bend", category: "Core", primary: ["obliques"], secondary: [] },
  { name: "Copenhagen plank", category: "Core", primary: ["adductor", "obliques"], secondary: ["abs"] },
  { name: "Bear crawl", category: "Core", primary: ["abs", "front-deltoids"], secondary: ["quadriceps"] },
  { name: "Farmer's walk", category: "Core", primary: ["forearm", "trapezius"], secondary: ["abs"] },
  // Kardiyo
  { name: "Koşu bandı", category: "Kardiyo", primary: ["quadriceps", "calves"], secondary: ["hamstring", "gluteal"] },
  { name: "Bisiklet", category: "Kardiyo", primary: ["quadriceps"], secondary: ["calves", "hamstring"] },
  { name: "Kürek makinesi", category: "Kardiyo", primary: ["upper-back", "quadriceps"], secondary: ["biceps", "hamstring"] },
  { name: "İp atlama", category: "Kardiyo", primary: ["calves"], secondary: ["quadriceps"] },
  { name: "Burpee", category: "Kardiyo", primary: ["quadriceps", "chest"], secondary: ["abs", "front-deltoids"] },
  { name: "Kettlebell swing", category: "Kardiyo", primary: ["gluteal", "hamstring"], secondary: ["lower-back", "front-deltoids"] },
  { name: "Jumping jack", category: "Kardiyo", primary: ["calves"], secondary: ["abductors", "front-deltoids"] },
  { name: "Eliptik", category: "Kardiyo", primary: ["quadriceps", "gluteal"], secondary: ["hamstring", "calves"] },
  { name: "Merdiven makinesi", category: "Kardiyo", primary: ["gluteal", "quadriceps"], secondary: ["calves"] },
  { name: "Box jump", category: "Kardiyo", primary: ["quadriceps", "gluteal"], secondary: ["calves"] },
  { name: "Battle rope", category: "Kardiyo", primary: ["front-deltoids"], secondary: ["abs", "forearm"] },
  { name: "Sled push", category: "Kardiyo", primary: ["quadriceps", "gluteal"], secondary: ["calves"] },
  { name: "Air bike", category: "Kardiyo", primary: ["quadriceps"], secondary: ["front-deltoids"] },
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
  { name: "Stomach massage", category: "Reformer", primary: ["abs"], secondary: ["hamstring"] },
  { name: "Long box pulling straps", category: "Reformer", primary: ["upper-back", "back-deltoids"], secondary: ["triceps"] },
  { name: "Backstroke", category: "Reformer", primary: ["abs"], secondary: ["front-deltoids"] },
  { name: "Coordination", category: "Reformer", primary: ["abs"], secondary: ["triceps"] },
  { name: "Tendon stretch", category: "Reformer", primary: ["abs"], secondary: ["calves", "hamstring"] },
  { name: "Down stretch", category: "Reformer", primary: ["lower-back"], secondary: ["front-deltoids"] },
  { name: "Up stretch", category: "Reformer", primary: ["abs", "front-deltoids"], secondary: [] },
  { name: "Mermaid", category: "Reformer", primary: ["obliques"], secondary: [] },
  { name: "Chest expansion", category: "Reformer", primary: ["upper-back", "back-deltoids"], secondary: ["triceps"] },
  { name: "Arm circles", category: "Reformer", primary: ["front-deltoids"], secondary: ["chest"] },
  { name: "Reformer hamstring curl", category: "Reformer", primary: ["hamstring"], secondary: ["gluteal"] },
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
  { name: "Corkscrew", category: "Mat pilates", primary: ["obliques", "abs"], secondary: [] },
  { name: "Criss cross", category: "Mat pilates", primary: ["obliques", "abs"], secondary: [] },
  { name: "Open leg rocker", category: "Mat pilates", primary: ["abs"], secondary: ["hamstring"] },
  { name: "Shoulder bridge", category: "Mat pilates", primary: ["gluteal", "hamstring"], secondary: ["lower-back"] },
  { name: "Seal", category: "Mat pilates", primary: ["abs"], secondary: [] },
  { name: "Neck pull", category: "Mat pilates", primary: ["abs"], secondary: ["lower-back"] },
  { name: "Jackknife", category: "Mat pilates", primary: ["abs"], secondary: ["lower-back"] },
  { name: "Leg pull front", category: "Mat pilates", primary: ["abs", "front-deltoids"], secondary: ["gluteal"] },
  { name: "Leg pull back", category: "Mat pilates", primary: ["hamstring", "gluteal"], secondary: ["triceps"] },
  { name: "Single leg kick", category: "Mat pilates", primary: ["hamstring"], secondary: ["lower-back"] },
  { name: "Double leg kick", category: "Mat pilates", primary: ["lower-back", "hamstring"], secondary: ["upper-back"] },
  // Esneme
  { name: "Hamstring esneme", category: "Esneme", primary: ["hamstring"], secondary: [] },
  { name: "Kalça fleksör esneme", category: "Esneme", primary: ["quadriceps"], secondary: [] },
  { name: "Göğüs açma", category: "Esneme", primary: ["chest"], secondary: ["front-deltoids"] },
  { name: "Kedi-deve", category: "Esneme", primary: ["lower-back", "upper-back"], secondary: ["abs"] },
  { name: "Çocuk pozu", category: "Esneme", primary: ["lower-back", "upper-back"], secondary: [] },
  { name: "Thoracic rotation", category: "Esneme", primary: ["upper-back", "obliques"], secondary: [] },
  { name: "Quadriceps esneme", category: "Esneme", primary: ["quadriceps"], secondary: [] },
  { name: "Baldır esneme", category: "Esneme", primary: ["calves"], secondary: [] },
  { name: "Piriformis esneme", category: "Esneme", primary: ["gluteal"], secondary: [] },
  { name: "Omuz esneme", category: "Esneme", primary: ["back-deltoids"], secondary: [] },
  { name: "Triceps esneme", category: "Esneme", primary: ["triceps"], secondary: [] },
  { name: "Yan esneme", category: "Esneme", primary: ["obliques"], secondary: [] },
  { name: "Kobra", category: "Esneme", primary: ["abs"], secondary: ["lower-back"] },
  { name: "Güvercin pozu", category: "Esneme", primary: ["gluteal"], secondary: ["quadriceps"] },
  { name: "World's greatest stretch", category: "Esneme", primary: ["quadriceps", "hamstring"], secondary: ["upper-back"] },
  // Fonksiyonel
  { name: "Thruster", category: "Fonksiyonel", primary: ["quadriceps", "front-deltoids"], secondary: ["gluteal", "triceps"] },
  { name: "Wall ball", category: "Fonksiyonel", primary: ["quadriceps", "front-deltoids"], secondary: ["gluteal"] },
  { name: "Kettlebell clean", category: "Fonksiyonel", primary: ["hamstring", "gluteal", "trapezius"], secondary: ["quadriceps", "forearm"] },
  { name: "Turkish get-up", category: "Fonksiyonel", primary: ["abs", "front-deltoids"], secondary: ["gluteal", "obliques"] },
  { name: "Medicine ball slam", category: "Fonksiyonel", primary: ["abs"], secondary: ["front-deltoids", "upper-back"] },
  { name: "Goblet carry", category: "Fonksiyonel", primary: ["abs", "forearm"], secondary: ["biceps"] },
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
