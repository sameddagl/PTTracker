"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ACCOUNT_COOKIE, getClaims } from "@/db";
import { acceptInvite } from "@/db/team";

export async function acceptInviteAction(token: string, _prev: { error?: string }): Promise<{ error?: string }> {
  const claims = await getClaims();
  if (!claims?.sub) redirect(`/giris?next=${encodeURIComponent(`/davet/${token}`)}`);
  const res = await acceptInvite(token, { id: claims.sub, email: (claims.email as string | undefined) ?? null });
  if (!res.ok) {
    return {
      error:
        res.reason === "email"
          ? "Bu davet başka bir e-posta adresine gönderildi. Çıkış yapıp o adresle giriş yap."
          : res.reason === "owner"
            ? "Bu senin kendi stüdyon."
            : "Davetin süresi dolmuş ya da iptal edilmiş. Stüdyodan yeni bir davet iste.",
    };
  }
  // Work in the studio from now on (the account switcher in Ayarlar changes it back).
  (await cookies()).set(ACCOUNT_COOKIE, res.accountId, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 400 });
  redirect("/ayarlar/profil?hosgeldin=1");
}
