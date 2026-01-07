-- Update the workflow trigger to create deals when page is viewed
CREATE OR REPLACE FUNCTION public.create_deal_on_page_view()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_contact record;
  v_account_id uuid;
BEGIN
  -- Only process page_view events
  IF NEW.event_type = 'page_view' THEN
    -- Get contact info
    SELECT * INTO v_contact FROM contacts WHERE id = NEW.contact_id;
    
    IF v_contact IS NOT NULL THEN
      -- Check if deal already exists
      IF NOT EXISTS (SELECT 1 FROM deals WHERE contact_id = NEW.contact_id) THEN
        -- Determine stage based on lead score
        -- Hot leads (score >= 70) go directly to "Heißer Lead - Anrufen"
        -- Others go to "Hat Seite geöffnet"
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
      ELSE
        -- If deal exists and lead becomes hot, update stage
        IF COALESCE(v_contact.lead_score, 0) >= 70 THEN
          UPDATE deals 
          SET stage = 'Heißer Lead - Anrufen',
              next_action = 'Sofort anrufen!',
              updated_at = now()
          WHERE contact_id = NEW.contact_id 
            AND stage = 'Hat Seite geöffnet';
        END IF;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create trigger if not exists
DROP TRIGGER IF EXISTS create_deal_on_page_view_trigger ON lead_tracking_events;
CREATE TRIGGER create_deal_on_page_view_trigger
  AFTER INSERT ON lead_tracking_events
  FOR EACH ROW
  EXECUTE FUNCTION create_deal_on_page_view();

-- Also update deal when lead score changes
CREATE OR REPLACE FUNCTION public.update_deal_on_hot_lead()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- If lead just became hot (crossed threshold)
  IF COALESCE(OLD.lead_score, 0) < 70 AND COALESCE(NEW.lead_score, 0) >= 70 THEN
    -- Update existing deal to hot stage if it's still in early stage
    UPDATE deals 
    SET stage = 'Heißer Lead - Anrufen',
        next_action = 'Sofort anrufen!',
        updated_at = now()
    WHERE contact_id = NEW.id 
      AND stage = 'Hat Seite geöffnet';
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create trigger for hot lead updates
DROP TRIGGER IF EXISTS update_deal_on_hot_lead_trigger ON contacts;
CREATE TRIGGER update_deal_on_hot_lead_trigger
  AFTER UPDATE OF lead_score ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_deal_on_hot_lead();