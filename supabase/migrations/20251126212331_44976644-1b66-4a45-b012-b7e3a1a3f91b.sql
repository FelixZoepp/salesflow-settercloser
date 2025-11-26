-- Create storage bucket for call recordings
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'call-recordings',
  'call-recordings',
  false,
  52428800, -- 50MB limit
  ARRAY['audio/webm', 'audio/wav', 'audio/mp3', 'audio/mpeg']
);

-- Add recording_url to call_sessions table
ALTER TABLE call_sessions
ADD COLUMN recording_url TEXT,
ADD COLUMN recording_duration_seconds INTEGER;

-- RLS policies for call-recordings bucket
CREATE POLICY "Users can upload their own recordings"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'call-recordings' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own recordings"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'call-recordings' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Admins can view all recordings"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'call-recordings' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Users can delete their own recordings"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'call-recordings' AND
  auth.uid()::text = (storage.foldername(name))[1]
);