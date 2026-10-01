// "Verilerini dışa aktar": the trainer's data as one .xlsx, a sheet per kind.
// Pure: takes plain rows (see src/db/export.ts) so it can be tested without a request.

import ExcelJS from "exceljs";
import { APP_NAME } from "./config";
import { ATTENDANCE_LABELS, PAYMENT_METHOD_LABELS, SESSION_TYPE_LABELS, todayISO } from "./format";
import { formatAnswer, type IntakeType } from "./intake";
import { toSlug } from "./slug";
import { formatPhone } from "./whatsapp";

type SessionType = keyof typeof SESSION_TYPE_LABELS;
type Money = string | number;

export type ExportData = {
  /** The trainer's timezone, for created-at dates. */
  timezone: string;
  clients: {
    fullName: string;
    phone: string | null;
    email: string | null;
    goals: string | null;
    notes: string | null;
    healthNotes: string | null;
    status: "applicant" | "active";
    archivedAt: Date | null;
    createdAt: Date;
  }[];
  packages: {
    clientName: string;
    name: string;
    sessionType: SessionType;
    totalSessions: number;
    usedSessions: number;
    remainingSessions: number;
    startsOn: string;
    /** Including freezes. */
    expiresOn: string | null;
    price: Money;
    paid: Money;
    due: Money;
    state: string;
  }[];
  lessons: {
    /** Local date and time in the trainer's timezone. */
    date: string;
    time: string;
    durationMinutes: number;
    sessionType: SessionType;
    title: string | null;
    lessonStatus: "scheduled" | "cancelled";
    clientName: string | null;
    attendance: keyof typeof ATTENDANCE_LABELS | null;
  }[];
  payments: {
    paidOn: string;
    clientName: string;
    packageName: string | null;
    amount: Money;
    method: keyof typeof PAYMENT_METHOD_LABELS;
    status: "pending" | "confirmed" | "rejected";
    reportedBy: "trainer" | "client";
    note: string | null;
  }[];
  answers: {
    clientName: string;
    label: string;
    type: IntakeType;
    unit: string | null;
    isHealth: boolean;
    valueText: string | null;
    valueNumber: string | number | null;
    valueDate: string | null;
    valueOptions: string[] | null;
    valueBool: boolean | null;
  }[];
  /** Readings with the metric already named (built-in label or the trainer's own). */
  measurements?: { clientName: string; measuredOn: string; metric: string; unit: string; value: number; byClient: boolean }[];
  notes?: { clientName: string; createdAt: Date; lessonDate: string | null; body: string; visibleToClient: boolean }[];
};

export const SHEET_NAMES = {
  clients: "Danışanlar",
  packages: "Paketler",
  lessons: "Dersler",
  payments: "Ödemeler",
  answers: "Kayıt formu cevapları",
  measurements: "Ölçümler",
  notes: "Notlar",
} as const;

const CLIENT_STATUS = { applicant: "Başvuru", active: "Aktif" } as const;
const PACKAGE_STATE: Record<string, string> = {
  active: "Aktif",
  frozen: "Donduruldu",
  finished: "Bitti",
  expired: "Süresi doldu",
  cancelled: "İptal",
};
const PAYMENT_STATUS = { pending: "Onay bekliyor", confirmed: "Onaylandı", rejected: "Reddedildi" } as const;
const REPORTED_BY = { trainer: "Sen", client: "Danışan" } as const;

const yesNo = (v: boolean) => (v ? "Evet" : "Hayır");
/** A Postgres date as an Excel date (UTC midnight, shown without a time). */
const asDate = (iso: string | null) => (iso ? new Date(`${iso}T00:00:00Z`) : null);
const money = (v: Money) => Number(v);

const DATE_FMT = "dd.mm.yyyy";
const MONEY_FMT = '#,##0.00 "₺"';

type Column = { header: string; width: number; numFmt?: string };

function addSheet(workbook: ExcelJS.Workbook, name: string, columns: Column[], rows: unknown[][]) {
  const sheet = workbook.addWorksheet(name, { views: [{ state: "frozen", ySplit: 1 }] });
  sheet.columns = columns.map((c) => ({ header: c.header, width: c.width, style: c.numFmt ? { numFmt: c.numFmt } : {} }));
  sheet.getRow(1).font = { bold: true };
  for (const r of rows) sheet.addRow(r);
  if (rows.length > 0) sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: columns.length } };
  return sheet;
}

