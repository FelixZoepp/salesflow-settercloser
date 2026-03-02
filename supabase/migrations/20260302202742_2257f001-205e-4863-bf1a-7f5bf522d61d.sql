
-- Update get_enrichment_credits to carry over unused credits from previous month
CREATE OR REPLACE FUNCTION public.get_enrichment_credits(p_account_id uuid)
 RETURNS enrichment_credits
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_month text;
  v_prev_month text;
  v_credits enrichment_credits;
  v_prev_credits enrichment_credits;
  v_rollover_phone integer;
  v_rollover_email integer;
BEGIN
  v_month := to_char(now(), 'YYYY-MM');
  v_prev_month := to_char(now() - interval '1 month', 'YYYY-MM');
  
  SELECT * INTO v_credits
  FROM enrichment_credits
  WHERE account_id = p_account_id AND month_year = v_month;
  
  IF NOT FOUND THEN
    -- Check previous month for rollover
    v_rollover_phone := 0;
    v_rollover_email := 0;
    
    SELECT * INTO v_prev_credits
    FROM enrichment_credits
    WHERE account_id = p_account_id AND month_year = v_prev_month;
    
    IF FOUND THEN
      -- Calculate unused credits from previous month
      v_rollover_phone := GREATEST(0, v_prev_credits.phone_credits_limit - v_prev_credits.phone_credits_used);
      v_rollover_email := GREATEST(0, v_prev_credits.email_credits_limit - v_prev_credits.email_credits_used);
    END IF;
    
    -- Create new month with rolled-over limits
    INSERT INTO enrichment_credits (account_id, month_year, phone_credits_limit, email_credits_limit)
    VALUES (
      p_account_id, 
      v_month, 
      COALESCE((SELECT phone_credits_limit FROM enrichment_credits WHERE account_id = p_account_id AND month_year = v_prev_month), 100) + v_rollover_phone,
      COALESCE((SELECT email_credits_limit FROM enrichment_credits WHERE account_id = p_account_id AND month_year = v_prev_month), 100) + v_rollover_email
    )
    RETURNING * INTO v_credits;
  END IF;
  
  RETURN v_credits;
END;
$function$;
