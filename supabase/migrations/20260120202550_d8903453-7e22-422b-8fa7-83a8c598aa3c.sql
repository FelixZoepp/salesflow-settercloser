-- Update trigger to generate outreach message when connection is accepted
CREATE OR REPLACE FUNCTION public.trigger_video_generation_on_connection_accepted()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
DECLARE
  v_custom_domain TEXT;
  v_personalized_url TEXT;
BEGIN
  -- Only trigger when workflow_status changes TO 'vernetzung_angenommen'
  IF NEW.workflow_status = 'vernetzung_angenommen' 
     AND (OLD.workflow_status IS DISTINCT FROM 'vernetzung_angenommen')
     AND NEW.lead_type = 'outbound' THEN
    
    -- Set video status to pending if not already generating/ready
    IF NEW.video_status IS DISTINCT FROM 'ready'
       AND NEW.video_status IS DISTINCT FROM 'generating_intro'
       AND NEW.video_status IS DISTINCT FROM 'merging' THEN
      NEW.video_status := 'pending_auto';
    END IF;
    
    -- Generate the outreach message now that connection is accepted
    IF NEW.personalized_url IS NOT NULL THEN
      NEW.outreach_message := 'Hallo ' || NEW.first_name || ', ich habe dir kurz ein Video aufgenommen. Deine Meinung würde mich mal interessieren.

' || NEW.personalized_url || '

MfG Felix';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Update the slug generator to NOT set outreach_message (only set URL and slug)
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
  
  -- Do NOT set outreach_message here - it's set when connection is accepted
  -- Only clear outreach_message for inbound leads
  IF NEW.lead_type = 'inbound' THEN
    NEW.slug := NULL;
    NEW.personalized_url := NULL;
    NEW.outreach_message := NULL;
  END IF;
  
  RETURN NEW;
END;
$function$;