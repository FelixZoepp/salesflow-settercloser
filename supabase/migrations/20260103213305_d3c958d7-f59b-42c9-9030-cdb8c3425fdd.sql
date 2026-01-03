-- Add voice_source_audio_url to campaigns for using custom audio as voice
ALTER TABLE public.campaigns 
ADD COLUMN IF NOT EXISTS voice_source_audio_url TEXT;

-- Add comment for clarity
COMMENT ON COLUMN public.campaigns.voice_source_audio_url IS 'URL to audio/video file used as voice source for HeyGen videos';