import { FeaturePageTemplate } from "@/components/landing/FeaturePageTemplate";
import { Users, LayoutDashboard, Filter, Tag, Search, Clock, Target, TrendingUp, Zap, Mail, Phone, Eye, Star } from "lucide-react";

const CRM = () => {
  // Apple-style CRM Dashboard Mockup
  const CRMDashboardMockup = () => (
    <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 p-2">
      {/* Browser Chrome */}
      <div className="rounded-xl bg-[#0d1117] overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span className="ml-4 text-xs text-gray-500">pitchfirst.io/dashboard</span>
        </div>
        
        <div className="p-6 space-y-4">
          {/* Stats Row */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: "Leads", value: "247", color: "text-blue-400" },
              { label: "Hot Leads", value: "18", color: "text-orange-400" },
              { label: "Diese Woche", value: "+34", color: "text-green-400" },
              { label: "Termine", value: "12", color: "text-purple-400" }
            ].map((stat, idx) => (
              <div key={idx} className="bg-white/5 border border-white/10 rounded-lg p-3 text-center">
                <div className={`text-xl font-bold ${stat.color}`}>{stat.value}</div>
                <div className="text-xs text-gray-400">{stat.label}</div>
              </div>
            ))}
          </div>
          
          {/* Contact List */}
          <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
            <div className="px-4 py-2 border-b border-white/10 flex items-center justify-between">
              <span className="text-sm font-medium">Letzte Aktivität</span>
              <div className="flex gap-2">
                <div className="w-6 h-6 rounded bg-white/5 flex items-center justify-center">
                  <Search className="h-3 w-3 text-gray-400" />
                </div>
                <div className="w-6 h-6 rounded bg-white/5 flex items-center justify-center">
                  <Filter className="h-3 w-3 text-gray-400" />
                </div>
              </div>
            </div>
            
            {[
              { name: "Max Mustermann", company: "Tech GmbH", status: "hot", action: "Video angesehen", time: "vor 2 Min" },
              { name: "Anna Schmidt", company: "Digital AG", status: "warm", action: "Seite besucht", time: "vor 15 Min" },
              { name: "Peter Meyer", company: "Sales Corp", status: "new", action: "Lead erstellt", time: "vor 1 Std" }
            ].map((contact, idx) => (
              <div key={idx} className="px-4 py-3 border-b border-white/5 flex items-center justify-between hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    contact.status === 'hot' ? 'bg-orange-500/20' : 
                    contact.status === 'warm' ? 'bg-yellow-500/20' : 'bg-blue-500/20'
                  }`}>
                    <span className="text-xs font-medium">{contact.name.split(' ').map(n => n[0]).join('')}</span>
                  </div>
                  <div>
                    <div className="text-sm font-medium">{contact.name}</div>
                    <div className="text-xs text-gray-400">{contact.company}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-300">{contact.action}</div>
                  <div className="text-xs text-gray-500">{contact.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // Pipeline Mockup
  const PipelineMockup = () => (
    <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 p-6">
      <div className="grid grid-cols-3 gap-4">
        {[
          { stage: "Neu", count: 45, deals: ["Tech GmbH", "Digital AG"] },
          { stage: "Qualifiziert", count: 23, deals: ["Sales Corp", "Media GmbH"] },
          { stage: "Abgeschlossen", count: 12, deals: ["Startup Inc"] }
        ].map((col, idx) => (
          <div key={idx} className="space-y-3">
            <div className="text-sm font-medium text-center py-2 rounded-lg bg-white/5 flex items-center justify-center gap-2">
              {col.stage}
              <span className="text-xs text-gray-400">({col.count})</span>
            </div>
            {col.deals.map((deal, dIdx) => (
              <div key={dIdx} className="p-3 rounded-lg bg-background/50 border border-white/10 space-y-2 hover:border-primary/50 transition-colors cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className="h-3 w-20 text-xs font-medium truncate">{deal}</div>
                  <Star className="h-3 w-3 text-yellow-500" />
                </div>
                <div className="flex gap-1">
                  <div className="w-5 h-5 rounded bg-white/5 flex items-center justify-center">
                    <Mail className="h-3 w-3 text-gray-400" />
                  </div>
                  <div className="w-5 h-5 rounded bg-white/5 flex items-center justify-center">
                    <Phone className="h-3 w-3 text-gray-400" />
                  </div>
                  <div className="w-5 h-5 rounded bg-white/5 flex items-center justify-center">
                    <Eye className="h-3 w-3 text-gray-400" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <FeaturePageTemplate
      badge="CRM & Kontakt-Management"
      badgeIcon={Users}
      title="Integriertes CRM-System"
      subtitle="Alle Leads, Deals und Aktivitäten in einem System. Kein Wechsel zwischen Tools, kein Excel-Chaos."
      heroImage=""
      heroImageAlt=""
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
          mockup: <CRMDashboardMockup />
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
          mockup: <PipelineMockup />
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
