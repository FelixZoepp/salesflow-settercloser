-- Update the calculate_lead_score function to cap the score at 100
CREATE OR REPLACE FUNCTION public.calculate_lead_score(p_contact_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_score integer := 0;
  v_event record;
BEGIN
  -- Calculate score based on each event type
  FOR v_event IN 
    SELECT event_type, event_data 
    FROM lead_tracking_events 
    WHERE contact_id = p_contact_id
  LOOP
    CASE v_event.event_type
      WHEN 'page_view' THEN v_score := v_score + 5;
      WHEN 'video_play' THEN v_score := v_score + 10;
      WHEN 'video_progress' THEN 
        -- +10 for 50%+, additional +5 for 75%+
        IF (v_event.event_data->>'progress')::int >= 75 THEN
          v_score := v_score + 15;
        ELSIF (v_event.event_data->>'progress')::int >= 50 THEN
          v_score := v_score + 10;
        ELSE
          v_score := v_score + 5;
        END IF;
      WHEN 'video_complete' THEN v_score := v_score + 20;
      WHEN 'button_click' THEN v_score := v_score + 10;
      WHEN 'cta_click' THEN v_score := v_score + 15;
      WHEN 'booking_click' THEN v_score := v_score + 25;
      WHEN 'scroll_depth' THEN
        IF (v_event.event_data->>'depth')::int >= 75 THEN
          v_score := v_score + 10;
        ELSIF (v_event.event_data->>'depth')::int >= 50 THEN
          v_score := v_score + 5;
        END IF;
      WHEN 'time_on_page' THEN
        IF (v_event.event_data->>'seconds')::int >= 120 THEN
          v_score := v_score + 15;
        ELSIF (v_event.event_data->>'seconds')::int >= 60 THEN
          v_score := v_score + 10;
        ELSIF (v_event.event_data->>'seconds')::int >= 30 THEN
          v_score := v_score + 5;
        END IF;
      WHEN 'form_submit' THEN v_score := v_score + 30;
      ELSE v_score := v_score + 2;
    END CASE;
  END LOOP;
  
  -- Cap the score at 100
  IF v_score > 100 THEN
    v_score := 100;
  END IF;
  
  RETURN v_score;
END;
$$;