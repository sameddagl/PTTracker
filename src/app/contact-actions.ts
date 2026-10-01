"use server";

import { after } from "next/server";
import { z } from "zod";
import { adminDb, type Tx } from "@/db";
import { createLandingThread, SUPPORT_MAX_LENGTH } from "@/db/support";
import { LEGAL } from "@/lib/legal";
import { mailTeamAboutContact } from "@/lib/support-mail";
import { normalizePhone } from "@/lib/whatsapp";

export type ContactState = { ok?: boolean; error?: string; errors?: Partial<Record<"name" | "email" | "phone" | "message", string>> };

const schema = z.object({
  name: z.string().trim().min(2, "Adınızı yazın.").max(120),
  email: z.string().trim().toLowerCase().email("Geçerli bir e-posta adresi yazın.").max(200),
  phone: z
    .string()
    .trim()
    .max(30)
    .transform((v) => v || null)
    .refine((v) => v === null || normalizePhone(v) !== null, "Telefon numarasını kontrol edin."),
  message: z.string().trim().min(10, "Mesajınız en az 10 karakter olsun.").max(SUPPORT_MAX_LENGTH, "Mesaj çok uzun."),
});

/** The landing's contact form. A filled honeypot ("website") is a bot: thanked and dropped. */
export async function sendContactAction(_prev: ContactState, formData: FormData): Promise<ContactState> {
  if (formData.get("website")) return { ok: true };
  const parsed = schema.safeParse({
    name: formData.get("name") ?? "",
    email: formData.get("email") ?? "",
    phone: formData.get("phone") ?? "",
    message: formData.get("message") ?? "",
  });
  if (!parsed.success) {
    const errors: ContactState["errors"] = {};
    for (const i of parsed.error.issues) errors[i.path[0] as keyof NonNullable<ContactState["errors"]>] ??= i.message;
    return { errors };
  }
  const { name, email, phone, message } = parsed.data;
  const res = await adminDb.transaction((tx) =>
    createLandingThread(tx as unknown as Tx, { name, email, phone: phone && normalizePhone(phone), body: message }),
  );
  if (!res.ok) return { error: `Bugün birkaç mesaj gönderdiniz. Acil bir durumsa ${LEGAL.email} adresine yazın.` };
  after(() => mailTeamAboutContact({ threadId: res.id, from: name, contact: [email, phone].filter(Boolean).join(" · "), body: message }));
  return { ok: true };
}
