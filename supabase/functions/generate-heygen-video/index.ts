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
    
    const { contactId, firstName, avatarId, voiceId, audioUrl, script } = await req.json();

    if (!contactId || !firstName) {
      throw new Error('contactId and firstName are required');
    }

    console.log(`Generating HeyGen video for ${firstName} (${contactId})`);
    console.log(`Using avatar: ${avatarId}, voice: ${voiceId || 'audio'}, audioUrl: ${audioUrl ? 'provided' : 'none'}`);

    // Update contact status to generating
    await supabase
      .from('contacts')
      .update({ video_status: 'generating_intro', video_error: null })
      .eq('id', contactId);

    // Default script template - personalized with first name
    const introScript = script || `Hey ${firstName}, ich habe dir dieses Video einfach mal kurz aufgenommen, weil ich auf dein LinkedIn Profil gestoßen bin und dir einfach mal zeigen wollte, wie wir mindestens mal 3-5 Kunden in den nächsten 90 Tagen nur über LinkedIn für dich gewinnen.`;

    // Build voice configuration based on whether audio_url is provided
    let voiceConfig: any;
    
    if (audioUrl) {
      // Use audio URL as voice source (user's own recorded voice from video)
      console.log('Using audio_url as voice source');
      voiceConfig = {
        type: 'audio',
        audio_url: audioUrl,
      };
    } else if (voiceId) {
      // Use HeyGen voice clone or standard voice
      console.log('Using voice_id:', voiceId);
      voiceConfig = {
        type: 'text',
        input_text: introScript,
        voice_id: voiceId,
        speed: 1.0,
      };
    } else {
      // Fallback to German standard voice - Klaus Natural
      console.log('Using default German voice: Klaus - Natural');
      voiceConfig = {
        type: 'text',
        input_text: introScript,
        voice_id: '7addb1d6eaba435da3bbd4abcb26407a',
        speed: 1.0,
      };
    }

    // Create HeyGen video generation request
    const requestBody: any = {
      video_inputs: [
        {
          character: {
            type: 'avatar',
            avatar_id: avatarId,
            avatar_style: 'normal',
          },
          voice: voiceConfig,
        },
      ],
      dimension: {
        width: 1920,
        height: 1080,
      },
      aspect_ratio: '16:9',
    };

    // If using audio_url, we need to include the script as well for lip-sync
    if (audioUrl) {
      requestBody.video_inputs[0].voice.input_text = introScript;
    }

    console.log('HeyGen request:', JSON.stringify(requestBody, null, 2));

    const heygenResponse = await fetch('https://api.heygen.com/v2/video/generate', {
      method: 'POST',
      headers: {
        'X-Api-Key': HEYGEN_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!heygenResponse.ok) {
      const errorText = await heygenResponse.text();
      console.error('HeyGen API error:', errorText);
      
      await supabase
        .from('contacts')
        .update({ 
          video_status: 'error', 
          video_error: `HeyGen API error: ${heygenResponse.status} - ${errorText}` 
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