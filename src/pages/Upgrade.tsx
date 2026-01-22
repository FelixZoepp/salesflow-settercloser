import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Check, 
  X, 
  Sparkles, 
  ArrowRight, 
  Phone, 
  Mail, 
  Brain, 
  FileText,
  Mic,
  BarChart3,
  Zap,
  Crown,
  ArrowLeft,
  Loader2
} from "lucide-react";
import { useFeatureAccess, SUBSCRIPTION_TIERS } from "@/hooks/useFeatureAccess";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface FeatureRow {
  name: string;
  description: string;
  starter: boolean | string;
  pro: boolean | string;
  highlight?: boolean;
}

const features: FeatureRow[] = [
  // Core Features - Both Plans
  {
    name: "Kampagnen & CRM",
    description: "Erstelle und verwalte LinkedIn-Kampagnen mit integriertem CRM",
    starter: true,
    pro: true,
  },
  {
    name: "Unbegrenzte KI-Landingpages",
    description: "Automatisch generierte, personalisierte Landingpages für jeden Lead",
    starter: true,
    pro: true,
  },
  {
    name: "Echtzeit-Tracking & Lead-Scoring",
    description: "Verfolge Page Views, Video-Views und berechne Lead-Scores",
    starter: true,
    pro: true,
  },
  {
    name: "Manuelles Telefonieren mit Notizen",
    description: "Rufe Leads an und dokumentiere deine Gespräche",
    starter: true,
    pro: true,
  },
  {
    name: "1x/Woche Live-Gruppen-Coaching",
    description: "Wöchentliches Coaching mit Felix Zoepp",
    starter: true,
    pro: true,
  },
  {
    name: "Outreach-Videokurs",
    description: "Kompletter Videokurs zum Thema LinkedIn Outreach",
    starter: true,
    pro: true,
  },
  // Pro-Only Features
  {
    name: "KI-Telefonie aus dem Tool",
    description: "Power Dialer mit automatischem Lead-Wechsel direkt im Browser",
    starter: false,
    pro: true,
    highlight: true,
  },
  {
    name: "KI-Anrufzusammenfassungen",
    description: "Automatische Zusammenfassung nach jedem Call mit Aktionspunkten",
    starter: false,
    pro: true,
    highlight: true,
  },
  {
    name: "KI Live-Einwandbehandlung",
    description: "Echtzeit-Coaching während des Calls mit passenden Antworten",
    starter: false,
    pro: true,
    highlight: true,
  },
  {
    name: "E-Mail-Vorlagen & Mail-Outreach",
    description: "Erstelle E-Mail-Templates und versende automatisierte Follow-ups",
    starter: false,
    pro: true,
    highlight: true,
  },
];

const proFeatureIcons = [
  { icon: Phone, label: "Power Dialer" },
  { icon: Mic, label: "Call Summaries" },
  { icon: Brain, label: "KI-Einwandbehandlung" },
  { icon: Mail, label: "E-Mail Outreach" },
];

