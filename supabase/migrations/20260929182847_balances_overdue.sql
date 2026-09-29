-- Adds overdue_amount (installments due by today that aren't paid) and the
-- package's installment count. New columns go last, as CREATE OR REPLACE
-- VIEW requires.
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
  END AS state,
  -- Installments due by today, minus what is paid; same plan as
  -- src/lib/installments.ts (whole-lira split, remainder on the first,
  -- one every 30 days from starts_on).
  greatest(
    CASE
      WHEN cp.price <= 0 OR t.today < cp.starts_on THEN 0
      ELSE
        (cp.price - floor(cp.price / cp.installments) * (cp.installments - 1))
        + floor(cp.price / cp.installments)
          * (least(cp.installments, floor((t.today - cp.starts_on) / 30) + 1) - 1)
    END - coalesce(p.paid, 0),
    0
  )::numeric(12, 2) AS overdue_amount,
  cp.installments::int AS installments
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
