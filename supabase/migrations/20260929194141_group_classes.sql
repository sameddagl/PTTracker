CREATE TYPE "public"."group_join_mode" AS ENUM('drop_in', 'fixed', 'both');--> statement-breakpoint
CREATE TABLE "group_class_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trainer_id" uuid NOT NULL,
	"group_class_id" uuid NOT NULL,
	"client_id" uuid NOT NULL,
	"starts_on" date NOT NULL,
	"ended_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "group_class_members" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "group_classes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trainer_id" uuid NOT NULL,
	"title" text NOT NULL,
	"weekdays" smallint[] NOT NULL,
	"start_time" text NOT NULL,
	"duration_minutes" smallint DEFAULT 60 NOT NULL,
	"capacity" smallint NOT NULL,
	"join_mode" "group_join_mode" DEFAULT 'both' NOT NULL,
	"starts_on" date NOT NULL,
	"ends_on" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "group_classes_id_trainer_key" UNIQUE("id","trainer_id"),
	CONSTRAINT "group_classes_capacity_range" CHECK ("group_classes"."capacity" between 1 and 100)
);
--> statement-breakpoint
ALTER TABLE "group_classes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "lessons" ADD COLUMN "group_class_id" uuid;--> statement-breakpoint
ALTER TABLE "lessons" ADD COLUMN "occurrence_date" date;--> statement-breakpoint
ALTER TABLE "lessons" ADD COLUMN "capacity" smallint;--> statement-breakpoint
ALTER TABLE "group_class_members" ADD CONSTRAINT "group_class_members_class_fk" FOREIGN KEY ("group_class_id","trainer_id") REFERENCES "public"."group_classes"("id","trainer_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_class_members" ADD CONSTRAINT "group_class_members_client_fk" FOREIGN KEY ("client_id","trainer_id") REFERENCES "public"."clients"("id","trainer_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_classes" ADD CONSTRAINT "group_classes_trainer_id_trainers_id_fk" FOREIGN KEY ("trainer_id") REFERENCES "public"."trainers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "group_class_members_class_idx" ON "group_class_members" USING btree ("group_class_id");--> statement-breakpoint
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_group_class_fk" FOREIGN KEY ("group_class_id","trainer_id") REFERENCES "public"."group_classes"("id","trainer_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_group_occurrence_key" UNIQUE("group_class_id","occurrence_date");--> statement-breakpoint
CREATE POLICY "group_class_members_own" ON "group_class_members" AS PERMISSIVE FOR ALL TO "authenticated" USING ("trainer_id" = (select auth.uid())) WITH CHECK ("trainer_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "group_classes_own" ON "group_classes" AS PERMISSIVE FOR ALL TO "authenticated" USING ("trainer_id" = (select auth.uid())) WITH CHECK ("trainer_id" = (select auth.uid()));