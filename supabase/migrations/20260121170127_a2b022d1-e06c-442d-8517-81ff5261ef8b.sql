-- Add Twilio TwiML App SID to account_integrations
ALTER TABLE public.account_integrations 
ADD COLUMN IF NOT EXISTS twilio_twiml_app_sid TEXT;