// Client import (spreadsheet parsing, column mapping, validation) and the
// data export. The pure parts run first; then the real import and export
// run against PGlite as a signed-in trainer with RLS on.
// Run with: npx tsx --conditions=react-server scripts/test-import.ts
import assert from "node:assert/strict";
import ExcelJS from "exceljs";
import { eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/pglite";
import type { Tx } from "../src/db";
import { loadExportData } from "../src/db/export";
import { existingPhones, importClients } from "../src/db/import";
import { createLessons, setAttendance } from "../src/db/lessons";
import { recordPayment } from "../src/db/payments";
import * as schema from "../src/db/schema";
import { SHEET_NAMES, buildExportWorkbook, exportFileName } from "../src/lib/export";
import { addNote, grantHealthConsent, saveMeasurements } from "../src/db/progress";
import { createProgram } from "../src/db/programs";
import {
  DEBT_PACKAGE_NAME,
  DEFAULT_PACKAGE_NAME,
  IMPORT_FIELDS,
  MAX_HEALTH_NOTES,
  detectMapping,
  emptyMapping,
  isHealthHeader,
  normalizeHeader,
  parseDebt,
  parseImportDate,
  parseSessionCount,
  phonesInFile,
  summarize,
  validateRows,
  type ColumnMapping,
} from "../src/lib/import/clients";
import { cellText, decodeCsv, parseCsv, readSpreadsheet, uploadKind } from "../src/lib/import/spreadsheet";
import { TEMPLATE_HEADERS, buildTemplateWorkbook } from "../src/lib/import/template";
import { addUsers, createTestDb } from "./pglite";

const T = "00000000-0000-0000-0000-0000000000b1";
const OTHER = "00000000-0000-0000-0000-0000000000b2";
const TODAY = "2026-09-30";

const mapOf = (partial: Partial<ColumnMapping>): ColumnMapping => ({ ...emptyMapping(), ...partial });
const toArrayBuffer = (b: Uint8Array) => b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) as ArrayBuffer;

