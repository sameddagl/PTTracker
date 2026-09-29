import type { NextConfig } from "next";

const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname : undefined;

const nextConfig: NextConfig = {
  // The dev badge covers the mobile nav or header actions wherever it sits.
  devIndicators: false,
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

export default nextConfig;
