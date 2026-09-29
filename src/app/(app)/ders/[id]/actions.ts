"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { withTrainer } from "@/db";
import { cancelLessons, findConflicts, rescheduleLesson, restoreLesson } from "@/db/lessons";
import { getTrainer } from "@/db/queries";
import { dayShort } from "@/lib/dates";
import { formatTime } from "@/lib/format";
import { fieldErrors, readForm, type FormState } from "@/lib/forms";

function revalidateLessonViews(lessonId: string) {
  revalidatePath("/bugun");
  revalidatePath("/takvim");
  revalidatePath(`/ders/${lessonId}`);
  revalidatePath("/danisanlar", "layout");
}

const FIELDS = ["lessonId", "date", "time", "durationMinutes"] as const;
export type RescheduleState = FormState<(typeof FIELDS)[number]> & { conflicts?: string[] };

const rescheduleSchema = z.object({
  lessonId: z.uuid(),
  date: z.iso.date({ error: "Tarih seç." }),
  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, { error: "Saat seç." }),
  durationMinutes: z.coerce.number().int().min(10).max(240),
});

export async function rescheduleAction(_prev: RescheduleState, formData: FormData): Promise<RescheduleState> {
  const parsed = rescheduleSchema.safeParse(readForm(formData, FIELDS));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  const { lessonId, ...slot } = parsed.data;
  const force = formData.get("intent") === "force";

  const result = await withTrainer(async (tx, trainerId) => {
    const trainer = await getTrainer(tx, trainerId);
    if (!force) {
      const conflicts = await findConflicts(tx, trainer, { dates: [slot.date], ...slot, excludeLessonId: lessonId });
      if (conflicts.length > 0) {
        return {
          conflicts: conflicts.map(
            (c) =>
              `${dayShort(c.date)} ${formatTime(c.startsAt, trainer.timezone)}–${formatTime(c.endsAt, trainer.timezone)}${c.names ? ` · ${c.names}` : ""}`,
          ),
        };
      }
    }
    const ok = await rescheduleLesson(tx, trainer, lessonId, slot);
    return ok ? { savedAt: Date.now() } : { errors: { lessonId: "Ders bulunamadı." } };
  });

  if ("savedAt" in result) revalidateLessonViews(lessonId);
  return result;
}

export async function cancelLessonAction(formData: FormData) {
  const lessonId = z.uuid().parse(formData.get("lessonId"));
  const following = formData.get("following") === "true";
  await withTrainer((tx, trainerId) => cancelLessons(tx, trainerId, lessonId, { following }));
  revalidateLessonViews(lessonId);
}

export async function restoreLessonAction(formData: FormData) {
  const lessonId = z.uuid().parse(formData.get("lessonId"));
  await withTrainer((tx, trainerId) => restoreLesson(tx, trainerId, lessonId));
  revalidateLessonViews(lessonId);
}
