@AGENTS.md

# Project conventions
- UI copy is Turkish; code, identifiers and comments are English. Route segments are Turkish (`/bugun`, `/danisanlar`).
- Server data access goes through `withTrainer()` in `src/db/index.ts` (RLS applies). Use `adminDb` only for signed-out paths and filter by an id you resolved yourself.
- Inside `withTrainer`, run queries sequentially — a transaction holds one connection.
- Schema changes: edit `src/db/schema.ts`, run `pnpm db:generate`, then `pnpm test:db`. Views/triggers live in custom migrations.
- Package balances come from the `client_package_balances` view; never store a separate remaining-count.

## UI / design system

- The UI follows the typeui "Clean" design system: `.claude/skills/design-system/SKILL.md`. Read it before building or restyling screens.
- Use the semantic tokens from `src/app/globals.css` (`primary`, `success`, `warning`, `destructive`, `muted-foreground`, …), never raw Tailwind palette colours.
- WCAG AA: the base `success` / `warning` / `destructive` colours are for fills, icons and borders; text in those colours uses the `-strong` variants (`text-success-strong` etc.).
- Type scale 12/14/16/20/24/32 (`text-xs` … `text-3xl`), 8pt spacing, headings use Poppins (`font-heading`), 44px touch targets on mobile (controls shrink at `md:`).
- Every route under `src/app/(app)` has a `loading.tsx` built from `src/components/skeletons.tsx`, so tab switches show the new page's frame at once. Add one when adding a route.
- Buttons that start a server action use `loading={pending}` (spinner + disabled); plain `<form action>` forms use `SubmitButton`. Only the clicked button spins.
- Package prices: `price` is cash, `installmentPrice` + `installments` the optional plan, `compareAtPrice` the struck-through price. Read them through `src/lib/pricing.ts`.
