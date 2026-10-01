import type { Region } from "./body-outline";

// Muscle groups an exercise works, as shown on the body figure. Keys are the
// figure's regions; stored in exercises.primary_muscles / secondary_muscles.

export const MUSCLES = {
  chest: "Göğüs",
  "front-deltoids": "Ön omuz",
  "back-deltoids": "Arka omuz",
  trapezius: "Trapez",
  "upper-back": "Sırt",
  "lower-back": "Bel",
  biceps: "Biceps",
  triceps: "Triceps",
  forearm: "Ön kol",
  abs: "Karın",
  obliques: "Yan karın",
  gluteal: "Kalça",
  abductors: "Dış kalça",
  adductor: "İç bacak",
  quadriceps: "Ön bacak",
  hamstring: "Arka bacak",
  calves: "Baldır",
} as const satisfies Partial<Record<Region, string>>;

export type MuscleKey = keyof typeof MUSCLES;

export const MUSCLE_KEYS = Object.keys(MUSCLES) as MuscleKey[];

export const isMuscle = (v: unknown): v is MuscleKey => typeof v === "string" && v in MUSCLES;

/** Keeps known keys, once each, in the catalog order. */
export const cleanMuscles = (list: unknown): MuscleKey[] =>
  Array.isArray(list) ? MUSCLE_KEYS.filter((k) => list.includes(k)) : [];

/** Primary and secondary muscles of several exercises together (a day of a program). */
export function combineMuscles(items: { primary: MuscleKey[]; secondary: MuscleKey[] }[]) {
  const primary = new Set<MuscleKey>();
  const secondary = new Set<MuscleKey>();
  for (const i of items) {
    i.primary.forEach((m) => primary.add(m));
    i.secondary.forEach((m) => secondary.add(m));
  }
  primary.forEach((m) => secondary.delete(m));
  return { primary: [...primary], secondary: [...secondary] };
}
