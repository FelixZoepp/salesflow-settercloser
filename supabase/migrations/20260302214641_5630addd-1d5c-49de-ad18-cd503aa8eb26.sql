-- Remove HeyGen auto video trigger
DROP TRIGGER IF EXISTS auto_video_generation_trigger ON public.contacts;

-- Now remove the function
DROP FUNCTION IF EXISTS public.trigger_video_generation_on_connection_accepted();
