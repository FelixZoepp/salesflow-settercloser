-- Create trigger function to auto-generate video when connection is accepted
CREATE OR REPLACE FUNCTION public.trigger_video_generation_on_connection_accepted()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
BEGIN
  -- Only trigger when workflow_status changes TO 'vernetzung_angenommen'
  IF NEW.workflow_status = 'vernetzung_angenommen' 
     AND (OLD.workflow_status IS DISTINCT FROM 'vernetzung_angenommen')
     AND NEW.lead_type = 'outbound'
     AND NEW.video_status IS DISTINCT FROM 'ready'
     AND NEW.video_status IS DISTINCT FROM 'generating_intro'
     AND NEW.video_status IS DISTINCT FROM 'merging' THEN
    
    -- Set video status to pending to signal that generation should start
    NEW.video_status := 'pending_auto';
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create the trigger
DROP TRIGGER IF EXISTS auto_video_generation_trigger ON contacts;
CREATE TRIGGER auto_video_generation_trigger
  BEFORE UPDATE ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION trigger_video_generation_on_connection_accepted();