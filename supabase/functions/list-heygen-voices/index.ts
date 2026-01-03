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

    // Fetch all voices from HeyGen API (includes voice clones)
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

    // Parse voices array
    const allVoices = voicesData.data?.voices || voicesData.voices || [];
    
    // Filter for German voices and Voice Clones
    const germanVoices = allVoices.filter((v: any) => 
      v.language?.toLowerCase().includes('german') || 
      v.language?.toLowerCase().includes('deutsch')
    );
    
    // Voice clones typically have specific identifiers or are user-created
    const voiceClones = allVoices.filter((v: any) => 
      v.voice_type === 'custom' || 
      v.voice_type === 'cloned' ||
      v.is_cloned === true ||
      v.type === 'cloned'
    );

    return new Response(
      JSON.stringify({ 
        success: true,
        allVoices: allVoices,
        germanVoices: germanVoices,
        voiceClones: voiceClones,
        totalCount: allVoices.length,
        germanCount: germanVoices.length,
        cloneCount: voiceClones.length,
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
