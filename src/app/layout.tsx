import type { Metadata, Viewport } from "next";
import { Inconsolata, Poppins } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { APP_DESCRIPTION, APP_NAME, siteUrl } from "@/lib/config";
import "./globals.css";

// Poppins for everything, Inconsolata for IBANs and codes. latin-ext covers Turkish (ğ, ş, ı, İ).
const poppins = Poppins({ variable: "--font-poppins", subsets: ["latin", "latin-ext"], weight: ["400", "500", "600", "700"] });
const inconsolata = Inconsolata({ variable: "--font-inconsolata", subsets: ["latin", "latin-ext"] });

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: APP_NAME, template: `%s · ${APP_NAME}` },
  description: APP_DESCRIPTION,
  applicationName: APP_NAME,
  openGraph: { siteName: APP_NAME, locale: "tr_TR", type: "website" },
  twitter: { card: "summary_large_image" },
  appleWebApp: { capable: true, title: APP_NAME, statusBarStyle: "default" },
  formatDetection: { telephone: false },
  icons: { apple: "/pwa-icon/180" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f5f7" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0b" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="tr" className={`${poppins.variable} ${inconsolata.variable} h-full antialiased`}>
      <body className="min-h-full">
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
