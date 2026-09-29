// Client import from a spreadsheet: column detection, value parsing and
// per-row validation. Pure, so the preview (browser) and the import (server)
// run exactly the same checks.

import { isISODate } from "../dates";
import { parseTRY } from "../forms";
import { normalizePhone } from "../whatsapp";

export const MAX_IMPORT_ROWS = 500;
/** Server actions accept 2 MB bodies (next.config.ts); leave room for the form encoding. */
export const MAX_IMPORT_BYTES = 1_900_000;
export const DEFAULT_PACKAGE_NAME = "Aktarılan paket";
export const DEBT_PACKAGE_NAME = "Aktarılan borç";

export const IMPORT_FIELDS = [
  "fullName",
  "firstName",
  "lastName",
  "phone",
  "email",
  "goals",
  "notes",
  "remaining",
  "packageName",
  "expiresOn",
  "debt",
] as const;
export type ImportField = (typeof IMPORT_FIELDS)[number];

export const IMPORT_FIELD_LABELS: Record<ImportField, string> = {
  fullName: "Ad soyad",
  firstName: "Ad",
  lastName: "Soyad",
  phone: "Telefon",
  email: "E-posta",
  goals: "Hedef",
  notes: "Notlar",
  remaining: "Kalan ders",
  packageName: "Paket adı",
  expiresOn: "Paket bitiş",
  debt: "Borç",
};

/** Health notes (`clients.health_notes`) can come from several columns, joined into one note. */
export const HEALTH_FIELD_LABEL = "Sağlık notu";
/** Same limit as the other free-text fields, with room for several joined columns. */
export const MAX_HEALTH_NOTES = 4000;

/**
 * Column index per field, or null when the file has no such column.
 * `healthNotes` lists every column that goes into the health note, in file order.
 */
export type ColumnMapping = Record<ImportField, number | null> & { healthNotes: number[] };

export const emptyMapping = (): ColumnMapping => ({
  ...(Object.fromEntries(IMPORT_FIELDS.map((f) => [f, null])) as Record<ImportField, null>),
  healthNotes: [],
});

