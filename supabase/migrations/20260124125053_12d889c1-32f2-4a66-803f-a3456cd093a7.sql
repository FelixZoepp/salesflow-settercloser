-- Add new enum values
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'standard';
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'pro';