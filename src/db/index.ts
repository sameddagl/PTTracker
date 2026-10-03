import "server-only";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import postgres from "postgres";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as { pg?: postgres.Sql };

// Transaction pooler (Supavisor, port 6543) does not support prepared statements.
const pg = globalForDb.pg ?? postgres(process.env.DATABASE_URL!, { prepare: false, max: 5 });
if (process.env.NODE_ENV !== "production") globalForDb.pg = pg;

// Connects as the database owner and bypasses RLS. Only for code paths with
// no signed-in trainer, e.g. resolving a client portal token. Never pass
// user-controlled ids to it without checking ownership first.
export const adminDb = drizzle(pg, { schema });

export type Tx = Parameters<Parameters<typeof adminDb.transaction>[0]>[0];

/** Verified claims of the signed-in trainer, or null. Deduplicated per request. */
export const getClaims = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  return data?.claims ?? null;
});

/** The signed-in person inside the account a request works in. */
export type Member = { id: string; userId: string; accountId: string; role: "owner" | "instructor"; name: string };

/** Cookie holding the account a person who belongs to several has chosen (Ayarlar → Hesap). */
export const ACCOUNT_COOKIE = "hesap";

type Membership = Member & { onboarded: boolean };

/**
 * The account a user works in: the one they picked if they still belong to it,
 * else their own account once it is set up, else the first account they joined.
 */
export function pickMembership(list: Membership[], userId: string, chosen: string | undefined) {
  return (
    list.find((m) => m.accountId === chosen) ??
    list.find((m) => m.accountId === userId && m.onboarded) ??
    list.find((m) => m.onboarded) ??
    list.find((m) => m.accountId === userId) ??
    null
  );
}

async function memberships(tx: Tx, userId: string): Promise<Membership[]> {
  const rows = await tx.execute<{ id: string; account_id: string; role: Member["role"]; full_name: string; onboarded: boolean }>(sql`
    select m.id, m.account_id, m.role, m.full_name, t.onboarded_at is not null as onboarded
    from public.account_members m join public.trainers t on t.id = m.account_id
    where m.user_id = ${userId} and m.active
    order by m.created_at
  `);
  return rows.map((r) => ({ id: r.id, userId, accountId: r.account_id, role: r.role, name: r.full_name, onboarded: r.onboarded }));
}

/**
 * Runs `fn` in a transaction as the signed-in user, inside the account they
 * work in, with Postgres RLS applied exactly as it would be for a Supabase
 * client request. `trainerId` is the account (a trainer working alone or a
 * studio); `member` says who is acting and with which role. Redirects to the
 * login page if nobody is signed in.
 */
export async function withTrainer<T>(fn: (tx: Tx, trainerId: string, member: Member) => Promise<T>): Promise<T> {
  const claims = await getClaims();
  if (!claims?.sub) redirect("/giris");
  const userId = claims.sub;
  const chosen = (await cookies()).get(ACCOUNT_COOKIE)?.value;

  return adminDb.transaction(async (tx) => {
    // Still the owner connection here, so the membership lookup isn't limited by RLS.
    const picked = pickMembership(await memberships(tx, userId), userId, chosen);
    if (!picked) throw new Error("No account membership for the signed-in user");
    const member: Member = { id: picked.id, userId, accountId: picked.accountId, role: picked.role, name: picked.name };
    await tx.execute(sql`
      select
        set_config('request.jwt.claims', ${JSON.stringify(claims)}, true),
        set_config('request.jwt.claim.sub', ${userId}, true),
        set_config('request.jwt.claim.role', 'authenticated', true),
        set_config('app.account_id', ${member.accountId}, true)
    `);
    await tx.execute(sql`set local role authenticated`);
    return fn(tx, member.accountId, member);
  });
}

/** The signed-in member, for pages that only need to know who is acting (one cheap query). */
export const getMember = cache(() => withTrainer(async (_tx, _id, member) => member));

/** Owner-only pages and actions: instructors get a 404 rather than a hint that the page exists. */
export async function requireOwner() {
  const member = await getMember();
  if (member.role !== "owner") notFound();
  return member;
}
