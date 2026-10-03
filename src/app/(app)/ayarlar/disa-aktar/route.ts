import { withTrainer } from "@/db";
import { loadExportData } from "@/db/export";
import { getTrainer } from "@/db/queries";
import { buildExportWorkbook, exportFileName } from "@/lib/export";
import { todayISO } from "@/lib/format";

/** The signed-in trainer's data as an .xlsx download. Signed-out visitors are sent to the login page. */
export async function GET() {
  const out = await withTrainer(async (tx, trainerId, member) => {
    // The whole studio's data, money included: the owner's to take.
    if (member.role !== "owner") return null;
    const trainer = await getTrainer(tx, trainerId);
    return { data: await loadExportData(tx, trainer), today: todayISO(trainer.timezone) };
  });
  if (!out) return new Response("Not found", { status: 404 });
  const { data, today } = out;
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
