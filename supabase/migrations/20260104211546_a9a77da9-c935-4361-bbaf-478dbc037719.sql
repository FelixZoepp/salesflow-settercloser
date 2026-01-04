-- Add calendar_url to profiles table for user-specific calendar links
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS calendar_url TEXT;

-- Add calendar_url to landing_pages for page-specific override
ALTER TABLE public.landing_pages 
ADD COLUMN IF NOT EXISTS calendar_url TEXT;