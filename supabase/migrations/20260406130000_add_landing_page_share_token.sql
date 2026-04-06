-- Add share token to landing pages for cross-account template sharing
ALTER TABLE public.landing_pages ADD COLUMN IF NOT EXISTS share_token UUID UNIQUE;

-- Public can read shared templates by token (for import)
CREATE POLICY "Anyone can read shared templates by token"
  ON public.landing_pages FOR SELECT
  USING (share_token IS NOT NULL);
