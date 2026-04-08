-- ============================================
-- Update URL generation triggers to use custom_domains table
-- and remove /p/ prefix from custom domain URLs
--
-- New URL format:
--   Custom domain:  https://wolf-leads.de/max-mueller/1001
--   Fallback:       https://hochpreis-leads.de/p/max-mueller/1001
-- ============================================

-- 1. Update generate_member_link_slug trigger
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

    -- Check custom_domains table first (new system), then fallback to accounts.custom_domain
    SELECT cd.domain INTO v_custom_domain
    FROM custom_domains cd
    WHERE cd.account_id = v_contact.account_id
      AND cd.verified = TRUE
    LIMIT 1;

    -- Fallback to accounts.custom_domain if custom_domains table has no entry
    IF v_custom_domain IS NULL THEN
      SELECT custom_domain INTO v_custom_domain FROM accounts WHERE id = v_contact.account_id;
    END IF;

    IF v_custom_domain IS NOT NULL AND v_custom_domain != '' THEN
      -- Custom domain: no /p/ prefix, direct path
      NEW.personalized_url := 'https://' || v_custom_domain || '/' || v_slug || '/' || COALESCE(v_member_code::text, '0');
    ELSE
      -- Fallback domain: keep /p/ prefix for SPA routing
      NEW.personalized_url := 'https://hochpreis-leads.de/p/' || v_slug || '/' || COALESCE(v_member_code::text, '0');
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

-- 2. Update generate_outbound_slug trigger (for solo users / contacts without member links)
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

    -- Check custom_domains table first
    SELECT cd.domain INTO v_domain
    FROM custom_domains cd
    WHERE cd.account_id = NEW.account_id
      AND cd.verified = TRUE
    LIMIT 1;

    -- Fallback to accounts.custom_domain
    IF v_domain IS NULL THEN
      SELECT custom_domain INTO v_domain FROM accounts WHERE id = NEW.account_id;
    END IF;

    IF v_domain IS NOT NULL AND v_domain != '' THEN
      NEW.personalized_url := 'https://' || v_domain || '/' || v_slug;
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

-- 3. Create a helper function to regenerate URLs when a domain is verified/changed
-- This can be called manually or by a trigger when domain status changes
CREATE OR REPLACE FUNCTION public.regenerate_urls_for_account(p_account_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_domain text;
  v_count integer := 0;
BEGIN
  -- Get the verified custom domain
  SELECT cd.domain INTO v_domain
  FROM custom_domains cd
  WHERE cd.account_id = p_account_id AND cd.verified = TRUE
  LIMIT 1;

  -- Fallback
  IF v_domain IS NULL THEN
    SELECT custom_domain INTO v_domain FROM accounts WHERE id = p_account_id;
  END IF;

  -- Update contact_member_links URLs
  IF v_domain IS NOT NULL AND v_domain != '' THEN
    UPDATE contact_member_links cml
    SET personalized_url = 'https://' || v_domain || '/' || cml.slug || '/' || COALESCE(p.member_code::text, '0')
    FROM contacts c
    JOIN profiles p ON p.id = cml.user_id
    WHERE cml.contact_id = c.id
      AND c.account_id = p_account_id
      AND cml.slug IS NOT NULL;
  ELSE
    UPDATE contact_member_links cml
    SET personalized_url = 'https://hochpreis-leads.de/p/' || cml.slug || '/' || COALESCE(p.member_code::text, '0')
    FROM contacts c
    JOIN profiles p ON p.id = cml.user_id
    WHERE cml.contact_id = c.id
      AND c.account_id = p_account_id
      AND cml.slug IS NOT NULL;
  END IF;

  GET DIAGNOSTICS v_count = ROW_COUNT;

  -- Update outbound contacts URLs
  IF v_domain IS NOT NULL AND v_domain != '' THEN
    UPDATE contacts
    SET personalized_url = 'https://' || v_domain || '/' || slug
    WHERE account_id = p_account_id
      AND lead_type = 'outbound'
      AND slug IS NOT NULL;
  ELSE
    UPDATE contacts
    SET personalized_url = 'https://hochpreis-leads.de/p/' || slug
    WHERE account_id = p_account_id
      AND lead_type = 'outbound'
      AND slug IS NOT NULL;
  END IF;

  RETURN v_count;
END;
$function$;

-- 4. Trigger: when a domain's verified status changes, regenerate URLs
CREATE OR REPLACE FUNCTION public.on_domain_verified_regenerate_urls()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only trigger when verified changes to true or domain changes
  IF (OLD.verified IS DISTINCT FROM NEW.verified) OR (OLD.domain IS DISTINCT FROM NEW.domain) THEN
    PERFORM regenerate_urls_for_account(NEW.account_id);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_domain_verified_regenerate_urls
  AFTER UPDATE OF verified, domain ON public.custom_domains
  FOR EACH ROW
  EXECUTE FUNCTION public.on_domain_verified_regenerate_urls();

-- Also regenerate when domain is deleted
CREATE OR REPLACE FUNCTION public.on_domain_deleted_regenerate_urls()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  PERFORM regenerate_urls_for_account(OLD.account_id);
  RETURN OLD;
END;
$$;

CREATE TRIGGER trigger_domain_deleted_regenerate_urls
  AFTER DELETE ON public.custom_domains
  FOR EACH ROW
  EXECUTE FUNCTION public.on_domain_deleted_regenerate_urls();
