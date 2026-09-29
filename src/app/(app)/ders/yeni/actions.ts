"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { withTrainer } from "@/db";
import { createLessons, findConflicts, lessonDates } from "@/db/lessons";
import { getTrainer } from "@/db/queries";
import { safeNext } from "@/lib/config";
import { dayShort } from "@/lib/dates";
import { formatTime } from "@/lib/format";
import { fieldErrors, type FormState } from "@/lib/forms";

export type LessonField =
  | "clientIds"
  | "date"
  | "time"
  | "durationMinutes"
  | "sessionType"
  | "status"
  | "note"
  | "weekdays"
  | "weeks";

export type LessonFormState = FormState<LessonField> & {
  /** Overlapping lessons; the form asks to confirm before saving anyway. */
  conflicts?: { date: string; label: string }[];
  /** How many lessons the submission would create (for the confirm text). */
  count?: number;
};

const lessonSchema = z
  .object({
    clientIds: z.array(z.uuid()).min(1, "En az bir danışan seç.").max(20, "Bir derse en fazla 20 danışan eklenebilir."),
    date: z.iso.date({ error: "Tarih seç." }),
    time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, { error: "Saat seç." }),
    durationMinutes: z.coerce.number().int().min(10, "Süre en az 10 dakika.").max(240, "Süre en fazla 240 dakika."),
    sessionType: z.enum(["private", "duet", "trio", "group"]),
    status: z.enum(["scheduled", "attended"]),
    note: z
      .string()
      .trim()
      .max(500)
      .transform((v) => v || null),
    repeat: z.boolean(),
    weekdays: z.array(z.coerce.number().int().min(1).max(7)),
    weeks: z.coerce.number().int().min(1).max(26, "En fazla 26 hafta."),
  })
  .refine((v) => !v.repeat || v.weekdays.length > 0, { path: ["weekdays"], message: "En az bir gün seç." })
  .refine((v) => !v.repeat || v.status === "scheduled", {
    path: ["status"],
    message: "Tekrarlayan dersler planlı olarak eklenir.",
  });

export async function createLessonAction(_prev: LessonFormState, formData: FormData): Promise<LessonFormState> {
  const raw = {
    clientIds: formData.getAll("clientIds").map(String),
    date: formData.get("date")?.toString() ?? "",
    time: formData.get("time")?.toString() ?? "",
    durationMinutes: formData.get("durationMinutes")?.toString() ?? "",
    sessionType: formData.get("sessionType")?.toString() ?? "",
    status: formData.get("status")?.toString() ?? "",
    note: formData.get("note")?.toString() ?? "",
    repeat: formData.get("repeat") === "on",
    weekdays: formData.getAll("weekdays").map(String),
    weeks: formData.get("weeks")?.toString() || "4",
  };
  const parsed = lessonSchema.safeParse(raw);
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };

  const { repeat, weekdays, weeks, ...rest } = parsed.data;
  const input = { ...rest, repeat: repeat ? { weekdays, weeks } : null };
  const force = formData.get("intent") === "force";

  const outcome = await withTrainer(async (tx, trainerId) => {
    const trainer = await getTrainer(tx, trainerId);
    const dates = lessonDates(input);
    if (dates.length === 0) return { kind: "empty" as const };

    if (!force) {
      const conflicts = await findConflicts(tx, trainer, {
        dates,
        time: input.time,
        durationMinutes: input.durationMinutes,
      });
      if (conflicts.length > 0) {
        return {
          kind: "conflicts" as const,
          count: dates.length,
          conflicts: conflicts.map((c) => ({
            date: c.date,
            label: `${dayShort(c.date)} ${formatTime(c.startsAt, trainer.timezone)}–${formatTime(c.endsAt, trainer.timezone)}${c.names ? ` · ${c.names}` : ""}`,
          })),
        };
      }
    }
    await createLessons(tx, trainer, input);
    return { kind: "created" as const };
  });

  if (outcome.kind === "empty") return { errors: { weekdays: "Seçilen günler bu aralığa denk gelmiyor." } };
  if (outcome.kind === "conflicts") return { conflicts: outcome.conflicts, count: outcome.count };

  revalidatePath("/bugun");
  revalidatePath("/takvim");
  for (const id of input.clientIds) revalidatePath(`/danisanlar/${id}`);
  redirect(safeNext(formData.get("next")?.toString()));
}
