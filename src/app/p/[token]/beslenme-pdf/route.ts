import { adminDb, type Tx } from "@/db";
import { getAttachment, portalProgram } from "@/db/programs";
import { resolvePortalToken } from "@/lib/portal";
import { pdfResponse } from "@/lib/pdf-response";

// The PDF on the client's current nutrition plan, behind their personal link.
export async function GET(_req: Request, ctx: RouteContext<"/p/[token]/beslenme-pdf">) {
  const { token } = await ctx.params;
  const who = await resolvePortalToken(token);
  if (!who) return new Response("Not found", { status: 404 });
  const current = await portalProgram(adminDb as unknown as Tx, who, "nutrition");
  const file = current?.program.pdfName ? await getAttachment(adminDb as unknown as Tx, current.program.id) : null;
  if (!file) return new Response("Not found", { status: 404 });
  return pdfResponse(file);
}
