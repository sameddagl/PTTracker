import { z } from "zod";

// What each side can be told, and how. `email: null` means that channel isn't
// offered (messages never go by e-mail). Defaults keep e-mail for the few
// things worth an inbox; everything else is push only.

type KindDef = { label: string; hint: string; push: boolean; email: boolean | null };

export const TRAINER_KINDS = {
  application: { label: "Başvurular", hint: "Sayfandan yeni başvuru ya da danışanından paket talebi", push: true, email: true },
  booking: { label: "Randevu ve iptaller", hint: "Danışanın ders aldığında, iptal ettiğinde ya da onayladığında", push: true, email: false },
  payment: { label: "Ödeme bildirimleri", hint: "Danışanın havale yaptığını bildirdiğinde", push: true, email: false },
  message: { label: "Mesajlar", hint: "Danışanın sana yazdığında", push: true, email: null },
  weekly: { label: "Haftalık özet", hint: "Pazartesi sabahı geçen haftanın özeti", push: true, email: true },
} satisfies Record<string, KindDef>;

export const CLIENT_KINDS = {
  reminder: { label: "Ders hatırlatması", hint: "Dersinden önce \"Geliyor musun?\"", push: true, email: false },
  package: { label: "Paket ve ödemeler", hint: "Ödeme onayı, paketin bitmek üzere olduğunda", push: true, email: false },
  message: { label: "Mesajlar", hint: "Eğitmenin sana yazdığında", push: true, email: null },
} satisfies Record<string, KindDef>;

export type TrainerKind = keyof typeof TRAINER_KINDS;
export type ClientKind = keyof typeof CLIENT_KINDS;
export type Channel = "push" | "email";
export type NotifyPrefs = Partial<Record<string, { push?: boolean; email?: boolean }>>;

export const notifyPrefsSchema = z.record(z.string().max(20), z.object({ push: z.boolean().optional(), email: z.boolean().optional() })).refine(
  (v) => Object.keys(v).length <= 10,
);

function resolve<K extends string>(kinds: Record<K, KindDef>, stored: NotifyPrefs | null | undefined, kind: K, channel: Channel) {
  const def = kinds[kind][channel];
  if (def === null) return false;
  return stored?.[kind]?.[channel] ?? def;
}

export const trainerWants = (stored: NotifyPrefs | null | undefined, kind: TrainerKind, channel: Channel) =>
  resolve(TRAINER_KINDS, stored, kind, channel);
export const clientWants = (stored: NotifyPrefs | null | undefined, kind: ClientKind, channel: Channel) =>
  resolve(CLIENT_KINDS, stored, kind, channel);

/** Full view of the choices for a settings screen: every kind, both channels, defaults applied. */
export function prefsView(audience: "trainer" | "client", stored: NotifyPrefs | null | undefined) {
  const kinds: Record<string, KindDef> = audience === "trainer" ? TRAINER_KINDS : CLIENT_KINDS;
  return Object.entries(kinds).map(([kind, d]) => ({
    kind,
    label: d.label,
    hint: d.hint,
    push: resolve(kinds, stored, kind, "push"),
    email: d.email === null ? null : resolve(kinds, stored, kind, "email"),
  }));
}

/** Keeps only known kinds and offered channels, so stored prefs stay small and valid. */
export function cleanPrefs(audience: "trainer" | "client", input: NotifyPrefs): NotifyPrefs {
  const kinds: Record<string, KindDef> = audience === "trainer" ? TRAINER_KINDS : CLIENT_KINDS;
  const out: NotifyPrefs = {};
  for (const [kind, d] of Object.entries(kinds)) {
    const v = input[kind];
    if (!v) continue;
    out[kind] = {
      ...(typeof v.push === "boolean" ? { push: v.push } : {}),
      ...(d.email !== null && typeof v.email === "boolean" ? { email: v.email } : {}),
    };
  }
  return out;
}