/** "Kalan Seans (adet)" → "kalanseansadet": lower case, Turkish letters folded, only a–z and digits. */
export function normalizeHeader(raw: string) {
  return raw
    .toLocaleLowerCase("tr")
    .replace(/ı/g, "i")
    .replace(/ş/g, "s")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

// Normalized header names per field. A header matches a synonym exactly, or
// (second pass) starts with it, or contains it when the synonym is long
// enough to be unambiguous ("danisantelefonu" → phone).
const SYNONYMS: Record<ImportField, string[]> = {
  fullName: ["adsoyad", "adisoyadi", "adsoyadi", "isimsoyisim", "isimsoyad", "danisan", "danisanadi", "musteri", "musteriadi", "uye", "uyeadi", "fullname", "name", "isim"],
  firstName: ["ad", "adi", "firstname", "givenname"],
  lastName: ["soyad", "soyadi", "soyisim", "lastname", "surname", "familyname"],
  phone: ["telefon", "tel", "gsm", "cep", "ceptelefonu", "ceptel", "mobil", "phone", "mobile", "whatsapp", "telno"],
  email: ["eposta", "email", "mail", "emailadresi", "epostaadresi"],
  goals: ["hedef", "hedefi", "hedefler", "amac", "goal", "goals"],
  notes: ["not", "notlar", "aciklama", "note", "notes", "comment"],
  remaining: ["kalanders", "kalanseans", "kalan", "kalandersler", "kalanseanslar", "kalanhak", "remaining", "remainingsessions", "sessionsleft"],
  packageName: ["paketadi", "paket", "paketismi", "package", "packagename", "uyelik", "uyeliktipi"],
  expiresOn: ["paketbitis", "paketbitistarihi", "bitis", "bitistarihi", "sontarih", "sonkullanma", "sonkullanmatarihi", "gecerlilik", "expires", "expireson", "expiry", "enddate"],
  debt: ["borc", "kalanodeme", "kalanborc", "borcu", "odenecek", "alacak", "debt", "amountdue"],
};

// Loose matches are tried in this order: phone and e-mail words are the
// strongest signals, "Kalan ödeme" must become debt before "kalan" is taken
// as sessions, and "Paket bitiş" the expiry before "paket" is taken as the name.
const DETECT_ORDER: ImportField[] = ["phone", "email", "debt", "expiresOn", "remaining", "packageName", "fullName", "lastName", "firstName", "goals", "notes"];

/** Headers that hold health information ("Sağlık notu", "Sakatlık", "İlaç", "Injuries", "Medical"…). */
const HEALTH_HEADER = /saglik|health|hastalik|sakatlik|rahatsizlik|ilac|ameliyat|teshis|tibbi|kronik|alerji|medical|medication|injur|allerg/;
export const isHealthHeader = (raw: string) => HEALTH_HEADER.test(normalizeHeader(raw));

const loose = (h: string, s: string) => (s.length >= 3 && h.startsWith(s)) || (s.length >= 5 && h.includes(s));

/** Guesses which column holds which field from the header row. */
export function detectMapping(headers: string[]): ColumnMapping {
  const mapping = emptyMapping();
  // Health columns first, so "Sağlık notları" never ends up as a plain note.
  mapping.healthNotes = headers.flatMap((h, i) => (isHealthHeader(h) ? [i] : []));
  const normalized = headers.map((h) => (isHealthHeader(h) ? "" : normalizeHeader(h)));
  const taken = new Set<number>(mapping.healthNotes);

  // Exact matches first, so "Ad" never swallows "Ad Soyad" through a prefix.
  for (const exact of [true, false]) {
    for (const field of DETECT_ORDER) {
      if (mapping[field] !== null) continue;
      const i = normalized.findIndex(
        (h, i) => h !== "" && !taken.has(i) && SYNONYMS[field].some((s) => (exact ? h === s : loose(h, s))),
      );
      if (i >= 0) {
        mapping[field] = i;
        taken.add(i);
      }
    }
  }
  // A full-name column makes separate first/last columns redundant.
  if (mapping.fullName !== null) {
    mapping.firstName = null;
    mapping.lastName = null;
  }
  return mapping;
}

const pad = (n: number) => String(n).padStart(2, "0");

/** Excel's day 0 is 1899-12-30 (its 1900 leap-year bug included). */
function fromExcelSerial(serial: number) {
  const d = new Date(Date.UTC(1899, 11, 30) + Math.round(serial) * 86_400_000);
  return d.toISOString().slice(0, 10);
}

/**
 * Reads a date the way people type them in Turkey, plus ISO and Excel serial
 * numbers: "31.12.2026", "31/12/26", "2026-12-31", "46387" → "2026-12-31".
 * Returns null for anything else.
 */
export function parseImportDate(raw: string): string | null {
  const s = raw.trim();
  if (!s) return null;

  let iso: string | null = null;
  let m: RegExpMatchArray | null;
  if ((m = s.match(/^(\d{4})[-./](\d{1,2})[-./](\d{1,2})(?:[T\s].*)?$/))) {
    iso = `${m[1]}-${pad(+m[2])}-${pad(+m[3])}`;
  } else if ((m = s.match(/^(\d{1,2})[-./](\d{1,2})[-./](\d{2}|\d{4})$/))) {
    const year = m[3].length === 2 ? 2000 + Number(m[3]) : Number(m[3]);
    iso = `${year}-${pad(+m[2])}-${pad(+m[1])}`;
  } else if (/^\d{5}(\.\d+)?$/.test(s)) {
    const serial = Number(s);
    // 1954…2119: anything outside is not a package expiry.
    if (serial >= 20_000 && serial <= 80_000) iso = fromExcelSerial(serial);
  }
  if (!iso || !isISODate(iso)) return null;
  // Rejects rollovers like 31.02.2026 (Date would turn it into 3 March).
  return new Date(`${iso}T00:00:00Z`).toISOString().slice(0, 10) === iso ? iso : null;
}

/** "8", "8 ders", "8,0" → 8; empty → 0; anything else (or a fraction) → null. */
export function parseSessionCount(raw: string): number | null {
  const s = raw.trim().toLocaleLowerCase("tr").replace(/\s*(ders|seans|adet|hak)\w*$/, "");
  if (!s || s === "-") return 0;
  const n = Number(s.replace(",", "."));
  if (!Number.isFinite(n) || n < 0 || !Number.isInteger(n) || n > 999) return null;
  return n;
}

/** "1.250", "1250,50 TL", "₺ 800" → 1250, 1250.5, 800; empty → 0; invalid or negative → null. */
export function parseDebt(raw: string): number | null {
  const s = raw.trim().replace(/\s*(tl|try)$/i, "");
  if (!s || s === "-") return 0;
  const n = parseTRY(s);
  if (n === null) return 0;
  if (!Number.isFinite(n) || n < 0 || n > 10_000_000) return null;
  return n;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const clip = (s: string, max: number) => (s.length > max ? s.slice(0, max) : s);

export type ImportClient = {
  fullName: string;
  phone: string | null;
  email: string | null;
  goals: string | null;
  notes: string | null;
  healthNotes: string | null;
  /** A package is created when sessions are left or money is owed. */
  package: { name: string; totalSessions: number; expiresOn: string | null; price: number } | null;
};

export type RowResult = {
  /** Line number in the file (the header is line 1). */
  line: number;
  /** "skip": already a client, left alone. "error": not imported until fixed. */
  status: "ok" | "skip" | "error";
  /** Why the row is skipped or rejected. */
  reasons: string[];
  /** Imported, but worth knowing. */
  warnings: string[];
  /** What would be saved; also filled for skipped/error rows so the preview can show them. */
  client: ImportClient;
};

export type ValidateOptions = {
  /** Normalized phones of existing clients. */
  existingPhones: ReadonlySet<string>;
  /** Today in the trainer's timezone, to flag packages that already expired. */
  today: string;
  /** File line number of each row (defaults to 2, 3, … after a header on line 1). */
  lines?: number[];
  /** Header row, to label each part when several columns go into the health note. */
  headers?: string[];
};

/**
 * One column: its text as is. Several: one line per non-empty cell, labelled
 * with its header ("Sakatlık: Sol diz\nİlaç: Yok").
 */
function joinHealth(row: string[], columns: number[], headers: string[] | undefined) {
  const parts = columns.flatMap((i) => {
    const value = (row[i] ?? "").trim();
    if (!value) return [];
    const label = clip((headers?.[i] ?? "").trim().replace(/\s+/g, " "), 60);
    return [columns.length > 1 && label ? `${label}: ${value}` : value];
  });
  return clip(parts.join("\n"), MAX_HEALTH_NOTES) || null;
}

/** Checks every data row against the mapping. Order matters: the first row with a phone wins, later duplicates are errors. */
export function validateRows(rows: string[][], mapping: ColumnMapping, { existingPhones, today, lines, headers }: ValidateOptions): RowResult[] {
  const seen = new Map<string, number>();
  const cell = (row: string[], field: ImportField) => {
    const i = mapping[field];
    return i === null ? "" : (row[i] ?? "").trim();
  };
  const text = (row: string[], field: ImportField, max: number) => clip(cell(row, field), max) || null;

  return rows.map((row, idx) => {
    const line = lines?.[idx] ?? idx + 2;
    const reasons: string[] = [];
    const warnings: string[] = [];

    const fullName = clip(
      (cell(row, "fullName") || [cell(row, "firstName"), cell(row, "lastName")].filter(Boolean).join(" ")).replace(/\s+/g, " "),
      120,
    );
    if (fullName.length < 2) reasons.push("Ad soyad eksik");

    const rawPhone = cell(row, "phone");
    const phone = rawPhone ? normalizePhone(rawPhone) : null;
    let status: RowResult["status"] = "ok";
    if (rawPhone && !phone) reasons.push("Telefon geçersiz");
    if (phone) {
      const first = seen.get(phone);
      if (first !== undefined) reasons.push(`Telefon dosyada tekrar ediyor (satır ${first})`);
      else seen.set(phone, line);
    }

    const rawEmail = cell(row, "email");
    const email = rawEmail ? clip(rawEmail.toLowerCase(), 200) : null;
    if (email && !EMAIL.test(email)) reasons.push("E-posta geçersiz");

    const remainingRaw = cell(row, "remaining");
    const remaining = parseSessionCount(remainingRaw);
    if (remaining === null) reasons.push(`Kalan ders okunamadı (“${clip(remainingRaw, 20)}”)`);

    const expiresRaw = cell(row, "expiresOn");
    const expiresOn = expiresRaw ? parseImportDate(expiresRaw) : null;
    if (expiresRaw && !expiresOn) reasons.push(`Bitiş tarihi okunamadı (“${clip(expiresRaw, 20)}”)`);

    const debtRaw = cell(row, "debt");
    const debt = parseDebt(debtRaw);
    if (debt === null) reasons.push(`Borç okunamadı (“${clip(debtRaw, 20)}”)`);

    const sessions = remaining ?? 0;
    const owed = debt ?? 0;
    const pkgName = text(row, "packageName", 120);
    let pkg: ImportClient["package"] = null;
    if (sessions > 0 || owed > 0) {
      pkg = {
        name: pkgName ?? (sessions > 0 ? DEFAULT_PACKAGE_NAME : DEBT_PACKAGE_NAME),
        totalSessions: sessions,
        expiresOn: sessions > 0 ? expiresOn : null,
        price: owed,
      };
      if (sessions > 0 && expiresOn && expiresOn < today) warnings.push("Paketin bitiş tarihi geçmiş");
      if (sessions === 0) warnings.push("Kalan ders yok; borç için dersi olmayan bir paket açılır");
    } else if (pkgName || expiresOn) {
      warnings.push("Kalan ders yok, paket açılmaz");
    }

    if (reasons.length > 0) status = "error";
    else if (phone && existingPhones.has(phone)) {
      status = "skip";
      reasons.push("Zaten var, atlanacak");
    }

    return {
      line,
      status,
      reasons,
      warnings,
      client: {
        fullName,
        phone,
        email,
        goals: text(row, "goals", 500),
        notes: text(row, "notes", 2000),
        healthNotes: joinHealth(row, mapping.healthNotes, headers),
        package: pkg,
      },
    };
  });
}

/** Normalized phones found anywhere in the file, so the server can say which already exist without knowing the mapping. */
export function phonesInFile(rows: string[][]) {
  const out = new Set<string>();
  for (const row of rows) {
    for (const c of row) {
      if (/\d{7}/.test(c.replace(/\D/g, ""))) {
        const n = normalizePhone(c);
        if (n) out.add(n);
      }
    }
  }
  return out;
}

export type ImportSummary = { total: number; ok: number; skip: number; error: number; packages: number };

export function summarize(results: RowResult[]): ImportSummary {
  const s: ImportSummary = { total: results.length, ok: 0, skip: 0, error: 0, packages: 0 };
  for (const r of results) {
    s[r.status] += 1;
    if (r.status === "ok" && r.client.package) s.packages += 1;
  }
  return s;
}
