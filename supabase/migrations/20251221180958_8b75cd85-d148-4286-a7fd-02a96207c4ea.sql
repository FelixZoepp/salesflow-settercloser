
-- Fix: Materialized View in API - revoke public/anon access
REVOKE ALL ON public.contact_last_activity FROM anon;
REVOKE ALL ON public.contact_last_activity FROM public;

-- Fix: cold_call_queue view - ensure it's not SECURITY DEFINER
-- Recreate with explicit SECURITY INVOKER
DROP VIEW IF EXISTS public.cold_call_queue;

CREATE VIEW public.cold_call_queue 
WITH (security_invoker = true)
AS
SELECT 
  c.id,
  c.first_name,
  c.last_name,
  c.company,
  c.email,
  c.phone,
  c.source,
  c.tags,
  c.stage,
  c.status,
  c.owner_user_id,
  c.created_at,
  c.updated_at,
  cla.last_activity_at
FROM contacts c
LEFT JOIN contact_last_activity cla ON c.id = cla.contact_id
WHERE c.lead_type = 'outbound';

GRANT SELECT ON public.cold_call_queue TO authenticated;

-- Also revoke anon access from cold_call_queue
REVOKE ALL ON public.cold_call_queue FROM anon;
REVOKE ALL ON public.cold_call_queue FROM public;
