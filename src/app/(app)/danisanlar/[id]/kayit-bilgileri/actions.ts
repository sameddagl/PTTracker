"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq, isNull } from "drizzle-orm";
import { withTrainer } from "@/db";
import { listIntakeFields, replaceClientAnswers, toDef } from "@/db/intake";
import { clients, consents } from "@/db/schema";
import { answerName, parseAnswer, type IntakeValue } from "@/lib/intake";

// Same text as the consent checkbox on the client form.
const HEALTH_CONSENT_VERSION = "saglik-2026-09";

export type AnswersState = { errors?: Record<string, string> };

export async function saveAnswersAction(clientId: string, _prev: AnswersState, formData: FormData): Promise<AnswersState> {
  const result = await withTrainer(async (tx, trainerId) => {
    const [client] = await tx
      .select({ id: clients.id })
      .from(clients)
      .where(and(eq(clients.id, clientId), eq(clients.trainerId, trainerId)));
    if (!client) return { errors: { form: "Danışan bulunamadı." } };

    const [consent] = await tx
      .select({ id: consents.id })
      .from(consents)
      .where(and(eq(consents.clientId, clientId), eq(consents.kind, "health_data"), isNull(consents.revokedAt)))
      .limit(1);
    const consentGiven = formData.get("healthConsent") === "on";
    const healthAllowed = !!consent || consentGiven;

    const fields = await listIntakeFields(tx, trainerId, { activeOnly: true });
    const errors: Record<string, string> = {};
    const answers: { field: (typeof fields)[number]; value: IntakeValue | null }[] = [];
    for (const field of fields) {
      // Without consent health answers are neither changed nor stored.
      if (field.isHealth && !healthAllowed) continue;
      const parsed = parseAnswer(toDef(field), formData.getAll(answerName(field.id)).map(String));
      if ("error" in parsed) errors[answerName(field.id)] = parsed.error;
      else answers.push({ field, value: parsed.value });
    }
    if (Object.keys(errors).length > 0) return { errors };

    if (!consent && consentGiven && answers.some((a) => a.field.isHealth && a.value)) {
      await tx.insert(consents).values({ trainerId, clientId, kind: "health_data", textVersion: HEALTH_CONSENT_VERSION });
    }
    await replaceClientAnswers(tx, { trainerId, clientId, answers });
    return null;
  });
  if (result) return result;

  revalidatePath(`/danisanlar/${clientId}`);
  redirect(`/danisanlar/${clientId}`);
}
