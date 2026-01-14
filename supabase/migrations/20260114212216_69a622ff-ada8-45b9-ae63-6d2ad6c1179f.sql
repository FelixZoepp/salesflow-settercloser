-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can manage call scripts in their account" ON public.call_scripts;
DROP POLICY IF EXISTS "Users can view all call scripts in their account" ON public.call_scripts;

-- Create new policies that allow access to scripts with NULL account_id (global) OR matching account_id
CREATE POLICY "Users can view call scripts" 
ON public.call_scripts 
FOR SELECT 
TO authenticated
USING (
  account_id IS NULL 
  OR account_id = get_user_account_id() 
  OR is_super_admin()
);

CREATE POLICY "Users can manage call scripts" 
ON public.call_scripts 
FOR ALL 
TO authenticated
USING (
  account_id IS NULL 
  OR account_id = get_user_account_id() 
  OR is_super_admin()
)
WITH CHECK (
  account_id IS NULL 
  OR account_id = get_user_account_id() 
  OR is_super_admin()
);