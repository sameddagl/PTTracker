import type { MetadataRoute } from "next";
import { and, eq, isNotNull } from "drizzle-orm";
import { adminDb } from "@/db";
import { trainers } from "@/db/schema";
import { siteUrl } from "@/lib/config";
import { LEGAL } from "@/lib/legal";

/** Bump when the landing copy changes meaningfully, so search engines re-read it. */
const LANDING_UPDATED = "2026-10-01";

// Rebuilt at most hourly: new public pages show up without a deploy.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const pages = await adminDb
    .select({ slug: trainers.slug, updatedAt: trainers.updatedAt })
    .from(trainers)
    .where(and(eq(trainers.publicPageEnabled, true), isNotNull(trainers.slug)));
  return [
    { url: base, lastModified: LANDING_UPDATED, changeFrequency: "weekly", priority: 1 },
    ...["/ozellikler", "/pilates-egitmenleri", "/personal-trainer", "/fiyatlar"].map((path) => ({
      url: `${base}${path}`,
      lastModified: LANDING_UPDATED,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    ...["/kvkk", "/acik-riza", "/kosullar"].map((path) => ({
      url: `${base}${path}`,
      lastModified: LEGAL.updatedIso,
      changeFrequency: "yearly" as const,
      priority: 0.2,
    })),
    ...pages.map((p) => ({ url: `${base}/${p.slug}`, lastModified: p.updatedAt, changeFrequency: "weekly" as const, priority: 0.6 })),
  ];
}
