import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useSubscriptionContext } from "@/contexts/SubscriptionContext";
import { Lock, ArrowRight, CreditCard, Check, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const SubscriptionRequired = () => {
  const navigate = useNavigate();
  const { subscribed, loading, refresh, openCustomerPortal } = useSubscriptionContext();
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('yearly');
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already subscribed
  if (!loading && subscribed) {
    navigate("/dashboard");
    return null;
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const handleManageSubscription = async () => {
    const { error } = await openCustomerPortal();
    if (error) {
      toast.error("Fehler beim Öffnen des Kundenportals");
    }
  };

  const handleCheckout = async (plan: 'starter' | 'pro' | 'scale') => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { plan, billingPeriod, origin: window.location.origin }
      });

      if (error) throw error;
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error('Checkout error:', err);
      toast.error('Fehler beim Checkout. Bitte versuche es erneut.');
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    "Pitchfirst Software – alle Features",
    "1x/Woche Live-Gruppen-Coaching mit Felix Zoepp",
    "Outreach-Videokurs inklusive",
    "Unbegrenzte KI-Landingpages",
    "Echtzeit-Tracking & Lead-Scoring"
  ];

  const plans = {
    starter: {
      monthly: { price: "149€", period: "/Monat" },
      yearly: { price: "1.490€", period: "/Jahr", savings: "2 Monate gratis" }
    },
    pro: {
      monthly: { price: "299€", period: "/Monat" },
      yearly: { price: "2.990€", period: "/Jahr", savings: "2 Monate gratis" }
    },
    scale: {
      monthly: { price: "399€", period: "/Monat" },
      yearly: { price: "3.990€", period: "/Jahr", savings: "2 Monate gratis" }
    }
  };

  const currentPlan = plans.starter[billingPeriod];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0e27] p-4">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/20 rounded-full blur-[120px]"></div>
      </div>
      
      <Card className="w-full max-w-lg relative z-10 bg-white/[0.02] border-white/10">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-2xl bg-primary/20 flex items-center justify-center">
            <Lock className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl text-white">Abo erforderlich</CardTitle>
          <CardDescription className="text-gray-400">
            Um Pitchfirst nutzen zu können, benötigst du ein aktives Abonnement.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            {features.map((feature, idx) => (
              <div key={idx} className="flex items-start gap-3 text-gray-300 text-sm">
                <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <span>{feature}</span>
              </div>
            ))}
          </div>

          {/* Billing Toggle */}
          <div className="flex justify-center">
            <div className="inline-flex rounded-xl bg-white/5 p-1 border border-white/10">
              <button
                onClick={() => setBillingPeriod('monthly')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  billingPeriod === 'monthly'
                    ? 'bg-white/10 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Monatlich
              </button>
              <button
                onClick={() => setBillingPeriod('yearly')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  billingPeriod === 'yearly'
                    ? 'bg-primary text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Jährlich
                <span className="ml-1 text-xs opacity-80">-17%</span>
              </button>
            </div>
          </div>

          {/* Price Display */}
          <div className="text-center p-6 rounded-xl border border-primary/30 bg-primary/5">
            <p className="text-sm text-gray-400 mb-2">Starter Plan</p>
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-4xl font-bold text-white">{currentPlan.price}</span>
              <span className="text-gray-400">{currentPlan.period}</span>
            </div>
            {billingPeriod === 'yearly' && (
              <>
                <p className="text-primary text-sm mt-2 font-medium">2 Monate gratis</p>
                <p className="text-gray-500 text-xs mt-1">≙ 124€/Monat</p>
              </>
            )}
          </div>

          <div className="space-y-3">
            <Button 
              size="lg"
              onClick={() => handleCheckout('starter')}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-primary to-blue-500 hover:opacity-90 text-white"
            >
              {isLoading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Lädt...</>
              ) : (
                <>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Starter wählen
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>

            <Button 
              variant="outline"
              onClick={() => navigate('/upgrade')}
              className="w-full border-white/20 bg-white/5 text-white hover:bg-white/10"
            >
              Alle Pakete vergleichen
            </Button>
            
            <Button 
              variant="ghost"
              onClick={refresh}
              className="w-full text-gray-400 hover:text-white hover:bg-white/5"
            >
              Status aktualisieren
            </Button>

            <Button 
              variant="ghost"
              onClick={handleManageSubscription}
              className="w-full text-gray-400 hover:text-white hover:bg-white/5"
            >
              Bestehendes Abo verwalten
            </Button>
          </div>

          <div className="pt-4 border-t border-white/10 text-center">
            <button
              onClick={handleLogout}
              className="text-sm text-gray-500 hover:text-white transition-colors"
            >
              Abmelden
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SubscriptionRequired;
