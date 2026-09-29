import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// The trainer app. Everything else is public: landing, login, legal pages,
// client portals (/p/…) and trainers' public pages (/<slug>).
const PROTECTED_PREFIXES = ["/bugun", "/danisanlar", "/takvim", "/odemeler", "/ayarlar", "/paketler", "/ders", "/baslangic", "/yardim"];

const isProtected = (path: string) => PROTECTED_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`));

// Refreshes the Supabase session cookie on every request and sends signed-out
// visitors to the login page. This is an optimistic check only; every data
// access re-verifies the user (see src/db/index.ts).
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) response.cookies.set(name, value, options);
        },
      },
    },
  );

  const { data } = await supabase.auth.getClaims();
  const path = request.nextUrl.pathname;

  if (!data?.claims && isProtected(path)) {
    const url = request.nextUrl.clone();
    url.pathname = "/giris";
    url.search = path === "/bugun" ? "" : `?next=${encodeURIComponent(path)}`;
    return NextResponse.redirect(url);
  }

  if (data?.claims && (path === "/" || path === "/giris")) {
    const url = request.nextUrl.clone();
    url.pathname = "/bugun";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|icon.svg|pwa-icon|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
