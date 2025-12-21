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
    { icon: Target, title: "Kaltakquise auf LinkedIn bringt keine Termine" },
    { icon: Phone, title: "Leads antworten nicht auf generische Nachrichten" },
    { icon: BarChart3, title: "Kein System für konstante Neukundengewinnung" },
  ];

  const features = [
    {
      icon: Linkedin,
      title: "LinkedIn Outreach auf Autopilot",
      description: "Personalisierte Video-Nachrichten und Kampagnen, die Entscheider wirklich erreichen"
    },
    {
      icon: Target,
      title: "Vertriebsmaschine für Hochpreisangebote",
      description: "Pipeline speziell für Premium-Dienstleistungen – von Erstgespräch bis Closing"
    },
    {
      icon: MessageSquare,
      title: "Personalisierte Video-Landingpages",
      description: "Jeder Lead bekommt seine eigene Seite – wie die, die du gerade gesehen hast"
    },
    {
      icon: Brain,
      title: "KI-Coach im Sales Call",
      description: "Einwände in Echtzeit erkennen und die perfekte Antwort vorgeschlagen bekommen"
    },
    {
      icon: TrendingUp,
      title: "Content-Strategie für Inbound",
      description: "Ghostwriting + Posting für organische Reichweite und warme Leads"
    },
    {
      icon: Shield,
      title: "Exklusiv für Hochpreis-Anbieter",
      description: "Gebaut für Coaches, Berater, Agenturen & Dienstleister – nicht für Massenverkauf"
    }
  ];

  const steps = [
    {
      number: "01",
      title: "LinkedIn-Leads importieren",
      description: "Importiere deine Zielkunden und starte personalisierte Outreach-Kampagnen mit Video-Nachrichten.",
      icon: Users
    },
    {
      number: "02",
      title: "Termine generieren & closen",
      description: "Unser KI-Coach unterstützt dich im Call mit Einwandbehandlung in Echtzeit.",
      icon: Brain
    },
    {
      number: "03",
      title: "Hochpreis-Deals abschließen",
      description: "Systematisch von Erstgespräch zum Abschluss. Deine Vertriebsmaschine für 5-6 stellige Deals.",
      icon: TrendingUp
    }
  ];

  const testimonials = [
    {
      name: "Hendrik Hoffmann",
      role: "Webseiten-Agentur",
      image: "/placeholder.svg",
      quote: "Von 15k auf 30k Monatsumsatz in 8 Wochen. Die personalisierten Video-Nachrichten sind ein Game-Changer."
    },
    {
      name: "Lisa Weber",
      role: "Business Coach",
      image: "/placeholder.svg",
      quote: "Endlich ein System, das LinkedIn Outreach + CRM vereint. Wir gewinnen jetzt 8-12 Termine pro Woche."
    },
    {
      name: "Thomas Müller",
      role: "Unternehmensberater",
      image: "/placeholder.svg",
      quote: "Hochpreis-Leads hat unsere Akquise komplett transformiert. Jetzt verkaufen wir nur noch an Premium-Kunden."
    }
  ];

  const faqs = [
    {
      question: "Für wen ist Hochpreis-Leads geeignet?",
      answer: "Hochpreis-Leads ist exklusiv für Coaches, Berater, Agenturen und Premium-Dienstleister entwickelt. Wenn du Hochpreis-Angebote (ab 3.000€) über LinkedIn verkaufst, ist das dein Tool."
    },
    {
      question: "Was macht Hochpreis-Leads anders als andere CRMs?",
      answer: "Wir kombinieren LinkedIn Outreach mit personalisierten Video-Landingpages + KI-gestütztem Sales Coaching. Das ist keine Standard-CRM-Software, sondern eine komplette Vertriebsmaschine."
    },
    {
      question: "Wie funktioniert der LinkedIn Outreach?",
      answer: "Du importierst deine Zielkunden, wir generieren personalisierte Video-Nachrichten und Landingpages für jeden Lead. Die Öffnungsraten sind 5x höher als bei normalen Nachrichten."
    },
    {
      question: "Brauche ich ein Premium LinkedIn Account?",
      answer: "Nein, Hochpreis-Leads funktioniert mit jedem LinkedIn Account. Wir optimieren deine Outreach-Strategie unabhängig von deinem LinkedIn-Plan."
    },
    {
      question: "Gibt es eine Testphase?",
      answer: "Ja, du kannst Hochpreis-Leads 14 Tage kostenlos testen – ohne Kreditkarte. Perfekt um zu sehen, ob es für dein Business passt."
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
              Hochpreis-Leads
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
            <Linkedin className="inline h-4 w-4 mr-2" />
            Die Vertriebsmaschine für LinkedIn Outreach
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 text-white leading-tight">
            LinkedIn Outreach<br />
            <span className="bg-gradient-to-r from-primary via-blue-400 to-purple-400 bg-clip-text text-transparent">
              für Hochpreis-Angebote.
            </span><br />
            Systematisch.
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-300 mb-6 max-w-3xl mx-auto">
            Die All-in-One Vertriebsmaschine für Coaches, Berater, Agenturen & Dienstleister.
            Personalisierte Video-Outreach + KI-gestütztes Sales Coaching + Pipeline Management.
          </p>
          
          <p className="text-lg text-primary/80 mb-12 font-medium">
            ⚡ Nicht für jeden. Nur für Premium-Anbieter mit Hochpreis-Angeboten.
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
              <div className="text-4xl font-bold text-primary mb-2">73%</div>
              <div className="text-sm text-gray-400">Höhere Antwortrate</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">8-12</div>
              <div className="text-sm text-gray-400">Termine pro Woche</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">5-6</div>
              <div className="text-sm text-gray-400">Stellige Deals</div>
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
              Die <span className="bg-gradient-to-r from-primary via-blue-400 to-purple-400 bg-clip-text text-transparent">komplette Vertriebsmaschine</span><br />
              für LinkedIn Outreach
            </h2>
            <p className="text-gray-300 text-lg max-w-2xl mx-auto">
              Outreach-Strategie + Content + CRM in einem System. Speziell für Hochpreis-Anbieter.
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
              Über 500 Agenturen, Coaches & Berater vertrauen auf Hochpreis-Leads
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
                Hochpreis-Leads
              </div>
              <p className="text-sm text-muted-foreground">
                Die Vertriebsmaschine für LinkedIn Outreach
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
                <li><a href="https://www.content-leads.de/datenschutz" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">Datenschutz</a></li>
                <li><a href="https://www.content-leads.de/impressum" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">Impressum</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">AGB</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-muted-foreground">
            <p>© 2025 Hochpreis-Leads. Alle Rechte vorbehalten.</p>
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
