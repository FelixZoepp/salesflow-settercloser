import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, CheckSquare, Users, BarChart3, LogOut, Activity, Phone, CreditCard, Key, FileText, Upload, MessageSquare, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [viewingAccount, setViewingAccount] = useState<string | null>(null);

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
      // Fetch account name
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

  const navItems = [
    { path: "/pipeline", label: "Pipeline", icon: Home },
    { path: "/today", label: "Heute", icon: CheckSquare },
    { path: "/contacts", label: "Kontakte", icon: Users },
    { path: "/import-leads", label: "Import Leads", icon: Upload },
    { path: "/power-dialer", label: "Power Dialer", icon: Phone },
    { path: "/activity-log", label: "Activity Log", icon: Activity },
    { path: "/kpi", label: "KPIs", icon: BarChart3 },
    { path: "/call-script", label: "Call Script", icon: FileText },
    { path: "/objections", label: "Einwände", icon: MessageSquare },
    { path: "/api-keys", label: "API Keys", icon: Key },
    { path: "/billing", label: "Abrechnung", icon: CreditCard },
  ];

  // Add Master Admin link if super admin
  if (isSuperAdmin) {
    navItems.push({ path: "/master-admin", label: "Master Admin", icon: Shield });
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
        <div className="p-6 border-b border-sidebar-border">
          <h1 className="text-2xl font-bold text-sidebar-foreground">SalesFlow</h1>
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
        
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          <Button
            variant="ghost"
            className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent"
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5 mr-3" />
            Abmelden
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
};

export default Layout;