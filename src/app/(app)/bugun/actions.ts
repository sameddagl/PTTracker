"use server";

import { inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { withTrainer } from "@/db";
import { setBioLinkAdded, setGuideDismissed } from "@/db/guide";
import { MANUAL_REMINDER_GAP_HOURS, tomorrowAttendees } from "@/db/engagement";
import { setAttendance, type AttendanceResult } from "@/db/lessons";
import { getTrainer } from "@/db/queries";
import { lessonAttendees } from "@/db/schema";
import { mayManageAttendee } from "@/db/team";
import { sendLessonReminder } from "@/lib/reminder";

const input = z.object({
  attendeeId: z.uuid(),
  status: z.enum(["scheduled", "attended", "no_show", "late_cancel", "cancelled"]),
});

export async function markAttendanceAction(attendeeId: string, status: string): Promise<AttendanceResult | { error: string }> {
  const parsed = input.safeParse({ attendeeId, status });
  if (!parsed.success) return { error: "Bir sorun oldu. Sayfayı yenileyip tekrar dene." };

  const result = await withTrainer(async (tx, trainerId, member) =>
    (await mayManageAttendee(tx, member, parsed.data.attendeeId)) ? setAttendance(tx, trainerId, parsed.data.attendeeId, parsed.data.status) : null,
  );
  if (!result) return { error: "Kayıt bulunamadı." };

  revalidatePath("/bugun");
  revalidatePath("/takvim");
  revalidatePath("/ders", "layout");
  revalidatePath("/danisanlar", "layout");
  return result;
}

/** Hides (or brings back) the getting-started checklist on Bugün. */
export async function setGuideDismissedAction(dismissed: boolean): Promise<{ ok: true }> {
  await withTrainer((tx, trainerId) => setGuideDismissed(tx, trainerId, dismissed === true));
  revalidatePath("/bugun");
  revalidatePath("/yardim");
  return { ok: true };
}

/** The trainer confirms the public page link is in their Instagram bio. */
export async function setBioLinkAddedAction(added: boolean): Promise<{ ok: true }> {
  await withTrainer((tx, trainerId) => setBioLinkAdded(tx, trainerId, added === true));
  revalidatePath("/bugun");
  return { ok: true };
}

export type RemindResult = { ok: true; sent: number; unreachable: number } | { ok: false; error: string };

/**
 * "Hatırlat" on Yarın gelecekler: the reminder again, now, to everyone booked
 * tomorrow who hasn't answered. Same text and channel as the automatic one.
 */
export async function remindUnconfirmedAction(): Promise<RemindResult> {
  const due = await withTrainer(async (tx, trainerId, member) => {
    const trainer = await getTrainer(tx, trainerId);
    const cutoff = Date.now() - MANUAL_REMINDER_GAP_HOURS * 3_600_000;
    // An instructor reminds the clients of their own lessons.
    const list = (await tomorrowAttendees(tx, trainer, member.role === "owner" ? null : member.id)).filter((t) => !t.confirmed && (!t.remindedAt || t.remindedAt.getTime() < cutoff));
    if (list.length > 0) {
      await tx
        .update(lessonAttendees)
        .set({ reminderSentAt: new Date() })
        .where(inArray(lessonAttendees.id, list.map((t) => t.attendeeId)));
    }
    return { trainer, list };
  });
  if (due.list.length === 0) return { ok: false, error: "Yanıt bekleyen herkese son bir saat içinde hatırlatma gitti." };

  const { trainer, list } = due;
  let sent = 0;
  for (const t of list) {
    const res = await sendLessonReminder({
      attendeeId: t.attendeeId,
      trainerId: trainer.id,
      clientId: t.clientId,
      clientName: t.name,
      trainerName: trainer.businessName || trainer.fullName,
      timezone: trainer.timezone,
      startsAt: t.startsAt,
      title: t.title,
      sessionType: t.sessionType,
      templates: trainer.messageTemplates,
    });
    if (res.push > 0) sent++;
  }
  revalidatePath("/bugun");
  return { ok: true, sent, unreachable: list.length - sent };
}
