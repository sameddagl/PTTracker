ALTER TABLE "account_members" ADD COLUMN "permissions" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
-- The studio-wide "instructors see every client" switch becomes a per-instructor permission.
UPDATE public.account_members m SET permissions = jsonb_build_object('seeAllClients', false)
FROM public.trainers t WHERE t.id = m.account_id AND m.role = 'instructor' AND NOT t.instructors_see_all_clients;--> statement-breakpoint
ALTER TABLE "trainers" DROP COLUMN "instructors_see_all_clients";--> statement-breakpoint
-- Permissions are the owner's to change, like role and pay.
CREATE OR REPLACE FUNCTION public.account_members_guard() RETURNS trigger
LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  IF current_user = 'authenticated' AND public.current_member_role() IS DISTINCT FROM 'owner'
     AND (NEW.role, NEW.pay_rule, NEW.permissions, NEW.active, NEW.account_id, NEW.user_id, NEW.color)
         IS DISTINCT FROM (OLD.role, OLD.pay_rule, OLD.permissions, OLD.active, OLD.account_id, OLD.user_id, OLD.color) THEN
    RAISE EXCEPTION 'only the owner can change this' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;
