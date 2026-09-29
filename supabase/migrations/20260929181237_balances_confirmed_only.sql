-- Only payments the trainer has confirmed count towards what a package has
-- paid; client-reported transfers wait as "pending".
CREATE OR REPLACE VIEW public.client_package_balances WITH (security_invoker = true) AS
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
    AND pm.status = 'confirmed'
) p ON true
LEFT JOIN LATERAL (
  SELECT
    sum(pf.ends_on - pf.starts_on + 1) AS frozen_days,
    bool_or(t.today BETWEEN pf.starts_on AND pf.ends_on) AS frozen_now
  FROM public.package_freezes pf
  WHERE pf.client_package_id = cp.id
) f ON true;
