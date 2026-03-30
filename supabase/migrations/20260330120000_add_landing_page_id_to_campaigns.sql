-- Add landing_page_id to campaigns so each campaign can link to a lead page
ALTER TABLE public.campaigns
ADD COLUMN IF NOT EXISTS landing_page_id uuid REFERENCES public.landing_pages(id) ON DELETE SET NULL;

-- Add index for lookups
CREATE INDEX IF NOT EXISTS idx_campaigns_landing_page_id ON public.campaigns(landing_page_id) WHERE landing_page_id IS NOT NULL;
