// Who is responsible for the platform's data processing (KVKK "veri sorumlusu").
// There is no company yet: until there is, this is the founder as a real
// person. Fill these in before the public beta; the legal pages show a draft
// notice while READY is false.
export const LEGAL = {
  READY: false,
  controller: "[Ad Soyad veya şirket unvanı]",
  address: "[Tebligat adresi]",
  email: "[kvkk@alanadi]",
  /** Version stamps stored with each consent (see consents.text_version); bump when a text changes. */
  noticeVersion: "aydinlatma-2026-09-29",
  healthConsentVersion: "saglik-rizasi-2026-09-29",
  termsVersion: "kosullar-2026-09-29",
  updatedOn: "29 Eylül 2026",
} as const;

/** Processors we pass data to, listed in the notice. */
export const SUBPROCESSORS = [
  {
    name: "Supabase Inc.",
    purpose: "Veritabanı, kimlik doğrulama ve dosya depolama",
    location: "Almanya (Frankfurt, AB) veri merkezi; şirket ABD merkezli",
  },
  {
    name: "Google LLC (Gmail)",
    purpose: "Giriş kodu ve bilgilendirme e-postalarının gönderilmesi",
    location: "ABD ve Google'ın küresel veri merkezleri",
  },
] as const;
