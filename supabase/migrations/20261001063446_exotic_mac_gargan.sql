CREATE TYPE "public"."program_kind" AS ENUM('workout', 'nutrition');--> statement-breakpoint
CREATE TABLE "exercises" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trainer_id" uuid NOT NULL,
	"name" text NOT NULL,
	"category" text,
	"video_url" text,
	"note" text,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "exercises_name_length" CHECK (char_length("exercises"."name") between 1 and 80),
	CONSTRAINT "exercises_video_url" CHECK ("exercises"."video_url" is null or "exercises"."video_url" ~ '^https://')
);
--> statement-breakpoint
ALTER TABLE "exercises" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "program_checkins" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trainer_id" uuid NOT NULL,
	"client_id" uuid NOT NULL,
	"program_id" uuid NOT NULL,
	"day_id" uuid NOT NULL,
	"done_on" date NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "program_checkins_once" UNIQUE("day_id","done_on")
);
--> statement-breakpoint
ALTER TABLE "program_checkins" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "program_days" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trainer_id" uuid NOT NULL,
	"program_id" uuid NOT NULL,
	"title" text NOT NULL,
	"sort_order" smallint DEFAULT 0 NOT NULL,
	CONSTRAINT "program_days_title_length" CHECK (char_length("program_days"."title") between 1 and 60)
);
--> statement-breakpoint
ALTER TABLE "program_days" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "program_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trainer_id" uuid NOT NULL,
	"day_id" uuid NOT NULL,
	"exercise_id" uuid,
	"name" text NOT NULL,
	"sets" smallint,
	"reps" text,
	"load" text,
	"rest" text,
	"note" text,
	"sort_order" smallint DEFAULT 0 NOT NULL,
	CONSTRAINT "program_items_name_length" CHECK (char_length("program_items"."name") between 1 and 300),
	CONSTRAINT "program_items_sets" CHECK ("program_items"."sets" is null or "program_items"."sets" between 1 and 50)
);
--> statement-breakpoint
ALTER TABLE "program_items" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "programs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trainer_id" uuid NOT NULL,
	"client_id" uuid,
	"kind" "program_kind" DEFAULT 'workout' NOT NULL,
	"name" text NOT NULL,
	"note" text,
	"targets" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"starts_on" date,
	"sent_at" timestamp with time zone,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "programs_name_length" CHECK (char_length("programs"."name") between 1 and 80)
);
--> statement-breakpoint
ALTER TABLE "programs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "exercises" ADD CONSTRAINT "exercises_trainer_id_trainers_id_fk" FOREIGN KEY ("trainer_id") REFERENCES "public"."trainers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "program_checkins" ADD CONSTRAINT "program_checkins_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "program_checkins" ADD CONSTRAINT "program_checkins_day_id_program_days_id_fk" FOREIGN KEY ("day_id") REFERENCES "public"."program_days"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "program_days" ADD CONSTRAINT "program_days_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "program_items" ADD CONSTRAINT "program_items_day_id_program_days_id_fk" FOREIGN KEY ("day_id") REFERENCES "public"."program_days"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "program_items" ADD CONSTRAINT "program_items_exercise_id_exercises_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercises"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "programs" ADD CONSTRAINT "programs_trainer_id_trainers_id_fk" FOREIGN KEY ("trainer_id") REFERENCES "public"."trainers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "programs" ADD CONSTRAINT "programs_client_fk" FOREIGN KEY ("client_id","trainer_id") REFERENCES "public"."clients"("id","trainer_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "exercises_trainer_idx" ON "exercises" USING btree ("trainer_id");--> statement-breakpoint
CREATE INDEX "program_checkins_client_idx" ON "program_checkins" USING btree ("client_id","done_on");--> statement-breakpoint
CREATE INDEX "program_days_program_idx" ON "program_days" USING btree ("program_id","sort_order");--> statement-breakpoint
CREATE INDEX "program_items_day_idx" ON "program_items" USING btree ("day_id","sort_order");--> statement-breakpoint
CREATE INDEX "programs_client_idx" ON "programs" USING btree ("client_id","kind");--> statement-breakpoint
CREATE POLICY "exercises_own" ON "exercises" AS PERMISSIVE FOR ALL TO "authenticated" USING ("trainer_id" = (select auth.uid())) WITH CHECK ("trainer_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "program_checkins_own" ON "program_checkins" AS PERMISSIVE FOR ALL TO "authenticated" USING ("trainer_id" = (select auth.uid())) WITH CHECK ("trainer_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "program_days_own" ON "program_days" AS PERMISSIVE FOR ALL TO "authenticated" USING ("trainer_id" = (select auth.uid())) WITH CHECK ("trainer_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "program_items_own" ON "program_items" AS PERMISSIVE FOR ALL TO "authenticated" USING ("trainer_id" = (select auth.uid())) WITH CHECK ("trainer_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "programs_own" ON "programs" AS PERMISSIVE FOR ALL TO "authenticated" USING ("trainer_id" = (select auth.uid())) WITH CHECK ("trainer_id" = (select auth.uid()));