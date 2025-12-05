-- Create lead_type enum
CREATE TYPE public.lead_type AS ENUM ('inbound', 'outbound');

-- Add lead_type column to contacts table (default to inbound for existing records)
ALTER TABLE public.contacts 
ADD COLUMN lead_type public.lead_type DEFAULT 'inbound';

-- Add outreach_status column for tracking outbound lead progress
ALTER TABLE public.contacts 
ADD COLUMN outreach_status text DEFAULT NULL;

-- Add outreach_message column for personalized outreach messages
ALTER TABLE public.contacts 
ADD COLUMN outreach_message text DEFAULT NULL;

-- Add personalized_url column (computed from slug)
ALTER TABLE public.contacts 
ADD COLUMN personalized_url text DEFAULT NULL;

-- Create index for efficient filtering
CREATE INDEX idx_contacts_lead_type ON public.contacts(lead_type);
CREATE INDEX idx_contacts_outreach_status ON public.contacts(outreach_status) WHERE outreach_status IS NULL;