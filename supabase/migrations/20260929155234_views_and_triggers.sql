-- Create a trainer profile for every new auth user.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.trainers (id, full_name)
  VALUES (
    NEW.id,
    coalesce(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', '')
  );
  RETURN NEW;
END;
$$;--> statement-breakpoint

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();--> statement-breakpoint

-- Package balance, expiry (extended by freezes), payment status and state.
-- security_invoker: callers only see rows the underlying RLS lets them see.
CREATE VIEW public.client_package_balances WITH (security_invoker = true) AS
SELECT
  cp.id AS client_package_id,
  cp.trainer_id,
  cp.client_id,
  coalesce(a.used, 0)::int AS used_sessions,
  greatest(cp.total_sessions - coalesce(a.used, 0), 0)::int AS remaining_sessions,
  coalesce(a.scheduled, 0)::int AS scheduled_sessions,
  coalesce(a.makeups, 0)::int AS makeups_used,
  (cp.expires_on + coalesce(f.frozen_days, 0)::int) AS effective_expires_on,
  coalesce(p.paid, 0)::numeric(12, 2) AS paid_amount,
  greatest(cp.price - coalesce(p.paid, 0), 0)::numeric(12, 2) AS due_amount,
  coalesce(f.frozen_now, false) AS is_frozen,
  CASE
    WHEN cp.status = 'cancelled' THEN 'cancelled'
    WHEN coalesce(f.frozen_now, false) THEN 'frozen'
    WHEN cp.total_sessions - coalesce(a.used, 0) <= 0 THEN 'finished'
    WHEN cp.expires_on IS NOT NULL
      AND cp.expires_on + coalesce(f.frozen_days, 0)::int < t.today THEN 'expired'
    ELSE 'active'
  END AS state
FROM public.client_packages cp
JOIN LATERAL (
  SELECT (now() AT TIME ZONE tr.timezone)::date AS today
  FROM public.trainers tr
  WHERE tr.id = cp.trainer_id
) t ON true
LEFT JOIN LATERAL (
  SELECT
    count(*) FILTER (WHERE la.consumes_credit) AS used,
    count(*) FILTER (WHERE la.status = 'scheduled') AS scheduled,
    count(*) FILTER (WHERE la.makeup_used) AS makeups
  FROM public.lesson_attendees la
  WHERE la.client_package_id = cp.id
) a ON true
LEFT JOIN LATERAL (
  SELECT sum(pm.amount) AS paid
  FROM public.payments pm
  WHERE pm.client_package_id = cp.id
) p ON true
LEFT JOIN LATERAL (
  SELECT
    sum(pf.ends_on - pf.starts_on + 1) AS frozen_days,
    bool_or(t.today BETWEEN pf.starts_on AND pf.ends_on) AS frozen_now
  FROM public.package_freezes pf
  WHERE pf.client_package_id = cp.id
) f ON true;--> statement-breakpoint

-- The app never talks to the database as anon; clients use signed portal links
-- resolved on the server.
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;--> statement-breakpoint
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon;--> statement-breakpoint
GRANT SELECT ON public.client_package_balances TO authenticated;
