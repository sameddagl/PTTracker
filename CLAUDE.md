@AGENTS.md

# Project conventions
- UI copy is Turkish; code, identifiers and comments are English. Route segments are Turkish (`/bugun`, `/danisanlar`).
- Server data access goes through `withTrainer()` in `src/db/index.ts` (RLS applies). Use `adminDb` only for signed-out paths and filter by an id you resolved yourself.
- Inside `withTrainer`, run queries sequentially — a transaction holds one connection.
- Schema changes: edit `src/db/schema.ts`, run `pnpm db:generate`, then `pnpm test:db`. Views/triggers live in custom migrations.
- Package balances come from the `client_package_balances` view; never store a separate remaining-count.

## UI / design system

- Visual direction (user's reference: merkezim.com): light-grey canvas (`bg-canvas`), white `surface` panels (rounded-2xl, hairline border, `shadow-card`), Poppins everywhere with tight semibold headings, pill buttons in ink (lime in dark mode), and a lime accent (`bg-lime text-lime-foreground`, always ink text on lime) used sparingly: the current tab, the one stat that needs attention, "now" markers. Lists are rows inside one `divide-y overflow-hidden surface`; people get `<Avatar>`; summary numbers use `<StatTile>`. Avoid bare bordered boxes on white and small grey section labels. `.claude/skills/design-system/SKILL.md` (typeui Clean) still applies for accessibility, spacing and scale.
- Use the semantic tokens from `src/app/globals.css` (`primary`, `lime`, `success`, `warning`, `destructive`, `muted-foreground`, …), never raw Tailwind palette colours.
- WCAG AA: the base `success` / `warning` / `destructive` colours are for fills, icons and borders; text in those colours uses the `-strong` variants (`text-success-strong` etc.).
- Type scale 12/14/16/20/24/32 (`text-xs` … `text-3xl`), 8pt spacing, 44px touch targets on mobile (controls shrink at `md:`).
- Every route under `src/app/(app)` has a `loading.tsx` built from `src/components/skeletons.tsx`, so tab switches show the new page's frame at once. Add one when adding a route.
- Buttons that start a server action use `loading={pending}` (spinner + disabled); plain `<form action>` forms use `SubmitButton`. Only the clicked button spins.
- Package prices: `price` is cash, `installmentPrice` + `installments` the optional plan, `compareAtPrice` the struck-through price. Read them through `src/lib/pricing.ts`.
- Group classes (`src/db/groups.ts`): occurrences are lessons generated `GROUP_HORIZON_DAYS` ahead by `ensureGroupOccurrences` (called by the calendar, Bugün, group pages and the portal) and keyed by `(group_class_id, occurrence_date)`. A place is held by attendance `scheduled`/`attended`/`no_show`. Group lessons only draw on group packages (`pickPackage(..., { strict: true })`).
- In raw `sql` subqueries on a single-table select, write the outer column as `"table"."column"`; Drizzle leaves `${table.column}` unqualified there.
- Product name is `APP_NAME` ("Stüdyom", domain `APP_DOMAIN` "studyom.app" until the real domain is set) from `src/lib/config.ts`; never hard-code it. Marketing copy (landing, SEO) addresses trainers with "siz"; the app and client portal use "sen". Packages are "seans paketi" in marketing, lessons are "ders".
- SEO: `src/app/robots.ts` (app, portal and sign-up routes disallowed), `src/app/sitemap.ts` (landing, KVKK, published trainer pages), `src/app/opengraph-image.tsx`, JSON-LD on the landing (SoftwareApplication + FAQPage, no ratings) and on trainer pages (SportsActivityLocation). Set `NEXT_PUBLIC_SITE_URL` in production so canonical/OG URLs are absolute.
