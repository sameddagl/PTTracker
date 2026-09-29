import { withTrainer } from "@/db";
import { getReceipt } from "@/db/payments";

// A client's transfer receipt, only for the trainer it was sent to (RLS).
export async function GET(_req: Request, ctx: RouteContext<"/odemeler/dekont/[id]">) {
  const { id } = await ctx.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new Response("Not found", { status: 404 });
  const receipt = await withTrainer((tx, trainerId) => getReceipt(tx, trainerId, id));
  if (!receipt) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(receipt.data), {
    headers: {
      "Content-Type": receipt.mimeType,
      "Content-Disposition": `inline; filename="dekont.${receipt.mimeType === "application/pdf" ? "pdf" : "webp"}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
