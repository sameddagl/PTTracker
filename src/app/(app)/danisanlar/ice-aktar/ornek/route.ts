import { APP_NAME } from "@/lib/config";
import { buildTemplateWorkbook } from "@/lib/import/template";
import { toSlug } from "@/lib/slug";

// The template is the same for everyone, so it is built once at build time.
export const dynamic = "force-static";

export async function GET() {
  const buffer = await buildTemplateWorkbook().xlsx.writeBuffer();
  return new Response(new Uint8Array(buffer as ArrayBuffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${toSlug(APP_NAME)}-danisan-ornek.xlsx"`,
    },
  });
}
