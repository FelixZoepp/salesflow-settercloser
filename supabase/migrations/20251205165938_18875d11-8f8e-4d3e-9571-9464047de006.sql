-- Create a function to get public contact data by slug (bypasses RLS)
CREATE OR REPLACE FUNCTION public.get_contact_by_slug(contact_slug text)
RETURNS TABLE (
  id uuid,
  first_name text,
  last_name text,
  video_url text,
  company text,
  email text
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
    c.video_url,
    c.company,
    c.email
  FROM contacts c
  WHERE c.slug = contact_slug
  LIMIT 1;
END;
$$;

-- Grant execute permission to anonymous users
GRANT EXECUTE ON FUNCTION public.get_contact_by_slug(text) TO anon;
GRANT EXECUTE ON FUNCTION public.get_contact_by_slug(text) TO authenticated;