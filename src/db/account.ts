import "server-only";
import { sql } from "drizzle-orm";
import type { Tx } from "./index";

/**
 * Deletes a trainer's account for good: the auth user, and through ON DELETE
 * CASCADE their trainer row and every client, package, lesson, payment,
 * receipt, answer, consent and setting. Runs on the owner connection (adminDb):
 * the auth schema isn't reachable under RLS. Profile photos in Storage are
 * removed by the browser beforehand (see ayarlar/delete-account.tsx).
 */
export async function deleteTrainerAccount(tx: Tx, trainerId: string) {
  // Studios the person taught in keep their lessons and pay history; the member
  // row loses its login (user_id → null) and is deactivated.
  await tx.execute(sql`update public.account_members set active = false where user_id = ${trainerId} and account_id <> ${trainerId}`);
  const rows = await tx.execute(sql`delete from auth.users where id = ${trainerId} returning id`);
  const list = Array.isArray(rows) ? rows : (rows as unknown as { rows: unknown[] }).rows;
  return list.length > 0;
}
