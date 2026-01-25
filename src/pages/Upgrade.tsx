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
  Loader2,
  Users,
  TrendingUp
} from "lucide-react";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface FeatureRow {
  name: string;
  description: string;
  starter: boolean | string;
  pro: boolean | string;
  scale: boolean | string;
  highlight?: 'pro' | 'scale';
}

const features: FeatureRow[] = [
  // Core Features - All Plans
  {
    name: "Kampagnen & CRM",
    description: "Erstelle und verwalte LinkedIn-Kampagnen mit integriertem CRM",
    starter: true,
    pro: true,
    scale: true,
  },
  {
    name: "Unbegrenzte KI-Landingpages",
    description: "Automatisch generierte, personalisierte Landingpages für jeden Lead",
    starter: true,
    pro: true,
    scale: true,
  },
  {
    name: "Echtzeit-Tracking & Lead-Scoring",
    description: "Verfolge Page Views, Video-Views und berechne Lead-Scores",
    starter: true,
    pro: true,
    scale: true,
  },
  {
    name: "Manuelles Telefonieren mit Notizen",
    description: "Rufe Leads an und dokumentiere deine Gespräche",
    starter: true,
    pro: true,
    scale: true,
  },
  {
    name: "1x/Woche Live-Gruppen-Coaching",
    description: "Wöchentliches Coaching mit Felix Zoepp",
    starter: true,
    pro: true,
    scale: true,
  },
  {
    name: "Outreach-Videokurs",
    description: "Kompletter Videokurs zum Thema LinkedIn Outreach",
    starter: true,
    pro: true,
    scale: true,
  },
  // Pro Features (Pro + Scale)
  {
    name: "KI-Telefonie (Power Dialer)",
    description: "Automatisches Wählen durch Lead-Listen direkt im Browser",
    starter: false,
    pro: true,
    scale: true,
    highlight: 'pro',
  },
  {
    name: "KI-Anrufzusammenfassungen",
    description: "Automatische Zusammenfassung nach jedem Call mit Aktionspunkten",
    starter: false,
    pro: true,
    scale: true,
    highlight: 'pro',
  },
  {
    name: "KI Live-Einwandbehandlung",
    description: "Echtzeit-Coaching während des Calls mit passenden Antworten",
    starter: false,
    pro: true,
    scale: true,
    highlight: 'pro',
  },
  {
    name: "E-Mail-Vorlagen & Mail-Outreach",
    description: "Erstelle E-Mail-Templates und versende automatisierte Follow-ups",
    starter: false,
    pro: true,
    scale: true,
    highlight: 'pro',
  },
  // Scale-Only Features
  {
    name: "Team-Management",
    description: "Mehrere Nutzer verwalten, Rollen zuweisen, Team koordinieren",
    starter: false,
    pro: false,
    scale: true,
    highlight: 'scale',
  },
  {
    name: "Erweiterte Team-Analytics",
    description: "Team-übergreifende KPIs, Reports und Performance-Tracking",
    starter: false,
    pro: false,
    scale: true,
    highlight: 'scale',
  },
  // Seats
  {
    name: "Nutzer-Seats",
    description: "Anzahl der inkludierten Benutzer-Accounts",
    starter: "1 Seat",
    pro: "1 Seat (+Add-on)",
    scale: "3 Seats inkl.",
  },
];

