import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { slug, event_type, event_data, page_url, session_id } = body;
    
    console.log(`Received tracking event: ${event_type} for slug: ${slug}`);
    console.log('Event data:', JSON.stringify(event_data));

    if (!slug || !event_type) {
      console.log('Missing required parameters');
      return new Response(
        JSON.stringify({ error: 'Missing slug or event_type parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get contact by slug
    const { data: contact, error: fetchError } = await supabase
      .from('contacts')
      .select('id, account_id')
      .eq('slug', slug)
      .maybeSingle();

    if (fetchError) {
      console.error('Error fetching contact:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Database error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!contact) {
      console.log(`No contact found for slug: ${slug}`);
      return new Response(
        JSON.stringify({ error: 'Contact not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get IP and user agent from request
    const ip_address = req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || null;
    const user_agent = req.headers.get('user-agent') || null;

    // Insert tracking event
    const { data: eventData, error: insertError } = await supabase
      .from('lead_tracking_events')
      .insert({
        contact_id: contact.id,
        account_id: contact.account_id,
        event_type,
        event_data: event_data || {},
        page_url,
        session_id,
        ip_address,
        user_agent
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting tracking event:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to track event' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Successfully tracked ${event_type} event for contact ${contact.id}`);

    // Update contact fields based on event type
    if (event_type === 'page_view') {
      await supabase
        .from('contacts')
        .update({
          viewed: true,
          viewed_at: new Date().toISOString(),
          view_count: (await supabase.from('contacts').select('view_count').eq('id', contact.id).single()).data?.view_count + 1 || 1
        })
        .eq('id', contact.id);
    }

    // Check if lead score hit 100 after this event (trigger recalculates it)
    // Small delay to let the DB trigger update the score
    const { data: updatedContact } = await supabase
      .from('contacts')
      .select('lead_score, first_name, last_name, company, owner_user_id')
      .eq('id', contact.id)
      .single();

    if (updatedContact && updatedContact.lead_score >= 100) {
      // Send Slack notification with team stats
      try {
        const slackWebhookUrl = Deno.env.get('SLACK_WEBHOOK_URL');
        if (slackWebhookUrl) {
          // Get team outreach stats
          const { data: teamContacts } = await supabase
            .from('contacts')
            .select('workflow_status')
            .eq('account_id', contact.account_id)
            .eq('lead_type', 'outbound');

          const statuses = (teamContacts || []).map((c: any) => c.workflow_status);
          const sent = ['vernetzung_ausstehend','vernetzung_angenommen','erstnachricht_gesendet','fu1_gesendet','fu2_gesendet','fu3_gesendet','reagiert_warm','positiv_geantwortet','termin_gebucht','abgeschlossen'];
          const messaged = ['erstnachricht_gesendet','fu1_gesendet','fu2_gesendet','fu3_gesendet','reagiert_warm','positiv_geantwortet','termin_gebucht','abgeschlossen'];
          const fus = ['fu1_gesendet','fu2_gesendet','fu3_gesendet','reagiert_warm','positiv_geantwortet','termin_gebucht','abgeschlossen'];
          const booked = ['termin_gebucht','abgeschlossen'];

          const totalSent = statuses.filter((s: string) => sent.includes(s)).length;
          const totalMessaged = statuses.filter((s: string) => messaged.includes(s)).length;
          const totalFUs = statuses.filter((s: string) => fus.includes(s)).length;
          const totalBooked = statuses.filter((s: string) => booked.includes(s)).length;

          // Get owner name
          let ownerName = '';
          if (updatedContact.owner_user_id) {
            const { data: owner } = await supabase
              .from('profiles')
              .select('name')
              .eq('id', updatedContact.owner_user_id)
              .single();
            ownerName = owner?.name || '';
          }

          const slackPayload = {
            blocks: [
              {
                type: "header",
                text: { type: "plain_text", text: "🔥 Lead Score 100 erreicht!", emoji: true }
              },
              {
                type: "section",
                fields: [
                  { type: "mrkdwn", text: `*Lead:*\n${updatedContact.first_name} ${updatedContact.last_name}` },
                  { type: "mrkdwn", text: `*Firma:*\n${updatedContact.company || '—'}` },
                  { type: "mrkdwn", text: `*Score:*\n${updatedContact.lead_score}/100` },
                  { type: "mrkdwn", text: `*Zugewiesen an:*\n${ownerName || '—'}` },
                ]
              },
              { type: "divider" },
              {
                type: "section",
                text: { type: "mrkdwn", text: "*📊 Team Outreach-Zahlen*" }
              },
              {
                type: "section",
                fields: [
                  { type: "mrkdwn", text: `*Vernetzungen:*\n${totalSent}` },
                  { type: "mrkdwn", text: `*Nachrichten:*\n${totalMessaged}` },
                  { type: "mrkdwn", text: `*Follow-ups:*\n${totalFUs}` },
                  { type: "mrkdwn", text: `*Termine:*\n${totalBooked}` },
                ]
              }
            ]
          };

          await fetch(slackWebhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(slackPayload),
          });
          console.log(`Slack notification sent for lead ${contact.id} (score 100)`);
        }
      } catch (slackErr) {
        console.error('Slack notification error:', slackErr);
      }
    }

    return new Response(
      JSON.stringify({ success: true, event_id: eventData.id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in track-lead-event:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
