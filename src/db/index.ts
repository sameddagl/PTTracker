import "server-only";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import { redirect } from "next/navigation";
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

/**
 * Runs `fn` in a transaction as the signed-in trainer, with Postgres RLS
 * applied exactly as it would be for a Supabase client request. Redirects to
 * the login page if nobody is signed in.
 */
export async function withTrainer<T>(fn: (tx: Tx, trainerId: string) => Promise<T>): Promise<T> {
  const claims = await getClaims();
  if (!claims?.sub) redirect("/giris");

  return adminDb.transaction(async (tx) => {
    await tx.execute(sql`
      select
        set_config('request.jwt.claims', ${JSON.stringify(claims)}, true),
        set_config('request.jwt.claim.sub', ${claims.sub}, true),
        set_config('request.jwt.claim.role', 'authenticated', true)
    `);
    await tx.execute(sql`set local role authenticated`);
    return fn(tx, claims.sub);
  });
}
