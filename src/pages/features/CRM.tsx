import { FeaturePageTemplate } from "@/components/landing/FeaturePageTemplate";
import { Users, LayoutDashboard, Filter, Tag, Search, Clock, Target, TrendingUp, Zap } from "lucide-react";
import crmDashboardScreenshot from "@/assets/crm-dashboard-screenshot.png";

const CRM = () => {
  return (
    <FeaturePageTemplate
      badge="CRM & Kontakt-Management"
      badgeIcon={Users}
      title="Integriertes CRM-System"
      subtitle="Alle Leads, Deals und Aktivitäten in einem System. Kein Wechsel zwischen Tools, kein Excel-Chaos."
      heroImage={crmDashboardScreenshot}
      heroImageAlt="CRM Dashboard"
      quickFeatures={[
        {
          icon: Users,
          title: "Kontakt-Management",
          description: "Alle Leads zentral verwalten"
        },
        {
          icon: LayoutDashboard,
          title: "Deal-Pipeline",
          description: "Visuelles Kanban-Board"
        },
        {
          icon: Filter,
          title: "Smart Filter",
          description: "Leads schnell finden"
        }
      ]}
      sections={[
        {
          title: "Alle deine Leads an einem Ort",
          description: "Importiere Leads aus LinkedIn, CSV oder per API. Alle Kontakte werden automatisch mit Tags, Notizen und Aktivitäten angereichert. Nie wieder zwischen Tools wechseln oder Daten manuell übertragen.",
          features: [
            { icon: Users, text: "Unbegrenzte Kontakte" },
            { icon: Tag, text: "Tags & Kategorien" },
            { icon: Search, text: "Volltext-Suche" },
            { icon: Clock, text: "Aktivitäts-Historie" }
          ],
          image: crmDashboardScreenshot,
          imageAlt: "Kontakt-Management"
        },
        {
          title: "Deal-Pipeline für maximale Übersicht",
          description: "Verfolge jeden Deal von der ersten Kontaktaufnahme bis zum Abschluss. Das visuelle Kanban-Board zeigt dir auf einen Blick, wo jeder Lead steht und was als nächstes zu tun ist.",
          features: [
            { icon: LayoutDashboard, text: "Drag & Drop Pipeline" },
            { icon: Target, text: "Automatisches Lead-Scoring" },
            { icon: TrendingUp, text: "Deal-Wert Tracking" },
            { icon: Zap, text: "Automatische Erinnerungen" }
          ],
          reversed: true,
          mockup: (
            <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 p-6">
              <div className="grid grid-cols-3 gap-4">
                {["Neu", "Qualifiziert", "Abgeschlossen"].map((stage, idx) => (
                  <div key={stage} className="space-y-3">
                    <div className="text-sm font-medium text-center py-2 rounded-lg bg-white/5">{stage}</div>
                    {[1, 2].map((i) => (
                      <div key={i} className="p-3 rounded-lg bg-background/50 border border-white/10 space-y-2">
                        <div className="h-3 w-20 bg-white/20 rounded" />
                        <div className="h-2 w-16 bg-white/10 rounded" />
                      </div>
                    ))}
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
          title: "Zeit sparen",
          description: "Kein Wechsel zwischen Tools – alles an einem Ort"
        },
        {
          icon: Target,
          title: "Mehr Überblick",
          description: "Sieh auf einen Blick, wo jeder Lead steht"
        },
        {
          icon: TrendingUp,
          title: "Höhere Conversion",
          description: "Kein Lead geht mehr verloren"
        }
      ]}
    />
  );
};

export default CRM;