export default function Upgrade() {
  const navigate = useNavigate();
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('yearly');
  const [isUpgrading, setIsUpgrading] = useState(false);
  const { isScalePlan, isProPlan, isStarterPlan, subscribed, currentTier } = useFeatureAccess();

  const plans = {
    starter: {
      monthly: { price: "149€", period: "/Monat", savings: "", monthlyEquiv: "" },
      yearly: { price: "1.490€", period: "/Jahr", savings: "2 Monate gratis", monthlyEquiv: "≙ 124€/Monat" },
    },
    pro: {
      monthly: { price: "299€", period: "/Monat", savings: "", monthlyEquiv: "" },
      yearly: { price: "2.990€", period: "/Jahr", savings: "2 Monate gratis", monthlyEquiv: "≙ 249€/Monat" },
    },
    scale: {
      monthly: { price: "399€", period: "/Monat", savings: "", monthlyEquiv: "" },
      yearly: { price: "3.990€", period: "/Jahr", savings: "2 Monate gratis", monthlyEquiv: "≙ 333€/Monat" },
    },
  };

  const handleUpgrade = async (targetPlan: 'starter' | 'pro' | 'scale') => {
    setIsUpgrading(true);
    
    try {
      if (subscribed) {
        const { data, error } = await supabase.functions.invoke('upgrade-subscription', {
          body: { targetPlan, billingPeriod }
        });

        if (error) throw error;

        if (data.type === 'checkout') {
          window.location.href = data.url;
        } else if (data.type === 'upgraded') {
          toast.success(
            `Upgrade erfolgreich! Du wurdest anteilig mit ${data.totalCharged.toFixed(2)}€ belastet.`,
            { duration: 5000 }
          );
          window.location.reload();
        } else if (data.error) {
          toast.error(data.error);
        }
      } else {
        const { data, error } = await supabase.functions.invoke('create-checkout', {
          body: { plan: targetPlan, billingPeriod, origin: window.location.origin }
        });

        if (error) throw error;

        if (data.url) {
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

  const isCurrentPlan = (plan: string) => currentTier === plan;

  const currentStarterPlan = plans.starter[billingPeriod];
  const currentProPlan = plans.pro[billingPeriod];
  const currentScalePlan = plans.scale[billingPeriod];

  return (
    <Layout>
      <div className="container mx-auto py-8 px-4 max-w-7xl">
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
              Preise & Pakete
            </Badge>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              Wähle das passende Paket für dich
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Alle Pakete mit wöchentlichem Live-Coaching. 12 Monate Laufzeit – monatlich oder jährlich zahlen.
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
              Monatlich zahlen
            </button>
            <button
              onClick={() => setBillingPeriod('yearly')}
              className={`px-4 md:px-6 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                billingPeriod === 'yearly' 
                  ? 'bg-background text-foreground shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Jährlich zahlen
              <span className="bg-green-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                -17%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {/* Starter Plan */}
          <Card className={`relative ${isCurrentPlan('starter') ? 'border-primary ring-2 ring-primary/20' : ''}`}>
            {isCurrentPlan('starter') && (
              <div className="absolute -top-3 left-4">
                <Badge className="bg-primary text-primary-foreground">Dein Plan</Badge>
              </div>
            )}
            <CardHeader>
              <CardTitle className="text-2xl">Starter</CardTitle>
              <CardDescription>Perfekt für den Einstieg</CardDescription>
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
                {currentStarterPlan.monthlyEquiv && (
                  <p className="text-muted-foreground text-xs mt-1">{currentStarterPlan.monthlyEquiv}</p>
                )}
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground border-b pb-4">
                <Users className="h-4 w-4" />
                <span>1 Nutzer-Seat</span>
              </div>

              <div className="space-y-3">
                {features.filter(f => f.starter === true).slice(0, 6).map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{feature.name}</span>
                  </div>
                ))}
              </div>

              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => handleUpgrade('starter')}
                disabled={isCurrentPlan('starter') || isUpgrading}
              >
                {isUpgrading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Lädt...</>
                ) : isCurrentPlan('starter') ? (
                  "Aktueller Plan"
                ) : (
                  "Starter wählen"
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Pro Plan */}
          <Card className={`relative border-primary bg-gradient-to-b from-primary/5 to-transparent ${isCurrentPlan('pro') ? 'ring-2 ring-primary/20' : ''}`}>
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <Badge className="bg-primary text-primary-foreground">
                <Crown className="mr-1 h-3 w-3" />
                {isCurrentPlan('pro') ? "Dein Plan" : "Beliebt"}
              </Badge>
            </div>
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                Pro
                <Sparkles className="h-5 w-5 text-primary" />
              </CardTitle>
              <CardDescription>Alle KI-Features inklusive</CardDescription>
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
                {currentProPlan.monthlyEquiv && (
                  <p className="text-muted-foreground text-xs mt-1">{currentProPlan.monthlyEquiv}</p>
                )}
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground border-b pb-4">
                <Users className="h-4 w-4" />
                <span>1 Seat (+1 Add-on für 49€)</span>
              </div>

              {/* Pro Feature Highlights */}
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2 bg-primary/10 rounded-lg px-3 py-2">
                  <Phone className="h-4 w-4 text-primary" />
                  <span className="text-xs font-medium">Power Dialer</span>
                </div>
                <div className="flex items-center gap-2 bg-primary/10 rounded-lg px-3 py-2">
                  <Brain className="h-4 w-4 text-primary" />
                  <span className="text-xs font-medium">KI-Einwände</span>
                </div>
                <div className="flex items-center gap-2 bg-primary/10 rounded-lg px-3 py-2">
                  <Mic className="h-4 w-4 text-primary" />
                  <span className="text-xs font-medium">Call Summary</span>
                </div>
                <div className="flex items-center gap-2 bg-primary/10 rounded-lg px-3 py-2">
                  <Mail className="h-4 w-4 text-primary" />
                  <span className="text-xs font-medium">E-Mail Outreach</span>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium text-muted-foreground">Alles aus Starter, plus:</p>
                {features.filter(f => f.highlight === 'pro').map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <Sparkles className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm font-medium">{feature.name}</span>
                  </div>
                ))}
              </div>

              <Button 
                className="w-full bg-primary hover:bg-primary/90"
                onClick={() => handleUpgrade('pro')}
                disabled={isCurrentPlan('pro') || isUpgrading}
              >
                {isUpgrading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Lädt...</>
                ) : isCurrentPlan('pro') ? (
                  "Aktueller Plan"
                ) : (
                  <>
                    Pro wählen
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Scale Plan */}
          <Card className={`relative bg-gradient-to-b from-amber-500/10 to-transparent ${isCurrentPlan('scale') ? 'border-amber-500 ring-2 ring-amber-500/20' : 'border-amber-500/50'}`}>
            {isCurrentPlan('scale') && (
              <div className="absolute -top-3 left-4">
                <Badge className="bg-amber-500 text-white">Dein Plan</Badge>
              </div>
            )}
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                Scale
                <TrendingUp className="h-5 w-5 text-amber-500" />
              </CardTitle>
              <CardDescription>Für Teams mit Wachstumsfokus</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">{currentScalePlan.price}</span>
                  <span className="text-muted-foreground">{currentScalePlan.period}</span>
                </div>
                {currentScalePlan.savings && (
                  <p className="text-green-600 text-sm mt-1 font-medium">{currentScalePlan.savings}</p>
                )}
                {currentScalePlan.monthlyEquiv && (
                  <p className="text-muted-foreground text-xs mt-1">{currentScalePlan.monthlyEquiv}</p>
                )}
              </div>

              <div className="flex items-center gap-2 text-sm font-medium text-amber-600 border-b pb-4">
                <Users className="h-4 w-4" />
                <span>3 Nutzer-Seats inklusive</span>
              </div>

              {/* Scale Feature Highlights */}
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2 bg-amber-500/10 rounded-lg px-3 py-2">
                  <Users className="h-4 w-4 text-amber-600" />
                  <span className="text-xs font-medium">Team-Mgmt</span>
                </div>
                <div className="flex items-center gap-2 bg-amber-500/10 rounded-lg px-3 py-2">
                  <BarChart3 className="h-4 w-4 text-amber-600" />
                  <span className="text-xs font-medium">Team-Analytics</span>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium text-muted-foreground">Alles aus Pro, plus:</p>
                {features.filter(f => f.highlight === 'scale').map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <TrendingUp className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm font-medium">{feature.name}</span>
                  </div>
                ))}
              </div>

              <Button 
                className="w-full bg-amber-500 hover:bg-amber-600 text-white"
                onClick={() => handleUpgrade('scale')}
                disabled={isCurrentPlan('scale') || isUpgrading}
              >
                {isUpgrading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Lädt...</>
                ) : isCurrentPlan('scale') ? (
                  "Aktueller Plan"
                ) : (
                  <>
                    Scale wählen
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
                    <th className="text-center py-4 px-4 font-medium w-28">Starter</th>
                    <th className="text-center py-4 px-4 font-medium w-28 bg-primary/5">Pro</th>
                    <th className="text-center py-4 px-4 font-medium w-28 bg-amber-500/5">Scale</th>
                  </tr>
                </thead>
                <tbody>
                  {features.map((feature, idx) => (
                    <tr key={idx} className={`border-b last:border-0 ${
                      feature.highlight === 'scale' ? 'bg-amber-500/5' : 
                      feature.highlight === 'pro' ? 'bg-primary/5' : ''
                    }`}>
                      <td className="py-4 px-4">
                        <div>
                          <p className={`font-medium ${
                            feature.highlight === 'scale' ? 'text-amber-600' : 
                            feature.highlight === 'pro' ? 'text-primary' : ''
                          }`}>
                            {feature.highlight === 'scale' && <TrendingUp className="inline h-4 w-4 mr-1" />}
                            {feature.highlight === 'pro' && <Sparkles className="inline h-4 w-4 mr-1" />}
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
                          <span className="text-sm font-medium">{feature.starter}</span>
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
                          <span className="text-sm font-medium">{feature.pro}</span>
                        )}
                      </td>
                      <td className="text-center py-4 px-4 bg-amber-500/5">
                        {typeof feature.scale === 'boolean' ? (
                          feature.scale ? (
                            <Check className="h-5 w-5 text-green-500 mx-auto" />
                          ) : (
                            <X className="h-5 w-5 text-muted-foreground mx-auto" />
                          )
                        ) : (
                          <span className="text-sm font-medium">{feature.scale}</span>
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
        {!isScalePlan && (
          <div className="mt-12 text-center">
            <Card className="border-primary bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 p-8">
              <div className="max-w-2xl mx-auto">
                <Zap className="h-12 w-12 text-primary mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">Noch Fragen?</h2>
                <p className="text-muted-foreground mb-6">
                  Kontaktiere uns jederzeit – wir beraten dich gerne zum passenden Paket.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  {!isProPlan && !isScalePlan && (
                    <Button 
                      size="lg"
                      onClick={() => handleUpgrade('pro')}
                      className="bg-primary hover:bg-primary/90"
                      disabled={isUpgrading}
                    >
                      <Crown className="mr-2 h-5 w-5" />
                      Pro wählen
                    </Button>
                  )}
                  {!isScalePlan && (
                    <Button 
                      size="lg"
                      variant={isProPlan ? "default" : "outline"}
                      onClick={() => handleUpgrade('scale')}
                      className={isProPlan ? "bg-amber-500 hover:bg-amber-600 text-white" : ""}
                      disabled={isUpgrading}
                    >
                      <TrendingUp className="mr-2 h-5 w-5" />
                      Scale wählen
                    </Button>
                  )}
                </div>
                {subscribed && (
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
