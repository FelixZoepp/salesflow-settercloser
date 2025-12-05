-- Update function to also generate outreach_message for outbound leads
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
  
  -- Calculate outreach_message for outbound leads
  IF NEW.lead_type = 'outbound' AND NEW.personalized_url IS NOT NULL THEN
    NEW.outreach_message := 'Ich brauche dich nicht mit irgendwelchen Texten zu spaßen, ich habe dir ein Video aufgenommen und auf eine Webseite gepackt, um dir zu zeigen wie man über LinkedIn in 2026 5-10 Termine mehr pro Woche gewinnt. Schau gerne mal rein: ' || NEW.personalized_url;
  ELSE
    NEW.outreach_message := NULL;
  END IF;
  
  -- Clear all outbound fields for inbound leads
  IF NEW.lead_type = 'inbound' THEN
    NEW.slug := NULL;
    NEW.personalized_url := NULL;
    NEW.outreach_message := NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Update existing outbound contacts to have outreach_message
UPDATE public.contacts
SET outreach_message = 'Ich brauche dich nicht mit irgendwelchen Texten zu spaßen, ich habe dir ein Video aufgenommen und auf eine Webseite gepackt, um dir zu zeigen wie man über LinkedIn in 2026 5-10 Termine mehr pro Woche gewinnt. Schau gerne mal rein: ' || personalized_url
WHERE lead_type = 'outbound' AND personalized_url IS NOT NULL;

-- Clear outreach_message for inbound leads
UPDATE public.contacts
SET outreach_message = NULL
WHERE lead_type = 'inbound' OR lead_type IS NULL;