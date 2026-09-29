"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { withTrainer } from "@/db";
import { createLesson } from "@/db/lessons";
import { getTrainer } from "@/db/queries";
import { fieldErrors, type FormState } from "@/lib/forms";
import { safeNext } from "@/lib/config";

export type LessonField = "clientIds" | "date" | "time" | "durationMinutes" | "sessionType" | "status" | "note";

const lessonSchema = z.object({
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
});

export async function createLessonAction(
  _prev: FormState<LessonField>,
  formData: FormData,
): Promise<FormState<LessonField>> {
  const raw = {
    clientIds: formData.getAll("clientIds").map(String),
    date: formData.get("date")?.toString() ?? "",
    time: formData.get("time")?.toString() ?? "",
    durationMinutes: formData.get("durationMinutes")?.toString() ?? "",
    sessionType: formData.get("sessionType")?.toString() ?? "",
    status: formData.get("status")?.toString() ?? "",
    note: formData.get("note")?.toString() ?? "",
  };
  const parsed = lessonSchema.safeParse(raw);
  if (!parsed.success) {
    const { clientIds, ...rest } = raw;
    return { errors: fieldErrors(parsed.error), values: { ...rest, clientIds: clientIds.join(",") } };
  }

  await withTrainer(async (tx, trainerId) => {
    const trainer = await getTrainer(tx, trainerId);
    await createLesson(tx, trainer, parsed.data);
  });

  revalidatePath("/bugun");
  for (const id of parsed.data.clientIds) revalidatePath(`/danisanlar/${id}`);
  redirect(safeNext(formData.get("next")?.toString()));
}
