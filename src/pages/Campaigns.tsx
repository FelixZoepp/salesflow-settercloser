import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Users, Eye, MousePointer, Clock, Play, MoreVertical, Trash2, Edit, Workflow, BarChart3, GitCompare, ArrowLeft, X } from "lucide-react";
import { toast } from "sonner";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { CampaignWorkflow } from "@/components/CampaignWorkflow";
import { CampaignStatistics } from "@/components/CampaignStatistics";
import { CampaignComparison } from "@/components/CampaignComparison";
import { CampaignLeadsTable } from "@/components/CampaignLeadsTable";

interface Campaign {
  id: string;
  name: string;
  description: string | null;
  status: string;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  account_id: string | null;
}

interface CampaignStats {
  totalLeads: number;
  pageViews: number;
  videoPlays: number;
  ctaClicks: number;
  hotLeads: number;
  warmLeads: number;
  coldLeads: number;
}

const Campaigns = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [campaignStats, setCampaignStats] = useState<CampaignStats | null>(null);
  const [newCampaign, setNewCampaign] = useState({
    name: "",
    description: "",
    status: "draft",
  });

  useEffect(() => {
    fetchCampaigns();
  }, []);

  useEffect(() => {
    if (selectedCampaign) {
      fetchCampaignStats(selectedCampaign.id);
    }
  }, [selectedCampaign]);

  const fetchCampaigns = async () => {
    try {
      const { data, error } = await supabase
        .from("campaigns")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCampaigns(data || []);
    } catch (error: any) {
      console.error("Error fetching campaigns:", error);
      toast.error("Fehler beim Laden der Kampagnen");
    } finally {
      setLoading(false);
    }
  };

  const fetchCampaignStats = async (campaignId: string) => {
    try {
      // Get leads in this campaign
      const { data: leads } = await supabase
        .from("contacts")
        .select("id, lead_score")
        .eq("campaign_id", campaignId);

      const leadIds = leads?.map((l) => l.id) || [];

      // Get tracking events for these leads
      const { data: events } = await supabase
        .from("lead_tracking_events")
        .select("event_type")
        .in("contact_id", leadIds.length > 0 ? leadIds : ["00000000-0000-0000-0000-000000000000"]);

      const pageViews = events?.filter((e) => e.event_type === "page_view").length || 0;
      const videoPlays = events?.filter((e) => e.event_type === "video_play" || e.event_type === "video_complete").length || 0;
      const ctaClicks = events?.filter((e) => e.event_type === "cta_click" || e.event_type === "button_click").length || 0;

      // Calculate lead temperature based on score
      const hotLeads = leads?.filter((l) => (l.lead_score || 0) >= 70).length || 0;
      const warmLeads = leads?.filter((l) => (l.lead_score || 0) >= 30 && (l.lead_score || 0) < 70).length || 0;
      const coldLeads = leads?.filter((l) => (l.lead_score || 0) < 30).length || 0;

      setCampaignStats({
        totalLeads: leads?.length || 0,
        pageViews,
        videoPlays,
        ctaClicks,
        hotLeads,
        warmLeads,
        coldLeads,
      });
    } catch (error) {
      console.error("Error fetching campaign stats:", error);
    }
  };

  const createCampaign = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("account_id")
        .eq("id", user.id)
        .single();

      const { error } = await supabase.from("campaigns").insert({
        name: newCampaign.name,
        description: newCampaign.description || null,
        status: newCampaign.status,
        account_id: profile?.account_id,
      });

      if (error) throw error;

      toast.success("Kampagne erstellt");
      setIsCreateDialogOpen(false);
      setNewCampaign({ name: "", description: "", status: "draft" });
      fetchCampaigns();
    } catch (error: any) {
      console.error("Error creating campaign:", error);
      toast.error("Fehler beim Erstellen der Kampagne");
    }
  };

  const deleteCampaign = async (id: string) => {
    try {
      const { error } = await supabase.from("campaigns").delete().eq("id", id);
      if (error) throw error;
      toast.success("Kampagne gelöscht");
      if (selectedCampaign?.id === id) {
        setSelectedCampaign(null);
      }
      fetchCampaigns();
    } catch (error: any) {
      console.error("Error deleting campaign:", error);
      toast.error("Fehler beim Löschen");
    }
  };

  const updateCampaignStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase.from("campaigns").update({ status }).eq("id", id);
      if (error) throw error;
      toast.success("Status aktualisiert");
      fetchCampaigns();
    } catch (error: any) {
      toast.error("Fehler beim Aktualisieren");
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      draft: { label: "Entwurf", variant: "secondary" },
      active: { label: "Aktiv", variant: "default" },
      paused: { label: "Pausiert", variant: "outline" },
      completed: { label: "Abgeschlossen", variant: "destructive" },
    };
    const config = statusConfig[status] || statusConfig.draft;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const pieChartData = campaignStats ? [
    { name: "Hot", value: campaignStats.hotLeads, color: "#ef4444" },
    { name: "Warm", value: campaignStats.warmLeads, color: "#f59e0b" },
    { name: "Cold", value: campaignStats.coldLeads, color: "#3b82f6" },
  ].filter(d => d.value > 0) : [];

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <p className="text-muted-foreground">Lädt Kampagnen...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-muted/30 via-background to-primary/5 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Kampagnen</h1>
              <p className="text-muted-foreground">Verwalte deine Outreach-Kampagnen</p>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Neue Kampagne
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Neue Kampagne erstellen</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={newCampaign.name}
                      onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                      placeholder="z.B. Outreach November 2025"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Beschreibung</Label>
                    <Textarea
                      id="description"
                      value={newCampaign.description}
                      onChange={(e) => setNewCampaign({ ...newCampaign, description: e.target.value })}
                      placeholder="Optional: Beschreibe die Kampagne"
                    />
                  </div>
                  <div>
                    <Label>Status</Label>
                    <Select
                      value={newCampaign.status}
                      onValueChange={(value) => setNewCampaign({ ...newCampaign, status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Entwurf</SelectItem>
                        <SelectItem value="active">Aktiv</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={createCampaign} disabled={!newCampaign.name} className="w-full">
                    Kampagne erstellen
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Tabs defaultValue="campaigns" className="space-y-6">
            <TabsList>
              <TabsTrigger value="campaigns">Kampagnen</TabsTrigger>
              <TabsTrigger value="comparison" className="flex items-center gap-1">
                <GitCompare className="h-4 w-4" />
                Vergleich
              </TabsTrigger>
            </TabsList>

            <TabsContent value="campaigns">
              {selectedCampaign ? (
                // Full-width campaign detail view
                <div className="space-y-6">
                  {/* Header with back button */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedCampaign(null)}
                        className="flex items-center gap-2"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        Zurück zur Übersicht
                      </Button>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSelectedCampaign(null)}
                      className="h-8 w-8"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Campaign Card */}
                  <Card className="bg-card border-border">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-xl">{selectedCampaign.name}</CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">
                            Leads dieser Kampagne • Erstellt am {new Date(selectedCampaign.created_at).toLocaleDateString("de-DE")}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(selectedCampaign.status)}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => updateCampaignStatus(selectedCampaign.id, "active")}>
                                <Play className="w-4 h-4 mr-2" /> Aktivieren
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => updateCampaignStatus(selectedCampaign.id, "paused")}>
                                <Clock className="w-4 h-4 mr-2" /> Pausieren
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => {
                                  deleteCampaign(selectedCampaign.id);
                                  setSelectedCampaign(null);
                                }}
                              >
                                <Trash2 className="w-4 h-4 mr-2" /> Löschen
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Tabs defaultValue="leads">
                        <TabsList>
                          <TabsTrigger value="leads" className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            Leads
                          </TabsTrigger>
                          <TabsTrigger value="workflow" className="flex items-center gap-1">
                            <Workflow className="h-4 w-4" />
                            Daily Workflow
                          </TabsTrigger>
                          <TabsTrigger value="statistics" className="flex items-center gap-1">
                            <BarChart3 className="h-4 w-4" />
                            Statistiken
                          </TabsTrigger>
                          <TabsTrigger value="overview">Übersicht</TabsTrigger>
                          <TabsTrigger value="tracking">Tracking</TabsTrigger>
                        </TabsList>

                        <TabsContent value="leads" className="mt-6">
                          <CampaignLeadsTable 
                            campaignId={selectedCampaign.id} 
                            campaignName={selectedCampaign.name} 
                          />
                        </TabsContent>

                        <TabsContent value="workflow" className="mt-6">
                          <CampaignWorkflow 
                            campaignId={selectedCampaign.id} 
                            campaignName={selectedCampaign.name} 
                          />
                        </TabsContent>

                        <TabsContent value="statistics" className="mt-6">
                          <CampaignStatistics 
                            campaignId={selectedCampaign.id} 
                            campaignName={selectedCampaign.name} 
                          />
                        </TabsContent>

                        <TabsContent value="overview" className="mt-6">
                          {/* Stats Grid */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                            <div className="bg-muted/50 rounded-lg p-4">
                              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                <Users className="w-4 h-4" />
                                <span className="text-xs">Leads</span>
                              </div>
                              <p className="text-2xl font-bold">{campaignStats?.totalLeads || 0}</p>
                            </div>
                            <div className="bg-muted/50 rounded-lg p-4">
                              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                <Eye className="w-4 h-4" />
                                <span className="text-xs">Seitenaufrufe</span>
                              </div>
                              <p className="text-2xl font-bold">{campaignStats?.pageViews || 0}</p>
                            </div>
                            <div className="bg-muted/50 rounded-lg p-4">
                              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                <Play className="w-4 h-4" />
                                <span className="text-xs">Videos</span>
                              </div>
                              <p className="text-2xl font-bold">{campaignStats?.videoPlays || 0}</p>
                            </div>
                            <div className="bg-muted/50 rounded-lg p-4">
                              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                <MousePointer className="w-4 h-4" />
                                <span className="text-xs">CTA Klicks</span>
                              </div>
                              <p className="text-2xl font-bold">{campaignStats?.ctaClicks || 0}</p>
                            </div>
                          </div>

                          {/* Pie Chart */}
                          <div className="bg-muted/30 rounded-lg p-6">
                            <h3 className="font-medium mb-4">Lead-Verteilung</h3>
                            {pieChartData.length > 0 ? (
                              <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                  <PieChart>
                                    <Pie
                                      data={pieChartData}
                                      cx="50%"
                                      cy="50%"
                                      innerRadius={60}
                                      outerRadius={80}
                                      paddingAngle={5}
                                      dataKey="value"
                                      label={({ name, value }) => `${name}: ${value}`}
                                    >
                                      {pieChartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                      ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                  </PieChart>
                                </ResponsiveContainer>
                              </div>
                            ) : (
                              <p className="text-muted-foreground text-center py-8">
                                Noch keine Leads in dieser Kampagne
                              </p>
                            )}
                          </div>
                        </TabsContent>

                        <TabsContent value="tracking" className="mt-6">
                          <div className="space-y-4">
                            <div className="bg-muted/30 rounded-lg p-6">
                              <h3 className="font-medium mb-4">Tracking-Übersicht</h3>
                              <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                  <span className="text-muted-foreground">Seitenaufrufe</span>
                                  <span className="font-medium">{campaignStats?.pageViews || 0}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-muted-foreground">Video gestartet</span>
                                  <span className="font-medium">{campaignStats?.videoPlays || 0}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-muted-foreground">CTA-Klicks</span>
                                  <span className="font-medium">{campaignStats?.ctaClicks || 0}</span>
                                </div>
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Detaillierte Tracking-Events werden automatisch erfasst, wenn Leads deine personalisierten Seiten besuchen.
                            </p>
                          </div>
                        </TabsContent>
                      </Tabs>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                // Campaign list view
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {campaigns.length === 0 ? (
                    <Card className="bg-card border-border col-span-full">
                      <CardContent className="p-6 text-center text-muted-foreground">
                        Noch keine Kampagnen erstellt
                      </CardContent>
                    </Card>
                  ) : (
                    campaigns.map((campaign) => (
                      <Card
                        key={campaign.id}
                        className="bg-card border-border cursor-pointer transition-all hover:border-primary/50 hover:shadow-lg"
                        onClick={() => setSelectedCampaign(campaign)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="font-medium text-foreground">{campaign.name}</h3>
                              {campaign.description && (
                                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                  {campaign.description}
                                </p>
                              )}
                              <div className="mt-2">{getStatusBadge(campaign.status)}</div>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => updateCampaignStatus(campaign.id, "active")}>
                                  <Play className="w-4 h-4 mr-2" /> Aktivieren
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => updateCampaignStatus(campaign.id, "paused")}>
                                  <Clock className="w-4 h-4 mr-2" /> Pausieren
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => deleteCampaign(campaign.id)}
                                >
                                  <Trash2 className="w-4 h-4 mr-2" /> Löschen
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="comparison">
              <CampaignComparison />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
};

export default Campaigns;
