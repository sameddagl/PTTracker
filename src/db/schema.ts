import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  customType,
  date,
  foreignKey,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgPolicy,
  pgTable,
  pgView,
  smallint,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import type { NotifyPrefs } from "../lib/notify-prefs";
import type { MessageTemplates } from "../lib/templates";
import { authenticatedRole, authUid, authUsers } from "drizzle-orm/supabase";

// Multi-tenancy: every row belongs to an account (trainer_id). An account is a
// trainer working alone or a studio; its id is the owner's auth user id, and
// the people who work in it are account_members. RLS lets a signed-in member
// see the rows of the account selected for the request (current_account(),
// see withTrainer), and composite foreign keys that include trainer_id stop a
// row from pointing at another account's data (FK checks bypass RLS, so this
// has to be a constraint).

export const memberRoleEnum = pgEnum("member_role", ["owner", "instructor"]);
export const disciplineEnum = pgEnum("discipline", ["pt", "pilates", "both"]);
export const sessionTypeEnum = pgEnum("session_type", ["private", "duet", "trio", "group"]);
export const packageStatusEnum = pgEnum("package_status", ["active", "cancelled"]);
export const lessonStatusEnum = pgEnum("lesson_status", ["scheduled", "cancelled"]);
// How clients get a place in a group class: book each class, keep a fixed weekly spot, or both.
export const groupJoinModeEnum = pgEnum("group_join_mode", ["drop_in", "fixed", "both"]);
export const attendanceStatusEnum = pgEnum("attendance_status", [
  "scheduled",
  "attended",
  "no_show",
  "late_cancel", // cancelled inside the notice window: the lesson is burned ("ders yanar")
  "cancelled", // cancelled in time: no credit used
]);
export const paymentMethodEnum = pgEnum("payment_method", ["cash", "bank_transfer", "card", "other"]);
// Payments the trainer records are confirmed; ones a client reports from their
// portal wait for the trainer. Only confirmed payments reduce what is owed.
export const paymentStatusEnum = pgEnum("payment_status", ["pending", "confirmed", "rejected"]);
export const paymentReporterEnum = pgEnum("payment_reporter", ["trainer", "client"]);
export const consentKindEnum = pgEnum("consent_kind", ["kvkk_notice", "health_data"]);
export const measurementSourceEnum = pgEnum("measurement_source", ["trainer", "client"]);
export const programKindEnum = pgEnum("program_kind", ["workout", "nutrition"]);
export const supportSourceEnum = pgEnum("support_source", ["landing", "app"]);
export const supportSenderEnum = pgEnum("support_sender", ["user", "admin"]);
// "applicant": signed up on the trainer's public page, not approved yet.
export const clientStatusEnum = pgEnum("client_status", ["applicant", "active"]);
export const clientSourceEnum = pgEnum("client_source", ["manual", "public_page"]);
export const applicationStatusEnum = pgEnum("application_status", ["pending", "approved", "rejected"]);
export const intakeFieldTypeEnum = pgEnum("intake_field_type", [
  "short_text",
  "long_text",
  "number",
  "date",
  "single_choice",
  "multi_choice",
  "yes_no",
]);

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

const money = (name: string) => numeric(name, { precision: 12, scale: 2 });

// SQL functions from the account_members migration: the account this request
// works in (only if the signed-in user is an active member of it) and their role there.
const currentAccount = sql`(select public.current_account())`;
const isOwner = sql`(select public.current_member_role()) = 'owner'`;

const ownRows = (name: string, column: { name: string }) =>
  pgPolicy(name, {
    for: "all",
    to: authenticatedRole,
    using: sql`${sql.identifier(column.name)} = ${currentAccount}`,
    withCheck: sql`${sql.identifier(column.name)} = ${currentAccount}`,
  });

/** Rows only the account's owner may touch (money, the support thread). */
const ownerRows = (name: string, column: { name: string }) =>
  pgPolicy(name, {
    for: "all",
    to: authenticatedRole,
    using: sql`${sql.identifier(column.name)} = ${currentAccount} and ${isOwner}`,
    withCheck: sql`${sql.identifier(column.name)} = ${currentAccount} and ${isOwner}`,
  });

