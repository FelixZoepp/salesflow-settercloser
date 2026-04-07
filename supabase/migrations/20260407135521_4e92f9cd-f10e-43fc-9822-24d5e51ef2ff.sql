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
      SELECT COALESCE(default_deal_amount, 0) INTO v_default_amount
      FROM accounts WHERE id = NEW.account_id;

      INSERT INTO deals (
        contact_id, title, stage, pipeline, amount_eur, account_id, next_action
      ) VALUES (
        NEW.id,
        NEW.first_name || ' ' || NEW.last_name || COALESCE(' - ' || NEW.company, ''),
        'Lead',
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