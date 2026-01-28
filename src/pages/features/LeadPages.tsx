import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
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
  Video,
  Bell,
  Zap,
  Users,
  TrendingUp
} from "lucide-react";
import pitchfirstLogo from "@/assets/pitchfirst-logo-white.png";
import leadPageBuilderScreenshot from "@/assets/lead-page-builder-screenshot.png";
import leadTrackingDashboard from "@/assets/lead-tracking-dashboard.png";

const LeadPages = () => {
  const navigate = useNavigate();

  const quickFeatures = [
    {
      icon: Globe,
      title: "Personalisierte Seiten",
      description: "Jeder Lead bekommt seine eigene URL"
    },
    {
      icon: BarChart3,
      title: "Echtzeit-Tracking",
      description: "Sieh jede Interaktion live"
    },
    {
      icon: Bell,
      title: "Sofort-Benachrichtigungen",
      description: "Werde informiert wenn Leads aktiv sind"
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

      {/* Hero Section - Centered like LearningSuite */}
      <section className="pt-32 pb-12 px-4 md:px-6 relative">
        <div className="container mx-auto max-w-5xl text-center">
          <Badge className="mb-6 bg-primary/10 text-primary border-primary/20 px-4 py-2 text-sm uppercase tracking-wider">
            Lead-Seiten Erstellung
          </Badge>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            Personalisierte Lead-Seiten
          </h1>
          
          <p className="text-xl md:text-2xl text-primary/80 mb-12 max-w-3xl mx-auto">
            Der perfekte Weg, um Vertrauen aufzubauen und im richtigen Moment anzurufen.
          </p>

          {/* Main Hero Screenshot */}
          <div className="relative max-w-4xl mx-auto">
            <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-primary/20 bg-gradient-to-br from-primary/5 to-blue-500/5">
              <img 
                src={leadPageBuilderScreenshot} 
                alt="Lead-Seiten Builder" 
                className="w-full"
                loading="lazy"
                decoding="async"
              />
            </div>
            
            {/* Floating notification */}
            <div className="absolute -bottom-4 right-8 bg-gradient-to-r from-primary to-blue-500 text-white px-4 py-2 rounded-xl shadow-lg flex items-center gap-2 animate-pulse">
              <Bell className="h-4 w-4" />
              <span className="text-sm font-medium">Lead aktiv!</span>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Features Row */}
      <section className="py-12 px-4 md:px-6">
        <div className="container mx-auto max-w-5xl">
          <p className="text-center text-sm uppercase tracking-wider text-muted-foreground mb-8">
            Alle Funktionen die du brauchst für mehr Termine
          </p>
          
          <div className="grid md:grid-cols-3 gap-8">
            {quickFeatures.map((feature, idx) => (
              <div key={idx} className="text-center">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section Divider */}
      <div className="container mx-auto max-w-4xl px-4">
        <div className="border-t border-white/10" />
      </div>

      {/* Feature Section 1: Tracking - Left Text, Right Image */}
      <section className="py-20 px-4 md:px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold">
                Echtzeit-Tracking: Wisse genau was dein Lead macht
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Mit unserem intelligenten Tracking siehst du in Echtzeit, wann ein Lead deine Seite besucht, 
                wie lange er Videos schaut und auf welche Buttons er klickt. So weißt du immer, wann der 
                <span className="text-primary font-medium"> perfekte Moment </span> für einen Anruf ist.
              </p>
              
              <div className="grid sm:grid-cols-2 gap-4 pt-4">
                {[
                  { icon: Eye, text: "Seitenaufrufe tracken" },
                  { icon: Play, text: "Video-Watch-Time messen" },
                  { icon: MousePointer, text: "Klicks erfassen" },
                  { icon: Clock, text: "Verweildauer analysieren" },
                  { icon: BarChart3, text: "Scroll-Tiefe messen" },
                  { icon: Target, text: "Automatisches Lead-Scoring" }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <item.icon className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-sm">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="rounded-2xl overflow-hidden border border-white/10 shadow-xl">
                <img 
                  src={leadTrackingDashboard} 
                  alt="Lead-Tracking Dashboard" 
                  className="w-full"
                  loading="lazy"
                  decoding="async"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Section 2: Video - Right Text, Left Image */}
      <section className="py-20 px-4 md:px-6 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Video Preview Mockup */}
            <div className="order-2 lg:order-1">
              <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-gradient-to-br from-primary/5 to-blue-500/5 p-6 md:p-8">
                <div className="bg-background/80 backdrop-blur-xl rounded-xl border border-white/10 p-6 space-y-4">
                  <div className="aspect-video bg-gradient-to-br from-primary/20 to-blue-500/20 rounded-lg flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-t from-background/50 to-transparent" />
                    <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-xl flex items-center justify-center z-10">
                      <Play className="h-8 w-8 text-white ml-1" />
                    </div>
                    <div className="absolute bottom-3 left-3 text-foreground text-sm font-medium">
                      Video für Max Mustermann
                    </div>
                  </div>
                  <h3 className="text-xl font-bold">Hallo Max! 👋</h3>
                  <p className="text-sm text-muted-foreground">
                    Ich habe dieses Video speziell für dich aufgenommen...
                  </p>
                  <Button className="w-full bg-primary hover:bg-primary/90">
                    Termin vereinbaren
                  </Button>
                </div>
              </div>
            </div>

            {/* Right: Text */}
            <div className="order-1 lg:order-2 space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold">
                Personalisierte Videos: Baue Vertrauen auf bevor du anrufst
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Mit personalisierten Video-Nachrichten sprichst du jeden Lead direkt an. 
                Das schafft <span className="text-primary font-medium">Vertrauen und Verbindung</span> noch 
                bevor das erste Telefonat stattfindet – und macht deine Kaltakquise zur Warmakquise.
              </p>
              
              <ul className="space-y-3 pt-4">
                {[
                  "Automatische Personalisierung mit Lead-Namen",
                  "Video-Watch-Time Tracking bis zur Sekunde",
                  "Benachrichtigung wenn Video angesehen wird",
                  "Höhere Antwortrate durch persönliche Ansprache"
                ].map((item, idx) => (
                  <li key={idx} className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Section 3: KI-Konfigurator - Left Text, Right Visual */}
      <section className="py-20 px-4 md:px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold">
                KI-Konfigurator: Erstelle Seiten in Sekunden
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Unser intelligenter Konfigurator nutzt KI, um deine Lead-Seiten automatisch zu personalisieren. 
                Beschreibe einfach, was du möchtest, und die KI passt Texte, Farben und Layout für dich an – 
                <span className="text-primary font-medium"> in wenigen Sekunden</span>.
              </p>
              
              <div className="space-y-4 pt-4">
                {[
                  { icon: Sparkles, title: "KI-generierte Texte", desc: "Optimierte Inhalte für deine Zielgruppe" },
                  { icon: Zap, title: "Schnelle Anpassung", desc: "Ändere alles mit einem Prompt" },
                  { icon: Video, title: "Video-Integration", desc: "Füge einfach personalisierte Videos hinzu" }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/5">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <item.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium">{item.title}</h4>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Visual representation */}
            <div className="relative">
              <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-primary/10 via-blue-500/5 to-purple-500/10 p-8 space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <Sparkles className="h-5 w-5 text-primary" />
                  </div>
                  <span className="font-medium">KI-Konfigurator</span>
                </div>
                
                <div className="bg-background/50 backdrop-blur rounded-xl border border-white/10 p-4">
                  <p className="text-sm text-muted-foreground mb-3">Dein Prompt:</p>
                  <p className="text-sm italic">"Erstelle eine Seite für IT-Entscheider mit Fokus auf Effizienz und ROI"</p>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  Generiere personalisierte Inhalte...
                </div>
                
                <div className="grid grid-cols-3 gap-3">
                  {["Headline", "Texte", "Farben"].map((item, idx) => (
                    <div key={idx} className="bg-primary/10 rounded-lg p-3 text-center text-sm">
                      <CheckCircle className="h-4 w-4 text-primary mx-auto mb-1" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4 md:px-6 bg-muted/30">
        <div className="container mx-auto max-w-5xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Warum Lead-Seiten funktionieren
          </h2>
          <p className="text-lg text-muted-foreground mb-12 max-w-2xl mx-auto">
            Verwandle kalte Leads in warme Gespräche
          </p>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: TrendingUp,
                title: "3x mehr Termine",
                description: "Rufe an, wenn der Lead gerade aktiv ist – perfektes Timing macht den Unterschied"
              },
              {
                icon: Users,
                title: "Vertrauen aufbauen",
                description: "Personalisierte Seiten mit Video schaffen Vertrauen noch vor dem ersten Anruf"
              },
              {
                icon: Target,
                title: "Bessere Gespräche",
                description: "Wisse genau, was den Lead interessiert hat – für relevante Gespräche"
              }
            ].map((benefit, idx) => (
              <div key={idx} className="text-center p-6">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <benefit.icon className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{benefit.title}</h3>
                <p className="text-muted-foreground">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 md:px-6">
        <div className="container mx-auto max-w-3xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Bereit für mehr Termine?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
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
              className="bg-gradient-to-r from-primary to-blue-500 hover:opacity-90 text-white shadow-2xl shadow-primary/50 px-10 h-14 text-lg"
            >
              <Phone className="mr-2 h-5 w-5" />
              Kostenlose Demo buchen
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 md:px-6 border-t border-white/10">
        <div className="container mx-auto max-w-6xl">
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
