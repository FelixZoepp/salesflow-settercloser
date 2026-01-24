-- Add Twilio credentials columns to account_integrations
ALTER TABLE public.account_integrations
ADD COLUMN IF NOT EXISTS twilio_account_sid TEXT,
ADD COLUMN IF NOT EXISTS twilio_auth_token TEXT,
ADD COLUMN IF NOT EXISTS twilio_phone_number TEXT,
ADD COLUMN IF NOT EXISTS twilio_api_key_sid TEXT,
ADD COLUMN IF NOT EXISTS twilio_api_key_secret TEXT;