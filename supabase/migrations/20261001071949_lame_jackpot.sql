ALTER TABLE "client_packages" ADD COLUMN "installment_reminded_seq" smallint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "client_packages" ADD COLUMN "installment_late_reminded_seq" smallint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "trainers" ADD COLUMN "installment_reminders_enabled" boolean DEFAULT true NOT NULL;