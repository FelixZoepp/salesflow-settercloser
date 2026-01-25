import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple XOR encryption for storing API key
function encryptKey(apiKey: string, secret: string): string {
  const keyBytes = new TextEncoder().encode(apiKey);
  const secretBytes = new TextEncoder().encode(secret);
  const encrypted = new Uint8Array(keyBytes.length);
  
  for (let i = 0; i < keyBytes.length; i++) {
    encrypted[i] = keyBytes[i] ^ secretBytes[i % secretBytes.length];
  }
  
  let binary = '';
  for (let i = 0; i < encrypted.length; i++) {
    binary += String.fromCharCode(encrypted[i]);
  }
  return btoa(binary);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { accountId, apiKey, testOnly } = await req.json();

    if (!apiKey) {
      throw new Error('API Key erforderlich');
    }

    // First, test if the API key works with HeyGen
    console.log('Testing HeyGen API key...');
    const testResponse = await fetch('https://api.heygen.com/v1/video.list', {
      method: 'GET',
      headers: { 'X-Api-Key': apiKey },
    });

    if (!testResponse.ok) {
      const errorText = await testResponse.text();
      console.error('HeyGen API test failed:', testResponse.status, errorText);
      throw new Error(`HeyGen API Key ungültig: ${testResponse.status}`);
    }

    console.log('HeyGen API key is valid!');

    // Get remaining quota
    let credits = null;
    try {
      const creditsResponse = await fetch('https://api.heygen.com/v1/user/remaining_quota', {
        headers: { 'X-Api-Key': apiKey },
      });
      if (creditsResponse.ok) {
        const creditsData = await creditsResponse.json();
        credits = creditsData.data?.remaining_quota;
        console.log('Remaining credits:', credits);
      }
    } catch (e) {
      console.log('Could not fetch credits:', e);
    }

    if (testOnly) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'API Key ist gültig!',
          credits,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!accountId) {
      throw new Error('Account ID erforderlich zum Speichern');
    }

    // Encrypt and store the API key
    const encryptedKey = encryptKey(apiKey, supabaseServiceKey);

    // Upsert the encrypted key
    const { error: upsertError } = await supabase
      .from('encrypted_api_keys')
      .upsert({
        account_id: accountId,
        key_name: 'heygen_api_key',
        encrypted_value: encryptedKey,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'account_id,key_name',
      });

    if (upsertError) {
      console.error('Error storing encrypted key:', upsertError);
      throw new Error('Fehler beim Speichern des API Keys');
    }

    // Update account_integrations to mark key as set
    await supabase
      .from('account_integrations')
      .upsert({
        account_id: accountId,
        heygen_api_key_id: accountId,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'account_id',
      });

    console.log(`HeyGen API key saved for account ${accountId}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'API Key gespeichert!',
        credits,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