export const trainers = pgTable(
  "trainers",
  {
    id: uuid("id")
      .primaryKey()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    fullName: text("full_name").notNull().default(""),
    businessName: text("business_name"),
    phone: text("phone"),
    discipline: disciplineEnum("discipline").notNull().default("both"),
    // Cancelling fewer than this many hours before a lesson burns the credit.
    lateCancelHours: smallint("late_cancel_hours").notNull().default(24),
    timezone: text("timezone").notNull().default("Europe/Istanbul"),
    onboardedAt: timestamp("onboarded_at", { withTimezone: true }),

    // Public page at /<slug>: the link trainers put in their Instagram bio.
    slug: text("slug").unique(),
    publicPageEnabled: boolean("public_page_enabled").notNull().default(false),
    headline: text("headline"),
    bio: text("bio"),
    city: text("city"),
    instagram: text("instagram"),
    specialties: text("specialties").array().notNull().default(sql`'{}'::text[]`),
    // Paths inside the "profile" storage bucket.
    avatarPath: text("avatar_path"),
    coverPath: text("cover_path"),

    // Shown to approved clients so they can pay by bank transfer.
    iban: text("iban"),
    ibanHolder: text("iban_holder"),

    // Client self-booking from the portal (see availability_rules / time_off).
    bookingEnabled: boolean("booking_enabled").notNull().default(false),
    bookingLessonMinutes: smallint("booking_lesson_minutes").notNull().default(60),
    // Earliest a client can book, in hours from now.
    bookingMinNoticeHours: smallint("booking_min_notice_hours").notNull().default(12),
    // How far ahead the calendar is open, in days.
    bookingHorizonDays: smallint("booking_horizon_days").notNull().default(21),

    // Getting-started checklist on Bugün: hidden by the trainer, and the one
    // step the app can't see for itself (link added to the Instagram bio).
    guideDismissedAt: timestamp("guide_dismissed_at", { withTimezone: true }),
    bioLinkAddedAt: timestamp("bio_link_added_at", { withTimezone: true }),
    // Monday of the last week a weekly summary was sent for (the cron job is idempotent per week).
    weeklySummaryWeek: date("weekly_summary_week"),
    /** Per-kind push/e-mail choices; missing keys fall back to NOTIFY defaults (src/lib/notify-prefs.ts). */
    notifyPrefs: jsonb("notify_prefs").$type<NotifyPrefs>().notNull().default({}),

    // What goes to clients on its own (see src/lib/templates.ts): the "Geliyor musun?"
    // reminder and how many hours before a lesson, the renewal offer, and the
    // trainer's own wording for every ready-made text (missing keys use the defaults).
    remindersEnabled: boolean("reminders_enabled").notNull().default(true),
    reminderHours: smallint("reminder_hours").notNull().default(24),
    renewalOffersEnabled: boolean("renewal_offers_enabled").notNull().default(true),
    installmentRemindersEnabled: boolean("installment_reminders_enabled").notNull().default(true),
    messageTemplates: jsonb("message_templates").$type<MessageTemplates>().notNull().default({}),

    // Progress tracking (src/lib/measurements.ts): the metrics on the trainer's
    // forms (null = the default set for their discipline) and whether clients
    // may log their own weight from their page.
    measureMetrics: text("measure_metrics").array(),
    clientsSelfWeigh: boolean("clients_self_weigh").notNull().default(true),
    ...timestamps,

    // Studios: may instructors switch their client list to everyone in the
    // studio, and do late cancels / no-shows count towards instructor pay.
    instructorsSeeAllClients: boolean("instructors_see_all_clients").notNull().default(true),
    payrollCountsMissed: boolean("payroll_counts_missed").notNull().default(false),
  },
  (t) => [
    check("trainers_reminder_hours", sql`${t.reminderHours} between 1 and 72`),
    check("trainers_slug_format", sql`${t.slug} ~ '^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$'`),
    // Rows are created by the on_auth_user_created trigger, never by the client.
    // Every member reads the account's settings; only the owner changes them.
    pgPolicy("trainers_select_own", { for: "select", to: authenticatedRole, using: sql`${t.id} = ${currentAccount}` }),
    pgPolicy("trainers_update_own", {
      for: "update",
      to: authenticatedRole,
      using: sql`${t.id} = ${currentAccount} and ${isOwner}`,
      withCheck: sql`${t.id} = ${currentAccount} and ${isOwner}`,
    }),
  ],
);

/** How a studio pays an instructor (see src/lib/payroll.ts). */
export type PayRule =
  | { type: "per_lesson"; private: number; duet: number; trio: number; group: number }
  | { type: "percent"; percent: number };

// People who work in an account. Every account has its owner as a member (the
// signup trigger adds it); a studio invites instructors. Members are never
// deleted, only deactivated, so past lessons keep their instructor.
export const accountMembers = pgTable(
  "account_members",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    accountId: uuid("account_id")
      .notNull()
      .references(() => trainers.id, { onDelete: "cascade" }),
    // Null once the person deletes their login: the row stays so past lessons
    // and pay keep their instructor's name.
    userId: uuid("user_id").references(() => authUsers.id, { onDelete: "set null" }),
    role: memberRoleEnum("role").notNull(),
    fullName: text("full_name").notNull().default(""),
    bio: text("bio"),
    // Path inside the "profile" storage bucket (the member's own folder).
    photoPath: text("photo_path"),
    // Calendar colour key (see src/lib/team.ts).
    color: text("color"),
    payRule: jsonb("pay_rule").$type<PayRule>(),
    active: boolean("active").notNull().default(true),
    ...timestamps,
  },
  (t) => [
    unique("account_members_account_user_key").on(t.accountId, t.userId),
    unique("account_members_id_account_key").on(t.id, t.accountId),
    index("account_members_user_idx").on(t.userId),
    pgPolicy("account_members_select", { for: "select", to: authenticatedRole, using: sql`${t.accountId} = ${currentAccount}` }),
    // The owner manages the team; an instructor may edit their own profile row
    // (the app limits which columns). Only the app sets app.account_id, so a
    // direct API call can never reach a studio's rows.
    pgPolicy("account_members_owner_write", {
      for: "all",
      to: authenticatedRole,
      using: sql`${t.accountId} = ${currentAccount} and ${isOwner}`,
      withCheck: sql`${t.accountId} = ${currentAccount} and ${isOwner}`,
    }),
    pgPolicy("account_members_self_update", {
      for: "update",
      to: authenticatedRole,
      using: sql`${t.accountId} = ${currentAccount} and ${t.userId} = ${authUid}`,
      withCheck: sql`${t.accountId} = ${currentAccount} and ${t.userId} = ${authUid}`,
    }),
  ],
);

// Invitations to join an account as an instructor. Only a hash of the token is
// stored; the link in the e-mail is /davet/<token>.
export const accountInvites = pgTable(
  "account_invites",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    accountId: uuid("account_id")
      .notNull()
      .references(() => trainers.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    fullName: text("full_name").notNull(),
    color: text("color"),
    // An instructor the owner already added without a login: accepting links the login to that row.
    memberId: uuid("member_id").references(() => accountMembers.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("account_invites_account_idx").on(t.accountId), ownerRows("account_invites_owner", t.accountId)],
);

// A month of instructor pay, frozen when the owner closes it (src/lib/payroll.ts
// computes open months on the fly). `detail` keeps the lesson lines as computed.
export const payrollMonths = pgTable(
  "payroll_months",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    trainerId: uuid("trainer_id")
      .notNull()
      .references(() => trainers.id, { onDelete: "cascade" }),
    memberId: uuid("member_id").notNull(),
    month: date("month").notNull(), // first day of the month
    lessons: integer("lessons").notNull(),
    amount: money("amount").notNull(),
    detail: jsonb("detail").notNull(),
    closedAt: timestamp("closed_at", { withTimezone: true }).notNull().defaultNow(),
    paidAt: timestamp("paid_at", { withTimezone: true }),
  },
  (t) => [
    unique("payroll_months_member_month_key").on(t.memberId, t.month),
    foreignKey({ name: "payroll_months_member_fk", columns: [t.memberId, t.trainerId], foreignColumns: [accountMembers.id, accountMembers.accountId] }),
    ownerRows("payroll_months_owner", t.trainerId),
    // An instructor sees their own closed months.
    pgPolicy("payroll_months_self_select", {
      for: "select",
      to: authenticatedRole,
      using: sql`${t.trainerId} = ${currentAccount} and ${t.memberId} in (select m.id from public.account_members m where m.user_id = ${authUid})`,
    }),
  ],
);

