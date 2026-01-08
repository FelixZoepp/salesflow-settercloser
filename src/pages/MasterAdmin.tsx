import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, Users, Briefcase, Activity, TrendingUp, UserX, Eye, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import { de } from "date-fns/locale";

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

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  is_super_admin: boolean;
  trial_ends_at: string | null;
  account_id: string | null;
  created_at: string;
  accounts?: { name: string } | null;
}

const PLAN_DISPLAY: Record<string, { name: string; color: string }> = {
  "prod_Tka87AKXNmsZUv": { name: "Starter", color: "bg-blue-500" },
  "prod_TkaAeLeq8rEn90": { name: "Starter (Jahr)", color: "bg-blue-500" },
  "prod_TkoJ98sfzflYyR": { name: "Pro", color: "bg-purple-500" },
  "prod_TkoJ8E0e8l4vwV": { name: "Pro (Jahr)", color: "bg-purple-500" },
};

export default function MasterAdmin() {
  const [accountsWithStats, setAccountsWithStats] = useState<AccountWithStats[]>([]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);
  const [userToRemoveAccess, setUserToRemoveAccess] = useState<UserProfile | null>(null);
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

      // Fetch all users
      const { data: usersData } = await supabase
        .from('profiles')
        .select(`
          id,
          name,
          email,
          role,
          is_super_admin,
          trial_ends_at,
          account_id,
          created_at,
          accounts:account_id (name)
        `)
        .order('created_at', { ascending: false });

      if (usersData) {
        setAllUsers(usersData as unknown as UserProfile[]);
      }
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

  const handleRemoveAccess = async () => {
    if (!userToRemoveAccess) return;

    try {
      // Remove trial access by setting trial_ends_at to past date
      const { error } = await supabase
        .from('profiles')
        .update({ trial_ends_at: new Date('2000-01-01').toISOString() })
        .eq('id', userToRemoveAccess.id);

      if (error) throw error;

      toast.success(`Zugang für ${userToRemoveAccess.name} entfernt`);
      setUserToRemoveAccess(null);
      checkSuperAdminAndFetchData();
    } catch (error: any) {
      console.error('Error removing access:', error);
      toast.error("Fehler: " + error.message);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      // Delete profile (this won't delete auth user but removes app access)
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userToDelete.id);

      if (error) throw error;

      toast.success(`Nutzer ${userToDelete.name} gelöscht`);
      setUserToDelete(null);
      checkSuperAdminAndFetchData();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast.error("Fehler: " + error.message);
    }
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
  const totalUsers = allUsers.length;

  return (
    <Layout>
      <div className="container mx-auto py-6 px-4 max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Master Admin</h1>
              <p className="text-sm text-muted-foreground">
                Alle Kunden-Accounts und Nutzer verwalten
              </p>
            </div>
            <Badge variant="destructive">Super Admin</Badge>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
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
                <div className="p-2 rounded-xl bg-orange-500/10">
                  <Users className="h-5 w-5 text-orange-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalUsers}</p>
                  <p className="text-xs text-muted-foreground">Nutzer</p>
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

        {/* Tabs */}
        <Tabs defaultValue="accounts" className="space-y-4">
          <TabsList>
            <TabsTrigger value="accounts">Accounts ({totalAccounts})</TabsTrigger>
            <TabsTrigger value="users">Nutzer ({totalUsers})</TabsTrigger>
          </TabsList>

          {/* Accounts Tab */}
          <TabsContent value="accounts">
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
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card className="glass-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Alle Nutzer</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Nutzer</th>
                        <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Account</th>
                        <th className="text-center py-3 px-2 text-sm font-medium text-muted-foreground">Rolle</th>
                        <th className="text-center py-3 px-2 text-sm font-medium text-muted-foreground">Zugang</th>
                        <th className="text-center py-3 px-2 text-sm font-medium text-muted-foreground">Trial endet</th>
                        <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">Erstellt</th>
                        <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">Aktionen</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allUsers.map((user) => {
                        const hasActiveTrial = user.trial_ends_at && new Date(user.trial_ends_at) > new Date();
                        
                        return (
                          <tr 
                            key={user.id} 
                            className="border-b border-white/5 hover:bg-white/5 transition-colors"
                          >
                            <td className="py-3 px-2">
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <p className="font-medium text-sm">{user.name}</p>
                                  <p className="text-xs text-muted-foreground">{user.email}</p>
                                </div>
                                {user.is_super_admin && (
                                  <Badge variant="destructive" className="text-[10px] ml-2">Super Admin</Badge>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-2">
                              <span className="text-sm">{user.accounts?.name || "–"}</span>
                            </td>
                            <td className="py-3 px-2 text-center">
                              <Badge variant="outline" className="text-[10px]">
                                {user.role}
                              </Badge>
                            </td>
                            <td className="py-3 px-2 text-center">
                              {user.is_super_admin ? (
                                <Badge className="bg-purple-500 text-white text-[10px]">Pro (Admin)</Badge>
                              ) : hasActiveTrial ? (
                                <Badge className="bg-green-500 text-white text-[10px]">Pro (Trial)</Badge>
                              ) : (
                                <Badge variant="secondary" className="text-[10px]">Kein Zugang</Badge>
                              )}
                            </td>
                            <td className="py-3 px-2 text-center">
                              {user.trial_ends_at ? (
                                <span className={`text-xs ${hasActiveTrial ? 'text-green-400' : 'text-muted-foreground'}`}>
                                  {format(new Date(user.trial_ends_at), "dd.MM.yyyy", { locale: de })}
                                </span>
                              ) : (
                                <span className="text-xs text-muted-foreground">–</span>
                              )}
                            </td>
                            <td className="py-3 px-2 text-right">
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(user.created_at), "dd.MM.yyyy", { locale: de })}
                              </span>
                            </td>
                            <td className="py-3 px-2 text-right">
                              <div className="flex items-center justify-end gap-1">
                                {user.account_id && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleViewAccount(user.account_id!)}
                                    title="Account ansehen"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                )}
                                {!user.is_super_admin && hasActiveTrial && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setUserToRemoveAccess(user)}
                                    title="Zugang entfernen"
                                  >
                                    <UserX className="h-4 w-4 text-orange-400" />
                                  </Button>
                                )}
                                {!user.is_super_admin && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setUserToDelete(user)}
                                    title="Nutzer löschen"
                                  >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Remove Access Dialog */}
      <AlertDialog open={!!userToRemoveAccess} onOpenChange={() => setUserToRemoveAccess(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Zugang entfernen?</AlertDialogTitle>
            <AlertDialogDescription>
              Der Trial-Zugang für <strong>{userToRemoveAccess?.name}</strong> wird deaktiviert. 
              Der Nutzer kann die App weiterhin nutzen, hat aber keinen Pro-Zugriff mehr.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveAccess} className="bg-orange-500 hover:bg-orange-600">
              Zugang entfernen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete User Dialog */}
      <AlertDialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Nutzer löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{userToDelete?.name}</strong> ({userToDelete?.email}) wird vollständig entfernt.
              Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} className="bg-destructive hover:bg-destructive/90">
              Nutzer löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}