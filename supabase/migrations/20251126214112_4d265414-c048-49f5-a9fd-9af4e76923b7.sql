-- Update auto_create_deal_for_contact function to use 'Lead' stage
CREATE OR REPLACE FUNCTION public.auto_create_deal_for_contact()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_account_id uuid;
BEGIN
  -- Get account_id from the owner user's profile
  SELECT account_id INTO v_account_id
  FROM profiles
  WHERE id = NEW.owner_user_id;
  
  -- Create a deal in the cold acquisition pipeline for the new contact
  INSERT INTO public.deals (
    contact_id,
    title,
    stage,
    pipeline,
    amount_eur,
    setter_id,
    account_id
  )
  VALUES (
    NEW.id,
    NEW.first_name || ' ' || NEW.last_name || COALESCE(' - ' || NEW.company, ' - Kaltakquise'),
    'Lead',
    'cold',
    0,
    NEW.owner_user_id,
    COALESCE(v_account_id, NEW.account_id)
  );
  
  RETURN NEW;
END;
$function$;