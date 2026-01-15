import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[ADMIN-STRIPE-STATS] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    // Verify user is super admin
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");

    // Check if user is super admin
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('is_super_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_super_admin) {
      throw new Error("Access denied - Super admin only");
    }

    logStep("Super admin verified", { userId: user.id });

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Fetch all subscriptions from Stripe
    logStep("Fetching subscriptions from Stripe");
    
    const allSubscriptions: Stripe.Subscription[] = [];
    let hasMore = true;
    let startingAfter: string | undefined;

    while (hasMore) {
      const params: Stripe.SubscriptionListParams = {
        limit: 100,
        expand: ['data.customer', 'data.items.data.price'],
      };
      if (startingAfter) params.starting_after = startingAfter;

      const response = await stripe.subscriptions.list(params);
      allSubscriptions.push(...response.data);
      hasMore = response.has_more;
      if (response.data.length > 0) {
        startingAfter = response.data[response.data.length - 1].id;
      }
    }

    logStep("Fetched subscriptions", { count: allSubscriptions.length });

    // Calculate MRR and ARR
    let mrr = 0;
    let arr = 0;
    const activeSubscriptions: any[] = [];
    const canceledSubscriptions: any[] = [];
    const subscriptionsByPlan: Record<string, number> = {};
    const statusCounts = {
      active: 0,
      canceled: 0,
      past_due: 0,
      trialing: 0,
      incomplete: 0,
      other: 0,
    };

    // Price ID to plan mapping
    const PRICE_TO_PLAN: Record<string, { name: string; monthlyAmount: number }> = {
      // Starter Monthly - €49/month
      "price_1Tka8gEaO7RPawTGLuKYPnxh": { name: "Starter", monthlyAmount: 4900 },
      // Starter Yearly - €490/year = €40.83/month
      "price_1TkaB4EaO7RPawTGTN6m4dWx": { name: "Starter (Jahr)", monthlyAmount: 4083 },
      // Pro Monthly - €299/month
      "price_1TkoLkEaO7RPawTGogtgGjKc": { name: "Pro", monthlyAmount: 29900 },
      // Pro Yearly - €2.490/year = €207.50/month
      "price_1TkoLkEaO7RPawTGYzwPXQ3P": { name: "Pro (Jahr)", monthlyAmount: 20750 },
    };

    for (const sub of allSubscriptions) {
      const customer = sub.customer as Stripe.Customer;
      const price = sub.items.data[0]?.price;
      const priceId = price?.id || '';
      const planInfo = PRICE_TO_PLAN[priceId] || { name: 'Unknown', monthlyAmount: 0 };
      
      // Count by plan
      subscriptionsByPlan[planInfo.name] = (subscriptionsByPlan[planInfo.name] || 0) + 1;

      // Count by status
      if (sub.status === 'active') {
        statusCounts.active++;
        mrr += planInfo.monthlyAmount;
      } else if (sub.status === 'canceled') {
        statusCounts.canceled++;
      } else if (sub.status === 'past_due') {
        statusCounts.past_due++;
      } else if (sub.status === 'trialing') {
        statusCounts.trialing++;
        mrr += planInfo.monthlyAmount; // Count trials as MRR too
      } else if (sub.status === 'incomplete') {
        statusCounts.incomplete++;
      } else {
        statusCounts.other++;
      }

      const subscriptionData = {
        id: sub.id,
        status: sub.status,
        planName: planInfo.name,
        monthlyAmount: planInfo.monthlyAmount / 100, // Convert to EUR
        customerEmail: customer?.email || 'Unknown',
        customerName: customer?.name || customer?.email || 'Unknown',
        currentPeriodEnd: sub.current_period_end 
          ? new Date(sub.current_period_end * 1000).toISOString() 
          : null,
        cancelAtPeriodEnd: sub.cancel_at_period_end,
        created: new Date(sub.created * 1000).toISOString(),
      };

      if (sub.status === 'active' || sub.status === 'trialing') {
        activeSubscriptions.push(subscriptionData);
      } else {
        canceledSubscriptions.push(subscriptionData);
      }
    }

    // Calculate ARR from MRR
    arr = mrr * 12;

    // Convert cents to EUR
    const mrrEur = mrr / 100;
    const arrEur = arr / 100;

    logStep("Calculated metrics", { mrr: mrrEur, arr: arrEur, active: statusCounts.active });

    // Sort active subscriptions by creation date (newest first)
    activeSubscriptions.sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());

    // Calculate MRR history for the last 6 months
    logStep("Calculating MRR history");
    const mrrHistory: { month: string; mrr: number; subscriptions: number }[] = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
      
      let monthMrr = 0;
      let monthSubs = 0;

      for (const sub of allSubscriptions) {
        const createdAt = new Date(sub.created * 1000);
        const canceledAt = sub.canceled_at ? new Date(sub.canceled_at * 1000) : null;
        
        // Check if subscription was active during this month
        const wasCreatedBefore = createdAt <= monthEnd;
        const wasActiveInMonth = !canceledAt || canceledAt > monthDate;
        
        if (wasCreatedBefore && wasActiveInMonth) {
          const price = sub.items.data[0]?.price;
          const priceId = price?.id || '';
          const planInfo = PRICE_TO_PLAN[priceId] || { name: 'Unknown', monthlyAmount: 0 };
          
          // Only count if status was not incomplete at that time
          if (sub.status !== 'incomplete') {
            monthMrr += planInfo.monthlyAmount;
            monthSubs++;
          }
        }
      }

      const monthName = monthDate.toLocaleDateString('de-DE', { month: 'short', year: '2-digit' });
      mrrHistory.push({
        month: monthName,
        mrr: monthMrr / 100, // Convert to EUR
        subscriptions: monthSubs,
      });
    }

    logStep("MRR history calculated", { months: mrrHistory.length });

    return new Response(JSON.stringify({
      mrr: mrrEur,
      arr: arrEur,
      totalSubscriptions: allSubscriptions.length,
      statusCounts,
      subscriptionsByPlan,
      activeSubscriptions,
      canceledSubscriptions,
      mrrHistory,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});