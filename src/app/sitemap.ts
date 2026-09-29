import type { MetadataRoute } from "next";
import { and, eq, isNotNull } from "drizzle-orm";
import { adminDb } from "@/db";
import { trainers } from "@/db/schema";
import { siteUrl } from "@/lib/config";

// Rebuilt at most hourly: new public pages show up without a deploy.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const pages = await adminDb
    .select({ slug: trainers.slug, updatedAt: trainers.updatedAt })
    .from(trainers)
    .where(and(eq(trainers.publicPageEnabled, true), isNotNull(trainers.slug)));
  return [
    { url: base, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/kvkk`, changeFrequency: "yearly", priority: 0.2 },
    ...pages.map((p) => ({ url: `${base}/${p.slug}`, lastModified: p.updatedAt, changeFrequency: "weekly" as const, priority: 0.6 })),
  ];
}
