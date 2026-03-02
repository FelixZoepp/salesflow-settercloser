
-- Lead Lists table for saved prospecting searches
CREATE TABLE public.lead_lists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  created_by uuid NOT NULL,
  name text NOT NULL,
  description text,
  search_filters jsonb DEFAULT '{}'::jsonb,
  total_leads integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.lead_lists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own account lead lists"
  ON public.lead_lists FOR SELECT
  USING (account_id = get_user_account_id() OR is_super_admin());

CREATE POLICY "Users can manage own account lead lists"
  ON public.lead_lists FOR ALL
  USING (account_id = get_user_account_id() OR is_super_admin())
  WITH CHECK (account_id = get_user_account_id() OR is_super_admin());

-- Lead List Items - individual leads found by AI
CREATE TABLE public.lead_list_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id uuid NOT NULL REFERENCES public.lead_lists(id) ON DELETE CASCADE,
  account_id uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  contact_id uuid REFERENCES public.contacts(id) ON DELETE SET NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  position text,
  company text,
  industry text,
  employee_count text,
  city text,
  country text,
  website text,
  linkedin_url text,
  email text,
  phone text,
  enriched boolean DEFAULT false,
  imported boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.lead_list_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own account lead list items"
  ON public.lead_list_items FOR SELECT
  USING (account_id = get_user_account_id() OR is_super_admin());

CREATE POLICY "Users can manage own account lead list items"
  ON public.lead_list_items FOR ALL
  USING (account_id = get_user_account_id() OR is_super_admin())
  WITH CHECK (account_id = get_user_account_id() OR is_super_admin());

-- Trigger for updated_at
CREATE TRIGGER update_lead_lists_updated_at
  BEFORE UPDATE ON public.lead_lists
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
