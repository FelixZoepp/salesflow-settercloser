-- Add LinkedIn profile assessment fields to campaigns table
ALTER TABLE public.campaigns
ADD COLUMN linkedin_profile_age TEXT DEFAULT NULL,
ADD COLUMN linkedin_currently_active BOOLEAN DEFAULT false,
ADD COLUMN linkedin_was_banned BOOLEAN DEFAULT false,
ADD COLUMN max_daily_connections INTEGER DEFAULT 15,
ADD COLUMN max_daily_messages INTEGER DEFAULT 10,
ADD COLUMN acceptance_rate_pct INTEGER DEFAULT NULL,
ADD COLUMN recommended_connections INTEGER DEFAULT 15;