export const clients = pgTable(
  "clients",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    trainerId: uuid("trainer_id")
      .notNull()
      .references(() => trainers.id, { onDelete: "cascade" }),
    fullName: text("full_name").notNull(),
    phone: text("phone"),
    email: text("email"),
    birthDate: date("birth_date"),
    goals: text("goals"),
    notes: text("notes"),
    // Special-category data under KVKK: only stored with explicit consent (see consents).
    healthNotes: text("health_notes"),
    notifyPrefs: jsonb("notify_prefs").$type<NotifyPrefs>().notNull().default({}),
    tags: text("tags").array().notNull().default(sql`'{}'::text[]`),
    status: clientStatusEnum("status").notNull().default("active"),
    source: clientSourceEnum("source").notNull().default("manual"),
    // Periodic measurements: remind every N days after the last one (null = off);
    // the day the last reminder went out keeps the cron to one per period.
    measureEveryDays: smallint("measure_every_days"),
    measureRemindedOn: date("measure_reminded_on"),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    check("clients_measure_every_days", sql`${t.measureEveryDays} is null or ${t.measureEveryDays} between 7 and 180`),
    unique("clients_id_trainer_key").on(t.id, t.trainerId),
    index("clients_trainer_phone_idx").on(t.trainerId, t.phone),
    index("clients_trainer_idx").on(t.trainerId, t.archivedAt),
    ownRows("clients_own", t.trainerId),
  ],
);

export const packageTemplates = pgTable(
  "package_templates",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    trainerId: uuid("trainer_id")
      .notNull()
      .references(() => trainers.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    sessionType: sessionTypeEnum("session_type").notNull().default("private"),
    sessionCount: smallint("session_count").notNull(),
    // null = no expiry
    validityDays: smallint("validity_days"),
    // Paid at once (peşin).
    price: money("price"),
    // Optional "was" price shown struck through next to `price`.
    compareAtPrice: money("compare_at_price"),
    // Total when paid in `installments` monthly parts; null = no installment option.
    installmentPrice: money("installment_price"),
    // How many lessons may be cancelled late without burning a credit.
    makeupAllowance: smallint("makeup_allowance").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    // Listed on the trainer's public page (when active).
    isPublic: boolean("is_public").notNull().default(true),
    description: text("description"),
    // Bullet points on the public package card, e.g. "Haftada 2 ders".
    features: text("features").array().notNull().default(sql`'{}'::text[]`),
    sortOrder: smallint("sort_order").notNull().default(0),
    // A trial ("deneme dersi"): shown first on the public page, one per person.
    isTrial: boolean("is_trial").notNull().default(false),
    // Monthly installments of the installment option (1 = cash only).
    installments: smallint("installments").notNull().default(1),
    ...timestamps,
    // Studios: the package can only be used with these instructors (null = anyone).
    instructorIds: uuid("instructor_ids").array(),
  },
  (t) => [
    check("package_templates_installments_range", sql`${t.installments} between 1 and 12`),
    check("package_templates_installment_option", sql`(${t.installments} = 1) = (${t.installmentPrice} is null)`),
    check("package_templates_compare_at_higher", sql`${t.compareAtPrice} is null or ${t.compareAtPrice} > ${t.price}`),
    unique("package_templates_id_trainer_key").on(t.id, t.trainerId),
    index("package_templates_trainer_idx").on(t.trainerId),
    ownRows("package_templates_own", t.trainerId),
  ],
);

export const clientPackages = pgTable(
  "client_packages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    trainerId: uuid("trainer_id").notNull(),
    clientId: uuid("client_id").notNull(),
    templateId: uuid("template_id"),
    // Snapshot of the template at sale time, so editing a template never rewrites history.
    name: text("name").notNull(),
    sessionType: sessionTypeEnum("session_type").notNull(),
    totalSessions: smallint("total_sessions").notNull(),
    startsOn: date("starts_on").notNull(),
    // null = no expiry. Freezes extend this; see client_package_balances.
    expiresOn: date("expires_on"),
    price: money("price").notNull().default("0"),
    makeupAllowance: smallint("makeup_allowance").notNull().default(0),
    // Payment plan, see src/lib/installments.ts.
    installments: smallint("installments").notNull().default(1),
    status: packageStatusEnum("status").notNull().default("active"),
    notes: text("notes"),
    // When the client was told this package is running out (renewal offer sent once).
    renewalOfferedAt: timestamp("renewal_offered_at", { withTimezone: true }),
    // Installment reminders already sent: the highest installment number told
    // "yarın" and told "gecikti", so each goes out once.
    installmentRemindedSeq: smallint("installment_reminded_seq").notNull().default(0),
    installmentLateRemindedSeq: smallint("installment_late_reminded_seq").notNull().default(0),
    ...timestamps,
    // Copied from the template when sold; null = usable with any instructor.
    instructorIds: uuid("instructor_ids").array(),
  },
  (t) => [
    check("client_packages_installments_range", sql`${t.installments} between 1 and 12`),
    unique("client_packages_id_trainer_key").on(t.id, t.trainerId),
    unique("client_packages_id_client_key").on(t.id, t.clientId),
    foreignKey({ name: "client_packages_client_fk", columns: [t.clientId, t.trainerId], foreignColumns: [clients.id, clients.trainerId] }).onDelete(
      "cascade",
    ),
    foreignKey({
      name: "client_packages_template_fk",
      columns: [t.templateId, t.trainerId],
      foreignColumns: [packageTemplates.id, packageTemplates.trainerId],
    }),
    index("client_packages_client_idx").on(t.clientId),
    index("client_packages_trainer_idx").on(t.trainerId, t.status),
    ownRows("client_packages_own", t.trainerId),
  ],
);

