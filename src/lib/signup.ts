import "server-only";
import { and, asc, eq } from "drizzle-orm";
import { adminDb } from "@/db";
import { intakeFields } from "@/db/schema";
import { getPublicPage } from "./public-page";
import { recordSignup, validateSignup, type SignupResult } from "./signup-core";

export type { SignupErrors, SignupResult } from "./signup-core";

export async function getSignupForm(slug: string) {
  const page = await getPublicPage(slug);
  if (!page) return null;
  const fields = await adminDb
    .select()
    .from(intakeFields)
    .where(and(eq(intakeFields.trainerId, page.trainer.id), eq(intakeFields.isActive, true)))
    .orderBy(asc(intakeFields.sortOrder), asc(intakeFields.createdAt));
  return { ...page, fields };
}

/** Public sign-up entry point (signed-out; adminDb, scoped by the slug's trainer). */
export async function submitSignup(slug: string, formData: FormData): Promise<SignupResult> {
  const form = await getSignupForm(slug);
  if (!form) return { ok: false, errors: { form: "Bu sayfa artık yayında değil." } };

  const v = validateSignup({ trainerId: form.trainer.id, packages: form.packages, fields: form.fields }, formData);
  if ("errors" in v) return { ok: false, errors: v.errors };

  const result = await adminDb.transaction((tx) => recordSignup(tx, form.trainer.id, v.data));
  if (result.limited) return { ok: false, errors: { form: "Çok fazla başvuru yapıldı. Lütfen daha sonra tekrar dene." } };
  return { ok: true, token: result.token, email: v.data.email };
}
