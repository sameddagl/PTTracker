CREATE TYPE "public"."attendance_status" AS ENUM('scheduled', 'attended', 'no_show', 'late_cancel', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."consent_kind" AS ENUM('kvkk_notice', 'health_data');--> statement-breakpoint
CREATE TYPE "public"."discipline" AS ENUM('pt', 'pilates', 'both');--> statement-breakpoint
CREATE TYPE "public"."lesson_status" AS ENUM('scheduled', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."package_status" AS ENUM('active', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('cash', 'bank_transfer', 'card', 'other');--> statement-breakpoint
CREATE TYPE "public"."session_type" AS ENUM('private', 'duet', 'trio', 'group');--> statement-breakpoint
CREATE TABLE "client_packages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trainer_id" uuid NOT NULL,
	"client_id" uuid NOT NULL,
	"template_id" uuid,
	"name" text NOT NULL,
	"session_type" "session_type" NOT NULL,
	"total_sessions" smallint NOT NULL,
	"starts_on" date NOT NULL,
	"expires_on" date,
	"price" numeric(12, 2) DEFAULT '0' NOT NULL,
	"makeup_allowance" smallint DEFAULT 0 NOT NULL,
	"status" "package_status" DEFAULT 'active' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "client_packages_id_trainer_key" UNIQUE("id","trainer_id"),
	CONSTRAINT "client_packages_id_client_key" UNIQUE("id","client_id")
);
--> statement-breakpoint
ALTER TABLE "client_packages" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "clients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trainer_id" uuid NOT NULL,
	"full_name" text NOT NULL,
	"phone" text,
	"email" text,
	"birth_date" date,
	"goals" text,
	"notes" text,
	"health_notes" text,
	"tags" text[] DEFAULT '{}'::text[] NOT NULL,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "clients_id_trainer_key" UNIQUE("id","trainer_id")
);
--> statement-breakpoint
ALTER TABLE "clients" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "consents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trainer_id" uuid NOT NULL,
	"client_id" uuid NOT NULL,
	"kind" "consent_kind" NOT NULL,
	"text_version" text NOT NULL,
	"granted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"revoked_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "consents" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "lesson_attendees" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trainer_id" uuid NOT NULL,
	"lesson_id" uuid NOT NULL,
	"client_id" uuid NOT NULL,
	"client_package_id" uuid,
	"status" "attendance_status" DEFAULT 'scheduled' NOT NULL,
	"consumes_credit" boolean GENERATED ALWAYS AS (status in ('attended', 'no_show') or (status = 'late_cancel' and not makeup_used)) STORED NOT NULL,
	"makeup_used" boolean DEFAULT false NOT NULL,
	"note" text,
	"marked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "lesson_attendees_lesson_client_key" UNIQUE("lesson_id","client_id")
);
--> statement-breakpoint
ALTER TABLE "lesson_attendees" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "lesson_series" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trainer_id" uuid NOT NULL,
	"title" text,
	"session_type" "session_type" NOT NULL,
	"weekdays" smallint[] NOT NULL,
	"start_time" text NOT NULL,
	"duration_minutes" smallint DEFAULT 60 NOT NULL,
	"starts_on" date NOT NULL,
	"ends_on" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "lesson_series_id_trainer_key" UNIQUE("id","trainer_id")
);
--> statement-breakpoint
ALTER TABLE "lesson_series" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "lessons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trainer_id" uuid NOT NULL,
	"series_id" uuid,
	"title" text,
	"session_type" "session_type" NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"location" text,
	"notes" text,
	"status" "lesson_status" DEFAULT 'scheduled' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "lessons_id_trainer_key" UNIQUE("id","trainer_id")
);
--> statement-breakpoint
ALTER TABLE "lessons" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "package_freezes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trainer_id" uuid NOT NULL,
	"client_package_id" uuid NOT NULL,
	"starts_on" date NOT NULL,
	"ends_on" date NOT NULL,
	"reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "package_freezes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "package_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trainer_id" uuid NOT NULL,
	"name" text NOT NULL,
	"session_type" "session_type" DEFAULT 'private' NOT NULL,
	"session_count" smallint NOT NULL,
	"validity_days" smallint,
	"price" numeric(12, 2),
	"makeup_allowance" smallint DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "package_templates_id_trainer_key" UNIQUE("id","trainer_id")
);
--> statement-breakpoint
ALTER TABLE "package_templates" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trainer_id" uuid NOT NULL,
	"client_id" uuid NOT NULL,
	"client_package_id" uuid,
	"amount" numeric(12, 2) NOT NULL,
	"method" "payment_method" DEFAULT 'cash' NOT NULL,
	"paid_on" date DEFAULT current_date NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "payments" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "portal_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trainer_id" uuid NOT NULL,
	"client_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"last_used_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "portal_tokens_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