export const packageFreezes = pgTable(
  "package_freezes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    trainerId: uuid("trainer_id").notNull(),
    clientPackageId: uuid("client_package_id").notNull(),
    startsOn: date("starts_on").notNull(),
    endsOn: date("ends_on").notNull(),
    reason: text("reason"),
    ...timestamps,
  },
  (t) => [
    foreignKey({
      name: "package_freezes_package_fk",
      columns: [t.clientPackageId, t.trainerId],
      foreignColumns: [clientPackages.id, clientPackages.trainerId],
    }).onDelete("cascade"),
    index("package_freezes_package_idx").on(t.clientPackageId),
    ownRows("package_freezes_own", t.trainerId),
  ],
);

// A recurring slot ("every Tue/Thu 10:00"). Concrete lessons are generated
// from it, so each occurrence can be moved or cancelled on its own.
export const lessonSeries = pgTable(
  "lesson_series",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    trainerId: uuid("trainer_id")
      .notNull()
      .references(() => trainers.id, { onDelete: "cascade" }),
    title: text("title"),
    sessionType: sessionTypeEnum("session_type").notNull(),
    // ISO weekdays, 1 = Monday ... 7 = Sunday
    weekdays: smallint("weekdays").array().notNull(),
    startTime: text("start_time").notNull(), // "HH:MM" in the trainer's timezone
    durationMinutes: smallint("duration_minutes").notNull().default(60),
    startsOn: date("starts_on").notNull(),
    endsOn: date("ends_on"),
    ...timestamps,
    // Who teaches it (a member of the account). Filled with the owner by a
    // trigger when left out, so a trainer working alone never has to set it.
    instructorId: uuid("instructor_id"),
  },
  (t) => [
    unique("lesson_series_id_trainer_key").on(t.id, t.trainerId),
    ownRows("lesson_series_own", t.trainerId),
    foreignKey({ name: "lesson_series_instructor_fk", columns: [t.instructorId, t.trainerId], foreignColumns: [accountMembers.id, accountMembers.accountId] }),
  ],
);

// A weekly group class ("Grup Reformer, Tue/Thu 18:00, 8 places"). Its
// occurrences are materialised as lessons a few weeks ahead (see
// src/db/groups.ts), so each one can be moved, cancelled or filled on its own.
export const groupClasses = pgTable(
  "group_classes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    trainerId: uuid("trainer_id")
      .notNull()
      .references(() => trainers.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    // ISO weekdays, 1 = Monday ... 7 = Sunday
    weekdays: smallint("weekdays").array().notNull(),
    startTime: text("start_time").notNull(), // "HH:MM" in the trainer's timezone
    durationMinutes: smallint("duration_minutes").notNull().default(60),
    capacity: smallint("capacity").notNull(),
    joinMode: groupJoinModeEnum("join_mode").notNull().default("both"),
    startsOn: date("starts_on").notNull(),
    // Set when the trainer ends the class; no occurrences after it.
    endsOn: date("ends_on"),
    ...timestamps,
    // Who teaches it (a member of the account). Filled with the owner by a
    // trigger when left out, so a trainer working alone never has to set it.
    instructorId: uuid("instructor_id"),
  },
  (t) => [
    check("group_classes_capacity_range", sql`${t.capacity} between 1 and 100`),
    unique("group_classes_id_trainer_key").on(t.id, t.trainerId),
    ownRows("group_classes_own", t.trainerId),
    foreignKey({ name: "group_classes_instructor_fk", columns: [t.instructorId, t.trainerId], foreignColumns: [accountMembers.id, accountMembers.accountId] }),
  ],
);

// Clients holding a fixed weekly place in a group class.
export const groupClassMembers = pgTable(
  "group_class_members",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    trainerId: uuid("trainer_id").notNull(),
    groupClassId: uuid("group_class_id").notNull(),
    clientId: uuid("client_id").notNull(),
    startsOn: date("starts_on").notNull(),
    endedAt: timestamp("ended_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    foreignKey({
      name: "group_class_members_class_fk",
      columns: [t.groupClassId, t.trainerId],
      foreignColumns: [groupClasses.id, groupClasses.trainerId],
    }).onDelete("cascade"),
    foreignKey({
      name: "group_class_members_client_fk",
      columns: [t.clientId, t.trainerId],
      foreignColumns: [clients.id, clients.trainerId],
    }).onDelete("cascade"),
    index("group_class_members_class_idx").on(t.groupClassId),
    ownRows("group_class_members_own", t.trainerId),
  ],
);

export const lessons = pgTable(
  "lessons",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    trainerId: uuid("trainer_id")
      .notNull()
      .references(() => trainers.id, { onDelete: "cascade" }),
    seriesId: uuid("series_id"),
    title: text("title"),
    sessionType: sessionTypeEnum("session_type").notNull(),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
    location: text("location"),
    notes: text("notes"),
    status: lessonStatusEnum("status").notNull().default("scheduled"),
    // Booked by the client from their portal rather than planned by the trainer.
    bookedByClient: boolean("booked_by_client").notNull().default(false),
    // Group class occurrences: the class, the date it was generated for (kept
    // when the lesson is moved, so it isn't generated again) and its places.
    groupClassId: uuid("group_class_id"),
    occurrenceDate: date("occurrence_date"),
    capacity: smallint("capacity"),
    ...timestamps,
    // Who teaches it (a member of the account). Filled with the owner by a
    // trigger when left out, so a trainer working alone never has to set it.
    instructorId: uuid("instructor_id"),
  },
  (t) => [
    unique("lessons_id_trainer_key").on(t.id, t.trainerId),
    unique("lessons_group_occurrence_key").on(t.groupClassId, t.occurrenceDate),
    foreignKey({
      name: "lessons_group_class_fk",
      columns: [t.groupClassId, t.trainerId],
      foreignColumns: [groupClasses.id, groupClasses.trainerId],
    }),
    foreignKey({ name: "lessons_series_fk", columns: [t.seriesId, t.trainerId], foreignColumns: [lessonSeries.id, lessonSeries.trainerId] }).onDelete(
      "set null",
    ),
    index("lessons_trainer_starts_idx").on(t.trainerId, t.startsAt),
    ownRows("lessons_own", t.trainerId),
    foreignKey({ name: "lessons_instructor_fk", columns: [t.instructorId, t.trainerId], foreignColumns: [accountMembers.id, accountMembers.accountId] }),
    index("lessons_instructor_starts_idx").on(t.instructorId, t.startsAt),
  ],
);

