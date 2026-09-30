import { LEGAL } from "@/lib/legal";
import { siteUrl } from "@/lib/config";

// RFC 9116: where to report a security problem.
export const dynamic = "force-static";

export function GET() {
  const expires = new Date(Date.now() + 365 * 86_400_000).toISOString();
  const text = `Contact: mailto:${LEGAL.email}
Expires: ${expires}
Preferred-Languages: tr, en
Canonical: ${siteUrl()}/.well-known/security.txt
Policy: ${siteUrl()}/kvkk
`;
  return new Response(text, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
