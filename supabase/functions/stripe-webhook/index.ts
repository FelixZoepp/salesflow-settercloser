import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    logStep("ERROR: No signature found");
    return new Response(JSON.stringify({ error: "No signature" }), { status: 400 });
  }

  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  
  if (!stripeKey || !webhookSecret) {
    logStep("ERROR: Missing required secrets");
    return new Response(JSON.stringify({ error: "Configuration error" }), { status: 500 });
  }

  const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const body = await req.text();
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    logStep("Event received", { type: event.type, id: event.id });

    // Handle different event types
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(subscription, supabaseClient, stripe);
        break;
      }
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription, supabaseClient, stripe);
        break;
      }
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentSucceeded(invoice, supabaseClient, stripe);
        break;
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(invoice, supabaseClient, stripe);
        break;
      }
      default:
        logStep("Unhandled event type", { type: event.type });
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in webhook handler", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), { status: 400 });
  }
});

async function handleSubscriptionUpdate(
  subscription: Stripe.Subscription,
  supabase: any,
  stripe: Stripe
) {
  logStep("Handling subscription update", { subscriptionId: subscription.id, status: subscription.status });

  const customer = await stripe.customers.retrieve(subscription.customer as string);
  if (customer.deleted || !("email" in customer) || !customer.email) {
    logStep("ERROR: Invalid customer");
    return;
  }

  const email = customer.email;
  logStep("Found customer email", { email });

  // Get user by email
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, account_id")
    .eq("email", email)
    .single();

  if (!profile?.account_id) {
    logStep("ERROR: No profile or account found for email", { email });
    return;
  }

  const productId = subscription.items.data[0]?.price.product;
  const status = mapStripeStatus(subscription.status);

  // Update account status
  const { error: accountError } = await supabase
    .from("accounts")
    .update({ 
      subscription_status: status,
      updated_at: new Date().toISOString()
    })
    .eq("id", profile.account_id);

  if (accountError) {
    logStep("ERROR updating account", { error: accountError });
    throw accountError;
  }

  // Upsert subscription record
  const { error: subError } = await supabase
    .from("subscriptions")
    .upsert({
      user_id: profile.id,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: subscription.customer,
      plan_name: productId,
      billing_interval: subscription.items.data[0]?.price.recurring?.interval || "month",
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
      updated_at: new Date().toISOString()
    }, {
      onConflict: "stripe_subscription_id"
    });

  if (subError) {
    logStep("ERROR upserting subscription", { error: subError });
    throw subError;
  }

  logStep("Successfully updated account and subscription", { accountId: profile.account_id, status });
}

async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription,
  supabase: any,
  stripe: Stripe
) {
  logStep("Handling subscription deletion", { subscriptionId: subscription.id });

  const customer = await stripe.customers.retrieve(subscription.customer as string);
  if (customer.deleted || !("email" in customer) || !customer.email) return;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, account_id")
    .eq("email", customer.email)
    .single();

  if (!profile?.account_id) return;

  // Update account to inactive
  await supabase
    .from("accounts")
    .update({ 
      subscription_status: "canceled",
      updated_at: new Date().toISOString()
    })
    .eq("id", profile.account_id);

  // Update subscription record
  await supabase
    .from("subscriptions")
    .update({
      status: "canceled",
      updated_at: new Date().toISOString()
    })
    .eq("stripe_subscription_id", subscription.id);

  logStep("Successfully marked subscription as canceled");
}

async function handlePaymentSucceeded(
  invoice: Stripe.Invoice,
  supabase: any,
  stripe: Stripe
) {
  logStep("Handling payment success", { invoiceId: invoice.id });

  if (!invoice.customer) return;

  const customer = await stripe.customers.retrieve(invoice.customer as string);
  if (customer.deleted || !("email" in customer) || !customer.email) return;

  const { data: profile } = await supabase
    .from("profiles")
    .select("account_id")
    .eq("email", customer.email)
    .single();

  if (!profile?.account_id) return;

  // Ensure account is active
  await supabase
    .from("accounts")
    .update({ 
      subscription_status: "active",
      updated_at: new Date().toISOString()
    })
    .eq("id", profile.account_id);

  logStep("Account marked as active after payment");
}

async function handlePaymentFailed(
  invoice: Stripe.Invoice,
  supabase: any,
  stripe: Stripe
) {
  logStep("Handling payment failure", { invoiceId: invoice.id });

  if (!invoice.customer) return;

  const customer = await stripe.customers.retrieve(invoice.customer as string);
  if (customer.deleted || !("email" in customer) || !customer.email) return;

  const { data: profile } = await supabase
    .from("profiles")
    .select("account_id")
    .eq("email", customer.email)
    .single();

  if (!profile?.account_id) return;

  // Mark account as past_due
  await supabase
    .from("accounts")
    .update({ 
      subscription_status: "past_due",
      updated_at: new Date().toISOString()
    })
    .eq("id", profile.account_id);

  logStep("Account marked as past_due after payment failure");
}

function mapStripeStatus(stripeStatus: string): string {
  const statusMap: Record<string, string> = {
    active: "active",
    past_due: "past_due",
    canceled: "canceled",
    unpaid: "past_due",
    incomplete: "trial",
    incomplete_expired: "canceled",
    trialing: "trial"
  };
  return statusMap[stripeStatus] || "trial";
}
