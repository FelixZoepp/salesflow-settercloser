ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS assigned_user_id uuid REFERENCES public.profiles(id);

COMMENT ON COLUMN public.campaigns.assigned_user_id IS 'Team member assigned to receive hot lead notifications from this campaign';