ALTER TABLE "portal_tokens" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "trainers" (
	"id" uuid PRIMARY KEY NOT NULL,
	"full_name" text DEFAULT '' NOT NULL,
	"business_name" text,
	"phone" text,
	"discipline" "discipline" DEFAULT 'both' NOT NULL,
	"late_cancel_hours" smallint DEFAULT 24 NOT NULL,
	"timezone" text DEFAULT 'Europe/Istanbul' NOT NULL,
	"onboarded_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "trainers" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "client_packages" ADD CONSTRAINT "client_packages_client_id_trainer_id_clients_id_trainer_id_fk" FOREIGN KEY ("client_id","trainer_id") REFERENCES "public"."clients"("id","trainer_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_packages" ADD CONSTRAINT "client_packages_template_id_trainer_id_package_templates_id_trainer_id_fk" FOREIGN KEY ("template_id","trainer_id") REFERENCES "public"."package_templates"("id","trainer_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_trainer_id_trainers_id_fk" FOREIGN KEY ("trainer_id") REFERENCES "public"."trainers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consents" ADD CONSTRAINT "consents_client_id_trainer_id_clients_id_trainer_id_fk" FOREIGN KEY ("client_id","trainer_id") REFERENCES "public"."clients"("id","trainer_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_attendees" ADD CONSTRAINT "lesson_attendees_lesson_id_trainer_id_lessons_id_trainer_id_fk" FOREIGN KEY ("lesson_id","trainer_id") REFERENCES "public"."lessons"("id","trainer_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_attendees" ADD CONSTRAINT "lesson_attendees_client_id_trainer_id_clients_id_trainer_id_fk" FOREIGN KEY ("client_id","trainer_id") REFERENCES "public"."clients"("id","trainer_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_attendees" ADD CONSTRAINT "lesson_attendees_client_package_id_client_id_client_packages_id_client_id_fk" FOREIGN KEY ("client_package_id","client_id") REFERENCES "public"."client_packages"("id","client_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_series" ADD CONSTRAINT "lesson_series_trainer_id_trainers_id_fk" FOREIGN KEY ("trainer_id") REFERENCES "public"."trainers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_trainer_id_trainers_id_fk" FOREIGN KEY ("trainer_id") REFERENCES "public"."trainers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_series_id_trainer_id_lesson_series_id_trainer_id_fk" FOREIGN KEY ("series_id","trainer_id") REFERENCES "public"."lesson_series"("id","trainer_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "package_freezes" ADD CONSTRAINT "package_freezes_client_package_id_trainer_id_client_packages_id_trainer_id_fk" FOREIGN KEY ("client_package_id","trainer_id") REFERENCES "public"."client_packages"("id","trainer_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "package_templates" ADD CONSTRAINT "package_templates_trainer_id_trainers_id_fk" FOREIGN KEY ("trainer_id") REFERENCES "public"."trainers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_client_id_trainer_id_clients_id_trainer_id_fk" FOREIGN KEY ("client_id","trainer_id") REFERENCES "public"."clients"("id","trainer_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_client_package_id_client_id_client_packages_id_client_id_fk" FOREIGN KEY ("client_package_id","client_id") REFERENCES "public"."client_packages"("id","client_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portal_tokens" ADD CONSTRAINT "portal_tokens_client_id_trainer_id_clients_id_trainer_id_fk" FOREIGN KEY ("client_id","trainer_id") REFERENCES "public"."clients"("id","trainer_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trainers" ADD CONSTRAINT "trainers_id_users_id_fk" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "client_packages_client_idx" ON "client_packages" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "client_packages_trainer_idx" ON "client_packages" USING btree ("trainer_id","status");--> statement-breakpoint
CREATE INDEX "clients_trainer_idx" ON "clients" USING btree ("trainer_id","archived_at");--> statement-breakpoint
CREATE INDEX "consents_client_idx" ON "consents" USING btree ("client_id","kind");--> statement-breakpoint
CREATE INDEX "lesson_attendees_client_idx" ON "lesson_attendees" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "lesson_attendees_package_idx" ON "lesson_attendees" USING btree ("client_package_id");--> statement-breakpoint
CREATE INDEX "lessons_trainer_starts_idx" ON "lessons" USING btree ("trainer_id","starts_at");--> statement-breakpoint
CREATE INDEX "package_freezes_package_idx" ON "package_freezes" USING btree ("client_package_id");--> statement-breakpoint
CREATE INDEX "package_templates_trainer_idx" ON "package_templates" USING btree ("trainer_id");--> statement-breakpoint
CREATE INDEX "payments_trainer_paid_idx" ON "payments" USING btree ("trainer_id","paid_on");--> statement-breakpoint
CREATE INDEX "payments_package_idx" ON "payments" USING btree ("client_package_id");--> statement-breakpoint
CREATE POLICY "client_packages_own" ON "client_packages" AS PERMISSIVE FOR ALL TO "authenticated" USING ("trainer_id" = (select auth.uid())) WITH CHECK ("trainer_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "clients_own" ON "clients" AS PERMISSIVE FOR ALL TO "authenticated" USING ("trainer_id" = (select auth.uid())) WITH CHECK ("trainer_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "consents_own" ON "consents" AS PERMISSIVE FOR ALL TO "authenticated" USING ("trainer_id" = (select auth.uid())) WITH CHECK ("trainer_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "lesson_attendees_own" ON "lesson_attendees" AS PERMISSIVE FOR ALL TO "authenticated" USING ("trainer_id" = (select auth.uid())) WITH CHECK ("trainer_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "lesson_series_own" ON "lesson_series" AS PERMISSIVE FOR ALL TO "authenticated" USING ("trainer_id" = (select auth.uid())) WITH CHECK ("trainer_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "lessons_own" ON "lessons" AS PERMISSIVE FOR ALL TO "authenticated" USING ("trainer_id" = (select auth.uid())) WITH CHECK ("trainer_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "package_freezes_own" ON "package_freezes" AS PERMISSIVE FOR ALL TO "authenticated" USING ("trainer_id" = (select auth.uid())) WITH CHECK ("trainer_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "package_templates_own" ON "package_templates" AS PERMISSIVE FOR ALL TO "authenticated" USING ("trainer_id" = (select auth.uid())) WITH CHECK ("trainer_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "payments_own" ON "payments" AS PERMISSIVE FOR ALL TO "authenticated" USING ("trainer_id" = (select auth.uid())) WITH CHECK ("trainer_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "portal_tokens_own" ON "portal_tokens" AS PERMISSIVE FOR ALL TO "authenticated" USING ("trainer_id" = (select auth.uid())) WITH CHECK ("trainer_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "trainers_select_own" ON "trainers" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("trainers"."id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "trainers_update_own" ON "trainers" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ("trainers"."id" = (select auth.uid())) WITH CHECK ("trainers"."id" = (select auth.uid()));