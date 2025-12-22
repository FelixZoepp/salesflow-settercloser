import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const HEYGEN_API_KEY = Deno.env.get('HEYGEN_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!HEYGEN_API_KEY) {
      throw new Error('HEYGEN_API_KEY not configured');
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    
    const { contactId, videoId } = await req.json();

    if (!videoId) {
      throw new Error('videoId is required');
    }

    console.log(`Checking HeyGen video status for ${videoId}`);

    // Check video status with HeyGen
    const statusResponse = await fetch(`https://api.heygen.com/v1/video_status.get?video_id=${videoId}`, {
      method: 'GET',
      headers: {
        'X-Api-Key': HEYGEN_API_KEY,
      },
    });

    if (!statusResponse.ok) {
      const errorText = await statusResponse.text();
      console.error('HeyGen status API error:', errorText);
      throw new Error(`HeyGen status API error: ${statusResponse.status}`);
    }

    const statusData = await statusResponse.json();
    console.log('HeyGen status:', statusData);

    const status = statusData.data?.status;
    const videoUrl = statusData.data?.video_url;

    if (status === 'completed' && videoUrl && contactId) {
      // Video is ready - update contact with intro video URL
      await supabase
        .from('contacts')
        .update({ 
          intro_video_url: videoUrl,
          video_status: 'merging' // Ready for merge step
        })
        .eq('id', contactId);

      return new Response(
        JSON.stringify({ 
          success: true, 
          status: 'completed',
          videoUrl,
          message: 'Intro video ready for merging' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (status === 'failed') {
      if (contactId) {
        await supabase
          .from('contacts')
          .update({ 
            video_status: 'error',
            video_error: statusData.data?.error || 'Video generation failed'
          })
          .eq('id', contactId);
      }

      return new Response(
        JSON.stringify({ 
          success: false, 
          status: 'failed',
          error: statusData.data?.error
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Still processing
    return new Response(
      JSON.stringify({ 
        success: true, 
        status: status || 'processing',
        progress: statusData.data?.progress
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error checking HeyGen status:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
