// What can be measured. Built-in metrics have a stable key stored in
// measurements.metric; a trainer's own metrics (measurement_types) are stored
// by their id. Ranges catch typos ("750" kg) without being clever.

export type MetricDef = { key: string; label: string; unit: string; decimals: number; min: number; max: number; custom?: boolean };

export const BUILTIN_METRICS = [
  { key: "weight", label: "Kilo", unit: "kg", decimals: 1, min: 20, max: 350 },
  { key: "bodyFat", label: "Yağ oranı", unit: "%", decimals: 1, min: 2, max: 70 },
  { key: "muscle", label: "Kas kütlesi", unit: "kg", decimals: 1, min: 5, max: 150 },
  { key: "waist", label: "Bel", unit: "cm", decimals: 1, min: 30, max: 250 },
  { key: "hip", label: "Kalça", unit: "cm", decimals: 1, min: 40, max: 250 },
  { key: "chest", label: "Göğüs", unit: "cm", decimals: 1, min: 40, max: 250 },
  { key: "arm", label: "Kol", unit: "cm", decimals: 1, min: 10, max: 80 },
  { key: "thigh", label: "Bacak", unit: "cm", decimals: 1, min: 20, max: 120 },
  { key: "height", label: "Boy", unit: "cm", decimals: 0, min: 80, max: 230 },
  { key: "restingHr", label: "Dinlenik nabız", unit: "atım/dk", decimals: 0, min: 30, max: 140 },
  { key: "flexibility", label: "Esneklik (otur-uzan)", unit: "cm", decimals: 1, min: -40, max: 60 },
  { key: "pain", label: "Ağrı (0–10)", unit: "", decimals: 0, min: 0, max: 10 },
] as const satisfies readonly MetricDef[];

export type BuiltinMetric = (typeof BUILTIN_METRICS)[number]["key"];

const BUILTIN = new Map<string, MetricDef>(BUILTIN_METRICS.map((m) => [m.key, m]));

/** The forms' metrics when the trainer hasn't picked any, by discipline. */
export const DEFAULT_METRICS: Record<"pt" | "pilates" | "both", BuiltinMetric[]> = {
  pt: ["weight", "bodyFat", "muscle", "waist", "hip"],
  pilates: ["weight", "waist", "flexibility", "pain"],
  both: ["weight", "bodyFat", "waist", "hip", "flexibility"],
};

/** The metric the client may log from their page. */
export const SELF_METRIC: BuiltinMetric = "weight";

export type CustomType = { id: string; label: string; unit: string; decimals: number; archivedAt?: Date | null };

const customDef = (t: CustomType): MetricDef => ({
  key: t.id,
  label: t.label,
  unit: t.unit,
  decimals: t.decimals,
  min: -1_000_000,
  max: 1_000_000,
  custom: true,
});

/** Every metric a value can be stored under for this trainer (archived custom ones too, so old data still reads). */
export function metricCatalog(custom: CustomType[]) {
  const map = new Map(BUILTIN);
  for (const t of custom) map.set(t.id, customDef(t));
  return map;
}

/** The metrics shown on the trainer's "Ölçüm ekle" form, in order. */
export function activeMetrics(selected: string[] | null | undefined, discipline: "pt" | "pilates" | "both", custom: CustomType[]): MetricDef[] {
  const catalog = metricCatalog(custom.filter((t) => !t.archivedAt));
  const keys = selected && selected.length > 0 ? selected : DEFAULT_METRICS[discipline];
  return keys.map((k) => catalog.get(k)).filter((m): m is MetricDef => Boolean(m));
}

/** Parses "72,5" / "72.5"; null when empty, an error message when out of range. */
export function parseMetricValue(raw: string, def: MetricDef): { value: number | null } | { error: string } {
  const t = raw.trim().replace(",", ".");
  if (t === "") return { value: null };
  const n = Number(t);
  if (!Number.isFinite(n)) return { error: `${def.label}: sayı yaz.` };
  if (n < def.min || n > def.max) return { error: `${def.label}: ${def.min}–${def.max}${def.unit ? ` ${def.unit}` : ""} arasında olmalı.` };
  const factor = 10 ** def.decimals;
  return { value: Math.round(n * factor) / factor };
}

export function formatMetric(value: number, def: Pick<MetricDef, "unit" | "decimals">, { sign = false } = {}) {
  const text = new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 0, maximumFractionDigits: def.decimals }).format(Math.abs(value));
  const prefix = value < 0 ? "−" : sign && value > 0 ? "+" : "";
  return `${prefix}${text}${def.unit ? (def.unit === "%" ? "%" : ` ${def.unit}`) : ""}`;
}

export type Point = { date: string; value: number };
export type Series = { metric: MetricDef; points: Point[] };

/** First → last change, and how many days it took. */
export function seriesChange(points: Point[]) {
  if (points.length < 2) return null;
  const first = points[0];
  const last = points[points.length - 1];
  const days = Math.round((Date.parse(last.date) - Date.parse(first.date)) / 86_400_000);
  return { delta: last.value - first.value, days };
}

/** "8 haftada", "12 günde", "3 ayda". */
export function spanPhrase(days: number) {
  if (days < 14) return `${days} günde`;
  if (days < 70) return `${Math.round(days / 7)} haftada`;
  return `${Math.round(days / 30)} ayda`;
}
