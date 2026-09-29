CREATE TYPE "public"."message_sender" AS ENUM('trainer', 'client');--> statement-breakpoint
CREATE TABLE "messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trainer_id" uuid NOT NULL,
	"client_id" uuid NOT NULL,
	"sender" "message_sender" NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"read_at" timestamp with time zone,
	CONSTRAINT "messages_body_length" CHECK (char_length("messages"."body") between 1 and 2000)
);
--> statement-breakpoint
ALTER TABLE "messages" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "push_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trainer_id" uuid NOT NULL,
	"client_id" uuid,
	"endpoint" text NOT NULL,
	"p256dh" text NOT NULL,
	"auth" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "push_subscriptions_endpoint_unique" UNIQUE("endpoint")
);
--> statement-breakpoint
ALTER TABLE "push_subscriptions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "client_packages" ADD COLUMN "renewal_offered_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "lesson_attendees" ADD COLUMN "confirmed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "lesson_attendees" ADD COLUMN "reminder_sent_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "package_templates" ADD COLUMN "is_trial" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "trainers" ADD COLUMN "weekly_summary_week" date;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_client_fk" FOREIGN KEY ("client_id","trainer_id") REFERENCES "public"."clients"("id","trainer_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_trainer_id_trainers_id_fk" FOREIGN KEY ("trainer_id") REFERENCES "public"."trainers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_client_fk" FOREIGN KEY ("client_id","trainer_id") REFERENCES "public"."clients"("id","trainer_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "messages_thread_idx" ON "messages" USING btree ("client_id","created_at");--> statement-breakpoint
CREATE INDEX "messages_trainer_unread_idx" ON "messages" USING btree ("trainer_id","sender","read_at");--> statement-breakpoint
CREATE INDEX "push_subscriptions_owner_idx" ON "push_subscriptions" USING btree ("trainer_id","client_id");--> statement-breakpoint
CREATE POLICY "messages_own" ON "messages" AS PERMISSIVE FOR ALL TO "authenticated" USING ("trainer_id" = (select auth.uid())) WITH CHECK ("trainer_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "push_subscriptions_own" ON "push_subscriptions" AS PERMISSIVE FOR ALL TO "authenticated" USING ("trainer_id" = (select auth.uid())) WITH CHECK ("trainer_id" = (select auth.uid()));