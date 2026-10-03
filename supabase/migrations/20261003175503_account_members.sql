CREATE TYPE "public"."member_role" AS ENUM('owner', 'instructor');--> statement-breakpoint
CREATE TABLE "account_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "member_role" NOT NULL,
	"full_name" text DEFAULT '' NOT NULL,
	"bio" text,
	"photo_path" text,
	"color" text,
	"pay_rule" jsonb,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "account_members_account_user_key" UNIQUE("account_id","user_id"),
	CONSTRAINT "account_members_id_account_key" UNIQUE("id","account_id")
);
--> statement-breakpoint
ALTER TABLE "account_members" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "account_members" ADD CONSTRAINT "account_members_account_id_trainers_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."trainers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account_members" ADD CONSTRAINT "account_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_members_user_idx" ON "account_members" USING btree ("user_id");--> statement-breakpoint
-- The account a request works in: the one the app selected (app.account_id,
-- set by withTrainer), or the user's own account when nothing is set (direct
-- API calls, tests). Null unless the user is an active member of it, so a
-- forged setting reaches nothing. Security definer: reads account_members
-- without going through its own RLS.
CREATE FUNCTION public.current_account() RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT m.account_id FROM public.account_members m
  WHERE m.user_id = auth.uid() AND m.active
    AND m.account_id = coalesce(nullif(current_setting('app.account_id', true), '')::uuid, auth.uid())
$$;--> statement-breakpoint
CREATE FUNCTION public.current_member_role() RETURNS public.member_role
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT m.role FROM public.account_members m
  WHERE m.user_id = auth.uid() AND m.active
    AND m.account_id = coalesce(nullif(current_setting('app.account_id', true), '')::uuid, auth.uid())
$$;--> statement-breakpoint
REVOKE ALL ON FUNCTION public.current_account(), public.current_member_role() FROM public;--> statement-breakpoint
GRANT EXECUTE ON FUNCTION public.current_account(), public.current_member_role() TO authenticated;--> statement-breakpoint
-- An instructor may edit their own name, bio and photo, nothing that grants
-- access or money (role, pay rule, active, which account).
CREATE FUNCTION public.account_members_guard() RETURNS trigger
LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  IF current_user = 'authenticated' AND public.current_member_role() IS DISTINCT FROM 'owner'
     AND (NEW.role, NEW.pay_rule, NEW.active, NEW.account_id, NEW.user_id, NEW.color)
         IS DISTINCT FROM (OLD.role, OLD.pay_rule, OLD.active, OLD.account_id, OLD.user_id, OLD.color) THEN
    RAISE EXCEPTION 'only the owner can change this' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;--> statement-breakpoint
CREATE TRIGGER account_members_guard BEFORE UPDATE ON public.account_members
  FOR EACH ROW EXECUTE FUNCTION public.account_members_guard();--> statement-breakpoint
-- The owner's name lives on the account (trainers.full_name); keep their member row in step.
CREATE FUNCTION public.sync_owner_member_name() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  UPDATE public.account_members SET full_name = NEW.full_name WHERE account_id = NEW.id AND user_id = NEW.id;
  RETURN NEW;
END;
$$;--> statement-breakpoint
CREATE TRIGGER trainers_sync_owner_name AFTER UPDATE OF full_name ON public.trainers
  FOR EACH ROW WHEN (NEW.full_name IS DISTINCT FROM OLD.full_name) EXECUTE FUNCTION public.sync_owner_member_name();--> statement-breakpoint
