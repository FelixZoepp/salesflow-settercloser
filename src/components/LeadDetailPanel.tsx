import { useEffect, useState } from "react";
import { X, Phone, Calendar, FileText, TrendingUp, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { COLD_PIPELINE_STAGES } from "@/lib/pipelineStages";

interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  position: string | null;
  company: string | null;
  source: string | null;
  company_id: string | null;
}

interface Company {
  name: string;
  website: string | null;
  phone: string | null;
  city: string | null;
}

interface Deal {
  id: string;
  title: string;
  stage: string;
  contact_id: string;
}

interface Activity {
  id: string;
  type: string;
  outcome: string | null;
  note: string | null;
  timestamp: string;
  duration_min: number | null;
}

interface LeadDetailPanelProps {
  dealId: string;
  onClose: () => void;
}

export default function LeadDetailPanel({ dealId, onClose }: LeadDetailPanelProps) {
  const [deal, setDeal] = useState<Deal | null>(null);
  const [contact, setContact] = useState<Contact | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [callScript, setCallScript] = useState<string>("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    fetchLeadData();
  }, [dealId]);

  const fetchLeadData = async () => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', user.id)
        .single();
      
      if (profile) setUserName(profile.name);

      // Get deal with contact
      const { data: dealData, error: dealError } = await supabase
        .from('deals')
        .select(`
          *,
          contacts (*)
        `)
        .eq('id', dealId)
        .single();

      if (dealError) throw dealError;
      
      setDeal(dealData);
      setContact(dealData.contacts);

      // Get company if exists
      if (dealData.contacts?.company_id) {
        const { data: companyData } = await supabase
          .from('companies')
          .select('*')
          .eq('id', dealData.contacts.company_id)
          .single();
        
        if (companyData) setCompany(companyData);
      }

      // Get activities
      const { data: activitiesData } = await supabase
        .from('activities')
        .select('*')
        .eq('contact_id', dealData.contact_id)
        .order('timestamp', { ascending: false })
        .limit(10);

      if (activitiesData) setActivities(activitiesData);

      // Get active call script
      const { data: scriptData } = await supabase
        .from('call_scripts')
        .select('content')
        .eq('is_active', true)
        .maybeSingle();

      if (scriptData) {
        // Replace template tags
        let parsedScript = scriptData.content;
        
        if (dealData.contacts) {
          parsedScript = parsedScript
            .replace(/\{\{first_name\}\}/g, dealData.contacts.first_name || '')
            .replace(/\{\{last_name\}\}/g, dealData.contacts.last_name || '')
            .replace(/\{\{email\}\}/g, dealData.contacts.email || '')
            .replace(/\{\{phone\}\}/g, dealData.contacts.phone || '')
            .replace(/\{\{position\}\}/g, dealData.contacts.position || '')
            .replace(/\{\{source\}\}/g, dealData.contacts.source || '')
            .replace(/\{\{company_name\}\}/g, dealData.contacts.company || '');
        }

        if (company) {
          parsedScript = parsedScript
            .replace(/\{\{website\}\}/g, company.website || '')
            .replace(/\{\{company_phone\}\}/g, company.phone || '')
            .replace(/\{\{city\}\}/g, company.city || '');
        }

        parsedScript = parsedScript
          .replace(/\{\{user_name\}\}/g, profile?.name || '')
          .replace(/\{\{stage\}\}/g, dealData.stage || '');

        setCallScript(parsedScript);
      }

    } catch (error) {
      console.error('Error fetching lead data:', error);
      toast.error("Fehler beim Laden der Lead-Daten");
    } finally {
      setLoading(false);
    }
  };

  const handleStageUpdate = async (newStage: string) => {
    if (!deal) return;

    try {
      const { error } = await supabase
        .from('deals')
        .update({ stage: newStage as any })
        .eq('id', deal.id);

      if (error) throw error;

      setDeal({ ...deal, stage: newStage });
      toast.success(`Status aktualisiert: ${newStage}`);
    } catch (error) {
      console.error('Error updating stage:', error);
      toast.error("Fehler beim Aktualisieren");
    }
  };

  const handleAddNote = async () => {
    if (!note.trim() || !contact) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('activities')
        .insert({
          contact_id: contact.id,
          user_id: user.id,
          type: 'note',
          note: note.trim(),
        });

      if (error) throw error;

      toast.success("Notiz hinzugefügt");
      setNote("");
      fetchLeadData(); // Refresh activities
    } catch (error) {
      console.error('Error adding note:', error);
      toast.error("Fehler beim Speichern");
    }
  };

  if (loading) {
    return (
      <div className="fixed right-0 top-0 h-screen w-[500px] bg-background border-l shadow-lg p-6 overflow-y-auto z-50">
        <div className="flex items-center justify-center h-full">
          <p className="text-muted-foreground">Lädt...</p>
        </div>
      </div>
    );
  }

  if (!deal || !contact) {
    return null;
  }

  return (
    <div className="fixed right-0 top-0 h-screen w-[500px] bg-background border-l shadow-lg overflow-y-auto z-50">
      <div className="sticky top-0 bg-background border-b p-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">
            {contact.first_name} {contact.last_name}
          </h2>
          <p className="text-sm text-muted-foreground">{contact.company}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      <div className="p-4 space-y-4">
        {/* Contact Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Kontaktinformationen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {contact.email && (
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Email:</span>
                <span>{contact.email}</span>
              </div>
            )}
            {contact.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{contact.phone}</span>
              </div>
            )}
            {contact.position && (
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Position:</span>
                <span>{contact.position}</span>
              </div>
            )}
            {company && (
              <>
                {company.website && (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Website:</span>
                    <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      {company.website}
                    </a>
                  </div>
                )}
                {company.city && (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Stadt:</span>
                    <span>{company.city}</span>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Call Script */}
        {callScript && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Call Script
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="whitespace-pre-wrap text-sm bg-muted p-4 rounded-lg">
                {callScript}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {COLD_PIPELINE_STAGES.map((stage) => (
                <Button
                  key={stage}
                  variant={deal.stage === stage ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleStageUpdate(stage)}
                  className="text-xs"
                >
                  {stage}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Add Note */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notiz hinzufügen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Notiz zum Call..."
              rows={3}
            />
            <Button onClick={handleAddNote} className="w-full" disabled={!note.trim()}>
              Notiz speichern
            </Button>
          </CardContent>
        </Card>

        {/* Call History */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Call-Historie
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activities.length === 0 ? (
              <p className="text-sm text-muted-foreground">Noch keine Aktivitäten</p>
            ) : (
              <div className="space-y-3">
                {activities.map((activity) => (
                  <div key={activity.id} className="border-l-2 border-primary pl-3 py-1">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="secondary" className="text-xs">
                        {activity.type}
                      </Badge>
                      {activity.outcome && (
                        <Badge variant="outline" className="text-xs">
                          {activity.outcome}
                        </Badge>
                      )}
                      <span>
                        {new Date(activity.timestamp).toLocaleDateString('de-DE')} {new Date(activity.timestamp).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    {activity.note && (
                      <p className="text-sm mt-1">{activity.note}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}