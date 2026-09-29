// Trainer-defined sign-up questions: types, defaults and answer parsing.
// Shared by the form builder, the public sign-up form and the server.

import { parseTRY } from "./forms";

export const INTAKE_TYPES = ["short_text", "long_text", "number", "date", "single_choice", "multi_choice", "yes_no"] as const;
export type IntakeType = (typeof INTAKE_TYPES)[number];

export const INTAKE_TYPE_LABELS: Record<IntakeType, string> = {
  short_text: "Kısa metin",
  long_text: "Uzun metin",
  number: "Sayı",
  date: "Tarih",
  single_choice: "Tek seçim",
  multi_choice: "Çoklu seçim",
  yes_no: "Evet / Hayır",
};

export type IntakeFieldDef = {
  label: string;
  type: IntakeType;
  helpText: string | null;
  unit: string | null;
  min: number | null;
  max: number | null;
  options: string[];
  required: boolean;
  isHealth: boolean;
};

/** Starting form for a new trainer; they can edit or delete any of it. */
export const DEFAULT_INTAKE_FIELDS: IntakeFieldDef[] = [
  { label: "Doğum tarihi", type: "date", helpText: null, unit: null, min: null, max: null, options: [], required: false, isHealth: false },
  { label: "Boy", type: "number", helpText: null, unit: "cm", min: 100, max: 230, options: [], required: false, isHealth: true },
  { label: "Kilo", type: "number", helpText: null, unit: "kg", min: 30, max: 250, options: [], required: false, isHealth: true },
  {
    label: "Hedefin",
    type: "single_choice",
    helpText: null,
    unit: null,
    min: null,
    max: null,
    options: ["Postür ve duruş", "Kilo vermek", "Güçlenmek", "Esneklik", "Ağrı / rehabilitasyon", "Hamilelik / doğum sonrası", "Diğer"],
    required: false,
    isHealth: false,
  },
  {
    label: "Sağlık durumu",
    type: "long_text",
    helpText: "Sakatlık, ameliyat, kronik rahatsızlık, hamilelik gibi bilmem gerekenler",
    unit: null,
    min: null,
    max: null,
    options: [],
    required: false,
    isHealth: true,
  },
  {
    label: "Uygun olduğun zamanlar",
    type: "multi_choice",
    helpText: null,
    unit: null,
    min: null,
    max: null,
    options: ["Hafta içi sabah", "Hafta içi öğle", "Hafta içi akşam", "Hafta sonu"],
    required: false,
    isHealth: false,
  },
];

export type IntakeValue =
  | { kind: "text"; text: string }
  | { kind: "number"; number: number }
  | { kind: "date"; date: string }
  | { kind: "options"; options: string[] }
  | { kind: "bool"; bool: boolean };

/** Form input name for a field's answer. */
export const answerName = (fieldId: string) => `q_${fieldId}`;

/**
 * Parses one answer from raw form values (all values submitted under the
 * field's name). Returns null for "no answer", or an error message.
 */
export function parseAnswer(
  field: Pick<IntakeFieldDef, "type" | "min" | "max" | "options" | "unit">,
  raw: string[],
): { value: IntakeValue | null } | { error: string } {
  const first = (raw[0] ?? "").trim();
  switch (field.type) {
    case "short_text":
    case "long_text": {
      if (!first) return { value: null };
      const max = field.type === "short_text" ? 200 : 2000;
      if (first.length > max) return { error: `En fazla ${max} karakter.` };
      return { value: { kind: "text", text: first } };
    }
    case "number": {
      if (!first) return { value: null };
      const n = parseTRY(first);
      if (n === null || !Number.isFinite(n)) return { error: "Bir sayı gir." };
      const unit = field.unit ? ` ${field.unit}` : "";
      if (field.min !== null && n < field.min) return { error: `En az ${field.min}${unit} olmalı.` };
      if (field.max !== null && n > field.max) return { error: `En fazla ${field.max}${unit} olmalı.` };
      return { value: { kind: "number", number: n } };
    }
    case "date": {
      if (!first) return { value: null };
      if (!/^\d{4}-\d{2}-\d{2}$/.test(first) || isNaN(Date.parse(first))) return { error: "Geçerli bir tarih seç." };
      return { value: { kind: "date", date: first } };
    }
    case "single_choice": {
      if (!first) return { value: null };
      if (!field.options.includes(first)) return { error: "Listeden bir seçenek seç." };
      return { value: { kind: "options", options: [first] } };
    }
    case "multi_choice": {
      const picked = [...new Set(raw.map((r) => r.trim()).filter(Boolean))];
      if (picked.length === 0) return { value: null };
      if (!picked.every((p) => field.options.includes(p))) return { error: "Listeden seçim yap." };
      return { value: { kind: "options", options: field.options.filter((o) => picked.includes(o)) } };
    }
    case "yes_no": {
      if (first === "yes") return { value: { kind: "bool", bool: true } };
      if (first === "no") return { value: { kind: "bool", bool: false } };
      return { value: null };
    }
  }
}

/** Human-readable answer, e.g. "172 cm", "Evet", "Sabah, Akşam". */
export function formatAnswer(a: {
  type: IntakeType;
  unit: string | null;
  valueText: string | null;
  valueNumber: string | number | null;
  valueDate: string | null;
  valueOptions: string[] | null;
  valueBool: boolean | null;
}) {
  switch (a.type) {
    case "number":
      return a.valueNumber === null
        ? ""
        : `${new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 2 }).format(Number(a.valueNumber))}${a.unit ? ` ${a.unit}` : ""}`;
    case "date":
      return a.valueDate
        ? new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(
            new Date(`${a.valueDate}T00:00:00Z`),
          )
        : "";
    case "single_choice":
    case "multi_choice":
      return (a.valueOptions ?? []).join(", ");
    case "yes_no":
      return a.valueBool === null ? "" : a.valueBool ? "Evet" : "Hayır";
    default:
      return a.valueText ?? "";
  }
}
