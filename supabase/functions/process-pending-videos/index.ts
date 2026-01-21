import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Decrypt XOR encrypted key
function decryptKey(encryptedValue: string, secret: string): string {
  const binary = atob(encryptedValue);
  const encrypted = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    encrypted[i] = binary.charCodeAt(i);
  }
  
  const secretBytes = new TextEncoder().encode(secret);
  const decrypted = new Uint8Array(encrypted.length);
  
  for (let i = 0; i < encrypted.length; i++) {
    decrypted[i] = encrypted[i] ^ secretBytes[i % secretBytes.length];
  }
  
  return new TextDecoder().decode(decrypted);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing Supabase configuration');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Find contacts with pending_auto video status - include account_id
    const { data: pendingContacts, error: fetchError } = await supabase
      .from('contacts')
      .select('id, first_name, last_name, company, campaign_id, account_id')
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

    // Cache for account API keys to avoid repeated lookups
    const apiKeyCache: Record<string, string> = {};

    for (const contact of pendingContacts) {
      if (!contact.campaign_id) {
        console.log(`Contact ${contact.id} has no campaign, skipping`);
        await supabase
          .from('contacts')
          .update({ video_status: 'error', video_error: 'Keine Kampagne zugewiesen' })
          .eq('id', contact.id);
        continue;
      }

      if (!contact.account_id) {
        console.log(`Contact ${contact.id} has no account_id, skipping`);
        await supabase
          .from('contacts')
          .update({ video_status: 'error', video_error: 'Kein Account zugewiesen' })
          .eq('id', contact.id);
        continue;
      }

      // Get HeyGen API key for this account (from encrypted_api_keys table)
      let heygenApiKey = apiKeyCache[contact.account_id];
      
      if (!heygenApiKey) {
        const { data: keyData, error: keyError } = await supabase
          .from('encrypted_api_keys')
          .select('encrypted_value')
          .eq('account_id', contact.account_id)
          .eq('key_name', 'heygen_api_key')
          .maybeSingle();

        if (keyError) {
          console.error('Error fetching API key:', keyError);
          await supabase
            .from('contacts')
            .update({ video_status: 'error', video_error: 'Fehler beim Abrufen des API Keys' })
            .eq('id', contact.id);
          continue;
        }

        if (!keyData) {
          console.log(`No HeyGen API key found for account ${contact.account_id}`);
          await supabase
            .from('contacts')
            .update({ video_status: 'error', video_error: 'Kein HeyGen API Key für diesen Account hinterlegt. Bitte im Onboarding oder unter Einstellungen -> Integrationen eingeben.' })
            .eq('id', contact.id);
          continue;
        }

        // Decrypt the key
        try {
          heygenApiKey = decryptKey(keyData.encrypted_value, SUPABASE_SERVICE_ROLE_KEY);
          apiKeyCache[contact.account_id] = heygenApiKey;
          console.log(`Decrypted HeyGen API key for account ${contact.account_id}`);
        } catch (decryptError) {
          console.error('Error decrypting API key:', decryptError);
          await supabase
            .from('contacts')
            .update({ video_status: 'error', video_error: 'Fehler beim Entschlüsseln des API Keys' })
            .eq('id', contact.id);
          continue;
        }
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
        console.log('Using avatar:', campaign.heygen_avatar_id);

        const heygenResponse = await fetch('https://api.heygen.com/v2/video/generate', {
          method: 'POST',
          headers: {
            'X-Api-Key': heygenApiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });

        if (!heygenResponse.ok) {
          const errorText = await heygenResponse.text();
          console.error('HeyGen API error:', errorText);
          
          let errorMessage = `HeyGen Fehler: ${heygenResponse.status}`;
          if (heygenResponse.status === 401) {
            errorMessage = 'HeyGen API Key ungültig oder abgelaufen. Bitte im Onboarding oder unter Einstellungen -> Integrationen aktualisieren.';
          } else if (heygenResponse.status === 403) {
            errorMessage = 'HeyGen API Zugriff verweigert. Bitte API Key Berechtigungen prüfen.';
          } else if (heygenResponse.status === 429) {
            errorMessage = 'HeyGen Rate Limit erreicht. Bitte später erneut versuchen.';
          }
          
          await supabase
            .from('contacts')
            .update({ 
              video_status: 'error', 
              video_error: errorMessage 
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
