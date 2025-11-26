-- Add system_context column to call_scripts for AI objection handling
ALTER TABLE call_scripts ADD COLUMN system_context text;

COMMENT ON COLUMN call_scripts.system_context IS 'System context for AI objection handling - product info, company info, general objection handling strategies';

-- Create table for live call sessions
CREATE TABLE call_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  ended_at timestamp with time zone,
  duration_seconds integer,
  objections_detected jsonb DEFAULT '[]'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE call_sessions ENABLE ROW LEVEL SECURITY;

-- RLS policies for call_sessions
CREATE POLICY "Users can create their own call sessions"
  ON call_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own call sessions or all if admin"
  ON call_sessions FOR SELECT
  USING (
    auth.uid() = user_id 
    OR EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Users can update their own call sessions"
  ON call_sessions FOR UPDATE
  USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_call_sessions_deal_id ON call_sessions(deal_id);
CREATE INDEX idx_call_sessions_user_id ON call_sessions(user_id);

COMMENT ON TABLE call_sessions IS 'Tracks live call sessions with AI objection detection';