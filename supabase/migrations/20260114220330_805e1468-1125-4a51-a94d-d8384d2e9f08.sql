-- Create storage bucket for account logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('account-logos', 'account-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to their account folder
CREATE POLICY "Users can upload logos to their account folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'account-logos' 
  AND (storage.foldername(name))[1] = (SELECT get_user_account_id()::text)
);

-- Allow authenticated users to update their account logos
CREATE POLICY "Users can update their account logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'account-logos' 
  AND (storage.foldername(name))[1] = (SELECT get_user_account_id()::text)
);

-- Allow authenticated users to delete their account logos
CREATE POLICY "Users can delete their account logos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'account-logos' 
  AND (storage.foldername(name))[1] = (SELECT get_user_account_id()::text)
);

-- Allow public read access since logos are public
CREATE POLICY "Public can view account logos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'account-logos');