-- Every existing account gets its owner as a member.
INSERT INTO public.account_members (account_id, user_id, role, full_name)
SELECT t.id, t.id, 'owner', t.full_name FROM public.trainers t;--> statement-breakpoint
-- New users: a trainer row (their own account) and its owner membership.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  name text := coalesce(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', '');
BEGIN
  INSERT INTO public.trainers (id, full_name) VALUES (NEW.id, name);
  INSERT INTO public.account_members (account_id, user_id, role, full_name) VALUES (NEW.id, NEW.id, 'owner', name);
  RETURN NEW;
END;
$$;--> statement-breakpoint
CREATE POLICY "account_members_select" ON "account_members" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("account_members"."account_id" = (select public.current_account()));--> statement-breakpoint
CREATE POLICY "account_members_owner_write" ON "account_members" AS PERMISSIVE FOR ALL TO "authenticated" USING ("account_members"."account_id" = (select public.current_account()) and (select public.current_member_role()) = 'owner') WITH CHECK ("account_members"."account_id" = (select public.current_account()) and (select public.current_member_role()) = 'owner');--> statement-breakpoint
CREATE POLICY "account_members_self_update" ON "account_members" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ("account_members"."account_id" = (select public.current_account()) and "account_members"."user_id" = (select auth.uid())) WITH CHECK ("account_members"."account_id" = (select public.current_account()) and "account_members"."user_id" = (select auth.uid()));--> statement-breakpoint
ALTER POLICY "applications_own" ON "applications" TO authenticated USING ("trainer_id" = (select public.current_account())) WITH CHECK ("trainer_id" = (select public.current_account()));--> statement-breakpoint
ALTER POLICY "availability_rules_own" ON "availability_rules" TO authenticated USING ("trainer_id" = (select public.current_account())) WITH CHECK ("trainer_id" = (select public.current_account()));--> statement-breakpoint
ALTER POLICY "client_notes_own" ON "client_notes" TO authenticated USING ("trainer_id" = (select public.current_account())) WITH CHECK ("trainer_id" = (select public.current_account()));--> statement-breakpoint
ALTER POLICY "client_packages_own" ON "client_packages" TO authenticated USING ("trainer_id" = (select public.current_account())) WITH CHECK ("trainer_id" = (select public.current_account()));--> statement-breakpoint
ALTER POLICY "clients_own" ON "clients" TO authenticated USING ("trainer_id" = (select public.current_account())) WITH CHECK ("trainer_id" = (select public.current_account()));--> statement-breakpoint
ALTER POLICY "consents_own" ON "consents" TO authenticated USING ("trainer_id" = (select public.current_account())) WITH CHECK ("trainer_id" = (select public.current_account()));--> statement-breakpoint
ALTER POLICY "exercises_own" ON "exercises" TO authenticated USING ("trainer_id" = (select public.current_account())) WITH CHECK ("trainer_id" = (select public.current_account()));--> statement-breakpoint
ALTER POLICY "group_class_members_own" ON "group_class_members" TO authenticated USING ("trainer_id" = (select public.current_account())) WITH CHECK ("trainer_id" = (select public.current_account()));--> statement-breakpoint
ALTER POLICY "group_classes_own" ON "group_classes" TO authenticated USING ("trainer_id" = (select public.current_account())) WITH CHECK ("trainer_id" = (select public.current_account()));--> statement-breakpoint
ALTER POLICY "intake_answers_own" ON "intake_answers" TO authenticated USING ("trainer_id" = (select public.current_account())) WITH CHECK ("trainer_id" = (select public.current_account()));--> statement-breakpoint
ALTER POLICY "intake_fields_own" ON "intake_fields" TO authenticated USING ("trainer_id" = (select public.current_account())) WITH CHECK ("trainer_id" = (select public.current_account()));--> statement-breakpoint
ALTER POLICY "lesson_attendees_own" ON "lesson_attendees" TO authenticated USING ("trainer_id" = (select public.current_account())) WITH CHECK ("trainer_id" = (select public.current_account()));--> statement-breakpoint
ALTER POLICY "lesson_series_own" ON "lesson_series" TO authenticated USING ("trainer_id" = (select public.current_account())) WITH CHECK ("trainer_id" = (select public.current_account()));--> statement-breakpoint
ALTER POLICY "lessons_own" ON "lessons" TO authenticated USING ("trainer_id" = (select public.current_account())) WITH CHECK ("trainer_id" = (select public.current_account()));--> statement-breakpoint
ALTER POLICY "measurement_types_own" ON "measurement_types" TO authenticated USING ("trainer_id" = (select public.current_account())) WITH CHECK ("trainer_id" = (select public.current_account()));--> statement-breakpoint
ALTER POLICY "measurements_own" ON "measurements" TO authenticated USING ("trainer_id" = (select public.current_account())) WITH CHECK ("trainer_id" = (select public.current_account()));--> statement-breakpoint
ALTER POLICY "messages_own" ON "messages" TO authenticated USING ("trainer_id" = (select public.current_account())) WITH CHECK ("trainer_id" = (select public.current_account()));--> statement-breakpoint
ALTER POLICY "package_freezes_own" ON "package_freezes" TO authenticated USING ("trainer_id" = (select public.current_account())) WITH CHECK ("trainer_id" = (select public.current_account()));--> statement-breakpoint
ALTER POLICY "package_templates_own" ON "package_templates" TO authenticated USING ("trainer_id" = (select public.current_account())) WITH CHECK ("trainer_id" = (select public.current_account()));--> statement-breakpoint
ALTER POLICY "payment_receipts_own" ON "payment_receipts" TO authenticated USING ("trainer_id" = (select public.current_account()) and (select public.current_member_role()) = 'owner') WITH CHECK ("trainer_id" = (select public.current_account()) and (select public.current_member_role()) = 'owner');--> statement-breakpoint
ALTER POLICY "payments_own" ON "payments" TO authenticated USING ("trainer_id" = (select public.current_account()) and (select public.current_member_role()) = 'owner') WITH CHECK ("trainer_id" = (select public.current_account()) and (select public.current_member_role()) = 'owner');--> statement-breakpoint
ALTER POLICY "portal_tokens_own" ON "portal_tokens" TO authenticated USING ("trainer_id" = (select public.current_account())) WITH CHECK ("trainer_id" = (select public.current_account()));--> statement-breakpoint
ALTER POLICY "program_checkins_own" ON "program_checkins" TO authenticated USING ("trainer_id" = (select public.current_account())) WITH CHECK ("trainer_id" = (select public.current_account()));--> statement-breakpoint
ALTER POLICY "program_days_own" ON "program_days" TO authenticated USING ("trainer_id" = (select public.current_account())) WITH CHECK ("trainer_id" = (select public.current_account()));--> statement-breakpoint
ALTER POLICY "program_items_own" ON "program_items" TO authenticated USING ("trainer_id" = (select public.current_account())) WITH CHECK ("trainer_id" = (select public.current_account()));--> statement-breakpoint
ALTER POLICY "programs_own" ON "programs" TO authenticated USING ("trainer_id" = (select public.current_account())) WITH CHECK ("trainer_id" = (select public.current_account()));--> statement-breakpoint
ALTER POLICY "push_subscriptions_own" ON "push_subscriptions" TO authenticated USING ("trainer_id" = (select public.current_account())) WITH CHECK ("trainer_id" = (select public.current_account()));--> statement-breakpoint
ALTER POLICY "support_messages_own" ON "support_messages" TO authenticated USING ("trainer_id" = (select public.current_account()) and (select public.current_member_role()) = 'owner') WITH CHECK ("trainer_id" = (select public.current_account()) and (select public.current_member_role()) = 'owner');--> statement-breakpoint
ALTER POLICY "support_threads_own" ON "support_threads" TO authenticated USING ("trainer_id" = (select public.current_account()) and (select public.current_member_role()) = 'owner') WITH CHECK ("trainer_id" = (select public.current_account()) and (select public.current_member_role()) = 'owner');--> statement-breakpoint
ALTER POLICY "time_off_own" ON "time_off" TO authenticated USING ("trainer_id" = (select public.current_account())) WITH CHECK ("trainer_id" = (select public.current_account()));--> statement-breakpoint
ALTER POLICY "trainers_select_own" ON "trainers" TO authenticated USING ("trainers"."id" = (select public.current_account()));--> statement-breakpoint
ALTER POLICY "trainers_update_own" ON "trainers" TO authenticated USING ("trainers"."id" = (select public.current_account()) and (select public.current_member_role()) = 'owner') WITH CHECK ("trainers"."id" = (select public.current_account()) and (select public.current_member_role()) = 'owner');