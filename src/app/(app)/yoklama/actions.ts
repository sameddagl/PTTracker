"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { withTrainer } from "@/db";
import { setAttendance } from "@/db/lessons";
import { mayManageAttendee } from "@/db/team";

/** "Hepsi geldi": marks every attendee still waiting for attendance as attended. */
export async function markAllAttendedAction(attendeeIds: string[]): Promise<{ ok: true; marked: number } | { ok: false; error: string }> {
  const parsed = z.array(z.uuid()).min(1).max(50).safeParse(attendeeIds);
  if (!parsed.success) return { ok: false, error: "Bir sorun oldu. Sayfayı yenileyip tekrar dene." };
  const marked = await withTrainer(async (tx, trainerId, member) => {
    let n = 0;
    // Sequential on purpose: a transaction runs on one connection.
    for (const id of parsed.data) if ((await mayManageAttendee(tx, member, id)) && (await setAttendance(tx, trainerId, id, "attended"))) n++;
    return n;
  });
  for (const path of ["/yoklama", "/bugun", "/takvim"]) revalidatePath(path);
  revalidatePath("/ders", "layout");
  revalidatePath("/danisanlar", "layout");
  return { ok: true, marked };
}
