-- Add summary fields to call_sessions table
ALTER TABLE call_sessions
ADD COLUMN transcript TEXT,
ADD COLUMN summary TEXT,
ADD COLUMN key_points TEXT[],
ADD COLUMN action_items TEXT[],
ADD COLUMN sentiment TEXT,
ADD COLUMN summary_generated_at TIMESTAMP WITH TIME ZONE;