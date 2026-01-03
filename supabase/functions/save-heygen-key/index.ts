import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";


const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple base64 encoding for storing encrypted key
function encryptKey(apiKey: string, secret: string): string {
  const keyBytes = new TextEncoder().encode(apiKey);
  const secretBytes = new TextEncoder().encode(secret);
  const encrypted = new Uint8Array(keyBytes.length);
  
  for (let i = 0; i < keyBytes.length; i++) {
    encrypted[i] = keyBytes[i] ^ secretBytes[i % secretBytes.length];
  }
  
  // Convert to base64 manually
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
    const encryptionSecret = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!; // Use service key as encryption key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from auth header
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('Nicht authentifiziert');
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, account_id')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      throw new Error('Nur Administratoren können API Keys speichern');
    }

    const { accountId, apiKey } = await req.json();

    if (!accountId || !apiKey) {
      throw new Error('Account ID und API Key erforderlich');
    }

    // Verify the user belongs to this account
    if (profile.account_id !== accountId) {
      throw new Error('Keine Berechtigung für diesen Account');
    }

    // Encrypt and store the API key
    const encryptedKey = encryptKey(apiKey, encryptionSecret);
    const keyName = 'heygen_api_key';

    // Upsert the encrypted key
    const { error: upsertError } = await supabase
      .from('encrypted_api_keys')
      .upsert({
        account_id: accountId,
        key_name: keyName,
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
    const { error: integrationError } = await supabase
      .from('account_integrations')
      .upsert({
        account_id: accountId,
        heygen_api_key_id: accountId, // Just mark that key exists
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'account_id',
      });

    if (integrationError) {
      console.error('Integration update error:', integrationError);
    }

    console.log(`HeyGen API key saved for account ${accountId}`);

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error saving HeyGen key:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
