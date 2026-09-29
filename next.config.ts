import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep the dev badge clear of the mobile bottom navigation.
  devIndicators: { position: "top-right" },
};

export default nextConfig;
