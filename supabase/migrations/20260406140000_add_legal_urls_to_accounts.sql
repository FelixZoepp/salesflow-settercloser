-- Add legal URLs to accounts for lead pages (Impressum + Datenschutz)
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS impressum_url TEXT;
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS datenschutz_url TEXT;
