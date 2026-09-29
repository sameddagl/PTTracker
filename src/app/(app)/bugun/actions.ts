"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { withTrainer } from "@/db";
import { setBioLinkAdded, setGuideDismissed } from "@/db/guide";
import { setAttendance, type AttendanceResult } from "@/db/lessons";

const input = z.object({
  attendeeId: z.uuid(),
  status: z.enum(["scheduled", "attended", "no_show", "late_cancel", "cancelled"]),
});

export async function markAttendanceAction(attendeeId: string, status: string): Promise<AttendanceResult | { error: string }> {
  const parsed = input.safeParse({ attendeeId, status });
  if (!parsed.success) return { error: "Geçersiz istek." };

  const result = await withTrainer((tx, trainerId) =>
    setAttendance(tx, trainerId, parsed.data.attendeeId, parsed.data.status),
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
