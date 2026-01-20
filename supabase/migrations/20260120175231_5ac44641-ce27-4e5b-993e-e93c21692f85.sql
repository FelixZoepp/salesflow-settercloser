-- Update the get_contact_by_slug function to also return company
CREATE OR REPLACE FUNCTION public.get_contact_by_slug(contact_slug text)
RETURNS TABLE(
  id uuid,
  first_name text,
  last_name text,
  company text,
  video_url text,
  pitch_video_url text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
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
END;
$$;