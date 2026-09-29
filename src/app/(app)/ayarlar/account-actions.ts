"use server";

import { redirect } from "next/navigation";
import { adminDb, getClaims } from "@/db";
import { deleteTrainerAccount } from "@/db/account";
import { createClient } from "@/lib/supabase/server";

const CONFIRM = "SİL";

/** Deletes the signed-in trainer's account and everything in it, then signs out. */
export async function deleteAccountAction(confirmation: string): Promise<{ error: string } | void> {
  const claims = await getClaims();
  if (!claims?.sub) redirect("/giris");
  if (confirmation.trim().toLocaleUpperCase("tr") !== CONFIRM) return { error: `Onaylamak için ${CONFIRM} yaz.` };

  const deleted = await adminDb.transaction((tx) => deleteTrainerAccount(tx, claims.sub));
  if (!deleted) return { error: "Hesap silinemedi. Tekrar dene." };

  // The session belongs to a user that no longer exists; clear the cookies.
  const supabase = await createClient();
  await supabase.auth.signOut({ scope: "local" });
  redirect("/giris?silindi=1");
}
