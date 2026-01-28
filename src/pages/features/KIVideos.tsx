import { FeaturePageTemplate } from "@/components/landing/FeaturePageTemplate";
import { Video, Sparkles, Users, Clock, Zap, Target, TrendingUp, CheckCircle, Play } from "lucide-react";
import aiVideoScreenshot from "@/assets/ai-video-screenshot.png";
import leadPageBuilderScreenshot from "@/assets/lead-page-builder-screenshot.png";

const KIVideos = () => {
  return (
    <FeaturePageTemplate
      badge="KI-Video Generierung"
      badgeIcon={Video}
      title="Personalisierte KI-Videos"
      subtitle="Erstelle automatisch Videos, die jeden Lead persönlich ansprechen – skalierbar und ohne Aufwand."
      heroImage={aiVideoScreenshot}
      heroImageAlt="KI-Video Generator Interface"
      quickFeatures={[
        {
          icon: Video,
          title: "Avatar-Videos",
          description: "Dein digitaler Zwilling spricht jeden Lead an"
        },
        {
          icon: Sparkles,
          title: "KI-Personalisierung",
          description: "Automatische Anpassung an jeden Lead"
        },
        {
          icon: Zap,
          title: "Batch-Generierung",
          description: "Hunderte Videos in Minuten"
        }
      ]}
      sections={[
        {
          title: "Dein Avatar spricht jeden Lead persönlich an",
          description: "Lade einmalig ein Pitch-Video hoch. Unsere KI erstellt daraus für jeden Lead ein personalisiertes Intro, in dem dein Avatar den Namen des Leads ausspricht. Das Ganze passiert vollautomatisch – du musst nichts mehr tun.",
          features: [
            { icon: Users, text: "Persönliche Ansprache mit Namen" },
            { icon: Video, text: "Lippensynchrone Animation" },
            { icon: Clock, text: "Video in unter 60 Sekunden" },
            { icon: Sparkles, text: "Natürliche Stimme & Gestik" }
          ],
          image: leadPageBuilderScreenshot,
          imageAlt: "KI-Video Personalisierung"
        },
        {
          title: "Skaliere deine Outreach ohne mehr Zeit zu investieren",
          description: "Früher hast du für jede personalisierte Nachricht Stunden gebraucht. Mit KI-generierten Videos erreichst du hunderte Leads mit der gleichen persönlichen Note – aber in einem Bruchteil der Zeit.",
          features: [
            { icon: Zap, text: "Batch-Generierung möglich" },
            { icon: Target, text: "Höhere Response-Rate" },
            { icon: TrendingUp, text: "Mehr Termine, weniger Aufwand" },
            { icon: CheckCircle, text: "Volle Kontrolle über Inhalte" }
          ],
          mockup: (
            <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-gradient-to-br from-purple-500/10 to-pink-500/10 p-8">
              <div className="bg-background/80 backdrop-blur-xl rounded-xl border border-white/10 p-6 space-y-4">
                <div className="aspect-video bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-background/50 to-transparent" />
                  <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-xl flex items-center justify-center z-10">
                    <Play className="h-8 w-8 text-white ml-1" />
                  </div>
                </div>
                <h3 className="text-xl font-bold">Hallo Max! 👋</h3>
                <p className="text-sm text-muted-foreground">
                  Ich habe dieses Video speziell für dich aufgenommen...
                </p>
              </div>
            </div>
          ),
          reversed: true
        }
      ]}
      benefits={[
        {
          icon: TrendingUp,
          title: "3x höhere Antwortrate",
          description: "Personalisierte Videos werden deutlich häufiger angesehen und beantwortet"
        },
        {
          icon: Clock,
          title: "90% Zeitersparnis",
          description: "Was früher Stunden dauerte, erledigt die KI in Sekunden"
        },
        {
          icon: Target,
          title: "Mehr Termine",
          description: "Persönliche Ansprache führt zu mehr gebuchten Demos"
        }
      ]}
    />
  );
};

export default KIVideos;
