import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs/config";

const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname : undefined;

// Security headers on every response. The CSP only covers what can't break
// the app (framing, <base>, form targets, plugins); a script-src policy
// would need per-request nonces and fully dynamic rendering.
const SECURITY_HEADERS = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  headers: async () => [{ source: "/:path*", headers: SECURITY_HEADERS }],
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
    // One host for search engines: www → apex, path and query kept.
    { source: "/:path*", has: [{ type: "host", value: "www.studyomapp.com" }], destination: "https://studyomapp.com/:path*", permanent: true },
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
  // No session replay in this app, so its code can go; keep tracing (5% sample).
  bundleSizeOptimizations: {
    excludeDebugStatements: true,
    excludeReplayIframe: true,
    excludeReplayShadowDom: true,
    excludeReplayWorker: true,
  },
});
