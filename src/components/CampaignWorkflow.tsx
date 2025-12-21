import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { 
  Users, 
  UserPlus, 
  MessageSquare, 
  Clock, 
  CheckCircle2, 
  XCircle,
  ExternalLink,
  Copy,
  Flame,
  RefreshCw,
  Upload,
  FileText
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";

type WorkflowStatus = 
  | 'neu'
  | 'bereit_fuer_vernetzung'
  | 'vernetzung_ausstehend'
  | 'vernetzung_angenommen'
  | 'erstnachricht_gesendet'
  | 'kein_klick_fu_offen'
  | 'fu1_gesendet'
  | 'fu2_gesendet'
  | 'fu3_gesendet'
  | 'reagiert_warm'
  | 'abgeschlossen';

interface WorkflowContact {
  id: string;
  first_name: string;
  last_name: string;
  company: string | null;
  position: string | null;
  workflow_status: WorkflowStatus | null;
  connection_sent_at: string | null;
  connection_accepted_at: string | null;
  first_message_sent_at: string | null;
  fu1_sent_at: string | null;
  fu2_sent_at: string | null;
  fu3_sent_at: string | null;
  outreach_message: string | null;
  personalized_url: string | null;
  viewed: boolean | null;
  lead_score: number | null;
}

interface CampaignWorkflowProps {
  campaignId: string;
  campaignName: string;
}

const STATUS_LABELS: Record<WorkflowStatus, string> = {
  'neu': 'Neu',
  'bereit_fuer_vernetzung': 'Bereit für Vernetzung',
  'vernetzung_ausstehend': 'Vernetzung ausstehend',
  'vernetzung_angenommen': 'Vernetzung angenommen',
  'erstnachricht_gesendet': 'Erstnachricht gesendet',
  'kein_klick_fu_offen': 'Kein Klick – FU offen',
  'fu1_gesendet': 'FU 1 gesendet',
  'fu2_gesendet': 'FU 2 gesendet',
  'fu3_gesendet': 'FU 3 gesendet',
  'reagiert_warm': 'Reagiert / Warm',
  'abgeschlossen': 'Abgeschlossen'
};

export function CampaignWorkflow({ campaignId, campaignName }: CampaignWorkflowProps) {
  const [contacts, setContacts] = useState<WorkflowContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [todayMessageCount, setTodayMessageCount] = useState(0);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const [importing, setImporting] = useState(false);
  const MAX_DAILY_MESSAGES = 10;
  const MAX_PENDING_CONNECTIONS = 15;

  const fetchContacts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('contacts')
      .select('id, first_name, last_name, company, position, workflow_status, connection_sent_at, connection_accepted_at, first_message_sent_at, fu1_sent_at, fu2_sent_at, fu3_sent_at, outreach_message, personalized_url, viewed, lead_score')
      .eq('campaign_id', campaignId)
      .eq('lead_type', 'outbound')
      .order('created_at', { ascending: true });

    if (error) {
      toast.error("Fehler beim Laden der Kontakte");
      console.error(error);
    } else {
      setContacts((data || []) as WorkflowContact[]);
      
      // Count today's messages
      const today = new Date().toISOString().split('T')[0];
      const todayMessages = (data || []).filter((c: any) => 
        c.first_message_sent_at && c.first_message_sent_at.startsWith(today)
      ).length;
      setTodayMessageCount(todayMessages);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchContacts();
  }, [campaignId]);

  const updateStatus = async (contactId: string, newStatus: WorkflowStatus, timestampField?: string) => {
    const updateData: Record<string, any> = {
      workflow_status: newStatus,
      updated_at: new Date().toISOString()
    };
    
    if (timestampField) {
      updateData[timestampField] = new Date().toISOString();
    }

    const { error } = await supabase
      .from('contacts')
      .update(updateData)
      .eq('id', contactId);

    if (error) {
      toast.error("Fehler beim Aktualisieren");
      console.error(error);
    } else {
      toast.success("Status aktualisiert");
      fetchContacts();
    }
  };

  const copyMessage = (contact: WorkflowContact) => {
    if (!contact.outreach_message) {
      toast.error("Keine Nachricht vorhanden");
      return;
    }
    navigator.clipboard.writeText(contact.outreach_message);
    toast.success("Nachricht kopiert!");
  };

  const importLeads = async () => {
    if (!importText.trim()) {
      toast.error("Bitte füge Lead-Daten ein");
      return;
    }

    setImporting(true);
    try {
      // Get user's account_id
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Nicht eingeloggt");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("account_id")
        .eq("id", user.id)
        .single();

      // Parse CSV/text - support both comma and semicolon
      const lines = importText.trim().split('\n');
      const leads: Array<{
        first_name: string;
        last_name: string;
        company?: string;
        position?: string;
      }> = [];

      for (const line of lines) {
        const parts = line.includes(';') ? line.split(';') : line.split(',');
        if (parts.length >= 2) {
          leads.push({
            first_name: parts[0]?.trim() || '',
            last_name: parts[1]?.trim() || '',
            company: parts[2]?.trim() || undefined,
            position: parts[3]?.trim() || undefined,
          });
        }
      }

      if (leads.length === 0) {
        toast.error("Keine gültigen Leads gefunden. Format: Vorname, Nachname, Firma, Position");
        return;
      }

      // Insert leads with workflow_status = 'bereit_fuer_vernetzung'
      const leadsToInsert = leads.map(lead => ({
        first_name: lead.first_name,
        last_name: lead.last_name,
        company: lead.company || null,
        position: lead.position || null,
        campaign_id: campaignId,
        lead_type: 'outbound' as const,
        workflow_status: 'bereit_fuer_vernetzung' as const,
        account_id: profile?.account_id,
        owner_user_id: user.id,
      }));

      const { error } = await supabase
        .from('contacts')
        .insert(leadsToInsert);

      if (error) throw error;

      toast.success(`${leads.length} Leads importiert und bereit für Vernetzung`);
      setImportText("");
      setIsImportDialogOpen(false);
      fetchContacts();
    } catch (error: any) {
      console.error("Import error:", error);
      toast.error("Fehler beim Import: " + error.message);
    } finally {
      setImporting(false);
    }
  };

  // Filter contacts by status
  const pendingConnections = contacts.filter(c => c.workflow_status === 'vernetzung_ausstehend');
  const readyForConnection = contacts.filter(c => 
    c.workflow_status === 'neu' || c.workflow_status === 'bereit_fuer_vernetzung'
  );
  const acceptedConnections = contacts.filter(c => c.workflow_status === 'vernetzung_angenommen');
  
  // Follow-up due logic
  const fu1Due = contacts.filter(c => {
    if (c.workflow_status !== 'erstnachricht_gesendet' || !c.first_message_sent_at || c.viewed) return false;
    const sentDate = new Date(c.first_message_sent_at);
    const dueDate = new Date(sentDate.getTime() + 3 * 24 * 60 * 60 * 1000);
    return new Date() >= dueDate;
  });
  
  const fu2Due = contacts.filter(c => {
    if (c.workflow_status !== 'fu1_gesendet' || !c.fu1_sent_at || c.viewed) return false;
    const sentDate = new Date(c.fu1_sent_at);
    const dueDate = new Date(sentDate.getTime() + 4 * 24 * 60 * 60 * 1000);
    return new Date() >= dueDate;
  });
  
  const fu3Due = contacts.filter(c => {
    if (c.workflow_status !== 'fu2_gesendet' || !c.fu2_sent_at || c.viewed) return false;
    const sentDate = new Date(c.fu2_sent_at);
    const dueDate = new Date(sentDate.getTime() + 7 * 24 * 60 * 60 * 1000);
    return new Date() >= dueDate;
  });

  const warmLeads = contacts.filter(c => c.workflow_status === 'reagiert_warm');
  
  const slotsAvailable = MAX_PENDING_CONNECTIONS - pendingConnections.length;
  const messagesRemaining = MAX_DAILY_MESSAGES - todayMessageCount;

  const ContactCard = ({ contact, actions }: { contact: WorkflowContact; actions: React.ReactNode }) => (
    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">
            {contact.first_name} {contact.last_name}
          </span>
          {contact.viewed && (
            <Badge variant="destructive" className="text-xs">
              <Flame className="h-3 w-3 mr-1" />
              Hot
            </Badge>
          )}
          {contact.lead_score && contact.lead_score >= 70 && !contact.viewed && (
            <Badge variant="secondary" className="text-xs">
              Score: {contact.lead_score}
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground truncate">
          {contact.position ? `${contact.position} @ ` : ''}{contact.company || 'Keine Firma'}
        </p>
      </div>
      <div className="flex items-center gap-2 ml-4 flex-shrink-0">
        {actions}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Import Button */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Daily Workflow für {campaignName}</h3>
        <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              Leads importieren
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Leads in Kampagne importieren
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Lead-Daten (CSV Format)</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Füge Leads ein: Vorname, Nachname, Firma, Position (pro Zeile)
                </p>
                <Textarea
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder={`Max, Mustermann, Firma GmbH, CEO\nAnna, Schmidt, Beispiel AG, Marketing Manager\nThomas, Müller, Startup Inc, Founder`}
                  className="h-48 font-mono text-sm"
                />
              </div>
              <div className="bg-muted/50 p-3 rounded-lg">
                <p className="text-xs text-muted-foreground">
                  <strong>Tipp:</strong> Kopiere Daten aus Excel/Sheets. Trennzeichen: Komma oder Semikolon.
                  <br />Alle importierten Leads werden auf "Bereit für Vernetzung" gesetzt.
                </p>
              </div>
              <Button 
                onClick={importLeads} 
                disabled={importing || !importText.trim()} 
                className="w-full"
              >
                {importing ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Importiere...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Leads importieren
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Daily Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Vernetzungen prüfen</span>
            </div>
            <p className="text-2xl font-bold">{pendingConnections.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Neue Vernetzungen</span>
            </div>
            <p className="text-2xl font-bold">{slotsAvailable > 0 ? slotsAvailable : 0} / 20</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Erstnachrichten heute</span>
            </div>
            <p className="text-2xl font-bold">{messagesRemaining} / 8</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Follow-ups offen</span>
            </div>
            <p className="text-2xl font-bold">{fu1Due.length + fu2Due.length + fu3Due.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Warm Leads Alert */}
      {warmLeads.length > 0 && (
        <Card className="border-destructive bg-destructive/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Flame className="h-5 w-5 text-destructive" />
              {warmLeads.length} warme Leads - Jetzt handeln!
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-32">
              <div className="space-y-2">
                {warmLeads.map(contact => (
                  <ContactCard 
                    key={contact.id} 
                    contact={contact}
                    actions={
                      <Button 
                        size="sm" 
                        onClick={() => updateStatus(contact.id, 'abgeschlossen')}
                      >
                        Als bearbeitet markieren
                      </Button>
                    }
                  />
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Workflow Tabs */}
      <Tabs defaultValue="connections" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="connections" className="relative">
            Vernetzungen
            {pendingConnections.length > 0 && (
              <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 flex items-center justify-center">
                {pendingConnections.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="new-connections">
            Neue ({slotsAvailable > 0 ? Math.min(slotsAvailable, readyForConnection.length) : 0})
          </TabsTrigger>
          <TabsTrigger value="first-messages">
            Erstnachrichten ({Math.min(acceptedConnections.length, messagesRemaining)})
          </TabsTrigger>
          <TabsTrigger value="followups">
            Follow-ups ({fu1Due.length + fu2Due.length + fu3Due.length})
          </TabsTrigger>
        </TabsList>

        {/* Step 1: Check Connections */}
        <TabsContent value="connections" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Schritt 1: Vernetzungsstatus prüfen</CardTitle>
              <p className="text-sm text-muted-foreground">
                Prüfe auf LinkedIn, ob diese Vernetzungsanfragen angenommen wurden.
              </p>
            </CardHeader>
            <CardContent>
              {pendingConnections.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-2 text-green-500" />
                  <p>Keine offenen Vernetzungen zu prüfen!</p>
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {pendingConnections.map(contact => (
                      <ContactCard 
                        key={contact.id} 
                        contact={contact}
                        actions={
                          <>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => toast.info("Prüfe auf LinkedIn...")}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="default"
                              onClick={() => updateStatus(contact.id, 'vernetzung_angenommen', 'connection_accepted_at')}
                            >
                              <CheckCircle2 className="h-4 w-4 mr-1" />
                              Angenommen
                            </Button>
                          </>
                        }
                      />
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Step 2: New Connections */}
        <TabsContent value="new-connections" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Schritt 2: Neue Vernetzungen senden</CardTitle>
              <p className="text-sm text-muted-foreground">
                {slotsAvailable > 0 
                  ? `Du kannst noch ${Math.min(slotsAvailable, readyForConnection.length)} Vernetzungsanfragen senden (max. 20 offene).`
                  : "Du hast bereits 20 offene Vernetzungsanfragen. Warte bis einige angenommen werden."
                }
              </p>
            </CardHeader>
            <CardContent>
              {slotsAvailable <= 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-2" />
                  <p>Limit erreicht! Warte auf Annahmen.</p>
                </div>
              ) : readyForConnection.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-2 text-green-500" />
                  <p>Keine neuen Leads für Vernetzung verfügbar.</p>
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {readyForConnection.slice(0, slotsAvailable).map(contact => (
                      <ContactCard 
                        key={contact.id} 
                        contact={contact}
                        actions={
                          <Button 
                            size="sm"
                            onClick={() => updateStatus(contact.id, 'vernetzung_ausstehend', 'connection_sent_at')}
                          >
                            <UserPlus className="h-4 w-4 mr-1" />
                            Vernetzung gesendet
                          </Button>
                        }
                      />
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Step 3: First Messages */}
        <TabsContent value="first-messages" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Schritt 3: Erstnachrichten senden</CardTitle>
              <p className="text-sm text-muted-foreground">
                {messagesRemaining > 0 
                  ? `Du kannst heute noch ${messagesRemaining} Erstnachrichten senden (max. 8/Tag).`
                  : "Du hast heute bereits 8 Nachrichten gesendet. Morgen geht's weiter!"
                }
              </p>
            </CardHeader>
            <CardContent>
              {messagesRemaining <= 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-2" />
                  <p>Tageslimit erreicht! Morgen geht's weiter.</p>
                </div>
              ) : acceptedConnections.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-2 text-green-500" />
                  <p>Keine offenen Erstnachrichten.</p>
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {acceptedConnections.slice(0, messagesRemaining).map(contact => (
                      <ContactCard 
                        key={contact.id} 
                        contact={contact}
                        actions={
                          <>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => copyMessage(contact)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm"
                              onClick={() => updateStatus(contact.id, 'erstnachricht_gesendet', 'first_message_sent_at')}
                            >
                              <MessageSquare className="h-4 w-4 mr-1" />
                              Gesendet
                            </Button>
                          </>
                        }
                      />
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Step 4: Follow-ups */}
        <TabsContent value="followups" className="space-y-4">
          {/* FU1 */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Follow-up 1 (nach 3 Tagen)</CardTitle>
            </CardHeader>
            <CardContent>
              {fu1Due.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">Keine FU1 fällig</p>
              ) : (
                <ScrollArea className="h-[200px]">
                  <div className="space-y-2">
                    {fu1Due.map(contact => (
                      <ContactCard 
                        key={contact.id} 
                        contact={contact}
                        actions={
                          <>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => copyMessage(contact)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm"
                              onClick={() => updateStatus(contact.id, 'fu1_gesendet', 'fu1_sent_at')}
                            >
                              FU1 gesendet
                            </Button>
                          </>
                        }
                      />
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>

          {/* FU2 */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Follow-up 2 (nach 7 Tagen)</CardTitle>
            </CardHeader>
            <CardContent>
              {fu2Due.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">Keine FU2 fällig</p>
              ) : (
                <ScrollArea className="h-[200px]">
                  <div className="space-y-2">
                    {fu2Due.map(contact => (
                      <ContactCard 
                        key={contact.id} 
                        contact={contact}
                        actions={
                          <>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => copyMessage(contact)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm"
                              onClick={() => updateStatus(contact.id, 'fu2_gesendet', 'fu2_sent_at')}
                            >
                              FU2 gesendet
                            </Button>
                          </>
                        }
                      />
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>

          {/* FU3 */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Follow-up 3 (nach 14 Tagen)</CardTitle>
            </CardHeader>
            <CardContent>
              {fu3Due.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">Keine FU3 fällig</p>
              ) : (
                <ScrollArea className="h-[200px]">
                  <div className="space-y-2">
                    {fu3Due.map(contact => (
                      <ContactCard 
                        key={contact.id} 
                        contact={contact}
                        actions={
                          <>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => copyMessage(contact)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm"
                              onClick={() => updateStatus(contact.id, 'fu3_gesendet', 'fu3_sent_at')}
                            >
                              FU3 gesendet
                            </Button>
                            <Button 
                              size="sm"
                              variant="destructive"
                              onClick={() => updateStatus(contact.id, 'abgeschlossen')}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </>
                        }
                      />
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Pipeline Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Pipeline Übersicht</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {(Object.entries(STATUS_LABELS) as [WorkflowStatus, string][]).map(([status, label]) => {
              const count = contacts.filter(c => c.workflow_status === status).length;
              return (
                <div key={status} className="p-2 bg-muted/50 rounded text-center">
                  <p className="text-xs text-muted-foreground truncate">{label}</p>
                  <p className="text-xl font-bold">{count}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
