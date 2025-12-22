-- Allow users to delete tracking events in their account
CREATE POLICY "Users can delete tracking events in their account"
ON public.lead_tracking_events
FOR DELETE
USING ((account_id = get_user_account_id()) OR is_super_admin());