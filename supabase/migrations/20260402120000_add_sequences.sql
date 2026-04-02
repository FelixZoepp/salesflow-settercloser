-- Sequences table: stores the entire flow definition as JSONB
CREATE TABLE public.sequences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'draft', -- draft, active, paused, completed

  -- The full flow graph stored as JSONB
  definition jsonb NOT NULL DEFAULT '{"nodes":[],"edges":[]}',

  -- Cached stats
  total_leads integer DEFAULT 0,
  total_completed integer DEFAULT 0,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.sequences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sequences"
  ON public.sequences FOR SELECT
  USING (account_id = get_user_account_id() OR is_super_admin());

CREATE POLICY "Users can insert own sequences"
  ON public.sequences FOR INSERT
  WITH CHECK (account_id = get_user_account_id() OR is_super_admin());

CREATE POLICY "Users can update own sequences"
  ON public.sequences FOR UPDATE
  USING (account_id = get_user_account_id() OR is_super_admin())
  WITH CHECK (account_id = get_user_account_id() OR is_super_admin());

CREATE POLICY "Users can delete own sequences"
  ON public.sequences FOR DELETE
  USING (account_id = get_user_account_id() OR is_super_admin());

CREATE TRIGGER update_sequences_updated_at
  BEFORE UPDATE ON public.sequences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sequence Leads: tracks each lead's position in a sequence
CREATE TABLE public.sequence_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id uuid NOT NULL REFERENCES public.sequences(id) ON DELETE CASCADE,
  contact_id uuid NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  current_node_id text NOT NULL,
  status text NOT NULL DEFAULT 'active', -- active, paused, completed, exited
  entered_at timestamptz NOT NULL DEFAULT now(),
  next_action_at timestamptz,
  path_history jsonb DEFAULT '[]',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(sequence_id, contact_id)
);

ALTER TABLE public.sequence_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sequence leads"
  ON public.sequence_leads FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.sequences s
      WHERE s.id = sequence_leads.sequence_id
      AND (s.account_id = get_user_account_id() OR is_super_admin())
    )
  );

CREATE POLICY "Users can insert own sequence leads"
  ON public.sequence_leads FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.sequences s
      WHERE s.id = sequence_leads.sequence_id
      AND (s.account_id = get_user_account_id() OR is_super_admin())
    )
  );

CREATE POLICY "Users can update own sequence leads"
  ON public.sequence_leads FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.sequences s
      WHERE s.id = sequence_leads.sequence_id
      AND (s.account_id = get_user_account_id() OR is_super_admin())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.sequences s
      WHERE s.id = sequence_leads.sequence_id
      AND (s.account_id = get_user_account_id() OR is_super_admin())
    )
  );

CREATE POLICY "Users can delete own sequence leads"
  ON public.sequence_leads FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.sequences s
      WHERE s.id = sequence_leads.sequence_id
      AND (s.account_id = get_user_account_id() OR is_super_admin())
    )
  );

CREATE TRIGGER update_sequence_leads_updated_at
  BEFORE UPDATE ON public.sequence_leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
