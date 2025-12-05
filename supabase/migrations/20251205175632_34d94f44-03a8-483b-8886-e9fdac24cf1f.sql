-- Update function to also generate personalized_url for outbound leads
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
  
  -- Calculate personalized_url for outbound leads
  IF NEW.lead_type = 'outbound' AND NEW.slug IS NOT NULL AND NEW.slug != '' THEN
    NEW.personalized_url := '/p/' || NEW.slug;
  ELSE
    NEW.personalized_url := NULL;
  END IF;
  
  -- Clear slug and personalized_url for inbound leads
  IF NEW.lead_type = 'inbound' THEN
    NEW.slug := NULL;
    NEW.personalized_url := NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Update existing outbound contacts to have personalized_url
UPDATE public.contacts
SET personalized_url = '/p/' || slug
WHERE lead_type = 'outbound' AND slug IS NOT NULL AND slug != '';

-- Clear personalized_url for inbound leads
UPDATE public.contacts
SET personalized_url = NULL
WHERE lead_type = 'inbound' OR lead_type IS NULL;