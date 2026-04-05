-- Team challenge settings per account
CREATE TABLE public.team_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Team Challenge',
  goal_type TEXT NOT NULL DEFAULT 'connections_sent',
  goal_value INTEGER NOT NULL DEFAULT 2000,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(account_id)
);

ALTER TABLE public.team_challenges ENABLE ROW LEVEL SECURITY;

-- Members of the account can view
CREATE POLICY "Users can view own account challenge"
  ON public.team_challenges FOR SELECT
  USING (
    account_id = (SELECT account_id FROM public.profiles WHERE id = auth.uid())
    OR (SELECT is_super_admin FROM public.profiles WHERE id = auth.uid()) = true
  );

-- Members of the account can insert/update/delete
CREATE POLICY "Users can manage own account challenge"
  ON public.team_challenges FOR ALL
  USING (
    account_id = (SELECT account_id FROM public.profiles WHERE id = auth.uid())
    OR (SELECT is_super_admin FROM public.profiles WHERE id = auth.uid()) = true
  )
  WITH CHECK (
    account_id = (SELECT account_id FROM public.profiles WHERE id = auth.uid())
    OR (SELECT is_super_admin FROM public.profiles WHERE id = auth.uid()) = true
  );

-- Auto-update updated_at
CREATE TRIGGER update_team_challenges_updated_at
  BEFORE UPDATE ON public.team_challenges
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
