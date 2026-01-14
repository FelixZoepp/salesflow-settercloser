-- 1. Allow all users in the same account to READ integrations settings
CREATE POLICY "Users can view account integrations"
  ON public.account_integrations
  FOR SELECT
  USING (account_id = get_user_account_id());

-- 2. Fix profiles SELECT policy to also allow users to view their OWN profile (even without account)
DROP POLICY IF EXISTS "Users can view profiles in their account" ON public.profiles;

CREATE POLICY "Users can view profiles in their account or own"
  ON public.profiles
  FOR SELECT
  USING (
    id = auth.uid() 
    OR account_id = get_user_account_id() 
    OR is_super_admin()
  );