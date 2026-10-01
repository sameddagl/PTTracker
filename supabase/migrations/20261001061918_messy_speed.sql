CREATE TYPE "public"."measurement_source" AS ENUM('trainer', 'client');--> statement-breakpoint
CREATE TABLE "client_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trainer_id" uuid NOT NULL,
	"client_id" uuid NOT NULL,
	"lesson_id" uuid,
	"body" text NOT NULL,
	"visible_to_client" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "client_notes_body_length" CHECK (char_length("client_notes"."body") between 1 and 2000)
);
--> statement-breakpoint
ALTER TABLE "client_notes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "measurement_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trainer_id" uuid NOT NULL,
	"label" text NOT NULL,
	"unit" text DEFAULT '' NOT NULL,
	"decimals" smallint DEFAULT 1 NOT NULL,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "measurement_types_label_length" CHECK (char_length("measurement_types"."label") between 1 and 40),
	CONSTRAINT "measurement_types_unit_length" CHECK (char_length("measurement_types"."unit") <= 12),
	CONSTRAINT "measurement_types_decimals" CHECK ("measurement_types"."decimals" between 0 and 2)
);
--> statement-breakpoint
ALTER TABLE "measurement_types" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "measurements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trainer_id" uuid NOT NULL,
	"client_id" uuid NOT NULL,
	"metric" text NOT NULL,
	"measured_on" date NOT NULL,
	"value" numeric(8, 2) NOT NULL,
	"source" "measurement_source" DEFAULT 'trainer' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "measurements_one_per_day" UNIQUE("client_id","metric","measured_on"),
	CONSTRAINT "measurements_metric_length" CHECK (char_length("measurements"."metric") between 1 and 40)
);
--> statement-breakpoint
ALTER TABLE "measurements" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "trainers" ADD COLUMN "measure_metrics" text[];--> statement-breakpoint
ALTER TABLE "trainers" ADD COLUMN "clients_self_weigh" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "client_notes" ADD CONSTRAINT "client_notes_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_notes" ADD CONSTRAINT "client_notes_client_fk" FOREIGN KEY ("client_id","trainer_id") REFERENCES "public"."clients"("id","trainer_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "measurement_types" ADD CONSTRAINT "measurement_types_trainer_id_trainers_id_fk" FOREIGN KEY ("trainer_id") REFERENCES "public"."trainers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "measurements" ADD CONSTRAINT "measurements_client_fk" FOREIGN KEY ("client_id","trainer_id") REFERENCES "public"."clients"("id","trainer_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "client_notes_client_idx" ON "client_notes" USING btree ("client_id","created_at");--> statement-breakpoint
CREATE INDEX "measurements_client_idx" ON "measurements" USING btree ("client_id","measured_on");--> statement-breakpoint
CREATE POLICY "client_notes_own" ON "client_notes" AS PERMISSIVE FOR ALL TO "authenticated" USING ("trainer_id" = (select auth.uid())) WITH CHECK ("trainer_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "measurement_types_own" ON "measurement_types" AS PERMISSIVE FOR ALL TO "authenticated" USING ("trainer_id" = (select auth.uid())) WITH CHECK ("trainer_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "measurements_own" ON "measurements" AS PERMISSIVE FOR ALL TO "authenticated" USING ("trainer_id" = (select auth.uid())) WITH CHECK ("trainer_id" = (select auth.uid()));