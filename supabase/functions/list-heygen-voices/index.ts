import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('HEYGEN_API_KEY');
    
    if (!apiKey) {
      throw new Error('HEYGEN_API_KEY nicht konfiguriert');
    }

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
