import ExcelJS from "exceljs";
import { withTrainer } from "@/db";
import { payrollFor } from "@/db/payroll";
import { getTrainer } from "@/db/queries";
import { APP_NAME } from "@/lib/config";
import { MONTH_PATTERN, SESSION_LABELS } from "@/lib/payroll";

/** Owner: a month's instructor pay as .xlsx, one summary sheet and one sheet of lessons. */
export async function GET(req: Request) {
  const month = new URL(req.url).searchParams.get("ay") ?? "";
  if (!MONTH_PATTERN.test(month)) return new Response("Not found", { status: 404 });
  const out = await withTrainer(async (tx, trainerId, member) => {
    if (member.role !== "owner") return null;
    const trainer = await getTrainer(tx, trainerId);
    return { rows: await payrollFor(tx, trainerId, month, { tz: trainer.timezone, countsMissed: trainer.payrollCountsMissed }), tz: trainer.timezone };
  });
  if (!out) return new Response("Not found", { status: 404 });

  const workbook = new ExcelJS.Workbook();
  workbook.creator = APP_NAME;
  const summary = workbook.addWorksheet("Özet", { views: [{ state: "frozen", ySplit: 1 }] });
  summary.columns = [
    { header: "Eğitmen", width: 28 },
    { header: "Özel", width: 8 },
    { header: "Düet", width: 8 },
    { header: "Trio", width: 8 },
    { header: "Grup", width: 8 },
    { header: "Toplam ders", width: 12 },
    { header: "Tutar (TL)", width: 14, style: { numFmt: "#,##0.00" } },
    { header: "Durum", width: 14 },
  ];
  const lines = workbook.addWorksheet("Dersler", { views: [{ state: "frozen", ySplit: 1 }] });
  lines.columns = [
    { header: "Eğitmen", width: 28 },
    { header: "Tarih", width: 12 },
    { header: "Saat", width: 8 },
    { header: "Tür", width: 8 },
    { header: "Kişi", width: 6 },
    { header: "Ders değeri (TL)", width: 16, style: { numFmt: "#,##0.00" } },
    { header: "Hakediş (TL)", width: 14, style: { numFmt: "#,##0.00" } },
  ];
  const day = new Intl.DateTimeFormat("tr-TR", { timeZone: out.tz, day: "2-digit", month: "2-digit", year: "numeric" });
  const time = new Intl.DateTimeFormat("tr-TR", { timeZone: out.tz, hour: "2-digit", minute: "2-digit" });
  for (const r of out.rows) {
    const s = r.summary;
    summary.addRow([r.member.fullName, s.byType.private, s.byType.duet, s.byType.trio, s.byType.group, s.lessons, s.amount, r.closed ? (r.closed.paidAt ? "Ödendi" : "Kapatıldı") : "Açık"]);
    for (const l of s.lines) {
      const at = new Date(l.startsAt);
      lines.addRow([r.member.fullName, day.format(at), time.format(at), SESSION_LABELS[l.sessionType], l.clients, l.value, l.pay]);
    }
  }
  for (const sheet of [summary, lines]) sheet.getRow(1).font = { bold: true };

  const buffer = await workbook.xlsx.writeBuffer();
  return new Response(new Uint8Array(buffer as ArrayBuffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="hakedis-${month}.xlsx"`,
      "Cache-Control": "private, no-store",
    },
  });
}
