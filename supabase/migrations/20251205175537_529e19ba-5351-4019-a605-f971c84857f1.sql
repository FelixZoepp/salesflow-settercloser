-- Create function to auto-generate slug for outbound leads
CREATE OR REPLACE FUNCTION public.generate_outbound_slug()
RETURNS TRIGGER AS $$
BEGIN
  -- Only generate slug for outbound leads that don't already have one
  IF NEW.lead_type = 'outbound' AND (NEW.slug IS NULL OR NEW.slug = '') THEN
    NEW.slug := lower(
      regexp_replace(NEW.first_name, '[^a-zA-Z0-9]', '', 'g') || '-' ||
      regexp_replace(NEW.last_name, '[^a-zA-Z0-9]', '', 'g') || '-' ||
      right(NEW.id::text, 3)
    );
  END IF;
  
  -- Clear slug for inbound leads
  IF NEW.lead_type = 'inbound' THEN
    NEW.slug := NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for INSERT
DROP TRIGGER IF EXISTS trigger_generate_outbound_slug_insert ON public.contacts;
CREATE TRIGGER trigger_generate_outbound_slug_insert
  BEFORE INSERT ON public.contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_outbound_slug();

-- Create trigger for UPDATE (when lead_type changes)
DROP TRIGGER IF EXISTS trigger_generate_outbound_slug_update ON public.contacts;
CREATE TRIGGER trigger_generate_outbound_slug_update
  BEFORE UPDATE ON public.contacts
  FOR EACH ROW
  WHEN (OLD.lead_type IS DISTINCT FROM NEW.lead_type OR NEW.slug IS NULL)
  EXECUTE FUNCTION public.generate_outbound_slug();

-- Update existing outbound contacts that don't have slugs
UPDATE public.contacts
SET slug = lower(
  regexp_replace(first_name, '[^a-zA-Z0-9]', '', 'g') || '-' ||
  regexp_replace(last_name, '[^a-zA-Z0-9]', '', 'g') || '-' ||
  right(id::text, 3)
)
WHERE lead_type = 'outbound' AND (slug IS NULL OR slug = '');