export function buildExportWorkbook(data: ExportData) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = APP_NAME;

  addSheet(
    workbook,
    SHEET_NAMES.clients,
    [
      { header: "Ad soyad", width: 24 },
      { header: "Telefon", width: 18 },
      { header: "E-posta", width: 26 },
      { header: "Hedef", width: 22 },
      { header: "Notlar", width: 32 },
      { header: "Sağlık notu", width: 28 },
      { header: "Durum", width: 10 },
      { header: "Arşivde", width: 10 },
      { header: "Eklenme", width: 12, numFmt: DATE_FMT },
    ],
    [...data.clients].sort((a, b) => a.fullName.localeCompare(b.fullName, "tr")).map((c) => [
      c.fullName,
      formatPhone(c.phone) ?? "",
      c.email ?? "",
      c.goals ?? "",
      c.notes ?? "",
      c.healthNotes ?? "",
      CLIENT_STATUS[c.status],
      yesNo(c.archivedAt !== null),
      asDate(todayISO(data.timezone, c.createdAt)),
    ]),
  );

  addSheet(
    workbook,
    SHEET_NAMES.packages,
    [
      { header: "Danışan", width: 24 },
      { header: "Paket", width: 24 },
      { header: "Tür", width: 8 },
      { header: "Toplam ders", width: 12 },
      { header: "Kullanılan", width: 11 },
      { header: "Kalan", width: 8 },
      { header: "Başlangıç", width: 12, numFmt: DATE_FMT },
      { header: "Bitiş", width: 12, numFmt: DATE_FMT },
      { header: "Fiyat", width: 12, numFmt: MONEY_FMT },
      { header: "Ödenen", width: 12, numFmt: MONEY_FMT },
      { header: "Kalan ödeme", width: 12, numFmt: MONEY_FMT },
      { header: "Durum", width: 12 },
    ],
    data.packages.map((p) => [
      p.clientName,
      p.name,
      SESSION_TYPE_LABELS[p.sessionType],
      p.totalSessions,
      p.usedSessions,
      p.remainingSessions,
      asDate(p.startsOn),
      asDate(p.expiresOn),
      money(p.price),
      money(p.paid),
      money(p.due),
      PACKAGE_STATE[p.state] ?? p.state,
    ]),
  );

  addSheet(
    workbook,
    SHEET_NAMES.lessons,
    [
      { header: "Tarih", width: 12, numFmt: DATE_FMT },
      { header: "Saat", width: 8 },
      { header: "Süre (dk)", width: 10 },
      { header: "Tür", width: 8 },
      { header: "Başlık", width: 22 },
      { header: "Ders iptal", width: 10 },
      { header: "Danışan", width: 24 },
      { header: "Yoklama", width: 12 },
    ],
    data.lessons.map((l) => [
      asDate(l.date),
      l.time,
      l.durationMinutes,
      SESSION_TYPE_LABELS[l.sessionType],
      l.title ?? "",
      yesNo(l.lessonStatus === "cancelled"),
      l.clientName ?? "",
      l.attendance ? ATTENDANCE_LABELS[l.attendance] : "",
    ]),
  );

  addSheet(
    workbook,
    SHEET_NAMES.payments,
    [
      { header: "Tarih", width: 12, numFmt: DATE_FMT },
      { header: "Danışan", width: 24 },
      { header: "Paket", width: 24 },
      { header: "Tutar", width: 12, numFmt: MONEY_FMT },
      { header: "Yöntem", width: 12 },
      { header: "Durum", width: 14 },
      { header: "Kaydeden", width: 10 },
      { header: "Not", width: 28 },
    ],
    data.payments.map((p) => [
      asDate(p.paidOn),
      p.clientName,
      p.packageName ?? "",
      money(p.amount),
      PAYMENT_METHOD_LABELS[p.method],
      PAYMENT_STATUS[p.status],
      REPORTED_BY[p.reportedBy],
      p.note ?? "",
    ]),
  );

  addSheet(
    workbook,
    SHEET_NAMES.answers,
    [
      { header: "Danışan", width: 24 },
      { header: "Soru", width: 28 },
      { header: "Cevap", width: 36 },
      { header: "Sağlık", width: 8 },
    ],
    data.answers.map((a) => [a.clientName, a.label, formatAnswer(a), yesNo(a.isHealth)]),
  );

  addSheet(
    workbook,
    SHEET_NAMES.measurements,
    [
      { header: "Danışan", width: 24 },
      { header: "Tarih", width: 12, numFmt: DATE_FMT },
      { header: "Ölçü", width: 22 },
      { header: "Değer", width: 10 },
      { header: "Birim", width: 10 },
      { header: "Giren", width: 10 },
    ],
    (data.measurements ?? []).map((m) => [m.clientName, asDate(m.measuredOn), m.metric, m.value, m.unit, m.byClient ? "Danışan" : "Sen"]),
  );

  addSheet(
    workbook,
    SHEET_NAMES.notes,
    [
      { header: "Danışan", width: 24 },
      { header: "Tarih", width: 12, numFmt: DATE_FMT },
      { header: "Ders", width: 12, numFmt: DATE_FMT },
      { header: "Not", width: 60 },
      { header: "Danışan görüyor", width: 14 },
    ],
    (data.notes ?? []).map((n) => [n.clientName, asDate(todayISO(data.timezone, n.createdAt)), asDate(n.lessonDate), n.body, yesNo(n.visibleToClient)]),
  );

  return workbook;
}

/** "studyom-verileri-2026-09-30.xlsx" */
export const exportFileName = (today: string) => `${toSlug(APP_NAME)}-verileri-${today}.xlsx`;
