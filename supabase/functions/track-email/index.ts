import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.0";

// 1x1 transparent GIF
const TRACKING_PIXEL = new Uint8Array([
  0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00,
  0x80, 0x00, 0x00, 0xff, 0xff, 0xff, 0x00, 0x00, 0x00, 0x21,
  0xf9, 0x04, 0x01, 0x00, 0x00, 0x00, 0x00, 0x2c, 0x00, 0x00,
  0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x02, 0x02, 0x44,
  0x01, 0x00, 0x3b
]);

serve(async (req) => {
  try {
    const url = new URL(req.url);
    const trackingId = url.searchParams.get('t');
    const eventType = url.searchParams.get('e'); // 'open' or 'click'
    const redirectUrl = url.searchParams.get('u');

    if (!trackingId || !eventType) {
      return new Response('Missing parameters', { status: 400 });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find email log by tracking ID
    const { data: emailLog } = await supabase
      .from('email_logs')
      .select('id, open_count, click_count')
      .eq('tracking_id', trackingId)
      .single();

    if (emailLog) {
      // Log tracking event
      await supabase.from('email_tracking_events').insert({
        email_log_id: emailLog.id,
        event_type: eventType,
        link_url: redirectUrl ? decodeURIComponent(redirectUrl) : null,
        ip_address: req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip'),
        user_agent: req.headers.get('user-agent'),
      });

      // Update email log counts
      if (eventType === 'open') {
        await supabase
          .from('email_logs')
          .update({ 
            open_count: (emailLog.open_count || 0) + 1,
            opened_at: new Date().toISOString()
          })
          .eq('id', emailLog.id);
      } else if (eventType === 'click') {
        await supabase
          .from('email_logs')
          .update({ 
            click_count: (emailLog.click_count || 0) + 1
          })
          .eq('id', emailLog.id);
      }

      console.log(`Tracked ${eventType} for email ${emailLog.id}`);
    }

    // For clicks, redirect to the original URL
    if (eventType === 'click' && redirectUrl) {
      return new Response(null, {
        status: 302,
        headers: { 'Location': decodeURIComponent(redirectUrl) },
      });
    }

    // For opens, return tracking pixel
    return new Response(TRACKING_PIXEL, {
      headers: {
        'Content-Type': 'image/gif',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });

  } catch (error: any) {
    console.error('Tracking error:', error);
    // Still return pixel/redirect even on error
    return new Response(TRACKING_PIXEL, {
      headers: { 'Content-Type': 'image/gif' },
    });
  }
});
