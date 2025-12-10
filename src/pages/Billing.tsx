import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Check, CreditCard } from "lucide-react";

const PLANS = {
  basic: {
    product_id: "prod_RdNTM2YT5z3lv6",
    price_id: "price_1QLsQhIhWxcRSQb4yZtc4D3H",
    name: "Hochpreis-Leads Basic",
    price: "€340/Jahr",
    features: [
      "Bis zu 3 Benutzer",
      "Basis CRM-Funktionen",
      "E-Mail Support",
      "5GB Speicher"
    ]
  },
  pro: {
    product_id: "prod_RdNTYNmG2Hn8Uk",
    price_id: "price_1QLsSjIhWxcRSQb4Sd1G56q0",
    name: "Hochpreis-Leads Pro",
    price: "€760/Jahr",
    features: [
      "Bis zu 10 Benutzer",
      "Erweiterte CRM-Funktionen",
      "Power Dialer",
      "Prioritäts-Support",
      "50GB Speicher",
      "Custom Reports"
    ]
  },
  enterprise: {
    product_id: "prod_RdNTeXrcfCeBIv",
    price_id: "price_1QLsUQIhWxcRSQb4Yr8mq04N",
    name: "Hochpreis-Leads Enterprise",
    price: "€1.430/Jahr",
    features: [
      "Unbegrenzte Benutzer",
      "Alle Pro-Features",
      "API-Zugang",
      "Dedizierter Support",
      "Unbegrenzter Speicher",
      "White-Label Option",
      "SLA Garantie"
    ]
  }
};

const Billing = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [subscription, setSubscription] = useState<{
    subscribed: boolean;
    product_id?: string;
    subscription_end?: string;
  } | null>(null);

  useEffect(() => {
    checkSubscription();
  }, []);

  const checkSubscription = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase.functions.invoke("check-subscription");
      
      if (error) throw error;
      setSubscription(data);
    } catch (error: any) {
      console.error("Subscription check error:", error);
      toast({
        title: "Fehler",
        description: "Abonnement-Status konnte nicht geladen werden",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async (priceId: string, planKey: string) => {
    setCheckoutLoading(planKey);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId }
      });

      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (error: any) {
      console.error("Checkout error:", error);
      toast({
        title: "Fehler",
        description: error.message || "Checkout konnte nicht gestartet werden",
        variant: "destructive"
      });
    } finally {
      setCheckoutLoading(null);
    }
  };

  const handleManageSubscription = async () => {
    setPortalLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (error: any) {
      console.error("Portal error:", error);
      toast({
        title: "Fehler",
        description: "Kundenportal konnte nicht geöffnet werden",
        variant: "destructive"
      });
    } finally {
      setPortalLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </Layout>
    );
  }

  const currentPlan = subscription?.product_id 
    ? Object.entries(PLANS).find(([_, plan]) => plan.product_id === subscription.product_id)?.[0]
    : null;

  return (
    <Layout>
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Abrechnung & Abonnements</h1>
          <p className="text-muted-foreground">
            Verwalten Sie Ihr Hochpreis-Leads Abonnement
          </p>
        </div>

        {subscription?.subscribed && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Aktuelles Abonnement</CardTitle>
              <CardDescription>
                Ihr aktueller Plan und Abrechnungsdetails
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-semibold">
                    {currentPlan ? PLANS[currentPlan as keyof typeof PLANS].name : "Aktiv"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Verlängert am: {subscription.subscription_end 
                      ? new Date(subscription.subscription_end).toLocaleDateString("de-DE")
                      : "N/A"}
                  </p>
                </div>
                <Button 
                  onClick={handleManageSubscription}
                  disabled={portalLoading}
                  variant="outline"
                >
                  {portalLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Lädt...
                    </>
                  ) : (
                    <>
                      <CreditCard className="mr-2 h-4 w-4" />
                      Abonnement verwalten
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid md:grid-cols-3 gap-6">
          {Object.entries(PLANS).map(([key, plan]) => {
            const isCurrentPlan = currentPlan === key;
            return (
              <Card 
                key={key}
                className={isCurrentPlan ? "border-primary shadow-lg" : ""}
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle>{plan.name}</CardTitle>
                    {isCurrentPlan && (
                      <Badge variant="default">Aktueller Plan</Badge>
                    )}
                  </div>
                  <CardDescription>
                    <span className="text-3xl font-bold text-foreground">
                      {plan.price}
                    </span>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start">
                        <Check className="h-5 w-5 text-primary mr-2 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="w-full"
                    onClick={() => handleCheckout(plan.price_id, key)}
                    disabled={isCurrentPlan || checkoutLoading === key}
                    variant={isCurrentPlan ? "outline" : "default"}
                  >
                    {checkoutLoading === key ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Lädt...
                      </>
                    ) : isCurrentPlan ? (
                      "Aktiv"
                    ) : (
                      "Jetzt buchen"
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </Layout>
  );
};

export default Billing;
