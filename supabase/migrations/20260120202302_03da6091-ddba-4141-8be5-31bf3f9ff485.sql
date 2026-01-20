-- Update the outreach message template to new format
CREATE OR REPLACE FUNCTION public.generate_outbound_slug()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_custom_domain TEXT;
BEGIN
  -- Only generate slug for outbound leads that don't already have one
  IF NEW.lead_type = 'outbound' AND (NEW.slug IS NULL OR NEW.slug = '') THEN
    NEW.slug := lower(
      regexp_replace(NEW.first_name, '[^a-zA-Z0-9]', '', 'g') || '-' ||
      regexp_replace(NEW.last_name, '[^a-zA-Z0-9]', '', 'g') || '-' ||
      right(NEW.id::text, 3)
    );
  END IF;
  
  -- Get custom domain from account
  SELECT custom_domain INTO v_custom_domain 
  FROM accounts 
  WHERE id = NEW.account_id;
  
  -- Calculate personalized_url for outbound leads with account's domain or fallback
  IF NEW.lead_type = 'outbound' AND NEW.slug IS NOT NULL AND NEW.slug != '' THEN
    IF v_custom_domain IS NOT NULL AND v_custom_domain != '' THEN
      NEW.personalized_url := 'https://' || v_custom_domain || '/p/' || NEW.slug;
    ELSE
      NEW.personalized_url := 'https://hochpreis-leads.de/p/' || NEW.slug;
    END IF;
  ELSE
    NEW.personalized_url := NULL;
  END IF;
  
  -- Calculate outreach_message for outbound leads with personalized greeting
  IF NEW.lead_type = 'outbound' AND NEW.personalized_url IS NOT NULL THEN
    NEW.outreach_message := 'Hallo ' || NEW.first_name || ', ich habe dir kurz ein Video aufgenommen. Deine Meinung würde mich mal interessieren.

' || NEW.personalized_url || '

MfG Felix';
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

-- Also update the domain change trigger to use the new message format
CREATE OR REPLACE FUNCTION public.update_contact_urls_for_domain()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Only run if custom_domain changed
  IF OLD.custom_domain IS DISTINCT FROM NEW.custom_domain THEN
    -- Update all outbound contacts for this account
    UPDATE contacts
    SET 
      personalized_url = CASE 
        WHEN NEW.custom_domain IS NOT NULL AND NEW.custom_domain != '' THEN
          'https://' || NEW.custom_domain || '/p/' || slug
        ELSE
          'https://hochpreis-leads.de/p/' || slug
      END,
      outreach_message = 'Hallo ' || first_name || ', ich habe dir kurz ein Video aufgenommen. Deine Meinung würde mich mal interessieren.

' || CASE 
        WHEN NEW.custom_domain IS NOT NULL AND NEW.custom_domain != '' THEN
          'https://' || NEW.custom_domain || '/p/' || slug
        ELSE
          'https://hochpreis-leads.de/p/' || slug
      END || '

MfG Felix',
      updated_at = now()
    WHERE account_id = NEW.id 
      AND lead_type = 'outbound' 
      AND slug IS NOT NULL 
      AND slug != '';
  END IF;
  
  RETURN NEW;
END;
$function$;