import type { MetadataRoute } from "next";
import { APP_DESCRIPTION, APP_NAME } from "@/lib/config";

// Served by route handlers, not the manifest.ts file convention: file-based
// metadata would override the per-client manifest on portal pages.

export function webManifest(over: Partial<MetadataRoute.Manifest> = {}): MetadataRoute.Manifest {
  return {
    name: APP_NAME,
    short_name: APP_NAME,
    description: APP_DESCRIPTION,
    lang: "tr",
    start_url: "/bugun",
    scope: "/",
    display: "standalone",
    background_color: "#f5f5f7",
    theme_color: "#1d1d1f",
    icons: [
      { src: "/pwa-icon/192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/pwa-icon/512", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/pwa-icon/512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    ...over,
  };
}

export const manifestResponse = (m: MetadataRoute.Manifest, cache = "public, max-age=86400") =>
  Response.json(m, { headers: { "Content-Type": "application/manifest+json", "Cache-Control": cache } });
