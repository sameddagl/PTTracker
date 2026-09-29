// Working name until the product is named.
export const APP_NAME = "PTTracker";
export const APP_DESCRIPTION = "Danışan, paket ve ödeme takibi — PT ve pilates eğitmenleri için.";

export const siteUrl = () => process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/** Only allow same-site relative redirects (blocks open redirects like //evil.com). */
export function safeNext(next: string | null | undefined, fallback = "/bugun") {
  return next && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\") ? next : fallback;
}
