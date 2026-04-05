CREATE OR REPLACE FUNCTION public.create_deal_on_contact_insert()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_default_amount numeric;
BEGIN
  IF NEW.lead_type = 'outbound' AND NEW.campaign_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM deals WHERE contact_id = NEW.id) THEN
      -- Get default deal amount from account
      SELECT COALESCE(default_deal_amount, 0) INTO v_default_amount
      FROM accounts WHERE id = NEW.account_id;

      INSERT INTO deals (
        contact_id, title, stage, pipeline, amount_eur, account_id, next_action
      ) VALUES (
        NEW.id,
        NEW.first_name || ' ' || NEW.last_name || COALESCE(' - ' || NEW.company, ''),
        'Lead angelegt',
        'cold',
        COALESCE(v_default_amount, 0),
        NEW.account_id,
        'Warten auf Engagement'
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.create_deal_on_page_view()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_contact record;
  v_default_amount numeric;
BEGIN
  IF NEW.event_type = 'page_view' THEN
    SELECT * INTO v_contact FROM contacts WHERE id = NEW.contact_id;
    
    IF v_contact IS NOT NULL THEN
      IF EXISTS (SELECT 1 FROM deals WHERE contact_id = NEW.contact_id) THEN
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
        SELECT COALESCE(default_deal_amount, 0) INTO v_default_amount
        FROM accounts WHERE id = v_contact.account_id;

        INSERT INTO deals (
          contact_id, title, stage, pipeline, amount_eur, account_id, next_action
        ) VALUES (
          NEW.contact_id,
          v_contact.first_name || ' ' || v_contact.last_name || COALESCE(' - ' || v_contact.company, ''),
          CASE WHEN COALESCE(v_contact.lead_score, 0) >= 70 THEN 'Heißer Lead - Anrufen' ELSE 'Hat Seite geöffnet' END,
          'cold',
          COALESCE(v_default_amount, 0),
          v_contact.account_id,
          CASE WHEN COALESCE(v_contact.lead_score, 0) >= 70 THEN 'Sofort anrufen!' ELSE 'Lead hat Seite besucht' END
        );
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;