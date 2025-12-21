
-- =====================================================
-- FIX: Drop and recreate get_contact_by_slug with reduced return type
-- =====================================================

-- Drop the existing function first
DROP FUNCTION IF EXISTS public.get_contact_by_slug(text);

-- Recreate with MINIMAL data only (no email, no company, no sensitive fields)
CREATE FUNCTION public.get_contact_by_slug(contact_slug text)
RETURNS TABLE(
  id uuid, 
  first_name text, 
  last_name text, 
  video_url text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Return ONLY the minimum fields needed for the video landing page
  -- NO email, NO company, NO phone, NO other sensitive data
  RETURN QUERY
  SELECT 
    c.id,
    c.first_name,
    c.last_name,
    c.video_url
  FROM contacts c
  WHERE c.slug = contact_slug
    AND c.slug IS NOT NULL
    AND c.slug != ''
    AND c.lead_type = 'outbound'
  LIMIT 1;
END;
$function$;

-- Revoke all access from anon and public roles on contacts
REVOKE ALL ON public.contacts FROM anon;
REVOKE ALL ON public.contacts FROM public;

-- Grant only to authenticated role
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contacts TO authenticated;

-- Force RLS for table owner as well (extra security)
ALTER TABLE public.contacts FORCE ROW LEVEL SECURITY;
