import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, Megaphone, Briefcase, Phone, Settings, LogOut, Shield, BarChart3,
  Users, FileText, Mail, Video, BookOpen, Target, Zap, Globe, Key, CreditCard,
  UserPlus, ChevronRight, FolderOpen, CalendarDays, MessageSquare, Palette
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useHotLeadNotifications } from "@/hooks/useHotLeadNotifications";
import { useSubscriptionContext } from "@/contexts/SubscriptionContext";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import pitchfirstLogo from "@/assets/pitchfirst-logo-white.png";

interface LayoutProps {
  children: ReactNode;
}

interface SubNavItem {
  path: string;
  label: string;
  icon: any;
}

interface NavItem {
  path: string;
  label: string;
  icon: any;
  color: string;
  subItems?: SubNavItem[];
}

const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [viewingAccount, setViewingAccount] = useState<string | null>(null);

  useHotLeadNotifications();
  const { openCustomerPortal } = useSubscriptionContext();
  useEffect(() => {
    checkSuperAdmin();
    checkViewingAccount();
  }, []);

  const checkSuperAdmin = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_super_admin')
      .eq('id', user.id)
      .single();

    setIsSuperAdmin(profile?.is_super_admin || false);
  };

  const checkViewingAccount = () => {
    const accountId = sessionStorage.getItem('master_admin_account_id');
    if (accountId) {
      supabase
        .from('accounts')
        .select('name')
        .eq('id', accountId)
        .single()
        .then(({ data }) => {
          if (data) setViewingAccount(data.name);
        });
    }
  };

  const clearAccountView = () => {
    sessionStorage.removeItem('master_admin_account_id');
    setViewingAccount(null);
    navigate('/master-admin');
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Fehler beim Ausloggen");
    } else {
      toast.success("Erfolgreich ausgeloggt");
      navigate("/auth");
    }
  };

  const navItems: NavItem[] = [
    { 
      path: "/dashboard", 
      label: "Dashboard", 
      icon: LayoutDashboard, 
      color: "text-blue-400",
      subItems: [
        { path: "/dashboard", label: "Übersicht", icon: LayoutDashboard },
        { path: "/today", label: "Heute", icon: CalendarDays },
        { path: "/kpi", label: "KPIs", icon: Target },
      ]
    },
    { 
      path: "/campaigns", 
      label: "Kampagnen", 
      icon: Megaphone, 
      color: "text-purple-400",
      subItems: [
        { path: "/campaigns", label: "Alle Kampagnen", icon: Megaphone },
        { path: "/contacts", label: "Kontakte", icon: Users },
        { path: "/import-leads", label: "Leads importieren", icon: FolderOpen },
        { path: "/landing-pages", label: "Landing Pages", icon: Globe },
        { path: "/branding", label: "Lead-Seite anpassen", icon: Palette },
        { path: "/video-note", label: "Video-Nachrichten", icon: Video },
      ]
    },
    { 
      path: "/pipeline", 
      label: "Vertrieb", 
      icon: Briefcase, 
      color: "text-amber-400",
      subItems: [
        { path: "/pipeline", label: "Pipeline", icon: Briefcase },
        { path: "/deal-analytics", label: "Deal-Analytics", icon: BarChart3 },
        { path: "/activity-log", label: "Aktivitäten", icon: FileText },
      ]
    },
    { 
      path: "/power-dialer", 
      label: "Calling", 
      icon: Phone, 
      color: "text-rose-400",
      subItems: [
        { path: "/power-dialer", label: "Power Dialer", icon: Phone },
        { path: "/call-script", label: "Gesprächsleitfaden", icon: FileText },
        { path: "/objections", label: "Einwand-Bibliothek", icon: MessageSquare },
      ]
    },
    { 
      path: "/email-templates", 
      label: "E-Mail", 
      icon: Mail, 
      color: "text-green-400",
      subItems: [
        { path: "/email-templates", label: "E-Mail Templates", icon: Mail },
      ]
    },
    { 
      path: "/profile", 
      label: "Einstellungen", 
      icon: Settings, 
      color: "text-slate-400",
      subItems: [
        { path: "/profile", label: "Profil", icon: Settings },
        { path: "/integrations", label: "Integrationen", icon: Zap },
        { path: "/api-keys", label: "API-Schlüssel", icon: Key },
        { path: "/billing", label: "Abrechnung", icon: CreditCard },
        { path: "/invitations", label: "Team einladen", icon: UserPlus },
      ]
    },
  ];

  if (isSuperAdmin) {
    navItems.push({ 
      path: "/master-admin", 
      label: "Admin", 
      icon: Shield, 
      color: "text-red-400" 
    });
  }

  const isActiveItem = (item: NavItem) => {
    if (location.pathname === item.path) return true;
    if (item.subItems) {
      return item.subItems.some(sub => location.pathname === sub.path);
    }
    return false;
  };

  return (
    <div className="flex h-screen bg-background relative">
      <div className="ambient-glow" />
      
      <aside className="w-20 glass-sidebar flex flex-col relative z-50 items-center">
        <div className="p-3 border-b border-white/5 w-full flex justify-center">
          <img 
            src={pitchfirstLogo} 
            alt="pitchfirst.io" 
            className="h-10 object-contain"
          />
        </div>
        
        {viewingAccount && (
          <div className="p-2 text-center">
            <Badge variant="secondary" className="text-[10px] glass-button">
              {viewingAccount.slice(0, 8)}...
            </Badge>
            <Button
              variant="link"
              size="sm"
              onClick={clearAccountView}
              className="text-[10px] p-0 h-auto mt-1 text-primary"
            >
              ← Zurück
            </Button>
          </div>
        )}
        
        <ScrollArea className="flex-1 w-full">
          <nav className="p-2 flex flex-col items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = isActiveItem(item);
              
              if (item.subItems && item.subItems.length > 0) {
                return (
                  <HoverCard key={item.path} openDelay={0} closeDelay={100}>
                    <HoverCardTrigger asChild>
                      <button
                        className={`flex items-center justify-center w-12 h-12 rounded-2xl transition-all duration-200 ${
                          isActive
                            ? "bg-white/10 border border-white/20 shadow-glow-sm"
                            : "hover:bg-white/5"
                        }`}
                      >
                        <Icon className={`w-5 h-5 ${isActive ? item.color : 'text-muted-foreground'}`} />
                      </button>
                    </HoverCardTrigger>
                    <HoverCardContent 
                      side="right" 
                      align="start"
                      sideOffset={8}
                      className="w-56 p-2 bg-background/95 backdrop-blur-xl border border-white/10 shadow-xl z-[100]"
                    >
                      <div className="space-y-1">
                        <div className={`text-xs font-semibold px-3 py-2 ${item.color}`}>
                          {item.label}
                        </div>
                        {item.subItems.map((subItem) => {
                          const SubIcon = subItem.icon;
                          const isSubActive = location.pathname === subItem.path;
                          return (
                            <Link
                              key={subItem.path}
                              to={subItem.path}
                              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                                isSubActive
                                  ? "bg-white/10 text-foreground"
                                  : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                              }`}
                            >
                              <SubIcon className="w-4 h-4" />
                              <span>{subItem.label}</span>
                              <ChevronRight className="w-3 h-3 ml-auto opacity-50" />
                            </Link>
                          );
                        })}
                      </div>
                    </HoverCardContent>
                  </HoverCard>
                );
              }
              
              return (
                <HoverCard key={item.path} openDelay={0} closeDelay={100}>
                  <HoverCardTrigger asChild>
                    <Link
                      to={item.path}
                      className={`flex items-center justify-center w-12 h-12 rounded-2xl transition-all duration-200 ${
                        isActive
                          ? "bg-white/10 border border-white/20 shadow-glow-sm"
                          : "hover:bg-white/5"
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${isActive ? item.color : 'text-muted-foreground'}`} />
                    </Link>
                  </HoverCardTrigger>
                  <HoverCardContent 
                    side="right" 
                    align="start"
                    sideOffset={8}
                    className="w-auto px-3 py-2 bg-background/95 backdrop-blur-xl border border-white/10 shadow-xl z-[100]"
                  >
                    <span className="text-sm font-medium">{item.label}</span>
                  </HoverCardContent>
                </HoverCard>
              );
            })}
          </nav>
        </ScrollArea>

        <div className="p-3 border-t border-white/5 w-full flex justify-center">
          <HoverCard openDelay={0} closeDelay={100}>
            <HoverCardTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="w-12 h-12 rounded-2xl text-muted-foreground hover:bg-white/5 hover:text-foreground"
                onClick={handleLogout}
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </HoverCardTrigger>
            <HoverCardContent 
              side="right" 
              align="start"
              sideOffset={8}
              className="w-auto px-3 py-2 bg-background/95 backdrop-blur-xl border border-white/10 shadow-xl z-[100]"
            >
              <span className="text-sm font-medium">Abmelden</span>
            </HoverCardContent>
          </HoverCard>
        </div>
      </aside>

      <main className="flex-1 overflow-auto flex flex-col relative z-10">
        <div className="flex-1 p-6">
          {children}
        </div>
        <footer className="py-4 px-6 border-t border-white/5 text-center text-muted-foreground text-sm">
          <div className="flex justify-center gap-6">
            <a 
              href="https://www.content-leads.de/impressum" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-primary transition-colors"
            >
              Impressum
            </a>
            <a 
              href="https://www.content-leads.de/datenschutz" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-primary transition-colors"
            >
              Datenschutzerklärung
            </a>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default Layout;