export const lessonAttendees = pgTable(
  "lesson_attendees",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    trainerId: uuid("trainer_id").notNull(),
    lessonId: uuid("lesson_id").notNull(),
    clientId: uuid("client_id").notNull(),
    // Package the credit is taken from. null = paid per lesson / not tracked.
    clientPackageId: uuid("client_package_id"),
    status: attendanceStatusEnum("status").notNull().default("scheduled"),
    // Single source of truth for package balances.
    consumesCredit: boolean("consumes_credit")
      .notNull()
      .generatedAlwaysAs(
        sql`status in ('attended', 'no_show') or (status = 'late_cancel' and not makeup_used)`,
      ),
    // A late cancel forgiven against the package's makeup allowance.
    makeupUsed: boolean("makeup_used").notNull().default(false),
    note: text("note"),
    markedAt: timestamp("marked_at", { withTimezone: true }),
    // "Geliyor musun?": the client confirmed from their page; the reminder is sent once.
    confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
    reminderSentAt: timestamp("reminder_sent_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    unique("lesson_attendees_lesson_client_key").on(t.lessonId, t.clientId),
    foreignKey({ name: "lesson_attendees_lesson_fk", columns: [t.lessonId, t.trainerId], foreignColumns: [lessons.id, lessons.trainerId] }).onDelete(
      "cascade",
    ),
    foreignKey({ name: "lesson_attendees_client_fk", columns: [t.clientId, t.trainerId], foreignColumns: [clients.id, clients.trainerId] }).onDelete(
      "cascade",
    ),
    // Package must belong to the same client. No ON DELETE action: packages
    // are cancelled, never deleted (SET NULL would also null client_id here).
    foreignKey({
      name: "lesson_attendees_package_fk",
      columns: [t.clientPackageId, t.clientId],
      foreignColumns: [clientPackages.id, clientPackages.clientId],
    }),
    index("lesson_attendees_client_idx").on(t.clientId),
    index("lesson_attendees_package_idx").on(t.clientPackageId),
    ownRows("lesson_attendees_own", t.trainerId),
  ],
);

export const payments = pgTable(
  "payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    trainerId: uuid("trainer_id").notNull(),
    clientId: uuid("client_id").notNull(),
    clientPackageId: uuid("client_package_id"),
    amount: money("amount").notNull(),
    method: paymentMethodEnum("method").notNull().default("cash"),
    paidOn: date("paid_on").notNull().default(sql`current_date`),
    note: text("note"),
    status: paymentStatusEnum("status").notNull().default("confirmed"),
    reportedBy: paymentReporterEnum("reported_by").notNull().default("trainer"),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    rejectReason: text("reject_reason"),
    ...timestamps,
  },
  (t) => [
    index("payments_trainer_status_idx").on(t.trainerId, t.status),
    foreignKey({ name: "payments_client_fk", columns: [t.clientId, t.trainerId], foreignColumns: [clients.id, clients.trainerId] }).onDelete(
      "cascade",
    ),
    foreignKey({
      name: "payments_package_fk",
      columns: [t.clientPackageId, t.clientId],
      foreignColumns: [clientPackages.id, clientPackages.clientId],
    }),
    index("payments_trainer_paid_idx").on(t.trainerId, t.paidOn),
    index("payments_package_idx").on(t.clientPackageId),
    ownerRows("payments_own", t.trainerId),
  ],
);

const bytea = customType<{ data: Buffer; driverData: Buffer }>({ dataType: () => "bytea" });

// Transfer receipts uploaded by clients. Kept in Postgres (RLS applies) rather
// than storage, so signed-out clients can attach one without a public bucket.
export const paymentReceipts = pgTable(
  "payment_receipts",
  {
    paymentId: uuid("payment_id")
      .primaryKey()
      .references(() => payments.id, { onDelete: "cascade" }),
    trainerId: uuid("trainer_id").notNull(),
    mimeType: text("mime_type").notNull(),
    size: integer("size").notNull(),
    data: bytea("data").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [ownerRows("payment_receipts_own", t.trainerId)],
);

// Read-only client portal links. Only the SHA-256 hash of the token is stored.
export const portalTokens = pgTable(
  "portal_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    trainerId: uuid("trainer_id").notNull(),
    clientId: uuid("client_id").notNull(),
    tokenHash: text("token_hash").notNull().unique(),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    foreignKey({ name: "portal_tokens_client_fk", columns: [t.clientId, t.trainerId], foreignColumns: [clients.id, clients.trainerId] }).onDelete(
      "cascade",
    ),
    ownRows("portal_tokens_own", t.trainerId),
  ],
);

