// Reads an uploaded .xlsx or .csv into a header row and data rows of plain
// strings. Server-side (exceljs); the rows then go through ./clients.ts.

import ExcelJS from "exceljs";

/** `lines[i]` is the line number of `rows[i]` in the file, for messages like "satır 7". */
export type Sheet = { headers: string[]; rows: string[][]; lines: number[] };

export class SpreadsheetError extends Error {}

const MAX_COLUMNS = 40;
const MAX_CELL = 2000;

/** Decodes CSV bytes: UTF-8 (BOM or not), falling back to Windows-1254, which Turkish Excel uses for "CSV". */
export function decodeCsv(bytes: Uint8Array) {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes).replace(/^﻿/, "");
  } catch {
    return new TextDecoder("windows-1254").decode(bytes);
  }
}

/** The separator used in the first line: ";" (Turkish Excel), "," or tab. */
function detectDelimiter(text: string) {
  const firstLine = text.split(/\r?\n/, 1)[0] ?? "";
  const counts = [";", ",", "\t"].map((d) => ({ d, n: countOutsideQuotes(firstLine, d) }));
  counts.sort((a, b) => b.n - a.n);
  return counts[0].n > 0 ? counts[0].d : ",";
}

function countOutsideQuotes(line: string, d: string) {
  let n = 0;
  let quoted = false;
  for (const ch of line) {
    if (ch === '"') quoted = !quoted;
    else if (ch === d && !quoted) n++;
  }
  return n;
}

/** RFC 4180 CSV: quoted fields, doubled quotes, newlines inside quotes. */
export function parseCsv(text: string, delimiter = detectDelimiter(text)): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else quoted = false;
      } else field += ch;
    } else if (ch === '"' && field === "") quoted = true;
    else if (ch === delimiter) {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else field += ch;
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

const pad = (n: number) => String(n).padStart(2, "0");

/** exceljs cell value → text. Dates become ISO dates, formulas their result. */
export function cellText(value: ExcelJS.CellValue): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) {
    // exceljs reads dates as UTC midnight.
    return isNaN(value.getTime()) ? "" : `${value.getUTCFullYear()}-${pad(value.getUTCMonth() + 1)}-${pad(value.getUTCDate())}`;
  }
  if (typeof value === "number") return Number.isInteger(value) ? String(value) : String(Math.round(value * 100) / 100);
  if (typeof value === "string") return value;
  if (typeof value === "boolean") return value ? "Evet" : "Hayır";
  if ("richText" in value) return value.richText.map((r) => r.text).join("");
  if ("formula" in value || "sharedFormula" in value) return cellText((value as { result?: ExcelJS.CellValue }).result ?? null);
  if ("hyperlink" in value) return String((value as { text?: unknown }).text ?? value.hyperlink);
  if ("error" in value) return "";
  return "";
}

type RawRow = { line: number; cells: string[] };

function toSheet(raw: RawRow[]): Sheet {
  const cleaned = raw
    .map((r) => ({ line: r.line, cells: r.cells.slice(0, MAX_COLUMNS).map((c) => c.trim().slice(0, MAX_CELL)) }))
    // Excel often keeps formatted blank rows.
    .filter((r) => r.cells.some((c) => c !== ""));
  const [headerRow, ...rows] = cleaned;
  if (!headerRow) throw new SpreadsheetError("Dosya boş görünüyor.");
  const width = rows.reduce((w, r) => Math.max(w, r.cells.length), headerRow.cells.length);
  const headers = Array.from({ length: width }, (_, i) => headerRow.cells[i] || `Sütun ${i + 1}`);
  return {
    headers,
    rows: rows.map((r) => Array.from({ length: width }, (_, i) => r.cells[i] ?? "")),
    lines: rows.map((r) => r.line),
  };
}

async function readXlsx(data: ArrayBuffer): Promise<Sheet> {
  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.load(data);
  } catch {
    throw new SpreadsheetError("Excel dosyası okunamadı. Dosyayı Excel'de açıp .xlsx olarak yeniden kaydetmeyi dene.");
  }
  // The first sheet with any content.
  const sheet = workbook.worksheets.find((ws) => ws.actualRowCount > 0);
  if (!sheet) throw new SpreadsheetError("Dosya boş görünüyor.");
  const raw: RawRow[] = [];
  sheet.eachRow({ includeEmpty: false }, (row, line) => {
    const cells: string[] = [];
    // row.values is 1-based.
    const values = row.values as ExcelJS.CellValue[];
    for (let i = 1; i < Math.min(values.length, MAX_COLUMNS + 1); i++) cells.push(cellText(values[i]));
    raw.push({ line, cells });
  });
  return toSheet(raw);
}

export type UploadKind = "xlsx" | "csv";

export function uploadKind(name: string, type: string): UploadKind | null {
  const lower = name.toLowerCase();
  if (lower.endsWith(".xlsx") || type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") return "xlsx";
  if (lower.endsWith(".csv") || type === "text/csv") return "csv";
  return null;
}

export async function readSpreadsheet(data: ArrayBuffer, kind: UploadKind): Promise<Sheet> {
  if (kind === "xlsx") return readXlsx(data);
  return toSheet(parseCsv(decodeCsv(new Uint8Array(data))).map((cells, i) => ({ line: i + 1, cells })));
}
