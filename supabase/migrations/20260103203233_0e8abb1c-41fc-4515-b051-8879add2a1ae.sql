-- Create functions for secure API key storage
-- Note: Using pgcrypto for encryption (already enabled in Supabase)

-- Table to store encrypted API keys (simpler approach than Vault)
CREATE TABLE public.encrypted_api_keys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  key_name TEXT NOT NULL,
  encrypted_value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(account_id, key_name)
);

-- Enable RLS
ALTER TABLE public.encrypted_api_keys ENABLE ROW LEVEL SECURITY;

-- Only service role can access (via edge functions)
CREATE POLICY "Service role only"
ON public.encrypted_api_keys
FOR ALL
USING (false)
WITH CHECK (false);