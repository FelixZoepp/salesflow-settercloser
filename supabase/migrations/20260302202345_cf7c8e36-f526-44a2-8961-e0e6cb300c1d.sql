
-- Table to track credit add-on subscriptions per account
CREATE TABLE public.credit_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  stripe_subscription_id text,
  stripe_customer_id text,
  package text NOT NULL CHECK (package IN ('s', 'm', 'l')),
  extra_credits integer NOT NULL DEFAULT 100,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'incomplete')),
  current_period_end timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(account_id)
);

ALTER TABLE public.credit_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own credit subscription"
ON public.credit_subscriptions FOR SELECT
USING (account_id = get_user_account_id() OR is_super_admin());

CREATE POLICY "Super admins can manage credit subscriptions"
ON public.credit_subscriptions FOR ALL
USING (is_super_admin())
WITH CHECK (is_super_admin());

-- Trigger for updated_at
CREATE TRIGGER update_credit_subscriptions_updated_at
BEFORE UPDATE ON public.credit_subscriptions
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
