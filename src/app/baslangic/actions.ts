"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import { withTrainer } from "@/db";
import { trainers } from "@/db/schema";

const profileSchema = z.object({
  fullName: z.string().trim().min(2, "Adını yaz (en az 2 karakter).").max(120),
  businessName: z
    .string()
    .trim()
    .max(120)
    .transform((v) => v || null),
  discipline: z.enum(["pt", "pilates", "both"], { error: "Bir branş seç." }),
});

export type ProfileFormState = {
  errors?: Partial<Record<keyof z.input<typeof profileSchema>, string>>;
  values?: Record<string, string>;
};

export async function saveProfile(_prev: ProfileFormState, formData: FormData): Promise<ProfileFormState> {
  const raw = {
    fullName: formData.get("fullName")?.toString() ?? "",
    businessName: formData.get("businessName")?.toString() ?? "",
    discipline: formData.get("discipline")?.toString() ?? "",
  };
  const parsed = profileSchema.safeParse(raw);
  if (!parsed.success) {
    const errors: ProfileFormState["errors"] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof NonNullable<ProfileFormState["errors"]>;
      errors[key] ??= issue.message;
    }
    return { errors, values: raw };
  }

  await withTrainer((tx, trainerId) =>
    tx
      .update(trainers)
      .set({ ...parsed.data, onboardedAt: new Date() })
      .where(eq(trainers.id, trainerId)),
  );
  redirect("/bugun");
}