// A sign-up from the trainer's public page: who and which package. Answers to
// the trainer's own questions live in intake_answers. Approving it activates
// the client and creates their package.
export const applications = pgTable(
  "applications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    trainerId: uuid("trainer_id").notNull(),
    clientId: uuid("client_id").notNull(),
    templateId: uuid("template_id").notNull(),
    // Set on approval.
    clientPackageId: uuid("client_package_id"),
    status: applicationStatusEnum("status").notNull().default("pending"),
    // Free-text note from the sign-up form.
    message: text("message"),
    // Payment option the applicant picked: 1 = cash price, >1 = the template's installment plan.
    installments: smallint("installments").notNull().default(1),
    decidedAt: timestamp("decided_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    foreignKey({ name: "applications_client_fk", columns: [t.clientId, t.trainerId], foreignColumns: [clients.id, clients.trainerId] }).onDelete(
      "cascade",
    ),
    foreignKey({
      name: "applications_template_fk",
      columns: [t.templateId, t.trainerId],
      foreignColumns: [packageTemplates.id, packageTemplates.trainerId],
    }),
    foreignKey({
      name: "applications_package_fk",
      columns: [t.clientPackageId, t.trainerId],
      foreignColumns: [clientPackages.id, clientPackages.trainerId],
    }),
    index("applications_trainer_status_idx").on(t.trainerId, t.status, t.createdAt),
    ownRows("applications_own", t.trainerId),
  ],
);

// Weekly working hours clients can book into, e.g. Monday 09:00–13:00.
// Minutes from midnight in the trainer's timezone.
export const availabilityRules = pgTable(
  "availability_rules",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    trainerId: uuid("trainer_id")
      .notNull()
      .references(() => trainers.id, { onDelete: "cascade" }),
    weekday: smallint("weekday").notNull(), // ISO: 1 = Monday … 7 = Sunday
    startMinute: smallint("start_minute").notNull(),
    endMinute: smallint("end_minute").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    // Whose hours these are (a member); the owner's when left out.
    instructorId: uuid("instructor_id"),
  },
  (t) => [
    check("availability_rules_weekday", sql`${t.weekday} between 1 and 7`),
    check("availability_rules_range", sql`${t.startMinute} >= 0 and ${t.endMinute} <= 1440 and ${t.endMinute} > ${t.startMinute}`),
    index("availability_rules_trainer_idx").on(t.trainerId, t.weekday),
    ownRows("availability_rules_own", t.trainerId),
    foreignKey({ name: "availability_rules_instructor_fk", columns: [t.instructorId, t.trainerId], foreignColumns: [accountMembers.id, accountMembers.accountId] }),
  ],
);

// Whole days the trainer isn't available (holiday, sick day), inclusive.
export const timeOff = pgTable(
  "time_off",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    trainerId: uuid("trainer_id")
      .notNull()
      .references(() => trainers.id, { onDelete: "cascade" }),
    startsOn: date("starts_on").notNull(),
    endsOn: date("ends_on").notNull(),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    // Whose hours these are (a member); the owner's when left out.
    instructorId: uuid("instructor_id"),
  },
  (t) => [
    check("time_off_range", sql`${t.endsOn} >= ${t.startsOn}`),
    index("time_off_trainer_idx").on(t.trainerId, t.endsOn),
    ownRows("time_off_own", t.trainerId),
    foreignKey({ name: "time_off_instructor_fk", columns: [t.instructorId, t.trainerId], foreignColumns: [accountMembers.id, accountMembers.accountId] }),
  ],
);

// Questions the trainer asks on their sign-up form (beyond name, phone and
// email, which every form has).
export const intakeFields = pgTable(
  "intake_fields",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    trainerId: uuid("trainer_id")
      .notNull()
      .references(() => trainers.id, { onDelete: "cascade" }),
    label: text("label").notNull(),
    type: intakeFieldTypeEnum("type").notNull(),
    helpText: text("help_text"),
    // number fields
    unit: text("unit"),
    min: numeric("min"),
    max: numeric("max"),
    // single_choice / multi_choice
    options: text("options").array().notNull().default(sql`'{}'::text[]`),
    required: boolean("required").notNull().default(false),
    // Health data under KVKK: only asked (and only required) when the client
    // gives explicit consent on the form.
    isHealth: boolean("is_health").notNull().default(false),
    sortOrder: smallint("sort_order").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    ...timestamps,
  },
  (t) => [
    unique("intake_fields_id_trainer_key").on(t.id, t.trainerId),
    index("intake_fields_trainer_idx").on(t.trainerId, t.sortOrder),
    ownRows("intake_fields_own", t.trainerId),
  ],
);

// A client's answer to one intake question. Label and unit are copied at
// answer time so history stays readable after the trainer edits the form.
export const intakeAnswers = pgTable(
  "intake_answers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    trainerId: uuid("trainer_id").notNull(),
    clientId: uuid("client_id").notNull(),
    // null once the trainer deletes the question
    fieldId: uuid("field_id"),
    applicationId: uuid("application_id"),
    label: text("label").notNull(),
    type: intakeFieldTypeEnum("type").notNull(),
    unit: text("unit"),
    isHealth: boolean("is_health").notNull().default(false),
    valueText: text("value_text"),
    valueNumber: numeric("value_number"),
    valueDate: date("value_date"),
    valueOptions: text("value_options").array(),
    valueBool: boolean("value_bool"),
    sortOrder: smallint("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    foreignKey({ name: "intake_answers_client_fk", columns: [t.clientId, t.trainerId], foreignColumns: [clients.id, clients.trainerId] }).onDelete(
      "cascade",
    ),
    foreignKey({ name: "intake_answers_field_fk", columns: [t.fieldId], foreignColumns: [intakeFields.id] }).onDelete("set null"),
    foreignKey({ name: "intake_answers_application_fk", columns: [t.applicationId], foreignColumns: [applications.id] }).onDelete(
      "set null",
    ),
    index("intake_answers_client_idx").on(t.clientId),
    ownRows("intake_answers_own", t.trainerId),
  ],
);

// KVKK consent log: which text version the client agreed to, and when.
export const messageSenderEnum = pgEnum("message_sender", ["trainer", "client"]);

