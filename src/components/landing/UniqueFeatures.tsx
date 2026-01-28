import { useState } from "react";
import { Mic, Eye, Video, Users, Phone, Sparkles, CheckCircle, Play, TrendingUp, Clock, Bell } from "lucide-react";
import { cn } from "@/lib/utils";

interface UniqueFeature {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  mockup: React.ReactNode;
}

// Mockup Components
const LiveObjectionMockup = () => (
  <div className="bg-[#0d1117] rounded-xl border border-white/10 overflow-hidden shadow-2xl">
    <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10 bg-white/5">
      <div className="w-3 h-3 rounded-full bg-red-500" />
      <div className="w-3 h-3 rounded-full bg-yellow-500" />
      <div className="w-3 h-3 rounded-full bg-green-500" />
      <span className="ml-3 text-xs text-gray-500">Live Call - Max Mustermann</span>
      <div className="ml-auto flex items-center gap-2">
        <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-xs flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          LIVE
        </span>
      </div>
    </div>
    <div className="p-6 space-y-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
          <Mic className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1">
          <p className="text-xs text-gray-500 mb-1">Lead sagt:</p>
          <div className="bg-white/5 rounded-lg p-3 border border-white/10">
            <p className="text-white text-sm">"Das ist mir gerade zu teuer..."</p>
          </div>
        </div>
      </div>
      
      <div className="bg-gradient-to-r from-primary/20 to-blue-500/20 rounded-xl p-4 border border-primary/30">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-primary text-sm font-medium">KI-Antwortvorschlag</span>
        </div>
        <p className="text-white text-sm leading-relaxed">
          "Verstehe ich total. Darf ich fragen: Wenn der Preis keine Rolle spielen würde – wäre das grundsätzlich interessant für Sie?"
        </p>
        <div className="flex gap-2 mt-3">
          <span className="px-2 py-1 rounded bg-green-500/20 text-green-400 text-xs">✓ Einwand isolieren</span>
          <span className="px-2 py-1 rounded bg-blue-500/20 text-blue-400 text-xs">Interesse prüfen</span>
        </div>
      </div>
    </div>
  </div>
);

