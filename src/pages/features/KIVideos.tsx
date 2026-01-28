import { FeaturePageTemplate } from "@/components/landing/FeaturePageTemplate";
import { Video, Sparkles, Users, Clock, Zap, Target, TrendingUp, CheckCircle, Play, User } from "lucide-react";

const KIVideos = () => {
  // Apple-style Video Generator Mockup
  const VideoGeneratorMockup = () => (
    <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-gradient-to-br from-purple-500/5 to-pink-500/5 p-2">
      {/* Browser Chrome */}
      <div className="rounded-xl bg-[#0d1117] overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span className="ml-4 text-xs text-gray-500">pitchfirst.io/p/max-mustermann</span>
        </div>
        
        <div className="p-6 space-y-4">
          {/* Video Player Mockup */}
          <div className="aspect-video bg-gradient-to-br from-purple-500/30 to-pink-500/30 rounded-xl relative overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-xl flex items-center justify-center">
                <Play className="h-8 w-8 text-white ml-1" />
              </div>
            </div>
            {/* Avatar placeholder */}
            <div className="absolute bottom-4 left-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/50 flex items-center justify-center">
                <User className="h-5 w-5 text-white" />
              </div>
              <div className="bg-black/50 backdrop-blur px-3 py-1 rounded-lg">
                <span className="text-white text-sm">Dein Avatar spricht...</span>
              </div>
            </div>
            {/* Progress bar */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
              <div className="w-1/3 h-full bg-primary" />
            </div>
          </div>
          
          {/* Personalization Info */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
            <h3 className="text-xl font-bold text-white">Hallo Max! 👋</h3>
            <p className="text-sm text-gray-400">
              Ich habe dieses Video speziell für dich aufgenommen...
            </p>
            <div className="flex gap-2 flex-wrap">
              <span className="px-2 py-1 rounded-lg bg-purple-500/20 text-purple-400 text-xs">✓ Name personalisiert</span>
              <span className="px-2 py-1 rounded-lg bg-pink-500/20 text-pink-400 text-xs">✓ Firma erwähnt</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Batch Generation Mockup
  const BatchGenerationMockup = () => (
    <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-gradient-to-br from-purple-500/10 to-pink-500/10 p-8">
      <div className="bg-background/80 backdrop-blur-xl rounded-xl border border-white/10 p-6 space-y-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="font-medium">Video-Generierung</div>
            <div className="text-sm text-muted-foreground">47 von 100 Videos fertig</div>
          </div>
        </div>
        
        {/* Progress */}
        <div className="space-y-2">
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div className="w-[47%] h-full bg-gradient-to-r from-purple-500 to-pink-500" />
          </div>
        </div>
        
        {/* Video List */}
        <div className="space-y-2">
          {[
            { name: "Max Mustermann", status: "done" },
            { name: "Anna Schmidt", status: "done" },
            { name: "Peter Meyer", status: "processing" },
            { name: "Laura Weber", status: "pending" }
          ].map((item, idx) => (
            <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-white/5">
              <span className="text-sm">{item.name}</span>
              <span className={`text-xs px-2 py-1 rounded ${
                item.status === 'done' ? 'bg-green-500/20 text-green-400' :
                item.status === 'processing' ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-white/10 text-gray-400'
              }`}>
                {item.status === 'done' ? '✓ Fertig' : 
                 item.status === 'processing' ? '⟳ Generiert...' : 'Ausstehend'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <FeaturePageTemplate
      badge="KI-Video Generierung"
      badgeIcon={Video}
      title="Personalisierte KI-Videos"
      subtitle="Erstelle automatisch Videos, die jeden Lead persönlich ansprechen – skalierbar und ohne Aufwand."
      heroImage=""
      heroImageAlt=""
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
          mockup: <VideoGeneratorMockup />
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
          mockup: <BatchGenerationMockup />,
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
