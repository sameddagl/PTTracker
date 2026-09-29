import type { Metadata, Viewport } from "next";
import { Inconsolata, Poppins, Roboto } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { APP_DESCRIPTION, APP_NAME } from "@/lib/config";
import "./globals.css";

// Clean design system fonts. latin-ext covers Turkish characters (ğ, ş, ı, İ).
const roboto = Roboto({ variable: "--font-roboto", subsets: ["latin", "latin-ext"], weight: ["400", "500", "700"] });
const poppins = Poppins({ variable: "--font-poppins", subsets: ["latin", "latin-ext"], weight: ["500", "600", "700"] });
const inconsolata = Inconsolata({ variable: "--font-inconsolata", subsets: ["latin", "latin-ext"] });

export const metadata: Metadata = {
  title: { default: APP_NAME, template: `%s · ${APP_NAME}` },
  description: APP_DESCRIPTION,
  applicationName: APP_NAME,
  appleWebApp: { capable: true, title: APP_NAME, statusBarStyle: "default" },
  formatDetection: { telephone: false },
  icons: { apple: "/pwa-icon/180" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1120" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="tr" className={`${roboto.variable} ${poppins.variable} ${inconsolata.variable} h-full antialiased`}>
      <body className="min-h-full">
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
