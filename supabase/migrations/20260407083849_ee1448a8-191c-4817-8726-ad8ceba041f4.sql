
-- Create team_contact_progress table for per-user workflow tracking
CREATE TABLE public.team_contact_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  workflow_status TEXT NOT NULL DEFAULT 'bereit_fuer_vernetzung',
  connection_sent_at TIMESTAMPTZ,
  connection_accepted_at TIMESTAMPTZ,
  first_message_sent_at TIMESTAMPTZ,
  fu1_sent_at TIMESTAMPTZ,
  fu2_sent_at TIMESTAMPTZ,
  fu3_sent_at TIMESTAMPTZ,
  responded_at TIMESTAMPTZ,
  positive_reply_at TIMESTAMPTZ,
  appointment_booked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, contact_id)
);

-- Index for fast lookups
CREATE INDEX idx_tcp_user_contact ON public.team_contact_progress(user_id, contact_id);
CREATE INDEX idx_tcp_contact ON public.team_contact_progress(contact_id);

-- Enable RLS
ALTER TABLE public.team_contact_progress ENABLE ROW LEVEL SECURITY;

-- Users can view progress within their own account
CREATE POLICY "Users can view own account progress"
ON public.team_contact_progress
FOR SELECT
TO authenticated
USING (account_id = (SELECT account_id FROM profiles WHERE id = auth.uid()));

-- Users can insert their own progress
CREATE POLICY "Users can insert own progress"
ON public.team_contact_progress
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid() AND account_id = (SELECT account_id FROM profiles WHERE id = auth.uid()));

-- Users can update their own progress
CREATE POLICY "Users can update own progress"
ON public.team_contact_progress
FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- Updated_at trigger
CREATE TRIGGER update_tcp_updated_at
BEFORE UPDATE ON public.team_contact_progress
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
