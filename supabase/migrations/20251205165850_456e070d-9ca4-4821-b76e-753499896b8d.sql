-- Drop the previous public policy if it exists
DROP POLICY IF EXISTS "Public can view contacts by slug" ON public.contacts;

-- Create a new PERMISSIVE policy for public access by slug
CREATE POLICY "Allow public view by slug"
ON public.contacts
FOR SELECT
TO anon, authenticated
USING (slug IS NOT NULL AND slug != '');