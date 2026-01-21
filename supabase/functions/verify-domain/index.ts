import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { domain } = await req.json();

    if (!domain) {
      return new Response(
        JSON.stringify({ success: false, error: 'Domain ist erforderlich' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Clean domain
    const cleanDomain = domain
      .replace(/^https?:\/\//, '')
      .replace(/\/$/, '')
      .trim();

    console.log(`Verifying domain: ${cleanDomain}`);

    // Try to resolve the domain via DNS by making a request
    const testUrl = `https://${cleanDomain}`;
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch(testUrl, {
        method: 'HEAD',
        signal: controller.signal,
        redirect: 'follow',
      });

      clearTimeout(timeoutId);

      console.log(`Domain ${cleanDomain} responded with status: ${response.status}`);

      // Check if we got a response (any status means domain is reachable)
      if (response.status >= 200 && response.status < 600) {
        return new Response(
          JSON.stringify({ 
            success: true, 
            reachable: true,
            status: response.status,
            message: 'Domain ist erreichbar und konfiguriert!'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } catch (fetchError: unknown) {
      const errorMessage = fetchError instanceof Error ? fetchError.message : String(fetchError);
      console.log(`Fetch error for ${cleanDomain}:`, errorMessage);

      // Check if it's a DNS or connection error
      if (errorMessage.includes('dns') || 
          errorMessage.includes('resolve') ||
          errorMessage.includes('ENOTFOUND')) {
        return new Response(
          JSON.stringify({ 
            success: true,
            reachable: false,
            dnsConfigured: false,
            message: 'DNS-Eintrag noch nicht gefunden. Bitte A-Record hinzufügen und bis zu 24h warten.'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // SSL errors often mean domain is reachable but SSL not yet configured
      if (errorMessage.includes('ssl') || 
          errorMessage.includes('certificate') ||
          errorMessage.includes('SSL')) {
        return new Response(
          JSON.stringify({ 
            success: true,
            reachable: true,
            sslPending: true,
            message: 'Domain ist erreichbar! SSL-Zertifikat wird noch eingerichtet.'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Connection refused or timeout might mean DNS is set but server not responding yet
      if (errorMessage.includes('refused') || 
          errorMessage.includes('timeout') ||
          errorMessage.includes('abort')) {
        return new Response(
          JSON.stringify({ 
            success: true,
            reachable: false,
            dnsConfigured: true,
            message: 'DNS scheint konfiguriert, Server antwortet noch nicht. Bitte kurz warten.'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Generic error
      return new Response(
        JSON.stringify({ 
          success: true,
          reachable: false,
          message: 'Domain noch nicht erreichbar. Prüfe den DNS-Eintrag.'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        reachable: false,
        message: 'Domain-Status unbekannt'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error verifying domain:', errorMessage);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
