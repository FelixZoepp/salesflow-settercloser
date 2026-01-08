-- Add SIP/VoIP provider settings to account_integrations
ALTER TABLE public.account_integrations
ADD COLUMN IF NOT EXISTS sip_provider text,
ADD COLUMN IF NOT EXISTS sip_server text,
ADD COLUMN IF NOT EXISTS sip_domain text,
ADD COLUMN IF NOT EXISTS sip_username text,
ADD COLUMN IF NOT EXISTS sip_password_encrypted text,
ADD COLUMN IF NOT EXISTS sip_display_name text,
ADD COLUMN IF NOT EXISTS sip_enabled boolean DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN public.account_integrations.sip_provider IS 'SIP provider type: placetel, sipgate, twilio, custom';
COMMENT ON COLUMN public.account_integrations.sip_server IS 'WebSocket SIP server URL (e.g., wss://pbx.placetel.de)';
COMMENT ON COLUMN public.account_integrations.sip_domain IS 'SIP domain for URI construction';
COMMENT ON COLUMN public.account_integrations.sip_username IS 'SIP authentication username/login';
COMMENT ON COLUMN public.account_integrations.sip_password_encrypted IS 'Encrypted SIP password';
COMMENT ON COLUMN public.account_integrations.sip_display_name IS 'Caller ID display name';
COMMENT ON COLUMN public.account_integrations.sip_enabled IS 'Whether SIP calling is enabled';