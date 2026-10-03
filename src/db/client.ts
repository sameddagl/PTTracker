import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// The database connection, without anything from Next.js, so scripts and
// tests can import the modules that use it. The app imports it via "@/db".

const globalForDb = globalThis as unknown as { pg?: postgres.Sql };

// Transaction pooler (Supavisor, port 6543) does not support prepared statements.
const pg = globalForDb.pg ?? postgres(process.env.DATABASE_URL!, { prepare: false, max: 5 });
if (process.env.NODE_ENV !== "production") globalForDb.pg = pg;

// Connects as the database owner and bypasses RLS. Only for code paths with
// no signed-in trainer, e.g. resolving a client portal token. Never pass
// user-controlled ids to it without checking ownership first.
export const adminDb = drizzle(pg, { schema });

export type Tx = Parameters<Parameters<typeof adminDb.transaction>[0]>[0];
