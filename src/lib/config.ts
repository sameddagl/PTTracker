export const APP_NAME = "Stüdyom";
/** Domain spelled without Turkish letters; used in copy and mock URLs. The live origin comes from NEXT_PUBLIC_SITE_URL. */
export const APP_DOMAIN = "studyomapp.com";
export const APP_DESCRIPTION = "Pilates ve PT eğitmenleri için danışan, seans paketi, randevu ve ödeme takibi.";

export const siteUrl = () => process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/** Only allow same-site relative redirects (blocks open redirects like //evil.com). */
export function safeNext(next: string | null | undefined, fallback = "/bugun") {
  return next && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\") ? next : fallback;
}
