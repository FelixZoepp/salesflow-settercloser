-- Create accounts table for multi-tenancy
CREATE TABLE accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  company_name text,
  email text,
  phone text,
  is_active boolean NOT NULL DEFAULT true,
  subscription_status text DEFAULT 'trial',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on accounts
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

-- Add account_id to profiles (users belong to accounts)
ALTER TABLE profiles ADD COLUMN account_id uuid REFERENCES accounts(id) ON DELETE CASCADE;
ALTER TABLE profiles ADD COLUMN is_super_admin boolean NOT NULL DEFAULT false;

-- Create index for faster queries
CREATE INDEX idx_profiles_account_id ON profiles(account_id);
CREATE INDEX idx_profiles_super_admin ON profiles(is_super_admin) WHERE is_super_admin = true;

-- Add account_id to all relevant tables
ALTER TABLE contacts ADD COLUMN account_id uuid REFERENCES accounts(id) ON DELETE CASCADE;
ALTER TABLE companies ADD COLUMN account_id uuid REFERENCES accounts(id) ON DELETE CASCADE;
ALTER TABLE deals ADD COLUMN account_id uuid REFERENCES accounts(id) ON DELETE CASCADE;
ALTER TABLE activities ADD COLUMN account_id uuid REFERENCES accounts(id) ON DELETE CASCADE;
ALTER TABLE tasks ADD COLUMN account_id uuid REFERENCES accounts(id) ON DELETE CASCADE;
ALTER TABLE call_sessions ADD COLUMN account_id uuid REFERENCES accounts(id) ON DELETE CASCADE;
ALTER TABLE objections ADD COLUMN account_id uuid;
ALTER TABLE call_scripts ADD COLUMN account_id uuid;

-- Create indexes
CREATE INDEX idx_contacts_account_id ON contacts(account_id);
CREATE INDEX idx_companies_account_id ON companies(account_id);
CREATE INDEX idx_deals_account_id ON deals(account_id);
CREATE INDEX idx_activities_account_id ON activities(account_id);
CREATE INDEX idx_tasks_account_id ON tasks(account_id);
CREATE INDEX idx_call_sessions_account_id ON call_sessions(account_id);
CREATE INDEX idx_objections_account_id ON objections(account_id) WHERE account_id IS NOT NULL;
CREATE INDEX idx_call_scripts_account_id ON call_scripts(account_id) WHERE account_id IS NOT NULL;

-- Function to get user's account_id
CREATE OR REPLACE FUNCTION get_user_account_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT account_id FROM profiles WHERE id = auth.uid();
$$;

-- Function to check if user is super admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE((SELECT is_super_admin FROM profiles WHERE id = auth.uid()), false);
$$;

-- RLS Policies for accounts
CREATE POLICY "Super admins can view all accounts"
  ON accounts FOR SELECT
  USING (is_super_admin());

CREATE POLICY "Users can view their own account"
  ON accounts FOR SELECT
  USING (id = get_user_account_id());

CREATE POLICY "Super admins can manage all accounts"
  ON accounts FOR ALL
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

-- Update RLS policies for profiles
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

CREATE POLICY "Users can view profiles in their account"
  ON profiles FOR SELECT
  USING (account_id = get_user_account_id() OR is_super_admin());

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "Super admins can manage all profiles"
  ON profiles FOR ALL
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

-- Update RLS policies for contacts
DROP POLICY IF EXISTS "Users can view contacts they own or all if admin" ON contacts;
DROP POLICY IF EXISTS "Users can update their own contacts or all if admin" ON contacts;
DROP POLICY IF EXISTS "Users can create contacts" ON contacts;

CREATE POLICY "Users can view contacts in their account"
  ON contacts FOR SELECT
  USING (account_id = get_user_account_id() OR is_super_admin());

CREATE POLICY "Users can manage contacts in their account"
  ON contacts FOR ALL
  USING (account_id = get_user_account_id() OR is_super_admin())
  WITH CHECK (account_id = get_user_account_id() OR is_super_admin());

-- Update RLS policies for companies
DROP POLICY IF EXISTS "Users can view companies they own or all if admin" ON companies;
DROP POLICY IF EXISTS "Users can update their own companies or all if admin" ON companies;
DROP POLICY IF EXISTS "Users can create companies" ON companies;

CREATE POLICY "Users can view companies in their account"
  ON companies FOR SELECT
  USING (account_id = get_user_account_id() OR is_super_admin());

CREATE POLICY "Users can manage companies in their account"
  ON companies FOR ALL
  USING (account_id = get_user_account_id() OR is_super_admin())
  WITH CHECK (account_id = get_user_account_id() OR is_super_admin());

-- Update RLS policies for deals
DROP POLICY IF EXISTS "Users can view deals they are involved in or all if admin" ON deals;
DROP POLICY IF EXISTS "Users can update deals they are involved in or all if admin" ON deals;
DROP POLICY IF EXISTS "Users can create deals" ON deals;

CREATE POLICY "Users can view deals in their account"
  ON deals FOR SELECT
  USING (account_id = get_user_account_id() OR is_super_admin());

CREATE POLICY "Users can manage deals in their account"
  ON deals FOR ALL
  USING (account_id = get_user_account_id() OR is_super_admin())
  WITH CHECK (account_id = get_user_account_id() OR is_super_admin());

-- Update RLS policies for activities
DROP POLICY IF EXISTS "Users can view activities they created or related to their deal" ON activities;
DROP POLICY IF EXISTS "Users can create activities" ON activities;

CREATE POLICY "Users can view activities in their account"
  ON activities FOR SELECT
  USING (account_id = get_user_account_id() OR is_super_admin());

CREATE POLICY "Users can manage activities in their account"
  ON activities FOR ALL
  USING (account_id = get_user_account_id() OR is_super_admin())
  WITH CHECK (account_id = get_user_account_id() OR is_super_admin());

-- Update RLS policies for tasks
DROP POLICY IF EXISTS "Users can view tasks assigned to them or all if admin" ON tasks;
DROP POLICY IF EXISTS "Users can update their assigned tasks or all if admin" ON tasks;
DROP POLICY IF EXISTS "Users can create tasks" ON tasks;

CREATE POLICY "Users can view tasks in their account"
  ON tasks FOR SELECT
  USING (account_id = get_user_account_id() OR is_super_admin());

CREATE POLICY "Users can manage tasks in their account"
  ON tasks FOR ALL
  USING (account_id = get_user_account_id() OR is_super_admin())
  WITH CHECK (account_id = get_user_account_id() OR is_super_admin());

-- Update trigger for accounts updated_at
CREATE TRIGGER update_accounts_updated_at
  BEFORE UPDATE ON accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE accounts IS 'Multi-tenant accounts for customer separation';
COMMENT ON COLUMN profiles.account_id IS 'Links user to their tenant account';
COMMENT ON COLUMN profiles.is_super_admin IS 'Master admin with access to all accounts';