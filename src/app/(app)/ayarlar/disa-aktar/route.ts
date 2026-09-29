import { withTrainer } from "@/db";
import { loadExportData } from "@/db/export";
import { getTrainer } from "@/db/queries";
import { buildExportWorkbook, exportFileName } from "@/lib/export";
import { todayISO } from "@/lib/format";

/** The signed-in trainer's data as an .xlsx download. Signed-out visitors are sent to the login page. */
export async function GET() {
  const { data, today } = await withTrainer(async (tx, trainerId) => {
    const trainer = await getTrainer(tx, trainerId);
    return { data: await loadExportData(tx, trainer), today: todayISO(trainer.timezone) };
  });
  const buffer = await buildExportWorkbook(data).xlsx.writeBuffer();
  return new Response(new Uint8Array(buffer as ArrayBuffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${exportFileName(today)}"`,
      // Personal data: never cache.
      "Cache-Control": "private, no-store",
    },
  });
}
