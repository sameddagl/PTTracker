ALTER TABLE "package_templates" ADD COLUMN "is_public" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "package_templates" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "package_templates" ADD COLUMN "features" text[] DEFAULT '{}'::text[] NOT NULL;--> statement-breakpoint
ALTER TABLE "package_templates" ADD COLUMN "sort_order" smallint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "trainers" ADD COLUMN "slug" text;--> statement-breakpoint
ALTER TABLE "trainers" ADD COLUMN "public_page_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "trainers" ADD COLUMN "headline" text;--> statement-breakpoint
ALTER TABLE "trainers" ADD COLUMN "bio" text;--> statement-breakpoint
ALTER TABLE "trainers" ADD COLUMN "city" text;--> statement-breakpoint
ALTER TABLE "trainers" ADD COLUMN "instagram" text;--> statement-breakpoint
ALTER TABLE "trainers" ADD COLUMN "specialties" text[] DEFAULT '{}'::text[] NOT NULL;--> statement-breakpoint
ALTER TABLE "trainers" ADD COLUMN "avatar_path" text;--> statement-breakpoint
ALTER TABLE "trainers" ADD COLUMN "cover_path" text;--> statement-breakpoint
ALTER TABLE "trainers" ADD COLUMN "iban" text;--> statement-breakpoint
ALTER TABLE "trainers" ADD COLUMN "iban_holder" text;--> statement-breakpoint
ALTER TABLE "trainers" ADD CONSTRAINT "trainers_slug_unique" UNIQUE("slug");--> statement-breakpoint
ALTER TABLE "trainers" ADD CONSTRAINT "trainers_slug_format" CHECK ("trainers"."slug" ~ '^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$');