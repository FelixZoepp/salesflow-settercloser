
-- 1. FIX: contacts_table_public_exposure
-- Remove the overly permissive public SELECT policy
-- The get_contact_by_slug function (SECURITY DEFINER) already handles public access with limited columns
DROP POLICY IF EXISTS "Allow public view by slug" ON public.contacts;

-- 2. FIX: lead_tracking_events_unrestricted_insert
-- Replace the unrestricted INSERT policy with one that validates the contact exists and has a slug
DROP POLICY IF EXISTS "Allow public insert for tracking" ON public.lead_tracking_events;

-- Create a security definer function to validate contact has slug (for tracking)
CREATE OR REPLACE FUNCTION public.contact_has_slug(p_contact_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.contacts
    WHERE id = p_contact_id
      AND slug IS NOT NULL
      AND slug != ''
  );
$$;

-- Create a more restrictive policy that only allows inserts for contacts with valid slugs
CREATE POLICY "Allow tracking insert for valid slugged contacts"
ON public.lead_tracking_events
FOR INSERT
WITH CHECK (
  contact_has_slug(contact_id)
);

-- 3. FIX: cold_call_queue_no_rls (SECURITY DEFINER VIEW)
-- Drop the existing view and recreate it without SECURITY DEFINER
DROP VIEW IF EXISTS public.cold_call_queue;

-- Recreate as a regular view (will inherit RLS from underlying contacts table)
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

-- Grant necessary permissions
GRANT SELECT ON public.cold_call_queue TO authenticated;
