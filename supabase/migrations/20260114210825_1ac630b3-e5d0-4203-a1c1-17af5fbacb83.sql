-- Allow all users in the same account to manage integrations (INSERT, UPDATE, DELETE)
DROP POLICY IF EXISTS "Admins can manage account integrations" ON public.account_integrations;

CREATE POLICY "Users can manage account integrations"
  ON public.account_integrations
  FOR ALL
  USING (account_id = get_user_account_id())
  WITH CHECK (account_id = get_user_account_id());

-- Allow all users in the same account to manage call scripts
DROP POLICY IF EXISTS "Admins can manage call scripts" ON public.call_scripts;
DROP POLICY IF EXISTS "Users can view active call scripts" ON public.call_scripts;

CREATE POLICY "Users can manage call scripts in their account"
  ON public.call_scripts
  FOR ALL
  USING (account_id = get_user_account_id() OR is_super_admin())
  WITH CHECK (account_id = get_user_account_id() OR is_super_admin());

CREATE POLICY "Users can view all call scripts in their account"
  ON public.call_scripts
  FOR SELECT
  USING (account_id = get_user_account_id() OR is_super_admin());