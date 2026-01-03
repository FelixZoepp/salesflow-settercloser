-- Tabelle für Account-spezifische HeyGen Einstellungen
CREATE TABLE public.account_integrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  heygen_avatar_id TEXT,
  heygen_voice_id TEXT,
  heygen_api_key_id UUID, -- Reference to vault secret
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(account_id)
);

-- Enable RLS
ALTER TABLE public.account_integrations ENABLE ROW LEVEL SECURITY;

-- Policy: Nur Account-Admins können ihre Integrationen sehen/bearbeiten
CREATE POLICY "Admins can manage account integrations"
ON public.account_integrations
FOR ALL
USING (
  account_id = get_user_account_id() 
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'::user_role
  )
)
WITH CHECK (
  account_id = get_user_account_id() 
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'::user_role
  )
);

-- Super admins können alles sehen
CREATE POLICY "Super admins can manage all integrations"
ON public.account_integrations
FOR ALL
USING (is_super_admin())
WITH CHECK (is_super_admin());

-- Trigger für updated_at
CREATE TRIGGER update_account_integrations_updated_at
  BEFORE UPDATE ON public.account_integrations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();