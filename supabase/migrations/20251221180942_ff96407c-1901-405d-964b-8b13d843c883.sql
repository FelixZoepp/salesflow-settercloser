
-- Drop both views in order (cold_call_queue depends on contact_last_activity)
DROP VIEW IF EXISTS public.cold_call_queue CASCADE;
DROP MATERIALIZED VIEW IF EXISTS public.contact_last_activity CASCADE;

-- Recreate contact_last_activity as regular materialized view
CREATE MATERIALIZED VIEW public.contact_last_activity AS
SELECT 
  contact_id,
  MAX(timestamp) as last_activity_at
FROM activities
WHERE contact_id IS NOT NULL
GROUP BY contact_id;

-- Create index for performance
CREATE UNIQUE INDEX idx_contact_last_activity_contact_id 
ON public.contact_last_activity (contact_id);

-- Grant necessary permissions
GRANT SELECT ON public.contact_last_activity TO authenticated;

-- Recreate cold_call_queue view
CREATE VIEW public.cold_call_queue AS
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

-- Fix: Function Search Path Mutable - update all functions
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.profiles (id, name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'New User'),
    NEW.email,
    'setter'
  );
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.auto_create_deal_for_contact()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_account_id uuid;
BEGIN
  SELECT account_id INTO v_account_id
  FROM profiles
  WHERE id = NEW.owner_user_id;
  
  INSERT INTO public.deals (
    contact_id,
    title,
    stage,
    pipeline,
    amount_eur,
    setter_id,
    account_id
  )
  VALUES (
    NEW.id,
    NEW.first_name || ' ' || NEW.last_name || COALESCE(' - ' || NEW.company, ' - Kaltakquise'),
    'Lead',
    'cold',
    0,
    NEW.owner_user_id,
    COALESCE(v_account_id, NEW.account_id)
  );
  
  RETURN NEW;
END;
$function$;

-- Update refresh function
CREATE OR REPLACE FUNCTION public.refresh_contact_last_activity()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY contact_last_activity;
END;
$function$;
