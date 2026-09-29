// Read-only sanity check of the live Supabase database. Run: pnpm db:check
import { config } from "dotenv";
import postgres from "postgres";

config({ path: [".env.local", ".env"], quiet: true });
const url = process.env.DATABASE_URL_DIRECT ?? process.env.DATABASE_URL?.replace(/:6543\//, ":5432/");
if (!url) throw new Error("DATABASE_URL is not set");
const sql = postgres(url, { max: 1 });

const tables = await sql`
  select c.relname as name, c.relrowsecurity as rls
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind = 'r' order by 1`;
const view = await sql`select 1 from pg_views where schemaname = 'public' and viewname = 'client_package_balances'`;
const trigger = await sql`select 1 from pg_trigger where tgname = 'on_auth_user_created'`;
const policies = await sql`select count(*)::int as n from pg_policies where schemaname = 'public'`;
const version = await sql`select current_setting('server_version') as v`;

console.table(tables);
console.log({
  postgres: version[0].v,
  balanceView: view.length === 1,
  signupTrigger: trigger.length === 1,
  policies: policies[0].n,
  tablesWithoutRls: tables.filter((t) => !t.rls).map((t) => t.name),
});
await sql.end();
