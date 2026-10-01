import { withTrainer } from "@/db";
import { getAttachment, getProgram } from "@/db/programs";
import { pdfResponse } from "@/lib/pdf-response";

// The PDF attached to a nutrition plan, for its trainer (RLS).
export async function GET(_req: Request, ctx: RouteContext<"/programlar/[id]/pdf">) {
  const { id } = await ctx.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new Response("Not found", { status: 404 });
  const file = await withTrainer(async (tx, trainerId) => ((await getProgram(tx, trainerId, id)) ? getAttachment(tx, id) : null));
  if (!file) return new Response("Not found", { status: 404 });
  return pdfResponse(file);
}
