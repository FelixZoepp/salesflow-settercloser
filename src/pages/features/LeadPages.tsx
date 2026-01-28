import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft,
  ArrowRight,
  Phone,
  Globe,
  Eye,
  MousePointer,
  Clock,
  BarChart3,
  Sparkles,
  CheckCircle,
  Play,
  Target,
  TrendingUp,
  Users,
  MessageSquare,
  Zap,
  Video,
  Bell
} from "lucide-react";
import pitchfirstLogo from "@/assets/pitchfirst-logo-white.png";
import leadPageBuilderScreenshot from "@/assets/lead-page-builder-screenshot.png";
import leadTrackingDashboard from "@/assets/lead-tracking-dashboard.png";

const LeadPages = () => {
  const navigate = useNavigate();

  const trackingFeatures = [
    {
      icon: Eye,
      title: "Seitenaufrufe",
      description: "Erfahre sofort, wenn ein Lead deine Seite öffnet"
    },
    {
      icon: Play,
      title: "Video-Tracking",
      description: "Sieh, wie lange das Video angeschaut wurde"
    },
    {
      icon: MousePointer,
      title: "Click-Tracking",
      description: "Tracke jeden Button-Klick und CTA"
    },
    {
      icon: Clock,
      title: "Verweildauer",
      description: "Miss, wie lange der Lead auf der Seite bleibt"
    },
    {
      icon: BarChart3,
      title: "Scroll-Tiefe",
      description: "Erfahre, wie weit gescrollt wurde"
    },
    {
      icon: Target,
      title: "Lead-Scoring",
      description: "Automatische Bewertung des Lead-Interesses"
    }
  ];

  const benefits = [
    {
      icon: TrendingUp,
      title: "Höhere Terminquote",
      description: "Rufe an, wenn der Lead gerade aktiv ist – perfektes Timing für 3x mehr Termine"
    },
    {
      icon: Users,
      title: "Vertrauen aufbauen",
      description: "Personalisierte Seiten mit Video schaffen Vertrauen noch vor dem ersten Anruf"
    },
    {
      icon: MessageSquare,
      title: "Bessere Gespräche",
      description: "Wisse genau, was den Lead interessiert hat – für relevante Gespräche"
    }
  ];

  const steps = [
    {
      number: "1",
      title: "Lead importieren",
      description: "Importiere Leads per CSV oder API. Jeder Lead bekommt automatisch eine eigene URL.",
      icon: Users
    },
    {
      number: "2",
      title: "Seite anpassen",
      description: "Nutze unseren KI-Konfigurator um Texte, Farben und Videos anzupassen – oder lass KI es machen.",
      icon: Sparkles
    },
    {
      number: "3",
      title: "Link versenden",
      description: "Versende den personalisierten Link per LinkedIn, E-Mail oder WhatsApp.",
      icon: Zap
    }
  ];

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-white/10">
        <div className="container mx-auto px-4 md:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate("/")}
                className="text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Zurück
              </Button>
              <img src={pitchfirstLogo} alt="PitchFirst" className="h-8" />
            </div>
            <a 
              href="https://calendly.com/zoepp-media/vorgesprach-demo-software"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button className="bg-primary hover:bg-primary/90">
                <Phone className="h-4 w-4 mr-2" />
                Demo buchen
              </Button>
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section - Landing Page Style */}
      <section className="pt-32 pb-20 px-4 md:px-6 relative">
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[100px] animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/15 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        <div className="container mx-auto max-w-7xl relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Text Content */}
            <div className="space-y-8">
              <Badge className="bg-primary/10 text-primary border-primary/20 px-4 py-2">
                <Globe className="h-4 w-4 mr-2" />
                Lead-Seiten Feature
              </Badge>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                Personalisierte Lead-Seiten
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400 block mt-2">
                  mit intelligentem Tracking
                </span>
              </h1>
              
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
                Erstelle in Sekunden individuelle Landing-Pages für jeden Lead. 
                Tracke jeden Klick, jedes Video-View und rufe im <span className="text-primary font-semibold">perfekten Moment</span> an.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <a 
                  href="https://calendly.com/zoepp-media/vorgesprach-demo-software"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button 
                    size="lg"
                    className="bg-gradient-to-r from-primary to-blue-500 hover:opacity-90 text-white shadow-2xl shadow-primary/50 px-8 h-14 text-lg w-full sm:w-auto"
                  >
                    <Phone className="mr-2 h-5 w-5" />
                    Jetzt Demo ansehen
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </a>
              </div>

              {/* Trust Indicators */}
              <div className="flex items-center gap-6 pt-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Keine Kreditkarte nötig</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>In 5 Min. eingerichtet</span>
                </div>
              </div>
            </div>

            {/* Right: Screenshot */}
            <div className="relative">
              <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-primary/20">
                {/* Browser Chrome */}
                <div className="bg-background/80 backdrop-blur-xl border-b border-white/10 px-4 py-3 flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/80" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                    <div className="w-3 h-3 rounded-full bg-green-500/80" />
                  </div>
                  <div className="flex-1 flex justify-center">
                    <div className="bg-white/5 rounded-lg px-4 py-1 text-xs text-muted-foreground">
                      pitchfirst.app/p/max-mustermann
                    </div>
                  </div>
                </div>
                <img 
                  src={leadPageBuilderScreenshot} 
                  alt="Lead-Seiten Builder" 
                  className="w-full"
                  loading="lazy"
                  decoding="async"
                />
              </div>
              
              {/* Floating Badge */}
              <div className="absolute -bottom-4 -right-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 rounded-xl shadow-lg flex items-center gap-2 animate-pulse">
                <Bell className="h-4 w-4" />
                <span className="text-sm font-medium">Lead aktiv!</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tracking Dashboard Section */}
      <section className="py-20 px-4 md:px-6 bg-gradient-to-b from-background to-muted/30">
        <div className="container mx-auto max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Screenshot */}
            <div className="order-2 lg:order-1">
              <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-blue-500/20">
                <div className="bg-background/80 backdrop-blur-xl border-b border-white/10 px-4 py-3 flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/80" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                    <div className="w-3 h-3 rounded-full bg-green-500/80" />
                  </div>
                  <div className="flex-1 flex justify-center">
                    <div className="bg-white/5 rounded-lg px-4 py-1 text-xs text-muted-foreground">
                      Lead-Tracking Dashboard
                    </div>
                  </div>
                </div>
                <img 
                  src={leadTrackingDashboard} 
                  alt="Lead-Tracking Dashboard" 
                  className="w-full"
                  loading="lazy"
                  decoding="async"
                />
              </div>
            </div>

            {/* Right: Text Content */}
            <div className="order-1 lg:order-2 space-y-8">
              <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 px-4 py-2">
                <BarChart3 className="h-4 w-4 mr-2" />
                Echtzeit-Tracking
              </Badge>
              
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight">
                Wisse genau, 
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 block">
                  was dein Lead macht
                </span>
              </h2>
              
              <p className="text-lg text-muted-foreground leading-relaxed">
                Jede Interaktion wird in Echtzeit getrackt – du weißt immer, 
                wann der perfekte Moment für einen Anruf ist. Bekomme <span className="text-blue-400 font-semibold">sofortige Benachrichtigungen</span>, wenn ein Lead aktiv wird.
              </p>

              {/* Tracking Features Grid */}
              <div className="grid sm:grid-cols-2 gap-4">
                {trackingFeatures.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <feature.icon className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">{feature.title}</h4>
                      <p className="text-xs text-muted-foreground">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20 px-4 md:px-6">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 px-4 py-2">
              <Sparkles className="h-4 w-4 mr-1" />
              So funktioniert's
            </Badge>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              In 3 Schritten zur perfekten Lead-Seite
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Starte in wenigen Minuten und beginne sofort damit, deine Leads besser zu verstehen.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, idx) => (
              <Card key={idx} className="bg-background/50 border-white/10 relative overflow-hidden group hover:border-primary/30 transition-all duration-300">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <CardContent className="pt-8 pb-8 relative z-10">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-6 border border-primary/20">
                    <span className="text-2xl font-bold text-primary">{step.number}</span>
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                  <p className="text-muted-foreground">
                    {step.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 px-4 md:px-6 bg-gradient-to-b from-transparent via-primary/5 to-transparent">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-green-500/10 text-green-400 border-green-500/20 px-4 py-2">
              <CheckCircle className="h-4 w-4 mr-1" />
              Deine Vorteile
            </Badge>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              Warum Lead-Seiten funktionieren
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {benefits.map((benefit, idx) => (
              <div key={idx} className="text-center group">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-blue-500/10 flex items-center justify-center mx-auto mb-6 border border-white/10 group-hover:scale-110 transition-transform duration-300">
                  <benefit.icon className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{benefit.title}</h3>
                <p className="text-muted-foreground">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Video Feature Highlight */}
      <section className="py-20 px-4 md:px-6">
        <div className="container mx-auto max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20 px-4 py-2">
                <Video className="h-4 w-4 mr-2" />
                Personalisierte Videos
              </Badge>
              
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight">
                Videos, die 
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 block">
                  Vertrauen aufbauen
                </span>
              </h2>
              
              <p className="text-lg text-muted-foreground leading-relaxed">
                Füge personalisierte Videos hinzu, die den Lead direkt ansprechen. 
                Mit unserem <span className="text-purple-400 font-semibold">KI-Konfigurator</span> erstellst du individuelle Seiten in Sekunden.
              </p>

              <ul className="space-y-4">
                {[
                  "Automatische Personalisierung mit Lead-Namen",
                  "Video-Watch-Time Tracking bis zur Sekunde",
                  "Benachrichtigung wenn Video angesehen wird",
                  "Höhere Antwortrate durch persönliche Ansprache"
                ].map((item, idx) => (
                  <li key={idx} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    </div>
                    <span className="text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Video Preview Mockup */}
            <div className="relative">
              <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-gradient-to-br from-purple-500/10 to-pink-500/10 p-8 md:p-12">
                <div className="bg-background/80 backdrop-blur-xl rounded-xl border border-white/10 p-6 space-y-4">
                  <div className="aspect-video bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-xl flex items-center justify-center z-10">
                      <Play className="h-8 w-8 text-white ml-1" />
                    </div>
                    <div className="absolute bottom-3 left-3 text-white text-sm font-medium">
                      Video für Max Mustermann
                    </div>
                  </div>
                  <h3 className="text-xl font-bold">Hallo Max! 👋</h3>
                  <p className="text-sm text-muted-foreground">
                    Ich habe dieses Video speziell für dich aufgenommen...
                  </p>
                  <Button className="w-full bg-gradient-to-r from-purple-500 to-pink-500">
                    Termin vereinbaren
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 md:px-6">
        <div className="container mx-auto max-w-4xl">
          <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-blue-500/10 border-primary/20 overflow-hidden relative">
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute -top-20 -right-20 w-60 h-60 bg-primary/20 rounded-full blur-3xl" />
              <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-blue-500/20 rounded-full blur-3xl" />
            </div>
            <CardContent className="p-8 md:p-12 text-center relative z-10">
              <Badge className="mb-6 bg-white/10 text-white border-white/20 px-4 py-2">
                <Sparkles className="h-4 w-4 mr-2" />
                Jetzt starten
              </Badge>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
                Bereit für mehr Termine?
              </h2>
              <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                Lass uns in einer kurzen Demo zeigen, wie du mit personalisierten Lead-Seiten 
                deine Terminquote verdreifachen kannst.
              </p>
              <a 
                href="https://calendly.com/zoepp-media/vorgesprach-demo-software"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button 
                  size="lg"
                  className="bg-gradient-to-r from-primary to-blue-500 hover:opacity-90 text-white shadow-2xl shadow-primary/50 px-10 h-16 text-lg"
                >
                  <Phone className="mr-2 h-6 w-6" />
                  Kostenlose Demo buchen
                  <ArrowRight className="ml-2 h-6 w-6" />
                </Button>
              </a>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 md:px-6 border-t border-white/10">
        <div className="container mx-auto max-w-7xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <img src={pitchfirstLogo} alt="PitchFirst" className="h-6" />
            <div className="flex gap-6 text-sm text-muted-foreground">
              <a href="/agb" className="hover:text-foreground transition-colors">Impressum</a>
              <a href="/agb" className="hover:text-foreground transition-colors">Datenschutz</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LeadPages;
