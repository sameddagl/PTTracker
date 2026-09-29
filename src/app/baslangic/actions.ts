"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import { withTrainer } from "@/db";
import { trainers } from "@/db/schema";
import { fieldErrors, readForm, type FormState } from "@/lib/forms";

const profileSchema = z.object({
  fullName: z.string().trim().min(2, "Adını yaz (en az 2 karakter).").max(120),
  businessName: z
    .string()
    .trim()
    .max(120)
    .transform((v) => v || null),
  discipline: z.enum(["pt", "pilates", "both"], { error: "Bir branş seç." }),
});

const FIELDS = ["fullName", "businessName", "discipline"] as const;

export type ProfileFormState = FormState<(typeof FIELDS)[number]>;

export async function saveProfile(_prev: ProfileFormState, formData: FormData): Promise<ProfileFormState> {
  const raw = readForm(formData, FIELDS);
  const parsed = profileSchema.safeParse(raw);
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values: raw };

  await withTrainer((tx, trainerId) =>
    tx
      .update(trainers)
      .set({ ...parsed.data, onboardedAt: new Date() })
      .where(eq(trainers.id, trainerId)),
  );
  redirect("/bugun");
}
