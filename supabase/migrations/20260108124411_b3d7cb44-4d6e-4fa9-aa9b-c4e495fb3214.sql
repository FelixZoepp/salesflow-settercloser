-- Create storage bucket for call recordings
INSERT INTO storage.buckets (id, name, public)
VALUES ('call-recordings', 'call-recordings', false)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload recordings
CREATE POLICY "Users can upload call recordings"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'call-recordings');

-- Allow users to read their own recordings (via their account)
CREATE POLICY "Users can read call recordings"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'call-recordings');

-- Allow users to delete their own recordings
CREATE POLICY "Users can delete call recordings"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'call-recordings');