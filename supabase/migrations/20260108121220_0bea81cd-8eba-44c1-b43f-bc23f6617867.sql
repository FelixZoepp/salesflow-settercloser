-- Email templates table
CREATE TABLE public.email_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  body_text TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Email logs table (sent emails)
CREATE TABLE public.email_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.email_templates(id) ON DELETE SET NULL,
  user_id UUID NOT NULL,
  from_email TEXT NOT NULL,
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  status TEXT DEFAULT 'sent',
  tracking_id UUID NOT NULL DEFAULT gen_random_uuid(),
  opened_at TIMESTAMP WITH TIME ZONE,
  open_count INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Email tracking events (opens, clicks)
CREATE TABLE public.email_tracking_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email_log_id UUID REFERENCES public.email_logs(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'open', 'click'
  link_url TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add SMTP settings to account_integrations
ALTER TABLE public.account_integrations
ADD COLUMN IF NOT EXISTS smtp_host TEXT,
ADD COLUMN IF NOT EXISTS smtp_port INTEGER,
ADD COLUMN IF NOT EXISTS smtp_username TEXT,
ADD COLUMN IF NOT EXISTS smtp_password_encrypted TEXT,
ADD COLUMN IF NOT EXISTS smtp_from_email TEXT,
ADD COLUMN IF NOT EXISTS smtp_from_name TEXT;

-- Enable RLS
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_tracking_events ENABLE ROW LEVEL SECURITY;

-- RLS policies for email_templates
CREATE POLICY "Users can view their account email templates"
ON public.email_templates FOR SELECT
USING (account_id = get_user_account_id() OR is_super_admin());

CREATE POLICY "Users can create email templates for their account"
ON public.email_templates FOR INSERT
WITH CHECK (account_id = get_user_account_id() OR is_super_admin());

CREATE POLICY "Users can update their account email templates"
ON public.email_templates FOR UPDATE
USING (account_id = get_user_account_id() OR is_super_admin());

CREATE POLICY "Users can delete their account email templates"
ON public.email_templates FOR DELETE
USING (account_id = get_user_account_id() OR is_super_admin());

-- RLS policies for email_logs
CREATE POLICY "Users can view their account email logs"
ON public.email_logs FOR SELECT
USING (account_id = get_user_account_id() OR is_super_admin());

CREATE POLICY "Users can create email logs for their account"
ON public.email_logs FOR INSERT
WITH CHECK (account_id = get_user_account_id() OR is_super_admin());

-- RLS policies for email_tracking_events (public insert for tracking, restricted read)
CREATE POLICY "Anyone can insert tracking events"
ON public.email_tracking_events FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can view tracking events for their emails"
ON public.email_tracking_events FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM email_logs el
    WHERE el.id = email_log_id
    AND (el.account_id = get_user_account_id() OR is_super_admin())
  )
);

-- Indexes
CREATE INDEX idx_email_templates_account ON public.email_templates(account_id);
CREATE INDEX idx_email_logs_contact ON public.email_logs(contact_id);
CREATE INDEX idx_email_logs_tracking ON public.email_logs(tracking_id);
CREATE INDEX idx_email_tracking_email_log ON public.email_tracking_events(email_log_id);

-- Trigger for updated_at
CREATE TRIGGER update_email_templates_updated_at
BEFORE UPDATE ON public.email_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();