"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { withTrainer } from "@/db";
import { clients, consents } from "@/db/schema";
import { fieldErrors, readForm, type FormState } from "@/lib/forms";
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

const FIELDS = ["fullName", "phone", "email", "goals", "notes", "healthNotes", "healthConsent"] as const;

export type ClientFormState = FormState<(typeof FIELDS)[number]>;

export async function createClientAction(_prev: ClientFormState, formData: FormData): Promise<ClientFormState> {
  const raw = readForm(formData, FIELDS);
  const parsed = clientSchema.safeParse({ ...raw, healthConsent: raw.healthConsent || undefined });

  if (!parsed.success) return { errors: fieldErrors(parsed.error), values: raw };

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
