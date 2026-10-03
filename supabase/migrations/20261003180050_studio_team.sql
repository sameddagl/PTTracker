CREATE TABLE "account_invites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"email" text NOT NULL,
	"full_name" text NOT NULL,
	"color" text,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"accepted_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "account_invites_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
ALTER TABLE "account_invites" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "payroll_months" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trainer_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"month" date NOT NULL,
	"lessons" integer NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"detail" jsonb NOT NULL,
	"closed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"paid_at" timestamp with time zone,
	CONSTRAINT "payroll_months_member_month_key" UNIQUE("member_id","month")
);
--> statement-breakpoint
ALTER TABLE "payroll_months" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "availability_rules" ADD COLUMN "instructor_id" uuid;--> statement-breakpoint
ALTER TABLE "client_packages" ADD COLUMN "instructor_ids" uuid[];--> statement-breakpoint
ALTER TABLE "group_classes" ADD COLUMN "instructor_id" uuid;--> statement-breakpoint
ALTER TABLE "lesson_series" ADD COLUMN "instructor_id" uuid;--> statement-breakpoint
ALTER TABLE "lessons" ADD COLUMN "instructor_id" uuid;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "sender_member_id" uuid;--> statement-breakpoint
ALTER TABLE "package_templates" ADD COLUMN "instructor_ids" uuid[];--> statement-breakpoint
ALTER TABLE "push_subscriptions" ADD COLUMN "member_id" uuid;--> statement-breakpoint
ALTER TABLE "time_off" ADD COLUMN "instructor_id" uuid;--> statement-breakpoint
ALTER TABLE "trainers" ADD COLUMN "instructors_see_all_clients" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "trainers" ADD COLUMN "payroll_counts_missed" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "account_invites" ADD CONSTRAINT "account_invites_account_id_trainers_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."trainers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_months" ADD CONSTRAINT "payroll_months_trainer_id_trainers_id_fk" FOREIGN KEY ("trainer_id") REFERENCES "public"."trainers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_months" ADD CONSTRAINT "payroll_months_member_fk" FOREIGN KEY ("member_id","trainer_id") REFERENCES "public"."account_members"("id","account_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_invites_account_idx" ON "account_invites" USING btree ("account_id");--> statement-breakpoint
ALTER TABLE "availability_rules" ADD CONSTRAINT "availability_rules_instructor_fk" FOREIGN KEY ("instructor_id","trainer_id") REFERENCES "public"."account_members"("id","account_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_classes" ADD CONSTRAINT "group_classes_instructor_fk" FOREIGN KEY ("instructor_id","trainer_id") REFERENCES "public"."account_members"("id","account_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_series" ADD CONSTRAINT "lesson_series_instructor_fk" FOREIGN KEY ("instructor_id","trainer_id") REFERENCES "public"."account_members"("id","account_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_instructor_fk" FOREIGN KEY ("instructor_id","trainer_id") REFERENCES "public"."account_members"("id","account_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_member_fk" FOREIGN KEY ("sender_member_id","trainer_id") REFERENCES "public"."account_members"("id","account_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_member_id_account_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."account_members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_off" ADD CONSTRAINT "time_off_instructor_fk" FOREIGN KEY ("instructor_id","trainer_id") REFERENCES "public"."account_members"("id","account_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "lessons_instructor_starts_idx" ON "lessons" USING btree ("instructor_id","starts_at");--> statement-breakpoint
CREATE POLICY "account_invites_owner" ON "account_invites" AS PERMISSIVE FOR ALL TO "authenticated" USING ("account_id" = (select public.current_account()) and (select public.current_member_role()) = 'owner') WITH CHECK ("account_id" = (select public.current_account()) and (select public.current_member_role()) = 'owner');--> statement-breakpoint
CREATE POLICY "payroll_months_owner" ON "payroll_months" AS PERMISSIVE FOR ALL TO "authenticated" USING ("trainer_id" = (select public.current_account()) and (select public.current_member_role()) = 'owner') WITH CHECK ("trainer_id" = (select public.current_account()) and (select public.current_member_role()) = 'owner');--> statement-breakpoint
CREATE POLICY "payroll_months_self_select" ON "payroll_months" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("payroll_months"."trainer_id" = (select public.current_account()) and "payroll_months"."member_id" in (select m.id from public.account_members m where m.user_id = (select auth.uid())));--> statement-breakpoint
-- Rows that don't name an instructor belong to the account's owner, so a
-- trainer working alone (and every existing insert path) never sets it.
CREATE FUNCTION public.fill_owner_instructor() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF NEW.instructor_id IS NULL THEN
    SELECT m.id INTO NEW.instructor_id FROM public.account_members m
    WHERE m.account_id = NEW.trainer_id AND m.role = 'owner'
    ORDER BY m.created_at LIMIT 1;
  END IF;
  RETURN NEW;
END;
$$;--> statement-breakpoint
CREATE TRIGGER lessons_fill_instructor BEFORE INSERT ON public.lessons FOR EACH ROW EXECUTE FUNCTION public.fill_owner_instructor();--> statement-breakpoint
CREATE TRIGGER lesson_series_fill_instructor BEFORE INSERT ON public.lesson_series FOR EACH ROW EXECUTE FUNCTION public.fill_owner_instructor();--> statement-breakpoint
CREATE TRIGGER group_classes_fill_instructor BEFORE INSERT ON public.group_classes FOR EACH ROW EXECUTE FUNCTION public.fill_owner_instructor();--> statement-breakpoint
CREATE TRIGGER availability_rules_fill_instructor BEFORE INSERT ON public.availability_rules FOR EACH ROW EXECUTE FUNCTION public.fill_owner_instructor();--> statement-breakpoint
CREATE TRIGGER time_off_fill_instructor BEFORE INSERT ON public.time_off FOR EACH ROW EXECUTE FUNCTION public.fill_owner_instructor();--> statement-breakpoint
-- Existing rows: everything was taught (and every device belongs to) the owner.
UPDATE public.lessons x SET instructor_id = m.id FROM public.account_members m WHERE m.account_id = x.trainer_id AND m.role = 'owner' AND x.instructor_id IS NULL;--> statement-breakpoint
UPDATE public.lesson_series x SET instructor_id = m.id FROM public.account_members m WHERE m.account_id = x.trainer_id AND m.role = 'owner' AND x.instructor_id IS NULL;--> statement-breakpoint
UPDATE public.group_classes x SET instructor_id = m.id FROM public.account_members m WHERE m.account_id = x.trainer_id AND m.role = 'owner' AND x.instructor_id IS NULL;--> statement-breakpoint
UPDATE public.availability_rules x SET instructor_id = m.id FROM public.account_members m WHERE m.account_id = x.trainer_id AND m.role = 'owner' AND x.instructor_id IS NULL;--> statement-breakpoint
UPDATE public.time_off x SET instructor_id = m.id FROM public.account_members m WHERE m.account_id = x.trainer_id AND m.role = 'owner' AND x.instructor_id IS NULL;--> statement-breakpoint
UPDATE public.messages x SET sender_member_id = m.id FROM public.account_members m WHERE m.account_id = x.trainer_id AND m.role = 'owner' AND x.sender = 'trainer' AND x.sender_member_id IS NULL;--> statement-breakpoint
UPDATE public.push_subscriptions x SET member_id = m.id FROM public.account_members m WHERE m.account_id = x.trainer_id AND m.role = 'owner' AND x.client_id IS NULL AND x.member_id IS NULL;
