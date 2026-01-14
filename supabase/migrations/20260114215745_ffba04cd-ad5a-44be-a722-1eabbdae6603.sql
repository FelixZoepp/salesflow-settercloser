-- Add branding fields to accounts table for lead page customization
ALTER TABLE public.accounts
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS primary_brand_color TEXT DEFAULT '#06b6d4',
ADD COLUMN IF NOT EXISTS secondary_brand_color TEXT DEFAULT '#a855f7',
ADD COLUMN IF NOT EXISTS service_description TEXT,
ADD COLUMN IF NOT EXISTS case_studies JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS unique_selling_points TEXT[],
ADD COLUMN IF NOT EXISTS target_audience TEXT,
ADD COLUMN IF NOT EXISTS tagline TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.accounts.case_studies IS 'Array of case study objects: [{title, description, result}]';
COMMENT ON COLUMN public.accounts.unique_selling_points IS 'Array of USP strings for lead pages';
COMMENT ON COLUMN public.accounts.service_description IS 'Description of the service/product offered';