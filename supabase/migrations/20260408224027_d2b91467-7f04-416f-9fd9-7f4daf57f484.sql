
CREATE TABLE public.custom_domains (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE NOT NULL,
  domain TEXT NOT NULL,
  verified BOOLEAN NOT NULL DEFAULT false,
  verified_at TIMESTAMPTZ,
  ssl_active BOOLEAN NOT NULL DEFAULT false,
  ssl_activated_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending_dns',
  last_error TEXT,
  last_checked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(domain)
);

ALTER TABLE public.custom_domains ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own account domains"
  ON public.custom_domains FOR SELECT
  TO authenticated
  USING (account_id = (SELECT account_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Admins can manage own account domains"
  ON public.custom_domains FOR ALL
  TO authenticated
  USING (account_id = (SELECT account_id FROM profiles WHERE id = auth.uid()))
  WITH CHECK (account_id = (SELECT account_id FROM profiles WHERE id = auth.uid()));
