-- Add new workflow statuses for positive reply and appointment booked
ALTER TYPE public.linkedin_workflow_status ADD VALUE IF NOT EXISTS 'positiv_geantwortet';
ALTER TYPE public.linkedin_workflow_status ADD VALUE IF NOT EXISTS 'termin_gebucht';

-- Add timestamp columns for tracking
ALTER TABLE public.contacts
ADD COLUMN IF NOT EXISTS positive_reply_at timestamptz,
ADD COLUMN IF NOT EXISTS appointment_booked_at timestamptz;
