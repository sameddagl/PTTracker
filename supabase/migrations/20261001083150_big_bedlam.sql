CREATE TYPE "public"."support_sender" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TYPE "public"."support_source" AS ENUM('landing', 'app');--> statement-breakpoint
CREATE TABLE "support_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"thread_id" uuid NOT NULL,
	"trainer_id" uuid,
	"sender" "support_sender" NOT NULL,
	"body" text NOT NULL,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "support_messages_body_length" CHECK (char_length("support_messages"."body") between 1 and 4000)
);
--> statement-breakpoint
ALTER TABLE "support_messages" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "support_threads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trainer_id" uuid,
	"source" "support_source" NOT NULL,
	"name" text NOT NULL,
	"email" text,
	"phone" text,
	"closed_at" timestamp with time zone,
	"last_message_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "support_threads_one_per_trainer" UNIQUE("trainer_id"),
	CONSTRAINT "support_threads_name_length" CHECK (char_length("support_threads"."name") between 1 and 120)
);
--> statement-breakpoint
ALTER TABLE "support_threads" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "support_messages" ADD CONSTRAINT "support_messages_thread_id_support_threads_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."support_threads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_threads" ADD CONSTRAINT "support_threads_trainer_id_trainers_id_fk" FOREIGN KEY ("trainer_id") REFERENCES "public"."trainers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "support_messages_thread_idx" ON "support_messages" USING btree ("thread_id","created_at");--> statement-breakpoint
CREATE INDEX "support_threads_last_idx" ON "support_threads" USING btree ("last_message_at");--> statement-breakpoint
CREATE POLICY "support_messages_own" ON "support_messages" AS PERMISSIVE FOR ALL TO "authenticated" USING ("trainer_id" = (select auth.uid())) WITH CHECK ("trainer_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "support_threads_own" ON "support_threads" AS PERMISSIVE FOR ALL TO "authenticated" USING ("trainer_id" = (select auth.uid())) WITH CHECK ("trainer_id" = (select auth.uid()));