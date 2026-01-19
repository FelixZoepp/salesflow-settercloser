import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[REWARDFUL-AFFILIATE] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const rewardfulSecret = Deno.env.get("REWARDFUL_API_SECRET");
    if (!rewardfulSecret) {
      throw new Error("REWARDFUL_API_SECRET is not set");
    }
    logStep("Rewardful API secret verified");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header provided");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const body = await req.json();
    const { action, firstName, lastName } = body;
    logStep("Action requested", { action });

    const authString = btoa(`${rewardfulSecret}:`);
    const headers = {
      "Authorization": `Basic ${authString}`,
      "Content-Type": "application/json",
    };

    if (action === "get-affiliate") {
      // Try to find existing affiliate by email
      const searchResponse = await fetch(
        `https://api.getrewardful.com/v1/affiliates?email=${encodeURIComponent(user.email)}`,
        { headers }
      );
      
      if (!searchResponse.ok) {
        const errorText = await searchResponse.text();
        logStep("Error searching affiliates", { status: searchResponse.status, error: errorText });
        throw new Error(`Rewardful API error: ${searchResponse.status}`);
      }

      const searchData = await searchResponse.json();
      logStep("Search result", { count: searchData.data?.length });

      if (searchData.data && searchData.data.length > 0) {
        const affiliate = searchData.data[0];
        logStep("Found existing affiliate", { id: affiliate.id, link: affiliate.link, links: affiliate.links });
        
        // Get referrals for this affiliate
        const referralsResponse = await fetch(
          `https://api.getrewardful.com/v1/referrals?affiliate_id=${affiliate.id}`,
          { headers }
        );
        
        let referrals = [];
        if (referralsResponse.ok) {
          const referralsData = await referralsResponse.json();
          referrals = referralsData.data || [];
        }
        
        // Get commissions for this affiliate
        const commissionsResponse = await fetch(
          `https://api.getrewardful.com/v1/commissions?affiliate_id=${affiliate.id}`,
          { headers }
        );
        
        let commissions = [];
        if (commissionsResponse.ok) {
          const commissionsData = await commissionsResponse.json();
          commissions = commissionsData.data || [];
        }

        return new Response(JSON.stringify({ 
          affiliate,
          referrals,
          commissions,
          exists: true 
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      return new Response(JSON.stringify({ exists: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    if (action === "create-affiliate") {
      // Check if affiliate already exists first
      const searchResponse = await fetch(
        `https://api.getrewardful.com/v1/affiliates?email=${encodeURIComponent(user.email)}`,
        { headers }
      );
      
      if (searchResponse.ok) {
        const searchData = await searchResponse.json();
        if (searchData.data && searchData.data.length > 0) {
          const existingAffiliate = searchData.data[0];
          logStep("Affiliate already exists", { id: existingAffiliate.id, link: existingAffiliate.link });
          return new Response(JSON.stringify({ 
            affiliate: existingAffiliate,
            referrals: [],
            commissions: [],
            exists: true 
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          });
        }
      }
      
      const createResponse = await fetch("https://api.getrewardful.com/v1/affiliates", {
        method: "POST",
        headers,
        body: JSON.stringify({
          email: user.email,
          first_name: firstName || user.user_metadata?.name?.split(' ')[0] || "Partner",
          last_name: lastName || user.user_metadata?.name?.split(' ').slice(1).join(' ') || "",
        }),
      });

      if (!createResponse.ok) {
        const errorText = await createResponse.text();
        logStep("Error creating affiliate", { status: createResponse.status, error: errorText });
        throw new Error(`Failed to create affiliate: ${createResponse.status}`);
      }

      const affiliate = await createResponse.json();
      logStep("Created new affiliate", { id: affiliate.id, link: affiliate.link });

      return new Response(JSON.stringify({
        affiliate,
        referrals: [],
        commissions: [],
        exists: true,
        justCreated: true 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    throw new Error("Invalid action");
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
