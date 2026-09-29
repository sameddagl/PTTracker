CREATE TYPE "public"."payment_reporter" AS ENUM('trainer', 'client');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('pending', 'confirmed', 'rejected');--> statement-breakpoint
CREATE TABLE "payment_receipts" (
	"payment_id" uuid PRIMARY KEY NOT NULL,
	"trainer_id" uuid NOT NULL,
	"mime_type" text NOT NULL,
	"size" integer NOT NULL,
	"data" "bytea" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "payment_receipts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "status" "payment_status" DEFAULT 'confirmed' NOT NULL;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "reported_by" "payment_reporter" DEFAULT 'trainer' NOT NULL;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "reviewed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "reject_reason" text;--> statement-breakpoint
ALTER TABLE "payment_receipts" ADD CONSTRAINT "payment_receipts_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "payments_trainer_status_idx" ON "payments" USING btree ("trainer_id","status");--> statement-breakpoint
CREATE POLICY "payment_receipts_own" ON "payment_receipts" AS PERMISSIVE FOR ALL TO "authenticated" USING ("trainer_id" = (select auth.uid())) WITH CHECK ("trainer_id" = (select auth.uid()));