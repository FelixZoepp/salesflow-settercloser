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

// Internal function to get HeyGen API key for an account
// Called by other edge functions (generate-heygen-video, etc.)
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

    // Also get avatar and voice IDs
    const { data: integration } = await supabase
      .from('account_integrations')
      .select('heygen_avatar_id, heygen_voice_id')
      .eq('account_id', accountId)
      .maybeSingle();

    return new Response(
      JSON.stringify({ 
        apiKey,
        avatarId: integration?.heygen_avatar_id,
        voiceId: integration?.heygen_voice_id,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error getting HeyGen key:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
