import Script from "next/script";
import { APP_DOMAIN, UMAMI_WEBSITE_ID } from "@/lib/config";

/**
 * Cookieless visit counts (Umami) for public pages: landing, trainer pages,
 * sign-up and login. Never add it to the trainer app or the client portal.
 * It only counts on the live domain and drops query strings and hashes.
 */
export function Analytics() {
  if (process.env.NODE_ENV !== "production") return null;
  return (
    <Script
      src="https://cloud.umami.is/script.js"
      data-website-id={UMAMI_WEBSITE_ID}
      data-domains={APP_DOMAIN}
      data-exclude-search="true"
      data-exclude-hash="true"
      strategy="afterInteractive"
    />
  );
}
