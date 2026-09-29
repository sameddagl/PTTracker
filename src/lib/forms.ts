import type { z } from "zod";

/** State returned by form server actions used with useActionState. */
export type FormState<K extends string = string> = {
  errors?: Partial<Record<K, string>>;
  /** Raw submitted values, echoed back so the form keeps them after an error. */
  values?: Record<string, string>;
  /** Set on success; lets the form react (toast, reset) once per save. */
  savedAt?: number;
};

export function readForm<K extends string>(formData: FormData, keys: readonly K[]): Record<K, string> {
  return Object.fromEntries(keys.map((k) => [k, formData.get(k)?.toString() ?? ""])) as Record<K, string>;
}

/** First message per top-level field. */
export function fieldErrors<K extends string>(error: z.ZodError): Partial<Record<K, string>> {
  const errors: Partial<Record<K, string>> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form") as K;
    errors[key] ??= issue.message;
  }
  return errors;
}

/** Parses Turkish-formatted amounts: "4.000", "4000,50", "₺ 1 250" → 4000, 4000.5, 1250. */
export function parseTRY(raw: string): number | null {
  const cleaned = raw.replace(/[₺\s]/g, "").replace(/\.(?=\d{3}(\D|$))/g, "").replace(",", ".");
  if (cleaned === "") return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : NaN;
}
