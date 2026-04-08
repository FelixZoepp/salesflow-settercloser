-- ============================================
-- Custom Domains for Lead Pages
-- Separate domain per account for personalized lead URLs
-- ============================================

-- 1. Create custom_domains table
CREATE TABLE IF NOT EXISTS public.custom_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending_dns'
    CHECK (status IN ('pending_dns', 'dns_verified', 'ssl_active', 'error')),
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  ssl_active BOOLEAN NOT NULL DEFAULT FALSE,
  verified_at TIMESTAMPTZ,
  ssl_activated_at TIMESTAMPTZ,
  last_checked_at TIMESTAMPTZ,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Unique constraint: one domain globally
CREATE UNIQUE INDEX idx_custom_domains_domain ON public.custom_domains (lower(domain));

-- Each account can only have one domain
CREATE UNIQUE INDEX idx_custom_domains_account ON public.custom_domains (account_id);

-- Index for fast domain lookups (used by reverse proxy)
CREATE INDEX idx_custom_domains_lookup ON public.custom_domains (lower(domain), verified)
  WHERE verified = TRUE;

-- 2. Enable RLS
ALTER TABLE public.custom_domains ENABLE ROW LEVEL SECURITY;

-- Users can view their own account's domain
CREATE POLICY "Users can view own domain"
  ON public.custom_domains FOR SELECT
  USING (
    account_id IN (
      SELECT account_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Only admins can insert/update/delete domains
CREATE POLICY "Admins can manage domains"
  ON public.custom_domains FOR ALL
  USING (
    account_id IN (
      SELECT account_id FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Service role can do everything (for edge functions)
CREATE POLICY "Service role full access"
  ON public.custom_domains FOR ALL
  USING (auth.role() = 'service_role');

-- 3. Public read access for domain lookups (needed by reverse proxy / edge function)
-- Only exposes verified domains
CREATE POLICY "Public can lookup verified domains"
  ON public.custom_domains FOR SELECT
  USING (verified = TRUE);

-- 4. Auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_custom_domains_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_custom_domains_updated_at
  BEFORE UPDATE ON public.custom_domains
  FOR EACH ROW
  EXECUTE FUNCTION public.update_custom_domains_updated_at();

-- 5. Sync custom_domain field on accounts table when domain is verified
-- This keeps backwards compatibility with existing URL generation triggers
CREATE OR REPLACE FUNCTION public.sync_account_custom_domain()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.verified = TRUE AND NEW.ssl_active = TRUE THEN
    UPDATE accounts SET custom_domain = NEW.domain WHERE id = NEW.account_id;
  ELSIF NEW.verified = FALSE OR NEW.ssl_active = FALSE THEN
    -- Only clear if this domain matches what's stored
    UPDATE accounts SET custom_domain = NULL
    WHERE id = NEW.account_id AND custom_domain = NEW.domain;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_sync_account_custom_domain
  AFTER INSERT OR UPDATE OF verified, ssl_active, domain ON public.custom_domains
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_account_custom_domain();

-- Also clear on delete
CREATE OR REPLACE FUNCTION public.clear_account_custom_domain_on_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE accounts SET custom_domain = NULL
  WHERE id = OLD.account_id AND custom_domain = OLD.domain;
  RETURN OLD;
END;
$$;

CREATE TRIGGER trigger_clear_account_domain_on_delete
  AFTER DELETE ON public.custom_domains
  FOR EACH ROW
  EXECUTE FUNCTION public.clear_account_custom_domain_on_delete();
