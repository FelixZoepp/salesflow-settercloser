-- First, update the prevent_privilege_escalation function to allow role changes when roles are equivalent
-- (setter -> standard, closer -> pro are not privilege escalations)
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
  
  -- Default to false/standard if not found
  current_user_is_super_admin := COALESCE(current_user_is_super_admin, false);
  current_user_role := COALESCE(current_user_role, 'standard');

  -- If is_super_admin is being changed
  IF OLD.is_super_admin IS DISTINCT FROM NEW.is_super_admin THEN
    -- Only allow if the current user is already a super admin
    IF NOT current_user_is_super_admin THEN
      RAISE EXCEPTION 'Only super admins can modify super admin status';
    END IF;
  END IF;
  
  -- If role is being changed
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    -- Allow equivalent role changes (setter<->standard, closer<->pro)
    IF (OLD.role::text = 'setter' AND NEW.role::text = 'standard') OR
       (OLD.role::text = 'closer' AND NEW.role::text = 'pro') OR
       (OLD.role::text = 'standard' AND NEW.role::text = 'setter') OR
       (OLD.role::text = 'pro' AND NEW.role::text = 'closer') THEN
      -- These are equivalent role renames, allow them
      NULL;
    ELSIF NOT (current_user_is_super_admin OR current_user_role = 'admin') THEN
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

-- Now the migration will work
-- Migrate existing users from 'setter' to 'standard'
UPDATE public.profiles 
SET role = 'standard'::user_role 
WHERE role = 'setter'::user_role;

-- Migrate existing users from 'closer' to 'pro'
UPDATE public.profiles 
SET role = 'pro'::user_role 
WHERE role = 'closer'::user_role;

-- Update the handle_new_user function to use 'standard' as default role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'New User'),
    NEW.email,
    'standard'
  );
  RETURN NEW;
END;
$function$;