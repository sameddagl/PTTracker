import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  customType,
  date,
  foreignKey,
  index,
  integer,
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
import { authenticatedRole, authUid, authUsers } from "drizzle-orm/supabase";

// Multi-tenancy: every row belongs to a trainer (trainer_id = auth.uid()).
// RLS enforces this per table, and composite foreign keys that include
// trainer_id stop a row from pointing at another trainer's data (FK checks
// bypass RLS, so this has to be a constraint).

export const disciplineEnum = pgEnum("discipline", ["pt", "pilates", "both"]);
export const sessionTypeEnum = pgEnum("session_type", ["private", "duet", "trio", "group"]);
export const packageStatusEnum = pgEnum("package_status", ["active", "cancelled"]);
export const lessonStatusEnum = pgEnum("lesson_status", ["scheduled", "cancelled"]);
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

const ownRows = (name: string, column: { name: string }) =>
  pgPolicy(name, {
    for: "all",
    to: authenticatedRole,
    using: sql`${sql.identifier(column.name)} = ${authUid}`,
    withCheck: sql`${sql.identifier(column.name)} = ${authUid}`,
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
    ...timestamps,
  },
  (t) => [
    check("trainers_slug_format", sql`${t.slug} ~ '^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$'`),
    // Rows are created by the on_auth_user_created trigger, never by the client.
    pgPolicy("trainers_select_own", { for: "select", to: authenticatedRole, using: sql`${t.id} = ${authUid}` }),
    pgPolicy("trainers_update_own", {
      for: "update",
      to: authenticatedRole,
      using: sql`${t.id} = ${authUid}`,
      withCheck: sql`${t.id} = ${authUid}`,
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
    tags: text("tags").array().notNull().default(sql`'{}'::text[]`),
    status: clientStatusEnum("status").notNull().default("active"),
    source: clientSourceEnum("source").notNull().default("manual"),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [
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
    price: money("price"),
    // How many lessons may be cancelled late without burning a credit.
    makeupAllowance: smallint("makeup_allowance").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    // Listed on the trainer's public page (when active).
    isPublic: boolean("is_public").notNull().default(true),
    description: text("description"),
    // Bullet points on the public package card, e.g. "Haftada 2 ders".
    features: text("features").array().notNull().default(sql`'{}'::text[]`),
    sortOrder: smallint("sort_order").notNull().default(0),
    // Monthly installments the price is split into (1 = paid at once).
    installments: smallint("installments").notNull().default(1),
    ...timestamps,
  },
  (t) => [
    check("package_templates_installments_range", sql`${t.installments} between 1 and 12`),
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
    ...timestamps,
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
  },
  (t) => [
    unique("lesson_series_id_trainer_key").on(t.id, t.trainerId),
    ownRows("lesson_series_own", t.trainerId),
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
    ...timestamps,
  },
  (t) => [
    unique("lessons_id_trainer_key").on(t.id, t.trainerId),
    foreignKey({ name: "lessons_series_fk", columns: [t.seriesId, t.trainerId], foreignColumns: [lessonSeries.id, lessonSeries.trainerId] }).onDelete(
      "set null",
    ),
    index("lessons_trainer_starts_idx").on(t.trainerId, t.startsAt),
    ownRows("lessons_own", t.trainerId),
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
    ownRows("payments_own", t.trainerId),
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
  (t) => [ownRows("payment_receipts_own", t.trainerId)],
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
