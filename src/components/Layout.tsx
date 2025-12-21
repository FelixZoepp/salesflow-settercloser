import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Megaphone, Users, Briefcase, Phone, Settings, LogOut, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useHotLeadNotifications } from "@/hooks/useHotLeadNotifications";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import contentLeadsLogo from "@/assets/content-leads-logo.png";
interface LayoutProps {
  children: ReactNode;
}

interface NavItem {
  path: string;
  label: string;
  icon: any;
  color: string;
}

const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [viewingAccount, setViewingAccount] = useState<string | null>(null);

  // Enable hot lead notifications
  useHotLeadNotifications();
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
    { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard, color: "text-blue-400" },
    { path: "/campaigns", label: "Kampagnen", icon: Megaphone, color: "text-purple-400" },
    { path: "/contacts", label: "Kontakte", icon: Users, color: "text-green-400" },
    { path: "/pipeline", label: "Vertrieb", icon: Briefcase, color: "text-amber-400" },
    { path: "/power-dialer", label: "Calling", icon: Phone, color: "text-rose-400" },
    { path: "/api-keys", label: "Einstellungen", icon: Settings, color: "text-slate-400" },
  ];

  // Add Master Admin if super admin
  if (isSuperAdmin) {
    navItems.push({ path: "/master-admin", label: "Admin", icon: Shield, color: "text-red-400" });
  }

  return (
    <TooltipProvider>
      <div className="flex h-screen bg-background relative">
        {/* Ambient background glow */}
        <div className="ambient-glow" />
        
        {/* Sidebar - Minimal Icon Only */}
        <aside className="w-20 glass-sidebar flex flex-col relative z-10 items-center">
        <div className="p-3 border-b border-white/5 w-full flex justify-center">
            <img 
              src={contentLeadsLogo} 
              alt="Content Leads" 
              className="w-12 h-12 rounded-full object-cover"
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
            <nav className="p-2 flex flex-col items-center gap-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Tooltip key={item.path}>
                    <TooltipTrigger asChild>
                      <Link
                        to={item.path}
                        className={`flex items-center justify-center w-12 h-12 rounded-2xl transition-all duration-200 ${
                          isActive
                            ? "bg-white/10 border border-white/20 shadow-glow-sm"
                            : "hover:bg-white/5"
                        }`}
                      >
                        <Icon className={`w-5 h-5 ${isActive ? item.color : 'text-muted-foreground'} ${isActive ? '' : `hover:${item.color}`}`} />
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="glass-card border-white/10">
                      <p>{item.label}</p>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </nav>
          </ScrollArea>

          <div className="p-3 border-t border-white/5 w-full flex justify-center">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-12 h-12 rounded-2xl text-muted-foreground hover:bg-white/5 hover:text-foreground"
                  onClick={handleLogout}
                >
                  <LogOut className="w-5 h-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" className="glass-card border-white/10">
                <p>Abmelden</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </aside>
        {/* Main Content */}
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
    </TooltipProvider>
  );
};

export default Layout;
