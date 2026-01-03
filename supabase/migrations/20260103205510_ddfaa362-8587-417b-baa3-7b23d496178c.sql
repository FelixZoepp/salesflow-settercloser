-- Create a trigger function to prevent privilege escalation
-- This prevents users from modifying sensitive fields like is_super_admin, role, or account_id
CREATE OR REPLACE FUNCTION public.prevent_privilege_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_is_super_admin boolean;
  current_user_role text;
BEGIN
  -- Get current user's privileges (using direct query to avoid recursion)
  SELECT is_super_admin, role::text INTO current_user_is_super_admin, current_user_role
  FROM profiles 
  WHERE id = auth.uid();
  
  -- Default to false/setter if not found
  current_user_is_super_admin := COALESCE(current_user_is_super_admin, false);
  current_user_role := COALESCE(current_user_role, 'setter');

  -- If is_super_admin is being changed
  IF OLD.is_super_admin IS DISTINCT FROM NEW.is_super_admin THEN
    -- Only allow if the current user is already a super admin
    IF NOT current_user_is_super_admin THEN
      RAISE EXCEPTION 'Only super admins can modify super admin status';
    END IF;
  END IF;
  
  -- If role is being changed
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    -- Only allow if the current user is an admin or super admin
    IF NOT (current_user_is_super_admin OR current_user_role = 'admin') THEN
      RAISE EXCEPTION 'Only admins can modify user roles';
    END IF;
  END IF;
  
  -- Prevent users from changing their account_id (moving to different accounts)
  IF OLD.account_id IS DISTINCT FROM NEW.account_id THEN
    IF NOT current_user_is_super_admin THEN
      RAISE EXCEPTION 'Only super admins can change account assignments';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create the trigger
DROP TRIGGER IF EXISTS prevent_privilege_escalation_trigger ON profiles;
CREATE TRIGGER prevent_privilege_escalation_trigger
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_privilege_escalation();