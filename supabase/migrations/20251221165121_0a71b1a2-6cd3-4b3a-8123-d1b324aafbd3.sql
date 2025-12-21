-- Function to calculate lead score based on tracking events
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
  
  RETURN v_score;
END;
$$;

-- Trigger function to update lead score when new event is added
CREATE OR REPLACE FUNCTION public.update_lead_score_on_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_score integer;
BEGIN
  -- Calculate new score
  v_new_score := calculate_lead_score(NEW.contact_id);
  
  -- Update the contact's lead_score
  UPDATE contacts 
  SET lead_score = v_new_score,
      updated_at = now()
  WHERE id = NEW.contact_id;
  
  RETURN NEW;
END;
$$;

-- Create trigger on lead_tracking_events
DROP TRIGGER IF EXISTS trigger_update_lead_score ON lead_tracking_events;
CREATE TRIGGER trigger_update_lead_score
  AFTER INSERT ON lead_tracking_events
  FOR EACH ROW
  EXECUTE FUNCTION update_lead_score_on_event();