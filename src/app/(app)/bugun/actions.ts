"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { withTrainer } from "@/db";
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
  revalidatePath("/danisanlar", "layout");
  return result;
}
