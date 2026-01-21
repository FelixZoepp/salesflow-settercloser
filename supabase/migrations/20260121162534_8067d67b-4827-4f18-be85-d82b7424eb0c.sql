-- Create enum for telephony providers
DO $$ BEGIN
  CREATE TYPE telephony_provider AS ENUM (
    'placetel',
    'sipgate',
    'aircall',
    'twilio',
    'telekom_nfon',
    'other'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create table for account phone numbers
CREATE TABLE IF NOT EXISTS public.account_phone_numbers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  label TEXT,
  is_primary BOOLEAN DEFAULT false,
  verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for account team members (for call assignment)
CREATE TABLE IF NOT EXISTS public.account_team_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  extension TEXT,
  phone_number TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for telephony webhooks received
CREATE TABLE IF NOT EXISTS public.telephony_webhook_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  event_type TEXT NOT NULL,
  call_id TEXT,
  from_number TEXT,
  to_number TEXT,
  status TEXT,
  duration_seconds INTEGER,
  recording_url TEXT,
  raw_payload JSONB,
  processed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add new columns to account_integrations for enhanced telephony setup
ALTER TABLE account_integrations 
  ADD COLUMN IF NOT EXISTS telephony_provider TEXT,
  ADD COLUMN IF NOT EXISTS telephony_timezone TEXT DEFAULT 'Europe/Berlin',
  ADD COLUMN IF NOT EXISTS telephony_country TEXT DEFAULT 'DE',
  ADD COLUMN IF NOT EXISTS telephony_webhook_secret TEXT,
  ADD COLUMN IF NOT EXISTS telephony_webhook_verified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS telephony_webhook_verified_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS telephony_onboarding_completed BOOLEAN DEFAULT false;

-- Enable RLS on new tables
ALTER TABLE public.account_phone_numbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telephony_webhook_events ENABLE ROW LEVEL SECURITY;

-- RLS policies for account_phone_numbers
CREATE POLICY "Users can view own account phone numbers" 
  ON public.account_phone_numbers FOR SELECT 
  USING (account_id = get_user_account_id() OR is_super_admin());

CREATE POLICY "Users can create phone numbers for own account" 
  ON public.account_phone_numbers FOR INSERT 
  WITH CHECK (account_id = get_user_account_id() OR is_super_admin());

CREATE POLICY "Users can update own account phone numbers" 
  ON public.account_phone_numbers FOR UPDATE 
  USING (account_id = get_user_account_id() OR is_super_admin());

CREATE POLICY "Users can delete own account phone numbers" 
  ON public.account_phone_numbers FOR DELETE 
  USING (account_id = get_user_account_id() OR is_super_admin());

-- RLS policies for account_team_members
CREATE POLICY "Users can view own account team members" 
  ON public.account_team_members FOR SELECT 
  USING (account_id = get_user_account_id() OR is_super_admin());

CREATE POLICY "Users can create team members for own account" 
  ON public.account_team_members FOR INSERT 
  WITH CHECK (account_id = get_user_account_id() OR is_super_admin());

CREATE POLICY "Users can update own account team members" 
  ON public.account_team_members FOR UPDATE 
  USING (account_id = get_user_account_id() OR is_super_admin());

CREATE POLICY "Users can delete own account team members" 
  ON public.account_team_members FOR DELETE 
  USING (account_id = get_user_account_id() OR is_super_admin());

-- RLS policies for telephony_webhook_events
CREATE POLICY "Users can view own account webhook events" 
  ON public.telephony_webhook_events FOR SELECT 
  USING (account_id = get_user_account_id() OR is_super_admin());

-- Allow public insert for webhook events (validated by secret in edge function)
CREATE POLICY "Allow webhook inserts" 
  ON public.telephony_webhook_events FOR INSERT 
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_account_phone_numbers_account_id ON public.account_phone_numbers(account_id);
CREATE INDEX IF NOT EXISTS idx_account_team_members_account_id ON public.account_team_members(account_id);
CREATE INDEX IF NOT EXISTS idx_telephony_webhook_events_account_id ON public.telephony_webhook_events(account_id);
CREATE INDEX IF NOT EXISTS idx_telephony_webhook_events_call_id ON public.telephony_webhook_events(call_id);
CREATE INDEX IF NOT EXISTS idx_telephony_webhook_events_created_at ON public.telephony_webhook_events(created_at DESC);

-- Update triggers for updated_at
CREATE TRIGGER update_account_phone_numbers_updated_at
  BEFORE UPDATE ON public.account_phone_numbers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_account_team_members_updated_at
  BEFORE UPDATE ON public.account_team_members
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();