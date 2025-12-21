-- Create new workflow status enum for LinkedIn outreach
CREATE TYPE public.linkedin_workflow_status AS ENUM (
  'neu',
  'bereit_fuer_vernetzung',
  'vernetzung_ausstehend',
  'vernetzung_angenommen',
  'erstnachricht_gesendet',
  'kein_klick_fu_offen',
  'fu1_gesendet',
  'fu2_gesendet',
  'fu3_gesendet',
  'reagiert_warm',
  'abgeschlossen'
);

-- Add new columns to contacts table for workflow tracking
ALTER TABLE public.contacts 
ADD COLUMN IF NOT EXISTS workflow_status public.linkedin_workflow_status DEFAULT 'neu',
ADD COLUMN IF NOT EXISTS connection_sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS connection_accepted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS first_message_sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS fu1_sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS fu2_sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS fu3_sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS responded_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS daily_messages_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_message_date DATE;

-- Create index for workflow queries
CREATE INDEX IF NOT EXISTS idx_contacts_workflow_status ON public.contacts(workflow_status);
CREATE INDEX IF NOT EXISTS idx_contacts_campaign_workflow ON public.contacts(campaign_id, workflow_status);

-- Create function to check if follow-up is due
CREATE OR REPLACE FUNCTION public.get_followup_status(
  p_workflow_status linkedin_workflow_status,
  p_first_message_sent_at TIMESTAMP WITH TIME ZONE,
  p_fu1_sent_at TIMESTAMP WITH TIME ZONE,
  p_fu2_sent_at TIMESTAMP WITH TIME ZONE,
  p_viewed BOOLEAN
)
RETURNS TEXT
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
BEGIN
  -- If lead has viewed the page, they're warm
  IF p_viewed = true THEN
    RETURN 'warm';
  END IF;
  
  -- Check FU1 due (3 days after first message)
  IF p_workflow_status = 'erstnachricht_gesendet' 
     AND p_first_message_sent_at IS NOT NULL 
     AND now() >= p_first_message_sent_at + INTERVAL '3 days' THEN
    RETURN 'fu1_due';
  END IF;
  
  -- Check FU2 due (4 days after FU1)
  IF p_workflow_status = 'fu1_gesendet' 
     AND p_fu1_sent_at IS NOT NULL 
     AND now() >= p_fu1_sent_at + INTERVAL '4 days' THEN
    RETURN 'fu2_due';
  END IF;
  
  -- Check FU3 due (7 days after FU2)
  IF p_workflow_status = 'fu2_gesendet' 
     AND p_fu2_sent_at IS NOT NULL 
     AND now() >= p_fu2_sent_at + INTERVAL '7 days' THEN
    RETURN 'fu3_due';
  END IF;
  
  RETURN 'none';
END;
$$;

-- Create trigger to auto-update workflow status when lead views page
CREATE OR REPLACE FUNCTION public.update_workflow_on_view()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- When a tracking event shows engagement, mark lead as warm
  IF NEW.event_type IN ('page_view', 'video_play', 'cta_click', 'booking_click') THEN
    UPDATE contacts 
    SET 
      workflow_status = 'reagiert_warm',
      responded_at = COALESCE(responded_at, now()),
      updated_at = now()
    WHERE id = NEW.contact_id
      AND workflow_status NOT IN ('reagiert_warm', 'abgeschlossen');
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on lead_tracking_events
DROP TRIGGER IF EXISTS trigger_workflow_on_view ON lead_tracking_events;
CREATE TRIGGER trigger_workflow_on_view
AFTER INSERT ON lead_tracking_events
FOR EACH ROW
EXECUTE FUNCTION public.update_workflow_on_view();