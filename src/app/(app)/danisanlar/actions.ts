"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { LEGAL } from "@/lib/legal";
import { requireOwner, type Tx, withTrainer } from "@/db";
import { archiveClient, deleteClient, restoreClient } from "@/db/clients";
import { clients, consents } from "@/db/schema";
import { fieldErrors, readForm, type FormState } from "@/lib/forms";
import { normalizePhone } from "@/lib/whatsapp";

const HEALTH_CONSENT_VERSION = LEGAL.healthConsentVersion;

const optionalText = z
  .string()
  .trim()
  .transform((v) => v || null);

const clientSchema = z.object({
  fullName: z.string().trim().min(2, "Ad soyad en az 2 karakter olmalı.").max(120),
  phone: optionalText.refine((v) => v === null || normalizePhone(v) !== null, "Telefon numarasını kontrol et."),
  email: optionalText.pipe(z.email("E-posta adresini kontrol et.").nullable()),
  goals: optionalText,
  notes: optionalText,
  healthNotes: optionalText,
  healthConsent: z.literal("on").optional(),
});

const CONSENT_MESSAGE = "Sağlık bilgisi kaydetmek için danışanın açık rızası gerekli.";

const FIELDS = ["fullName", "phone", "email", "goals", "notes", "healthNotes", "healthConsent"] as const;

export type ClientFormState = FormState<(typeof FIELDS)[number] | "form">;

const hasHealthConsent = async (tx: Tx, clientId: string) =>
  (
    await tx
      .select({ id: consents.id })
      .from(consents)
      .where(and(eq(consents.clientId, clientId), eq(consents.kind, "health_data"), isNull(consents.revokedAt)))
      .limit(1)
  ).length > 0;

function parseClient(formData: FormData) {
  const raw = readForm(formData, FIELDS);
  const parsed = clientSchema.safeParse({ ...raw, healthConsent: raw.healthConsent || undefined });
  return { raw, parsed };
}

export async function createClientAction(_prev: ClientFormState, formData: FormData): Promise<ClientFormState> {
  const { raw, parsed } = parseClient(formData);
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values: raw };
  if (parsed.data.healthNotes && !parsed.data.healthConsent) return { errors: { healthConsent: CONSENT_MESSAGE }, values: raw };

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

export async function updateClientAction(clientId: string, _prev: ClientFormState, formData: FormData): Promise<ClientFormState> {
  const { raw, parsed } = parseClient(formData);
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values: raw };

  const { healthConsent, phone, ...data } = parsed.data;
  const result = await withTrainer(async (tx, trainerId) => {
    // Consent given earlier (in this form or at sign-up) still covers edits.
    const consented = await hasHealthConsent(tx, clientId);
    if (data.healthNotes && !consented && !healthConsent) return "consent" as const;
    const [row] = await tx
      .update(clients)
      .set({ ...data, phone: phone && normalizePhone(phone) })
      .where(and(eq(clients.id, clientId), eq(clients.trainerId, trainerId)))
      .returning({ id: clients.id });
    if (!row) return "missing" as const;
    if (data.healthNotes && !consented && healthConsent) {
      await tx.insert(consents).values({ trainerId, clientId, kind: "health_data", textVersion: HEALTH_CONSENT_VERSION });
    }
    return "ok" as const;
  });
  if (result === "consent") return { errors: { healthConsent: CONSENT_MESSAGE }, values: raw };
  if (result === "missing") return { errors: { form: "Danışan bulunamadı." }, values: raw };

  revalidatePath(`/danisanlar/${clientId}`);
  redirect(`/danisanlar/${clientId}`);
}

export async function archiveClientAction(clientId: string) {
  await requireOwner();
  await withTrainer((tx, trainerId) => archiveClient(tx, trainerId, clientId));
  revalidatePath("/", "layout");
  redirect(`/danisanlar/${clientId}`);
}

export async function restoreClientAction(clientId: string) {
  await requireOwner();
  await withTrainer((tx, trainerId) => restoreClient(tx, trainerId, clientId));
  revalidatePath("/", "layout");
  redirect(`/danisanlar/${clientId}`);
}

export async function deleteClientAction(clientId: string) {
  await requireOwner();
  await withTrainer((tx, trainerId) => deleteClient(tx, trainerId, clientId));
  revalidatePath("/", "layout");
  redirect("/danisanlar/arsiv");
}
