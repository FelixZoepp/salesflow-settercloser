-- Create outreach_status enum
CREATE TYPE public.outreach_status AS ENUM ('offen', 'gesendet', 'follow_up', 'geschlossen');

-- Drop the existing text column and recreate as enum
ALTER TABLE public.contacts DROP COLUMN IF EXISTS outreach_status;
ALTER TABLE public.contacts ADD COLUMN outreach_status public.outreach_status DEFAULT NULL;

-- Create index for outreach_status filtering
CREATE INDEX IF NOT EXISTS idx_contacts_outreach_status_enum ON public.contacts(outreach_status);