// Who is responsible for the platform's data processing (KVKK "veri sorumlusu").
// There is no company yet, so this is the founder as a real person. Add the
// company name and a postal address once the company exists (`address: null`
// hides the address row). The legal pages show a draft notice while READY is false.
export const LEGAL = {
  READY: true,
  controller: "Abdulsamed Dağlı",
  address: null as string | null,
  email: "info@studyomapp.com",
  /** Version stamps stored with each consent (see consents.text_version); bump when a text changes. */
  noticeVersion: "aydinlatma-2026-10-01",
  healthConsentVersion: "saglik-rizasi-2026-09-29",
  termsVersion: "kosullar-2026-09-30b",
  updatedOn: "1 Ekim 2026",
  /** Same date for the sitemap; keep it in step with updatedOn. */
  updatedIso: "2026-10-01",
} as const;

/** Processors we pass data to, listed in the notice. */
export const SUBPROCESSORS = [
  {
    name: "Supabase Inc.",
    purpose: "Veritabanı, kimlik doğrulama ve dosya depolama",
    location: "Almanya (Frankfurt, AB) veri merkezi; şirket ABD merkezli",
  },
  {
    name: "Hostinger",
    purpose: "Uygulamanın çalıştığı sunucu; giriş kodu ve bilgilendirme e-postalarının gönderilmesi",
    location: "Avrupa veri merkezi; şirket Litvanya merkezli",
  },
  {
    name: "Functional Software Inc. (Sentry)",
    purpose: "Hata kayıtları; ad, e-posta, form içeriği ve sağlık bilgisi gönderilmez",
    location: "Almanya (Frankfurt, AB) veri merkezi; şirket ABD merkezli",
  },
  {
    name: "Umami Software (Umami Cloud)",
    purpose: "Tanıtım ve eğitmen sayfalarında çerezsiz ziyaret sayımı; kişiyi tanıyan veri toplanmaz",
    location: "AB veri merkezi",
  },
  {
    name: "Apple, Google ve Mozilla bildirim servisleri",
    purpose: "Bildirimi açan cihazlara anlık bildirim iletilmesi",
    location: "ABD ve küresel veri merkezleri",
  },
] as const;
