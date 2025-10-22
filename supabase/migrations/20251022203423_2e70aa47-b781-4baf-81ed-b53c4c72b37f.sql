-- Add stage field to contacts for cold calling pipeline
ALTER TABLE public.contacts 
ADD COLUMN IF NOT EXISTS stage text DEFAULT 'Lead';

-- Add status field if not exists
ALTER TABLE public.contacts 
ADD COLUMN IF NOT EXISTS status text;

-- Create index for stage-based queries
CREATE INDEX IF NOT EXISTS idx_contacts_stage ON public.contacts(stage);

-- Update activities to support contact_id being optional for deal activities
-- No change needed, already nullable

-- Create materialized view for last activity per contact
CREATE MATERIALIZED VIEW IF NOT EXISTS public.contact_last_activity AS
SELECT
  c.id as contact_id,
  MAX(a.created_at) as last_activity_at
FROM public.contacts c
LEFT JOIN public.activities a ON a.contact_id = c.id
GROUP BY c.id;

-- Create index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_contact_last_activity_contact_id 
ON public.contact_last_activity(contact_id);

-- Create view for cold call queue (next leads to call)
CREATE OR REPLACE VIEW public.cold_call_queue AS
SELECT
  c.*,
  COALESCE(cla.last_activity_at, TIMESTAMP '1970-01-01') as last_activity_at
FROM public.contacts c
LEFT JOIN public.contact_last_activity cla ON cla.contact_id = c.id
WHERE c.stage IN (
  'Lead',
  '1× nicht erreicht',
  '2× nicht erreicht',
  '3× nicht erreicht',
  'Entscheider nicht erreichbar',
  'Im Urlaub'
)
ORDER BY COALESCE(cla.last_activity_at, TIMESTAMP '1970-01-01') ASC, c.created_at ASC;

-- Function to refresh the materialized view
CREATE OR REPLACE FUNCTION refresh_contact_last_activity()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY contact_last_activity;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;