// Trainer ↔ client chat, one thread per client.
export const messages = pgTable(
  "messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    trainerId: uuid("trainer_id").notNull(),
    clientId: uuid("client_id").notNull(),
    sender: messageSenderEnum("sender").notNull(),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    // Set when the other side has seen it.
    readAt: timestamp("read_at", { withTimezone: true }),
    // Which member wrote a trainer-side message (studios show the name).
    senderMemberId: uuid("sender_member_id"),
  },
  (t) => [
    check("messages_body_length", sql`char_length(${t.body}) between 1 and 2000`),
    foreignKey({ name: "messages_client_fk", columns: [t.clientId, t.trainerId], foreignColumns: [clients.id, clients.trainerId] }).onDelete(
      "cascade",
    ),
    index("messages_thread_idx").on(t.clientId, t.createdAt),
    index("messages_trainer_unread_idx").on(t.trainerId, t.sender, t.readAt),
    ownRows("messages_own", t.trainerId),
    foreignKey({ name: "messages_sender_member_fk", columns: [t.senderMemberId, t.trainerId], foreignColumns: [accountMembers.id, accountMembers.accountId] }),
  ],
);

// Web Push subscriptions: the trainer's devices (client_id null) and clients' devices (from their portal).
export const pushSubscriptions = pgTable(
  "push_subscriptions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    trainerId: uuid("trainer_id")
      .notNull()
      .references(() => trainers.id, { onDelete: "cascade" }),
    clientId: uuid("client_id"),
    endpoint: text("endpoint").notNull().unique(),
    p256dh: text("p256dh").notNull(),
    auth: text("auth").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    // The member whose device this is (null for a client's device).
    memberId: uuid("member_id").references(() => accountMembers.id, { onDelete: "cascade" }),
  },
  (t) => [
    foreignKey({ name: "push_subscriptions_client_fk", columns: [t.clientId, t.trainerId], foreignColumns: [clients.id, clients.trainerId] }).onDelete(
      "cascade",
    ),
    index("push_subscriptions_owner_idx").on(t.trainerId, t.clientId),
    ownRows("push_subscriptions_own", t.trainerId),
  ],
);

// Dated notes on a client: general, or about one lesson (written from the
// attendance list). Private unless the trainer lets the client see it.
export const clientNotes = pgTable(
  "client_notes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    trainerId: uuid("trainer_id").notNull(),
    clientId: uuid("client_id").notNull(),
    lessonId: uuid("lesson_id").references(() => lessons.id, { onDelete: "set null" }),
    body: text("body").notNull(),
    visibleToClient: boolean("visible_to_client").notNull().default(false),
    ...timestamps,
  },
  (t) => [
    check("client_notes_body_length", sql`char_length(${t.body}) between 1 and 2000`),
    foreignKey({ name: "client_notes_client_fk", columns: [t.clientId, t.trainerId], foreignColumns: [clients.id, clients.trainerId] }).onDelete(
      "cascade",
    ),
    index("client_notes_client_idx").on(t.clientId, t.createdAt),
    ownRows("client_notes_own", t.trainerId),
  ],
);

// The trainer's own metrics next to the built-in ones (e.g. "Plank süresi", sn).
export const measurementTypes = pgTable(
  "measurement_types",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    trainerId: uuid("trainer_id")
      .notNull()
      .references(() => trainers.id, { onDelete: "cascade" }),
    label: text("label").notNull(),
    unit: text("unit").notNull().default(""),
    decimals: smallint("decimals").notNull().default(1),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    check("measurement_types_label_length", sql`char_length(${t.label}) between 1 and 40`),
    check("measurement_types_unit_length", sql`char_length(${t.unit}) <= 12`),
    check("measurement_types_decimals", sql`${t.decimals} between 0 and 2`),
    ownRows("measurement_types_own", t.trainerId),
  ],
);

// Body measurements and other tracked values. Health data under KVKK: only
// written for clients with a health_data consent. `metric` is a built-in key
// (src/lib/measurements.ts) or a measurement_types id. One value per metric per day.
export const measurements = pgTable(
  "measurements",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    trainerId: uuid("trainer_id").notNull(),
    clientId: uuid("client_id").notNull(),
    metric: text("metric").notNull(),
    measuredOn: date("measured_on").notNull(),
    value: numeric("value", { precision: 8, scale: 2 }).notNull(),
    source: measurementSourceEnum("source").notNull().default("trainer"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    check("measurements_metric_length", sql`char_length(${t.metric}) between 1 and 40`),
    foreignKey({ name: "measurements_client_fk", columns: [t.clientId, t.trainerId], foreignColumns: [clients.id, clients.trainerId] }).onDelete(
      "cascade",
    ),
    unique("measurements_one_per_day").on(t.clientId, t.metric, t.measuredOn),
    index("measurements_client_idx").on(t.clientId, t.measuredOn),
    ownRows("measurements_own", t.trainerId),
  ],
);

// The trainer's exercise library (seeded with common Turkish names on first use).
export const exercises = pgTable(
  "exercises",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    trainerId: uuid("trainer_id")
      .notNull()
      .references(() => trainers.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    category: text("category"),
    videoUrl: text("video_url"),
    note: text("note"),
    // Muscle groups for the body figure (keys in src/lib/muscles.ts).
    primaryMuscles: text("primary_muscles").array().notNull().default(sql`'{}'::text[]`),
    secondaryMuscles: text("secondary_muscles").array().notNull().default(sql`'{}'::text[]`),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    check("exercises_name_length", sql`char_length(${t.name}) between 1 and 80`),
    check("exercises_video_url", sql`${t.videoUrl} is null or ${t.videoUrl} ~ '^https://'`),
    index("exercises_trainer_idx").on(t.trainerId),
    ownRows("exercises_own", t.trainerId),
  ],
);

// Workout and nutrition programs. client_id null = a template; a client's
// program is a copy, so editing the template never changes what a client has.
// Days are workout days (or meals); items are exercises (or the meal's lines).
export const programs = pgTable(
  "programs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    trainerId: uuid("trainer_id")
      .notNull()
      .references(() => trainers.id, { onDelete: "cascade" }),
    clientId: uuid("client_id"),
    kind: programKindEnum("kind").notNull().default("workout"),
    name: text("name").notNull(),
    note: text("note"),
    // Nutrition: daily targets such as { water: "2,5 litre", protein: "110 g" }.
    targets: jsonb("targets").$type<Record<string, string>>().notNull().default({}),
    startsOn: date("starts_on"),
    // Set when the trainer sends it; the client sees it only after that.
    sentAt: timestamp("sent_at", { withTimezone: true }),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    check("programs_name_length", sql`char_length(${t.name}) between 1 and 80`),
    foreignKey({ name: "programs_client_fk", columns: [t.clientId, t.trainerId], foreignColumns: [clients.id, clients.trainerId] }).onDelete(
      "cascade",
    ),
    index("programs_client_idx").on(t.clientId, t.kind),
    ownRows("programs_own", t.trainerId),
  ],
);

