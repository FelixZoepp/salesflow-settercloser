-- Drop old constraint and add new one with pending_auto
ALTER TABLE contacts DROP CONSTRAINT IF EXISTS contacts_video_status_check;

ALTER TABLE contacts ADD CONSTRAINT contacts_video_status_check 
CHECK (video_status = ANY (ARRAY['pending'::text, 'pending_auto'::text, 'generating_intro'::text, 'merging'::text, 'uploading'::text, 'ready'::text, 'error'::text]));