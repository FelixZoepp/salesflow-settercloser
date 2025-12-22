-- Add video workflow fields to campaigns
ALTER TABLE public.campaigns 
ADD COLUMN IF NOT EXISTS pitch_video_url TEXT,
ADD COLUMN IF NOT EXISTS heygen_avatar_id TEXT,
ADD COLUMN IF NOT EXISTS heygen_voice_id TEXT;

-- Add video generation status to contacts
ALTER TABLE public.contacts
ADD COLUMN IF NOT EXISTS video_status TEXT DEFAULT 'pending' CHECK (video_status IN ('pending', 'generating_intro', 'merging', 'uploading', 'ready', 'error')),
ADD COLUMN IF NOT EXISTS intro_video_url TEXT,
ADD COLUMN IF NOT EXISTS heygen_video_id TEXT,
ADD COLUMN IF NOT EXISTS video_error TEXT,
ADD COLUMN IF NOT EXISTS video_generated_at TIMESTAMP WITH TIME ZONE;

-- Create storage bucket for personalized videos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('personalized-videos', 'personalized-videos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for personalized videos
CREATE POLICY "Personalized videos are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'personalized-videos');

CREATE POLICY "Authenticated users can upload personalized videos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'personalized-videos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update personalized videos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'personalized-videos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete personalized videos"
ON storage.objects FOR DELETE
USING (bucket_id = 'personalized-videos' AND auth.uid() IS NOT NULL);

COMMENT ON COLUMN public.contacts.video_status IS 'Video generation workflow status';
COMMENT ON COLUMN public.campaigns.pitch_video_url IS 'URL to the static 2min pitch video';