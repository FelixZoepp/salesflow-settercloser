-- Add AVV acceptance field to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS avv_accepted_at timestamp with time zone DEFAULT NULL;

-- Add comment for clarity
COMMENT ON COLUMN public.profiles.avv_accepted_at IS 'Timestamp when user accepted the AVV (Auftragsverarbeitungsvertrag)';