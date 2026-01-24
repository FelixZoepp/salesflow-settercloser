-- Add footer legal links to lead_page_templates
ALTER TABLE public.lead_page_templates 
ADD COLUMN IF NOT EXISTS footer_impressum_url text DEFAULT 'https://content-leads.de/impressum',
ADD COLUMN IF NOT EXISTS footer_datenschutz_url text DEFAULT 'https://content-leads.de/datenschutz';