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
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const HEYGEN_API_KEY = Deno.env.get('HEYGEN_API_KEY');
    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing Supabase configuration');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Find contacts with pending_auto video status
    const { data: pendingContacts, error: fetchError } = await supabase
      .from('contacts')
      .select('id, first_name, last_name, company, campaign_id')
      .eq('video_status', 'pending_auto')
      .eq('lead_type', 'outbound')
      .limit(5);

    if (fetchError) {
      console.error('Error fetching pending contacts:', fetchError);
      throw fetchError;
    }

    if (!pendingContacts || pendingContacts.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No pending videos to process', processed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${pendingContacts.length} contacts with pending_auto status`);

    const results: Array<{ contactId: string; name: string; videoId: string; status: string }> = [];

    for (const contact of pendingContacts) {
      if (!contact.campaign_id) {
        console.log(`Contact ${contact.id} has no campaign, skipping`);
        await supabase
          .from('contacts')
          .update({ video_status: 'error', video_error: 'Keine Kampagne zugewiesen' })
          .eq('id', contact.id);
        continue;
      }

      const { data: campaign } = await supabase
        .from('campaigns')
        .select('id, heygen_avatar_id, heygen_voice_id, pitch_video_url, voice_source_audio_url')
        .eq('id', contact.campaign_id)
        .single();

      if (!campaign) {
        console.log(`Contact ${contact.id} campaign not found, skipping`);
        await supabase
          .from('contacts')
          .update({ video_status: 'error', video_error: 'Kampagne nicht gefunden' })
          .eq('id', contact.id);
        continue;
      }

      if (!campaign.heygen_avatar_id) {
        console.log(`Campaign ${campaign.id} has no avatar configured, skipping contact ${contact.id}`);
        await supabase
          .from('contacts')
          .update({ video_status: 'error', video_error: 'Kein Avatar in der Kampagne konfiguriert' })
          .eq('id', contact.id);
        continue;
      }

      try {
        console.log(`Processing video for contact ${contact.id}: ${contact.first_name} ${contact.last_name}`);
        
        await supabase
          .from('contacts')
          .update({ video_status: 'generating_intro', video_error: null })
          .eq('id', contact.id);

        const introScript = `Hey ${contact.first_name}, ich habe dir dieses Video einfach mal kurz aufgenommen, weil ich auf dein LinkedIn Profil gestoßen bin und dir einfach mal zeigen wollte, wie wir mindestens mal 3-5 Kunden in den nächsten 90 Tagen nur über LinkedIn für dich gewinnen.`;

        let voiceConfig: { type: string; audio_url?: string; input_text?: string; voice_id?: string; speed?: number };

        if (campaign.voice_source_audio_url && ELEVENLABS_API_KEY) {
          voiceConfig = {
            type: 'audio',
            audio_url: campaign.voice_source_audio_url,
          };
        } else if (campaign.heygen_voice_id) {
          voiceConfig = {
            type: 'text',
            input_text: introScript,
            voice_id: campaign.heygen_voice_id,
            speed: 1.0,
          };
        } else {
          voiceConfig = {
            type: 'text',
            input_text: introScript,
            voice_id: '7addb1d6eaba435da3bbd4abcb26407a',
            speed: 1.0,
          };
        }

        if (ELEVENLABS_API_KEY && campaign.heygen_voice_id && voiceConfig.type === 'text') {
          try {
            console.log('Generating ElevenLabs audio...');
            const elevenLabsResponse = await fetch(
              `https://api.elevenlabs.io/v1/text-to-speech/${campaign.heygen_voice_id}?output_format=mp3_44100_128`,
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

            if (elevenLabsResponse.ok) {
              const audioBuffer = await elevenLabsResponse.arrayBuffer();
              const audioFileName = `intro-audio-${contact.id}-${Date.now()}.mp3`;
              
              const { error: uploadError } = await supabase.storage
                .from('personalized-videos')
                .upload(audioFileName, audioBuffer, {
                  contentType: 'audio/mpeg',
                  upsert: true,
                });

              if (!uploadError) {
                const { data: urlData } = supabase.storage
                  .from('personalized-videos')
                  .getPublicUrl(audioFileName);
                
                voiceConfig = {
                  type: 'audio',
                  audio_url: urlData.publicUrl,
                };
                console.log('ElevenLabs audio uploaded:', urlData.publicUrl);
              }
            }
          } catch (elevenLabsError) {
            console.error('ElevenLabs generation failed, using HeyGen voice:', elevenLabsError);
          }
        }

        const requestBody = {
          video_inputs: [
            {
              character: {
                type: 'avatar',
                avatar_id: campaign.heygen_avatar_id,
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

        console.log('Sending HeyGen request for contact:', contact.id);

        const heygenResponse = await fetch('https://api.heygen.com/v2/video/generate', {
          method: 'POST',
          headers: {
            'X-Api-Key': HEYGEN_API_KEY!,
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
              video_error: `HeyGen Fehler: ${heygenResponse.status}` 
            })
            .eq('id', contact.id);
          continue;
        }

        const heygenData = await heygenResponse.json();
        const videoId = heygenData.data?.video_id;

        if (videoId) {
          await supabase
            .from('contacts')
            .update({ heygen_video_id: videoId })
            .eq('id', contact.id);

          results.push({
            contactId: contact.id,
            name: `${contact.first_name} ${contact.last_name}`,
            videoId,
            status: 'generating',
          });

          console.log(`Video generation started for ${contact.first_name}: ${videoId}`);
        }

      } catch (contactError) {
        console.error(`Error processing contact ${contact.id}:`, contactError);
        await supabase
          .from('contacts')
          .update({ 
            video_status: 'error', 
            video_error: contactError instanceof Error ? contactError.message : 'Unbekannter Fehler'
          })
          .eq('id', contact.id);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: results.length,
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing pending videos:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
