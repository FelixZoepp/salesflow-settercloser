
-- Table to track enrichment credits per account per month
CREATE TABLE public.enrichment_credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  month_year text NOT NULL, -- format: '2026-02'
  phone_credits_used integer NOT NULL DEFAULT 0,
  email_credits_used integer NOT NULL DEFAULT 0,
  phone_credits_limit integer NOT NULL DEFAULT 100,
  email_credits_limit integer NOT NULL DEFAULT 100,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(account_id, month_year)
);

ALTER TABLE public.enrichment_credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own account credits"
  ON public.enrichment_credits FOR SELECT
  USING (account_id = get_user_account_id() OR is_super_admin());

CREATE POLICY "Users can manage own account credits"
  ON public.enrichment_credits FOR ALL
  USING (account_id = get_user_account_id() OR is_super_admin())
  WITH CHECK (account_id = get_user_account_id() OR is_super_admin());

-- Function to get or create current month's credits
CREATE OR REPLACE FUNCTION public.get_enrichment_credits(p_account_id uuid)
RETURNS enrichment_credits
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_month text;
  v_credits enrichment_credits;
BEGIN
  v_month := to_char(now(), 'YYYY-MM');
  
  SELECT * INTO v_credits
  FROM enrichment_credits
  WHERE account_id = p_account_id AND month_year = v_month;
  
  IF NOT FOUND THEN
    INSERT INTO enrichment_credits (account_id, month_year)
    VALUES (p_account_id, v_month)
    RETURNING * INTO v_credits;
  END IF;
  
  RETURN v_credits;
END;
$$;