export const programDays = pgTable(
  "program_days",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    trainerId: uuid("trainer_id").notNull(),
    programId: uuid("program_id")
      .notNull()
      .references(() => programs.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    sortOrder: smallint("sort_order").notNull().default(0),
  },
  (t) => [
    check("program_days_title_length", sql`char_length(${t.title}) between 1 and 60`),
    index("program_days_program_idx").on(t.programId, t.sortOrder),
    ownRows("program_days_own", t.trainerId),
  ],
);

export const programItems = pgTable(
  "program_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    trainerId: uuid("trainer_id").notNull(),
    dayId: uuid("day_id")
      .notNull()
      .references(() => programDays.id, { onDelete: "cascade" }),
    exerciseId: uuid("exercise_id").references(() => exercises.id, { onDelete: "set null" }),
    // Copied from the exercise so later library edits don't rewrite programs.
    name: text("name").notNull(),
    sets: smallint("sets"),
    reps: text("reps"),
    load: text("load"),
    rest: text("rest"),
    note: text("note"),
    sortOrder: smallint("sort_order").notNull().default(0),
  },
  (t) => [
    check("program_items_name_length", sql`char_length(${t.name}) between 1 and 300`),
    check("program_items_sets", sql`${t.sets} is null or ${t.sets} between 1 and 50`),
    index("program_items_day_idx").on(t.dayId, t.sortOrder),
    ownRows("program_items_own", t.trainerId),
  ],
);

// "Bugünkü antrenmanı yaptım" from the client's page: one per day of the program per date.
export const programCheckins = pgTable(
  "program_checkins",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    trainerId: uuid("trainer_id").notNull(),
    clientId: uuid("client_id").notNull(),
    programId: uuid("program_id")
      .notNull()
      .references(() => programs.id, { onDelete: "cascade" }),
    dayId: uuid("day_id")
      .notNull()
      .references(() => programDays.id, { onDelete: "cascade" }),
    doneOn: date("done_on").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique("program_checkins_once").on(t.dayId, t.doneOn),
    index("program_checkins_client_idx").on(t.clientId, t.doneOn),
    ownRows("program_checkins_own", t.trainerId),
  ],
);

// Messages to us: from the landing's contact form (no trainer; we answer by
// e-mail) or from a trainer inside the app (one ongoing thread, answered in the
// app). Trainers see only their own rows; /yonetim reads everything as owner.
export const supportThreads = pgTable(
  "support_threads",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    trainerId: uuid("trainer_id").references(() => trainers.id, { onDelete: "cascade" }),
    source: supportSourceEnum("source").notNull(),
    name: text("name").notNull(),
    email: text("email"),
    phone: text("phone"),
    closedAt: timestamp("closed_at", { withTimezone: true }),
    lastMessageAt: timestamp("last_message_at", { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    check("support_threads_name_length", sql`char_length(${t.name}) between 1 and 120`),
    index("support_threads_last_idx").on(t.lastMessageAt),
    unique("support_threads_one_per_trainer").on(t.trainerId),
    ownerRows("support_threads_own", t.trainerId),
  ],
);

export const supportMessages = pgTable(
  "support_messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    threadId: uuid("thread_id")
      .notNull()
      .references(() => supportThreads.id, { onDelete: "cascade" }),
    // Copied from the thread so RLS can scope the rows (null for landing threads).
    trainerId: uuid("trainer_id"),
    sender: supportSenderEnum("sender").notNull(),
    body: text("body").notNull(),
    // Set when the other side has seen it.
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    check("support_messages_body_length", sql`char_length(${t.body}) between 1 and 4000`),
    index("support_messages_thread_idx").on(t.threadId, t.createdAt),
    ownerRows("support_messages_own", t.trainerId),
  ],
);

export const consents = pgTable(
  "consents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    trainerId: uuid("trainer_id").notNull(),
    clientId: uuid("client_id").notNull(),
    kind: consentKindEnum("kind").notNull(),
    textVersion: text("text_version").notNull(),
    grantedAt: timestamp("granted_at", { withTimezone: true }).notNull().defaultNow(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
  },
  (t) => [
    foreignKey({ name: "consents_client_fk", columns: [t.clientId, t.trainerId], foreignColumns: [clients.id, clients.trainerId] }).onDelete(
      "cascade",
    ),
    index("consents_client_idx").on(t.clientId, t.kind),
    ownRows("consents_own", t.trainerId),
  ],
);

// Derived package state. Created in a custom migration (security_invoker, so
// the underlying tables' RLS applies to whoever queries it).
export const clientPackageBalances = pgView("client_package_balances", {
  clientPackageId: uuid("client_package_id").notNull(),
  trainerId: uuid("trainer_id").notNull(),
  clientId: uuid("client_id").notNull(),
  usedSessions: integer("used_sessions").notNull(),
  remainingSessions: integer("remaining_sessions").notNull(),
  scheduledSessions: integer("scheduled_sessions").notNull(),
  makeupsUsed: integer("makeups_used").notNull(),
  effectiveExpiresOn: date("effective_expires_on"),
  paidAmount: money("paid_amount").notNull(),
  dueAmount: money("due_amount").notNull(),
  // Installments due on or before today that aren't paid yet (what should be collected now).
  overdueAmount: money("overdue_amount").notNull(),
  installments: integer("installments").notNull(),
  isFrozen: boolean("is_frozen").notNull(),
  // 'active' | 'frozen' | 'finished' | 'expired' | 'cancelled'
  state: text("state").notNull(),
}).existing();
