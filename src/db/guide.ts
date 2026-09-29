import "server-only";
import { and, count, eq, isNull } from "drizzle-orm";
import type { GuideFacts } from "@/lib/guide";
import type { Tx } from "./index";
import { availabilityRules, clients, intakeFields, lessons, packageTemplates, trainers } from "./schema";

type GuideTrainer = Pick<
  typeof trainers.$inferSelect,
  "id" | "slug" | "publicPageEnabled" | "bookingEnabled" | "bioLinkAddedAt"
>;

/** Counts behind the getting-started checklist. Sequential: one connection per transaction. */
export async function getGuideFacts(tx: Tx, trainer: GuideTrainer): Promise<GuideFacts> {
  const id = trainer.id;
  const n = async (q: Promise<{ n: number }[]>) => (await q)[0]?.n ?? 0;

  const templates = await n(tx.select({ n: count() }).from(packageTemplates).where(eq(packageTemplates.trainerId, id)));
  const rules = await n(tx.select({ n: count() }).from(availabilityRules).where(eq(availabilityRules.trainerId, id)));
  const fields = await n(tx.select({ n: count() }).from(intakeFields).where(eq(intakeFields.trainerId, id)));
  const activeClients = await n(
    tx
      .select({ n: count() })
      .from(clients)
      .where(and(eq(clients.trainerId, id), eq(clients.status, "active"), isNull(clients.archivedAt))),
  );
  const lessonCount = await n(
    tx
      .select({ n: count() })
      .from(lessons)
      .where(and(eq(lessons.trainerId, id), eq(lessons.status, "scheduled"))),
  );

  return {
    pagePublished: trainer.publicPageEnabled && !!trainer.slug,
    bookingEnabled: trainer.bookingEnabled,
    templates,
    availabilityRules: rules,
    intakeFields: fields,
    activeClients,
    lessons: lessonCount,
    bioLinkAdded: trainer.bioLinkAddedAt !== null,
  };
}

export async function setGuideDismissed(tx: Tx, trainerId: string, dismissed: boolean) {
  await tx
    .update(trainers)
    .set({ guideDismissedAt: dismissed ? new Date() : null })
    .where(eq(trainers.id, trainerId));
}

export async function setBioLinkAdded(tx: Tx, trainerId: string, added: boolean) {
  await tx
    .update(trainers)
    .set({ bioLinkAddedAt: added ? new Date() : null })
    .where(eq(trainers.id, trainerId));
}
