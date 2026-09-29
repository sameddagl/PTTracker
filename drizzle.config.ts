import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: [".env.local", ".env"], quiet: true });

// Migrations need a session-mode connection. On Supabase's shared pooler that
// is the transaction-pooler URL on port 5432 instead of 6543.
const url =
  process.env.DATABASE_URL_DIRECT ?? process.env.DATABASE_URL?.replace(/:6543\//, ":5432/") ?? "";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./supabase/migrations",
  dialect: "postgresql",
  // Supabase owns the auth schema; only manage our own tables and policies.
  schemaFilter: ["public"],
  entities: { roles: { provider: "supabase" } },
  migrations: { prefix: "timestamp" },
  dbCredentials: { url },
});
