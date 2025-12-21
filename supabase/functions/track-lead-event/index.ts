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
