"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { withTrainer } from "@/db";
import { addAttendee } from "@/db/groups";
import { cancelLessons, findConflicts, rescheduleLesson, restoreLesson, setLessonInstructor } from "@/db/lessons";
import { getTrainer } from "@/db/queries";
import { getMemberRow, lessonInstructorId, mayManageLesson } from "@/db/team";
import { notifyClient } from "@/lib/notify";

const NOT_YOURS = "Bu dersi sadece dersin eğitmeni ya da stüdyonun sahibi değiştirebilir.";
import { dayLong, dayShort } from "@/lib/dates";
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

  const result = await withTrainer(async (tx, trainerId, member) => {
    if (!(await mayManageLesson(tx, member, lessonId))) return { errors: { lessonId: NOT_YOURS } };
    const trainer = await getTrainer(tx, trainerId);
    if (!force) {
      const instructorId = await lessonInstructorId(tx, trainerId, lessonId);
      const conflicts = await findConflicts(tx, trainer, { dates: [slot.date], ...slot, excludeLessonId: lessonId, instructorId });
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
  await withTrainer(async (tx, trainerId, member) => {
    if (await mayManageLesson(tx, member, lessonId)) await cancelLessons(tx, trainerId, lessonId, { following });
  });
  revalidateLessonViews(lessonId);
}

export async function restoreLessonAction(formData: FormData) {
  const lessonId = z.uuid().parse(formData.get("lessonId"));
  await withTrainer(async (tx, trainerId, member) => {
    if (await mayManageLesson(tx, member, lessonId)) await restoreLesson(tx, trainerId, lessonId);
  });
  revalidateLessonViews(lessonId);
}

export async function addAttendeeAction(lessonId: string, clientId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!z.uuid().safeParse(clientId).success) return { ok: false, error: "Danışan seç." };
  const res = await withTrainer(async (tx, trainerId, member) =>
    (await mayManageLesson(tx, member, lessonId)) ? addAttendee(tx, await getTrainer(tx, trainerId), lessonId, clientId) : ({ ok: false, reason: "not_found" } as const),
  );
  if (!res.ok) {
    return {
      ok: false,
      error: { full: "Ders dolu. Kapasiteyi grup dersinin ayarlarından artırabilirsin.", already: "Bu danışan zaten derste.", not_found: "Ders bulunamadı." }[
        res.reason
      ],
    };
  }
  revalidateLessonViews(lessonId);
  return { ok: true };
}

/**
 * Owner: someone else teaches this lesson (or the rest of the series). The
 * clients booked in it are told who's coming, with the lesson time.
 */
export async function changeInstructorAction(lessonId: string, instructorId: string, following: boolean): Promise<{ ok: true; told: number } | { ok: false; error: string }> {
  if (!z.uuid().safeParse(lessonId).success || !z.uuid().safeParse(instructorId).success) return { ok: false, error: "Eğitmen seç." };
  const out = await withTrainer(async (tx, trainerId, member) => {
    if (member.role !== "owner") return null;
    const next = await getMemberRow(tx, trainerId, instructorId);
    if (!next?.active) return null;
    const res = await setLessonInstructor(tx, trainerId, lessonId, instructorId, { following: Boolean(following) });
    if (!res) return null;
    const trainer = await getTrainer(tx, trainerId);
    return { ...res, name: next.fullName, tz: trainer.timezone, accountId: trainerId };
  });
  if (!out) return { ok: false, error: "Eğitmen değiştirilemedi." };
  let told = 0;
  const first = out.name.split(" ")[0] || out.name;
  for (const a of out.attendees) {
    const when = `${dayLong(new Intl.DateTimeFormat("en-CA", { timeZone: out.tz }).format(a.startsAt))} ${formatTime(a.startsAt, out.tz)}`;
    const sent = await notifyClient({ trainerId: out.accountId, clientId: a.clientId }, "reminder", {
      title: "Dersinin eğitmeni değişti",
      body: `${when} dersine ${first} girecek.`,
      hash: "#dersler",
      tag: `instructor-${a.clientId}`,
    });
    if (sent.push > 0) told++;
  }
  revalidateLessonViews(lessonId);
  return { ok: true, told };
}
