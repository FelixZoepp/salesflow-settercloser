-- ============================================
-- 1. Add member_code to profiles
-- ============================================
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS member_code INTEGER;

-- Auto-assign member codes (1001, 1002, ...) per account
CREATE OR REPLACE FUNCTION public.assign_member_code()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  v_next_code INTEGER;
BEGIN
  IF NEW.account_id IS NOT NULL AND NEW.member_code IS NULL THEN
    SELECT COALESCE(MAX(member_code), 1000) + 1
    INTO v_next_code
    FROM profiles
    WHERE account_id = NEW.account_id
      AND member_code IS NOT NULL;
    NEW.member_code := v_next_code;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE TRIGGER trigger_assign_member_code
  BEFORE INSERT OR UPDATE OF account_id ON public.profiles
  FOR EACH ROW
  WHEN (NEW.member_code IS NULL AND NEW.account_id IS NOT NULL)
  EXECUTE FUNCTION public.assign_member_code();

-- Backfill: assign codes to existing profiles that don't have one
DO $$
DECLARE
  r RECORD;
  v_code INTEGER;
BEGIN
  FOR r IN (
    SELECT DISTINCT account_id FROM profiles
    WHERE account_id IS NOT NULL AND member_code IS NULL
  ) LOOP
    v_code := 1000;
    UPDATE profiles SET member_code = sub.new_code
    FROM (
      SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) + 1000 AS new_code
      FROM profiles
      WHERE account_id = r.account_id AND member_code IS NULL
    ) sub
    WHERE profiles.id = sub.id;
  END LOOP;
END;
$$;

-- ============================================
-- 2. Helper: clean German slug from name
-- ============================================
CREATE OR REPLACE FUNCTION public.german_slug(input text)
RETURNS text
LANGUAGE plpgsql IMMUTABLE
AS $function$
DECLARE
  result text;
BEGIN
  result := lower(trim(input));
  -- Remove titles
  result := regexp_replace(result, '^\s*(dr\.?|prof\.?|ing\.?|dipl\.?)\s*', '', 'gi');
  -- Convert German umlauts
  result := replace(result, 'ä', 'ae');
  result := replace(result, 'ö', 'oe');
  result := replace(result, 'ü', 'ue');
  result := replace(result, 'ß', 'ss');
  -- Replace spaces and special chars with hyphens
  result := regexp_replace(result, '[^a-z0-9-]', '-', 'g');
  -- Collapse multiple hyphens
  result := regexp_replace(result, '-+', '-', 'g');
  -- Trim leading/trailing hyphens
  result := trim(BOTH '-' FROM result);
  RETURN result;
END;
$function$;

-- ============================================
-- 3. Update generate_member_link_slug trigger
-- New format: slug = german_slug(firstname-lastname)
-- URL = domain/slug/member_code
-- ============================================
CREATE OR REPLACE FUNCTION public.generate_member_link_slug()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  v_contact record;
  v_member_code integer;
  v_custom_domain text;
  v_base_slug text;
  v_slug text;
  v_counter integer := 0;
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    SELECT first_name, last_name, account_id INTO v_contact FROM contacts WHERE id = NEW.contact_id;
    SELECT member_code INTO v_member_code FROM profiles WHERE id = NEW.user_id;

    -- Build clean slug from lead name only
    v_base_slug := german_slug(COALESCE(v_contact.first_name, '') || ' ' || COALESCE(v_contact.last_name, ''));
    v_slug := v_base_slug;

    -- Handle duplicates within the same account
    WHILE EXISTS (
      SELECT 1 FROM contact_member_links cml
      JOIN contacts c ON c.id = cml.contact_id
      WHERE cml.slug = v_slug AND c.account_id = v_contact.account_id AND cml.id != NEW.id
    ) LOOP
      v_counter := v_counter + 1;
      v_slug := v_base_slug || '-' || v_counter;
    END LOOP;

    NEW.slug := v_slug;

    -- Build URL: domain/slug/member_code
    SELECT custom_domain INTO v_custom_domain FROM accounts WHERE id = v_contact.account_id;

    IF v_custom_domain IS NOT NULL AND v_custom_domain != '' THEN
      NEW.personalized_url := 'https://' || v_custom_domain || '/p/' || v_slug || '/' || COALESCE(v_member_code::text, '0');
    ELSE
      NEW.personalized_url := 'https://hochpreis-leads.de/p/' || v_slug || '/' || COALESCE(v_member_code::text, '0');
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

