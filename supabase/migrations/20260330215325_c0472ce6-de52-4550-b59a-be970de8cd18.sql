-- 1. Neue Workflow-Statuses
ALTER TYPE public.linkedin_workflow_status ADD VALUE IF NOT EXISTS 'positiv_geantwortet';
ALTER TYPE public.linkedin_workflow_status ADD VALUE IF NOT EXISTS 'termin_gebucht';

-- 2. Neue Spalten für Contacts
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS positive_reply_at timestamptz;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS appointment_booked_at timestamptz;

-- 3. Kampagnen-Landing-Page Verknüpfung
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS landing_page_id uuid;