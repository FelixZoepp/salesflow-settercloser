-- Enable pg_net extension for HTTP calls from triggers
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Create function to sync contact to external database
CREATE OR REPLACE FUNCTION public.sync_contact_to_external()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  v_contact_id uuid;
  v_supabase_url text;
  v_service_key text;
BEGIN
  -- Determine which contact to sync
  IF TG_OP = 'DELETE' THEN
    v_contact_id := OLD.id;
  ELSE
    v_contact_id := NEW.id;
  END IF;
  
  -- Get the edge function URL from environment
  v_supabase_url := current_setting('app.settings.supabase_url', true);
  v_service_key := current_setting('app.settings.service_role_key', true);
  
  -- Call the sync edge function asynchronously
  PERFORM extensions.http_post(
    url := 'https://dxdknkeexankgtkpeuvt.supabase.co/functions/v1/sync-contact-single',
    body := jsonb_build_object(
      'contactId', v_contact_id,
      'operation', TG_OP
    )::text,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-internal-secret', current_setting('app.settings.internal_sync_secret', true)
    )::jsonb
  );
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't block the original operation
    RAISE WARNING 'External sync failed: %', SQLERRM;
    IF TG_OP = 'DELETE' THEN
      RETURN OLD;
    ELSE
      RETURN NEW;
    END IF;
END;
$function$;

-- Create trigger for contact changes
DROP TRIGGER IF EXISTS trigger_sync_contact_external ON contacts;
CREATE TRIGGER trigger_sync_contact_external
  AFTER INSERT OR UPDATE OR DELETE ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION sync_contact_to_external();