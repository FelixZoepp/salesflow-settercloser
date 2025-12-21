
CREATE OR REPLACE FUNCTION public.generate_outbound_slug()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Only generate slug for outbound leads that don't already have one
  IF NEW.lead_type = 'outbound' AND (NEW.slug IS NULL OR NEW.slug = '') THEN
    NEW.slug := lower(
      regexp_replace(NEW.first_name, '[^a-zA-Z0-9]', '', 'g') || '-' ||
      regexp_replace(NEW.last_name, '[^a-zA-Z0-9]', '', 'g') || '-' ||
      right(NEW.id::text, 3)
    );
  END IF;
  
  -- Calculate personalized_url for outbound leads with full domain
  IF NEW.lead_type = 'outbound' AND NEW.slug IS NOT NULL AND NEW.slug != '' THEN
    NEW.personalized_url := 'https://hochpreis-leads.de/p/' || NEW.slug;
  ELSE
    NEW.personalized_url := NULL;
  END IF;
  
  -- Calculate outreach_message for outbound leads with full URL
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
$function$;
