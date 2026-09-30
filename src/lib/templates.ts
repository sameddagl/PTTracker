import { z } from "zod";

// Ready-made texts the trainer can reword in Ayarlar → Hatırlatma ve mesajlar.
// `auto` ones go out as notifications on their own; the rest prefill the
// in-app message box (and the WhatsApp button next to it). Placeholders in
// braces are filled per client; unknown ones are left as typed.

export const TEMPLATE_VARS = {
  ad: "danışanın adı",
  zaman: "“yarın 18:00”",
  ders: "dersin adı",
  paket: "paketin adı",
  kalan: "kalan ders sayısı",
  durum: "“Paketinde 2 ders kaldı.”",
  tarih: "paketin bitiş tarihi",
  tutar: "kalan ödeme",
  link: "danışanın sayfasının linki",
} as const;

export type TemplateVar = keyof typeof TEMPLATE_VARS;

type TemplateDef = { label: string; hint: string; auto: boolean; vars: TemplateVar[]; text: string };

export const TEMPLATES = {
  reminder: {
    label: "Ders hatırlatması",
    hint: "Dersten önce giden bildirim. “Geliyorum / Gelemiyorum” butonları danışanın sayfasının en üstünde çıkar.",
    auto: true,
    vars: ["ad", "zaman", "ders"],
    text: "{zaman} dersin var. Geliyor musun? Dokunup haber ver.",
  },
  renewal: {
    label: "Paket yenileme teklifi",
    hint: "Paket bitmek üzereyken bir kez giden bildirim.",
    auto: true,
    vars: ["ad", "paket", "durum"],
    text: "{durum} Aynı paketi sayfandan yenileyebilirsin.",
  },
  confirmAsk: {
    label: "Onay isteme",
    hint: "Bugün → Yarın gelecekler",
    auto: false,
    vars: ["ad", "zaman", "ders"],
    text: "Merhaba {ad}, {zaman} dersin var. Geliyor musun? Sayfandan haber verebilirsin.",
  },
  lowBalance: {
    label: "Paket azaldı",
    hint: "Bugün → Dikkat edilecekler",
    auto: false,
    vars: ["ad", "paket", "kalan"],
    text: "Merhaba {ad}, paketinde {kalan} ders kaldı. Yenilemek istersen haber ver 🙂",
  },
  packageEnded: {
    label: "Paket bitti",
    hint: "Bugün → Dikkat edilecekler",
    auto: false,
    vars: ["ad", "paket"],
    text: "Merhaba {ad}, paketindeki dersler bitti. Yeni paket için haber ver 🙂",
  },
  expiring: {
    label: "Paketin süresi bitiyor",
    hint: "Bugün → Dikkat edilecekler",
    auto: false,
    vars: ["ad", "paket", "tarih"],
    text: "Merhaba {ad}, paketin {tarih} tarihinde bitiyor. Kalan derslerini planlayalım mı?",
  },
  paymentDue: {
    label: "Ödeme hatırlatma",
    hint: "Bugün ve Ödemeler",
    auto: false,
    vars: ["ad", "tutar"],
    text: "Merhaba {ad}, paket ödemenden {tutar} kaldı, hatırlatmak istedim. Teşekkürler!",
  },
  missYou: {
    label: "Bir süredir gelmeyenler",
    hint: "Bugün → Bir süredir gelmeyenler",
    auto: false,
    vars: ["ad"],
    text: "Merhaba {ad}, bir süredir görüşemedik. Bu hafta bir ders planlayalım mı? 🙂",
  },
  portalInvite: {
    label: "Sayfa linkini gönderme",
    hint: "Danışan sayfası → WhatsApp'ta gönder. {link} yazmazsan link sona eklenir.",
    auto: false,
    vars: ["ad", "link"],
    text: "Merhaba {ad}, kalan derslerini, randevularını ve ödeme durumunu buradan görebilirsin: {link}",
  },
} satisfies Record<string, TemplateDef>;

export type TemplateKey = keyof typeof TEMPLATES;
export type MessageTemplates = Partial<Record<TemplateKey, string>>;

export const TEMPLATE_MAX_LENGTH = 500;

/** Hours before a lesson the trainer can pick for the reminder. */
export const REMINDER_HOUR_OPTIONS = [3, 6, 12, 24, 36, 48] as const;

export const messageTemplatesSchema = z.object(
  Object.fromEntries(Object.keys(TEMPLATES).map((k) => [k, z.string().trim().max(TEMPLATE_MAX_LENGTH).optional()])) as Record<
    TemplateKey,
    z.ZodOptional<z.ZodString>
  >,
);

const firstName = (fullName: string) => fullName.trim().split(/\s+/)[0] ?? fullName;

/** The trainer's wording for a key, or the default when they haven't changed it. */
export function templateText(stored: MessageTemplates | null | undefined, key: TemplateKey) {
  const own = stored?.[key]?.trim();
  return own ? own : TEMPLATES[key].text;
}

/** Fills {placeholders}; `ad` takes a full name and uses the first name. */
export function fillTemplate(text: string, vars: Partial<Record<TemplateVar, string | number | null | undefined>>) {
  const values: Partial<Record<string, string>> = {};
  for (const [k, v] of Object.entries(vars)) if (v !== null && v !== undefined) values[k] = k === "ad" ? firstName(String(v)) : String(v);
  const out = text.replace(/\{([a-zçğıöşü]+)\}/g, (m, k: string) => values[k] ?? m);
  // A sentence starting with {zaman} ("yarın 18:00") gets a capital letter.
  return out.charAt(0).toLocaleUpperCase("tr") + out.slice(1);
}

export function renderTemplate(
  stored: MessageTemplates | null | undefined,
  key: TemplateKey,
  vars: Partial<Record<TemplateVar, string | number | null | undefined>>,
) {
  let text = templateText(stored, key);
  if (key === "portalInvite" && vars.link && !text.includes("{link}")) text = `${text}\n{link}`;
  return fillTemplate(text, vars);
}

/** Keeps only changed, known keys, so the stored object stays small. */
export function cleanTemplates(input: Record<string, unknown>): MessageTemplates {
  const out: MessageTemplates = {};
  for (const key of Object.keys(TEMPLATES) as TemplateKey[]) {
    const v = input[key];
    if (typeof v !== "string") continue;
    const t = v.trim().slice(0, TEMPLATE_MAX_LENGTH);
    if (t && t !== TEMPLATES[key].text) out[key] = t;
  }
  return out;
}
