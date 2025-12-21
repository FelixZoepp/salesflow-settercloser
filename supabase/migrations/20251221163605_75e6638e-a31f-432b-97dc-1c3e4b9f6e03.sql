-- Create campaigns table
CREATE TABLE public.campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID REFERENCES public.accounts(id),
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed')),
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for campaigns
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

-- RLS policies for campaigns
CREATE POLICY "Users can view campaigns in their account"
ON public.campaigns FOR SELECT
USING (account_id = get_user_account_id() OR is_super_admin());

CREATE POLICY "Users can manage campaigns in their account"
ON public.campaigns FOR ALL
USING (account_id = get_user_account_id() OR is_super_admin())
WITH CHECK (account_id = get_user_account_id() OR is_super_admin());

-- Add campaign_id to contacts
ALTER TABLE public.contacts ADD COLUMN campaign_id UUID REFERENCES public.campaigns(id);

-- Create lead_tracking_events table for detailed tracking
CREATE TABLE public.lead_tracking_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  account_id UUID REFERENCES public.accounts(id),
  event_type TEXT NOT NULL CHECK (event_type IN (
    'page_view', 
    'video_play', 
    'video_progress', 
    'video_complete',
    'button_click', 
    'scroll_depth', 
    'time_on_page',
    'form_submit',
    'booking_click',
    'cta_click'
  )),
  event_data JSONB DEFAULT '{}',
  page_url TEXT,
  session_id TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for lead_tracking_events
ALTER TABLE public.lead_tracking_events ENABLE ROW LEVEL SECURITY;

-- RLS policies for lead_tracking_events
CREATE POLICY "Users can view tracking events in their account"
ON public.lead_tracking_events FOR SELECT
USING (account_id = get_user_account_id() OR is_super_admin());

CREATE POLICY "Allow public insert for tracking"
ON public.lead_tracking_events FOR INSERT
WITH CHECK (true);

-- Add lead_score to contacts
ALTER TABLE public.contacts ADD COLUMN lead_score INTEGER DEFAULT 0;

-- Create index for faster queries
CREATE INDEX idx_lead_tracking_events_contact_id ON public.lead_tracking_events(contact_id);
CREATE INDEX idx_lead_tracking_events_created_at ON public.lead_tracking_events(created_at);
CREATE INDEX idx_contacts_campaign_id ON public.contacts(campaign_id);

-- Enable realtime for tracking events
ALTER PUBLICATION supabase_realtime ADD TABLE public.lead_tracking_events;

-- Trigger to update updated_at on campaigns
CREATE TRIGGER update_campaigns_updated_at
BEFORE UPDATE ON public.campaigns
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();