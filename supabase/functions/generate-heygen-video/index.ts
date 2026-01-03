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
    
    const { contactId, firstName, avatarId, voiceId } = await req.json();

    if (!contactId || !firstName) {
      throw new Error('contactId and firstName are required');
    }

    console.log(`Generating HeyGen video for ${firstName} (${contactId})`);

    // Update contact status to generating
    await supabase
      .from('contacts')
      .update({ video_status: 'generating_intro', video_error: null })
      .eq('id', contactId);

    // Default script template - can be overridden via script parameter
    const defaultScript = `Hey ${firstName}, ich habe dir dieses Video einfach mal kurz aufgenommen, weil ich auf dein LinkedIn Profil gestoßen bin und dir einfach mal zeigen wollte, wie wir mindestens mal 3-5 Kunden in den nächsten 90 Tagen nur über LinkedIn für dich gewinnen.`;

    // Create HeyGen video generation request
    const heygenResponse = await fetch('https://api.heygen.com/v2/video/generate', {
      method: 'POST',
      headers: {
        'X-Api-Key': HEYGEN_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        video_inputs: [
          {
            character: {
              type: 'avatar',
              avatar_id: avatarId,
              avatar_style: 'normal',
            },
            voice: {
              type: 'text',
              input_text: defaultScript,
              voice_id: voiceId || 'de_male_1', // German male voice
              speed: 1.0,
            },
          },
        ],
        dimension: {
          width: 1920,
          height: 1080,
        },
        aspect_ratio: '16:9',
      }),
    });

    if (!heygenResponse.ok) {
      const errorText = await heygenResponse.text();
      console.error('HeyGen API error:', errorText);
      
      await supabase
        .from('contacts')
        .update({ 
          video_status: 'error', 
          video_error: `HeyGen API error: ${heygenResponse.status}` 
        })
        .eq('id', contactId);
      
      throw new Error(`HeyGen API error: ${heygenResponse.status}`);
    }

    const heygenData = await heygenResponse.json();
    console.log('HeyGen response:', heygenData);

    // Store the video ID for polling
    const videoId = heygenData.data?.video_id;

    if (videoId) {
      await supabase
        .from('contacts')
        .update({ heygen_video_id: videoId })
        .eq('id', contactId);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        videoId,
        message: 'Video generation started' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error generating HeyGen video:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
