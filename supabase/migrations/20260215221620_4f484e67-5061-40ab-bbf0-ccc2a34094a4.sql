
-- Email Campaigns table
CREATE TABLE public.email_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'draft', -- draft, active, paused, completed
  
  -- Schedule settings
  send_days text[] DEFAULT '{mon,tue,wed,thu,fri}',
  send_start_hour integer DEFAULT 9,
  send_end_hour integer DEFAULT 17,
  timezone text DEFAULT 'Europe/Berlin',
  daily_send_limit integer DEFAULT 50,
  
  -- Stats (cached for quick display)
  total_leads integer DEFAULT 0,
  total_sent integer DEFAULT 0,
  total_opened integer DEFAULT 0,
  total_clicked integer DEFAULT 0,
  total_replied integer DEFAULT 0,
  total_bounced integer DEFAULT 0,
  
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.email_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own email campaigns"
  ON public.email_campaigns FOR SELECT
  USING (account_id = get_user_account_id() OR is_super_admin());

CREATE POLICY "Users can manage own email campaigns"
  ON public.email_campaigns FOR ALL
  USING (account_id = get_user_account_id() OR is_super_admin())
  WITH CHECK (account_id = get_user_account_id() OR is_super_admin());


-- Email Campaign Steps (sequence steps)
CREATE TABLE public.email_campaign_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.email_campaigns(id) ON DELETE CASCADE,
  step_order integer NOT NULL DEFAULT 1,
  delay_days integer NOT NULL DEFAULT 0, -- days after previous step (0 for first)
  
  -- Content
  subject text NOT NULL,
  body_text text NOT NULL,
  
  -- A/B variant (null = main, 'B' = variant B)
  variant text,
  
  -- Stats
  total_sent integer DEFAULT 0,
  total_opened integer DEFAULT 0,
  total_clicked integer DEFAULT 0,
  total_replied integer DEFAULT 0,
  
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  UNIQUE(campaign_id, step_order, variant)
);

ALTER TABLE public.email_campaign_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own campaign steps"
  ON public.email_campaign_steps FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM email_campaigns ec 
    WHERE ec.id = email_campaign_steps.campaign_id 
    AND (ec.account_id = get_user_account_id() OR is_super_admin())
  ));

CREATE POLICY "Users can manage own campaign steps"
  ON public.email_campaign_steps FOR ALL
  USING (EXISTS (
    SELECT 1 FROM email_campaigns ec 
    WHERE ec.id = email_campaign_steps.campaign_id 
    AND (ec.account_id = get_user_account_id() OR is_super_admin())
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM email_campaigns ec 
    WHERE ec.id = email_campaign_steps.campaign_id 
    AND (ec.account_id = get_user_account_id() OR is_super_admin())
  ));


-- Email Campaign Leads (leads assigned to a campaign)
CREATE TABLE public.email_campaign_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.email_campaigns(id) ON DELETE CASCADE,
  contact_id uuid NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  
  status text NOT NULL DEFAULT 'active', -- active, paused, completed, bounced, replied, unsubscribed
  current_step integer DEFAULT 0, -- which step they're on (0 = not started)
  
  -- Tracking
  last_sent_at timestamptz,
  next_send_at timestamptz, -- when the next step should be sent
  opened_count integer DEFAULT 0,
  clicked_count integer DEFAULT 0,
  replied_at timestamptz,
  bounced_at timestamptz,
  
  -- A/B assignment
  ab_variant text, -- null or 'B'
  
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  UNIQUE(campaign_id, contact_id)
);

ALTER TABLE public.email_campaign_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own campaign leads"
  ON public.email_campaign_leads FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM email_campaigns ec 
    WHERE ec.id = email_campaign_leads.campaign_id 
    AND (ec.account_id = get_user_account_id() OR is_super_admin())
  ));

CREATE POLICY "Users can manage own campaign leads"
  ON public.email_campaign_leads FOR ALL
  USING (EXISTS (
    SELECT 1 FROM email_campaigns ec 
    WHERE ec.id = email_campaign_leads.campaign_id 
    AND (ec.account_id = get_user_account_id() OR is_super_admin())
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM email_campaigns ec 
    WHERE ec.id = email_campaign_leads.campaign_id 
    AND (ec.account_id = get_user_account_id() OR is_super_admin())
  ));


-- Update lead scoring function to include email events
CREATE OR REPLACE FUNCTION public.calculate_lead_score(p_contact_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_score integer := 0;
  v_event record;
  v_email_opens integer := 0;
  v_email_clicks integer := 0;
  v_email_replies integer := 0;
BEGIN
  -- Calculate score based on tracking events
  FOR v_event IN 
    SELECT event_type, event_data 
    FROM lead_tracking_events 
    WHERE contact_id = p_contact_id
  LOOP
    CASE v_event.event_type
      WHEN 'page_view' THEN v_score := v_score + 5;
      WHEN 'video_play' THEN v_score := v_score + 10;
      WHEN 'video_progress' THEN 
        IF (v_event.event_data->>'progress')::int >= 75 THEN
          v_score := v_score + 15;
        ELSIF (v_event.event_data->>'progress')::int >= 50 THEN
          v_score := v_score + 10;
        ELSE
          v_score := v_score + 5;
        END IF;
      WHEN 'video_complete' THEN v_score := v_score + 20;
      WHEN 'button_click' THEN v_score := v_score + 10;
      WHEN 'cta_click' THEN v_score := v_score + 15;
      WHEN 'booking_click' THEN v_score := v_score + 25;
      WHEN 'scroll_depth' THEN
        IF (v_event.event_data->>'depth')::int >= 75 THEN
          v_score := v_score + 10;
        ELSIF (v_event.event_data->>'depth')::int >= 50 THEN
          v_score := v_score + 5;
        END IF;
      WHEN 'time_on_page' THEN
        IF (v_event.event_data->>'seconds')::int >= 120 THEN
          v_score := v_score + 15;
        ELSIF (v_event.event_data->>'seconds')::int >= 60 THEN
          v_score := v_score + 10;
        ELSIF (v_event.event_data->>'seconds')::int >= 30 THEN
          v_score := v_score + 5;
        END IF;
      WHEN 'form_submit' THEN v_score := v_score + 30;
      -- Email events
      WHEN 'email_open' THEN v_score := v_score + 5;
      WHEN 'email_click' THEN v_score := v_score + 15;
      WHEN 'email_reply' THEN v_score := v_score + 25;
      ELSE v_score := v_score + 2;
    END CASE;
  END LOOP;
  
  -- Also count from email_campaign_leads for this contact
  SELECT 
    COALESCE(SUM(opened_count), 0),
    COALESCE(SUM(clicked_count), 0),
    COUNT(*) FILTER (WHERE replied_at IS NOT NULL)
  INTO v_email_opens, v_email_clicks, v_email_replies
  FROM email_campaign_leads
  WHERE contact_id = p_contact_id;
  
  v_score := v_score + (v_email_opens * 5) + (v_email_clicks * 15) + (v_email_replies * 25);
  
  -- Cap the score at 100
  IF v_score > 100 THEN
    v_score := 100;
  END IF;
  
  RETURN v_score;
END;
$$;

-- Add channel tracking to contacts
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS channels_active text[] DEFAULT '{}';
