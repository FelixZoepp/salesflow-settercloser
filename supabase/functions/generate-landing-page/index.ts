import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `Du bist ein Experte für Landing Page Design und Copywriting. Generiere professionelle Landing Page Inhalte basierend auf dem Prompt des Nutzers.

Antworte IMMER mit einem validen JSON-Objekt mit folgender Struktur:

{
  "hero": {
    "headline": "Hauptüberschrift (maximal 10 Wörter)",
    "subheadline": "Unterüberschrift (1-2 Sätze)",
    "ctaText": "Call-to-Action Button Text",
    "ctaLink": "#kontakt"
  },
  "benefits": [
    {
      "icon": "CheckCircle",
      "title": "Vorteil 1",
      "description": "Beschreibung des Vorteils"
    },
    {
      "icon": "Zap",
      "title": "Vorteil 2", 
      "description": "Beschreibung des Vorteils"
    },
    {
      "icon": "Shield",
      "title": "Vorteil 3",
      "description": "Beschreibung des Vorteils"
    }
  ],
  "features": [
    {
      "title": "Feature 1",
      "description": "Detaillierte Beschreibung",
      "bulletPoints": ["Punkt 1", "Punkt 2", "Punkt 3"]
    },
    {
      "title": "Feature 2",
      "description": "Detaillierte Beschreibung",
      "bulletPoints": ["Punkt 1", "Punkt 2", "Punkt 3"]
    }
  ],
  "testimonials": [
    {
      "quote": "Kundenzitat",
      "author": "Name",
      "company": "Firma",
      "role": "Position"
    }
  ],
  "faq": [
    {
      "question": "Häufige Frage?",
      "answer": "Antwort auf die Frage"
    }
  ],
  "cta": {
    "headline": "Abschluss-Überschrift",
    "description": "Kurze Beschreibung",
    "buttonText": "Jetzt starten",
    "buttonLink": "#kontakt"
  },
  "footer": {
    "companyName": "Firmenname",
    "tagline": "Kurzer Slogan"
  },
  "suggestedColors": {
    "primary": "#3B82F6",
    "secondary": "#1E40AF",
    "accent": "#F59E0B",
    "background": "#FFFFFF",
    "text": "#1F2937"
  },
  "suggestedName": "Seitenname"
}

Wähle passende Lucide Icons aus: CheckCircle, Zap, Shield, Star, Clock, Users, Award, Target, TrendingUp, Heart, Sparkles, Rocket, Globe, Lock, BarChart, Mail, Phone, MessageSquare

Passe alle Inhalte an das beschriebene Business/Produkt an. Sei kreativ, überzeugend und professionell.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const { prompt, existingContent } = await req.json();

    if (!prompt) {
      throw new Error('Prompt is required');
    }

    let userMessage = prompt;
    if (existingContent) {
      userMessage = `Basierend auf dem vorherigen Content, bitte überarbeite/verbessere folgendes:\n\nUrsprünglicher Prompt: ${prompt}\n\nAktueller Content: ${JSON.stringify(existingContent)}\n\nNeue Anweisung: ${prompt}`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userMessage }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit erreicht. Bitte versuche es später erneut." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Zahlungspflichtig. Bitte lade dein Guthaben auf." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content generated');
    }

    // Parse JSON from response (handle markdown code blocks)
    let parsedContent;
    try {
      // Remove markdown code blocks if present
      let jsonString = content;
      if (content.includes('```json')) {
        jsonString = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      } else if (content.includes('```')) {
        jsonString = content.replace(/```\n?/g, '');
      }
      parsedContent = JSON.parse(jsonString.trim());
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      throw new Error('Failed to parse generated content');
    }

    return new Response(JSON.stringify({ 
      success: true, 
      content: parsedContent 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
