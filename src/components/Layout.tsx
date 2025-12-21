import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, CheckSquare, Users, BarChart3, LogOut, Activity, Phone, CreditCard, Key, FileText, Upload, MessageSquare, Shield, TrendingUp, Megaphone, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useHotLeadNotifications } from "@/hooks/useHotLeadNotifications";

interface LayoutProps {
  children: ReactNode;
}

interface NavItem {
  path: string;
  label: string;
  icon: any;
}

interface NavSection {
  title: string;
  items: NavItem[];
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

  const navSections: NavSection[] = [
    {
      title: "Sales",
      items: [
        { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { path: "/campaigns", label: "Kampagnen", icon: Megaphone },
        { path: "/pipeline", label: "Pipeline", icon: Home },
        { path: "/today", label: "Heute", icon: CheckSquare },
        { path: "/inbound", label: "Inbound", icon: TrendingUp },
        { path: "/outbound", label: "Outbound", icon: Megaphone },
      ]
    },
    {
      title: "Kontakte",
      items: [
        { path: "/contacts", label: "Alle Kontakte", icon: Users },
        { path: "/import-leads", label: "Import", icon: Upload },
      ]
    },
    {
      title: "Calling",
      items: [
        { path: "/power-dialer", label: "Power Dialer", icon: Phone },
        { path: "/activity-log", label: "Activity Log", icon: Activity },
      ]
    },
    {
      title: "Tools",
      items: [
        { path: "/kpi", label: "KPIs", icon: BarChart3 },
        { path: "/call-script", label: "Call Script", icon: FileText },
        { path: "/objections", label: "Einwände", icon: MessageSquare },
      ]
    },
    {
      title: "Einstellungen",
      items: [
        { path: "/api-keys", label: "API Keys", icon: Key },
        { path: "/billing", label: "Abrechnung", icon: CreditCard },
      ]
    },
  ];

  // Add Master Admin section if super admin
  if (isSuperAdmin) {
    navSections.push({
      title: "Admin",
      items: [{ path: "/master-admin", label: "Master Admin", icon: Shield }]
    });
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-56 bg-sidebar border-r border-sidebar-border flex flex-col">
        <div className="p-4 border-b border-sidebar-border">
          <h1 className="text-xl font-bold text-sidebar-foreground">Hochpreis-Leads</h1>
          {viewingAccount && (
            <div className="mt-2">
              <Badge variant="secondary" className="text-xs">
                Viewing: {viewingAccount}
              </Badge>
              <Button
                variant="link"
                size="sm"
                onClick={clearAccountView}
                className="text-xs p-0 h-auto mt-1"
              >
                Zurück zu Master Admin
              </Button>
            </div>
          )}
        </div>
        
        <ScrollArea className="flex-1">
          <nav className="p-3 space-y-4">
            {navSections.map((section) => (
              <div key={section.title}>
                <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/50">
                  {section.title}
                </p>
                <div className="space-y-0.5">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-md transition-colors text-sm ${
                          isActive
                            ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                            : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </ScrollArea>

        <div className="p-3 border-t border-sidebar-border">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Abmelden
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto flex flex-col">
        <div className="flex-1">
          {children}
        </div>
        <footer className="py-4 px-6 border-t border-border text-center text-muted-foreground text-sm">
          <div className="flex justify-center gap-6">
            <a 
              href="https://www.content-leads.de/impressum" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              Impressum
            </a>
            <a 
              href="https://www.content-leads.de/datenschutz" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
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
