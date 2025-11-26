import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { transcript, systemContext, leadContext } = await req.json();
    
    if (!transcript) {
      throw new Error('No transcript provided');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('Lovable API key not configured');
    }

    // Check for objection keywords
    const objectionKeywords = [
      'zu teuer', 'zu viel', 'preis', 'kostet', 'budget',
      'keine zeit', 'später', 'nachdenken', 'überlegen',
      'nicht interessiert', 'kein interesse', 'kein bedarf',
      'chef', 'vorgesetzter', 'entscheider', 'entscheidung',
      'bereits', 'schon', 'haben schon', 'zufrieden',
      'funktioniert', 'läuft', 'passt so'
    ];

    const transcriptLower = transcript.toLowerCase();
    const hasObjection = objectionKeywords.some(keyword => 
      transcriptLower.includes(keyword)
    );

    if (!hasObjection) {
      return new Response(
        JSON.stringify({ hasObjection: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Analyze with Gemini via Lovable AI
    const prompt = `Du bist ein Sales-Experte für Einwandbehandlung.

SYSTEM CONTEXT:
${systemContext}

LEAD CONTEXT:
${leadContext}

ERKANNTER EINWAND:
"${transcript}"

Analysiere diesen Einwand und gib eine kurze, prägnante Einwandbehandlung (max. 100 Wörter), die der Vertriebsmitarbeiter SOFORT verwenden kann.

Format:
1. Kurze Empathie/Verständnis zeigen
2. Kernargument/Lösung
3. Handlungsaufforderung

Antworte NUR mit der Einwandbehandlung, ohne zusätzliche Erklärungen.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI error:', errorText);
      throw new Error(`AI analysis error: ${errorText}`);
    }

    const result = await response.json();
    const objectionResponse = result.choices[0].message.content;

    return new Response(
      JSON.stringify({ 
        hasObjection: true,
        objection: transcript,
        response: objectionResponse
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Analysis error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});