
-- Campaign members: which users work in which campaign
CREATE TABLE public.campaign_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'setter',
  joined_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(campaign_id, user_id)
);

ALTER TABLE public.campaign_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view campaign members in their account"
  ON public.campaign_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM campaigns c
      WHERE c.id = campaign_members.campaign_id
      AND (c.account_id = get_user_account_id() OR is_super_admin())
    )
  );

CREATE POLICY "Users can manage campaign members in their account"
  ON public.campaign_members FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM campaigns c
      WHERE c.id = campaign_members.campaign_id
      AND (c.account_id = get_user_account_id() OR is_super_admin())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM campaigns c
      WHERE c.id = campaign_members.campaign_id
      AND (c.account_id = get_user_account_id() OR is_super_admin())
    )
  );

-- Contact member links: per-member personalized outreach data for each lead
CREATE TABLE public.contact_member_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  campaign_id uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  slug text,
  personalized_url text,
  video_url text,
  video_status text DEFAULT 'pending',
  heygen_video_id text,
  video_generated_at timestamp with time zone,
  video_error text,
  workflow_status text DEFAULT 'neu',
  connection_sent_at timestamp with time zone,
  connection_accepted_at timestamp with time zone,
  first_message_sent_at timestamp with time zone,
  fu1_sent_at timestamp with time zone,
  fu2_sent_at timestamp with time zone,
  fu3_sent_at timestamp with time zone,
  outreach_message text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(contact_id, campaign_id, user_id)
);

ALTER TABLE public.contact_member_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view contact member links in their account"
  ON public.contact_member_links FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM campaigns c
      WHERE c.id = contact_member_links.campaign_id
      AND (c.account_id = get_user_account_id() OR is_super_admin())
    )
  );

CREATE POLICY "Users can manage contact member links in their account"
  ON public.contact_member_links FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM campaigns c
      WHERE c.id = contact_member_links.campaign_id
      AND (c.account_id = get_user_account_id() OR is_super_admin())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM campaigns c
      WHERE c.id = contact_member_links.campaign_id
      AND (c.account_id = get_user_account_id() OR is_super_admin())
    )
  );

-- Index for fast lookups
CREATE INDEX idx_contact_member_links_contact ON public.contact_member_links(contact_id);
CREATE INDEX idx_contact_member_links_campaign_user ON public.contact_member_links(campaign_id, user_id);
CREATE INDEX idx_contact_member_links_slug ON public.contact_member_links(slug);
CREATE INDEX idx_campaign_members_campaign ON public.campaign_members(campaign_id);

-- Auto-generate slug for contact_member_links
CREATE OR REPLACE FUNCTION public.generate_member_link_slug()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  v_contact record;
  v_profile record;
  v_custom_domain text;
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    SELECT first_name, last_name, account_id INTO v_contact FROM contacts WHERE id = NEW.contact_id;
    SELECT name INTO v_profile FROM profiles WHERE id = NEW.user_id;
    
    -- Generate unique slug: firstname-lastname-memberFirstname-randomId
    NEW.slug := lower(
      regexp_replace(v_contact.first_name, '[^a-zA-Z0-9]', '', 'g') || '-' ||
      regexp_replace(v_contact.last_name, '[^a-zA-Z0-9]', '', 'g') || '-' ||
      regexp_replace(split_part(COALESCE(v_profile.name, ''), ' ', 1), '[^a-zA-Z0-9]', '', 'g') || '-' ||
      right(NEW.id::text, 4)
    );
    
    -- Get custom domain
    SELECT custom_domain INTO v_custom_domain FROM accounts WHERE id = v_contact.account_id;
    
    IF v_custom_domain IS NOT NULL AND v_custom_domain != '' THEN
      NEW.personalized_url := 'https://' || v_custom_domain || '/p/' || NEW.slug;
    ELSE
      NEW.personalized_url := 'https://hochpreis-leads.de/p/' || NEW.slug;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

CREATE TRIGGER trigger_generate_member_link_slug
  BEFORE INSERT ON public.contact_member_links
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_member_link_slug();

-- Updated_at trigger
CREATE TRIGGER update_contact_member_links_updated_at
  BEFORE UPDATE ON public.contact_member_links
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
