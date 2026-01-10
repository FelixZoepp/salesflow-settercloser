-- Drop and recreate the function with company field
DROP FUNCTION IF EXISTS public.get_contact_by_slug(text);

CREATE FUNCTION public.get_contact_by_slug(contact_slug text)
 RETURNS TABLE(id uuid, first_name text, last_name text, company text, video_url text, pitch_video_url text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Return ONLY the minimum fields needed for the video landing page
  -- Including company for personalization
  -- NO email, NO phone, NO other sensitive data
  RETURN QUERY
  SELECT 
    c.id,
    c.first_name,
    c.last_name,
    c.company,
    c.video_url,
    camp.pitch_video_url
  FROM contacts c
  LEFT JOIN campaigns camp ON camp.id = c.campaign_id
  WHERE c.slug = contact_slug
    AND c.slug IS NOT NULL
    AND c.slug != ''
    AND c.lead_type = 'outbound'
  LIMIT 1;
END;
$function$;