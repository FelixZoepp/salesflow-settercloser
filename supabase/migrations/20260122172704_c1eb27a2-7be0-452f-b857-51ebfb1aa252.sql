-- Update the workflow trigger to create deals correctly
-- Leads should start in "Lead angelegt" and move to "Hat Seite geöffnet" when they view the page

CREATE OR REPLACE FUNCTION public.create_deal_on_page_view()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_contact record;
BEGIN
  -- Only process page_view events
  IF NEW.event_type = 'page_view' THEN
    -- Get contact info
    SELECT * INTO v_contact FROM contacts WHERE id = NEW.contact_id;
    
    IF v_contact IS NOT NULL THEN
      -- Check if deal already exists
      IF EXISTS (SELECT 1 FROM deals WHERE contact_id = NEW.contact_id) THEN
        -- Update existing deal to "Hat Seite geöffnet" if still in early stages
        UPDATE deals 
        SET stage = CASE 
              WHEN COALESCE(v_contact.lead_score, 0) >= 70 THEN 'Heißer Lead - Anrufen'
              ELSE 'Hat Seite geöffnet'
            END,
            next_action = CASE 
              WHEN COALESCE(v_contact.lead_score, 0) >= 70 THEN 'Sofort anrufen!'
              ELSE 'Lead hat Seite besucht - Follow-up'
            END,
            updated_at = now()
        WHERE contact_id = NEW.contact_id 
          AND stage IN ('Lead angelegt', 'Hat Seite geöffnet');
      ELSE
        -- Create new deal if none exists (fallback for leads without import)
        INSERT INTO deals (
          contact_id,
          title,
          stage,
          pipeline,
          amount_eur,
          account_id,
          next_action
        )
        VALUES (
          NEW.contact_id,
          v_contact.first_name || ' ' || v_contact.last_name || COALESCE(' - ' || v_contact.company, ''),
          CASE 
            WHEN COALESCE(v_contact.lead_score, 0) >= 70 THEN 'Heißer Lead - Anrufen'
            ELSE 'Hat Seite geöffnet'
          END,
          'cold',
          0,
          v_contact.account_id,
          CASE 
            WHEN COALESCE(v_contact.lead_score, 0) >= 70 THEN 'Sofort anrufen!'
            ELSE 'Lead hat Seite besucht'
          END
        );
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create function to auto-create deal when contact is inserted (for imports)
CREATE OR REPLACE FUNCTION public.create_deal_on_contact_insert()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Only create deals for outbound leads with a campaign
  IF NEW.lead_type = 'outbound' AND NEW.campaign_id IS NOT NULL THEN
    -- Check if deal already exists
    IF NOT EXISTS (SELECT 1 FROM deals WHERE contact_id = NEW.id) THEN
      INSERT INTO deals (
        contact_id,
        title,
        stage,
        pipeline,
        amount_eur,
        account_id,
        next_action
      )
      VALUES (
        NEW.id,
        NEW.first_name || ' ' || NEW.last_name || COALESCE(' - ' || NEW.company, ''),
        'Lead angelegt',
        'cold',
        0,
        NEW.account_id,
        'Warten auf Engagement'
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create trigger for contact insert
DROP TRIGGER IF EXISTS create_deal_on_contact_insert_trigger ON contacts;
CREATE TRIGGER create_deal_on_contact_insert_trigger
  AFTER INSERT ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION create_deal_on_contact_insert();