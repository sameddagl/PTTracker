import "server-only";
import { and, desc, eq, gte, isNull, or, sql } from "drizzle-orm";
import type { Tx } from "@/db";
import { saveIntakeAnswers, toDef, type IntakeField } from "@/db/intake";
import { createPortalLink, getActivePortalLink } from "@/db/portal";
import { applications, clients, consents, packageTemplates } from "@/db/schema";
import { LEGAL } from "./legal";
import { answerName, parseAnswer, type IntakeValue } from "./intake";
import { paymentOptions, type PricedTemplate } from "./pricing";
import { normalizePhone } from "./whatsapp";

// Sign-up validation and storage, free of Next.js and the connection pool so
// it runs under the test harness too. Entry point: ./signup.ts.

// Bump when the texts shown next to the consent checkboxes change.
export const KVKK_NOTICE_VERSION = LEGAL.noticeVersion;
export const HEALTH_CONSENT_VERSION = LEGAL.healthConsentVersion;

export type SignupErrors = Record<string, string>;
export type SignupResult = { ok: true; token: string; email: string | null } | { ok: false; errors: SignupErrors };

type SignupForm = { trainerId: string; packages: (PricedTemplate & { id: string })[]; fields: IntakeField[] };

export type SignupData = {
  fullName: string;
  phone: string;
  email: string | null;
  templateId: string;
  /** Payment option picked: 1 = cash, otherwise the package's installment plan. */
  installments: number;
  message: string | null;
  healthConsent: boolean;
  answers: { field: IntakeField; value: IntakeValue }[];
};

/** Validates a submitted sign-up form against the trainer's packages and questions. */
export function validateSignup(form: SignupForm, formData: FormData): { data: SignupData } | { errors: SignupErrors } {
  const get = (k: string) => formData.get(k)?.toString().trim() ?? "";
  const errors: SignupErrors = {};

  // Bots fill every field; people never see this one.
  if (get("website")) return { errors: { form: "Başvuru gönderilemedi." } };

  const firstName = get("firstName");
  const lastName = get("lastName");
  if (firstName.length < 2) errors.firstName = "Adını yaz.";
  else if (firstName.length > 60) errors.firstName = "En fazla 60 karakter.";
  if (lastName.length < 2) errors.lastName = "Soyadını yaz.";
  else if (lastName.length > 60) errors.lastName = "En fazla 60 karakter.";

  const phone = normalizePhone(get("phone"));
  if (!phone) errors.phone = "Geçerli bir telefon numarası gir.";

  const email = get("email").toLowerCase() || null;
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) errors.email = "E-posta adresini kontrol et.";

  const templateId = get("templateId");
  const pkg = form.packages.find((p) => p.id === templateId);
  if (!pkg) errors.templateId = "Bir paket seç.";
  // Unpriced packages have no options; the trainer sets the price on approval.
  const options = pkg ? paymentOptions(pkg) : [];
  const installments = Number(get("installments") || options[0]?.installments || 1);
  if (pkg && options.length > 0 && !options.some((o) => o.installments === installments)) errors.installments = "Ödeme şeklini seç.";

  const message = get("message").slice(0, 1000) || null;
  if (formData.get("kvkk") !== "on") errors.kvkk = "Devam etmek için Aydınlatma Metni'ni okuduğunu onayla.";
  const healthConsent = formData.get("healthConsent") === "on";

  const answers: SignupData["answers"] = [];
  for (const field of form.fields) {
    // Without explicit consent, health questions are neither stored nor required.
    if (field.isHealth && !healthConsent) continue;
    const parsed = parseAnswer(toDef(field), formData.getAll(answerName(field.id)).map(String));
    if ("error" in parsed) errors[answerName(field.id)] = parsed.error;
    else if (parsed.value) answers.push({ field, value: parsed.value });
    else if (field.required) errors[answerName(field.id)] = "Bu alan zorunlu.";
  }
  if (Object.keys(errors).length > 0) return { errors };
  return {
    data: { fullName: `${firstName} ${lastName}`, phone: phone!, email, templateId, installments, message, healthConsent, answers },
  };
}

