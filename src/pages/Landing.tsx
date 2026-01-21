import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Linkedin, Eye, Video, Sparkles, BarChart3, Users, Target, Zap, Clock, MousePointer, Play, ArrowRight, Mail, Star, CheckCircle, X, TrendingUp, AlertTriangle, Flame, PieChart, Check, Phone, MessageSquare, Lightbulb, Mic } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import SkyBackground from "@/components/ui/SkyBackground";
import { AIObjectionDemo } from "@/components/landing/AIObjectionDemo";
import pitchfirstLogo from "@/assets/pitchfirst-logo-white.png";
import felixLiveCallImage from "@/assets/felix-live-call.jpg";

const Landing = () => {
  const navigate = useNavigate();
  const observerRef = useRef<IntersectionObserver | null>(null);
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("scroll-visible");
          }
        });
      },
      { 
        threshold: 0.1,
        rootMargin: "0px 0px -80px 0px"
      }
    );

    document.querySelectorAll(".scroll-animate").forEach((el) => {
      observerRef.current?.observe(el);
    });

    return () => observerRef.current?.disconnect();
  }, []);

  const challenges = [
    { 
      icon: Target, 
      title: "LinkedIn-Nachrichten werden ignoriert",
      description: "Generische Textnachrichten landen im Spam. Niemand antwortet."
    },
    { 
      icon: Eye, 
      title: "Keine Ahnung, wer interessiert ist",
      description: "Du sendest Nachrichten ins Leere, ohne zu wissen, wer sich wirklich engagiert."
    },
    { 
      icon: Clock, 
      title: "Outreach kostet zu viel Zeit",
      description: "Stunden für manuelle Personalisierung, die am Ende nichts bringt."
    },
  ];

  const features = [
    {
      icon: Users,
      title: "Integriertes CRM",
      description: "Alle Leads, Deals und Aktivitäten in einem System. Kein Wechsel zwischen Tools, kein Excel-Chaos.",
      highlight: true
    },
    {
      icon: Sparkles,
      title: "Live KI-Einwandbehandlung",
      description: "Während du telefonierst, erkennt die KI Einwände und zeigt dir sofort die passende Antwort – in Echtzeit.",
      highlight: true
    },
    {
      icon: Eye,
      title: "Echtzeit-Tracking",
      description: "Sieh live, wenn ein Lead deine Seite besucht, das Video schaut oder auf den CTA klickt. 80% bessere Erreichbarkeit.",
      highlight: true
    },
    {
      icon: BarChart3,
      title: "Zahlen, Daten, Fakten",
      description: "Endlich echte Outreach-KPIs: Anrufe, Termine, Öffnungsraten – übersichtlich statt in hässlichen Excel-Sheets."
    },
    {
      icon: Video,
      title: "KI-generierte Video-Landingpages",
      description: "Für jeden Lead wird automatisch eine personalisierte Landingpage mit Video erstellt."
    },
    {
      icon: Zap,
      title: "Call-Funktion direkt im Tool",
      description: "Rufe Leads direkt aus dem CRM an. Keine Telefon-App, keine Umwege – alles in einem System."
    }
  ];

  const steps = [
    {
      number: "01",
      title: "Leads importieren",
      description: "Importiere deine LinkedIn-Kontakte. Das System erstellt für jeden eine einzigartige Landingpage.",
      icon: Users
    },
    {
      number: "02", 
      title: "KI generiert Seiten",
      description: "Personalisierte Videos + Landingpages werden automatisch erstellt – in Sekunden, nicht Stunden.",
      icon: Sparkles
    },
    {
      number: "03",
      title: "Tracking in Echtzeit",
      description: "Sieh live, wer deine Seite besucht. Hot Leads werden sofort markiert.",
      icon: Eye
    },
    {
      number: "04",
      title: "Abschlüsse machen",
      description: "Kontaktiere nur die Leads, die wirklich interessiert sind. Höhere Closing-Rate.",
      icon: Target
    }
  ];

  const trackingFeatures = [
    { label: "Page View", description: "Lead hat die Seite geöffnet" },
    { label: "Video Play", description: "Video wurde gestartet" },
    { label: "Video 50%", description: "Hälfte des Videos gesehen" },
    { label: "Video 100%", description: "Video komplett geschaut" },
    { label: "CTA Klick", description: "Button wurde geklickt" },
    { label: "Scroll Depth", description: "Wie weit gescrollt wurde" },
    { label: "Time on Page", description: "Verweildauer auf der Seite" },
    { label: "Booking Click", description: "Terminbuchung gestartet" },
  ];

  const faqs = [
    {
      question: "Führt die Software zu LinkedIn-Banns?",
      answer: "Nein. PitchFirst ist nicht mit LinkedIn verbunden – es gibt keine Automatisierung, die dein Profil gefährdet. Die Software dient nur zur Steuerung und ist perfekt auf die Grenzen deines Profils abgestimmt. Sie gibt dir vor, was du manuell tun sollst – du behältst die volle Kontrolle."
    },
    {
      question: "Wie funktioniert die KI-Video-Generierung?",
      answer: "Du lädst einmalig ein Pitch-Video hoch. Unsere KI erstellt daraus für jeden Lead ein personalisiertes Intro, in dem dein Avatar den Namen des Leads ausspricht. Das Ganze passiert vollautomatisch."
    },
    {
      question: "Was genau wird getrackt?",
      answer: "Alles. Page Views, Video-Starts, Video-Fortschritt (25%, 50%, 75%, 100%), Button-Klicks, Scroll-Tiefe, Verweildauer, CTA-Klicks und Terminbuchungen. Jede Aktion fließt in den Lead-Score ein."
    },
    {
      question: "Wie sehe ich, welche Leads interessiert sind?",
      answer: "Hot Leads werden in Echtzeit markiert. Du siehst sofort, wenn jemand deine Seite besucht oder das Video schaut. Push-Benachrichtigungen informieren dich über wichtige Engagement-Signale."
    },
    {
      question: "Für wen ist das geeignet?",
      answer: "Für Coaches, Berater, Agenturen und B2B-Dienstleister, die LinkedIn für Outreach nutzen und mehr Termine über personalisierte Video-Nachrichten gewinnen wollen."
    },
    {
      question: "Wie personalisiert sind die Landingpages?",
      answer: "Jeder Lead bekommt seine eigene URL mit seinem Namen. Das Video spricht ihn persönlich an. Die Seite ist visuell auf deine Brand angepasst – alles vollautomatisch."
    }
  ];

  return (
    <div className="min-h-screen bg-[#0a0e27] relative overflow-x-hidden">
      {/* Blurred Ellipse Background - smaller on mobile */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[400px] md:w-[800px] h-[300px] md:h-[600px] bg-primary/20 rounded-full blur-[80px] md:blur-[120px]"></div>
      </div>
      
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-background/10 backdrop-blur-lg border-b border-white/10">
        <div className="container mx-auto px-4 md:px-6 py-3 md:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <img src={pitchfirstLogo} alt="pitchfirst.io Logo" className="h-8 md:h-10" />
            </div>
            <div className="hidden md:flex gap-8 text-sm text-white/80">
              <a href="#features" className="hover:text-white transition-colors">Features</a>
              <a href="#how-it-works" className="hover:text-white transition-colors">So funktioniert's</a>
              <a href="#tracking" className="hover:text-white transition-colors">Tracking</a>
              <a href="#pricing" className="hover:text-white transition-colors">Preise</a>
              <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
              <a href="/partner" className="hover:text-white transition-colors">Partner</a>
            </div>
            <div className="flex gap-2 md:gap-4">
              <Button variant="ghost" onClick={() => navigate("/auth")} className="text-white hover:bg-white/10 text-sm px-2 md:px-4">
                Anmelden
              </Button>
              <Button 
                onClick={() => window.open("https://calendly.com/zoepp-media/vorgesprach-demo-software", "_blank")} 
                className="bg-white text-primary hover:bg-white/90 text-sm px-3 md:px-4"
              >
                Demo
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-24 md:pt-32 pb-12 md:pb-20 px-4 md:px-6 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <SkyBackground starCount={250} shootingEveryMs={[3000, 8000]} enableParallax={true} />
        </div>
        <div className="container mx-auto text-center max-w-5xl relative z-[1]">
          <div className="inline-block mb-4 md:mb-6 px-3 md:px-4 py-1.5 md:py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs md:text-sm font-medium">
            <Sparkles className="inline h-3 w-3 md:h-4 md:w-4 mr-1.5 md:mr-2" />
            LinkedIn Outreach mit KI-Landingpages
          </div>
          
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold mb-4 md:mb-6 text-white leading-tight">
            Personalisierte Videos.<br />
            <span className="bg-gradient-to-r from-primary via-blue-400 to-purple-400 bg-clip-text text-transparent italic">
              Echtzeit-Tracking.
            </span><br />
            Mehr Termine.
          </h1>
          
          <p className="text-base md:text-xl lg:text-2xl text-gray-300 mb-6 md:mb-8 max-w-3xl mx-auto px-2">
            Die LinkedIn Outreach Software, die es dir ermöglicht mit der ersten Nachricht bereits Termine zu legen in deiner Zielgruppe. 
            Mit integriertem CRM, Echtzeit-Benachrichtigung und KI Einwandbehandlung im Call.
          </p>
          
          <div className="flex gap-3 md:gap-4 justify-center flex-wrap mb-8 md:mb-12 px-2">
            <Button 
              size="lg" 
              onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
              className="bg-gradient-to-r from-primary to-blue-500 hover:opacity-90 text-white shadow-2xl shadow-primary/50 px-4 md:px-8 h-12 md:h-14 text-sm md:text-lg"
            >
              Zugang sichern
              <ArrowRight className="ml-2 h-4 w-4 md:h-5 md:w-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => window.open("https://calendly.com/zoepp-media/vorgesprach-demo-software", "_blank")}
              className="border-white/20 bg-white/5 text-white hover:bg-white/10 px-4 md:px-8 h-12 md:h-14 text-sm md:text-lg"
            >
              <Play className="mr-2 h-4 w-4 md:h-5 md:w-5" />
              Demo ansehen
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 md:gap-8 max-w-2xl mx-auto text-white px-2">
            <div>
              <div className="text-2xl md:text-4xl font-bold text-primary mb-1 md:mb-2">80%</div>
              <div className="text-xs md:text-sm text-gray-400">Bessere Erreichbarkeit</div>
            </div>
            <div>
              <div className="text-2xl md:text-4xl font-bold text-primary mb-1 md:mb-2">Live</div>
              <div className="text-xs md:text-sm text-gray-400">KI-Einwandtrainer</div>
            </div>
            <div>
              <div className="text-2xl md:text-4xl font-bold text-primary mb-1 md:mb-2">CRM</div>
              <div className="text-xs md:text-sm text-gray-400">Alles integriert</div>
            </div>
          </div>
        </div>
      </section>

      {/* Hero Image/Demo Preview */}
      <section className="relative px-4 md:px-6 pb-12 md:pb-20 z-[1]">
        <div className="container mx-auto max-w-6xl">
          <div className="relative rounded-xl md:rounded-2xl overflow-hidden border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] p-1.5 md:p-2">
            <div className="rounded-lg md:rounded-xl bg-[#0d1117] overflow-hidden">
              <div className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 md:py-3 border-b border-white/10">
                <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-red-500"></div>
                <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-yellow-500"></div>
                <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-green-500"></div>
                <span className="ml-2 md:ml-4 text-[10px] md:text-xs text-gray-500 truncate">pitchfirst.io/p/max-mustermann</span>
              </div>
              <div className="p-4 md:p-8 lg:p-12 flex flex-col md:flex-row gap-4 md:gap-8 items-center">
                <div className="flex-1 space-y-3 md:space-y-4">
                  <div className="inline-block px-2 md:px-3 py-0.5 md:py-1 rounded-full bg-primary/20 text-primary text-[10px] md:text-xs font-medium">
                    Echtzeit aktiv
                  </div>
                  <h3 className="text-lg md:text-2xl lg:text-3xl font-bold text-white">
                    Hey Max, ich habe dir ein Video aufgenommen...
                  </h3>
                  <p className="text-gray-400 text-sm md:text-base">
                    Personalisierte Landingpage mit KI-generiertem Video – vollautomatisch für jeden Lead erstellt.
                  </p>
                  <div className="flex flex-wrap gap-1.5 md:gap-2">
                    <span className="px-1.5 md:px-2 py-0.5 md:py-1 rounded bg-green-500/20 text-green-400 text-[10px] md:text-xs">✓ Page View</span>
                    <span className="px-1.5 md:px-2 py-0.5 md:py-1 rounded bg-blue-500/20 text-blue-400 text-[10px] md:text-xs">▶ Video gestartet</span>
                    <span className="px-1.5 md:px-2 py-0.5 md:py-1 rounded bg-purple-500/20 text-purple-400 text-[10px] md:text-xs">75% geschaut</span>
                  </div>
                </div>
                <div className="w-full md:w-72 h-36 md:h-48 rounded-lg md:rounded-xl bg-gradient-to-br from-primary/30 to-purple-500/30 flex items-center justify-center border border-white/10">
                  <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-white/20 flex items-center justify-center">
                    <Play className="h-6 w-6 md:h-8 md:w-8 text-white ml-0.5 md:ml-1" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Challenge Section */}
      <section className="py-12 md:py-20 px-4 md:px-6 relative z-[1]">
        <div className="container mx-auto max-w-6xl scroll-animate scroll-fade-up">
          <div className="text-center mb-8 md:mb-12">
            <p className="text-primary text-xs md:text-sm font-medium mb-2 md:mb-4">Herausforderungen im Alltag</p>
            <h2 className="text-2xl md:text-3xl lg:text-5xl font-bold mb-4 text-white">
              Kennst du das auch?
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-4 md:gap-8">
            {challenges.map((challenge, idx) => (
              <Card key={idx} className="border-2 border-white/10 hover:border-primary/50 transition-all hover:shadow-lg bg-white/[0.02]">
                <CardHeader className="text-center">
                  <div className="mx-auto mb-4 h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <challenge.icon className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="text-lg text-white">{challenge.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-center">{challenge.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Section - Normal Outreach vs Content-Leads */}
      <section className="py-12 md:py-20 px-4 md:px-6 relative z-[1]">
        <div className="container mx-auto max-w-6xl scroll-animate scroll-fade-up">
          <div className="text-center mb-8 md:mb-16">
            <p className="text-primary text-xs md:text-sm font-medium mb-2 md:mb-4">Der Unterschied</p>
            <h2 className="text-2xl md:text-3xl lg:text-5xl font-bold mb-3 md:mb-4 text-white">
              Normaler Outreach <span className="text-red-400">funktioniert nicht mehr</span>
            </h2>
            <p className="text-gray-300 text-sm md:text-lg max-w-2xl mx-auto px-2">
              LinkedIn hat sich verändert. Wer noch mit Copy-Paste-Nachrichten arbeitet, verbrennt Leads.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4 md:gap-8">
            {/* Normal Outreach - Bad */}
            <div className="rounded-xl md:rounded-2xl border-2 border-red-500/30 bg-red-500/5 p-4 md:p-8">
              <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                  <X className="h-5 w-5 md:h-6 md:w-6 text-red-400" />
                </div>
                <h3 className="text-lg md:text-2xl font-bold text-red-400">Normaler Outreach</h3>
              </div>
              
              <div className="space-y-2 md:space-y-4">
                {[
                  { icon: AlertTriangle, text: "Generische Textnachrichten", desc: "Werden ignoriert oder als Spam markiert" },
                  { icon: X, text: "Keine Kennzahlen", desc: "Du weißt nicht, wer interessiert ist" },
                  { icon: Flame, text: "Leads werden verbrannt", desc: "Schlechter erster Eindruck = keine zweite Chance" },
                  { icon: Clock, text: "Zeitverschwendung", desc: "Stunden für Nachrichten, die niemand liest" },
                  { icon: TrendingUp, text: "Sinkende Antwortraten", desc: "LinkedIn-User sind abgestumpft" },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2 md:gap-3 p-2 md:p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                    <item.icon className="h-4 w-4 md:h-5 md:w-5 text-red-400 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="text-white font-medium text-xs md:text-base">{item.text}</div>
                      <div className="text-gray-400 text-[10px] md:text-sm leading-tight">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 md:mt-6 p-3 md:p-4 rounded-lg bg-red-500/10 border border-red-500/30">
                <div className="text-center">
                  <div className="text-2xl md:text-3xl font-bold text-red-400 mb-0.5 md:mb-1">{"<"}3%</div>
                  <div className="text-gray-400 text-[10px] md:text-sm">Durchschnittliche Antwortrate</div>
                </div>
              </div>
            </div>
            
            {/* Content-Leads - Good */}
            <div className="rounded-xl md:rounded-2xl border-2 border-primary/50 bg-primary/5 p-4 md:p-8 relative overflow-hidden">
              <div className="absolute top-2 right-2 md:top-4 md:right-4 px-2 md:px-3 py-0.5 md:py-1 rounded-full bg-primary/20 text-primary text-[9px] md:text-xs font-medium">
                Empfohlen
              </div>
              <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                </div>
                <h3 className="text-lg md:text-2xl font-bold text-primary">pitchfirst.io</h3>
              </div>
              
              <div className="space-y-2 md:space-y-4">
                {[
                  { icon: Users, text: "CRM mit allem integriert", desc: "Leads, Deals, Aktivitäten – alles an einem Ort" },
                  { icon: Sparkles, text: "Live KI-Einwandbehandlung", desc: "Erkennt Einwände und zeigt sofort passende Antworten" },
                  { icon: Eye, text: "Echtzeit-Tracking", desc: "80% bessere Erreichbarkeit durch Live-Signale" },
                  { icon: BarChart3, text: "Zahlen statt Excel", desc: "Echte KPIs, übersichtlich und ohne Chaos" },
                  { icon: Zap, text: "Call-Funktion im Tool", desc: "Direkt aus dem CRM anrufen – keine Umwege" },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2 md:gap-3 p-2 md:p-3 rounded-lg bg-primary/10 border border-primary/20">
                    <item.icon className="h-4 w-4 md:h-5 md:w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="text-white font-medium text-xs md:text-base">{item.text}</div>
                      <div className="text-gray-400 text-[10px] md:text-sm leading-tight">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 md:mt-6 p-3 md:p-4 rounded-lg bg-primary/10 border border-primary/30">
                <div className="text-center">
                  <div className="text-2xl md:text-3xl font-bold text-primary mb-0.5 md:mb-1">80%</div>
                  <div className="text-gray-400 text-[10px] md:text-sm">Bessere Erreichbarkeit</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Start Section - 10 Minuten */}
      <section className="py-12 md:py-20 px-4 md:px-6 relative z-[1]">
        <div className="container mx-auto max-w-5xl scroll-animate scroll-fade-up">
          <div className="text-center mb-8 md:mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/20 border border-green-500/30 text-green-400 text-xs md:text-sm font-medium mb-4">
              <Clock className="h-4 w-4" />
              Schnellstart
            </div>
            <h2 className="text-2xl md:text-3xl lg:text-5xl font-bold mb-4 text-white">
              Outreach in <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">10 Minuten</span> startbereit
            </h2>
            <p className="text-gray-300 text-sm md:text-lg max-w-2xl mx-auto">
              Von der ersten Idee bis zur laufenden Kampagne – so einfach war LinkedIn-Outreach noch nie.
            </p>
          </div>
          
          <div className="grid md:grid-cols-4 gap-4 md:gap-6">
            {[
              {
                step: "1",
                icon: Users,
                title: "Leads suchen",
                description: "Finde deine Zielgruppe im Sales Navigator"
              },
              {
                step: "2",
                icon: ArrowRight,
                title: "Importieren",
                description: "CSV-Upload bei PitchFirst.io"
              },
              {
                step: "3",
                icon: Sparkles,
                title: "KI anpassen",
                description: "Lead-Seiten mit KI personalisieren"
              },
              {
                step: "4",
                icon: Target,
                title: "Starten",
                description: "Kampagne mit Tracking aktivieren"
              }
            ].map((item, idx) => (
              <div key={idx} className="relative">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-5 md:p-6 text-center h-full">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center mx-auto mb-4">
                    <span className="text-white font-bold">{item.step}</span>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center mx-auto mb-3">
                    <item.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-white font-semibold mb-2">{item.title}</h3>
                  <p className="text-gray-400 text-sm">{item.description}</p>
                </div>
                {idx < 3 && (
                  <div className="hidden md:block absolute top-1/2 -right-3 transform -translate-y-1/2 z-10">
                    <ArrowRight className="h-5 w-5 text-primary/50" />
                  </div>
                )}
              </div>
            ))}
          </div>
          
          <div className="mt-8 text-center">
            <Button 
              size="lg" 
              onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
              className="bg-gradient-to-r from-green-500 to-emerald-500 hover:opacity-90 text-white shadow-2xl shadow-green-500/30 px-6 md:px-8 h-12 md:h-14"
            >
              Jetzt in 10 Minuten starten
              <ArrowRight className="ml-2 h-4 w-4 md:h-5 md:w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Weekly Live Call Section */}
      <section className="py-12 md:py-20 px-4 md:px-6 relative z-[1] overflow-hidden">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 gap-6 md:gap-12 items-center">
            {/* Left side - Text */}
            <div className="scroll-animate scroll-fade-up order-2 md:order-1">
              <div className="inline-flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-400 text-[10px] md:text-sm font-medium mb-3 md:mb-4">
                <Video className="h-3 w-3 md:h-4 md:w-4" />
                Exklusiv für Kunden
              </div>
              <h2 className="text-xl md:text-3xl lg:text-4xl font-bold mb-3 md:mb-4 text-white">
                Jede Woche <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Live Gruppen-Call</span>
              </h2>
              <p className="text-gray-300 text-xs md:text-lg mb-4 md:mb-6 leading-relaxed">
                Jeden Mittwoch treffen wir uns live. Du stellst deine Fragen zu Outreach, Profil-Optimierung, 
                Messaging oder Strategie – und bekommst sofort Antworten direkt von mir.
              </p>
              <ul className="space-y-2 md:space-y-3 mb-4 md:mb-6">
                {[
                  "Live Q&A zu deinem LinkedIn-Profil",
                  "Feedback zu deinen Nachrichten & Kampagnen",
                  "Neue Strategien und Best Practices",
                  "Networking mit anderen Nutzern"
                ].map((item, idx) => (
                  <li key={idx} className="flex items-center gap-2 md:gap-3 text-gray-300 text-xs md:text-base">
                    <Check className="h-4 w-4 md:h-5 md:w-5 text-purple-400 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Right side - Animated Call Mockup */}
            <div className="relative scroll-animate scroll-scale">
              {/* Question bubble - above the screen */}
              <div className="mb-3 md:mb-4 animate-[fade-in_1s_ease-out_0.5s_both]">
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg md:rounded-xl p-2.5 md:p-4">
                  <div className="flex items-start gap-2">
                    <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                      <MessageSquare className="h-2.5 w-2.5 md:h-3 md:w-3 text-blue-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] md:text-xs text-gray-400 mb-0.5 md:mb-1">Teilnehmer fragt:</p>
                      <p className="text-xs md:text-sm text-white font-medium leading-tight">"Was muss ich an meinem Profil ändern, um mehr Anfragen zu bekommen?"</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Apple Liquid Glass style monitor */}
              <div className="rounded-[1.25rem] md:rounded-[2rem] overflow-hidden border border-white/20 bg-gradient-to-br from-white/10 to-white/[0.02] p-2 md:p-3 shadow-2xl shadow-cyan-500/10 backdrop-blur-xl">
                <div className="rounded-[1rem] md:rounded-[1.5rem] bg-[#0d1117] overflow-hidden">
                  {/* Video call header */}
                  <div className="flex items-center justify-between px-3 md:px-4 py-2 md:py-3 border-b border-white/10 bg-[#161b22] rounded-t-[0.875rem] md:rounded-t-[1.25rem]">
                    <div className="flex items-center gap-1.5 md:gap-2">
                      <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-red-500 animate-pulse"></div>
                      <span className="text-[10px] md:text-xs text-gray-400">LIVE</span>
                    </div>
                    <span className="text-[10px] md:text-xs text-gray-500">Mittwoch 11:00</span>
                  </div>
                  
                  {/* Video area */}
                  <div className="relative aspect-[4/3] md:aspect-video bg-gradient-to-br from-gray-900 to-gray-800 overflow-hidden">
                    {/* Host image - positioned lower to show face */}
                    <img 
                      src={felixLiveCallImage} 
                      alt="Felix Zoepp - Live Call Host" 
                      className="w-full h-full object-cover object-[center_30%] md:object-[center_35%]"
                    />
                    
                    {/* Speaking indicator overlay - top right corner */}
                    <div className="absolute top-2 right-2 md:top-3 md:right-3 px-2 md:px-3 py-1 md:py-1.5 rounded-full bg-black/70 border border-green-500/50 backdrop-blur-sm">
                      <div className="flex items-center gap-1.5 md:gap-2">
                        <span className="text-[9px] md:text-xs text-white font-medium">Felix spricht</span>
                        <div className="flex items-center gap-0.5 md:gap-1">
                          <div className="w-1 h-2 md:w-1.5 md:h-3 bg-green-400 rounded-full animate-[pulse_0.5s_ease-in-out_infinite]"></div>
                          <div className="w-1 h-3 md:w-1.5 md:h-5 bg-green-400 rounded-full animate-[pulse_0.5s_ease-in-out_0.1s_infinite]"></div>
                          <div className="w-1 h-1.5 md:w-1.5 md:h-2 bg-green-400 rounded-full animate-[pulse_0.5s_ease-in-out_0.2s_infinite]"></div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Answer bubble - appears with delay - hidden on small mobile */}
                    <div className="absolute bottom-2 right-2 md:bottom-4 md:right-4 animate-[fade-in_1s_ease-out_2s_both] hidden sm:block">
                      <div className="bg-primary/20 backdrop-blur-sm border border-primary/30 rounded-lg md:rounded-xl p-2 md:p-3 max-w-[140px] md:max-w-[200px]">
                        <div className="flex items-start gap-1.5 md:gap-2">
                          <Lightbulb className="h-3 w-3 md:h-4 md:w-4 text-primary flex-shrink-0 mt-0.5" />
                          <p className="text-[10px] md:text-xs text-white leading-tight">Live-Antwort mit konkreten Tipps...</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Participant count */}
                    <div className="absolute bottom-2 left-2 md:bottom-4 md:left-4 flex items-center gap-1.5 md:gap-2 px-2 md:px-3 py-1 md:py-1.5 rounded-full bg-black/50 border border-white/10">
                      <Users className="h-2.5 w-2.5 md:h-3 md:w-3 text-gray-400" />
                      <span className="text-[9px] md:text-xs text-gray-300">24 Teilnehmer</span>
                    </div>
                  </div>
                  
                  {/* Call controls */}
                  <div className="flex items-center justify-center gap-3 md:gap-4 py-2.5 md:py-4 bg-[#161b22]">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/10 flex items-center justify-center">
                      <Mic className="h-3 w-3 md:h-4 md:w-4 text-white" />
                    </div>
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/10 flex items-center justify-center">
                      <Video className="h-3 w-3 md:h-4 md:w-4 text-white" />
                    </div>
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-red-500 flex items-center justify-center">
                      <Phone className="h-3 w-3 md:h-4 md:w-4 text-white rotate-[135deg]" />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Decorative elements - smaller on mobile */}
              <div className="absolute -top-2 -right-2 md:-top-4 md:-right-4 w-16 h-16 md:w-24 md:h-24 bg-purple-500/20 rounded-full blur-2xl"></div>
              <div className="absolute -bottom-2 -left-2 md:-bottom-4 md:-left-4 w-20 h-20 md:w-32 md:h-32 bg-primary/20 rounded-full blur-2xl"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Software Screenshots / Features Showcase */}
      <section className="py-12 md:py-20 px-4 md:px-6 relative z-[1]">
        <div className="container mx-auto max-w-6xl scroll-animate scroll-scale">
          <div className="text-center mb-8 md:mb-16">
            <p className="text-primary text-xs md:text-sm font-medium mb-2 md:mb-4">Die Software</p>
            <h2 className="text-2xl md:text-3xl lg:text-5xl font-bold mb-4 text-white px-2">
              Alles was du brauchst,<br />
              <span className="bg-gradient-to-r from-primary via-blue-400 to-purple-400 bg-clip-text text-transparent">in einem Dashboard</span>
            </h2>
          </div>
          
          <div className="space-y-6 md:space-y-12">
            {/* Campaign Analytics Mockup */}
            <div className="rounded-xl md:rounded-2xl overflow-hidden border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] p-1.5 md:p-2">
              <div className="rounded-lg md:rounded-xl bg-[#0d1117] overflow-hidden">
                <div className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 md:py-3 border-b border-white/10">
                  <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-red-500"></div>
                  <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-green-500"></div>
                  <span className="ml-2 md:ml-4 text-[10px] md:text-xs text-gray-500">Kampagnen-Analyse</span>
                </div>
                <div className="p-3 md:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 md:mb-6">
                    <div>
                      <h4 className="text-base md:text-xl font-bold text-white">Kampagne: LinkedIn Q1 2025</h4>
                      <p className="text-gray-400 text-xs md:text-sm">324 Leads • Aktiv seit 14 Tagen</p>
                    </div>
                    <div className="flex gap-2">
                      <span className="px-2 md:px-3 py-0.5 md:py-1 rounded-full bg-green-500/20 text-green-400 text-xs md:text-sm font-medium">Aktiv</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 mb-4 md:mb-6">
                    {[
                      { label: "Seiten-Aufrufe", value: "1.247", change: "+23%", icon: Eye },
                      { label: "Video-Views", value: "892", change: "+18%", icon: Play },
                      { label: "CTA-Klicks", value: "156", change: "+31%", icon: MousePointer },
                      { label: "Hot Leads", value: "47", change: "+12%", icon: Flame },
                    ].map((stat, idx) => (
                      <div key={idx} className="p-2.5 md:p-4 rounded-lg md:rounded-xl bg-white/[0.03] border border-white/10">
                        <div className="flex items-center justify-between mb-1.5 md:mb-2">
                          <stat.icon className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                          <span className="text-green-400 text-[10px] md:text-xs font-medium">{stat.change}</span>
                        </div>
                        <div className="text-lg md:text-2xl font-bold text-white">{stat.value}</div>
                        <div className="text-gray-400 text-[10px] md:text-xs">{stat.label}</div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Mini Chart Mockup */}
                  <div className="grid md:grid-cols-2 gap-3 md:gap-6">
                    <div className="p-3 md:p-4 rounded-lg md:rounded-xl bg-white/[0.03] border border-white/10">
                      <div className="flex items-center justify-between mb-3 md:mb-4">
                        <span className="text-white text-sm md:text-base font-medium">Engagement über Zeit</span>
                        <PieChart className="h-3 w-3 md:h-4 md:w-4 text-gray-400" />
                      </div>
                      <div className="flex items-end gap-0.5 md:gap-1 h-16 md:h-24">
                        {[40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 88].map((h, i) => (
                          <div key={i} className="flex-1 bg-gradient-to-t from-primary to-primary/40 rounded-t" style={{ height: `${h}%` }}></div>
                        ))}
                      </div>
                      <div className="flex justify-between mt-2 text-xs text-gray-500">
                        <span>Woche 1</span>
                        <span>Woche 2</span>
                      </div>
                    </div>
                    
                    <div className="p-3 md:p-4 rounded-lg md:rounded-xl bg-white/[0.03] border border-white/10">
                      <div className="flex items-center justify-between mb-3 md:mb-4">
                        <span className="text-white text-sm md:text-base font-medium">Conversion Funnel</span>
                        <BarChart3 className="h-3 w-3 md:h-4 md:w-4 text-gray-400" />
                      </div>
                      <div className="space-y-2 md:space-y-3">
                        {[
                          { label: "Nachrichten gesendet", value: 324, pct: 100 },
                          { label: "Seite geöffnet", value: 247, pct: 76 },
                          { label: "Video gestartet", value: 189, pct: 58 },
                          { label: "CTA geklickt", value: 47, pct: 14 },
                        ].map((item, idx) => (
                          <div key={idx}>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-gray-400">{item.label}</span>
                              <span className="text-white">{item.value} ({item.pct}%)</span>
                            </div>
                            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                              <div className="h-full bg-gradient-to-r from-primary to-blue-400 rounded-full" style={{ width: `${item.pct}%` }}></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Lead Table Mockup */}
            <div className="rounded-xl md:rounded-2xl overflow-hidden border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] p-1.5 md:p-2">
              <div className="rounded-lg md:rounded-xl bg-[#0d1117] overflow-hidden">
                <div className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 md:py-3 border-b border-white/10">
                  <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-red-500"></div>
                  <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-green-500"></div>
                  <span className="ml-2 md:ml-4 text-[10px] md:text-xs text-gray-500">Lead-Übersicht</span>
                </div>
                <div className="p-3 md:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 md:mb-4">
                    <h4 className="text-sm md:text-lg font-bold text-white">Alle Leads der Kampagne</h4>
                    <div className="flex gap-1.5 md:gap-2 flex-wrap">
                      <span className="px-2 md:px-3 py-0.5 md:py-1 rounded bg-primary/20 text-primary text-[10px] md:text-xs">47 Hot</span>
                      <span className="px-2 md:px-3 py-0.5 md:py-1 rounded bg-yellow-500/20 text-yellow-400 text-[10px] md:text-xs">89 Warm</span>
                      <span className="px-2 md:px-3 py-0.5 md:py-1 rounded bg-gray-500/20 text-gray-400 text-[10px] md:text-xs">188 Kalt</span>
                    </div>
                  </div>
                  
                  <div className="overflow-x-auto -mx-3 md:mx-0">
                    <table className="w-full min-w-[500px]">
                      <thead>
                        <tr className="text-left text-[10px] md:text-xs text-gray-400 border-b border-white/10">
                          <th className="pb-2 md:pb-3 font-medium pl-3 md:pl-0">Lead</th>
                          <th className="pb-2 md:pb-3 font-medium">Status</th>
                          <th className="pb-2 md:pb-3 font-medium hidden sm:table-cell">Engagement</th>
                          <th className="pb-2 md:pb-3 font-medium">Aktivität</th>
                          <th className="pb-2 md:pb-3 font-medium pr-3 md:pr-0">Score</th>
                        </tr>
                      </thead>
                      <tbody className="text-xs md:text-sm">
                        {[
                          { name: "Max Müller", company: "Müller Digital", status: "Hot", engagement: ["Seite", "Video 100%", "CTA"], time: "vor 5 Min", score: 92 },
                          { name: "Lisa Schmidt", company: "Schmidt Consulting", status: "Hot", engagement: ["Seite", "Video 75%", "CTA"], time: "vor 12 Min", score: 85 },
                          { name: "Thomas Weber", company: "Weber Solutions", status: "Warm", engagement: ["Seite", "Video 50%"], time: "vor 1 Std", score: 68 },
                          { name: "Anna Fischer", company: "Fischer Agency", status: "Warm", engagement: ["Seite", "Video Start"], time: "vor 3 Std", score: 54 },
                        ].map((lead, idx) => (
                        <tr key={idx} className="border-b border-white/5">
                            <td className="py-2 md:py-3 pl-3 md:pl-0">
                              <div className="flex items-center gap-2 md:gap-3">
                                <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center text-white text-[10px] md:text-xs font-bold flex-shrink-0">
                                  {lead.name.split(" ").map(n => n[0]).join("")}
                                </div>
                                <div className="min-w-0">
                                  <div className="text-white font-medium text-xs md:text-sm truncate">{lead.name}</div>
                                  <div className="text-gray-500 text-[10px] md:text-xs truncate">{lead.company}</div>
                                </div>
                              </div>
                            </td>
                            <td className="py-2 md:py-3">
                              <span className={`px-1.5 md:px-2 py-0.5 md:py-1 rounded text-[10px] md:text-xs font-medium ${
                                lead.status === "Hot" ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"
                              }`}>
                                {lead.status}
                              </span>
                            </td>
                            <td className="py-2 md:py-3 hidden sm:table-cell">
                              <div className="flex gap-1 flex-wrap">
                                {lead.engagement.map((e, i) => (
                                  <span key={i} className="px-1.5 md:px-2 py-0.5 rounded bg-primary/10 text-primary text-[10px] md:text-xs">{e}</span>
                                ))}
                              </div>
                            </td>
                            <td className="py-2 md:py-3 text-gray-400 text-[10px] md:text-sm">{lead.time}</td>
                            <td className="py-2 md:py-3 pr-3 md:pr-0">
                              <div className={`text-sm md:text-lg font-bold ${lead.score >= 80 ? 'text-green-400' : lead.score >= 60 ? 'text-yellow-400' : 'text-gray-400'}`}>
                                {lead.score}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-12 md:py-20 px-4 md:px-6 relative z-[1]">
        <div className="container mx-auto max-w-6xl scroll-animate scroll-fade-up">
          <div className="text-center mb-8 md:mb-16">
            <p className="text-primary text-xs md:text-sm font-medium mb-2 md:mb-4">Was uns anders macht</p>
            <h2 className="text-2xl md:text-3xl lg:text-5xl font-bold mb-3 md:mb-4 text-white px-2">
              <span className="bg-gradient-to-r from-primary via-blue-400 to-purple-400 bg-clip-text text-transparent">KI-generierte Landingpages</span><br />
              mit Echtzeit-Tracking
            </h2>
            <p className="text-gray-300 text-sm md:text-lg max-w-2xl mx-auto px-2">
              Jeder Lead bekommt eine personalisierte Seite. Du siehst live, wer interessiert ist.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
            {features.map((feature, idx) => (
              <Card 
                key={idx} 
                className={`group hover:shadow-2xl hover:scale-105 transition-all duration-300 border-2 bg-white/[0.02] ${
                  feature.highlight 
                    ? "border-primary/50 shadow-lg shadow-primary/10" 
                    : "border-white/10 hover:border-primary/50"
                }`}
              >
                <CardHeader className="pb-2 md:pb-6">
                  <div className={`mb-3 md:mb-4 h-10 w-10 md:h-14 md:w-14 rounded-lg md:rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform ${
                    feature.highlight 
                      ? "bg-gradient-to-br from-primary to-purple-500" 
                      : "bg-gradient-to-br from-primary/80 to-primary/40"
                  }`}>
                    <feature.icon className="h-5 w-5 md:h-7 md:w-7 text-white" />
                  </div>
                  <CardTitle className="text-base md:text-xl text-white">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <CardDescription className="text-sm md:text-base">{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* AI Objection Handler Section */}
      <AIObjectionDemo />

      {/* Tracking Section */}
      <section id="tracking" className="py-12 md:py-20 px-4 md:px-6 relative z-[1]">
        <div className="container mx-auto max-w-6xl scroll-animate scroll-fade-up">
          <div className="grid lg:grid-cols-2 gap-8 md:gap-16 items-center">
            <div>
              <p className="text-primary text-xs md:text-sm font-medium mb-2 md:mb-4">Echtzeit-Tracking</p>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 md:mb-6 text-white">
                Sieh genau, wer<br />
                <span className="bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">interessiert ist</span>
              </h2>
              <p className="text-gray-300 text-sm md:text-lg mb-6 md:mb-8">
                Jede Aktion auf der Landingpage wird getrackt und in Echtzeit ausgewertet. 
                Du weißt genau, welche Leads heiß sind – bevor du sie kontaktierst.
              </p>
              <div className="grid grid-cols-2 gap-2 md:gap-4">
                {trackingFeatures.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2 md:gap-3 p-2 md:p-3 rounded-lg bg-white/[0.03] border border-white/10">
                    <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-primary mt-1.5 md:mt-2 flex-shrink-0"></div>
                    <div className="min-w-0">
                      <div className="text-white text-xs md:text-sm font-medium">{item.label}</div>
                      <div className="text-gray-400 text-[10px] md:text-xs">{item.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-2xl md:rounded-3xl blur-3xl"></div>
              <div className="relative rounded-xl md:rounded-2xl border border-white/10 bg-[#0d1117] p-4 md:p-6 space-y-3 md:space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-white font-medium text-sm md:text-base">Hot Leads</span>
                  <span className="px-2 py-0.5 md:py-1 rounded bg-primary/20 text-primary text-[10px] md:text-xs">Live</span>
                </div>
                {[
                  { name: "Max Müller", score: 85, action: "Video 100% geschaut", time: "vor 2 Min" },
                  { name: "Lisa Schmidt", score: 72, action: "CTA geklickt", time: "vor 5 Min" },
                  { name: "Thomas Weber", score: 65, action: "75% Video", time: "vor 12 Min" },
                ].map((lead, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 md:p-4 rounded-lg md:rounded-xl bg-white/[0.03] border border-white/10">
                    <div className="flex items-center gap-2 md:gap-4">
                      <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center text-white font-bold text-xs md:text-sm flex-shrink-0">
                        {lead.name.split(" ").map(n => n[0]).join("")}
                      </div>
                      <div className="min-w-0">
                        <div className="text-white font-medium text-xs md:text-base">{lead.name}</div>
                        <div className="text-gray-400 text-[10px] md:text-xs truncate">{lead.action} • {lead.time}</div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className={`text-sm md:text-lg font-bold ${lead.score >= 80 ? 'text-green-400' : lead.score >= 70 ? 'text-yellow-400' : 'text-primary'}`}>
                        {lead.score}
                      </div>
                      <div className="text-gray-500 text-[10px] md:text-xs">Score</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-12 md:py-20 px-4 md:px-6 relative z-[1]">
        <div className="container mx-auto max-w-6xl scroll-animate scroll-fade-up">
          <div className="text-center mb-8 md:mb-16">
            <p className="text-primary text-xs md:text-sm font-medium mb-2 md:mb-4">In 4 Schritten</p>
            <h2 className="text-2xl md:text-3xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent">
              So einfach funktioniert's
            </h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
            {steps.map((step, idx) => (
              <div key={idx} className="relative">
                {idx < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-10 left-full w-full h-0.5 bg-gradient-to-r from-primary to-transparent"></div>
                )}
                <div className="text-center">
                  <div className="mx-auto mb-3 md:mb-6 h-12 w-12 md:h-20 md:w-20 rounded-xl md:rounded-2xl bg-gradient-to-br from-primary to-purple-400 flex items-center justify-center text-white text-xl md:text-3xl font-bold shadow-lg shadow-primary/50">
                    {step.number}
                  </div>
                  <div className="mb-2 md:mb-4 h-6 w-6 md:h-10 md:w-10 mx-auto">
                    <step.icon className="h-full w-full text-primary" />
                  </div>
                  <h3 className="text-sm md:text-lg font-bold mb-1 md:mb-3 text-white">{step.title}</h3>
                  <p className="text-gray-400 text-xs md:text-sm">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-12 md:py-20 px-4 md:px-6 relative z-[1]">
        <div className="container mx-auto max-w-6xl scroll-animate scroll-fade-up">
          <div className="text-center mb-8 md:mb-16">
            <p className="text-primary text-xs md:text-sm font-medium mb-2 md:mb-4">Kundenstimmen</p>
            <h2 className="text-2xl md:text-3xl lg:text-5xl font-bold mb-3 md:mb-4 text-white">
              Echte Ergebnisse unserer Kunden
            </h2>
            <p className="text-gray-300 text-sm md:text-lg max-w-2xl mx-auto px-2">
              Sieh dir an, wie unsere Kunden mit Content-Leads ihre Umsätze steigern.
            </p>
          </div>
          
          <div className="space-y-4 md:space-y-8">
            {/* Testimonial 1 - Daddel GmbH */}
            <div className="bg-white/[0.03] rounded-xl md:rounded-2xl overflow-hidden border border-white/10 p-4 md:p-8">
              <div className="grid md:grid-cols-2 gap-4 md:gap-8 items-center">
                <div className="aspect-video bg-[#0d1117] rounded-lg md:rounded-xl overflow-hidden">
                  <iframe
                    src="https://www.youtube.com/embed/evcR2kC6otA"
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-3 md:mb-4">
                    <div>
                      <h3 className="text-lg md:text-2xl font-bold text-white">Daddel GmbH</h3>
                      <p className="text-gray-400 text-xs md:text-sm">Webseitenagentur</p>
                    </div>
                    <div className="flex gap-0.5 md:gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-3 h-3 md:w-5 md:h-5 fill-primary text-primary" />
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-2 md:space-y-4 mb-4 md:mb-6">
                    <p className="text-gray-300 text-xs md:text-base">
                      <span className="text-primary font-semibold">Vorher:</span> „Wir hatten keinen planbaren Kanal, um Neukunden zu gewinnen."
                    </p>
                    <p className="text-gray-300 text-xs md:text-base">
                      <span className="text-primary font-semibold">Nachher:</span> „In nur 60 Tagen von 10.000€ auf über 20.000€ monatlich gewachsen."
                    </p>
                  </div>
                  
                  <div className="inline-flex items-center gap-1.5 md:gap-2 bg-primary/10 border border-primary/30 rounded-lg px-2.5 md:px-4 py-2 md:py-3">
                    <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-primary flex-shrink-0" />
                    <span className="text-white font-semibold text-xs md:text-base">Von 10k auf 20k+ in 60 Tagen</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Testimonial 2 - Teo Hentzschel */}
            <div className="bg-white/[0.03] rounded-xl md:rounded-2xl overflow-hidden border border-white/10 p-4 md:p-8">
              <div className="grid md:grid-cols-2 gap-4 md:gap-8 items-center">
                <div className="order-2 md:order-1">
                  <div className="flex items-center justify-between mb-3 md:mb-4">
                    <div>
                      <h3 className="text-lg md:text-2xl font-bold text-white">Teo Hentzschel</h3>
                      <p className="text-gray-400 text-xs md:text-sm">Webseitenagentur</p>
                    </div>
                    <div className="flex gap-0.5 md:gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-3 h-3 md:w-5 md:h-5 fill-primary text-primary" />
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-2 md:space-y-4 mb-4 md:mb-6">
                    <p className="text-gray-300 text-xs md:text-base">
                      <span className="text-primary font-semibold">Vorher:</span> „Ich wusste nicht, wie ich über LinkedIn an Kunden komme."
                    </p>
                    <p className="text-gray-300 text-xs md:text-base">
                      <span className="text-primary font-semibold">Nachher:</span> „Nach nur 3 Tagen habe ich über LinkedIn 10.000€ abgeschlossen."
                    </p>
                  </div>
                  
                  <div className="inline-flex items-center gap-1.5 md:gap-2 bg-primary/10 border border-primary/30 rounded-lg px-2.5 md:px-4 py-2 md:py-3">
                    <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-primary flex-shrink-0" />
                    <span className="text-white font-semibold text-xs md:text-base">10.000€ in 3 Tagen via LinkedIn</span>
                  </div>
                </div>
                
                <div className="aspect-video bg-[#0d1117] rounded-lg md:rounded-xl overflow-hidden order-1 md:order-2">
                  <iframe
                    src="https://www.youtube.com/embed/fldoX_f864Y"
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            </div>

            {/* Testimonial 3 - Hendrik Hoffmann */}
            <div className="bg-white/[0.03] rounded-xl md:rounded-2xl overflow-hidden border border-white/10 p-4 md:p-8">
              <div className="grid md:grid-cols-2 gap-4 md:gap-8 items-center">
                <div className="aspect-video bg-[#0d1117] rounded-lg md:rounded-xl overflow-hidden">
                  <iframe
                    src="https://www.youtube.com/embed/PXuqgYS5uiE"
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-3 md:mb-4">
                    <div>
                      <h3 className="text-lg md:text-2xl font-bold text-white">Hendrik Hoffmann</h3>
                      <p className="text-gray-400 text-xs md:text-sm">Webseitenagentur</p>
                    </div>
                    <div className="flex gap-0.5 md:gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-3 h-3 md:w-5 md:h-5 fill-primary text-primary" />
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-2 md:space-y-4 mb-4 md:mb-6">
                    <p className="text-gray-300 text-xs md:text-base">
                      <span className="text-primary font-semibold">Vorher:</span> „Ich hatte keine planbare Methode, um konstant Kunden zu gewinnen."
                    </p>
                    <p className="text-gray-300 text-xs md:text-base">
                      <span className="text-primary font-semibold">Nachher:</span> „Bereits in den ersten 30 Tagen hatte ich 5-stellig zusätzlichen Cashflow."
                    </p>
                  </div>
                  
                  <div className="inline-flex items-center gap-1.5 md:gap-2 bg-primary/10 border border-primary/30 rounded-lg px-2.5 md:px-4 py-2 md:py-3">
                    <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-primary flex-shrink-0" />
                    <span className="text-white font-semibold text-xs md:text-base">5-stellig Cashflow in 30 Tagen</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-12 md:py-20 px-4 md:px-6 relative z-[1]">
        <div className="container mx-auto max-w-5xl scroll-animate scroll-fade-up">
          <div className="text-center mb-8 md:mb-12">
            <p className="text-primary text-xs md:text-sm font-medium mb-2 md:mb-4">Preise</p>
            <h2 className="text-2xl md:text-3xl lg:text-5xl font-bold mb-3 md:mb-4 text-white">
              Wähle dein Paket
            </h2>
            <p className="text-gray-300 text-sm md:text-lg max-w-2xl mx-auto px-2 mb-6">
              Beide Pakete beinhalten wöchentliches Live-Coaching.
            </p>
            
            {/* Billing Toggle */}
            <div className="inline-flex items-center gap-3 bg-white/5 border border-white/10 rounded-full p-1">
              <button
                onClick={() => setBillingPeriod('monthly')}
                className={`px-4 md:px-6 py-2 rounded-full text-sm font-medium transition-all ${
                  billingPeriod === 'monthly' 
                    ? 'bg-primary text-white' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Monatlich
              </button>
              <button
                onClick={() => setBillingPeriod('yearly')}
                className={`px-4 md:px-6 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                  billingPeriod === 'yearly' 
                    ? 'bg-primary text-white' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Jährlich
                <span className="bg-green-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                  -2 Monate
                </span>
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6 md:gap-8 max-w-4xl mx-auto">
            {/* Starter Plan */}
            <div className="relative rounded-2xl border-2 border-white/10 bg-white/[0.02] p-6 md:p-8 hover:border-white/20 transition-all">
              <div className="mb-6">
                <h3 className="text-xl md:text-2xl font-bold text-white mb-2">Starter</h3>
                <p className="text-gray-400 text-sm">Perfekt für den Einstieg</p>
              </div>
              
              <div className="mb-6">
                {billingPeriod === 'monthly' ? (
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl md:text-5xl font-bold text-white">149€</span>
                    <span className="text-gray-400">/Monat</span>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl md:text-5xl font-bold text-white">1.490€</span>
                      <span className="text-gray-400">/Jahr</span>
                    </div>
                    <p className="text-green-400 text-sm mt-1">Spare 298€ (2 Monate gratis)</p>
                  </div>
                )}
              </div>

              <ul className="space-y-3 mb-6">
                {[
                  "Pitchfirst Software – Kampagnen & CRM",
                  "Unbegrenzte KI-Landingpages",
                  "Echtzeit-Tracking & Lead-Scoring",
                  "Manuelles Telefonieren (mit Notizen)",
                  "1x/Woche Live-Gruppen-Coaching",
                  "Outreach-Videokurs inklusive"
                ].map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-gray-300 text-sm">
                    <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              
              {/* What's NOT included */}
              <div className="border-t border-white/10 pt-4 mb-6">
                <p className="text-gray-500 text-xs mb-2">Nicht enthalten:</p>
                <ul className="space-y-2">
                  {[
                    "KI-Telefonie aus dem Tool",
                    "KI-Anrufzusammenfassungen",
                    "KI Live-Einwandbehandlung",
                    "E-Mail-Vorlagen & Mail-Outreach"
                  ].map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-gray-500 text-sm">
                      <X className="h-4 w-4 flex-shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <a 
                href={billingPeriod === 'monthly' 
                  ? "https://buy.stripe.com/eVq4gz3p4es23sb8yKgMw09" 
                  : "https://buy.stripe.com/8x2dR98JocjU1k316igMw0a"}
                target="_blank"
                rel="noopener noreferrer"
                data-rewardful
              >
                <Button 
                  size="lg"
                  className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/20 h-12 md:h-14"
                >
                  Starter wählen
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </a>
            </div>

            {/* Pro Plan */}
            <div className="relative rounded-2xl border-2 border-primary bg-gradient-to-b from-primary/10 to-transparent p-6 md:p-8">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-primary text-white text-xs font-bold px-3 py-1 rounded-full">
                  BELIEBTESTE WAHL
                </span>
              </div>
              
              <div className="mb-6">
                <h3 className="text-xl md:text-2xl font-bold text-white mb-2">Pro</h3>
                <p className="text-gray-400 text-sm">Alle KI-Features inklusive</p>
              </div>
              
              <div className="mb-6">
                {billingPeriod === 'monthly' ? (
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl md:text-5xl font-bold text-white">299€</span>
                    <span className="text-gray-400">/Monat</span>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl md:text-5xl font-bold text-white">2.990€</span>
                      <span className="text-gray-400">/Jahr</span>
                    </div>
                    <p className="text-green-400 text-sm mt-1">Spare 598€ (2 Monate gratis)</p>
                  </div>
                )}
              </div>

              <ul className="space-y-3 mb-6">
                <li className="flex items-start gap-3 text-gray-300 text-sm">
                  <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span>Alles aus Starter, plus:</span>
                </li>
              </ul>
              
              {/* Pro-exclusive features highlighted */}
              <div className="bg-primary/10 border border-primary/30 rounded-xl p-4 mb-6">
                <p className="text-primary text-xs font-semibold mb-3">🚀 Exklusive Pro-Features:</p>
                <ul className="space-y-2">
                  {[
                    "KI-Telefonie direkt aus dem Tool",
                    "KI-Anrufzusammenfassungen nach jedem Call",
                    "KI Live-Einwandbehandlung Trainer",
                    "E-Mail-Vorlagen & Mail-Outreach"
                  ].map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-white text-sm font-medium">
                      <Sparkles className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <ul className="space-y-3 mb-6">
                {[
                  "1x/Woche Live-Gruppen-Coaching",
                  "Outreach-Videokurs inklusive"
                ].map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-gray-300 text-sm">
                    <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <a 
                href={billingPeriod === 'monthly' 
                  ? "https://buy.stripe.com/bJe3cv3p4fw68Mv9COgMw0b" 
                  : "https://buy.stripe.com/cNi3cv1gWfw6aUD16igMw0c"}
                target="_blank"
                rel="noopener noreferrer"
                data-rewardful
              >
                <Button
                  size="lg"
                  className="w-full bg-gradient-to-r from-primary to-blue-500 hover:opacity-90 text-white shadow-lg shadow-primary/30 h-12 md:h-14"
                >
                  Pro wählen
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 md:py-20 px-4 md:px-6 relative z-[1]">
        <div className="container mx-auto max-w-4xl scroll-animate scroll-scale">
          <div className="relative rounded-2xl md:rounded-3xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary via-blue-500 to-purple-500"></div>
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLW9wYWNpdHk9IjAuMSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30"></div>
            <div className="relative p-6 md:p-12 lg:p-16 text-center text-white">
              <h2 className="text-2xl md:text-3xl lg:text-5xl font-bold mb-4 md:mb-6 px-2">
                Bereit für mehr Termine<br />durch LinkedIn?
              </h2>
              <p className="text-sm md:text-xl mb-6 md:mb-8 opacity-95 max-w-2xl mx-auto px-2">
                Lass uns in einem kurzen Call zeigen, wie KI-generierte Landingpages 
                und Echtzeit-Tracking deine Outreach-Ergebnisse verdoppeln können.
              </p>
              <Button 
                size="lg" 
                onClick={() => window.open("https://calendly.com/zoepp-media/vorgesprach-demo-software", "_blank")}
                className="bg-white text-primary hover:bg-gray-100 shadow-2xl px-6 md:px-10 h-12 md:h-14 text-sm md:text-lg font-bold"
              >
                Jetzt Demo-Call buchen
                <ArrowRight className="ml-2 h-4 w-4 md:h-5 md:w-5" />
              </Button>
            </div>
          </div>
        </div>
      </section>


      {/* FAQ Section */}
      <section id="faq" className="py-12 md:py-20 px-4 md:px-6 relative z-[1]">
        <div className="container mx-auto max-w-4xl scroll-animate scroll-fade-up">
          <div className="text-center mb-8 md:mb-16">
            <p className="text-primary text-xs md:text-sm font-medium mb-2 md:mb-4">FAQ</p>
            <h2 className="text-2xl md:text-3xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent">
              Häufig gestellte Fragen
            </h2>
          </div>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, idx) => (
              <AccordionItem key={idx} value={`item-${idx}`} className="border-b-2 border-white/10">
                <AccordionTrigger className="text-sm md:text-lg font-semibold text-white hover:text-primary py-4 md:py-6 text-left">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-gray-300 text-xs md:text-base pb-4 md:pb-6">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 md:py-12 px-4 md:px-6 bg-[#0a0e27] relative z-[1]">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 mb-6 md:mb-8">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center mb-3 md:mb-4">
                <img src={pitchfirstLogo} alt="pitchfirst.io Logo" className="h-12 md:h-14" />
              </div>
              <p className="text-xs md:text-sm text-muted-foreground">
                LinkedIn Outreach mit KI-generierten Landingpages und Echtzeit-Tracking.
              </p>
            </div>
            <div>
              <h3 className="font-bold mb-2 md:mb-4 text-white text-sm md:text-base">Produkt</h3>
              <ul className="space-y-1.5 md:space-y-2 text-xs md:text-sm text-muted-foreground">
                <li><a href="#features" className="hover:text-primary transition-colors">Features</a></li>
                <li><a href="#tracking" className="hover:text-primary transition-colors">Tracking</a></li>
                <li><a href="#how-it-works" className="hover:text-primary transition-colors">So funktioniert's</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-2 md:mb-4 text-white text-sm md:text-base">Unternehmen</h3>
              <ul className="space-y-1.5 md:space-y-2 text-xs md:text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">Über uns</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Kontakt</a></li>
                <li><a href="/partner" className="hover:text-primary transition-colors">Partner werden</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-2 md:mb-4 text-white text-sm md:text-base">Rechtliches</h3>
              <ul className="space-y-1.5 md:space-y-2 text-xs md:text-sm text-muted-foreground">
                <li><a href="https://www.pitchfirst.io/datenschutz" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">Datenschutz</a></li>
                <li><a href="https://www.pitchfirst.io/impressum" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">Impressum</a></li>
                <li><a href="/agb" className="hover:text-primary transition-colors">AGB</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-6 md:pt-8 flex flex-col md:flex-row justify-between items-center text-xs md:text-sm text-muted-foreground gap-4">
            <p className="text-center md:text-left">© 2025 pitchfirst.io. Eine Marke der Zoepp Media UG.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-primary transition-colors">
                <Linkedin className="h-4 w-4 md:h-5 md:w-5" />
              </a>
              <a href="#" className="hover:text-primary transition-colors">
                <Mail className="h-4 w-4 md:h-5 md:w-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