-- ============================================
-- 4. Update get_contact_by_slug RPC
-- Now accepts optional member_code for attribution
-- Returns member_user_id and account_id
-- ============================================
CREATE OR REPLACE FUNCTION public.get_contact_by_slug(contact_slug text, p_member_code integer DEFAULT NULL)
RETURNS TABLE(id uuid, first_name text, last_name text, company text, video_url text, pitch_video_url text, account_id uuid, member_user_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- First check contact_member_links (new team system)
  IF p_member_code IS NOT NULL THEN
    RETURN QUERY
    SELECT
      c.id,
      c.first_name,
      c.last_name,
      c.company,
      COALESCE(cml.video_url, c.video_url) as video_url,
      (SELECT camp.pitch_video_url FROM campaigns camp WHERE camp.id = c.campaign_id) as pitch_video_url,
      c.account_id,
      cml.user_id as member_user_id
    FROM contact_member_links cml
    JOIN contacts c ON c.id = cml.contact_id
    JOIN profiles p ON p.id = cml.user_id AND p.member_code = p_member_code
    WHERE cml.slug = contact_slug
    LIMIT 1;

    IF FOUND THEN RETURN; END IF;
  END IF;

  -- Check contact_member_links without member_code (any match)
  RETURN QUERY
  SELECT
    c.id,
    c.first_name,
    c.last_name,
    c.company,
    COALESCE(cml.video_url, c.video_url) as video_url,
    (SELECT camp.pitch_video_url FROM campaigns camp WHERE camp.id = c.campaign_id) as pitch_video_url,
    c.account_id,
    cml.user_id as member_user_id
  FROM contact_member_links cml
  JOIN contacts c ON c.id = cml.contact_id
  WHERE cml.slug = contact_slug
  LIMIT 1;

  IF FOUND THEN RETURN; END IF;

  -- Fallback: original contacts table (backwards compat)
  RETURN QUERY
  SELECT
    c.id,
    c.first_name,
    c.last_name,
    c.company,
    c.video_url,
    (SELECT camp.pitch_video_url FROM campaigns camp WHERE camp.id = c.campaign_id) as pitch_video_url,
    c.account_id,
    NULL::uuid as member_user_id
  FROM contacts c
  WHERE c.slug = contact_slug
    AND c.lead_type = 'outbound'
  LIMIT 1;
END;
$function$;

-- ============================================
-- 5. Also update the original contact slug trigger for solo users
-- ============================================
CREATE OR REPLACE FUNCTION public.generate_outbound_slug()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  v_domain text;
  v_base_slug text;
  v_slug text;
  v_counter integer := 0;
BEGIN
  IF NEW.lead_type = 'outbound' AND (NEW.slug IS NULL OR NEW.slug = '') THEN
    v_base_slug := german_slug(COALESCE(NEW.first_name, '') || ' ' || COALESCE(NEW.last_name, ''));
    v_slug := v_base_slug;

    -- Handle duplicates
    WHILE EXISTS (
      SELECT 1 FROM contacts
      WHERE slug = v_slug AND account_id = NEW.account_id AND id != NEW.id
    ) LOOP
      v_counter := v_counter + 1;
      v_slug := v_base_slug || '-' || v_counter;
    END LOOP;

    NEW.slug := v_slug;

    SELECT custom_domain INTO v_domain FROM accounts WHERE id = NEW.account_id;
    IF v_domain IS NOT NULL AND v_domain != '' THEN
      NEW.personalized_url := 'https://' || v_domain || '/p/' || v_slug;
    ELSE
      NEW.personalized_url := 'https://hochpreis-leads.de/p/' || v_slug;
    END IF;
  ELSIF NEW.lead_type = 'inbound' THEN
    NEW.slug := NULL;
    NEW.personalized_url := NULL;
    NEW.outreach_message := NULL;
    NEW.outreach_status := NULL;
  END IF;
  RETURN NEW;
END;
$function$;
