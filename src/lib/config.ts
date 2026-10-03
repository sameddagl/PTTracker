export const APP_NAME = "Stüdyom";
/** Domain spelled without Turkish letters; used in copy and mock URLs. The live origin comes from NEXT_PUBLIC_SITE_URL. */
export const APP_DOMAIN = "studyomapp.com";
export const APP_DESCRIPTION = "Pilates ve PT stüdyoları için yönetim uygulaması: eğitmen ekibi, ortak takvim, seans paketi, randevu ve ödeme takibi.";

export const siteUrl = () => process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/** Only allow same-site relative redirects (blocks open redirects like //evil.com). */
export function safeNext(next: string | null | undefined, fallback = "/bugun") {
  return next && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\") ? next : fallback;
}

/** Umami Cloud site id (public). Stats run only on public pages, never in the app or client portal. */
export const UMAMI_WEBSITE_ID = "52cd557c-c612-4baf-9d59-cc7dcb17986e";
