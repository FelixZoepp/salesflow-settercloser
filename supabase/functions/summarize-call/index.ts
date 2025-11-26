import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sessionId, transcript } = await req.json();

    if (!sessionId || !transcript) {
      throw new Error('sessionId and transcript are required');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Generating call summary for session:', sessionId);

    // Call Lovable AI for summary
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `Du bist ein AI-Assistent für Sales-Call-Analyse. Analysiere das folgende Verkaufsgespräch und erstelle eine strukturierte Zusammenfassung.

Antworte im folgenden JSON-Format:
{
  "summary": "Eine kurze Zusammenfassung des gesamten Gesprächs (2-3 Sätze)",
  "key_points": ["Hauptpunkt 1", "Hauptpunkt 2", "Hauptpunkt 3"],
  "action_items": ["Handlung 1", "Handlung 2"],
  "sentiment": "positive" | "neutral" | "negative"
}

Sentiment-Kriterien:
- positive: Kunde war interessiert, freundlich, vereinbart Termin
- neutral: Höflich aber unverbindlich, kein klares Interesse
- negative: Kein Interesse, ablehnend, genervt`
          },
          {
            role: 'user',
            content: `Transkript des Sales-Calls:\n\n${transcript}\n\nBitte analysiere dieses Gespräch und erstelle die Zusammenfassung im JSON-Format.`
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "create_call_summary",
              description: "Erstelle eine strukturierte Zusammenfassung des Sales-Calls",
              parameters: {
                type: "object",
                properties: {
                  summary: {
                    type: "string",
                    description: "Kurze Zusammenfassung (2-3 Sätze)"
                  },
                  key_points: {
                    type: "array",
                    items: { type: "string" },
                    description: "Liste der Hauptpunkte aus dem Gespräch"
                  },
                  action_items: {
                    type: "array",
                    items: { type: "string" },
                    description: "Liste der Handlungsschritte"
                  },
                  sentiment: {
                    type: "string",
                    enum: ["positive", "neutral", "negative"],
                    description: "Sentiment des Gesprächs"
                  }
                },
                required: ["summary", "key_points", "action_items", "sentiment"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "create_call_summary" } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('Rate limits exceeded, please try again later');
      }
      if (response.status === 402) {
        throw new Error('Payment required, please add funds to your Lovable AI workspace');
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error('AI gateway error');
    }

    const data = await response.json();
    console.log('AI response:', JSON.stringify(data));

    // Extract the function call result
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || !toolCall.function?.arguments) {
      throw new Error('No valid function call in AI response');
    }

    const result = JSON.parse(toolCall.function.arguments);
    console.log('Parsed summary:', result);

    // Update call_sessions with summary
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { error: updateError } = await supabase
      .from('call_sessions')
      .update({
        transcript,
        summary: result.summary,
        key_points: result.key_points,
        action_items: result.action_items,
        sentiment: result.sentiment,
        summary_generated_at: new Date().toISOString()
      })
      .eq('id', sessionId);

    if (updateError) {
      console.error('Error updating session:', updateError);
      throw updateError;
    }

    console.log('Summary saved successfully');

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in summarize-call:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});