function pureChecks() {
  // Header normalization and detection.
  assert.equal(normalizeHeader("  Kalan Seans (adet) "), "kalanseansadet");
  assert.equal(normalizeHeader("İSİM"), "isim");
  assert.equal(normalizeHeader("E-posta"), "eposta");

  const m1 = detectMapping(["Ad Soyad", "Telefon", "E-posta", "Notlar", "Hedef", "Kalan ders", "Paket adı", "Paket bitiş", "Kalan ödeme"]);
  assert.deepEqual(m1, {
    fullName: 0,
    firstName: null,
    lastName: null,
    phone: 1,
    email: 2,
    notes: 3,
    goals: 4,
    remaining: 5,
    packageName: 6,
    expiresOn: 7,
    debt: 8,
    healthNotes: [],
  });
  const m2 = detectMapping(["Ad", "Soyad", "GSM", "Email", "Kalan Seans", "Son tarih", "Borç"]);
  assert.equal(m2.fullName, null);
  assert.equal(m2.firstName, 0);
  assert.equal(m2.lastName, 1);
  assert.equal(m2.phone, 2);
  assert.equal(m2.email, 3);
  assert.equal(m2.remaining, 4);
  assert.equal(m2.expiresOn, 5);
  assert.equal(m2.debt, 6);
  const m3 = detectMapping(["İsim", "Tel", "Paket", "Açıklama", "Sağlık notları"]);
  assert.equal(m3.fullName, 0);
  assert.equal(m3.phone, 1);
  assert.equal(m3.packageName, 2);
  assert.equal(m3.notes, 3, "Açıklama → notes");
  assert.deepEqual(m3.healthNotes, [4], "Sağlık notları → health notes, not notes");
  assert.ok(isHealthHeader("Sağlık durumu") && !isHealthHeader("Notlar"));
  for (const h of ["Sağlık", "Sağlık notu", "Sakatlık", "Rahatsızlık", "İlaç", "Kullandığı ilaçlar", "Health", "Injuries", "Medical", "Alerji"]) {
    assert.ok(isHealthHeader(h), `${h} is a health header`);
  }
  const m5 = detectMapping(["Ad Soyad", "Sakatlık", "Notlar", "İlaç", "Health notes", "Telefon"]);
  assert.deepEqual(m5.healthNotes, [1, 3, 4], "every health column is mapped, in file order");
  assert.equal(m5.notes, 2);
  assert.equal(m5.phone, 5);
  const m4 = detectMapping(["Full name", "Phone", "Email", "Remaining sessions", "Package", "Expires"]);
  assert.deepEqual([m4.fullName, m4.phone, m4.email, m4.remaining, m4.packageName, m4.expiresOn], [0, 1, 2, 3, 4, 5]);
  assert.equal(detectMapping(["Danışan telefonu", "Danışan adı"]).phone, 0, "phone word wins over the client prefix");
  assert.equal(detectMapping(["Danışan telefonu", "Danışan adı"]).fullName, 1);
  assert.deepEqual(detectMapping(["x", "y"]), emptyMapping());
  console.log("import: header detection (TR/EN synonyms, first/last name, health columns)");

  // Dates.
  assert.equal(parseImportDate("31.12.2026"), "2026-12-31");
  assert.equal(parseImportDate("1.2.2027"), "2027-02-01");
  assert.equal(parseImportDate("31/12/26"), "2026-12-31");
  assert.equal(parseImportDate("2026-12-31"), "2026-12-31");
  assert.equal(parseImportDate("2026-12-31T00:00:00.000Z"), "2026-12-31");
  assert.equal(parseImportDate("46387"), "2026-12-31", "Excel serial");
  assert.equal(parseImportDate("45658"), "2025-01-01");
  assert.equal(parseImportDate("31.02.2026"), null, "no rollover");
  assert.equal(parseImportDate("13.13.2026"), null);
  assert.equal(parseImportDate("yarın"), null);
  assert.equal(parseImportDate("123"), null);
  assert.equal(parseImportDate(""), null);
  console.log("import: dates (31.12.2026, 2026-12-31, Excel serials, invalid ones rejected)");

  // Counts and money.
  assert.equal(parseSessionCount("8"), 8);
  assert.equal(parseSessionCount(" 8 ders "), 8);
  assert.equal(parseSessionCount("10 seans"), 10);
  assert.equal(parseSessionCount("8,0"), 8);
  assert.equal(parseSessionCount(""), 0);
  assert.equal(parseSessionCount("-"), 0);
  assert.equal(parseSessionCount("2,5"), null);
  assert.equal(parseSessionCount("-3"), null);
  assert.equal(parseSessionCount("çok"), null);
  assert.equal(parseDebt("1.250"), 1250);
  assert.equal(parseDebt("1250,50 TL"), 1250.5);
  assert.equal(parseDebt("₺ 800"), 800);
  assert.equal(parseDebt("1500.5"), 1500.5);
  assert.equal(parseDebt(""), 0);
  assert.equal(parseDebt("borç yok"), null);
  console.log("import: kalan ders and borç parsing");

  // Row validation.
  const mapping = mapOf({ fullName: 0, phone: 1, email: 2, remaining: 3, packageName: 4, expiresOn: 5, debt: 6 });
  const rows = [
    ["Ayşe Yılmaz", "0532 123 45 67", "AYSE@ornek.com", "8", "Reformer 10", "31.12.2026", "1.500"],
    ["", "0532 000 00 01", "", "", "", "", ""],
    ["Kötü Telefon", "12345", "", "", "", "", ""],
    ["Tekrar Ayşe", "+90 532 123 45 67", "", "", "", "", ""],
    ["Eski Danışan", "05441112233", "", "", "", "", ""],
    ["Borçlu", "", "", "0", "", "", "600"],
    ["Paketsiz", "", "yanlis-eposta", "", "", "", ""],
    ["Tarihsiz", "", "", "5", "", "ertesi ay", ""],
    ["Süresi geçmiş", "", "", "3", "", "01.01.2026", ""],
    ["Varsayılan paket", "5559998877", "", "4 ders", "", "", ""],
  ];
  const results = validateRows(rows, mapping, { existingPhones: new Set(["905441112233"]), today: TODAY });
  const at = (line: number) => results.find((r) => r.line === line)!;
  assert.equal(at(2).status, "ok");
  assert.deepEqual(at(2).client, {
    fullName: "Ayşe Yılmaz",
    phone: "905321234567",
    email: "ayse@ornek.com",
    goals: null,
    notes: null,
    healthNotes: null,
    package: { name: "Reformer 10", totalSessions: 8, expiresOn: "2026-12-31", price: 1500 },
  });
  assert.equal(at(3).status, "error");
  assert.deepEqual(at(3).reasons, ["Ad soyad eksik"]);
  assert.deepEqual(at(4).reasons, ["Telefon geçersiz"]);
  assert.equal(at(5).status, "error");
  assert.match(at(5).reasons[0], /tekrar ediyor \(satır 2\)/);
  assert.equal(at(6).status, "skip");
  assert.deepEqual(at(6).reasons, ["Zaten var, atlanacak"]);
  assert.equal(at(7).status, "ok");
  assert.deepEqual(at(7).client.package, { name: DEBT_PACKAGE_NAME, totalSessions: 0, expiresOn: null, price: 600 });
  assert.deepEqual(at(8).reasons, ["E-posta geçersiz"]);
  assert.match(at(9).reasons[0], /Bitiş tarihi okunamadı/);
  assert.equal(at(10).status, "ok");
  assert.deepEqual(at(10).warnings, ["Paketin bitiş tarihi geçmiş"]);
  assert.equal(at(11).status, "ok");
  assert.equal(at(11).client.package?.name, DEFAULT_PACKAGE_NAME);
  assert.equal(at(11).client.package?.totalSessions, 4);
  assert.deepEqual(summarize(results), { total: 10, ok: 4, skip: 1, error: 5, packages: 4 });

  // First + last name columns, and custom line numbers.
  const split = validateRows([["Ali", "Veli"], ["", "Tek"]], mapOf({ firstName: 0, lastName: 1 }), {
    existingPhones: new Set(),
    today: TODAY,
    lines: [4, 9],
  });
  assert.equal(split[0].client.fullName, "Ali Veli");
  assert.equal(split[0].line, 4);
  assert.equal(split[1].client.fullName, "Tek");
  assert.equal(split[1].status, "ok", "a last name alone is still a name");

  // Health notes: one column as is, several joined with their headers.
  const hHeaders = ["Ad Soyad", "Sakatlık", "İlaç"];
  const hRows = [
    ["Can Ak", " Sol diz menisküs ", "Yok"],
    ["Ece Su", "", "Tansiyon ilacı"],
    ["Ali Veli", "", ""],
  ];
  const both = validateRows(hRows, mapOf({ fullName: 0, healthNotes: [1, 2] }), { existingPhones: new Set(), today: TODAY, headers: hHeaders });
  assert.equal(both[0].client.healthNotes, "Sakatlık: Sol diz menisküs\nİlaç: Yok");
  assert.equal(both[1].client.healthNotes, "İlaç: Tansiyon ilacı", "empty cells are left out");
  assert.equal(both[2].client.healthNotes, null);
  const one = validateRows(hRows, mapOf({ fullName: 0, healthNotes: [1] }), { existingPhones: new Set(), today: TODAY, headers: hHeaders });
  assert.equal(one[0].client.healthNotes, "Sol diz menisküs", "a single column needs no label");
  const long = validateRows([["Uzun Not", "x".repeat(3000), "y".repeat(3000)]], mapOf({ fullName: 0, healthNotes: [1, 2] }), {
    existingPhones: new Set(),
    today: TODAY,
    headers: hHeaders,
  });
  assert.equal(long[0].client.healthNotes!.length, MAX_HEALTH_NOTES);
  console.log("import: row validation (missing name, bad phone, duplicates, existing, dates, debt-only, health notes)");
}

