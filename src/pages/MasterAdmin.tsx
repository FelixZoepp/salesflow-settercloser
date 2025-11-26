import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Building2, Users, TrendingUp, Phone, AlertCircle, Plus, Pencil } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface Account {
  id: string;
  name: string;
  company_name: string | null;
  email: string | null;
  phone: string | null;
  is_active: boolean;
  subscription_status: string;
  created_at: string;
}

interface Stats {
  total_contacts: number;
  total_deals: number;
  total_activities: number;
  active_users: number;
}

export default function MasterAdmin() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    company_name: "",
    email: "",
    phone: "",
    is_active: true,
    subscription_status: "trial"
  });
  const navigate = useNavigate();

  useEffect(() => {
    checkSuperAdminAndFetchAccounts();
  }, []);

  useEffect(() => {
    if (selectedAccountId) {
      fetchAccountStats(selectedAccountId);
    }
  }, [selectedAccountId]);

  const checkSuperAdminAndFetchAccounts = async () => {
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
      const { data: accountsData, error } = await supabase
        .from('accounts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAccounts(accountsData || []);

      // Select first account by default
      if (accountsData && accountsData.length > 0) {
        setSelectedAccountId(accountsData[0].id);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error("Fehler beim Laden");
    } finally {
      setLoading(false);
    }
  };

  const fetchAccountStats = async (accountId: string) => {
    try {
      // Get counts for this account
      const [contactsRes, dealsRes, activitiesRes, usersRes] = await Promise.all([
        supabase.from('contacts').select('id', { count: 'exact', head: true }).eq('account_id', accountId),
        supabase.from('deals').select('id', { count: 'exact', head: true }).eq('account_id', accountId),
        supabase.from('activities').select('id', { count: 'exact', head: true }).eq('account_id', accountId),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('account_id', accountId),
      ]);

      setStats({
        total_contacts: contactsRes.count || 0,
        total_deals: dealsRes.count || 0,
        total_activities: activitiesRes.count || 0,
        active_users: usersRes.count || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleViewAccount = (view: string) => {
    if (!selectedAccountId) return;
    
    // Store selected account in session storage for filtering
    sessionStorage.setItem('master_admin_account_id', selectedAccountId);
    
    // Navigate to the view
    navigate(`/${view}`);
  };

  const handleCreateAccount = async () => {
    try {
      const { error } = await supabase
        .from('accounts')
        .insert({
          name: formData.name,
          company_name: formData.company_name || null,
          email: formData.email || null,
          phone: formData.phone || null,
          is_active: formData.is_active,
          subscription_status: formData.subscription_status
        });

      if (error) throw error;

      toast.success("Account erfolgreich erstellt");
      setIsCreateDialogOpen(false);
      setFormData({
        name: "",
        company_name: "",
        email: "",
        phone: "",
        is_active: true,
        subscription_status: "trial"
      });
      
      // Refresh accounts list
      checkSuperAdminAndFetchAccounts();
    } catch (error) {
      console.error('Error creating account:', error);
      toast.error("Fehler beim Erstellen des Accounts");
    }
  };

  const handleEditAccount = async () => {
    if (!selectedAccountId) return;

    try {
      const { error } = await supabase
        .from('accounts')
        .update({
          name: formData.name,
          company_name: formData.company_name || null,
          email: formData.email || null,
          phone: formData.phone || null,
          is_active: formData.is_active,
          subscription_status: formData.subscription_status
        })
        .eq('id', selectedAccountId);

      if (error) throw error;

      toast.success("Account erfolgreich aktualisiert");
      setIsEditDialogOpen(false);
      
      // Refresh accounts list
      checkSuperAdminAndFetchAccounts();
    } catch (error) {
      console.error('Error updating account:', error);
      toast.error("Fehler beim Aktualisieren des Accounts");
    }
  };

  const openEditDialog = () => {
    const account = accounts.find(a => a.id === selectedAccountId);
    if (account) {
      setFormData({
        name: account.name,
        company_name: account.company_name || "",
        email: account.email || "",
        phone: account.phone || "",
        is_active: account.is_active,
        subscription_status: account.subscription_status || "trial"
      });
      setIsEditDialogOpen(true);
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

  const selectedAccount = accounts.find(a => a.id === selectedAccountId);

  return (
    <Layout>
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">Master Admin Dashboard</h1>
              <p className="text-muted-foreground">
                Überblick über alle Kunden-Accounts
              </p>
            </div>
            <Badge variant="destructive" className="text-sm">
              Super Admin
            </Badge>
          </div>

          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <AlertCircle className="h-5 w-5 text-primary" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Master Admin Modus aktiv</p>
                  <p className="text-xs text-muted-foreground">
                    Sie haben Zugriff auf alle Kundendaten. Wählen Sie einen Account aus.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Account Selector */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Kunden-Account auswählen</CardTitle>
            <CardDescription>
              {accounts.length} Accounts verfügbar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3 mb-4">
              <Button onClick={() => setIsCreateDialogOpen(true)} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Neuer Account
              </Button>
              {selectedAccountId && (
                <Button onClick={openEditDialog} variant="outline" size="sm">
                  <Pencil className="h-4 w-4 mr-2" />
                  Bearbeiten
                </Button>
              )}
            </div>
            <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Account auswählen..." />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      <span className="font-medium">{account.name}</span>
                      {account.company_name && (
                        <span className="text-muted-foreground">({account.company_name})</span>
                      )}
                      {!account.is_active && (
                        <Badge variant="secondary">Inaktiv</Badge>
                      )}
                      <Badge variant="outline">{account.subscription_status}</Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {selectedAccount && stats && (
          <>
            {/* Account Info */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>{selectedAccount.name}</CardTitle>
                <CardDescription>
                  {selectedAccount.email} • Erstellt am {new Date(selectedAccount.created_at).toLocaleDateString('de-DE')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Badge variant={selectedAccount.is_active ? "default" : "secondary"}>
                    {selectedAccount.is_active ? "Aktiv" : "Inaktiv"}
                  </Badge>
                  <Badge variant="outline">{selectedAccount.subscription_status}</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    Kontakte
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.total_contacts}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    Deals
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.total_deals}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    Aktivitäten
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.total_activities}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    Aktive User
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.active_users}</div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Account anzeigen</CardTitle>
                <CardDescription>
                  Navigieren Sie zu den verschiedenen Bereichen dieses Accounts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Button 
                    variant="outline" 
                    onClick={() => handleViewAccount('pipeline')}
                    className="w-full"
                  >
                    Pipeline
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => handleViewAccount('contacts')}
                    className="w-full"
                  >
                    Kontakte
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => handleViewAccount('activity-log')}
                    className="w-full"
                  >
                    Aktivitäten
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => handleViewAccount('kpi')}
                    className="w-full"
                  >
                    KPIs
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Neuen Account erstellen</DialogTitle>
            <DialogDescription>
              Erstelle einen neuen Kunden-Account für das System.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Account Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="z.B. Kunde GmbH"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="company_name">Firmenname</Label>
              <Input
                id="company_name"
                value={formData.company_name}
                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                placeholder="Offizielle Firmenbezeichnung"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">E-Mail</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="kontakt@kunde.de"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Telefon</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+49 123 456789"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="subscription_status">Subscription Status</Label>
              <Select
                value={formData.subscription_status}
                onValueChange={(value) => setFormData({ ...formData, subscription_status: value })}
              >
                <SelectTrigger id="subscription_status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="trial">Trial</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label htmlFor="is_active">Account aktiv</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleCreateAccount} disabled={!formData.name}>
              Account erstellen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Account bearbeiten</DialogTitle>
            <DialogDescription>
              Aktualisiere die Account-Informationen.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Account Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="z.B. Kunde GmbH"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-company_name">Firmenname</Label>
              <Input
                id="edit-company_name"
                value={formData.company_name}
                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                placeholder="Offizielle Firmenbezeichnung"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-email">E-Mail</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="kontakt@kunde.de"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-phone">Telefon</Label>
              <Input
                id="edit-phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+49 123 456789"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-subscription_status">Subscription Status</Label>
              <Select
                value={formData.subscription_status}
                onValueChange={(value) => setFormData({ ...formData, subscription_status: value })}
              >
                <SelectTrigger id="edit-subscription_status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="trial">Trial</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="edit-is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label htmlFor="edit-is_active">Account aktiv</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleEditAccount} disabled={!formData.name}>
              Speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}