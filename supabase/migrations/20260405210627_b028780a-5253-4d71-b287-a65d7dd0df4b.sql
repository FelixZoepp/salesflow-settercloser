CREATE TABLE public.team_challenges (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'Team Challenge',
  goal_type text NOT NULL DEFAULT 'calls',
  goal_value integer NOT NULL DEFAULT 100,
  is_active boolean NOT NULL DEFAULT true,
  start_date date,
  end_date date,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.team_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own account challenges"
  ON public.team_challenges FOR SELECT
  USING (account_id = get_user_account_id() OR is_super_admin());

CREATE POLICY "Users can manage own account challenges"
  ON public.team_challenges FOR ALL
  USING (account_id = get_user_account_id() OR is_super_admin())
  WITH CHECK (account_id = get_user_account_id() OR is_super_admin());