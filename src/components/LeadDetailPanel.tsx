import { useEffect, useState, useRef } from "react";
import { X, Phone, Calendar, FileText, TrendingUp, Clock, Mic, MicOff, Radio, Video, Eye, Link, Copy, Activity, Mail, Globe, Building2, MapPin, Edit3, Plus, MousePointer, ExternalLink, CheckCircle2 } from "lucide-react";
import CallActivityLogger from "@/components/CallActivityLogger";
import JourneyTimeline from "@/components/JourneyTimeline";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PIPELINE_STAGES, CALL_OUTCOMES, getCallOutcomeColor } from "@/lib/pipelineStages";
import { WhisperGeminiHandler, ObjectionHandling } from "@/utils/whisperGeminiHandler";

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
  slug: string | null;
  video_url: string | null;
  viewed: boolean | null;
  viewed_at: string | null;
  view_count: number | null;
  lead_type: 'inbound' | 'outbound' | null;
  outreach_status: string | null;
  outreach_message: string | null;
  lead_score: number | null;
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
  open: boolean;
  onClose: () => void;
  onUpdate?: () => void;
}

export default function LeadDetailPanel({ dealId, open, onClose, onUpdate }: LeadDetailPanelProps) {
  const [deal, setDeal] = useState<Deal | null>(null);
  const [contact, setContact] = useState<Contact | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [callScript, setCallScript] = useState<string>("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  
  // Video note state
  const [videoSlug, setVideoSlug] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  
  // Live call state
  const [isLiveCallActive, setIsLiveCallActive] = useState(false);
  const [callStatus, setCallStatus] = useState<string>('disconnected');
  const [objectionHandlings, setObjectionHandlings] = useState<ObjectionHandling[]>([]);
  const handlerRef = useRef<WhisperGeminiHandler | null>(null);

  useEffect(() => {
    if (dealId && open) {
      fetchLeadData();
    }
    
    return () => {
      // Cleanup on unmount
      if (handlerRef.current) {
        handlerRef.current.endSession();
      }
    };
  }, [dealId, open]);

  const fetchLeadData = async () => {
    if (!dealId) {
      setLoading(false);
      return;
    }
    
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
      
      // Set video note fields
      if (dealData.contacts) {
        setVideoSlug(dealData.contacts.slug || '');
        setVideoUrl(dealData.contacts.video_url || '');
      }

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
      
      // Notify parent to refresh pipeline
      onUpdate?.();
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

  const handleSaveVideoNote = async () => {
    if (!contact) return;

    try {
      const { error } = await supabase
        .from('contacts')
        .update({
          slug: videoSlug.trim() || null,
          video_url: videoUrl.trim() || null
        })
        .eq('id', contact.id);

      if (error) throw error;

      toast.success("Videonotiz gespeichert");
      fetchLeadData();
    } catch (error) {
      console.error('Error saving video note:', error);
      toast.error("Fehler beim Speichern");
    }
  };

  const startLiveCall = async () => {
    try {
      // Prepare context for AI
      const systemContext = callScript || "Keine System-Informationen verfügbar";
      const leadContext = `
Lead: ${contact.first_name} ${contact.last_name}
Company: ${contact.company || 'N/A'}
Position: ${contact.position || 'N/A'}
Source: ${contact.source || 'N/A'}
Stage: ${deal.stage}
      `.trim();
      
      // Initialize Whisper + Gemini handler
      handlerRef.current = new WhisperGeminiHandler(
        (handling) => {
          setObjectionHandlings(prev => [...prev, handling]);
          toast.info("Neue Einwandbehandlung verfügbar");
        },
        (status) => {
          setCallStatus(status);
        },
        (error) => {
          toast.error(error);
          stopLiveCall();
        }
      );
      
      await handlerRef.current.startSession(systemContext, leadContext);
      setIsLiveCallActive(true);
      
      toast.success("Live-Call gestartet - KI analysiert alle 5 Sekunden");
    } catch (error) {
      console.error('Error starting live call:', error);
      toast.error("Fehler beim Starten des Live-Calls");
      stopLiveCall();
    }
  };

  const stopLiveCall = () => {
    if (handlerRef.current) {
      handlerRef.current.endSession();
      handlerRef.current = null;
    }
    
    setIsLiveCallActive(false);
    setCallStatus('disconnected');
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} kopiert`);
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 gap-0 glass-card flex flex-col">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">Lädt...</p>
          </div>
        ) : !deal || !contact ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">Lead nicht gefunden</p>
          </div>
        ) : (
          <div className="flex flex-col min-h-0 flex-1">
            {/* Header */}
            <div className="p-6 border-b border-white/5">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-foreground">
                    {contact.first_name} {contact.last_name}
                  </h2>
                  <p className="text-base text-muted-foreground">{contact.company}</p>
                  {contact.position && (
                    <p className="text-sm text-muted-foreground/70 mt-1">{contact.position}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant="outline" 
                    className={`${contact.lead_type === 'inbound' 
                      ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                      : 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
                    }`}
                  >
                    {contact.lead_type === 'inbound' ? 'Inbound' : 'Outbound'}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
              <div className="px-6 pt-4 border-b border-white/5">
                <TabsList className="bg-white/[0.03] border border-white/5 p-1 rounded-xl">
                  <TabsTrigger 
                    value="overview" 
                    className="rounded-lg data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
                  >
                    Übersicht
                  </TabsTrigger>
                  <TabsTrigger 
                    value="activities" 
                    className="rounded-lg data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
                  >
                    Aktivitäten
                  </TabsTrigger>
                  <TabsTrigger 
                    value="call" 
                    className="rounded-lg data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
                  >
                    Call Script
                  </TabsTrigger>
                </TabsList>
              </div>

              <ScrollArea className="flex-1 overflow-auto max-h-[calc(90vh-180px)]">
                <TabsContent value="overview" className="p-6 space-y-6 mt-0">
                  {/* Status Row with Lead Score */}
                  <div className="grid grid-cols-4 gap-4">
                    <div className="stat-card !p-4">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Lead Score</p>
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-bold text-foreground">{contact.lead_score || 0}</span>
                        <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all ${
                              (contact.lead_score || 0) >= 70 ? 'bg-green-500' : 
                              (contact.lead_score || 0) >= 40 ? 'bg-amber-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${Math.min(100, contact.lead_score || 0)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="stat-card !p-4">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Status</p>
                      <Badge 
                        variant="secondary" 
                        className={`${
                          (contact.lead_score || 0) >= 70 ? 'bg-green-500/20 text-green-400 border-green-500/30' : 
                          (contact.lead_score || 0) >= 40 ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 
                          'bg-muted text-muted-foreground'
                        }`}
                      >
                        {(contact.lead_score || 0) >= 70 ? '🔥 Hot' : (contact.lead_score || 0) >= 40 ? 'Warm' : 'Cold'}
                      </Badge>
                    </div>
                    <div className="stat-card !p-4">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Ansichten</p>
                      <div className="flex items-center gap-2">
                        <Eye className="w-4 h-4 text-muted-foreground" />
                        <span className="text-lg font-semibold text-foreground">{contact.view_count || 0}</span>
                        {contact.viewed && (
                          <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30 text-[10px]">
                            Gesehen
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="stat-card !p-4">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Phase</p>
                      <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/30">
                        {deal.stage}
                      </Badge>
                    </div>
                  </div>

                  {/* Personalized URL Section */}
                  {contact.lead_type === 'outbound' && contact.slug && (
                    <div className="stat-card !p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Personalisierte Seite</p>
                          <a 
                            href={`${window.location.origin}/p/${contact.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline flex items-center gap-2"
                          >
                            {window.location.origin}/p/{contact.slug}
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(`${window.location.origin}/p/${contact.slug}`, "URL")}
                        >
                          <Copy className="w-3.5 h-3.5 mr-2" />
                          Kopieren
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Contact Data */}
                  <div>
                    <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-4 font-medium">Kontaktdaten</h3>
                    <div className="space-y-2">
                      {contact.email && (
                        <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors group">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                              <Mail className="w-4 h-4 text-blue-400" />
                            </div>
                            <span className="text-sm text-foreground">{contact.email}</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                            onClick={() => copyToClipboard(contact.email!, "E-Mail")}
                          >
                            <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                          </Button>
                        </div>
                      )}

                      {contact.phone && (
                        <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors group">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                              <Phone className="w-4 h-4 text-green-400" />
                            </div>
                            <span className="text-sm text-foreground">{contact.phone}</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                            onClick={() => copyToClipboard(contact.phone!, "Telefon")}
                          >
                            <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                          </Button>
                        </div>
                      )}

                      {company?.website && (
                        <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors group">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                              <Globe className="w-4 h-4 text-purple-400" />
                            </div>
                            <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                              {company.website}
                            </a>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                            onClick={() => copyToClipboard(company.website!, "Website")}
                          >
                            <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Company Info */}
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Unternehmen</span>
                      </div>
                      <p className="text-sm text-foreground">{contact.company || '—'}</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Stadt</span>
                      </div>
                      <p className="text-sm text-foreground">{company?.city || '—'}</p>
                    </div>
                  </div>

                  {/* Quick Stage Actions */}
                  <div>
                    <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-4 font-medium">Pipeline Status</h3>
                    <div className="grid grid-cols-3 gap-2">
                      {PIPELINE_STAGES.map((stage) => (
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
                  </div>

                  {/* Call Activity Logger */}
                  <CallActivityLogger
                    contactId={contact.id}
                    dealId={deal.id}
                    currentStage={deal.stage}
                    onActivityLogged={fetchLeadData}
                    onStageUpdate={(newStage) => {
                      setDeal({ ...deal, stage: newStage });
                      onUpdate?.();
                    }}
                  />

                  {/* Add Note */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Notiz hinzufügen</span>
                    </div>
                    <Textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Notiz zum Lead..."
                      rows={3}
                      className="bg-white/[0.02] border-white/5"
                    />
                    <Button onClick={handleAddNote} className="w-full mt-2" disabled={!note.trim()}>
                      Notiz speichern
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="activities" className="p-6 space-y-6 mt-0">
                  {/* Journey Timeline */}
                  <div className="stat-card !p-0 overflow-hidden">
                    <div className="flex items-center justify-between p-4 border-b border-white/5">
                      <div>
                        <h4 className="text-sm font-medium text-foreground">Journey Timeline</h4>
                        <p className="text-xs text-muted-foreground">Lead-Aktivitäten</p>
                      </div>
                    </div>
                    <div className="p-4">
                      <JourneyTimeline contactId={contact.id} />
                    </div>
                  </div>

                  {/* Call History */}
                  <div className="stat-card !p-0 overflow-hidden">
                    <div className="flex items-center justify-between p-4 border-b border-white/5">
                      <div>
                        <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          Call-Historie
                        </h4>
                      </div>
                    </div>
                    <div className="p-4">
                      {activities.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">Noch keine Aktivitäten</p>
                      ) : (
                        <div className="space-y-3">
                          {activities.map((activity) => (
                            <div key={activity.id} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <Phone className="w-3.5 h-3.5 text-primary" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <Badge variant="secondary" className="text-xs">
                                    {activity.type}
                                  </Badge>
                                  {activity.outcome && (
                                    <Badge variant="outline" className="text-xs">
                                      {activity.outcome}
                                    </Badge>
                                  )}
                                </div>
                                {activity.note && (
                                  <p className="text-sm mt-1 text-muted-foreground">{activity.note}</p>
                                )}
                              </div>
                              <span className="text-xs text-muted-foreground whitespace-nowrap">
                                {new Date(activity.timestamp).toLocaleDateString('de-DE')}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="call" className="p-6 space-y-6 mt-0">
                  {/* Live Call Section */}
                  {isLiveCallActive ? (
                    <Card className="border-primary/30 bg-primary/5">
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <Radio className="h-4 w-4 text-destructive animate-pulse" />
                          Live-Call aktiv
                          <Badge variant={
                            callStatus === 'active' ? 'default' : 
                            callStatus === 'transcribing' ? 'secondary' : 
                            callStatus === 'analyzing' ? 'default' :
                            'outline'
                          }>
                            {callStatus === 'active' ? 'Aktiv' : 
                             callStatus === 'transcribing' ? 'Transkribiert' : 
                             callStatus === 'analyzing' ? 'Analysiert' : 
                             callStatus === 'listening' ? 'Hört zu' : 
                             callStatus}
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {objectionHandlings.length > 0 && (
                          <div className="space-y-2">
                            <Label className="text-sm font-semibold">KI-Einwandbehandlungen:</Label>
                            <div className="space-y-2 max-h-60 overflow-y-auto">
                              {objectionHandlings.map((handling, idx) => (
                                <div key={idx} className="border border-primary/20 rounded-lg p-3 bg-primary/5">
                                  <div className="text-xs text-muted-foreground mb-1">
                                    Einwand: "{handling.objection}"
                                  </div>
                                  <div className="text-sm font-medium">
                                    {handling.response}
                                  </div>
                                  <div className="text-xs text-muted-foreground mt-1">
                                    {new Date(handling.timestamp).toLocaleTimeString('de-DE')}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {objectionHandlings.length === 0 && (
                          <p className="text-sm text-muted-foreground">
                            Whisper transkribiert alle 5 Sek. • Gemini analysiert auf Einwände
                          </p>
                        )}

                        <Button 
                          onClick={stopLiveCall} 
                          variant="destructive" 
                          className="w-full"
                        >
                          <MicOff className="mr-2 h-4 w-4" />
                          Call beenden
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="stat-card !p-4">
                      <Button 
                        onClick={startLiveCall} 
                        className="w-full"
                        variant="default"
                      >
                        <Mic className="mr-2 h-4 w-4" />
                        Live-Call mit KI-Support starten
                      </Button>
                      <p className="text-xs text-muted-foreground mt-2 text-center">
                        Externe Telefonie verbinden & KI erkennt Einwände live
                      </p>
                    </div>
                  )}

                  {/* Call Script */}
                  {callScript && (
                    <div className="stat-card !p-0 overflow-hidden">
                      <div className="flex items-center gap-2 p-4 border-b border-white/5">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        <h4 className="text-sm font-medium text-foreground">Call Script</h4>
                      </div>
                      <div className="p-4">
                        <div className="whitespace-pre-wrap text-sm bg-white/[0.02] p-4 rounded-xl border border-white/5">
                          {callScript}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Video Note for Outbound */}
                  {contact.lead_type === 'outbound' && (
                    <div className="stat-card !p-0 overflow-hidden">
                      <div className="flex items-center justify-between p-4 border-b border-white/5">
                        <div className="flex items-center gap-2">
                          <Video className="w-4 h-4 text-cyan-400" />
                          <h4 className="text-sm font-medium text-foreground">Videonotiz</h4>
                        </div>
                        <Badge variant="outline" className="text-xs bg-cyan-500/10 text-cyan-400 border-cyan-500/30">
                          Outbound
                        </Badge>
                      </div>
                      <div className="p-4 space-y-4">
                        <div className="space-y-2">
                          <Label className="text-sm">Slug (für personalisierte URL)</Label>
                          <Input
                            value={videoSlug}
                            onChange={(e) => setVideoSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                            placeholder="max-mustermann-acme"
                            className="bg-white/[0.02] border-white/5"
                          />
                          {videoSlug && (
                            <div className="flex items-center gap-2 text-xs">
                              <span className="text-muted-foreground">URL:</span>
                              <a 
                                href={`/p/${videoSlug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline"
                              >
                                {window.location.origin}/p/{videoSlug}
                              </a>
                            </div>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          <Label className="text-sm">Video URL</Label>
                          <Input
                            value={videoUrl}
                            onChange={(e) => setVideoUrl(e.target.value)}
                            placeholder="https://cdn.example.com/video.mp4"
                            className="bg-white/[0.02] border-white/5"
                          />
                        </div>

                        {contact.viewed !== null && (
                          <div className="flex items-center gap-2 text-sm p-3 bg-white/[0.02] rounded-xl border border-white/5">
                            <Eye className="w-4 h-4" />
                            {contact.viewed ? (
                              <span className="text-green-400">
                                Angesehen ({contact.view_count || 0}x)
                                {contact.viewed_at && ` • ${new Date(contact.viewed_at).toLocaleDateString('de-DE')}`}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">Noch nicht angesehen</span>
                            )}
                          </div>
                        )}

                        <Button onClick={handleSaveVideoNote} className="w-full" size="sm">
                          Videonotiz speichern
                        </Button>
                      </div>
                    </div>
                  )}
                </TabsContent>
              </ScrollArea>
            </Tabs>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}