@AGENTS.md

# Project conventions
- UI copy is Turkish; code, identifiers and comments are English. Route segments are Turkish (`/bugun`, `/danisanlar`).
- Server data access goes through `withTrainer()` in `src/db/index.ts` (RLS applies). Use `adminDb` only for signed-out paths and filter by an id you resolved yourself.
- Inside `withTrainer`, run queries sequentially — a transaction holds one connection.
- Schema changes: edit `src/db/schema.ts`, run `pnpm db:generate`, then `pnpm test:db`. Views/triggers live in custom migrations.
- Package balances come from the `client_package_balances` view; never store a separate remaining-count.
