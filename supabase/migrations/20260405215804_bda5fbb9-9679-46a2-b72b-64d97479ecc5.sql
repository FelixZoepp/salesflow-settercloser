
CREATE OR REPLACE FUNCTION public.get_contact_by_slug(contact_slug text)
 RETURNS TABLE(id uuid, first_name text, last_name text, company text, video_url text, pitch_video_url text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- First check original contacts table
  RETURN QUERY
  SELECT 
    c.id,
    c.first_name,
    c.last_name,
    c.company,
    c.video_url,
    (SELECT camp.pitch_video_url FROM campaigns camp WHERE camp.id = c.campaign_id) as pitch_video_url
  FROM contacts c
  WHERE c.slug = contact_slug
    AND c.lead_type = 'outbound'
  LIMIT 1;

  IF FOUND THEN RETURN; END IF;

  -- Then check contact_member_links for team member-specific slugs
  RETURN QUERY
  SELECT 
    c.id,
    c.first_name,
    c.last_name,
    c.company,
    COALESCE(cml.video_url, c.video_url) as video_url,
    (SELECT camp.pitch_video_url FROM campaigns camp WHERE camp.id = c.campaign_id) as pitch_video_url
  FROM contact_member_links cml
  JOIN contacts c ON c.id = cml.contact_id
  WHERE cml.slug = contact_slug
  LIMIT 1;
END;
$function$;
