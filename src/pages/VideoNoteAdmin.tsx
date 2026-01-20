import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  Video, 
  Play, 
  Eye, 
  ExternalLink, 
  Copy, 
  Check, 
  Upload,
  Settings,
  Users,
  Link2,
  Pencil,
  Save,
  X
} from "lucide-react";

interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  company: string | null;
  slug: string | null;
  video_url: string | null;
  intro_video_url: string | null;
  view_count: number | null;
  viewed_at: string | null;
  video_status: string | null;
}

interface Campaign {
  id: string;
  name: string;
  pitch_video_url: string | null;
}

const VideoNoteAdmin = () => {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [editingVideo, setEditingVideo] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const [pitchVideoUrl, setPitchVideoUrl] = useState("");
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);

  // Fetch user's account_id
  const { data: profile } = useQuery({
    queryKey: ['profile', session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('account_id')
        .eq('id', session.user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!session?.user?.id,
  });

  // Fetch campaigns
  const { data: campaigns = [] } = useQuery({
    queryKey: ['campaigns', profile?.account_id],
    queryFn: async () => {
      if (!profile?.account_id) return [];
      const { data, error } = await supabase
        .from('campaigns')
        .select('id, name, pitch_video_url')
        .eq('account_id', profile.account_id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Campaign[];
    },
    enabled: !!profile?.account_id,
  });

  // Fetch contacts with video slugs
  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ['video-contacts', profile?.account_id, selectedCampaign],
    queryFn: async () => {
      if (!profile?.account_id) return [];
      let query = supabase
        .from('contacts')
        .select('id, first_name, last_name, company, slug, video_url, intro_video_url, view_count, viewed_at, video_status')
        .eq('account_id', profile.account_id)
        .not('slug', 'is', null)
        .order('created_at', { ascending: false });
      
      if (selectedCampaign) {
        query = query.eq('campaign_id', selectedCampaign);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as Contact[];
    },
    enabled: !!profile?.account_id,
  });

  // Update video URL mutation
  const updateVideoMutation = useMutation({
    mutationFn: async ({ contactId, videoUrl, introVideoUrl }: { contactId: string; videoUrl: string; introVideoUrl?: string }) => {
      const updateData: { video_url?: string; intro_video_url?: string } = {};
      if (videoUrl) updateData.video_url = videoUrl;
      if (introVideoUrl) updateData.intro_video_url = introVideoUrl;
      
      const { error } = await supabase
        .from('contacts')
        .update(updateData)
        .eq('id', contactId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['video-contacts'] });
      toast.success("Video-URL aktualisiert");
      setEditingVideo(false);
    },
    onError: (error) => {
      toast.error("Fehler beim Speichern: " + error.message);
    },
  });

  // Update campaign pitch video mutation
  const updateCampaignVideoMutation = useMutation({
    mutationFn: async ({ campaignId, pitchVideoUrl }: { campaignId: string; pitchVideoUrl: string }) => {
      const { error } = await supabase
        .from('campaigns')
        .update({ pitch_video_url: pitchVideoUrl })
        .eq('id', campaignId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success("Kampagnen-Video aktualisiert");
    },
    onError: (error) => {
      toast.error("Fehler beim Speichern: " + error.message);
    },
  });

  const copyToClipboard = async (slug: string) => {
    const url = `${window.location.origin}/p/${slug}`;
    await navigator.clipboard.writeText(url);
    setCopiedSlug(slug);
    toast.success("Link kopiert!");
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  const openPreview = (slug: string) => {
    window.open(`/p/${slug}`, '_blank');
  };

  useEffect(() => {
    if (selectedContact) {
      setVideoUrl(selectedContact.video_url || "");
    }
  }, [selectedContact]);

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'ready':
        return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Bereit</Badge>;
      case 'generating':
        return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">Wird generiert...</Badge>;
      case 'error':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Fehler</Badge>;
      default:
        return <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30">Ausstehend</Badge>;
    }
  };

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
              <Video className="w-7 h-7 text-primary" />
              Video-Nachrichten
            </h1>
            <p className="text-muted-foreground mt-1">
              Verwalte und bearbeite personalisierte Video-Seiten für deine Leads
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Panel - Contact List */}
          <div className="lg:col-span-1">
            <Card className="glass-card border-white/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Leads mit Video-Seite
                </CardTitle>
                <CardDescription>
                  {contacts.length} Leads mit personalisierten Video-Seiten
                </CardDescription>
                
                {/* Campaign Filter */}
                {campaigns.length > 0 && (
                  <div className="pt-3">
                    <Label className="text-xs text-muted-foreground">Kampagne filtern</Label>
                    <select 
                      className="w-full mt-1 bg-background/50 border border-white/10 rounded-lg px-3 py-2 text-sm"
                      value={selectedCampaign || ""}
                      onChange={(e) => setSelectedCampaign(e.target.value || null)}
                    >
                      <option value="">Alle Kampagnen</option>
                      {campaigns.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[60vh]">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : contacts.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Video className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>Keine Video-Seiten gefunden</p>
                      <p className="text-sm mt-1">Erstelle eine Kampagne und importiere Leads</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {contacts.map((contact) => (
                        <div
                          key={contact.id}
                          onClick={() => setSelectedContact(contact)}
                          className={`p-3 rounded-xl cursor-pointer transition-all border ${
                            selectedContact?.id === contact.id
                              ? 'bg-primary/10 border-primary/30'
                              : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-foreground">
                                {contact.first_name} {contact.last_name}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {contact.company || 'Keine Firma'}
                              </p>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              {getStatusBadge(contact.video_status)}
                              {contact.view_count && contact.view_count > 0 && (
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Eye className="w-3 h-3" />
                                  {contact.view_count}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Preview & Settings */}
          <div className="lg:col-span-2">
            {selectedContact ? (
              <Card className="glass-card border-white/10">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl">
                        {selectedContact.first_name} {selectedContact.last_name}
                      </CardTitle>
                      <CardDescription>
                        {selectedContact.company || 'Keine Firma angegeben'}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(selectedContact.slug!)}
                        className="gap-2"
                      >
                        {copiedSlug === selectedContact.slug ? (
                          <Check className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                        Link kopieren
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => openPreview(selectedContact.slug!)}
                        className="gap-2"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Vorschau
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="preview">
                    <TabsList className="mb-4">
                      <TabsTrigger value="preview" className="gap-2">
                        <Play className="w-4 h-4" />
                        Video-Vorschau
                      </TabsTrigger>
                      <TabsTrigger value="settings" className="gap-2">
                        <Settings className="w-4 h-4" />
                        Einstellungen
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="preview" className="space-y-4">
                      {/* Video Preview */}
                      <div className="rounded-xl overflow-hidden bg-slate-900 border border-white/10">
                        {selectedContact.video_url ? (
                          <video
                            src={selectedContact.video_url}
                            controls
                            className="w-full aspect-video"
                            poster=""
                          />
                        ) : (
                          <div className="aspect-video flex items-center justify-center bg-slate-800">
                            <div className="text-center">
                              <Video className="w-16 h-16 text-slate-500 mx-auto mb-3" />
                              <p className="text-slate-400">Kein Video vorhanden</p>
                              <p className="text-sm text-slate-500 mt-1">
                                Füge eine Video-URL in den Einstellungen hinzu
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Video Stats */}
                      <div className="grid grid-cols-3 gap-4">
                        <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                          <div className="flex items-center gap-2 text-muted-foreground mb-1">
                            <Eye className="w-4 h-4" />
                            <span className="text-sm">Aufrufe</span>
                          </div>
                          <p className="text-2xl font-bold text-foreground">
                            {selectedContact.view_count || 0}
                          </p>
                        </div>
                        <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                          <div className="flex items-center gap-2 text-muted-foreground mb-1">
                            <Link2 className="w-4 h-4" />
                            <span className="text-sm">Slug</span>
                          </div>
                          <p className="text-sm font-mono text-foreground truncate">
                            {selectedContact.slug}
                          </p>
                        </div>
                        <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                          <div className="flex items-center gap-2 text-muted-foreground mb-1">
                            <Video className="w-4 h-4" />
                            <span className="text-sm">Status</span>
                          </div>
                          {getStatusBadge(selectedContact.video_status)}
                        </div>
                      </div>

                      {/* Page URL */}
                      <div className="bg-primary/5 rounded-xl p-4 border border-primary/20">
                        <Label className="text-sm text-muted-foreground mb-2 block">
                          Seiten-URL
                        </Label>
                        <div className="flex items-center gap-2">
                          <Input
                            value={`${window.location.origin}/p/${selectedContact.slug}`}
                            readOnly
                            className="font-mono text-sm bg-background/50"
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => copyToClipboard(selectedContact.slug!)}
                          >
                            {copiedSlug === selectedContact.slug ? (
                              <Check className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="settings" className="space-y-6">
                      {/* Video URL Settings */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-foreground">Video-URLs</h3>
                          {!editingVideo ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEditingVideo(true)}
                              className="gap-2"
                            >
                              <Pencil className="w-4 h-4" />
                              Bearbeiten
                            </Button>
                          ) : (
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setEditingVideo(false);
                                  setVideoUrl(selectedContact.video_url || "");
                                }}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => {
                                  updateVideoMutation.mutate({
                                    contactId: selectedContact.id,
                                    videoUrl: videoUrl,
                                  });
                                }}
                                disabled={updateVideoMutation.isPending}
                                className="gap-2"
                              >
                                <Save className="w-4 h-4" />
                                Speichern
                              </Button>
                            </div>
                          )}
                        </div>

                        <div className="space-y-4">
                          <div>
                            <Label className="text-sm text-muted-foreground">
                              Haupt-Video URL (Personalisiertes Intro + Pitch)
                            </Label>
                            <Input
                              value={videoUrl}
                              onChange={(e) => setVideoUrl(e.target.value)}
                              placeholder="https://..."
                              disabled={!editingVideo}
                              className="mt-1.5 bg-background/50"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                              Das Video, das auf der Seite abgespielt wird
                            </p>
                          </div>

                          {selectedContact.intro_video_url && (
                            <div>
                              <Label className="text-sm text-muted-foreground">
                                Intro-Video URL (falls separat)
                              </Label>
                              <Input
                                value={selectedContact.intro_video_url}
                                readOnly
                                className="mt-1.5 bg-background/50 opacity-60"
                              />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Divider */}
                      <div className="border-t border-white/10" />

                      {/* Danger Zone */}
                      <div className="space-y-3">
                        <h3 className="font-semibold text-foreground">Aktionen</h3>
                        <div className="flex flex-wrap gap-3">
                          <Button
                            variant="outline"
                            onClick={() => openPreview(selectedContact.slug!)}
                            className="gap-2"
                          >
                            <ExternalLink className="w-4 h-4" />
                            Seite in neuem Tab öffnen
                          </Button>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            ) : (
              <Card className="glass-card border-white/10 h-full flex items-center justify-center min-h-[60vh]">
                <div className="text-center p-8">
                  <Video className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Wähle einen Lead aus
                  </h3>
                  <p className="text-muted-foreground max-w-sm">
                    Klicke auf einen Lead in der Liste links, um die Video-Seite anzusehen und zu bearbeiten.
                  </p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default VideoNoteAdmin;
