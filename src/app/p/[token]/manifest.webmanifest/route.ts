import { PORTAL_TOKEN_PATTERN } from "@/db/portal";
import { APP_NAME } from "@/lib/config";
import { manifestResponse, webManifest } from "@/lib/manifest";

// The app manifest starts at the trainer app (/bugun). A client who adds
// their page to the home screen must land back on their own page instead.
export async function GET(_req: Request, { params }: RouteContext<"/p/[token]/manifest.webmanifest">) {
  const { token } = await params;
  if (!PORTAL_TOKEN_PATTERN.test(token)) return new Response(null, { status: 404 });
  const home = `/p/${token}`;
  return manifestResponse(
    webManifest({ name: `${APP_NAME} · Derslerim`, short_name: "Derslerim", description: undefined, start_url: home, scope: home, id: home }),
    "private, max-age=3600",
  );
}
