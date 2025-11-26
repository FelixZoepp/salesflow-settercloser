-- Create call_scripts table for global call script templates
CREATE TABLE IF NOT EXISTS public.call_scripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.call_scripts ENABLE ROW LEVEL SECURITY;

-- Only admins can manage call scripts
CREATE POLICY "Admins can manage call scripts"
  ON public.call_scripts
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- All authenticated users can view active call scripts
CREATE POLICY "Users can view active call scripts"
  ON public.call_scripts
  FOR SELECT
  USING (is_active = true AND auth.uid() IS NOT NULL);

-- Add trigger for updated_at
CREATE TRIGGER update_call_scripts_updated_at
  BEFORE UPDATE ON public.call_scripts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default call script
INSERT INTO public.call_scripts (name, content, is_active)
VALUES (
  'Standard Opening Script',
  'Guten Tag {{first_name}} {{last_name}},

mein Name ist {{user_name}} von unserem Unternehmen.

Ich rufe Sie bezüglich {{company_name}} an. Ich habe gesehen, dass Sie als {{position}} bei {{company_name}} tätig sind.

[Ihr Pitch hier...]

Hätten Sie kurz Zeit für ein Gespräch?',
  true
) ON CONFLICT DO NOTHING;