-- Fix security issues from previous migration

-- 1. Fix the refresh function to have proper search_path
CREATE OR REPLACE FUNCTION refresh_contact_last_activity()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY contact_last_activity;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Revoke access to the materialized view from anon/authenticated
REVOKE ALL ON public.contact_last_activity FROM anon, authenticated;

-- 3. Grant SELECT on cold_call_queue to authenticated users
GRANT SELECT ON public.cold_call_queue TO authenticated;