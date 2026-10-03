"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import { withTrainer } from "@/db";
import { trainers } from "@/db/schema";
import { fieldErrors, readForm, type FormState } from "@/lib/forms";

const profileSchema = z.object({
  fullName: z.string().trim().min(2, "Adını yaz (en az 2 karakter).").max(120),
  businessName: z.string().trim().min(2, "Stüdyonun ya da işletmenin adını yaz (en az 2 karakter).").max(120),
  discipline: z.enum(["pt", "pilates", "both"], { error: "Bir branş seç." }),
});

const FIELDS = ["fullName", "businessName", "discipline"] as const;

export type ProfileFormState = FormState<(typeof FIELDS)[number]> & { values?: Record<string, string> };

export async function saveProfile(_prev: ProfileFormState, formData: FormData): Promise<ProfileFormState> {
  const raw = readForm(formData, FIELDS);
  const team = formData.get("team") === "studio" ? "studio" : "solo";
  const parsed = profileSchema.safeParse(raw);
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values: { ...raw, team } };

  await withTrainer((tx, trainerId) =>
    tx
      .update(trainers)
      .set({ ...parsed.data, onboardedAt: new Date() })
      .where(eq(trainers.id, trainerId)),
  );
  // A studio goes straight on to inviting its instructors.
  redirect(team === "studio" ? "/ayarlar/ekip?ilk=1" : "/bugun");
}
