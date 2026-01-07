-- Add trial fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS invited_via UUID REFERENCES public.invitations(id);

-- Comment for clarity
COMMENT ON COLUMN public.profiles.trial_ends_at IS 'End date of trial period for invited users';
COMMENT ON COLUMN public.profiles.invited_via IS 'Reference to the invitation used to create this account';