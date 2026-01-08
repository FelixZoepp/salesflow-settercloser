import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Copy, Trash2, Link, Users, Clock, Check, X } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";

interface Invitation {
  id: string;
  token: string;
  account_id: string | null;
  email_hint: string | null;
  role: string;
  expires_at: string;
  used_at: string | null;
  created_at: string;
}

export default function Invitations() {
  const navigate = useNavigate();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [creating, setCreating] = useState(false);
  
  // Form state
  const [emailHint, setEmailHint] = useState("");
  const [role, setRole] = useState<string>("setter");
  const [expiresInDays, setExpiresInDays] = useState("7");

  useEffect(() => {
    checkAccessAndFetchData();
  }, []);

  const checkAccessAndFetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("is_super_admin, account_id")
        .eq("id", user.id)
        .single();

      if (!profile?.is_super_admin) {
        toast.error("Nur Super-Admins haben Zugriff");
        navigate("/");
        return;
      }

      setIsSuperAdmin(true);

      // Fetch invitations
      await fetchInvitations();
    } catch (error) {
      console.error("Error:", error);
      toast.error("Fehler beim Laden");
    } finally {
      setLoading(false);
    }
  };

  const fetchInvitations = async () => {
    const { data, error } = await supabase
      .from("invitations")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching invitations:", error);
      return;
    }

    setInvitations(data || []);
  };

  const createInvitation = async () => {
    setCreating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Nicht eingeloggt");

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + parseInt(expiresInDays));

      const { data, error } = await supabase
        .from("invitations")
        .insert({
          created_by: user.id,
          email_hint: emailHint || null,
          role: role as "setter" | "closer" | "admin",
          expires_at: expiresAt.toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      setEmailHint("");
      await fetchInvitations();

      // Auto-copy link (may fail due to browser permissions)
      const link = `${window.location.origin}/invite/${data.token}`;
      try {
        await navigator.clipboard.writeText(link);
        toast.success("Einladungslink erstellt und kopiert!");
      } catch {
        toast.success("Einladungslink erstellt! Klicke auf das Kopier-Icon um den Link zu kopieren.");
      }
    } catch (error: any) {
      console.error("Error creating invitation:", error);
      toast.error("Fehler: " + error.message);
    } finally {
      setCreating(false);
    }
  };

  const copyLink = async (token: string) => {
    const link = `${window.location.origin}/invite/${token}`;
    await navigator.clipboard.writeText(link);
    toast.success("Link kopiert!");
  };

  const deleteInvitation = async (id: string) => {
    const { error } = await supabase
      .from("invitations")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Fehler beim Löschen");
      return;
    }

    toast.success("Einladung gelöscht");
    await fetchInvitations();
  };

  const getStatusBadge = (invitation: Invitation) => {
    if (invitation.used_at) {
      return <Badge variant="secondary" className="bg-green-100 text-green-800"><Check className="h-3 w-3 mr-1" /> Verwendet</Badge>;
    }
    if (new Date(invitation.expires_at) < new Date()) {
      return <Badge variant="destructive"><X className="h-3 w-3 mr-1" /> Abgelaufen</Badge>;
    }
    return <Badge variant="outline" className="bg-blue-50 text-blue-700"><Clock className="h-3 w-3 mr-1" /> Aktiv</Badge>;
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  if (!isSuperAdmin) {
    return null;
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Einladungslinks</h1>
            <p className="text-muted-foreground">Erstelle Links für Testzugänge</p>
          </div>
          <Badge variant="outline" className="text-sm">
            <Users className="h-4 w-4 mr-1" />
            {invitations.filter(i => !i.used_at && new Date(i.expires_at) > new Date()).length} aktive Einladungen
          </Badge>
        </div>

        {/* Create new invitation */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Neue Einladung erstellen
            </CardTitle>
            <CardDescription>
              Der Link kann manuell per WhatsApp, E-Mail etc. verschickt werden
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">

              <div className="space-y-2">
                <Label>E-Mail (optional)</Label>
                <Input
                  type="email"
                  placeholder="test@beispiel.de"
                  value={emailHint}
                  onChange={(e) => setEmailHint(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Plan & Rolle</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="setter">Starter</SelectItem>
                    <SelectItem value="closer">Pro</SelectItem>
                    <SelectItem value="admin">Admin (Pro)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Gültig für</Label>
                <Select value={expiresInDays} onValueChange={setExpiresInDays}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 Tag</SelectItem>
                    <SelectItem value="7">7 Tage</SelectItem>
                    <SelectItem value="14">14 Tage</SelectItem>
                    <SelectItem value="30">30 Tage</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button onClick={createInvitation} disabled={creating} className="w-full">
                  <Link className="h-4 w-4 mr-2" />
                  {creating ? "Erstelle..." : "Link erstellen"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Invitations list */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Alle Einladungen</CardTitle>
          </CardHeader>
          <CardContent>
            {invitations.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Noch keine Einladungen erstellt
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>E-Mail</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Gültig bis</TableHead>
                    <TableHead>Erstellt</TableHead>
                    <TableHead className="text-right">Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invitations.map((invitation) => (
                    <TableRow key={invitation.id}>
                      <TableCell>{getStatusBadge(invitation)}</TableCell>
                      <TableCell>{invitation.email_hint || "—"}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {invitation.role === 'setter' ? 'Starter' : 
                           invitation.role === 'closer' ? 'Pro' : 
                           invitation.role === 'admin' ? 'Admin (Pro)' : invitation.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {invitation.role === 'setter' ? 'Starter' : 
                           invitation.role === 'closer' ? 'Pro' : 
                           invitation.role === 'admin' ? 'Admin (Pro)' : invitation.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(invitation.expires_at), "dd.MM.yyyy", { locale: de })}
                      </TableCell>
                      <TableCell>
                        {format(new Date(invitation.created_at), "dd.MM.yyyy HH:mm", { locale: de })}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        {!invitation.used_at && new Date(invitation.expires_at) > new Date() && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyLink(invitation.token)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteInvitation(invitation.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
