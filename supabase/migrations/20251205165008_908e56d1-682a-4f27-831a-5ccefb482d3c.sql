-- Add video note fields to contacts table
ALTER TABLE public.contacts
ADD COLUMN IF NOT EXISTS slug text UNIQUE,
ADD COLUMN IF NOT EXISTS video_url text,
ADD COLUMN IF NOT EXISTS viewed boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS viewed_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS view_count integer DEFAULT 0;

-- Create index for slug lookups
CREATE INDEX IF NOT EXISTS idx_contacts_slug ON public.contacts(slug) WHERE slug IS NOT NULL;

-- Allow public access to contacts by slug (for video page)
CREATE POLICY "Public can view contacts by slug"
ON public.contacts
FOR SELECT
USING (slug IS NOT NULL AND slug != '');