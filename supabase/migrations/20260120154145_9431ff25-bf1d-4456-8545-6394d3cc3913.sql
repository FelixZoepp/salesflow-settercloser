-- Create a function to auto-set account_id on deals
CREATE OR REPLACE FUNCTION public.validate_deal_account_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user_account_id uuid;
  v_contact_account_id uuid;
BEGIN
  -- Get the current user's account_id
  v_user_account_id := get_user_account_id();
  
  -- For INSERT: auto-set account_id if not provided
  IF TG_OP = 'INSERT' THEN
    -- If account_id is null, try to get it from the contact or the user
    IF NEW.account_id IS NULL THEN
      -- First try to get account_id from the linked contact
      IF NEW.contact_id IS NOT NULL THEN
        SELECT account_id INTO v_contact_account_id 
        FROM contacts 
        WHERE id = NEW.contact_id;
        
        IF v_contact_account_id IS NOT NULL THEN
          NEW.account_id := v_contact_account_id;
        END IF;
      END IF;
      
      -- If still null, use the user's account_id
      IF NEW.account_id IS NULL THEN
        NEW.account_id := v_user_account_id;
      END IF;
    END IF;
  END IF;
  
  -- For UPDATE: prevent changing account_id
  IF TG_OP = 'UPDATE' THEN
    IF OLD.account_id IS DISTINCT FROM NEW.account_id THEN
      IF NOT is_super_admin() THEN
        RAISE EXCEPTION 'Cannot move deals between accounts';
      END IF;
    END IF;
  END IF;
  
  -- Final check: account_id should be set
  IF NEW.account_id IS NULL THEN
    RAISE EXCEPTION 'Deal must have an account_id';
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create trigger for deals
DROP TRIGGER IF EXISTS validate_deal_account_id_trigger ON deals;
CREATE TRIGGER validate_deal_account_id_trigger
  BEFORE INSERT OR UPDATE ON deals
  FOR EACH ROW
  EXECUTE FUNCTION validate_deal_account_id();