-- Create invitations table for test account links
CREATE TABLE public.invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email_hint TEXT, -- Optional: pre-fill email if known
  role public.user_role DEFAULT 'setter',
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days'),
  used_at TIMESTAMP WITH TIME ZONE,
  used_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- Super admins can manage all invitations
CREATE POLICY "Super admins can manage invitations"
ON public.invitations
FOR ALL
USING (public.is_super_admin())
WITH CHECK (public.is_super_admin());

-- Account admins can view their own account's invitations
CREATE POLICY "Account admins can view their invitations"
ON public.invitations
FOR SELECT
USING (account_id = public.get_user_account_id());

-- Account admins can create invitations for their account
CREATE POLICY "Account admins can create invitations"
ON public.invitations
FOR INSERT
WITH CHECK (account_id = public.get_user_account_id());

-- Public can read unexpired, unused invitations by token (for registration)
CREATE POLICY "Public can read valid invitations by token"
ON public.invitations
FOR SELECT
USING (
  used_at IS NULL 
  AND expires_at > now()
);

-- Index for fast token lookup
CREATE INDEX idx_invitations_token ON public.invitations(token);