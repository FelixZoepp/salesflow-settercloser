import { FeaturePageTemplate } from "@/components/landing/FeaturePageTemplate";
import { Sparkles, Zap, Palette, FileText, Target, TrendingUp, Clock, CheckCircle } from "lucide-react";
import leadPageBuilderScreenshot from "@/assets/lead-page-builder-screenshot.png";

const KIKonfigurator = () => {
  return (
    <FeaturePageTemplate
      badge="KI-Konfigurator"
      badgeIcon={Sparkles}
      title="Seiten mit KI erstellen"
      subtitle="Beschreibe was du möchtest – die KI erstellt die perfekte Lead-Seite für dich. In Sekunden."
      heroImage={leadPageBuilderScreenshot}
      heroImageAlt="KI-Konfigurator Interface"
      quickFeatures={[
        {
          icon: Sparkles,
          title: "Prompt-basiert",
          description: "Beschreibe, die KI baut"
        },
        {
          icon: Palette,
          title: "Design anpassen",
          description: "Farben, Texte, Layout"
        },
        {
          icon: Zap,
          title: "Sofort fertig",
          description: "In Sekunden generiert"
        }
      ]}
      sections={[
        {
          title: "Beschreibe einfach, was du willst",
          description: "Statt stundenlang an Texten zu feilen, sagst du der KI einfach was du brauchst: 'Erstelle eine Seite für IT-Entscheider mit Fokus auf Effizienz'. Die KI generiert Headlines, Texte und passt die Farben an.",
          features: [
            { icon: FileText, text: "Automatische Texterstellung" },
            { icon: Palette, text: "Farbschema anpassen" },
            { icon: Target, text: "Zielgruppen-Optimierung" },
            { icon: CheckCircle, text: "Volle Kontrolle behalten" }
          ],
          image: leadPageBuilderScreenshot,
          imageAlt: "KI-Konfigurator"
        },
        {
          title: "Iterieren bis es perfekt ist",
          description: "Gefällt dir etwas nicht? Sag es der KI. Sie passt einzelne Abschnitte an, ändert den Ton oder optimiert für andere Zielgruppen. Schneller als jeder Designer.",
          features: [
            { icon: Zap, text: "Schnelle Anpassungen" },
            { icon: Sparkles, text: "Intelligente Vorschläge" },
            { icon: TrendingUp, text: "A/B-Test Varianten" },
            { icon: Clock, text: "Seiten in Minuten" }
          ],
          reversed: true,
          mockup: (
            <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-primary/10 to-purple-500/10 p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <span className="font-medium">KI-Konfigurator</span>
              </div>
              
              <div className="bg-background/50 backdrop-blur rounded-xl border border-white/10 p-4">
                <p className="text-sm text-muted-foreground mb-3">Dein Prompt:</p>
                <p className="text-sm italic">"Erstelle eine Seite für IT-Entscheider mit Fokus auf ROI und Zeitersparnis"</p>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                Generiere personalisierte Inhalte...
              </div>
              
              <div className="grid grid-cols-3 gap-3">
                {["Headline", "Texte", "Design"].map((item) => (
                  <div key={item} className="bg-primary/10 rounded-lg p-3 text-center text-sm">
                    <CheckCircle className="h-4 w-4 text-primary mx-auto mb-1" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          )
        }
      ]}
      benefits={[
        {
          icon: Clock,
          title: "Stunden sparen",
          description: "Was früher Tage dauerte, erledigst du in Minuten"
        },
        {
          icon: Target,
          title: "Bessere Ergebnisse",
          description: "KI-optimierte Texte für deine Zielgruppe"
        },
        {
          icon: Zap,
          title: "Mehr Varianten",
          description: "Teste verschiedene Ansätze ohne Aufwand"
        }
      ]}
    />
  );
};

export default KIKonfigurator;