/**
 * Stores a validated sign-up: finds or creates the client (by phone), opens
 * an application, saves answers and consents, and returns their portal link.
 * Rate-limited per phone and per trainer.
 */
export async function recordSignup(
  tx: Tx,
  trainerId: string,
  d: SignupData,
): Promise<{ limited: true; trialUsed?: boolean } | { limited: false; token: string }> {
  const [{ recentFromPhone, recentTotal }] = await tx
    .select({
      recentFromPhone: sql<number>`count(*) filter (where ${clients.phone} = ${d.phone})::int`,
      recentTotal: sql<number>`count(*) filter (where ${applications.createdAt} > now() - interval '1 hour')::int`,
    })
    .from(applications)
    .innerJoin(clients, eq(clients.id, applications.clientId))
    .where(and(eq(applications.trainerId, trainerId), gte(applications.createdAt, sql`now() - interval '24 hours'`)));
  if (recentFromPhone >= 3 || recentTotal >= 30) return { limited: true };

  // Same phone → same person: reuse their record (and their portal link).
  // An applicant archived after a rejection is brought back rather than duplicated.
  const [existing] = await tx
    .select({ id: clients.id, email: clients.email, archivedAt: clients.archivedAt })
    .from(clients)
    .where(
      and(
        eq(clients.trainerId, trainerId),
        eq(clients.phone, d.phone),
        or(isNull(clients.archivedAt), eq(clients.status, "applicant")),
      ),
    )
    .orderBy(sql`${clients.archivedAt} is not null`, desc(clients.createdAt))
    .limit(1);

  // A trial lesson is once per person (same phone): not for anyone who already has a package or applied before.
  const [tpl] = await tx.select({ isTrial: packageTemplates.isTrial }).from(packageTemplates).where(eq(packageTemplates.id, d.templateId));
  if (tpl?.isTrial && existing) {
    const [history] = await tx
      .select({ n: sql<number>`(
        (select count(*) from client_packages cp where cp.client_id = ${existing.id})
        + (select count(*) from applications a where a.client_id = ${existing.id}
             and (a.status = 'approved' or (a.status = 'pending' and a.template_id <> ${d.templateId})))
      )::int` })
      .from(clients)
      .where(eq(clients.id, existing.id));
    if ((history?.n ?? 0) > 0) return { limited: true, trialUsed: true };
  }

  let clientId: string;
  if (existing) {
    clientId = existing.id;
    const patch = {
      ...(d.email && !existing.email ? { email: d.email } : {}),
      ...(existing.archivedAt ? { archivedAt: null } : {}),
    };
    if (Object.keys(patch).length > 0) await tx.update(clients).set(patch).where(eq(clients.id, clientId));
  } else {
    const [created] = await tx
      .insert(clients)
      .values({ trainerId, fullName: d.fullName, phone: d.phone, email: d.email, status: "applicant", source: "public_page" })
      .returning({ id: clients.id });
    clientId = created.id;
  }

  const [pending] = await tx
    .select({ id: applications.id })
    .from(applications)
    .where(and(eq(applications.clientId, clientId), eq(applications.templateId, d.templateId), eq(applications.status, "pending")))
    .limit(1);

  // A double submit for the same package doesn't open a second application.
  if (!pending) {
    const [app] = await tx
      .insert(applications)
      .values({ trainerId, clientId, templateId: d.templateId, installments: d.installments, message: d.message })
      .returning({ id: applications.id });
    await saveIntakeAnswers(tx, { trainerId, clientId, applicationId: app.id, answers: d.answers });
    await tx.insert(consents).values([
      { trainerId, clientId, kind: "kvkk_notice" as const, textVersion: KVKK_NOTICE_VERSION },
      ...(d.healthConsent ? [{ trainerId, clientId, kind: "health_data" as const, textVersion: HEALTH_CONSENT_VERSION }] : []),
    ]);
  }

  const link = (await getActivePortalLink(tx, clientId)) ?? (await createPortalLink(tx, trainerId, clientId));
  return { limited: false, token: link.token };
}
