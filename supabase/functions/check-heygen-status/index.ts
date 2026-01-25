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

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing Supabase configuration');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Check if this is a batch check (no body) or single check
    let contactId: string | undefined;
    let videoId: string | undefined;
    
    try {
      const body = await req.json();
      contactId = body.contactId;
      videoId = body.videoId;
    } catch {
      // No body - batch mode
    }

    // If no specific contact, find all contacts with generating_intro status
    if (!contactId && !videoId) {
      console.log('Batch mode: checking all generating_intro contacts');
      
      const { data: generatingContacts, error: fetchError } = await supabase
        .from('contacts')
        .select('id, first_name, last_name, heygen_video_id, account_id, campaign_id')
        .eq('video_status', 'generating_intro')
        .not('heygen_video_id', 'is', null)
        .limit(10);

      if (fetchError) {
        throw fetchError;
      }

      if (!generatingContacts || generatingContacts.length === 0) {
        return new Response(
          JSON.stringify({ message: 'No videos to check', checked: 0 }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`Found ${generatingContacts.length} contacts with generating_intro status`);

      const results: Array<{ contactId: string; status: string; videoUrl?: string }> = [];
      const apiKeyCache: Record<string, string> = {};

      for (const contact of generatingContacts) {
        try {
          // Get account-specific HeyGen API key
          let heygenApiKey = apiKeyCache[contact.account_id];
          
          if (!heygenApiKey) {
            const { data: keyData } = await supabase
              .from('encrypted_api_keys')
              .select('encrypted_value')
              .eq('account_id', contact.account_id)
              .eq('key_name', 'heygen_api_key')
              .maybeSingle();

            if (!keyData) {
              console.log(`No HeyGen API key for account ${contact.account_id}, skipping`);
              continue;
            }

            heygenApiKey = decryptKey(keyData.encrypted_value, SUPABASE_SERVICE_ROLE_KEY);
            apiKeyCache[contact.account_id] = heygenApiKey;
          }

          // Check video status with HeyGen
          const statusResponse = await fetch(
            `https://api.heygen.com/v1/video_status.get?video_id=${contact.heygen_video_id}`,
            {
              method: 'GET',
              headers: { 'X-Api-Key': heygenApiKey },
            }
          );

          if (!statusResponse.ok) {
            console.error(`HeyGen status error for ${contact.id}:`, await statusResponse.text());
            continue;
          }

          const statusData = await statusResponse.json();
          const status = statusData.data?.status;
          const introVideoUrl = statusData.data?.video_url;

          console.log(`Contact ${contact.first_name}: status=${status}, url=${introVideoUrl ? 'yes' : 'no'}`);

          if (status === 'completed' && introVideoUrl) {
            // Get the campaign's pitch video URL
            const { data: campaign } = await supabase
              .from('campaigns')
              .select('pitch_video_url')
              .eq('id', contact.campaign_id)
              .single();

            // Update contact with intro video URL and set final video_url
            await supabase
              .from('contacts')
              .update({ 
                intro_video_url: introVideoUrl,
                video_url: introVideoUrl, // Set the video_url to intro for display
                video_status: 'ready',
                video_generated_at: new Date().toISOString(),
              })
              .eq('id', contact.id);

            results.push({ contactId: contact.id, status: 'completed', videoUrl: introVideoUrl });
            console.log(`Video ready for ${contact.first_name}: ${introVideoUrl}`);
          } else if (status === 'failed') {
            await supabase
              .from('contacts')
              .update({ 
                video_status: 'error',
                video_error: statusData.data?.error || 'HeyGen video generation failed'
              })
              .eq('id', contact.id);

            results.push({ contactId: contact.id, status: 'failed' });
          } else {
            results.push({ contactId: contact.id, status: status || 'processing' });
          }
        } catch (contactError) {
          console.error(`Error checking contact ${contact.id}:`, contactError);
        }
      }

      return new Response(
        JSON.stringify({ success: true, checked: results.length, results }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Single contact check mode
    if (!videoId) {
      throw new Error('videoId is required');
    }

    console.log(`Single check: video ${videoId}, contact ${contactId}`);

    // Get the contact to find account_id
    let accountId: string | undefined;
    let campaignId: string | undefined;

    if (contactId) {
      const { data: contact } = await supabase
        .from('contacts')
        .select('account_id, campaign_id')
        .eq('id', contactId)
        .single();
      
      accountId = contact?.account_id;
      campaignId = contact?.campaign_id;
    }

    // Get account-specific HeyGen API key
    let heygenApiKey: string | undefined;

    if (accountId) {
      const { data: keyData } = await supabase
        .from('encrypted_api_keys')
        .select('encrypted_value')
        .eq('account_id', accountId)
        .eq('key_name', 'heygen_api_key')
        .maybeSingle();

      if (keyData) {
        heygenApiKey = decryptKey(keyData.encrypted_value, SUPABASE_SERVICE_ROLE_KEY);
      }
    }

    // Fallback to global key if no account-specific key
    if (!heygenApiKey) {
      heygenApiKey = Deno.env.get('HEYGEN_API_KEY');
    }

    if (!heygenApiKey) {
      throw new Error('No HeyGen API key available');
    }

    // Check video status with HeyGen
    const statusResponse = await fetch(
      `https://api.heygen.com/v1/video_status.get?video_id=${videoId}`,
      {
        method: 'GET',
        headers: { 'X-Api-Key': heygenApiKey },
      }
    );

    if (!statusResponse.ok) {
      const errorText = await statusResponse.text();
      console.error('HeyGen status API error:', errorText);
      throw new Error(`HeyGen status API error: ${statusResponse.status}`);
    }

    const statusData = await statusResponse.json();
    console.log('HeyGen status:', statusData);

    const status = statusData.data?.status;
    const introVideoUrl = statusData.data?.video_url;

    if (status === 'completed' && introVideoUrl && contactId) {
      // Video is ready - update contact with intro video URL and set as ready
      await supabase
        .from('contacts')
        .update({ 
          intro_video_url: introVideoUrl,
          video_url: introVideoUrl, // Set the main video_url to the intro
          video_status: 'ready',
          video_generated_at: new Date().toISOString(),
        })
        .eq('id', contactId);

      return new Response(
        JSON.stringify({ 
          success: true, 
          status: 'completed',
          videoUrl: introVideoUrl,
          message: 'Video ready' 
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
