import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { 
  UserPlus, 
  Linkedin, 
  ExternalLink, 
  CheckCircle2,
  Users,
  AlertTriangle,
  RefreshCw,
  Send
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface SuggestedContact {
  id: string;
  first_name: string;
  last_name: string;
  company: string | null;
  position: string | null;
  linkedin_url: string | null;
  workflow_status: string | null;
}

interface CampaignSettings {
  max_daily_connections: number;
}

interface ConnectionSuggestionsProps {
  campaignId: string;
  campaignName: string;
}

export function ConnectionSuggestions({ campaignId, campaignName }: ConnectionSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<SuggestedContact[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [campaignSettings, setCampaignSettings] = useState<CampaignSettings>({ max_daily_connections: 15 });
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [processing, setProcessing] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Get campaign settings
      const { data: campaign } = await supabase
        .from('campaigns')
        .select('max_daily_connections')
        .eq('id', campaignId)
        .single();

      if (campaign) {
        setCampaignSettings({ max_daily_connections: campaign.max_daily_connections || 15 });
      }

      // Count pending connections (vernetzung_ausstehend)
      const { count: pending } = await supabase
        .from('contacts')
        .select('id', { count: 'exact', head: true })
        .eq('campaign_id', campaignId)
        .eq('workflow_status', 'vernetzung_ausstehend');

      setPendingCount(pending || 0);

      // Calculate available slots
      const maxConnections = campaign?.max_daily_connections || 15;
      const availableSlots = Math.max(0, maxConnections - (pending || 0));

      // Get contacts ready for connection (neu or bereit_fuer_vernetzung)
      const { data: readyContacts } = await supabase
        .from('contacts')
        .select('id, first_name, last_name, company, position, linkedin_url, workflow_status')
        .eq('campaign_id', campaignId)
        .eq('lead_type', 'outbound')
        .in('workflow_status', ['neu', 'bereit_fuer_vernetzung'])
        .order('created_at', { ascending: true })
        .limit(availableSlots);

      setSuggestions((readyContacts || []) as SuggestedContact[]);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      toast.error('Fehler beim Laden der Vorschläge');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [campaignId]);

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === suggestions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(suggestions.map(s => s.id)));
    }
  };

  const markAsSent = async () => {
    if (selectedIds.size === 0) {
      toast.error('Bitte wähle mindestens einen Kontakt aus');
      return;
    }

    setProcessing(true);
    try {
      const ids = Array.from(selectedIds);
      const { error } = await supabase
        .from('contacts')
        .update({
          workflow_status: 'vernetzung_ausstehend',
          connection_sent_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .in('id', ids);

      if (error) throw error;

      toast.success(`${ids.length} Vernetzungsanfrage${ids.length > 1 ? 'n' : ''} als gesendet markiert`);
      setSelectedIds(new Set());
      fetchData();
    } catch (error) {
      console.error('Error updating contacts:', error);
      toast.error('Fehler beim Aktualisieren');
    } finally {
      setProcessing(false);
    }
  };

  const availableSlots = Math.max(0, campaignSettings.max_daily_connections - pendingCount);
  const allSelected = suggestions.length > 0 && selectedIds.size === suggestions.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-muted/50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Users className="h-4 w-4" />
              <span className="text-xs">Max. Vernetzungen</span>
            </div>
            <p className="text-2xl font-bold">{campaignSettings.max_daily_connections}</p>
          </CardContent>
        </Card>
        <Card className="bg-muted/50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <UserPlus className="h-4 w-4" />
              <span className="text-xs">Ausstehend</span>
            </div>
            <p className="text-2xl font-bold">{pendingCount}</p>
          </CardContent>
        </Card>
        <Card className="bg-primary/10 border-primary/30">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-primary mb-1">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-xs">Verfügbar</span>
            </div>
            <p className="text-2xl font-bold text-primary">{availableSlots}</p>
          </CardContent>
        </Card>
      </div>

      {/* Info Alert */}
      {availableSlots === 0 ? (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Du hast bereits {pendingCount} ausstehende Vernetzungsanfragen. Warte bis diese angenommen oder abgelehnt werden, bevor du neue sendest.
          </AlertDescription>
        </Alert>
      ) : (
        <Alert className="bg-primary/5 border-primary/20">
          <UserPlus className="h-4 w-4 text-primary" />
          <AlertDescription>
            Du kannst heute noch <strong>{availableSlots}</strong> Vernetzungsanfragen senden. 
            Unten findest du Vorschläge aus deiner Kampagne.
          </AlertDescription>
        </Alert>
      )}

      {/* Suggestions List */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Vernetzungsvorschläge</CardTitle>
              <CardDescription>
                {suggestions.length} Leads bereit für Vernetzung
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {suggestions.length > 0 && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={selectAll}
                  >
                    {allSelected ? 'Keine auswählen' : 'Alle auswählen'}
                  </Button>
                  <Button
                    size="sm"
                    onClick={markAsSent}
                    disabled={selectedIds.size === 0 || processing}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {processing ? 'Wird verarbeitet...' : `${selectedIds.size} als gesendet markieren`}
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {suggestions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>
                {availableSlots === 0 
                  ? 'Keine weiteren Vernetzungen möglich – Limit erreicht'
                  : 'Keine Leads bereit für Vernetzung. Importiere neue Leads oder ändere den Status bestehender Leads.'
                }
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {suggestions.map((contact) => (
                  <div 
                    key={contact.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                      selectedIds.has(contact.id) 
                        ? 'bg-primary/10 border-primary/30' 
                        : 'bg-muted/50 hover:bg-muted'
                    }`}
                    onClick={() => toggleSelection(contact.id)}
                  >
                    <Checkbox 
                      checked={selectedIds.has(contact.id)}
                      onCheckedChange={() => toggleSelection(contact.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {contact.first_name} {contact.last_name}
                        </span>
                        {contact.linkedin_url && (
                          <a 
                            href={contact.linkedin_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-[#0A66C2] hover:text-[#004182]"
                          >
                            <Linkedin className="h-4 w-4" />
                          </a>
                        )}
                        <Badge variant="secondary" className="text-xs">
                          {contact.workflow_status === 'neu' ? 'Neu' : 'Bereit'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-0.5">
                        {contact.position && <span>{contact.position}</span>}
                        {contact.position && contact.company && <span>•</span>}
                        {contact.company && <span>{contact.company}</span>}
                      </div>
                    </div>
                    {contact.linkedin_url && (
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                        onClick={(e) => e.stopPropagation()}
                      >
                        <a 
                          href={contact.linkedin_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Workflow Tip */}
      <div className="text-sm text-muted-foreground bg-muted/30 rounded-lg p-4">
        <strong>💡 Workflow:</strong> Wähle die Leads aus, mit denen du dich vernetzen möchtest, 
        öffne deren LinkedIn-Profile und sende die Anfrage. Danach markiere sie hier als "gesendet", 
        um sie in den Status "Ausstehend" zu verschieben.
      </div>
    </div>
  );
}