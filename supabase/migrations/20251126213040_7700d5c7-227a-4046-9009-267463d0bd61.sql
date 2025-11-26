-- Create function to automatically create a deal when a contact is created
CREATE OR REPLACE FUNCTION public.auto_create_deal_for_contact()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
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
    'New',
    'cold',
    0,
    NEW.owner_user_id,
    NEW.account_id
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger to automatically create deals for new contacts
DROP TRIGGER IF EXISTS trigger_auto_create_deal_for_contact ON public.contacts;

CREATE TRIGGER trigger_auto_create_deal_for_contact
AFTER INSERT ON public.contacts
FOR EACH ROW
EXECUTE FUNCTION public.auto_create_deal_for_contact();