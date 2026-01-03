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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const encryptionSecret = supabaseServiceKey;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { accountId } = await req.json();

    if (!accountId) {
      throw new Error('Account ID erforderlich');
    }

    // Get encrypted API key
    const { data: keyData, error: keyError } = await supabase
      .from('encrypted_api_keys')
      .select('encrypted_value')
      .eq('account_id', accountId)
      .eq('key_name', 'heygen_api_key')
      .maybeSingle();

    if (keyError) {
      console.error('Error fetching key:', keyError);
      throw new Error('Fehler beim Abrufen des API Keys');
    }

    if (!keyData) {
      throw new Error('Kein API Key für diesen Account gefunden');
    }

    // Decrypt the key
    const apiKey = decryptKey(keyData.encrypted_value, encryptionSecret);

    // Fetch voices from HeyGen API
    console.log('Fetching voices from HeyGen...');
    const voicesResponse = await fetch('https://api.heygen.com/v2/voices', {
      headers: {
        'X-Api-Key': apiKey,
        'Accept': 'application/json',
      },
    });

    if (!voicesResponse.ok) {
      const errorText = await voicesResponse.text();
      console.error('HeyGen API error:', voicesResponse.status, errorText);
      throw new Error(`HeyGen API Fehler: ${voicesResponse.status}`);
    }

    const voicesData = await voicesResponse.json();
    console.log('Voices received:', JSON.stringify(voicesData, null, 2));

    return new Response(
      JSON.stringify({ 
        success: true,
        voices: voicesData.data?.voices || voicesData.voices || voicesData,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error listing voices:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
