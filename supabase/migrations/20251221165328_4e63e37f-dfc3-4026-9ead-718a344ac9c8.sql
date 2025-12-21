-- Enable realtime for contacts table to receive lead score updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.contacts;