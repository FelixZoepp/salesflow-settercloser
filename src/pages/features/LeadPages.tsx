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
  MessageSquare
} from "lucide-react";
import pitchfirstLogo from "@/assets/pitchfirst-logo-white.png";

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

  return (
    <div className="min-h-screen bg-background">
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

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4 md:px-6">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
              <Globe className="h-3 w-3 mr-1" />
              Lead-Seiten Feature
            </Badge>
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Personalisierte Lead-Seiten
              <span className="text-primary block mt-2">mit intelligentem Tracking</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Erstelle in Sekunden individuelle Landing-Pages für jeden Lead. 
              Tracke jeden Klick und rufe im perfekten Moment an.
            </p>
            <a 
              href="https://calendly.com/zoepp-media/vorgesprach-demo-software"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button 
                size="lg"
                className="bg-gradient-to-r from-primary to-blue-500 hover:opacity-90 text-white shadow-2xl shadow-primary/50 px-8 h-14 text-lg"
              >
                <Phone className="mr-2 h-5 w-5" />
                Jetzt Demo ansehen
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </a>
          </div>

          {/* Preview Image Placeholder */}
          <div className="relative rounded-2xl border border-white/10 bg-gradient-to-br from-primary/5 to-blue-500/5 p-8 md:p-12 overflow-hidden">
            <div className="absolute inset-0 bg-grid-white/5" />
            <div className="relative z-10">
              <div className="bg-background/50 backdrop-blur rounded-xl border border-white/10 p-6 md:p-8">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="ml-4 text-sm text-muted-foreground">pitchfirst.app/p/max-mustermann</span>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="h-40 bg-gradient-to-br from-primary/20 to-blue-500/20 rounded-lg flex items-center justify-center">
                      <Play className="h-12 w-12 text-primary" />
                    </div>
                    <div className="text-sm text-muted-foreground">Personalisiertes Video für den Lead</div>
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-xl font-bold">Hallo Max! 👋</h3>
                    <p className="text-muted-foreground text-sm">
                      Ich habe dieses Video speziell für dich aufgenommen...
                    </p>
                    <Button className="w-full bg-primary">
                      Termin vereinbaren
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-16 px-4 md:px-6 bg-muted/30">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
              <Sparkles className="h-3 w-3 mr-1" />
              So funktioniert's
            </Badge>
            <h2 className="text-2xl md:text-4xl font-bold mb-4">
              In 3 Schritten zur perfekten Lead-Seite
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <Card className="bg-background/50 border-white/10">
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <span className="text-xl font-bold text-primary">1</span>
                </div>
                <h3 className="text-lg font-semibold mb-2">Lead importieren</h3>
                <p className="text-muted-foreground text-sm">
                  Importiere Leads per CSV oder API. Jeder Lead bekommt automatisch eine eigene URL.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-background/50 border-white/10">
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <span className="text-xl font-bold text-primary">2</span>
                </div>
                <h3 className="text-lg font-semibold mb-2">Seite anpassen</h3>
                <p className="text-muted-foreground text-sm">
                  Nutze unseren KI-Konfigurator um Texte, Farben und Videos anzupassen – oder lass KI es machen.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-background/50 border-white/10">
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <span className="text-xl font-bold text-primary">3</span>
                </div>
                <h3 className="text-lg font-semibold mb-2">Link versenden</h3>
                <p className="text-muted-foreground text-sm">
                  Versende den personalisierten Link per LinkedIn, E-Mail oder WhatsApp.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Tracking Features */}
      <section className="py-16 px-4 md:px-6">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
              <BarChart3 className="h-3 w-3 mr-1" />
              Echtzeit-Tracking
            </Badge>
            <h2 className="text-2xl md:text-4xl font-bold mb-4">
              Wisse genau, was dein Lead macht
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Jede Interaktion wird in Echtzeit getrackt – du weißt immer, 
              wann der perfekte Moment für einen Anruf ist.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trackingFeatures.map((feature, idx) => (
              <Card key={idx} className="bg-background/50 border-white/10 hover:border-primary/30 transition-colors">
                <CardContent className="pt-6">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 px-4 md:px-6 bg-gradient-to-b from-primary/5 to-transparent">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
              <CheckCircle className="h-3 w-3 mr-1" />
              Deine Vorteile
            </Badge>
            <h2 className="text-2xl md:text-4xl font-bold mb-4">
              Warum Lead-Seiten funktionieren
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {benefits.map((benefit, idx) => (
              <div key={idx} className="text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <benefit.icon className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{benefit.title}</h3>
                <p className="text-muted-foreground text-sm">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 md:px-6">
        <div className="container mx-auto max-w-3xl">
          <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-blue-500/10 border-primary/20">
            <CardContent className="p-8 md:p-12 text-center">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">
                Bereit für mehr Termine?
              </h2>
              <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
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
                  className="bg-gradient-to-r from-primary to-blue-500 hover:opacity-90 text-white shadow-2xl shadow-primary/50 px-8 h-14 text-lg"
                >
                  <Phone className="mr-2 h-5 w-5" />
                  Kostenlose Demo buchen
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </a>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 md:px-6 border-t border-white/10">
        <div className="container mx-auto max-w-5xl">
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
