"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ACCOUNT_COOKIE, getClaims } from "@/db";
import { myAccounts } from "@/db/team";

/** Switches the account the app works in; only to one the user still belongs to. */
export async function switchAccountAction(accountId: string): Promise<{ ok: false }> {
  const claims = await getClaims();
  if (!claims?.sub) redirect("/giris");
  const accounts = await myAccounts(claims.sub);
  if (!accounts.some((a) => a.accountId === accountId)) return { ok: false };
  (await cookies()).set(ACCOUNT_COOKIE, accountId, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 400 });
  redirect("/bugun");
}
