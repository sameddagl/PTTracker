"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { withTrainer } from "@/db";
import { clients, consents } from "@/db/schema";
import { normalizePhone } from "@/lib/whatsapp";

// Bump when the consent text shown in the form changes.
const HEALTH_CONSENT_VERSION = "saglik-2026-09";

const optionalText = z
  .string()
  .trim()
  .transform((v) => v || null);

const clientSchema = z
  .object({
    fullName: z.string().trim().min(2, "Ad soyad en az 2 karakter olmalı.").max(120),
    phone: optionalText.refine((v) => v === null || normalizePhone(v) !== null, "Telefon numarası geçersiz."),
    email: optionalText.pipe(z.email("E-posta geçersiz.").nullable()),
    goals: optionalText,
    notes: optionalText,
    healthNotes: optionalText,
    healthConsent: z.literal("on").optional(),
  })
  .refine((v) => !v.healthNotes || v.healthConsent, {
    path: ["healthConsent"],
    message: "Sağlık bilgisi kaydetmek için danışanın açık rızası gerekli.",
  });

export type ClientFormState = {
  errors?: Partial<Record<keyof z.input<typeof clientSchema>, string>>;
  values?: Record<string, string>;
};

export async function createClientAction(_prev: ClientFormState, formData: FormData): Promise<ClientFormState> {
  const raw = Object.fromEntries(
    ["fullName", "phone", "email", "goals", "notes", "healthNotes", "healthConsent"].map((k) => [
      k,
      formData.get(k)?.toString() ?? "",
    ]),
  );
  const parsed = clientSchema.safeParse({ ...raw, healthConsent: raw.healthConsent || undefined });

  if (!parsed.success) {
    const errors: ClientFormState["errors"] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof NonNullable<ClientFormState["errors"]>;
      errors[key] ??= issue.message;
    }
    return { errors, values: raw };
  }

  const { healthConsent, phone, ...data } = parsed.data;
  const id = await withTrainer(async (tx, trainerId) => {
    const [row] = await tx
      .insert(clients)
      .values({ ...data, phone: phone && normalizePhone(phone), trainerId })
      .returning({ id: clients.id });
    if (data.healthNotes && healthConsent) {
      await tx.insert(consents).values({
        trainerId,
        clientId: row.id,
        kind: "health_data",
        textVersion: HEALTH_CONSENT_VERSION,
      });
    }
    return row.id;
  });

  redirect(`/danisanlar/${id}`);
}
