import { ReactNode, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Megaphone, Briefcase, Phone, Settings, LogOut, Shield, BarChart3,
  Users, FileText, Mail, Video, Target, Zap, Globe, Key, CreditCard,
  ChevronRight, FolderOpen, CalendarDays, MessageSquare, Home, Gift, Search, GitBranch, Trophy
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
import SoftphoneDialog from "@/components/SoftphoneDialog";
import { useLeadOnlineStatus } from "@/hooks/useLeadOnlineStatus";
import { useFollowupReminders } from "@/hooks/useFollowupReminders";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import pitchfirstLogo from "@/assets/pitchfirst-logo-white.png";
import UserAccountHeader from "@/components/UserAccountHeader";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import TopBar from "@/components/TopBar";

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
  const [hasTeam, setHasTeam] = useState(false);
  const [viewingAccount, setViewingAccount] = useState<string | null>(null);

  // Global softphone for hot lead instant calls
  const [hotLeadCall, setHotLeadCall] = useState<{
    open: boolean;
    phone: string;
    name: string;
    contactId: string;
  } | null>(null);

  const handleHotLeadCall = useCallback((lead: any) => {
    const phone = lead.phone || lead.mobile;
    if (!phone) {
      toast.error(`Keine Telefonnummer für ${lead.first_name} ${lead.last_name}`);
      return;
    }
    setHotLeadCall({
      open: true,
      phone,
      name: `${lead.first_name} ${lead.last_name}`,
      contactId: lead.id,
    });
  }, []);

  useHotLeadNotifications({ onHotLeadCall: handleHotLeadCall });
  const { onlineLeads } = useLeadOnlineStatus();
  useFollowupReminders();
  const { openCustomerPortal } = useSubscriptionContext();
  useEffect(() => {
    checkUserContext();
    checkViewingAccount();
  }, []);

  const checkUserContext = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_super_admin, account_id')
      .eq('id', user.id)
      .single();

    setIsSuperAdmin(profile?.is_super_admin || false);

    // Check if account has multiple team members
    if (profile?.account_id) {
      const { count } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('account_id', profile.account_id);
      setHasTeam((count || 0) > 1);
    }
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
      path: "/startseite", 
      label: "Startseite", 
      icon: Home, 
      color: "text-emerald-400"
    },
    {
      path: "/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      color: "text-blue-400",
      subItems: [
        { path: "/dashboard", label: "Übersicht", icon: LayoutDashboard },
        { path: "/today", label: "Heute", icon: CalendarDays },
        { path: "/kpi", label: "KPIs", icon: Target },
        ...(hasTeam ? [{ path: "/team-arena", label: "Team Arena", icon: Trophy }] : []),
      ]
    },
    {
      path: "/campaigns",
      label: "Kampagnen",
      icon: Megaphone,
      color: "text-purple-400",
      subItems: [
        { path: "/campaigns", label: "Alle Kampagnen", icon: Megaphone },
        { path: "/sequences", label: "Sequenzen", icon: GitBranch },
        { path: "/landing-pages", label: "Lead-Seiten", icon: Globe },
        { path: "/video-note", label: "Video-Nachrichten", icon: Video },
        { path: "/email-templates", label: "E-Mail Templates", icon: Mail },
      ]
    },
    {
      path: "/pipeline",
      label: "Vertrieb",
      icon: Briefcase,
      color: "text-amber-400",
      subItems: [
        { path: "/pipeline", label: "Pipeline", icon: Briefcase },
        { path: "/contacts", label: "Kontakte", icon: Users },
        { path: "/lead-search", label: "Lead-Recherche", icon: Search },
        { path: "/import-leads", label: "Leads importieren", icon: FolderOpen },
        { path: "/deal-analytics", label: "Deal-Analytics", icon: BarChart3 },
        { path: "/activity-log", label: "Aktivitäten", icon: FileText },
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
        { path: "/call-script", label: "Gesprächsleitfaden", icon: FileText },
        { path: "/objections", label: "Einwand-Bibliothek", icon: MessageSquare },
        { path: "/api-keys", label: "API-Schlüssel", icon: Key },
        { path: "/billing", label: "Abrechnung", icon: CreditCard },
        { path: "/partner-dashboard", label: "Partner-Programm", icon: Gift },
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
      
      {/* Desktop Sidebar - hidden on mobile */}
      <aside className="hidden md:flex w-[72px] glass-sidebar flex-col relative z-50">
        {/* Account Header */}
        <UserAccountHeader />
        
        <div className="p-2.5 border-b border-white/5 w-full flex justify-center">
          <img 
            src={pitchfirstLogo} 
            alt="pitchfirst.io" 
            className="h-9 object-contain"
          />
        </div>
        
        {viewingAccount && (
          <div className="p-1.5 text-center">
            <Badge variant="secondary" className="text-[8px] glass-button px-1.5 py-0.5">
              {viewingAccount.slice(0, 6)}...
            </Badge>
            <Button
              variant="link"
              size="sm"
              onClick={clearAccountView}
              className="text-[8px] p-0 h-auto mt-0.5 text-primary"
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
                        className={`flex items-center justify-center w-11 h-11 rounded-xl transition-all duration-200 ${
                          isActive
                            ? "bg-white/10 border border-white/20 shadow-glow-sm"
                            : "hover:bg-white/5"
                        }`}
                      >
                        <Icon className={`w-[18px] h-[18px] ${isActive ? item.color : 'text-muted-foreground'}`} />
                      </button>
                    </HoverCardTrigger>
                    <HoverCardContent 
                      side="right" 
                      align="start"
                      sideOffset={6}
                      className="w-52 p-1.5 bg-background/95 backdrop-blur-xl border border-white/10 shadow-xl z-[100]"
                    >
                      <div className="space-y-0.5">
                        <div className={`text-xs font-semibold px-2.5 py-1.5 ${item.color}`}>
                          {item.label}
                        </div>
                        {item.subItems.map((subItem) => {
                          const SubIcon = subItem.icon;
                          const isSubActive = location.pathname === subItem.path;
                          return (
                            <Link
                              key={subItem.path}
                              to={subItem.path}
                              className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                                isSubActive
                                  ? "bg-white/10 text-foreground"
                                  : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                              }`}
                            >
                              <SubIcon className="w-3.5 h-3.5" />
                              <span>{subItem.label}</span>
                              <ChevronRight className="w-2.5 h-2.5 ml-auto opacity-50" />
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
                      className={`flex items-center justify-center w-11 h-11 rounded-xl transition-all duration-200 ${
                        isActive
                          ? "bg-white/10 border border-white/20 shadow-glow-sm"
                          : "hover:bg-white/5"
                      }`}
                    >
                      <Icon className={`w-[18px] h-[18px] ${isActive ? item.color : 'text-muted-foreground'}`} />
                    </Link>
                  </HoverCardTrigger>
                  <HoverCardContent
                    side="right" 
                    align="start"
                    sideOffset={6}
                    className="w-auto px-2.5 py-1.5 bg-background/95 backdrop-blur-xl border border-white/10 shadow-xl z-[100]"
                  >
                    <span className="text-xs font-medium">{item.label}</span>
                  </HoverCardContent>
                </HoverCard>
              );
            })}
          </nav>
        </ScrollArea>

        <div className="p-2.5 border-t border-white/5 w-full flex justify-center">
          <HoverCard openDelay={0} closeDelay={100}>
            <HoverCardTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="w-11 h-11 rounded-xl text-muted-foreground hover:bg-white/5 hover:text-foreground"
                onClick={handleLogout}
              >
                <LogOut className="w-[18px] h-[18px]" />
              </Button>
            </HoverCardTrigger>
            <HoverCardContent 
              side="right" 
              align="start"
              sideOffset={6}
              className="w-auto px-2.5 py-1.5 bg-background/95 backdrop-blur-xl border border-white/10 shadow-xl z-[100]"
            >
              <span className="text-xs font-medium">Abmelden</span>
            </HoverCardContent>
          </HoverCard>
        </div>
      </aside>

      <main className="flex-1 overflow-auto flex flex-col relative z-10">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-center p-4 border-b border-white/5 bg-background/80 backdrop-blur-xl">
          <img 
            src={pitchfirstLogo} 
            alt="pitchfirst.io" 
            className="h-8 object-contain"
          />
        </header>
        
        {/* Desktop Top Bar */}
        <TopBar />
        
        <div className="flex-1 p-4 md:p-6 pb-24 md:pb-6">
          {/* Live Online Leads Banner */}
          {onlineLeads.length > 0 && (
            <div className="mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/30 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                  </span>
                  <span className="text-sm font-semibold text-green-400">{onlineLeads.length} Lead{onlineLeads.length > 1 ? "s" : ""} gerade online</span>
                </div>
                {onlineLeads.slice(0, 3).map((lead) => (
                  <button
                    key={lead.id}
                    onClick={() => handleHotLeadCall(lead)}
                    className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/20 hover:bg-green-500/30 transition-colors text-sm"
                  >
                    <span className="text-green-300 font-medium">{lead.first_name} {lead.last_name}</span>
                    {(lead.phone || lead.mobile) && (
                      <Phone className="w-3 h-3 text-green-400" />
                    )}
                  </button>
                ))}
                {onlineLeads.length > 3 && (
                  <span className="text-xs text-green-400/60">+{onlineLeads.length - 3} weitere</span>
                )}
              </div>
            </div>
          )}
          {children}
        </div>
        <footer className="hidden md:block py-4 px-6 border-t border-white/5 text-center text-muted-foreground text-sm">
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
      
      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />

      {/* Global Softphone for Hot Lead Instant Calls */}
      {hotLeadCall && (
        <SoftphoneDialog
          open={hotLeadCall.open}
          onClose={() => setHotLeadCall(null)}
          phoneNumber={hotLeadCall.phone}
          contactName={hotLeadCall.name}
          contactId={hotLeadCall.contactId}
        />
      )}
    </div>
  );
};

export default Layout;