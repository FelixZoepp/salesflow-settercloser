-- Create generic sync function for any table
CREATE OR REPLACE FUNCTION public.sync_table_to_external()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  v_record_id uuid;
  v_table_name text;
BEGIN
  v_table_name := TG_TABLE_NAME;
  
  IF TG_OP = 'DELETE' THEN
    v_record_id := OLD.id;
  ELSE
    v_record_id := NEW.id;
  END IF;
  
  -- Call the sync edge function asynchronously
  PERFORM extensions.http_post(
    url := 'https://dxdknkeexankgtkpeuvt.supabase.co/functions/v1/sync-table-single',
    body := jsonb_build_object(
      'tableName', v_table_name,
      'recordId', v_record_id,
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
    RAISE WARNING 'External sync failed for % table: %', v_table_name, SQLERRM;
    IF TG_OP = 'DELETE' THEN
      RETURN OLD;
    ELSE
      RETURN NEW;
    END IF;
END;
$function$;

-- Drop old contact-specific trigger and function
DROP TRIGGER IF EXISTS trigger_sync_contact_external ON contacts;
DROP FUNCTION IF EXISTS sync_contact_to_external();

-- Create triggers for all tables
DROP TRIGGER IF EXISTS trigger_sync_external ON accounts;
CREATE TRIGGER trigger_sync_external
  AFTER INSERT OR UPDATE OR DELETE ON accounts
  FOR EACH ROW EXECUTE FUNCTION sync_table_to_external();

DROP TRIGGER IF EXISTS trigger_sync_external ON profiles;
CREATE TRIGGER trigger_sync_external
  AFTER INSERT OR UPDATE OR DELETE ON profiles
  FOR EACH ROW EXECUTE FUNCTION sync_table_to_external();

DROP TRIGGER IF EXISTS trigger_sync_external ON contacts;
CREATE TRIGGER trigger_sync_external
  AFTER INSERT OR UPDATE OR DELETE ON contacts
  FOR EACH ROW EXECUTE FUNCTION sync_table_to_external();

DROP TRIGGER IF EXISTS trigger_sync_external ON deals;
CREATE TRIGGER trigger_sync_external
  AFTER INSERT OR UPDATE OR DELETE ON deals
  FOR EACH ROW EXECUTE FUNCTION sync_table_to_external();

DROP TRIGGER IF EXISTS trigger_sync_external ON companies;
CREATE TRIGGER trigger_sync_external
  AFTER INSERT OR UPDATE OR DELETE ON companies
  FOR EACH ROW EXECUTE FUNCTION sync_table_to_external();

DROP TRIGGER IF EXISTS trigger_sync_external ON activities;
CREATE TRIGGER trigger_sync_external
  AFTER INSERT OR UPDATE OR DELETE ON activities
  FOR EACH ROW EXECUTE FUNCTION sync_table_to_external();

DROP TRIGGER IF EXISTS trigger_sync_external ON tasks;
CREATE TRIGGER trigger_sync_external
  AFTER INSERT OR UPDATE OR DELETE ON tasks
  FOR EACH ROW EXECUTE FUNCTION sync_table_to_external();

DROP TRIGGER IF EXISTS trigger_sync_external ON campaigns;
CREATE TRIGGER trigger_sync_external
  AFTER INSERT OR UPDATE OR DELETE ON campaigns
  FOR EACH ROW EXECUTE FUNCTION sync_table_to_external();