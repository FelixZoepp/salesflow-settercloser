import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Check, Phone, Users, TrendingUp, Target, Zap, BarChart3, MessageSquare, Linkedin, Mail, Brain, Shield, Clock } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import SkyBackground from "@/components/ui/SkyBackground";

const Landing = () => {
  const navigate = useNavigate();
  const observerRef = useRef<IntersectionObserver | null>(null);
  const [isYearly, setIsYearly] = useState(true);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animate-fade-in");
          }
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll(".fade-on-scroll").forEach((el) => {
      observerRef.current?.observe(el);
    });

    return () => observerRef.current?.disconnect();
  }, []);

  const challenges = [
    { icon: Target, title: "Gute Leads, aber keine Meetings" },
    { icon: Phone, title: "Calls enden ohne Deal" },
    { icon: BarChart3, title: "Zu viele Tools, kein Überblick" },
  ];

  const features = [
    {
      icon: BarChart3,
      title: "Klare Kennzahlen",
      description: "Conversion-Rate, Anrufquote, Pipeline-Wert – alles auf einen Blick"
    },
    {
      icon: Target,
      title: "Einfache Pipelines",
      description: "Übersichtliche Deal-Phasen von Erstkontakt bis Abschluss – keine Komplexität"
    },
    {
      icon: MessageSquare,
      title: "Multi-Channel Outreach",
      description: "Email, LinkedIn, Telefon – koordiniert aus einer Platform"
    },
    {
      icon: Brain,
      title: "Live-Coach im Call",
      description: "Einwand erkannt – passende Antwort vorgeschlagen, in Echtzeit"
    },
    {
      icon: Zap,
      title: "Automatische Dokumentation",
      description: "Notizen & Deal-Updates automatisch – Sie konzentrieren sich aufs Verkaufen"
    },
    {
      icon: Users,
      title: "Perfekt für Dienstleister",
      description: "Entwickelt für Agenturen, Coaches, Berater – nicht für komplexe Enterprise-Sales"
    }
  ];

  const steps = [
    {
      number: "01",
      title: "Lead importieren & sequenzieren",
      description: "Importieren Sie Ihre Kontakte und starten Sie automatisierte Outreach-Kampagnen über mehrere Kanäle.",
      icon: Users
    },
    {
      number: "02",
      title: "Gespräche führen mit Live-Coach",
      description: "Unser KI-Coach analysiert das Gespräch in Echtzeit und gibt Ihnen passende Antworten auf Einwände.",
      icon: Brain
    },
    {
      number: "03",
      title: "Deals gewinnen & CRM synchronisieren",
      description: "Automatische Dokumentation und Deal-Erstellung. Alle Daten landen direkt in Ihrem CRM.",
      icon: TrendingUp
    }
  ];

  const testimonials = [
    {
      name: "Michael Schmidt",
      role: "Sales Director, TechCorp GmbH",
      image: "/placeholder.svg",
      quote: "Unsere Meeting-Rate stieg um 340% innerhalb von 8 Wochen. Der Live-Coach ist ein Game-Changer."
    },
    {
      name: "Sarah Weber",
      role: "Gründerin, Growth Agency",
      image: "/placeholder.svg",
      quote: "Endlich ein Tool, das alle Outbound-Kanäle vereint. Wir sparen 15 Stunden pro Woche."
    },
    {
      name: "Thomas Müller",
      role: "Head of Sales, Digital Solutions",
      image: "/placeholder.svg",
      quote: "Die Conversion-Rate hat sich verdoppelt. Das Dashboard gibt uns volle Transparenz."
    }
  ];

  const faqs = [
    {
      question: "Welche Kanäle unterstützt das Tool?",
      answer: "SalesFlow unterstützt Email, LinkedIn und Telefon – alles aus einer zentralen Platform. Sie können Multi-Channel-Sequenzen erstellen und automatisieren."
    },
    {
      question: "Brauche ich spezielle Hardware?",
      answer: "Nein, SalesFlow läuft komplett in der Cloud. Sie benötigen nur einen Browser und optional ein Headset für Telefonate."
    },
    {
      question: "Wie sicher sind meine Daten?",
      answer: "Wir sind DSGVO-konform und hosten alle Daten in Deutschland. Ihre Kundendaten werden verschlüsselt und nach höchsten Sicherheitsstandards behandelt."
    },
    {
      question: "Kann ich das Tool mit meinem CRM verbinden?",
      answer: "Ja, SalesFlow lässt sich mit allen gängigen CRM-Systemen integrieren (Salesforce, HubSpot, Pipedrive, etc.)."
    },
    {
      question: "Gibt es eine Testphase?",
      answer: "Ja, Sie können SalesFlow 14 Tage kostenlos testen – ohne Kreditkarte und ohne Verpflichtungen."
    }
  ];

  const plans = [
    {
      name: "Starter",
      priceMonthly: "29",
      priceYearly: "340",
      description: "Perfekt für Solo-Dienstleister",
      features: [
        "1 Benutzer",
        "500 Kontakte",
        "Einfache Pipeline",
        "Basis-Kennzahlen",
        "E-Mail Support"
      ]
    },
    {
      name: "Professional",
      priceMonthly: "79",
      priceYearly: "760",
      popular: true,
      description: "Für Agenturen & Berater",
      features: [
        "Bis zu 5 Benutzer",
        "5.000 Kontakte",
        "Alle Outreach-Kanäle",
        "Live-Coach & KI-Assistent",
        "Power Dialer",
        "Erweiterte Kennzahlen",
        "Prioritäts-Support"
      ]
    },
    {
      name: "Enterprise",
      priceMonthly: "149",
      priceYearly: "1.430",
      description: "Für große Teams",
      features: [
        "Unbegrenzte Benutzer",
        "Unbegrenzte Kontakte",
        "Alle Professional-Features",
        "API-Zugang",
        "Dedizierter Account Manager",
        "White-Label Option",
        "SLA Garantie"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-[#0a0e27] relative">
      {/* Blurred Ellipse Background for rest of page */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/20 rounded-full blur-[120px]"></div>
      </div>
      
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-background/10 backdrop-blur-lg border-b border-white/10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              SalesFlow
            </div>
            <div className="hidden md:flex gap-8 text-sm text-white/80">
              <a href="#features" className="hover:text-white transition-colors">Features</a>
              <a href="#how-it-works" className="hover:text-white transition-colors">So funktioniert's</a>
              <a href="#pricing" className="hover:text-white transition-colors">Preise</a>
              <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
            </div>
            <div className="flex gap-4">
              <Button variant="ghost" onClick={() => navigate("/auth")} className="text-white hover:bg-white/10">
                Anmelden
              </Button>
              <Button onClick={() => navigate("/auth")} className="bg-white text-primary hover:bg-white/90">
                Demo buchen
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - Dark with Stars */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        {/* Sky Background only in Hero */}
        <div className="absolute inset-0 overflow-hidden">
          <SkyBackground starCount={250} shootingEveryMs={[3000, 8000]} enableParallax={true} />
        </div>
        <div className="container mx-auto text-center max-w-5xl relative z-[1]">
          <div className="inline-block mb-6 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium">
            <Zap className="inline h-4 w-4 mr-2" />
            Der KI-Co-Pilot für Outbound-Akquise
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 text-white leading-tight">
            Mehr Anrufe. <br />
            <span className="bg-gradient-to-r from-primary via-blue-400 to-purple-400 bg-clip-text text-transparent">
              Mehr Gespräche.
            </span><br />
            Mehr Abschlüsse.
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto">
            Das Outbound-CRM für Agenturen, Coaches, Berater & Dienstleister. 
            Simpel. Übersichtlich. Fokussiert auf Akquise-Erfolg.
          </p>
          
          <div className="flex gap-4 justify-center flex-wrap">
            <Button 
              size="lg" 
              onClick={() => navigate("/auth")}
              className="bg-gradient-to-r from-primary to-blue-500 hover:opacity-90 text-white shadow-2xl shadow-primary/50 px-8 h-14 text-lg"
            >
              14 Tage kostenlos testen
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="border-white/20 bg-white text-black hover:bg-white/90 px-8 h-14 text-lg"
            >
              Video ansehen
            </Button>
          </div>

          <div className="mt-16 grid grid-cols-3 gap-8 max-w-2xl mx-auto text-white">
            <div>
              <div className="text-4xl font-bold text-primary mb-2">340%</div>
              <div className="text-sm text-gray-400">Mehr Meetings</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">15h</div>
              <div className="text-sm text-gray-400">Zeitersparnis/Woche</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">2x</div>
              <div className="text-sm text-gray-400">Conversion-Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* Challenge Section */}
      <section className="py-20 px-6 relative z-[1]">
        <div className="container mx-auto max-w-6xl fade-on-scroll">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
              Kennen Sie diese Herausforderungen?
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {challenges.map((challenge, idx) => (
              <Card key={idx} className="border-2 hover:border-primary/50 transition-all hover:shadow-lg">
                <CardHeader className="text-center">
                  <div className="mx-auto mb-4 h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <challenge.icon className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{challenge.title}</CardTitle>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6 relative z-[1]">
        <div className="container mx-auto max-w-6xl fade-on-scroll">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4 text-white">
              Das <span className="bg-gradient-to-r from-primary via-blue-400 to-purple-400 bg-clip-text text-transparent">einfachste</span> Outbound-CRM <br />
              für maximalen Umsatz
            </h2>
            <p className="text-gray-300 text-lg max-w-2xl mx-auto">
              Speziell für Agenturen, Coaches, Berater & Dienstleister entwickelt. Kein Schnickschnack – nur was Sie wirklich brauchen.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, idx) => (
              <Card key={idx} className="group hover:shadow-2xl hover:scale-105 transition-all duration-300 border-2 hover:border-primary/50">
                <CardHeader>
                  <div className="mb-4 h-14 w-14 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <feature.icon className="h-7 w-7 text-white" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-6 relative z-[1]">
        <div className="container mx-auto max-w-6xl fade-on-scroll">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent">
              So einfach funktioniert's
            </h2>
            <p className="text-gray-300 text-lg">
              In 3 Schritten zu mehr Abschlüssen
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-12">
            {steps.map((step, idx) => (
              <div key={idx} className="relative">
                {idx < steps.length - 1 && (
                  <div className="hidden md:block absolute top-20 left-full w-full h-0.5 bg-gradient-to-r from-primary to-transparent"></div>
                )}
                <div className="text-center">
                  <div className="mx-auto mb-6 h-20 w-20 rounded-2xl bg-gradient-to-br from-primary to-purple-400 flex items-center justify-center text-white text-3xl font-bold shadow-lg shadow-primary/50">
                    {step.number}
                  </div>
                  <div className="mb-4 h-12 w-12 mx-auto">
                    <step.icon className="h-full w-full text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-white">{step.title}</h3>
                  <p className="text-gray-300">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof / Testimonials */}
      <section className="py-20 px-6 relative z-[1]">
        <div className="container mx-auto max-w-6xl fade-on-scroll">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-white via-purple-100 to-white bg-clip-text text-transparent">
              Das sagen unsere Kunden
            </h2>
            <p className="text-gray-300 text-lg">
              Über 500 Agenturen, Coaches & Berater vertrauen auf SalesFlow
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, idx) => (
              <Card key={idx} className="hover:shadow-2xl transition-all">
                <CardHeader>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="h-14 w-14 rounded-full bg-gradient-to-br from-primary to-purple-400"></div>
                    <div>
                      <div className="font-bold">{testimonial.name}</div>
                      <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground italic">"{testimonial.quote}"</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-6 relative z-[1]">
        <div className="container mx-auto max-w-6xl fade-on-scroll">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4 text-white">
              Transparent und fair
            </h2>
            <p className="text-gray-300 text-lg mb-8">
              Wählen Sie den Plan, der zu Ihrem Team passt
            </p>
            <div className="flex items-center justify-center gap-4">
              <span className={`text-sm font-medium ${!isYearly ? 'text-foreground' : 'text-muted-foreground'}`}>
                Monatlich
              </span>
              <button
                onClick={() => setIsYearly(!isYearly)}
                className="relative inline-flex h-8 w-16 items-center rounded-full bg-primary/20 transition-colors hover:bg-primary/30"
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-primary transition-transform ${
                    isYearly ? 'translate-x-9' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className={`text-sm font-medium ${isYearly ? 'text-foreground' : 'text-muted-foreground'}`}>
                Jährlich
                <span className="ml-2 inline-block rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                  2 Monate gratis
                </span>
              </span>
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan, idx) => (
              <Card 
                key={idx}
                className={`relative hover:scale-105 transition-all ${
                  plan.popular ? "border-primary border-2 shadow-2xl shadow-primary/20" : ""
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="bg-gradient-to-r from-primary to-purple-400 text-white px-6 py-1.5 rounded-full text-sm font-bold shadow-lg">
                      Beliebteste Wahl
                    </span>
                  </div>
                )}
                <CardHeader className="text-center pb-8">
                  <CardTitle className="text-2xl mb-2">{plan.name}</CardTitle>
                  <CardDescription className="mb-4">{plan.description}</CardDescription>
                  <div>
                    <span className="text-5xl font-bold">
                      €{isYearly ? plan.priceYearly : plan.priceMonthly}
                    </span>
                    <span className="text-muted-foreground">/{isYearly ? 'Jahr' : 'Monat'}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-4 mb-8">
                    {plan.features.map((feature, fidx) => (
                      <li key={fidx} className="flex items-start">
                        <Check className="h-5 w-5 text-primary mr-3 flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className={`w-full ${
                      plan.popular 
                        ? "bg-gradient-to-r from-primary to-purple-400 hover:opacity-90" 
                        : ""
                    }`}
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

      {/* FAQ Section */}
      <section id="faq" className="py-20 px-6 relative z-[1]">
        <div className="container mx-auto max-w-4xl fade-on-scroll">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent">
              Häufig gestellte Fragen
            </h2>
            <p className="text-gray-300 text-lg">
              Alles was Sie wissen müssen
            </p>
          </div>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, idx) => (
              <AccordionItem key={idx} value={`item-${idx}`} className="border-b-2 border-white/10">
                <AccordionTrigger className="text-lg font-semibold text-white hover:text-primary">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-gray-300 text-base">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-br from-primary via-blue-500 to-purple-500 text-white relative z-[1]">
        <div className="container mx-auto text-center max-w-4xl fade-on-scroll">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Bereit, Ihren Vertrieb zu revolutionieren?
          </h2>
          <p className="text-xl mb-8 opacity-95">
            Starten Sie noch heute und überzeugen Sie sich selbst. <br />
            Keine Kreditkarte erforderlich. 14 Tage kostenlos.
          </p>
          <Button 
            size="lg" 
            variant="secondary"
            onClick={() => navigate("/auth")}
            className="bg-white text-primary hover:bg-gray-100 shadow-2xl px-10 h-14 text-lg font-bold"
          >
            Jetzt kostenlos testen
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 px-6 bg-[#0a0e27] relative z-[1]">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent mb-4">
                SalesFlow
              </div>
              <p className="text-sm text-muted-foreground">
                Der KI-Co-Pilot für Ihre Outbound-Akquise
              </p>
            </div>
            <div>
              <h3 className="font-bold mb-4">Produkt</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#features" className="hover:text-primary transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-primary transition-colors">Preise</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Demo</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Updates</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-4">Unternehmen</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">Über uns</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Karriere</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Kontakt</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-4">Rechtliches</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">Datenschutz</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Impressum</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">AGB</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-muted-foreground">
            <p>© 2025 SalesFlow. Alle Rechte vorbehalten.</p>
            <div className="flex gap-6 mt-4 md:mt-0">
              <a href="#" className="hover:text-primary transition-colors">
                <Linkedin className="h-5 w-5" />
              </a>
              <a href="#" className="hover:text-primary transition-colors">
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
