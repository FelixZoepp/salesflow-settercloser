import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Users, Briefcase, Activity, CreditCard, Calendar, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface Account {
  id: string;
  name: string;
  company_name: string | null;
  email: string | null;
  is_active: boolean;
  subscription_status: string;
  created_at: string;
}

interface AccountWithStats extends Account {
  contacts_count: number;
  deals_count: number;
  activities_count: number;
  users_count: number;
  subscription?: {
    plan_name: string | null;
    status: string;
    current_period_end: string | null;
  };
}

const PLAN_DISPLAY: Record<string, { name: string; color: string }> = {
  "prod_RdNTM2YT5z3lv6": { name: "Basic", color: "bg-blue-500" },
  "prod_RdNTYNmG2Hn8Uk": { name: "Pro", color: "bg-purple-500" },
  "prod_RdNTeXrcfCeBIv": { name: "Enterprise", color: "bg-amber-500" },
};

export default function MasterAdmin() {
  const [accountsWithStats, setAccountsWithStats] = useState<AccountWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkSuperAdminAndFetchData();
  }, []);

  const checkSuperAdminAndFetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      // Check if user is super admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_super_admin')
        .eq('id', user.id)
        .single();

      if (!profile?.is_super_admin) {
        toast.error("Kein Zugriff - nur für Master-Admins");
        navigate('/pipeline');
        return;
      }

      setIsSuperAdmin(true);

      // Fetch all accounts
      const { data: accounts, error } = await supabase
        .from('accounts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch stats for all accounts in parallel
      const accountsData = await Promise.all(
        (accounts || []).map(async (account) => {
          const [contactsRes, dealsRes, activitiesRes, usersRes] = await Promise.all([
            supabase.from('contacts').select('id', { count: 'exact', head: true }).eq('account_id', account.id),
            supabase.from('deals').select('id', { count: 'exact', head: true }).eq('account_id', account.id),
            supabase.from('activities').select('id', { count: 'exact', head: true }).eq('account_id', account.id),
            supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('account_id', account.id),
          ]);

          // Get subscription for this account
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id')
            .eq('account_id', account.id)
            .limit(1);

          let subscription = undefined;
          if (profiles && profiles.length > 0) {
            const { data: sub } = await supabase
              .from('subscriptions')
              .select('plan_name, status, current_period_end')
              .eq('user_id', profiles[0].id)
              .single();
            if (sub) {
              subscription = sub;
            }
          }

          return {
            ...account,
            contacts_count: contactsRes.count || 0,
            deals_count: dealsRes.count || 0,
            activities_count: activitiesRes.count || 0,
            users_count: usersRes.count || 0,
            subscription,
          };
        })
      );

      setAccountsWithStats(accountsData);
    } catch (error) {
      console.error('Error:', error);
      toast.error("Fehler beim Laden");
    } finally {
      setLoading(false);
    }
  };

  const handleViewAccount = (accountId: string) => {
    sessionStorage.setItem('master_admin_account_id', accountId);
    navigate('/pipeline');
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <p className="text-muted-foreground">Lädt...</p>
        </div>
      </Layout>
    );
  }

  if (!isSuperAdmin) {
    return null;
  }

  // Summary stats
  const totalAccounts = accountsWithStats.length;
  const activeAccounts = accountsWithStats.filter(a => a.is_active).length;
  const totalContacts = accountsWithStats.reduce((sum, a) => sum + a.contacts_count, 0);
  const totalDeals = accountsWithStats.reduce((sum, a) => sum + a.deals_count, 0);

  return (
    <Layout>
      <div className="container mx-auto py-6 px-4 max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Master Admin</h1>
              <p className="text-sm text-muted-foreground">
                Alle Kunden-Accounts auf einen Blick
              </p>
            </div>
            <Badge variant="destructive">Super Admin</Badge>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="glass-card">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-blue-500/10">
                  <Building2 className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalAccounts}</p>
                  <p className="text-xs text-muted-foreground">Accounts</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-green-500/10">
                  <TrendingUp className="h-5 w-5 text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{activeAccounts}</p>
                  <p className="text-xs text-muted-foreground">Aktiv</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-purple-500/10">
                  <Users className="h-5 w-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalContacts}</p>
                  <p className="text-xs text-muted-foreground">Kontakte</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-500/10">
                  <Briefcase className="h-5 w-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalDeals}</p>
                  <p className="text-xs text-muted-foreground">Deals</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Accounts Table */}
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Alle Accounts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Account</th>
                    <th className="text-center py-3 px-2 text-sm font-medium text-muted-foreground">Plan</th>
                    <th className="text-center py-3 px-2 text-sm font-medium text-muted-foreground">
                      <Users className="h-4 w-4 inline" />
                    </th>
                    <th className="text-center py-3 px-2 text-sm font-medium text-muted-foreground">
                      <Briefcase className="h-4 w-4 inline" />
                    </th>
                    <th className="text-center py-3 px-2 text-sm font-medium text-muted-foreground">
                      <Activity className="h-4 w-4 inline" />
                    </th>
                    <th className="text-center py-3 px-2 text-sm font-medium text-muted-foreground">User</th>
                    <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">Erstellt</th>
                  </tr>
                </thead>
                <tbody>
                  {accountsWithStats.map((account) => {
                    const planInfo = account.subscription?.plan_name 
                      ? PLAN_DISPLAY[account.subscription.plan_name] 
                      : null;

                    return (
                      <tr 
                        key={account.id} 
                        className="border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors"
                        onClick={() => handleViewAccount(account.id)}
                      >
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="font-medium text-sm">{account.name}</p>
                              {account.company_name && (
                                <p className="text-xs text-muted-foreground">{account.company_name}</p>
                              )}
                            </div>
                            {!account.is_active && (
                              <Badge variant="secondary" className="text-[10px] ml-2">Inaktiv</Badge>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-2 text-center">
                          {planInfo ? (
                            <Badge className={`${planInfo.color} text-white text-[10px]`}>
                              {planInfo.name}
                            </Badge>
                          ) : account.subscription?.status === 'active' ? (
                            <Badge variant="outline" className="text-[10px]">Aktiv</Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">–</span>
                          )}
                        </td>
                        <td className="py-3 px-2 text-center">
                          <span className="text-sm font-medium">{account.contacts_count}</span>
                        </td>
                        <td className="py-3 px-2 text-center">
                          <span className="text-sm font-medium">{account.deals_count}</span>
                        </td>
                        <td className="py-3 px-2 text-center">
                          <span className="text-sm font-medium">{account.activities_count}</span>
                        </td>
                        <td className="py-3 px-2 text-center">
                          <span className="text-sm font-medium">{account.users_count}</span>
                        </td>
                        <td className="py-3 px-2 text-right">
                          <span className="text-xs text-muted-foreground">
                            {new Date(account.created_at).toLocaleDateString('de-DE')}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}