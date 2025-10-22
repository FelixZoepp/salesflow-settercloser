import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Phone, Users, TrendingUp, Target, Clock, BarChart3 } from "lucide-react";

const Landing = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Phone,
      title: "Power Dialer",
      description: "Effizientes Cold Calling mit automatischer Anwahlhilfe"
    },
    {
      icon: Users,
      title: "Kontaktmanagement",
      description: "Zentrale Verwaltung aller Kontakte und Kundeninformationen"
    },
    {
      icon: Target,
      title: "Pipeline Management",
      description: "Visualisierung und Steuerung Ihrer Sales-Pipeline"
    },
    {
      icon: Clock,
      title: "Aufgabenverwaltung",
      description: "Nie wieder wichtige Follow-ups verpassen"
    },
    {
      icon: BarChart3,
      title: "KPI Dashboard",
      description: "Echtzeitanalyse Ihrer Vertriebsperformance"
    },
    {
      icon: TrendingUp,
      title: "Aktivitätsprotokoll",
      description: "Lückenlose Dokumentation aller Kundeninteraktionen"
    }
  ];

  const plans = [
    {
      name: "Basic",
      price: "340",
      features: [
        "Bis zu 3 Benutzer",
        "Basis CRM-Funktionen",
        "E-Mail Support",
        "5GB Speicher"
      ]
    },
    {
      name: "Pro",
      price: "760",
      popular: true,
      features: [
        "Bis zu 10 Benutzer",
        "Erweiterte CRM-Funktionen",
        "Power Dialer",
        "Prioritäts-Support",
        "50GB Speicher",
        "Custom Reports"
      ]
    },
    {
      name: "Enterprise",
      price: "1.430",
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
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold text-primary">SalesFlow</div>
            <div className="flex gap-4">
              <Button variant="ghost" onClick={() => navigate("/auth")}>
                Anmelden
              </Button>
              <Button onClick={() => navigate("/auth")}>
                Kostenlos starten
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto text-center max-w-4xl">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Ihr Vertriebsteam verdient bessere Tools
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            SalesFlow vereint CRM, Power Dialer und Pipeline-Management in einer intuitiven Plattform. 
            Steigern Sie Ihre Conversion-Rate und schließen Sie mehr Deals.
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" onClick={() => navigate("/auth")}>
              Jetzt kostenlos testen
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/auth")}>
              Demo ansehen
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Alles was Sie für erfolgreichen Vertrieb brauchen
            </h2>
            <p className="text-muted-foreground text-lg">
              Leistungsstarke Features, die Ihr Team produktiver machen
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {features.map((feature, idx) => (
              <Card key={idx}>
                <CardHeader>
                  <feature.icon className="h-10 w-10 text-primary mb-2" />
                  <CardTitle>{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Transparent und fair
            </h2>
            <p className="text-muted-foreground text-lg">
              Wählen Sie den Plan, der zu Ihrem Team passt
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {plans.map((plan, idx) => (
              <Card 
                key={idx}
                className={plan.popular ? "border-primary shadow-lg relative" : ""}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium">
                      Beliebt
                    </span>
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription>
                    <span className="text-4xl font-bold text-foreground">
                      €{plan.price}
                    </span>
                    <span className="text-muted-foreground">/Jahr</span>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, fidx) => (
                      <li key={fidx} className="flex items-start">
                        <Check className="h-5 w-5 text-primary mr-2 flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className="w-full"
                    variant={plan.popular ? "default" : "outline"}
                    onClick={() => navigate("/auth")}
                  >
                    Jetzt starten
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-primary text-primary-foreground">
        <div className="container mx-auto text-center max-w-3xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Bereit, Ihren Vertrieb zu revolutionieren?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Starten Sie noch heute und überzeugen Sie sich selbst. Keine Kreditkarte erforderlich.
          </p>
          <Button 
            size="lg" 
            variant="secondary"
            onClick={() => navigate("/auth")}
          >
            Kostenlos testen
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 px-6">
        <div className="container mx-auto text-center text-muted-foreground">
          <p>© 2025 SalesFlow. Alle Rechte vorbehalten.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
