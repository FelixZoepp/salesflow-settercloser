
-- Add enrichment webhook URL to account_integrations
ALTER TABLE public.account_integrations 
ADD COLUMN IF NOT EXISTS enrichment_webhook_url TEXT;
