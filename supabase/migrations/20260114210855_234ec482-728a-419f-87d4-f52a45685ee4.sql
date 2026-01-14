-- Modify the privilege escalation trigger to allow assigning account_id when it's currently NULL
CREATE OR REPLACE FUNCTION public.prevent_privilege_escalation()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
  -- EXCEPTION: Allow setting account_id if it was previously NULL (initial assignment)
  IF OLD.account_id IS DISTINCT FROM NEW.account_id THEN
    IF OLD.account_id IS NOT NULL AND NOT current_user_is_super_admin THEN
      RAISE EXCEPTION 'Only super admins can change account assignments';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;