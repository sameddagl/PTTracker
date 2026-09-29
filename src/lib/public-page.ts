import "server-only";
import { and, asc, eq } from "drizzle-orm";
import { cache } from "react";
import { adminDb } from "@/db";
import { packageTemplates, trainers } from "@/db/schema";
import { SLUG_PATTERN } from "./slug";

/**
 * A trainer's public page by slug, or null if it doesn't exist or isn't
 * published. Signed-out path, so it uses adminDb and selects only the fields
 * meant to be public.
 */
export const getPublicPage = cache(async (slug: string) => {
  if (!SLUG_PATTERN.test(slug)) return null;

  const [trainer] = await adminDb
    .select({
      id: trainers.id,
      slug: trainers.slug,
      fullName: trainers.fullName,
      businessName: trainers.businessName,
      headline: trainers.headline,
      bio: trainers.bio,
      city: trainers.city,
      instagram: trainers.instagram,
      phone: trainers.phone,
      specialties: trainers.specialties,
      avatarPath: trainers.avatarPath,
      coverPath: trainers.coverPath,
    })
    .from(trainers)
    .where(and(eq(trainers.slug, slug), eq(trainers.publicPageEnabled, true)));
  if (!trainer) return null;

  const packages = await adminDb
    .select({
      id: packageTemplates.id,
      name: packageTemplates.name,
      sessionType: packageTemplates.sessionType,
      sessionCount: packageTemplates.sessionCount,
      validityDays: packageTemplates.validityDays,
      price: packageTemplates.price,
      description: packageTemplates.description,
      features: packageTemplates.features,
      installments: packageTemplates.installments,
    })
    .from(packageTemplates)
    .where(
      and(
        eq(packageTemplates.trainerId, trainer.id),
        eq(packageTemplates.isActive, true),
        eq(packageTemplates.isPublic, true),
      ),
    )
    .orderBy(asc(packageTemplates.sortOrder), asc(packageTemplates.price));

  return { trainer, packages };
});

export type PublicPage = NonNullable<Awaited<ReturnType<typeof getPublicPage>>>;
