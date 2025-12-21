-- Add LinkedIn URL to contacts
ALTER TABLE public.contacts 
ADD COLUMN IF NOT EXISTS linkedin_url TEXT;

-- Create table for follow-up message templates per campaign
CREATE TABLE public.followup_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE,
  account_id UUID REFERENCES public.accounts(id),
  template_type TEXT NOT NULL CHECK (template_type IN ('first_message', 'fu1', 'fu2', 'fu3')),
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.followup_templates ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view templates in their account"
ON public.followup_templates
FOR SELECT
USING ((account_id = get_user_account_id()) OR is_super_admin());

CREATE POLICY "Users can manage templates in their account"
ON public.followup_templates
FOR ALL
USING ((account_id = get_user_account_id()) OR is_super_admin())
WITH CHECK ((account_id = get_user_account_id()) OR is_super_admin());

-- Index for faster lookups
CREATE INDEX idx_followup_templates_campaign ON public.followup_templates(campaign_id, template_type);