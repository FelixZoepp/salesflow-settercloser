import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, Calendar, Check, X, Star, CheckCircle, Megaphone, Pen, Users, MessageSquare, Target, TrendingUp, Zap } from "lucide-react";

interface LeadPageTemplatePreviewProps {
  calendarUrl?: string;
}

export const LeadPageTemplatePreview = ({ calendarUrl }: LeadPageTemplatePreviewProps) => {
  // Preview with placeholder variables
  const firstName = "{{first_name}}";
  const companyName = "{{company}}";
  
  return (
    <Card className="glass-card border-white/10">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Lead-Seiten Vorschau
          </CardTitle>
          <Badge variant="outline" className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
            Standard-Vorlage
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Diese Seite wird automatisch für jeden Lead unter <code className="bg-white/10 px-1 rounded">/p/[lead-slug]</code> generiert
        </p>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg overflow-hidden border border-slate-700 bg-[#0f172a]" style={{ maxHeight: "600px", overflowY: "auto" }}>
          
          {/* Header Preview */}
          <header className="border-b border-slate-800 px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="text-lg font-bold text-white">
                <span className="text-cyan-400">Content</span>-Leads
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-400">
                <span>Warum wir?</span>
                <span>Unser Ansatz</span>
                <span>FAQ</span>
              </div>
              <div className="bg-cyan-500 text-slate-900 font-semibold px-3 py-1.5 rounded text-xs">
                {firstName}, lass uns sprechen!
              </div>
            </div>
          </header>

          {/* Hero Section Preview */}
          <section className="py-8 px-4">
            <div className="grid md:grid-cols-2 gap-6 items-center">
              <div className="space-y-4">
                <h1 className="text-2xl font-bold text-white leading-tight">
                  Hey {firstName}, sieh dir das 2-minütige Video an
                </h1>
                <p className="text-sm text-slate-300">
                  … und erfahre, wie <span className="text-cyan-400 font-semibold">{companyName}</span> mit personalisierten Outreach-Kampagnen qualifizierte Leads generiert.
                </p>
                <div className="inline-flex items-center gap-2 bg-cyan-500 text-slate-900 font-semibold px-4 py-2 rounded text-sm">
                  <Calendar className="w-4 h-4" />
                  Gratis Termin vereinbaren
                </div>
              </div>
              <div className="relative">
                <div className="absolute -top-6 right-1/4 text-3xl animate-bounce">👇</div>
                <div className="rounded-lg overflow-hidden border border-slate-600 bg-slate-800 aspect-video flex items-center justify-center">
                  <div className="text-center">
                    <div className="bg-cyan-500/20 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Play className="w-6 h-6 text-cyan-400" />
                    </div>
                    <p className="text-slate-400 text-xs">Personalisiertes Video</p>
                    <p className="text-cyan-400 text-xs font-mono">{"{{video_url}}"}</p>
                  </div>
                </div>
                <p className="text-center text-slate-400 mt-2 text-xs">
                  Nur für dich {firstName}!
                </p>
              </div>
            </div>
          </section>

          {/* Coaching Section Preview */}
          <section className="py-6 px-4 bg-slate-900/50">
            <div className="text-center mb-4">
              <span className="inline-block px-3 py-1 bg-cyan-500/20 text-cyan-400 rounded-full text-xs font-medium mb-2">
                Exklusives Coaching-Programm
              </span>
              <h2 className="text-xl font-bold text-white mb-2">
                Die zwei Säulen für deinen LinkedIn-Erfolg
              </h2>
              <p className="text-slate-400 text-xs">
                Lerne, wie du mit Outreach Umsatz generierst – für <span className="text-cyan-400">{companyName}</span>
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {/* Outreach */}
              <div className="bg-gradient-to-br from-cyan-500/10 to-slate-800/50 rounded-lg p-4 border border-cyan-500/30">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-cyan-500/20 rounded flex items-center justify-center">
                    <Megaphone className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Säule 1: Outreach</h3>
                    <p className="text-cyan-400 text-xs">= Umsatz generieren</p>
                  </div>
                </div>
                <ul className="space-y-1">
                  {[
                    "Hyperpersonalisierte Nachrichten",
                    "Direkte Terminbuchungen",
                    "Datengetriebene Ansprache",
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-slate-300 text-xs">
                      <Check className="w-3 h-3 text-cyan-400 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Content */}
              <div className="bg-gradient-to-br from-purple-500/10 to-slate-800/50 rounded-lg p-4 border border-purple-500/30">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-purple-500/20 rounded flex items-center justify-center">
                    <Pen className="w-4 h-4 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Säule 2: Inbound Content</h3>
                    <p className="text-purple-400 text-xs">= Anfragen generieren</p>
                  </div>
                </div>
                <ul className="space-y-1">
                  {[
                    "Posts, die viral gehen",
                    "Thought Leadership",
                    "Community Building",
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-slate-300 text-xs">
                      <Check className="w-3 h-3 text-purple-400 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* Comparison Section Preview */}
          <section className="py-6 px-4">
            <div className="text-center mb-4">
              <div className="inline-flex items-center gap-1 bg-amber-500/20 border border-amber-500/50 rounded-full px-3 py-1 mb-2">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                <span className="text-amber-300 font-semibold text-xs">#1 LinkedIn Beratung DACH</span>
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              </div>
              <h2 className="text-xl font-bold text-white">Was uns unterscheidet</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-red-500/5 rounded-lg p-4 border border-red-500/20">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 bg-red-500/20 rounded-full flex items-center justify-center">
                    <X className="w-3 h-3 text-red-400" />
                  </div>
                  <h3 className="text-sm font-bold text-white">Andere Anbieter</h3>
                </div>
                <ul className="space-y-1">
                  {["3-6 Monate bis Ergebnisse", "Keine Garantie", "Nur Theorie"].map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-slate-400 text-xs">
                      <X className="w-3 h-3 text-red-400 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-emerald-500/5 rounded-lg p-4 border border-emerald-500/20">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 bg-emerald-500/20 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-3 h-3 text-emerald-400" />
                  </div>
                  <h3 className="text-sm font-bold text-white">Content-Leads</h3>
                </div>
                <ul className="space-y-1">
                  {["Erste Anfragen in 7 Tagen", "Umsatzgarantie", "1:1 Betreuung"].map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-slate-300 text-xs">
                      <CheckCircle className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* Variables Info Box */}
          <div className="mx-4 mb-4 p-4 bg-primary/10 border border-primary/30 rounded-lg">
            <h4 className="text-sm font-medium text-primary mb-2">Verfügbare Variablen:</h4>
            <div className="flex flex-wrap gap-2">
              {[
                "{{first_name}}",
                "{{last_name}}",
                "{{company}}",
                "{{video_url}}",
                "{{pitch_video_url}}",
              ].map((variable) => (
                <code key={variable} className="bg-white/10 px-2 py-1 rounded text-xs text-cyan-400">
                  {variable}
                </code>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Diese Variablen werden automatisch mit den Lead-Daten ersetzt
            </p>
          </div>

          {/* Footer Preview */}
          <footer className="border-t border-slate-800 py-4 px-4 text-center">
            <p className="text-slate-400 text-xs">
              © 2024 Content-Leads. Alle Rechte vorbehalten.
            </p>
          </footer>
        </div>
      </CardContent>
    </Card>
  );
};