async function spreadsheetChecks() {
  assert.equal(uploadKind("Liste.XLSX", ""), "xlsx");
  assert.equal(uploadKind("liste.csv", ""), "csv");
  assert.equal(uploadKind("liste.xls", "application/vnd.ms-excel"), null);

  // CSV: semicolons, BOM, quotes with separators and newlines inside.
  const csv = '﻿Ad Soyad;Telefon;Notlar\r\n"Çağla Öztürk";0532 111 22 33;"Pzt; Çrş akşam"\r\n\r\nŞule İnce;;"iki\nsatır"\r\n';
  const utf8 = new TextEncoder().encode(csv);
  assert.equal(decodeCsv(utf8).startsWith("Ad Soyad"), true, "BOM stripped");
  const sheet = await readSpreadsheet(toArrayBuffer(utf8), "csv");
  assert.deepEqual(sheet.headers, ["Ad Soyad", "Telefon", "Notlar"]);
  assert.deepEqual(sheet.rows, [
    ["Çağla Öztürk", "0532 111 22 33", "Pzt; Çrş akşam"],
    ["Şule İnce", "", "iki\nsatır"],
  ]);
  assert.deepEqual(sheet.lines, [2, 4], "blank line skipped, line numbers kept");
  assert.deepEqual(parseCsv("a,b\n1,\"x,y\""), [
    ["a", "b"],
    ["1", "x,y"],
  ]);
  // Turkish Excel's "CSV" is Windows-1254: ş = 0xFE, ğ = 0xF0, İ = 0xDD.
  const cp1254 = new Uint8Array([0x41, 0x64, 0x3b, 0x54, 0x65, 0x6c, 0x0a, 0xdd, 0x6e, 0x63, 0x65, 0x20, 0xfe, 0xf0, 0x3b, 0x31]);
  assert.equal(decodeCsv(cp1254), "Ad;Tel\nİnce şğ;1");
  console.log("import: CSV (; and , separators, BOM, quotes, Windows-1254)");

  // cellText for exceljs values.
  assert.equal(cellText(new Date(Date.UTC(2026, 11, 31))), "2026-12-31");
  assert.equal(cellText(5321234567), "5321234567");
  assert.equal(cellText({ richText: [{ text: "Ay" }, { text: "şe" }] }), "Ayşe");
  assert.equal(cellText({ formula: "A1", result: 8 } as ExcelJS.CellFormulaValue), "8");
  assert.equal(cellText(null), "");

  // The template round-trips through the reader and is fully auto-mapped.
  const template = new Uint8Array(await buildTemplateWorkbook().xlsx.writeBuffer());
  const t = await readSpreadsheet(toArrayBuffer(template), "xlsx");
  assert.deepEqual(t.headers, TEMPLATE_HEADERS);
  assert.equal(t.rows.length, 2);
  const tm = detectMapping(t.headers);
  for (const f of IMPORT_FIELDS.filter((f) => f !== "firstName" && f !== "lastName")) assert.notEqual(tm[f], null, `template maps ${f}`);
  assert.deepEqual(tm.healthNotes, [TEMPLATE_HEADERS.indexOf("Sağlık notu")], "template maps the health column");
  const tr = validateRows(t.rows, tm, { existingPhones: new Set(), today: TODAY, headers: t.headers });
  assert.deepEqual(
    tr.map((r) => r.status),
    ["ok", "ok"],
  );
  assert.deepEqual(tr[0].client.package, { name: "10 derslik reformer", totalSessions: 8, expiresOn: "2026-12-31", price: 1500 });
  assert.equal(tr[0].client.healthNotes, "Bel fıtığı, doktor onaylı");
  assert.equal(tr[1].client.healthNotes, null);

  // An xlsx with real date cells and numeric phones, a blank row and a second (empty) sheet.
  const wb = new ExcelJS.Workbook();
  wb.addWorksheet("Boş");
  const ws = wb.addWorksheet("Liste");
  ws.addRow(["İsim", "GSM", "Kalan", "Bitiş"]);
  ws.addRow(["Deniz Kaya", 5051234567, 6, new Date(Date.UTC(2027, 0, 15))]);
  ws.addRow([]);
  ws.addRow(["Ece Su", "", { formula: "2+3", result: 5 }, ""]);
  const x = await readSpreadsheet(toArrayBuffer(new Uint8Array(await wb.xlsx.writeBuffer())), "xlsx");
  assert.deepEqual(x.rows, [
    ["Deniz Kaya", "5051234567", "6", "2027-01-15"],
    ["Ece Su", "", "5", ""],
  ]);
  assert.deepEqual(x.lines, [2, 4]);
  const xr = validateRows(x.rows, detectMapping(x.headers), { existingPhones: new Set(), today: TODAY });
  assert.equal(xr[0].client.phone, "905051234567");
  assert.equal(xr[0].client.package?.expiresOn, "2027-01-15");
  assert.equal(xr[1].client.package?.totalSessions, 5);
  assert.deepEqual([...phonesInFile(x.rows)], ["905051234567"]);

  await assert.rejects(readSpreadsheet(toArrayBuffer(new TextEncoder().encode("not a zip")), "xlsx"), /okunamadı/);
  console.log("import: xlsx reading (template round-trip, dates, numbers, formulas, blank rows)");
}

