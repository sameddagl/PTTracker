// The "Örnek dosya" trainers can fill in and upload.

import ExcelJS from "exceljs";

export const TEMPLATE_HEADERS = ["Ad Soyad", "Telefon", "E-posta", "Hedef", "Notlar", "Sağlık notu", "Kalan ders", "Paket adı", "Paket bitiş", "Borç"];

const EXAMPLES = [
  ["Ayşe Yılmaz", "0532 123 45 67", "ayse@ornek.com", "Duruş", "Salı ve perşembe akşam", "Bel fıtığı, doktor onaylı", 8, "10 derslik reformer", "31.12.2026", 1500],
  ["Mehmet Demir", "0544 765 43 21", "", "Kilo vermek", "", "", 3, "", "", ""],
];

export function buildTemplateWorkbook() {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Danışanlar", { views: [{ state: "frozen", ySplit: 1 }] });
  const widths = [22, 18, 24, 18, 28, 28, 12, 22, 14, 10];
  // Phones and dates as text, so Excel keeps the leading 0 and doesn't reformat the date.
  const textColumns = new Set([1, 8]);
  sheet.columns = TEMPLATE_HEADERS.map((header, i) => ({
    header,
    width: widths[i],
    style: textColumns.has(i) ? { numFmt: "@" } : {},
  }));
  sheet.getRow(1).font = { bold: true };
  for (const row of EXAMPLES) sheet.addRow(row);
  return workbook;
}
