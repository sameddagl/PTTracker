"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { withTrainer } from "@/db";
import { ensureDefaultIntakeFields } from "@/db/intake";
import { trainers } from "@/db/schema";
import { fieldErrors, readForm, type FormState } from "@/lib/forms";
import { isValidIban, normalizeIban } from "@/lib/iban";
import { isUniqueViolation } from "@/lib/pg-errors";
import { slugError } from "@/lib/slug";
import { PROFILE_BUCKET } from "@/lib/storage";
import { createClient } from "@/lib/supabase/server";
import { normalizePhone } from "@/lib/whatsapp";

const FIELDS = [
  "slug",
  "fullName",
  "businessName",
  "headline",
  "bio",
  "city",
  "instagram",
  "phone",
  "specialties",
  "publicPageEnabled",
  "iban",
  "ibanHolder",
] as const;
export type ProfileField = (typeof FIELDS)[number];

const optional = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `En fazla ${max} karakter olabilir.`)
    .transform((v) => v || null);

/** "@samed.pilates", "instagram.com/samed.pilates/" → "samed.pilates" */
const instagramHandle = (raw: string) =>
  raw
    .trim()
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, "")
    .replace(/^@/, "")
    .replace(/[/?#].*$/, "");

const profileSchema = z
  .object({
    slug: z
      .string()
      .trim()
      .toLowerCase()
      .transform((v) => v || null)
      .superRefine((v, ctx) => {
        const err = v && slugError(v);
        if (err) ctx.addIssue({ code: "custom", message: err });
      }),
    fullName: z.string().trim().min(2, "Adını yaz.").max(120),
    businessName: optional(120),
    headline: optional(120),
    bio: optional(1500),
    city: optional(80),
    instagram: z
      .string()
      .transform(instagramHandle)
      .refine((v) => v === "" || /^[A-Za-z0-9._]{1,30}$/.test(v), "Instagram kullanıcı adını kontrol et.")
      .transform((v) => v || null),
    // Validated before parsing (see saveProfileAction) so the error keeps its message.
    phone: z
      .string()
      .trim()
      .transform((v) => (v ? normalizePhone(v) : null)),
    specialties: z
      .string()
      .transform((v) => [...new Set(v.split(",").map((s) => s.trim()).filter(Boolean))].slice(0, 8))
      .refine((v) => v.every((s) => s.length <= 40), "Her alan en fazla 40 karakter olabilir."),
    publicPageEnabled: z.string().transform((v) => v === "on"),
    iban: z
      .string()
      .transform((v) => normalizeIban(v) || null)
      .refine((v) => v === null || isValidIban(v), "IBAN'ı kontrol et: TR ile başlar, 26 karakterdir."),
    ibanHolder: optional(120),
  })
  .refine((v) => !v.iban || v.ibanHolder, { path: ["ibanHolder"], message: "Hesap sahibinin adını yaz." })
  .refine((v) => !v.publicPageEnabled || v.slug, { path: ["slug"], message: "Sayfayı yayınlamak için bir adres seç." });

export async function saveProfileAction(_prev: FormState<ProfileField>, formData: FormData): Promise<FormState<ProfileField>> {
  const raw = readForm(formData, FIELDS);
  if (raw.phone && !normalizePhone(raw.phone)) return { errors: { phone: "Telefon numarasını kontrol et." }, values: raw };
  const parsed = profileSchema.safeParse(raw);
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values: raw };

  try {
    await withTrainer(async (tx, trainerId) => {
      await tx.update(trainers).set(parsed.data).where(eq(trainers.id, trainerId));
      // Publishing without ever opening the form settings still gets the default questions.
      if (parsed.data.publicPageEnabled) await ensureDefaultIntakeFields(tx, trainerId);
    });
  } catch (e) {
    if (isUniqueViolation(e)) return { errors: { slug: "Bu adresi başka biri kullanıyor." }, values: raw };
    throw e;
  }

  revalidatePath("/ayarlar", "layout");
  if (parsed.data.slug) revalidatePath(`/${parsed.data.slug}`);
  return { savedAt: Date.now() };
}

const kindSchema = z.enum(["avatar", "cover"]);

/**
 * Records a photo the browser has just uploaded to storage (under the
 * trainer's own folder, enforced by storage RLS) and removes the old one.
 */
export async function setProfileImageAction(kind: string, path: string | null): Promise<{ ok: boolean }> {
  const k = kindSchema.safeParse(kind);
  if (!k.success) return { ok: false };
  const column = k.data === "avatar" ? "avatarPath" : "coverPath";

  const previous = await withTrainer(async (tx, trainerId) => {
    if (path !== null && !new RegExp(`^${trainerId}/${k.data}-\\d+\\.webp$`).test(path)) return undefined;
    const [row] = await tx.select({ old: trainers[column] }).from(trainers).where(eq(trainers.id, trainerId));
    await tx.update(trainers).set({ [column]: path }).where(eq(trainers.id, trainerId));
    return row?.old ?? null;
  });
  if (previous === undefined) return { ok: false };

  if (previous && previous !== path) {
    const supabase = await createClient();
    await supabase.storage.from(PROFILE_BUCKET).remove([previous]);
  }
  revalidatePath("/ayarlar", "layout");
  return { ok: true };
}
