import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

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
    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!HEYGEN_API_KEY) {
      throw new Error('HEYGEN_API_KEY not configured');
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    
    const { contactId, firstName, avatarId, voiceId, audioUrl, script, useElevenLabs } = await req.json();

    if (!contactId || !firstName) {
      throw new Error('contactId and firstName are required');
    }

    console.log(`Generating HeyGen video for ${firstName} (${contactId})`);
    console.log(`Using avatar: ${avatarId}, voice: ${voiceId || 'default'}, audioUrl: ${audioUrl ? 'provided' : 'none'}, useElevenLabs: ${useElevenLabs}`);

    // Update contact status to generating
    await supabase
      .from('contacts')
      .update({ video_status: 'generating_intro', video_error: null })
      .eq('id', contactId);

    // Default script template - personalized with first name
    const introScript = script || `Hey ${firstName}, ich habe dir dieses Video einfach mal kurz aufgenommen, weil ich auf dein LinkedIn Profil gestoßen bin und dir einfach mal zeigen wollte, wie wir mindestens mal 3-5 Kunden in den nächsten 90 Tagen nur über LinkedIn für dich gewinnen.`;

    // Build voice configuration
    let voiceConfig: any;
    let generatedAudioUrl: string | null = null;
    
    // Option 1: Use ElevenLabs TTS to generate audio, then pass to HeyGen
    if (useElevenLabs && voiceId && ELEVENLABS_API_KEY) {
      console.log('Using ElevenLabs TTS with voice:', voiceId);
      
      try {
        // Generate audio with ElevenLabs
        const elevenLabsResponse = await fetch(
          `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
          {
            method: 'POST',
            headers: {
              'xi-api-key': ELEVENLABS_API_KEY,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              text: introScript,
              model_id: 'eleven_multilingual_v2',
              voice_settings: {
                stability: 0.5,
                similarity_boost: 0.75,
                style: 0.5,
                use_speaker_boost: true,
                speed: 1.0,
              },
            }),
          }
        );

        if (!elevenLabsResponse.ok) {
          const errorText = await elevenLabsResponse.text();
          console.error('ElevenLabs API error:', errorText);
          throw new Error(`ElevenLabs API error: ${elevenLabsResponse.status}`);
        }

        // Get audio as buffer
        const audioBuffer = await elevenLabsResponse.arrayBuffer();
        console.log('ElevenLabs audio generated, size:', audioBuffer.byteLength);

        // Upload to Supabase Storage
        const audioFileName = `intro-audio-${contactId}-${Date.now()}.mp3`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('personalized-videos')
          .upload(audioFileName, audioBuffer, {
            contentType: 'audio/mpeg',
            upsert: true,
          });

        if (uploadError) {
          console.error('Storage upload error:', uploadError);
          throw new Error('Failed to upload audio to storage');
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('personalized-videos')
          .getPublicUrl(audioFileName);
        
        generatedAudioUrl = urlData.publicUrl;
        console.log('Audio uploaded to:', generatedAudioUrl);

        // Use audio URL with HeyGen
        voiceConfig = {
          type: 'audio',
          audio_url: generatedAudioUrl,
        };
      } catch (elevenLabsError) {
        console.error('ElevenLabs generation failed, falling back to HeyGen voice:', elevenLabsError);
        // Fallback to HeyGen voice
        voiceConfig = {
          type: 'text',
          input_text: introScript,
          voice_id: '7addb1d6eaba435da3bbd4abcb26407a', // Klaus - Natural
          speed: 1.0,
        };
      }
    } else if (audioUrl) {
      // Option 2: Use provided audio URL directly
      console.log('Using provided audio_url as voice source');
      voiceConfig = {
        type: 'audio',
        audio_url: audioUrl,
      };
    } else if (voiceId && !useElevenLabs) {
      // Option 3: Use HeyGen voice ID directly
      console.log('Using HeyGen voice_id:', voiceId);
      voiceConfig = {
        type: 'text',
        input_text: introScript,
        voice_id: voiceId,
        speed: 1.0,
      };
    } else {
      // Option 4: Fallback to German standard voice - Klaus Natural
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
        width: 1280,
        height: 720,
      },
      aspect_ratio: '16:9',
    };

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
        audioUrl: generatedAudioUrl,
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
