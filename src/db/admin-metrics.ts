import "server-only";
import { sql, type SQL } from "drizzle-orm";
import type { Tx } from "./index";

// Product metrics for the owner's /yonetim page. Run on the owner connection (adminDb) across all
// trainers, so it returns counts only — never client names or contact details.

type Row = Record<string, unknown>;
async function rows<T extends Row>(db: Tx, q: SQL): Promise<T[]> {
  const r = await db.execute(q);
  // postgres-js returns the rows array; PGlite wraps it in { rows }.
  return (Array.isArray(r) ? r : (r as unknown as { rows: T[] }).rows) as T[];
}
const num = (v: unknown) => Number(v ?? 0);

/** Lessons whose attendance was taken (someone marked, not left at "scheduled"). */
const MARKED = sql.raw(`('attended', 'no_show', 'late_cancel')`);

export async function overview(db: Tx) {
  const [r] = await rows(db, sql`
    select
      (select count(*) from trainers) as trainers,
      (select count(*) from trainers where onboarded_at is not null) as onboarded,
      (select count(*) from trainers where public_page_enabled and slug is not null) as published,
      (select count(*) from trainers where created_at > now() - interval '7 days') as new_trainers_7,
      (select count(distinct l.trainer_id) from lesson_attendees la join lessons l on l.id = la.lesson_id
        where la.status in ${MARKED} and l.starts_at > now() - interval '7 days') as active_trainers_7,
      (select count(*) from clients where status = 'active' and archived_at is null) as clients,
      (select count(distinct client_id) from portal_tokens where last_used_at > now() - interval '7 days') as portal_clients_7,
      (select count(*) from applications where created_at > now() - interval '7 days') as applications_7,
      (select count(*) from lesson_attendees la join lessons l on l.id = la.lesson_id
        where la.status in ${MARKED} and l.starts_at > now() - interval '7 days') as marked_7,
      (select count(*) from lesson_attendees where confirmed_at > now() - interval '7 days') as confirmed_7,
      (select count(*) from messages where created_at > now() - interval '7 days') as messages_7,
      (select count(distinct trainer_id) from push_subscriptions where client_id is null) as trainers_with_push,
      (select count(distinct client_id) from push_subscriptions where client_id is not null) as clients_with_push
  `);
  return Object.fromEntries(Object.entries(r ?? {}).map(([k, v]) => [k, num(v)])) as Record<string, number>;
}

/** How far onboarded trainers got: each step counts trainers who did it at least once. */
export async function activation(db: Tx) {
  const [r] = await rows(db, sql`
    select
      (select count(*) from trainers) as signed_up,
      (select count(*) from trainers where onboarded_at is not null) as onboarded,
      (select count(distinct trainer_id) from package_templates) as package,
      (select count(distinct trainer_id) from clients) as client,
      (select count(distinct trainer_id) from lessons) as lesson,
      (select count(distinct la.trainer_id) from lesson_attendees la where la.status in ${MARKED}) as attendance,
      (select count(*) from trainers where public_page_enabled and slug is not null) as page,
      (select count(distinct trainer_id) from applications) as application,
      (select count(distinct trainer_id) from push_subscriptions where client_id is null) as push
  `);
  return Object.fromEntries(Object.entries(r ?? {}).map(([k, v]) => [k, num(v)])) as Record<string, number>;
}

export type WeekRow = {
  week: string;
  newTrainers: number;
  lessons: number;
  marked: number;
  newClients: number;
  applications: number;
  payments: number;
};

/** The last `weeks` Monday-to-Sunday weeks (Istanbul time), oldest first. */
export async function weekly(db: Tx, weeks = 8): Promise<WeekRow[]> {
  const tz = "Europe/Istanbul";
  const r = await rows(db, sql`
    with w as (
      select generate_series(
        date_trunc('week', now() at time zone ${tz}) - make_interval(weeks => ${weeks - 1}),
        date_trunc('week', now() at time zone ${tz}),
        interval '1 week'
      ) as start
    ), b as (select start, (start at time zone ${tz}) as s, ((start + interval '1 week') at time zone ${tz}) as e from w)
    select
      to_char(b.start, 'YYYY-MM-DD') as week,
      (select count(*) from trainers t where t.created_at >= b.s and t.created_at < b.e) as new_trainers,
      (select count(*) from lessons l where l.status = 'scheduled' and l.starts_at >= b.s and l.starts_at < b.e) as lessons,
      (select count(*) from lesson_attendees la join lessons l on l.id = la.lesson_id
        where la.status in ${MARKED} and l.starts_at >= b.s and l.starts_at < b.e) as marked,
      (select count(*) from clients c where c.created_at >= b.s and c.created_at < b.e) as new_clients,
      (select count(*) from applications a where a.created_at >= b.s and a.created_at < b.e) as applications,
      (select count(*) from payments p where p.status = 'confirmed' and p.created_at >= b.s and p.created_at < b.e) as payments
    from b order by b.start
  `);
  return r.map((x) => ({
    week: String(x.week),
    newTrainers: num(x.new_trainers),
    lessons: num(x.lessons),
    marked: num(x.marked),
    newClients: num(x.new_clients),
    applications: num(x.applications),
    payments: num(x.payments),
  }));
}

export type TrainerRow = {
  id: string;
  name: string;
  email: string | null;
  slug: string | null;
  createdAt: string;
  onboarded: boolean;
  clients: number;
  lessons7: number;
  lastActive: string | null;
};

/** Trainers, newest first, with how much they use the app. Counts only for their clients. */
export async function trainerList(db: Tx, limit = 200): Promise<TrainerRow[]> {
  const r = await rows(db, sql`
    select
      t.id, coalesce(nullif(t.business_name, ''), t.full_name) as name, u.email, t.slug,
      t.created_at, t.onboarded_at is not null as onboarded,
      (select count(*) from clients c where c.trainer_id = t.id and c.archived_at is null) as clients,
      (select count(*) from lessons l where l.trainer_id = t.id and l.status = 'scheduled'
        and l.starts_at > now() - interval '7 days' and l.starts_at <= now()) as lessons7,
      greatest(
        (select max(l.updated_at) from lessons l where l.trainer_id = t.id),
        (select max(la.updated_at) from lesson_attendees la where la.trainer_id = t.id),
        (select max(c.updated_at) from clients c where c.trainer_id = t.id)
      ) as last_active
    from trainers t join auth.users u on u.id = t.id
    order by t.created_at desc
    limit ${limit}
  `);
  const iso = (v: unknown) => (v ? new Date(v as string).toISOString() : null);
  return r.map((x) => ({
    id: String(x.id),
    name: String(x.name ?? ""),
    email: (x.email as string | null) ?? null,
    slug: (x.slug as string | null) ?? null,
    createdAt: iso(x.created_at)!,
    onboarded: x.onboarded === true || x.onboarded === "t",
    clients: num(x.clients),
    lessons7: num(x.lessons7),
    lastActive: iso(x.last_active),
  }));
}
