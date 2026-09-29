CREATE TYPE "public"."application_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."client_source" AS ENUM('manual', 'public_page');--> statement-breakpoint
CREATE TYPE "public"."client_status" AS ENUM('applicant', 'active');--> statement-breakpoint
CREATE TYPE "public"."intake_field_type" AS ENUM('short_text', 'long_text', 'number', 'date', 'single_choice', 'multi_choice', 'yes_no');--> statement-breakpoint
CREATE TABLE "applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trainer_id" uuid NOT NULL,
	"client_id" uuid NOT NULL,
	"template_id" uuid NOT NULL,
	"client_package_id" uuid,
	"status" "application_status" DEFAULT 'pending' NOT NULL,
	"message" text,
	"decided_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "applications" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "intake_answers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trainer_id" uuid NOT NULL,
	"client_id" uuid NOT NULL,
	"field_id" uuid,
	"application_id" uuid,
	"label" text NOT NULL,
	"type" "intake_field_type" NOT NULL,
	"unit" text,
	"is_health" boolean DEFAULT false NOT NULL,
	"value_text" text,
	"value_number" numeric,
	"value_date" date,
	"value_options" text[],
	"value_bool" boolean,
	"sort_order" smallint DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "intake_answers" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "intake_fields" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trainer_id" uuid NOT NULL,
	"label" text NOT NULL,
	"type" "intake_field_type" NOT NULL,
	"help_text" text,
	"unit" text,
	"min" numeric,
	"max" numeric,
	"options" text[] DEFAULT '{}'::text[] NOT NULL,
	"required" boolean DEFAULT false NOT NULL,
	"is_health" boolean DEFAULT false NOT NULL,
	"sort_order" smallint DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "intake_fields_id_trainer_key" UNIQUE("id","trainer_id")
);
--> statement-breakpoint
ALTER TABLE "intake_fields" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "status" "client_status" DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "source" "client_source" DEFAULT 'manual' NOT NULL;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_client_fk" FOREIGN KEY ("client_id","trainer_id") REFERENCES "public"."clients"("id","trainer_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_template_fk" FOREIGN KEY ("template_id","trainer_id") REFERENCES "public"."package_templates"("id","trainer_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_package_fk" FOREIGN KEY ("client_package_id","trainer_id") REFERENCES "public"."client_packages"("id","trainer_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "intake_answers" ADD CONSTRAINT "intake_answers_client_fk" FOREIGN KEY ("client_id","trainer_id") REFERENCES "public"."clients"("id","trainer_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "intake_answers" ADD CONSTRAINT "intake_answers_field_fk" FOREIGN KEY ("field_id") REFERENCES "public"."intake_fields"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "intake_answers" ADD CONSTRAINT "intake_answers_application_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "intake_fields" ADD CONSTRAINT "intake_fields_trainer_id_trainers_id_fk" FOREIGN KEY ("trainer_id") REFERENCES "public"."trainers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "applications_trainer_status_idx" ON "applications" USING btree ("trainer_id","status","created_at");--> statement-breakpoint
CREATE INDEX "intake_answers_client_idx" ON "intake_answers" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "intake_fields_trainer_idx" ON "intake_fields" USING btree ("trainer_id","sort_order");--> statement-breakpoint
CREATE INDEX "clients_trainer_phone_idx" ON "clients" USING btree ("trainer_id","phone");--> statement-breakpoint
CREATE POLICY "applications_own" ON "applications" AS PERMISSIVE FOR ALL TO "authenticated" USING ("trainer_id" = (select auth.uid())) WITH CHECK ("trainer_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "intake_answers_own" ON "intake_answers" AS PERMISSIVE FOR ALL TO "authenticated" USING ("trainer_id" = (select auth.uid())) WITH CHECK ("trainer_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "intake_fields_own" ON "intake_fields" AS PERMISSIVE FOR ALL TO "authenticated" USING ("trainer_id" = (select auth.uid())) WITH CHECK ("trainer_id" = (select auth.uid()));