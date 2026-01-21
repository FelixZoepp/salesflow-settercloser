CREATE OR REPLACE FUNCTION public.trigger_video_generation_on_connection_accepted()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_name TEXT;
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
    
    -- Get the user's name from profiles
    SELECT COALESCE(
      SPLIT_PART(name, ' ', 1), -- First name only
      'Felix'
    ) INTO v_user_name
    FROM profiles
    WHERE id = NEW.owner_user_id;
    
    -- Generate the outreach message now that connection is accepted
    IF NEW.personalized_url IS NOT NULL THEN
      NEW.outreach_message := 'Hey ' || NEW.first_name || ',

ich habe dir gerade mal ein Video aufgenommen, schau mal kurz rein bitte: ' || NEW.personalized_url || '

MfG ' || COALESCE(v_user_name, 'Felix');
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;