const RealtimeTrackingMockup = () => (
  <div className="bg-[#0d1117] rounded-xl border border-white/10 overflow-hidden shadow-2xl">
    <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10 bg-white/5">
      <div className="w-3 h-3 rounded-full bg-red-500" />
      <div className="w-3 h-3 rounded-full bg-yellow-500" />
      <div className="w-3 h-3 rounded-full bg-green-500" />
      <span className="ml-3 text-xs text-gray-500">Echtzeit-Dashboard</span>
    </div>
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-3 p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg animate-pulse">
        <Bell className="w-5 h-5 text-orange-400" />
        <div className="flex-1">
          <p className="text-orange-400 text-sm font-medium">Hot Lead aktiv!</p>
          <p className="text-xs text-gray-400">Thomas Schmidt schaut gerade dein Video</p>
        </div>
        <span className="text-xs text-orange-400">Jetzt</span>
      </div>
      
      <div className="space-y-3">
        {[
          { name: "Thomas Schmidt", action: "Video 75%", time: "vor 2 Min", hot: true },
          { name: "Lisa Weber", action: "CTA geklickt", time: "vor 5 Min", hot: true },
          { name: "Michael Braun", action: "Seite geöffnet", time: "vor 12 Min", hot: false },
        ].map((lead, idx) => (
          <div key={idx} className={cn(
            "flex items-center gap-3 p-3 rounded-lg border",
            lead.hot ? "bg-primary/10 border-primary/30" : "bg-white/5 border-white/10"
          )}>
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
              lead.hot ? "bg-primary text-primary-foreground" : "bg-gray-700 text-gray-300"
            )}>
              {lead.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="flex-1">
              <p className="text-white text-sm">{lead.name}</p>
              <p className="text-xs text-gray-400">{lead.action}</p>
            </div>
            <span className="text-xs text-gray-500">{lead.time}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const AIVideoMockup = () => (
  <div className="bg-[#0d1117] rounded-xl border border-white/10 overflow-hidden shadow-2xl">
    <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10 bg-white/5">
      <div className="w-3 h-3 rounded-full bg-red-500" />
      <div className="w-3 h-3 rounded-full bg-yellow-500" />
      <div className="w-3 h-3 rounded-full bg-green-500" />
      <span className="ml-3 text-xs text-gray-500">pitchfirst.io/p/max-mustermann</span>
    </div>
    <div className="p-6">
      <div className="relative rounded-xl overflow-hidden bg-gradient-to-br from-primary/30 to-purple-500/30 aspect-video flex items-center justify-center mb-4">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center cursor-pointer hover:scale-110 transition-transform">
            <Play className="w-8 h-8 text-white ml-1" />
          </div>
        </div>
        <div className="absolute bottom-3 left-3 px-3 py-1 rounded-full bg-black/50 text-white text-xs">
          <span className="text-primary font-medium">Hey Max</span>, ich hab dir was aufgenommen...
        </div>
      </div>
      <div className="flex gap-2">
        <span className="px-2 py-1 rounded bg-green-500/20 text-green-400 text-xs flex items-center gap-1">
          <CheckCircle className="w-3 h-3" /> Personalisiert
        </span>
        <span className="px-2 py-1 rounded bg-blue-500/20 text-blue-400 text-xs">KI-generiert</span>
        <span className="px-2 py-1 rounded bg-purple-500/20 text-purple-400 text-xs">Auto-Tracking</span>
      </div>
    </div>
  </div>
);

const CRMPipelineMockup = () => (
  <div className="bg-[#0d1117] rounded-xl border border-white/10 overflow-hidden shadow-2xl">
    <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10 bg-white/5">
      <div className="w-3 h-3 rounded-full bg-red-500" />
      <div className="w-3 h-3 rounded-full bg-yellow-500" />
      <div className="w-3 h-3 rounded-full bg-green-500" />
      <span className="ml-3 text-xs text-gray-500">Deal Pipeline</span>
    </div>
    <div className="p-4">
      <div className="flex gap-3 overflow-x-auto pb-2">
        {[
          { stage: "Erstgespräch", count: 8, color: "blue" },
          { stage: "Beratung", count: 5, color: "purple" },
          { stage: "Abschluss", count: 3, color: "green" },
        ].map((stage, idx) => (
          <div key={idx} className="min-w-[140px] flex-shrink-0">
            <div className={cn(
              "px-3 py-2 rounded-t-lg text-xs font-medium flex items-center justify-between",
              stage.color === "blue" && "bg-blue-500/20 text-blue-400",
              stage.color === "purple" && "bg-purple-500/20 text-purple-400",
              stage.color === "green" && "bg-green-500/20 text-green-400"
            )}>
              {stage.stage}
              <span className="bg-white/10 px-1.5 py-0.5 rounded text-[10px]">{stage.count}</span>
            </div>
            <div className="bg-white/5 rounded-b-lg p-2 space-y-2 min-h-[100px]">
              {[1, 2].map((_, cardIdx) => (
                <div key={cardIdx} className="bg-white/5 rounded p-2 border border-white/10">
                  <p className="text-white text-xs mb-1">Lead #{idx * 2 + cardIdx + 1}</p>
                  <p className="text-[10px] text-gray-500">€{(Math.random() * 10000).toFixed(0)}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const PowerDialerMockup = () => (
  <div className="bg-[#0d1117] rounded-xl border border-white/10 overflow-hidden shadow-2xl">
    <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10 bg-white/5">
      <div className="w-3 h-3 rounded-full bg-red-500" />
      <div className="w-3 h-3 rounded-full bg-yellow-500" />
      <div className="w-3 h-3 rounded-full bg-green-500" />
      <span className="ml-3 text-xs text-gray-500">Power Dialer</span>
    </div>
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white font-medium">Thomas Schmidt</p>
          <p className="text-sm text-gray-400">+49 176 1234567</p>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-400">02:34</span>
        </div>
      </div>
      
      <div className="flex justify-center gap-4">
        <button className="w-14 h-14 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center hover:bg-red-500/30 transition-colors">
          <Phone className="w-6 h-6 rotate-[135deg]" />
        </button>
        <button className="w-14 h-14 rounded-full bg-green-500 text-white flex items-center justify-center animate-pulse">
          <Phone className="w-6 h-6" />
        </button>
      </div>
      
      <div className="grid grid-cols-3 gap-2 text-center">
        {["Termin", "Nachfassen", "Kein Interesse"].map((outcome, idx) => (
          <button key={idx} className="py-2 px-3 rounded-lg bg-white/5 border border-white/10 text-xs text-gray-300 hover:bg-white/10 transition-colors">
            {outcome}
          </button>
        ))}
      </div>
      
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-500">Warteschlange</span>
        <span className="text-primary">12 Leads übrig</span>
      </div>
    </div>
  </div>
);

const uniqueFeatures: UniqueFeature[] = [
  {
    id: "objection",
    icon: Mic,
    title: "Live KI-Einwandbehandlung",
    description: "Während du telefonierst, erkennt die KI Einwände und zeigt dir sofort die passende Antwort – in Echtzeit.",
    mockup: <LiveObjectionMockup />
  },
  {
    id: "tracking",
    icon: Eye,
    title: "Echtzeit-Tracking",
    description: "Sieh live, wenn ein Lead deine Seite besucht, das Video schaut oder auf den CTA klickt.",
    mockup: <RealtimeTrackingMockup />
  },
  {
    id: "video",
    icon: Video,
    title: "KI-Video-Landingpages",
    description: "Für jeden Lead wird automatisch eine personalisierte Landingpage mit Video erstellt.",
    mockup: <AIVideoMockup />
  },
  {
    id: "crm",
    icon: Users,
    title: "CRM mit Pipeline-System",
    description: "Alle Leads, Deals und Aktivitäten in einem System mit klarem Erstgespräch-/Beratungsgespräch-Prinzip.",
    mockup: <CRMPipelineMockup />
  },
  {
    id: "dialer",
    icon: Phone,
    title: "Power Dialer integriert",
    description: "Rufe Leads direkt aus dem CRM an. Keine Telefon-App, keine Umwege – alles in einem System.",
    mockup: <PowerDialerMockup />
  }
];

export const UniqueFeatures = () => {
  const [activeFeature, setActiveFeature] = useState(uniqueFeatures[0].id);
  const currentFeature = uniqueFeatures.find(f => f.id === activeFeature)!;

  return (
    <section className="py-20 px-4 md:px-6 relative z-[1]">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white">
            Diese Features gibt es <span className="text-primary italic underline decoration-primary/50 underline-offset-4">nur bei PitchFirst</span>:
          </h2>
        </div>

        {/* Content Grid */}
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">
          {/* Left: Feature List */}
          <div className="space-y-3">
            {uniqueFeatures.map((feature) => {
              const isActive = activeFeature === feature.id;
              const Icon = feature.icon;
              
              return (
                <button
                  key={feature.id}
                  onClick={() => setActiveFeature(feature.id)}
                  className={cn(
                    "w-full text-left p-4 md:p-5 rounded-xl border transition-all duration-300",
                    isActive 
                      ? "bg-white/10 border-primary/50 shadow-lg shadow-primary/10" 
                      : "bg-white/[0.02] border-white/10 hover:bg-white/5 hover:border-white/20"
                  )}
                >
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      "w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors",
                      isActive ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"
                    )}>
                      <Icon className="w-5 h-5 md:w-6 md:h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className={cn(
                        "font-semibold mb-1 transition-colors",
                        isActive ? "text-white" : "text-white/80"
                      )}>
                        {feature.title}
                      </h3>
                      <p className={cn(
                        "text-sm transition-all duration-300 overflow-hidden",
                        isActive ? "text-gray-300 max-h-20 opacity-100" : "text-gray-500 max-h-0 opacity-0 md:max-h-20 md:opacity-100"
                      )}>
                        {feature.description}
                      </p>
                    </div>
                    {isActive && (
                      <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right: Mockup with Animation */}
          <div className="relative lg:sticky lg:top-32">
            <div className="relative">
              {/* Glow Effect */}
              <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 via-blue-500/10 to-purple-500/20 rounded-3xl blur-2xl opacity-50" />
              
              {/* Mockup Container with Animation */}
              <div className="relative">
                {uniqueFeatures.map((feature) => (
                  <div
                    key={feature.id}
                    className={cn(
                      "transition-all duration-500 ease-out",
                      activeFeature === feature.id 
                        ? "opacity-100 translate-y-0 scale-100" 
                        : "opacity-0 translate-y-4 scale-95 absolute inset-0 pointer-events-none"
                    )}
                  >
                    {feature.mockup}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Feature indicator dots */}
            <div className="flex justify-center gap-2 mt-6 lg:hidden">
              {uniqueFeatures.map((feature) => (
                <button
                  key={feature.id}
                  onClick={() => setActiveFeature(feature.id)}
                  className={cn(
                    "w-2 h-2 rounded-full transition-all",
                    activeFeature === feature.id 
                      ? "bg-primary w-6" 
                      : "bg-white/30 hover:bg-white/50"
                  )}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default UniqueFeatures;