export default function Upgrade() {
  const navigate = useNavigate();
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('yearly');
  const [isUpgrading, setIsUpgrading] = useState(false);
  const { isProPlan, isStarterPlan, subscribed } = useFeatureAccess();

  const plans = {
    starter: {
      monthly: { price: "149€", period: "/Monat", savings: "" },
      yearly: { price: "1.490€", period: "/Jahr", savings: "2 Monate gratis" },
    },
    pro: {
      monthly: { price: "299€", period: "/Monat", savings: "" },
      yearly: { price: "2.990€", period: "/Jahr", savings: "2 Monate gratis" },
    },
  };

  const handleUpgrade = async (targetPlan: 'starter' | 'pro') => {
    setIsUpgrading(true);
    
    try {
      // If user already has an active subscription, use proration upgrade
      if (subscribed) {
        const { data, error } = await supabase.functions.invoke('upgrade-subscription', {
          body: { 
            targetPlan, 
            billingPeriod 
          }
        });

        if (error) throw error;

        if (data.type === 'checkout') {
          // Redirect to Stripe Checkout for new subscription
          window.location.href = data.url;
        } else if (data.type === 'upgraded') {
          // Direct upgrade with proration
          toast.success(
            `Upgrade erfolgreich! Du wurdest anteilig mit ${data.totalCharged.toFixed(2)}€ belastet.`,
            { duration: 5000 }
          );
          // Refresh page to update subscription status
          window.location.reload();
        } else if (data.error) {
          toast.error(data.error);
        }
      } else {
        // No subscription yet - create checkout session
        const { data, error } = await supabase.functions.invoke('create-checkout', {
          body: { 
            plan: targetPlan, 
            billingPeriod,
            origin: window.location.origin
          }
        });

        if (error) throw error;

        if (data.url) {
          // Redirect to Stripe Checkout (same tab for better UX)
          window.location.href = data.url;
        } else {
          throw new Error("No checkout URL received");
        }
      }
    } catch (err) {
      console.error('Checkout error:', err);
      toast.error('Fehler beim Checkout. Bitte versuche es erneut.');
    } finally {
      setIsUpgrading(false);
    }
  };

  const currentStarterPlan = plans.starter[billingPeriod];
  const currentProPlan = plans.pro[billingPeriod];

  return (
    <Layout>
      <div className="container mx-auto py-8 px-4 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Zurück
          </Button>
          <div className="text-center">
            <Badge className="mb-4 bg-primary/10 text-primary hover:bg-primary/20">
              <Sparkles className="mr-1 h-3 w-3" />
              Upgrade auf Pro
            </Badge>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              Wähle das passende Paket für dich
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Beide Pakete beinhalten wöchentliches Live-Coaching. 
              Das Pro-Paket schaltet alle KI-Features frei.
            </p>
          </div>
        </div>

        {/* Billing Toggle */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex items-center gap-2 bg-muted/50 border rounded-full p-1">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-4 md:px-6 py-2 rounded-full text-sm font-medium transition-all ${
                billingPeriod === 'monthly' 
                  ? 'bg-background text-foreground shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Monatlich
            </button>
            <button
              onClick={() => setBillingPeriod('yearly')}
              className={`px-4 md:px-6 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                billingPeriod === 'yearly' 
                  ? 'bg-background text-foreground shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Jährlich
              <span className="bg-green-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                -17%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {/* Starter Plan */}
          <Card className={`relative ${isStarterPlan ? 'border-primary ring-2 ring-primary/20' : ''}`}>
            {isStarterPlan && (
              <div className="absolute -top-3 left-4">
                <Badge className="bg-primary text-primary-foreground">Dein aktueller Plan</Badge>
              </div>
            )}
            <CardHeader>
              <CardTitle className="text-2xl">Starter</CardTitle>
              <CardDescription>Perfekt für den Einstieg in LinkedIn Outreach</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">{currentStarterPlan.price}</span>
                  <span className="text-muted-foreground">{currentStarterPlan.period}</span>
                </div>
                {currentStarterPlan.savings && (
                  <p className="text-green-600 text-sm mt-1 font-medium">{currentStarterPlan.savings}</p>
                )}
              </div>

              <div className="space-y-3">
                {features.filter(f => f.starter).map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{feature.name}</span>
                  </div>
                ))}
                {features.filter(f => !f.starter).map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-3 text-muted-foreground">
                    <X className="h-5 w-5 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{feature.name}</span>
                  </div>
                ))}
              </div>

              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => handleUpgrade('starter')}
                disabled={isStarterPlan || isUpgrading}
              >
                {isUpgrading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Wird verarbeitet...</>
                ) : isStarterPlan ? (
                  "Aktueller Plan"
                ) : (
                  "Starter wählen"
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Pro Plan */}
          <Card className={`relative border-primary bg-gradient-to-b from-primary/5 to-transparent ${isProPlan ? 'ring-2 ring-primary/20' : ''}`}>
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <Badge className="bg-primary text-primary-foreground">
                <Crown className="mr-1 h-3 w-3" />
                {isProPlan ? "Dein aktueller Plan" : "Empfohlen"}
              </Badge>
            </div>
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                Pro
                <Sparkles className="h-5 w-5 text-primary" />
              </CardTitle>
              <CardDescription>Alle KI-Features für maximale Effizienz</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">{currentProPlan.price}</span>
                  <span className="text-muted-foreground">{currentProPlan.period}</span>
                </div>
                {currentProPlan.savings && (
                  <p className="text-green-600 text-sm mt-1 font-medium">{currentProPlan.savings}</p>
                )}
              </div>

              {/* Pro Feature Highlights */}
              <div className="grid grid-cols-2 gap-2">
                {proFeatureIcons.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-primary/10 rounded-lg px-3 py-2">
                    <item.icon className="h-4 w-4 text-primary" />
                    <span className="text-xs font-medium">{item.label}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                {features.map((feature, idx) => (
                  <div key={idx} className={`flex items-start gap-3 ${feature.highlight ? 'text-foreground' : ''}`}>
                    {feature.highlight ? (
                      <Sparkles className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    ) : (
                      <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    )}
                    <span className={`text-sm ${feature.highlight ? 'font-medium' : ''}`}>{feature.name}</span>
                  </div>
                ))}
              </div>

              <Button 
                className="w-full bg-primary hover:bg-primary/90"
                onClick={() => handleUpgrade('pro')}
                disabled={isProPlan || isUpgrading}
              >
                {isUpgrading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Wird verarbeitet...</>
                ) : isProPlan ? (
                  "Aktueller Plan"
                ) : (
                  <>
                    Auf Pro upgraden
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Feature Comparison Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Detaillierter Feature-Vergleich
            </CardTitle>
            <CardDescription>
              Alle Features im Überblick
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-4 px-4 font-medium">Feature</th>
                    <th className="text-center py-4 px-4 font-medium w-32">Starter</th>
                    <th className="text-center py-4 px-4 font-medium w-32 bg-primary/5">Pro</th>
                  </tr>
                </thead>
                <tbody>
                  {features.map((feature, idx) => (
                    <tr key={idx} className={`border-b last:border-0 ${feature.highlight ? 'bg-primary/5' : ''}`}>
                      <td className="py-4 px-4">
                        <div>
                          <p className={`font-medium ${feature.highlight ? 'text-primary' : ''}`}>
                            {feature.highlight && <Sparkles className="inline h-4 w-4 mr-1" />}
                            {feature.name}
                          </p>
                          <p className="text-sm text-muted-foreground">{feature.description}</p>
                        </div>
                      </td>
                      <td className="text-center py-4 px-4">
                        {typeof feature.starter === 'boolean' ? (
                          feature.starter ? (
                            <Check className="h-5 w-5 text-green-500 mx-auto" />
                          ) : (
                            <X className="h-5 w-5 text-muted-foreground mx-auto" />
                          )
                        ) : (
                          <span className="text-sm">{feature.starter}</span>
                        )}
                      </td>
                      <td className="text-center py-4 px-4 bg-primary/5">
                        {typeof feature.pro === 'boolean' ? (
                          feature.pro ? (
                            <Check className="h-5 w-5 text-green-500 mx-auto" />
                          ) : (
                            <X className="h-5 w-5 text-muted-foreground mx-auto" />
                          )
                        ) : (
                          <span className="text-sm">{feature.pro}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* CTA Section */}
        {!isProPlan && (
          <div className="mt-12 text-center">
            <Card className="border-primary bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 p-8">
              <div className="max-w-2xl mx-auto">
                <Zap className="h-12 w-12 text-primary mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">Bereit für das volle Potenzial?</h2>
                <p className="text-muted-foreground mb-6">
                  Upgrade jetzt auf Pro und nutze alle KI-Features für maximale Effizienz bei deinem LinkedIn Outreach.
                </p>
                <Button 
                  size="lg"
                  onClick={() => handleUpgrade('pro')}
                  className="bg-primary hover:bg-primary/90"
                  disabled={isUpgrading}
                >
                  {isUpgrading ? (
                    <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Wird verarbeitet...</>
                  ) : (
                    <>
                      <Crown className="mr-2 h-5 w-5" />
                      Jetzt auf Pro upgraden
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
                {isStarterPlan && (
                  <p className="text-sm text-muted-foreground mt-3">
                    💡 Du zahlst nur die Differenz für deine Restlaufzeit (anteilige Berechnung)
                  </p>
                )}
              </div>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
}
