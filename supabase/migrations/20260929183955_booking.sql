CREATE TABLE "availability_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trainer_id" uuid NOT NULL,
	"weekday" smallint NOT NULL,
	"start_minute" smallint NOT NULL,
	"end_minute" smallint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "availability_rules_weekday" CHECK ("availability_rules"."weekday" between 1 and 7),
	CONSTRAINT "availability_rules_range" CHECK ("availability_rules"."start_minute" >= 0 and "availability_rules"."end_minute" <= 1440 and "availability_rules"."end_minute" > "availability_rules"."start_minute")
);
--> statement-breakpoint
ALTER TABLE "availability_rules" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "time_off" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trainer_id" uuid NOT NULL,
	"starts_on" date NOT NULL,
	"ends_on" date NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "time_off_range" CHECK ("time_off"."ends_on" >= "time_off"."starts_on")
);
--> statement-breakpoint
ALTER TABLE "time_off" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "lessons" ADD COLUMN "booked_by_client" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "trainers" ADD COLUMN "booking_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "trainers" ADD COLUMN "booking_lesson_minutes" smallint DEFAULT 60 NOT NULL;--> statement-breakpoint
ALTER TABLE "trainers" ADD COLUMN "booking_min_notice_hours" smallint DEFAULT 12 NOT NULL;--> statement-breakpoint
ALTER TABLE "trainers" ADD COLUMN "booking_horizon_days" smallint DEFAULT 21 NOT NULL;--> statement-breakpoint
ALTER TABLE "availability_rules" ADD CONSTRAINT "availability_rules_trainer_id_trainers_id_fk" FOREIGN KEY ("trainer_id") REFERENCES "public"."trainers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_off" ADD CONSTRAINT "time_off_trainer_id_trainers_id_fk" FOREIGN KEY ("trainer_id") REFERENCES "public"."trainers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "availability_rules_trainer_idx" ON "availability_rules" USING btree ("trainer_id","weekday");--> statement-breakpoint
CREATE INDEX "time_off_trainer_idx" ON "time_off" USING btree ("trainer_id","ends_on");--> statement-breakpoint
CREATE POLICY "availability_rules_own" ON "availability_rules" AS PERMISSIVE FOR ALL TO "authenticated" USING ("trainer_id" = (select auth.uid())) WITH CHECK ("trainer_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "time_off_own" ON "time_off" AS PERMISSIVE FOR ALL TO "authenticated" USING ("trainer_id" = (select auth.uid())) WITH CHECK ("trainer_id" = (select auth.uid()));