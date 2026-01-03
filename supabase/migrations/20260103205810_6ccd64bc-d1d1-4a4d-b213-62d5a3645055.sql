-- Add additional security validation for contacts table

-- 1. Create a function to validate contact account_id before insert/update
CREATE OR REPLACE FUNCTION public.validate_contact_account_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_account_id uuid;
BEGIN
  -- Get the current user's account_id
  v_user_account_id := get_user_account_id();
  
  -- For INSERT: auto-set account_id if not provided or validate it matches user's account
  IF TG_OP = 'INSERT' THEN
    IF NEW.account_id IS NULL THEN
      -- Auto-set to user's account
      NEW.account_id := v_user_account_id;
    ELSIF NEW.account_id != v_user_account_id AND NOT is_super_admin() THEN
      -- Prevent inserting contacts into other accounts
      RAISE EXCEPTION 'Cannot create contacts in other accounts';
    END IF;
  END IF;
  
  -- For UPDATE: prevent changing account_id (cross-account migration)
  IF TG_OP = 'UPDATE' THEN
    IF OLD.account_id IS DISTINCT FROM NEW.account_id THEN
      IF NOT is_super_admin() THEN
        RAISE EXCEPTION 'Cannot move contacts between accounts';
      END IF;
    END IF;
  END IF;
  
  -- Final check: account_id must be set
  IF NEW.account_id IS NULL THEN
    RAISE EXCEPTION 'Contact must have an account_id';
  END IF;
  
  RETURN NEW;
END;
$$;

-- 2. Create trigger to validate contact account_id
DROP TRIGGER IF EXISTS validate_contact_account_id_trigger ON contacts;
CREATE TRIGGER validate_contact_account_id_trigger
  BEFORE INSERT OR UPDATE ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_contact_account_id();

-- 3. Update any contacts with NULL account_id to assign them properly
-- (This handles orphaned records - they get assigned to the owner's account)
UPDATE contacts c
SET account_id = (
  SELECT p.account_id 
  FROM profiles p 
  WHERE p.id = c.owner_user_id
)
WHERE c.account_id IS NULL 
  AND c.owner_user_id IS NOT NULL;

-- 4. Add NOT NULL constraint to account_id (only if all records have account_id)
-- First, delete any orphaned contacts that have no owner and no account
DELETE FROM contacts 
WHERE account_id IS NULL 
  AND owner_user_id IS NULL;

-- Now add the constraint
ALTER TABLE contacts 
ALTER COLUMN account_id SET NOT NULL;