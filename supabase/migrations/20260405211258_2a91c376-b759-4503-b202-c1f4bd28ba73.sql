CREATE OR REPLACE FUNCTION public.prevent_privilege_escalation()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  current_user_is_super_admin boolean;
  current_user_role text;
  current_user_account_id uuid;
BEGIN
  -- Get current user's privileges
  SELECT is_super_admin, role::text, account_id 
  INTO current_user_is_super_admin, current_user_role, current_user_account_id
  FROM profiles 
  WHERE id = auth.uid();
  
  current_user_is_super_admin := COALESCE(current_user_is_super_admin, false);
  current_user_role := COALESCE(current_user_role, 'standard');

  -- If is_super_admin is being changed
  IF OLD.is_super_admin IS DISTINCT FROM NEW.is_super_admin THEN
    IF NOT current_user_is_super_admin THEN
      RAISE EXCEPTION 'Only super admins can modify super admin status';
    END IF;
  END IF;
  
  -- If role is being changed
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    IF (OLD.role::text = 'setter' AND NEW.role::text = 'standard') OR
       (OLD.role::text = 'closer' AND NEW.role::text = 'pro') OR
       (OLD.role::text = 'standard' AND NEW.role::text = 'setter') OR
       (OLD.role::text = 'pro' AND NEW.role::text = 'closer') THEN
      NULL; -- equivalent role renames
    ELSIF NOT (current_user_is_super_admin OR current_user_role = 'admin') THEN
      RAISE EXCEPTION 'Only admins can modify user roles';
    END IF;
  END IF;
  
  -- Prevent users from changing their account_id
  IF OLD.account_id IS DISTINCT FROM NEW.account_id THEN
    IF OLD.account_id IS NOT NULL THEN
      -- Allow admins to remove members from their own account (set to NULL)
      IF NEW.account_id IS NULL 
         AND (current_user_is_super_admin OR (current_user_role = 'admin' AND current_user_account_id = OLD.account_id)) THEN
        NULL; -- allowed
      ELSIF NOT current_user_is_super_admin THEN
        RAISE EXCEPTION 'Only super admins can change account assignments';
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;