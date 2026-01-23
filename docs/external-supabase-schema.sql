-- =====================================================
-- EXTERNAL SUPABASE SCHEMA FOR DATA MIRRORING
-- Run this SQL in your external Supabase SQL Editor
-- =====================================================

-- 1. ACCOUNTS TABLE
CREATE TABLE IF NOT EXISTS public.accounts (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  company_name TEXT,
  email TEXT,
  phone TEXT,
  is_active BOOLEAN DEFAULT true,
  subscription_status TEXT DEFAULT 'trial',
  custom_domain TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone_number TEXT,
  role TEXT DEFAULT 'setter',
  account_id UUID REFERENCES public.accounts(id),
  is_super_admin BOOLEAN DEFAULT false,
  onboarding_completed BOOLEAN DEFAULT false,
  calendar_url TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. COMPANIES TABLE
CREATE TABLE IF NOT EXISTS public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id UUID UNIQUE,
  name TEXT NOT NULL,
  website TEXT,
  phone TEXT,
  street TEXT,
  zip TEXT,
  city TEXT,
  country TEXT,
  account_id UUID REFERENCES public.accounts(id),
  owner_user_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. CAMPAIGNS TABLE
CREATE TABLE IF NOT EXISTS public.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id UUID UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'draft',
  start_date DATE,
  end_date DATE,
  pitch_video_url TEXT,
  account_id UUID REFERENCES public.accounts(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. CONTACTS TABLE
CREATE TABLE IF NOT EXISTS public.contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id UUID UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  mobile TEXT,
  company TEXT,
  position TEXT,
  linkedin_url TEXT,
  website TEXT,
  street TEXT,
  city TEXT,
  country TEXT,
  notes TEXT,
  tags TEXT[],
  stage TEXT DEFAULT 'Lead',
  status TEXT,
  lead_type TEXT DEFAULT 'inbound',
  lead_score INTEGER DEFAULT 0,
  workflow_status TEXT DEFAULT 'neu',
  source TEXT,
  campaign_id UUID,
  company_id UUID,
  account_id UUID REFERENCES public.accounts(id),
  owner_user_id UUID REFERENCES public.profiles(id),
  viewed BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  video_status TEXT DEFAULT 'pending',
  slug TEXT,
  personalized_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. DEALS TABLE
CREATE TABLE IF NOT EXISTS public.deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id UUID UNIQUE,
  title TEXT NOT NULL,
  contact_id UUID,
  stage TEXT DEFAULT 'New',
  pipeline TEXT DEFAULT 'Sales',
  amount_eur NUMERIC DEFAULT 0,
  probability_pct INTEGER DEFAULT 0,
  due_date DATE,
  next_action TEXT,
  setter_id UUID REFERENCES public.profiles(id),
  closer_id UUID REFERENCES public.profiles(id),
  account_id UUID REFERENCES public.accounts(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 7. ACTIVITIES TABLE
CREATE TABLE IF NOT EXISTS public.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id UUID UNIQUE,
  deal_id UUID,
  contact_id UUID,
  user_id UUID REFERENCES public.profiles(id),
  type TEXT NOT NULL,
  note TEXT,
  timestamp TIMESTAMPTZ DEFAULT now(),
  duration_min INTEGER,
  outcome TEXT,
  account_id UUID REFERENCES public.accounts(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. TASKS TABLE
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id UUID UNIQUE,
  title TEXT NOT NULL,
  related_type TEXT,
  related_id UUID,
  assignee_id UUID REFERENCES public.profiles(id),
  due_date DATE,
  status TEXT DEFAULT 'open',
  account_id UUID REFERENCES public.accounts(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_contacts_account_id ON public.contacts(account_id);
CREATE INDEX IF NOT EXISTS idx_contacts_external_id ON public.contacts(external_id);
CREATE INDEX IF NOT EXISTS idx_deals_account_id ON public.deals(account_id);
CREATE INDEX IF NOT EXISTS idx_deals_external_id ON public.deals(external_id);
CREATE INDEX IF NOT EXISTS idx_activities_account_id ON public.activities(account_id);
CREATE INDEX IF NOT EXISTS idx_tasks_account_id ON public.tasks(account_id);
CREATE INDEX IF NOT EXISTS idx_profiles_account_id ON public.profiles(account_id);
CREATE INDEX IF NOT EXISTS idx_companies_account_id ON public.companies(account_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_account_id ON public.campaigns(account_id);

-- Grant permissions (adjust as needed)
-- ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- After running this, execute the bulk sync again!
-- =====================================================
