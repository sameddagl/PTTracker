import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/config";

// The landing, trainers' public pages and the privacy notice are for search;
// the trainer app, client portals and sign-up forms are not.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/bugun", "/danisanlar", "/takvim", "/odemeler", "/paketler", "/ayarlar", "/ders", "/baslangic", "/yardim", "/giris", "/auth", "/p/", "/*/kayit"],
    },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
