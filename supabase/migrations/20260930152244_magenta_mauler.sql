ALTER TABLE "trainers" ADD COLUMN "reminders_enabled" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "trainers" ADD COLUMN "reminder_hours" smallint DEFAULT 24 NOT NULL;--> statement-breakpoint
ALTER TABLE "trainers" ADD COLUMN "renewal_offers_enabled" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "trainers" ADD COLUMN "message_templates" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "trainers" ADD CONSTRAINT "trainers_reminder_hours" CHECK ("trainers"."reminder_hours" between 1 and 72);