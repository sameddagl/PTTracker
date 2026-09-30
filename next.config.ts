import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs/config";

const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname : undefined;

const nextConfig: NextConfig = {
  // The dev badge covers the mobile nav or header actions wherever it sits.
  devIndicators: false,
  // Dev only: open the app from a phone on the same Wi-Fi (http://192.168.x.x:3000).
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*", "*.local"],
  experimental: {
    // Clients attach transfer receipts (capped at 1.5 MB in the action).
    serverActions: { bodySizeLimit: "2mb" },
  },
  // Packages moved out of settings.
  redirects: async () => [
    { source: "/ayarlar/paketler", destination: "/paketler", permanent: true },
    { source: "/ayarlar/paketler/:id", destination: "/paketler/:id", permanent: true },
  ],
  images: {
    // Trainer profile photos in Supabase Storage.
    remotePatterns: supabaseHost
      ? [{ protocol: "https", hostname: supabaseHost, pathname: "/storage/v1/object/public/**" }]
      : [],
  },
};

// Uploads source maps only when SENTRY_AUTH_TOKEN is set (Hostinger env), so
// stack traces point at our own code. Events go through /monitoring on our own
// domain, which ad-blockers don't block.
export default withSentryConfig(nextConfig, {
  org: "studyom",
  project: "javascript-nextjs",
  authToken: process.env.SENTRY_AUTH_TOKEN,
  sourcemaps: { disable: !process.env.SENTRY_AUTH_TOKEN, deleteSourcemapsAfterUpload: true },
  silent: !process.env.CI,
  telemetry: false,
  tunnelRoute: "/monitoring",
});
