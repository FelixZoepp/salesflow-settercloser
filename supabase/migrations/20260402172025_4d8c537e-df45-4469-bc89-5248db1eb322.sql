
-- Create sequences table
CREATE TABLE public.sequences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID NOT NULL REFERENCES public.accounts(id),
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  definition JSONB NOT NULL DEFAULT '{"nodes":[],"edges":[]}'::jsonb,
  total_leads INTEGER NOT NULL DEFAULT 0,
  total_completed INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sequences ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view sequences in their account"
ON public.sequences FOR SELECT
USING ((account_id = get_user_account_id()) OR is_super_admin());

CREATE POLICY "Users can manage sequences in their account"
ON public.sequences FOR ALL
USING ((account_id = get_user_account_id()) OR is_super_admin())
WITH CHECK ((account_id = get_user_account_id()) OR is_super_admin());

-- Index
CREATE INDEX idx_sequences_account_id ON public.sequences(account_id);

-- Updated_at trigger
CREATE TRIGGER update_sequences_updated_at
BEFORE UPDATE ON public.sequences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
