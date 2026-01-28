import { FeaturePageTemplate } from "@/components/landing/FeaturePageTemplate";
import { Mic, Sparkles, MessageSquare, Zap, Target, TrendingUp, Lightbulb, CheckCircle } from "lucide-react";
import aiCoachingScreenshot from "@/assets/ai-coaching-screenshot.png";

const LiveEinwandbehandlung = () => {
  return (
    <FeaturePageTemplate
      badge="Live KI-Einwandbehandlung"
      badgeIcon={Mic}
      title="KI-Coach während des Calls"
      subtitle="Die KI erkennt Einwände in Echtzeit und zeigt dir sofort die passende Antwort – direkt während du telefonierst."
      heroImage={aiCoachingScreenshot}
      heroImageAlt="Live Einwandbehandlung Interface"
      quickFeatures={[
        {
          icon: Mic,
          title: "Echtzeit-Erkennung",
          description: "Einwände werden sofort erkannt"
        },
        {
          icon: MessageSquare,
          title: "Passende Antworten",
          description: "Vorformulierte Reaktionen"
        },
        {
          icon: Sparkles,
          title: "KI-gestützt",
          description: "Lernt aus deinen besten Calls"
        }
      ]}
      sections={[
        {
          title: "Nie mehr sprachlos bei Einwänden",
          description: "Die KI hört deinem Gespräch zu und erkennt automatisch, wenn der Lead einen Einwand äußert. Sofort erscheint auf deinem Bildschirm eine passende Antwort – du musst nur noch ablesen.",
          features: [
            { icon: Mic, text: "Automatische Spracherkennung" },
            { icon: Lightbulb, text: "Intelligente Einwand-Erkennung" },
            { icon: MessageSquare, text: "Sofortige Antwort-Vorschläge" },
            { icon: CheckCircle, text: "Anpassbare Antworten" }
          ],
          image: aiCoachingScreenshot,
          imageAlt: "Einwand-Erkennung"
        },
        {
          title: "Dein persönlicher Sales-Coach",
          description: "Die KI lernt aus deinen erfolgreichsten Gesprächen und schlägt dir bewährte Formulierungen vor. Mit der Zeit werden die Vorschläge immer besser auf deinen Stil abgestimmt.",
          features: [
            { icon: Sparkles, text: "Lernt aus deinen Calls" },
            { icon: Target, text: "Personalisierte Vorschläge" },
            { icon: TrendingUp, text: "Erfolgsstatistiken" },
            { icon: Zap, text: "Schnelle Reaktionszeit" }
          ],
          reversed: true,
          mockup: (
            <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-orange-500/10 to-yellow-500/10 p-6 space-y-4">
              <div className="p-4 rounded-lg bg-orange-500/20 border border-orange-500/30 space-y-2">
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-orange-500" />
                  <span className="text-sm font-medium text-orange-500">Einwand erkannt</span>
                </div>
                <p className="text-sm">"Das ist mir zu teuer"</p>
              </div>
              <div className="p-4 rounded-lg bg-background/50 border border-white/10 space-y-2">
                <div className="text-sm font-medium">Empfohlene Antwort:</div>
                <p className="text-sm text-muted-foreground">
                  "Ich verstehe. Lass mich dir zeigen, wie sich die Investition in den ersten 3 Monaten amortisiert..."
                </p>
              </div>
              <div className="flex gap-2">
                <div className="px-3 py-1.5 rounded-lg bg-green-500/20 text-green-500 text-sm flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Verwenden
                </div>
              </div>
            </div>
          )
        }
      ]}
      benefits={[
        {
          icon: Target,
          title: "Souveräner auftreten",
          description: "Nie mehr nach Worten suchen bei schwierigen Einwänden"
        },
        {
          icon: TrendingUp,
          title: "Höhere Abschlussquote",
          description: "Bessere Einwandbehandlung = mehr gewonnene Deals"
        },
        {
          icon: Zap,
          title: "Schneller lernen",
          description: "Neue Mitarbeiter werden schneller produktiv"
        }
      ]}
    />
  );
};

export default LiveEinwandbehandlung;
