CREATE OR REPLACE FUNCTION public.get_member_link_stats(p_account_id uuid, p_start_date timestamptz DEFAULT '2000-01-01'::timestamptz)
RETURNS TABLE (
  user_id uuid,
  total_leads bigint,
  connections_sent bigint,
  connections_accepted bigint,
  messages_sent bigint,
  replies bigint,
  positive_replies bigint,
  appointments_booked bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    cml.user_id,
    count(*) as total_leads,
    count(*) FILTER (WHERE cml.workflow_status IN ('vernetzung_ausstehend','vernetzung_angenommen','erstnachricht_gesendet','fu1_gesendet','fu2_gesendet','fu3_gesendet','reagiert_warm','positiv_geantwortet','termin_gebucht','abgeschlossen')) as connections_sent,
    count(*) FILTER (WHERE cml.workflow_status IN ('vernetzung_angenommen','erstnachricht_gesendet','fu1_gesendet','fu2_gesendet','fu3_gesendet','reagiert_warm','positiv_geantwortet','termin_gebucht','abgeschlossen')) as connections_accepted,
    count(*) FILTER (WHERE cml.workflow_status IN ('erstnachricht_gesendet','fu1_gesendet','fu2_gesendet','fu3_gesendet','reagiert_warm','positiv_geantwortet','termin_gebucht','abgeschlossen')) as messages_sent,
    count(*) FILTER (WHERE cml.workflow_status IN ('reagiert_warm','positiv_geantwortet','termin_gebucht','abgeschlossen')) as replies,
    count(*) FILTER (WHERE cml.workflow_status IN ('positiv_geantwortet','termin_gebucht','abgeschlossen')) as positive_replies,
    count(*) FILTER (WHERE cml.workflow_status IN ('termin_gebucht','abgeschlossen')) as appointments_booked
  FROM contact_member_links cml
  JOIN campaigns c ON c.id = cml.campaign_id
  WHERE c.account_id = p_account_id
    AND cml.created_at >= p_start_date
  GROUP BY cml.user_id;
$$;