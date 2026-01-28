import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Globe, 
  Eye, 
  BarChart3, 
  Video, 
  Sparkles,
  Users,
  Zap,
  Phone,
  Mic,
  ChevronDown,
  Shield,
  Settings,
  LayoutDashboard
} from "lucide-react";

interface FeatureItem {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  href?: string;
  badge?: string;
}

interface FeatureCategory {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  items: FeatureItem[];
}

const featureCategories: FeatureCategory[] = [
  {
    title: "LEAD-GENERIERUNG",
    icon: Globe,
    color: "text-primary",
    items: [
      { icon: Globe, title: "Lead-Seiten", description: "Personalisierte Landing Pages", href: "/features/lead-seiten" },
      { icon: Video, title: "KI-Videos", description: "Automatisch generierte Videos" },
      { icon: Eye, title: "Echtzeit-Tracking", description: "Live Lead-Aktivitäten" },
      { icon: BarChart3, title: "Lead-Scoring", description: "Automatische Bewertung" },
    ]
  },
  {
    title: "CRM & VERTRIEB",
    icon: Users,
    color: "text-blue-400",
    items: [
      { icon: Users, title: "Kontakt-Management", description: "Alle Leads zentral verwalten" },
      { icon: LayoutDashboard, title: "Deal-Pipeline", description: "Visuelles Pipeline-Management" },
      { icon: Phone, title: "Power Dialer", description: "Direkt aus dem CRM anrufen" },
      { icon: Zap, title: "Automatisierungen", description: "Workflows & Follow-ups" },
    ]
  },
  {
    title: "KI-FUNKTIONEN",
    icon: Sparkles,
    color: "text-purple-400",
    items: [
      { icon: Sparkles, title: "KI-Konfigurator", description: "Seiten mit KI erstellen", badge: "NEU" },
      { icon: Mic, title: "Live-Einwandbehandlung", description: "KI-Coach während des Calls" },
      { icon: Video, title: "Avatar-Videos", description: "Personalisierte KI-Videos" },
    ]
  },
  {
    title: "SICHERHEIT",
    icon: Shield,
    color: "text-green-400",
    items: [
      { icon: Shield, title: "DSGVO-konform", description: "Hosting in Deutschland" },
      { icon: Settings, title: "Integrationen", description: "API & Webhooks" },
    ]
  }
];

interface FeaturesMegaMenuProps {
  className?: string;
}

export const FeaturesMegaMenu = ({ className }: FeaturesMegaMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const handleItemClick = (href?: string) => {
    if (href) {
      navigate(href);
    }
    setIsOpen(false);
  };

  return (
    <div 
      className={`relative ${className}`}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      {/* Trigger */}
      <button 
        className="flex items-center gap-1 hover:text-white transition-colors text-white/80"
        onClick={() => setIsOpen(!isOpen)}
      >
        Features
        <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Mega Menu Dropdown - Centered on screen */}
      {isOpen && (
        <>
          {/* Invisible bridge to prevent menu from closing */}
          <div className="absolute top-full left-0 w-full h-4" />
          
          <div className="fixed top-20 left-1/2 -translate-x-1/2 w-[800px] bg-background/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-black/50 p-6 z-50 animate-fade-in">
            {/* Arrow */}
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-background/95 border-l border-t border-white/10 rotate-45" />
            
            {/* Categories Grid */}
            <div className="grid grid-cols-4 gap-6 relative z-10">
              {featureCategories.map((category) => (
                <div key={category.title} className="space-y-3">
                  {/* Category Header */}
                  <div className="flex items-center gap-2 pb-2 border-b border-white/10">
                    <category.icon className={`h-4 w-4 ${category.color}`} />
                    <span className={`text-xs font-semibold uppercase tracking-wider ${category.color}`}>
                      {category.title}
                    </span>
                  </div>
                  
                  {/* Category Items */}
                  <div className="space-y-1">
                    {category.items.map((item) => (
                      <button
                        key={item.title}
                        onClick={() => handleItemClick(item.href)}
                        className={`w-full text-left p-2 rounded-lg hover:bg-white/5 transition-colors group ${item.href ? 'cursor-pointer' : 'cursor-default opacity-60'}`}
                      >
                        <div className="flex items-start gap-2">
                          <item.icon className="h-4 w-4 text-muted-foreground mt-0.5 group-hover:text-primary transition-colors" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                                {item.title}
                              </span>
                              {item.badge && (
                                <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-primary/20 text-primary">
                                  {item.badge}
                                </span>
                              )}
                            </div>
                            {item.description && (
                              <p className="text-xs text-muted-foreground truncate">
                                {item.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom CTA */}
            <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/20 flex-1 mr-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Phone className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Alle Features kennenlernen</p>
                  <p className="text-sm font-medium text-foreground">Kostenlose Demo buchen</p>
                </div>
              </div>
              <a
                href="https://calendly.com/zoepp-media/vorgesprach-demo-software"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                Demo vereinbaren
              </a>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default FeaturesMegaMenu;
