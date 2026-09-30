ALTER TABLE "clients" ADD COLUMN "notify_prefs" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "trainers" ADD COLUMN "notify_prefs" jsonb DEFAULT '{}'::jsonb NOT NULL;