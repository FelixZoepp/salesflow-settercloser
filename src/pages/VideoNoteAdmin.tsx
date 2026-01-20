import { useState, useEffect, useRef, useMemo } from "react";
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
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { format, subDays, parseISO, startOfDay } from "date-fns";
import { de } from "date-fns/locale";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts";
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
  X,
  BarChart3,
  Clock,
  MousePointerClick,
  TrendingUp,
  Loader2,
  Calendar
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
  campaign_id: string | null;
}

interface Campaign {
  id: string;
  name: string;
  pitch_video_url: string | null;
}

interface TrackingEvent {
  event_type: string;
  event_data: Record<string, unknown> | null;
  created_at: string;
}

interface CampaignAnalytics {
  totalViews: number;
  videoPlays: number;
  videoCompletions: number;
  avgWatchTime: number;
  ctaClicks: number;
  bookingClicks: number;
  avgScrollDepth: number;
  conversionRate: number;
}

const VideoNoteAdmin = () => {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [editingVideo, setEditingVideo] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [activeTab, setActiveTab] = useState("leads");

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
        .select('id, first_name, last_name, company, slug, video_url, intro_video_url, view_count, viewed_at, video_status, campaign_id')
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

  // Fetch tracking events for analytics
  const { data: trackingEvents = [] } = useQuery({
    queryKey: ['tracking-events', profile?.account_id, selectedCampaign],
    queryFn: async () => {
      if (!profile?.account_id) return [];
      
      // Get contact IDs for the selected campaign or all
      const contactIds = contacts.map(c => c.id);
      if (contactIds.length === 0) return [];
      
      const { data, error } = await supabase
        .from('lead_tracking_events')
        .select('event_type, event_data, created_at, contact_id')
        .in('contact_id', contactIds)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as (TrackingEvent & { contact_id: string })[];
    },
    enabled: !!profile?.account_id && contacts.length > 0,
  });

  // Calculate analytics from tracking events
  const analytics: CampaignAnalytics = (() => {
    if (trackingEvents.length === 0) {
      return {
        totalViews: 0,
        videoPlays: 0,
        videoCompletions: 0,
        avgWatchTime: 0,
        ctaClicks: 0,
        bookingClicks: 0,
        avgScrollDepth: 0,
        conversionRate: 0,
      };
    }

    const pageViews = trackingEvents.filter(e => e.event_type === 'page_view').length;
    const videoPlays = trackingEvents.filter(e => e.event_type === 'video_play').length;
    const videoCompletes = trackingEvents.filter(e => e.event_type === 'video_complete').length;
    const ctaClicks = trackingEvents.filter(e => e.event_type === 'cta_click').length;
    const bookingClicks = trackingEvents.filter(e => e.event_type === 'booking_click').length;
    
    // Calculate average watch time from time_on_page events
    const timeEvents = trackingEvents.filter(e => e.event_type === 'time_on_page');
    const avgWatchTime = timeEvents.length > 0
      ? timeEvents.reduce((sum, e) => sum + (Number(e.event_data?.seconds) || 0), 0) / timeEvents.length
      : 0;
    
    // Calculate average scroll depth
    const scrollEvents = trackingEvents.filter(e => e.event_type === 'scroll_depth');
    const avgScrollDepth = scrollEvents.length > 0
      ? scrollEvents.reduce((sum, e) => sum + (Number(e.event_data?.depth) || 0), 0) / scrollEvents.length
      : 0;
    
    // Conversion rate = booking clicks / page views
    const conversionRate = pageViews > 0 ? (bookingClicks / pageViews) * 100 : 0;

    return {
      totalViews: pageViews,
      videoPlays,
      videoCompletions: videoCompletes,
      avgWatchTime: Math.round(avgWatchTime),
      ctaClicks,
      bookingClicks,
      avgScrollDepth: Math.round(avgScrollDepth),
      conversionRate: Math.round(conversionRate * 10) / 10,
    };
  })();

  // Generate time-series data for charts (last 14 days)
  const timeSeriesData = useMemo(() => {
    const days = 14;
    const data: { date: string; label: string; views: number; videoPlays: number; ctaClicks: number; bookings: number }[] = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dateStr = format(date, 'yyyy-MM-dd');
      const label = format(date, 'dd. MMM', { locale: de });
      
      const dayEvents = trackingEvents.filter(e => {
        const eventDate = format(parseISO(e.created_at), 'yyyy-MM-dd');
        return eventDate === dateStr;
      });
      
      data.push({
        date: dateStr,
        label,
        views: dayEvents.filter(e => e.event_type === 'page_view').length,
        videoPlays: dayEvents.filter(e => e.event_type === 'video_play').length,
        ctaClicks: dayEvents.filter(e => e.event_type === 'cta_click').length,
        bookings: dayEvents.filter(e => e.event_type === 'booking_click').length,
      });
    }
    
    return data;
  }, [trackingEvents]);

  // Event breakdown for bar chart
  const eventBreakdownData = useMemo(() => {
    return [
      { name: 'Seitenaufrufe', value: analytics.totalViews, fill: '#6366f1' },
      { name: 'Video-Plays', value: analytics.videoPlays, fill: '#10b981' },
      { name: 'Video beendet', value: analytics.videoCompletions, fill: '#8b5cf6' },
      { name: 'CTA-Klicks', value: analytics.ctaClicks, fill: '#f59e0b' },
      { name: 'Termin-Klicks', value: analytics.bookingClicks, fill: '#ec4899' },
    ];
  }, [analytics]);


  const updateVideoMutation = useMutation({
    mutationFn: async ({ contactId, videoUrl }: { contactId: string; videoUrl: string }) => {
      const { error } = await supabase
        .from('contacts')
        .update({ video_url: videoUrl, video_status: 'ready' })
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

  // Video upload handler
  const handleVideoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedContact) return;

    // Validate file type
    if (!file.type.startsWith('video/')) {
      toast.error("Bitte wähle eine Video-Datei aus");
      return;
    }

    // Validate file size (max 100MB)
    const maxSize = 100 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error("Video ist zu groß (max. 100MB)");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${selectedContact.id}-${Date.now()}.${fileExt}`;
      const filePath = `contact-videos/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('personalized-videos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('personalized-videos')
        .getPublicUrl(filePath);

      // Update contact with new video URL
      await updateVideoMutation.mutateAsync({
        contactId: selectedContact.id,
        videoUrl: urlData.publicUrl,
      });

      setUploadProgress(100);
      toast.success("Video erfolgreich hochgeladen!");
      
      // Update selected contact state
      setSelectedContact(prev => prev ? { ...prev, video_url: urlData.publicUrl } : null);
      setVideoUrl(urlData.publicUrl);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler';
      toast.error("Upload fehlgeschlagen: " + errorMessage);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

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
        return <Badge className="bg-muted/50 text-muted-foreground border-muted">Ausstehend</Badge>;
    }
  };

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
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

        {/* Campaign Filter */}
        <div className="flex items-center gap-4">
          <div className="flex-1 max-w-xs">
            <Label className="text-xs text-muted-foreground mb-1 block">Kampagne</Label>
            <select 
              className="w-full bg-background/50 border border-border rounded-lg px-3 py-2 text-sm"
              value={selectedCampaign || ""}
              onChange={(e) => setSelectedCampaign(e.target.value || null)}
            >
              <option value="">Alle Kampagnen</option>
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="leads" className="gap-2">
              <Users className="w-4 h-4" />
              Leads & Videos
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* Leads Tab */}
          <TabsContent value="leads" className="mt-6">
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Left Panel - Contact List */}
              <div className="lg:col-span-1">
                <Card className="glass-card border-border">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Users className="w-5 h-5 text-primary" />
                      Leads mit Video-Seite
                    </CardTitle>
                    <CardDescription>
                      {contacts.length} Leads mit personalisierten Video-Seiten
                    </CardDescription>
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
                                  : 'bg-muted/20 border-border hover:bg-muted/40 hover:border-border'
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
                  <Card className="glass-card border-border">
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
                          <TabsTrigger value="upload" className="gap-2">
                            <Upload className="w-4 h-4" />
                            Video hochladen
                          </TabsTrigger>
                          <TabsTrigger value="settings" className="gap-2">
                            <Settings className="w-4 h-4" />
                            Einstellungen
                          </TabsTrigger>
                        </TabsList>

                        <TabsContent value="preview" className="space-y-4">
                          {/* Video Preview */}
                          <div className="rounded-xl overflow-hidden bg-background border border-border">
                            {selectedContact.video_url ? (
                              <video
                                src={selectedContact.video_url}
                                controls
                                className="w-full aspect-video"
                              />
                            ) : (
                              <div className="aspect-video flex items-center justify-center bg-muted/20">
                                <div className="text-center">
                                  <Video className="w-16 h-16 text-muted-foreground/50 mx-auto mb-3" />
                                  <p className="text-muted-foreground">Kein Video vorhanden</p>
                                  <p className="text-sm text-muted-foreground/70 mt-1">
                                    Lade ein Video hoch oder füge eine URL hinzu
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Video Stats */}
                          <div className="grid grid-cols-3 gap-4">
                            <div className="bg-muted/20 rounded-xl p-4 border border-border">
                              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                <Eye className="w-4 h-4" />
                                <span className="text-sm">Aufrufe</span>
                              </div>
                              <p className="text-2xl font-bold text-foreground">
                                {selectedContact.view_count || 0}
                              </p>
                            </div>
                            <div className="bg-muted/20 rounded-xl p-4 border border-border">
                              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                <Link2 className="w-4 h-4" />
                                <span className="text-sm">Slug</span>
                              </div>
                              <p className="text-sm font-mono text-foreground truncate">
                                {selectedContact.slug}
                              </p>
                            </div>
                            <div className="bg-muted/20 rounded-xl p-4 border border-border">
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

                        <TabsContent value="upload" className="space-y-6">
                          {/* Upload Area */}
                          <div className="space-y-4">
                            <div>
                              <h3 className="font-semibold text-foreground mb-2">Video hochladen</h3>
                              <p className="text-sm text-muted-foreground mb-4">
                                Lade ein personalisiertes Video für diesen Lead hoch (max. 100MB)
                              </p>
                            </div>

                            <input
                              ref={fileInputRef}
                              type="file"
                              accept="video/*"
                              onChange={handleVideoUpload}
                              className="hidden"
                            />

                            <div 
                              onClick={() => !isUploading && fileInputRef.current?.click()}
                              className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
                                isUploading 
                                  ? 'border-primary/50 bg-primary/5' 
                                  : 'border-border hover:border-primary/50 hover:bg-primary/5'
                              }`}
                            >
                              {isUploading ? (
                                <div className="space-y-4">
                                  <Loader2 className="w-12 h-12 mx-auto text-primary animate-spin" />
                                  <p className="text-foreground font-medium">Video wird hochgeladen...</p>
                                  <Progress value={uploadProgress} className="max-w-xs mx-auto" />
                                </div>
                              ) : (
                                <>
                                  <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                                  <p className="text-foreground font-medium mb-2">
                                    Klicke hier um ein Video auszuwählen
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    MP4, MOV, WebM • Max. 100MB
                                  </p>
                                </>
                              )}
                            </div>

                            {selectedContact.video_url && (
                              <div className="bg-emerald-500/10 rounded-xl p-4 border border-emerald-500/20">
                                <div className="flex items-center gap-2 text-emerald-400 mb-1">
                                  <Check className="w-4 h-4" />
                                  <span className="font-medium">Video vorhanden</span>
                                </div>
                                <p className="text-sm text-muted-foreground truncate">
                                  {selectedContact.video_url}
                                </p>
                              </div>
                            )}
                          </div>
                        </TabsContent>

                        <TabsContent value="settings" className="space-y-6">
                          {/* Video URL Settings */}
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <h3 className="font-semibold text-foreground">Video-URL manuell setzen</h3>
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

                            <div>
                              <Label className="text-sm text-muted-foreground">
                                Video URL
                              </Label>
                              <Input
                                value={videoUrl}
                                onChange={(e) => setVideoUrl(e.target.value)}
                                placeholder="https://..."
                                disabled={!editingVideo}
                                className="mt-1.5 bg-background/50"
                              />
                              <p className="text-xs text-muted-foreground mt-1">
                                Externe Video-URL (z.B. von HeyGen, Loom, etc.)
                              </p>
                            </div>
                          </div>

                          <div className="border-t border-border" />

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
                  <Card className="glass-card border-border h-full flex items-center justify-center min-h-[60vh]">
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
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="mt-6 space-y-6">
            {/* Analytics Overview Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="glass-card border-border">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Eye className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Seitenaufrufe</p>
                      <p className="text-2xl font-bold text-foreground">{analytics.totalViews}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card border-border">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-500/10">
                      <Play className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Video-Plays</p>
                      <p className="text-2xl font-bold text-foreground">{analytics.videoPlays}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card border-border">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-amber-500/10">
                      <Clock className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Ø Verweildauer</p>
                      <p className="text-2xl font-bold text-foreground">{formatTime(analytics.avgWatchTime)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card border-border">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-500/10">
                      <MousePointerClick className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Termin-Klicks</p>
                      <p className="text-2xl font-bold text-foreground">{analytics.bookingClicks}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Time Series Charts */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Views Over Time Chart */}
              <Card className="glass-card border-border">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary" />
                    Aufrufe (letzte 14 Tage)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={timeSeriesData}>
                        <defs>
                          <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorPlays" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis 
                          dataKey="label" 
                          stroke="hsl(var(--muted-foreground))"
                          fontSize={12}
                          tickLine={false}
                        />
                        <YAxis 
                          stroke="hsl(var(--muted-foreground))"
                          fontSize={12}
                          tickLine={false}
                          allowDecimals={false}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                            color: 'hsl(var(--foreground))'
                          }}
                        />
                        <Legend />
                        <Area 
                          type="monotone" 
                          dataKey="views" 
                          name="Seitenaufrufe"
                          stroke="#6366f1" 
                          fillOpacity={1} 
                          fill="url(#colorViews)" 
                        />
                        <Area 
                          type="monotone" 
                          dataKey="videoPlays" 
                          name="Video-Plays"
                          stroke="#10b981" 
                          fillOpacity={1} 
                          fill="url(#colorPlays)" 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Conversions Over Time Chart */}
              <Card className="glass-card border-border">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MousePointerClick className="w-5 h-5 text-primary" />
                    Conversions (letzte 14 Tage)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={timeSeriesData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis 
                          dataKey="label" 
                          stroke="hsl(var(--muted-foreground))"
                          fontSize={12}
                          tickLine={false}
                        />
                        <YAxis 
                          stroke="hsl(var(--muted-foreground))"
                          fontSize={12}
                          tickLine={false}
                          allowDecimals={false}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                            color: 'hsl(var(--foreground))'
                          }}
                        />
                        <Legend />
                        <Bar dataKey="ctaClicks" name="CTA-Klicks" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="bookings" name="Termin-Klicks" fill="#ec4899" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Event Breakdown Chart */}
            <Card className="glass-card border-border">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  Event-Übersicht
                </CardTitle>
                <CardDescription>
                  Gesamtanzahl aller Events im ausgewählten Zeitraum
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={eventBreakdownData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis 
                        type="number"
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                        tickLine={false}
                      />
                      <YAxis 
                        type="category"
                        dataKey="name"
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                        tickLine={false}
                        width={100}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          color: 'hsl(var(--foreground))'
                        }}
                      />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Detailed Analytics */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="glass-card border-border">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Video className="w-5 h-5 text-primary" />
                    Video-Engagement
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Video gestartet</span>
                      <span className="font-medium text-foreground">{analytics.videoPlays}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Video beendet</span>
                      <span className="font-medium text-foreground">{analytics.videoCompletions}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Abschlussrate</span>
                      <span className="font-medium text-foreground">
                        {analytics.videoPlays > 0 
                          ? Math.round((analytics.videoCompletions / analytics.videoPlays) * 100) 
                          : 0}%
                      </span>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-border">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-muted-foreground">Ø Scroll-Tiefe</span>
                      <span className="font-medium text-foreground">{analytics.avgScrollDepth}%</span>
                    </div>
                    <Progress value={analytics.avgScrollDepth} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card border-border">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    Conversion-Metriken
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">CTA-Klicks</span>
                      <span className="font-medium text-foreground">{analytics.ctaClicks}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Termin-Button Klicks</span>
                      <span className="font-medium text-foreground">{analytics.bookingClicks}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Conversion-Rate</span>
                      <span className="font-medium text-foreground">{analytics.conversionRate}%</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border">
                    <div className="bg-primary/5 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <TrendingUp className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium text-foreground">Performance</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {analytics.conversionRate >= 5 
                          ? "Sehr gute Conversion-Rate! 🎉" 
                          : analytics.conversionRate >= 2 
                            ? "Gute Performance, weiter optimieren." 
                            : "Tipp: Optimiere dein Video und CTA."}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Campaign Stats Summary */}
            <Card className="glass-card border-border">
              <CardHeader>
                <CardTitle className="text-lg">
                  {selectedCampaign 
                    ? `Kampagne: ${campaigns.find(c => c.id === selectedCampaign)?.name}` 
                    : "Alle Kampagnen"}
                </CardTitle>
                <CardDescription>
                  {contacts.length} Leads • {analytics.totalViews} Aufrufe • {analytics.bookingClicks} Termin-Anfragen
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-foreground">{contacts.length}</p>
                    <p className="text-xs text-muted-foreground">Leads</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{analytics.totalViews}</p>
                    <p className="text-xs text-muted-foreground">Aufrufe</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{analytics.videoPlays}</p>
                    <p className="text-xs text-muted-foreground">Video-Plays</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{formatTime(analytics.avgWatchTime)}</p>
                    <p className="text-xs text-muted-foreground">Ø Zeit auf Seite</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{analytics.conversionRate}%</p>
                    <p className="text-xs text-muted-foreground">Conversion</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default VideoNoteAdmin;