async function dbChecks() {
  const pg = await createTestDb();
  await addUsers(pg, [
    { id: T, name: "Aktarım Hoca" },
    { id: OTHER, name: "Diğer Hoca" },
  ]);
  const db = drizzle(pg, { schema });
  const as = <R>(id: string, fn: (tx: Tx) => Promise<R>) =>
    db.transaction(async (tx) => {
      await tx.execute(sql`select set_config('request.jwt.claim.sub', ${id}, true)`);
      await tx.execute(sql`set local role authenticated`);
      return fn(tx as unknown as Tx);
    });
  const trainer = { id: T, timezone: "Europe/Istanbul" };

  // An existing client, and another trainer's client with the same phone (must not count).
  await as(T, (tx) => tx.insert(schema.clients).values({ trainerId: T, fullName: "Mevcut", phone: "905441112233" }));
  await as(OTHER, (tx) => tx.insert(schema.clients).values({ trainerId: OTHER, fullName: "Başkası", phone: "905321234567" }));
  assert.deepEqual([...(await as(T, (tx) => existingPhones(tx, T)))], ["905441112233"], "RLS: only own phones");

  const rows = [
    ["Ayşe Yılmaz", "0532 123 45 67", "8", "Reformer 10", "31.12.2026", "1.500", "Duruş", "Sol diz", "Yok"],
    ["Mevcut Tekrar", "0544 111 22 33", "", "", "", "", "", "", ""],
    ["", "0555 000 00 00", "", "", "", "", "", "", ""],
    ["Borçlu Ben", "", "", "", "", "600", "", "", "Tansiyon ilacı"],
    ["Sadece İsim", "", "", "", "", "", "", "", ""],
  ];
  const headers = ["Ad Soyad", "Telefon", "Kalan", "Paket", "Bitiş", "Borç", "Hedef", "Sakatlık", "İlaç"];
  const mapping = mapOf({ fullName: 0, phone: 1, remaining: 2, packageName: 3, expiresOn: 4, debt: 5, goals: 6, healthNotes: [7, 8] });
  const result = await as(T, (tx) => importClients(tx, trainer, rows, mapping, { headers }));
  assert.equal(result.created, 3);
  assert.equal(result.packages, 2);
  assert.deepEqual(result.skipped, [
    { line: 3, status: "skip", reasons: ["Zaten var, atlanacak"] },
    { line: 4, status: "error", reasons: ["Ad soyad eksik"] },
  ]);

  const created = await as(T, (tx) => tx.select().from(schema.clients).where(eq(schema.clients.trainerId, T)));
  assert.equal(created.length, 4);
  const ayse = created.find((c) => c.fullName === "Ayşe Yılmaz")!;
  assert.equal(ayse.phone, "905321234567");
  assert.equal(ayse.goals, "Duruş");
  assert.equal(ayse.source, "manual");
  assert.equal(ayse.status, "active");
  assert.equal(ayse.healthNotes, "Sakatlık: Sol diz\nİlaç: Yok");

  const B = schema.clientPackageBalances;
  const balances = await as(T, (tx) =>
    tx
      .select({
        clientId: schema.clientPackages.clientId,
        name: schema.clientPackages.name,
        b: { clientPackageId: B.clientPackageId, remainingSessions: B.remainingSessions, effectiveExpiresOn: B.effectiveExpiresOn, dueAmount: B.dueAmount, state: B.state },
      })
      .from(schema.clientPackages)
      .innerJoin(B, eq(B.clientPackageId, schema.clientPackages.id)),
  );
  const ayseBal = balances.find((p) => p.clientId === ayse.id)!;
  assert.equal(ayseBal.name, "Reformer 10");
  assert.equal(ayseBal.b.remainingSessions, 8);
  assert.equal(String(ayseBal.b.effectiveExpiresOn), "2026-12-31");
  assert.equal(String(ayseBal.b.dueAmount), "1500.00");
  const borclu = created.find((c) => c.fullName === "Borçlu Ben")!;
  const borcluBal = balances.find((p) => p.clientId === borclu.id)!;
  assert.equal(borclu.healthNotes, "İlaç: Tansiyon ilacı");
  assert.equal(created.find((c) => c.fullName === "Sadece İsim")!.healthNotes, null);
  assert.equal(borcluBal.name, DEBT_PACKAGE_NAME);
  assert.equal(borcluBal.b.state, "finished");
  assert.equal(String(borcluBal.b.dueAmount), "600.00");
  assert.equal(balances.length, 2);
  console.log("import db: clients, health notes and packages created, existing phone skipped, invalid rows skipped");

  // Importing the same file again adds nobody with a phone twice.
  const again = await as(T, (tx) => importClients(tx, trainer, rows.slice(0, 1), mapping));
  assert.equal(again.created, 0);
  assert.deepEqual(again.skipped[0].reasons, ["Zaten var, atlanacak"]);

  // A failure inside the transaction rolls back every row (all or nothing).
  await assert.rejects(
    as(T, async (tx) => {
      await importClients(tx, trainer, [["Geri Alınacak", "", "", "", "", "", ""]], mapping);
      throw new Error("boom");
    }),
  );
  assert.equal((await as(T, (tx) => tx.select().from(schema.clients).where(eq(schema.clients.fullName, "Geri Alınacak")))).length, 0);
  await assert.rejects(as(T, (tx) => importClients(tx, trainer, Array.from({ length: 501 }, () => ["X Y"]), mapping)));
  console.log("import db: re-import skips duplicates, rollback on failure, 500-row cap");

  // Some activity for the export: a lesson with attendance, a payment and intake answers.
  const lessonId = await as(T, (tx) =>
    createLessons(tx, trainer, {
      repeat: null,
      date: "2026-10-05",
      time: "18:30",
      durationMinutes: 50,
      sessionType: "private",
      clientIds: [ayse.id],
      status: "scheduled",
      note: null,
    }),
  );
  const [att] = await as(T, (tx) => tx.select().from(schema.lessonAttendees).where(eq(schema.lessonAttendees.lessonId, lessonId)));
  await as(T, (tx) => setAttendance(tx, T, att.id, "attended"));
  const paid = await as(T, (tx) =>
    recordPayment(tx, T, { clientId: ayse.id, clientPackageId: ayseBal.b.clientPackageId, amount: 500, method: "bank_transfer", paidOn: "2026-10-01", note: "Ekim" }),
  );
  assert.deepEqual(paid, { ok: true });
  await as(T, (tx) =>
    tx.insert(schema.intakeAnswers).values([
      { trainerId: T, clientId: ayse.id, label: "Boy", type: "number", unit: "cm", isHealth: true, valueNumber: "168", sortOrder: 1 },
      { trainerId: T, clientId: ayse.id, label: "Uygun zaman", type: "multi_choice", isHealth: false, valueOptions: ["Sabah", "Akşam"], sortOrder: 2 },
    ]),
  );
  await as(OTHER, (tx) => tx.insert(schema.clients).values({ trainerId: OTHER, fullName: "Gizli Danışan" }));
  // Progress data: a measurement, a note and a program line.
  const aWho = { trainerId: T, clientId: ayse.id };
  await as(T, (tx) => grantHealthConsent(tx, aWho));
  await as(T, (tx) => saveMeasurements(tx, aWho, "2026-10-01", [{ metric: "weight", value: 61.5 }]));
  await as(T, (tx) => addNote(tx, aWho, { body: "Diz hassas", visibleToClient: false }));
  await as(T, (tx) =>
    createProgram(tx, T, { kind: "workout", clientId: ayse.id, name: "Başlangıç", note: null, targets: {}, startsOn: null, days: [{ title: "Gün A", items: [{ exerciseId: null, name: "Squat", sets: 3, reps: "10", load: null, rest: null, note: null }] }] }),
  );

  const data = await as(T, (tx) => loadExportData(tx, trainer));
  assert.equal(data.clients.length, 4, "only own clients");
  assert.ok(!data.clients.some((c) => c.fullName === "Gizli Danışan" || c.fullName === "Başkası"), "RLS on export");
  assert.equal(data.lessons.length, 1);
  assert.equal(data.lessons[0].date, "2026-10-05");
  assert.equal(data.lessons[0].time, "18:30", "lesson time in the trainer's timezone");
  assert.equal(data.lessons[0].attendance, "attended");

  const wb = buildExportWorkbook(data);
  assert.deepEqual(
    wb.worksheets.map((s) => s.name),
    Object.values(SHEET_NAMES),
  );
  // Written and read back, as the trainer would open it.
  const back = new ExcelJS.Workbook();
  await back.xlsx.load(toArrayBuffer(new Uint8Array(await wb.xlsx.writeBuffer())));
  const values = (name: string) => {
    const out: unknown[][] = [];
    back.getWorksheet(name)!.eachRow((row) => out.push((row.values as unknown[]).slice(1)));
    return out;
  };

  const clientSheet = values(SHEET_NAMES.clients);
  assert.deepEqual(clientSheet[0], ["Ad soyad", "Telefon", "E-posta", "Hedef", "Notlar", "Sağlık notu", "Durum", "Arşivde", "Eklenme"]);
  const ayseRow = clientSheet.find((r) => r[0] === "Ayşe Yılmaz")!;
  assert.equal(ayseRow[1], "+90 532 123 45 67");
  assert.equal(ayseRow[3], "Duruş");
  assert.equal(ayseRow[6], "Aktif");
  assert.equal(ayseRow[7], "Hayır");
  assert.ok(ayseRow[8] instanceof Date);
  assert.equal(ayseRow[5], "Sakatlık: Sol diz\nİlaç: Yok");
  assert.equal(clientSheet.length, 5, "header + 4 clients");

  // Round trip: the exported client sheet imports again with its health notes.
  const exported = await readSpreadsheet(toArrayBuffer(new Uint8Array(await wb.xlsx.writeBuffer())), "xlsx");
  assert.deepEqual(exported.headers, clientSheet[0], "the clients sheet is read first");
  const em = detectMapping(exported.headers);
  assert.deepEqual([em.fullName, em.phone, em.email, em.goals, em.notes], [0, 1, 2, 3, 4]);
  assert.deepEqual(em.healthNotes, [5], "Sağlık notu → health notes");
  const reimport = validateRows(exported.rows, em, { existingPhones: new Set(), today: TODAY, headers: exported.headers });
  const back1 = reimport.find((r) => r.client.fullName === "Ayşe Yılmaz")!;
  assert.equal(back1.client.healthNotes, ayse.healthNotes);
  assert.equal(back1.client.phone, ayse.phone);
  assert.equal(reimport.find((r) => r.client.fullName === "Borçlu Ben")!.client.healthNotes, "İlaç: Tansiyon ilacı");

  const pkgSheet = values(SHEET_NAMES.packages);
  const pkgRow = pkgSheet.find((r) => r[1] === "Reformer 10")!;
  assert.equal(pkgRow[0], "Ayşe Yılmaz");
  assert.equal(pkgRow[2], "Özel");
  assert.deepEqual(pkgRow.slice(3, 6), [8, 1, 7], "total / used / remaining");
  assert.equal((pkgRow[7] as Date).toISOString().slice(0, 10), "2026-12-31");
  assert.deepEqual(pkgRow.slice(8, 12), [1500, 500, 1000, "Aktif"]);
  assert.equal(pkgSheet.find((r) => r[1] === DEBT_PACKAGE_NAME)![11], "Bitti");

  const lessonSheet = values(SHEET_NAMES.lessons);
  assert.equal((lessonSheet[1][0] as Date).toISOString().slice(0, 10), "2026-10-05");
  assert.deepEqual(lessonSheet[1].slice(1), [
    "18:30",
    50,
    "Özel",
    "",
    "Hayır",
    "Ayşe Yılmaz",
    "Geldi",
  ]);

  const paySheet = values(SHEET_NAMES.payments);
  assert.deepEqual(paySheet[1].slice(1), ["Ayşe Yılmaz", "Reformer 10", 500, "Havale/EFT", "Onaylandı", "Sen", "Ekim"]);

  const answerSheet = values(SHEET_NAMES.answers);
  assert.deepEqual(answerSheet.slice(1), [
    ["Ayşe Yılmaz", "Boy", "168 cm", "Evet"],
    ["Ayşe Yılmaz", "Uygun zaman", "Sabah, Akşam", "Hayır"],
  ]);
  assert.deepEqual(values(SHEET_NAMES.measurements).slice(1).map((r) => [r[0], r[2], r[3], r[4], r[5]]), [["Ayşe Yılmaz", "Kilo", 61.5, "kg", "Sen"]]);
  assert.deepEqual(values(SHEET_NAMES.notes).slice(1).map((r) => [r[0], r[3], r[4]]), [["Ayşe Yılmaz", "Diz hassas", "Hayır"]]);
  assert.deepEqual(values(SHEET_NAMES.programs).slice(1).map((r) => r.slice(0, 6)), [["Ayşe Yılmaz", "Antrenman", "Başlangıç", "Gün A", "Squat", 3]]);
  assert.equal(exportFileName("2026-09-30"), "studyom-verileri-2026-09-30.xlsx");
  console.log("export: all eight sheets, own data only, local lesson times, balances from the view\n\nall import/export checks passed");
}

async function main() {
  pureChecks();
  await spreadsheetChecks();
  await dbChecks();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
