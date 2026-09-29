// In-memory Postgres (PGlite) with a minimal stand-in for Supabase's auth
// schema and roles, and every migration applied. Shared by the test scripts.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PGlite } from "@electric-sql/pglite";

const SUPABASE_STUB = `
  CREATE ROLE anon NOLOGIN;
  CREATE ROLE authenticated NOLOGIN;
  CREATE ROLE service_role NOLOGIN BYPASSRLS;
  CREATE SCHEMA auth;
  CREATE TABLE auth.users (id uuid PRIMARY KEY, email text, raw_user_meta_data jsonb DEFAULT '{}');
  CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS
    $$ SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  GRANT USAGE ON SCHEMA auth, public TO anon, authenticated;
  GRANT EXECUTE ON FUNCTION auth.uid() TO anon, authenticated;
  ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated;
`;

export async function createTestDb({ log = false } = {}) {
  const db = new PGlite();
  await db.exec(SUPABASE_STUB);

  const dir = join(process.cwd(), "supabase/migrations");
  // Same order drizzle-kit applies them in (file names can share a timestamp).
  const journal = JSON.parse(readFileSync(join(dir, "meta/_journal.json"), "utf8")) as { entries: { tag: string }[] };
  for (const file of journal.entries.map((e) => `${e.tag}.sql`)) {
    for (const stmt of readFileSync(join(dir, file), "utf8").split("--> statement-breakpoint")) {
      if (stmt.trim()) await db.exec(stmt);
    }
    if (log) console.log(`applied ${file}`);
  }
  return db;
}

/** Inserts auth users; the signup trigger creates their trainer rows. */
export async function addUsers(db: PGlite, users: { id: string; name?: string }[]) {
  for (const u of users) {
    await db.query(`INSERT INTO auth.users (id, email, raw_user_meta_data) VALUES ($1, $2, $3)`, [
      u.id,
      `${u.id}@test`,
      JSON.stringify(u.name ? { full_name: u.name } : {}),
    ]);
  }
}
