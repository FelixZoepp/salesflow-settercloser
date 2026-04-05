-- Per-user progress on shared team leads
-- Each team member tracks their own workflow status per contact
CREATE TABLE public.team_contact_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
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
  UNIQUE(contact_id, user_id)
);

CREATE INDEX idx_tcp_contact_id ON public.team_contact_progress(contact_id);
CREATE INDEX idx_tcp_user_id ON public.team_contact_progress(user_id);
CREATE INDEX idx_tcp_account_id ON public.team_contact_progress(account_id);

ALTER TABLE public.team_contact_progress ENABLE ROW LEVEL SECURITY;

-- Users can view all progress in their account (for Team Arena comparison)
CREATE POLICY "Users can view own account progress"
  ON public.team_contact_progress FOR SELECT
  USING (
    account_id = (SELECT account_id FROM public.profiles WHERE id = auth.uid())
    OR (SELECT is_super_admin FROM public.profiles WHERE id = auth.uid()) = true
  );

-- Users can only insert/update their own progress
CREATE POLICY "Users can manage own progress"
  ON public.team_contact_progress FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND account_id = (SELECT account_id FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can update own progress"
  ON public.team_contact_progress FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own progress"
  ON public.team_contact_progress FOR DELETE
  USING (user_id = auth.uid());

-- Auto-update updated_at
CREATE TRIGGER update_team_contact_progress_updated_at
  BEFORE UPDATE ON public.team_contact_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
