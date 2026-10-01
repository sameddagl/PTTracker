CREATE TABLE "program_attachments" (
	"program_id" uuid PRIMARY KEY NOT NULL,
	"trainer_id" uuid NOT NULL,
	"file_name" text NOT NULL,
	"size" integer NOT NULL,
	"data" "bytea" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "program_attachments_size" CHECK ("program_attachments"."size" between 1 and 5242880)
);
--> statement-breakpoint
ALTER TABLE "program_attachments" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "measure_every_days" smallint;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "measure_reminded_on" date;--> statement-breakpoint
ALTER TABLE "program_attachments" ADD CONSTRAINT "program_attachments_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_measure_every_days" CHECK ("clients"."measure_every_days" is null or "clients"."measure_every_days" between 7 and 180);--> statement-breakpoint
CREATE POLICY "program_attachments_own" ON "program_attachments" AS PERMISSIVE FOR ALL TO "authenticated" USING ("trainer_id" = (select auth.uid())) WITH CHECK ("trainer_id" = (select auth.uid()));