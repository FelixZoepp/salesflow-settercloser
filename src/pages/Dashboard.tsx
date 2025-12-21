import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { 
  Megaphone, 
  Play, 
  Users, 
  Eye, 
  Flame, 
  Calendar,
  LayoutDashboard,
  MousePointer,
  ExternalLink,
  Clock
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";

interface LeadStats {
  totalCampaigns: number;
  activeCampaigns: number;
  totalLeads: number;
  pageViews: number;
  hotLeads: number;
  bookings: number;
}

interface TrackingEvent {
  id: string;
  contact_id: string;
  event_type: string;
  event_data: any;
  created_at: string;
  contact?: {
    first_name: string;
    last_name: string;
    company: string | null;
  };
}

const Dashboard = () => {
  const [leadStats, setLeadStats] = useState<LeadStats>({
    totalCampaigns: 0,
    activeCampaigns: 0,
    totalLeads: 0,
    pageViews: 0,
    hotLeads: 0,
    bookings: 0,
  });
  const [events, setEvents] = useState<TrackingEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch campaigns
      const { data: campaigns } = await supabase.from("campaigns").select("id, status");
      const totalCampaigns = campaigns?.length || 0;
      const activeCampaigns = campaigns?.filter(c => c.status === "active").length || 0;

      // Fetch leads count
      const { count: totalLeads } = await supabase.from("contacts").select("id", { count: "exact", head: true });

      // Fetch tracking stats for page views
      const { data: trackingEvents } = await supabase
        .from("lead_tracking_events")
        .select("event_type");

      const pageViews = trackingEvents?.filter(e => e.event_type === "page_view").length || 0;

      // Fetch REAL bookings: Deals moved to "Erstgespräch gelegt" in last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      // Fetch REAL bookings: Deals moved to "Erstgespräch gelegt" in last 30 days
      const { data: allDeals } = await supabase
        .from("deals")
        .select("id, stage, updated_at")
        .gte("updated_at", thirtyDaysAgo.toISOString());
      
      // Cast stage to string to compare with inbound pipeline stages
      const bookings = allDeals?.filter(d => (d.stage as string) === "Erstgespräch gelegt").length || 0;

      // Fetch hot leads (score >= 70)
      const { count: hotLeads } = await supabase
        .from("contacts")
        .select("id", { count: "exact", head: true })
        .gte("lead_score", 70);

      setLeadStats({
        totalCampaigns,
        activeCampaigns,
        totalLeads: totalLeads || 0,
        pageViews,
        hotLeads: hotLeads || 0,
        bookings: bookings || 0,
      });

      // Fetch recent events
      const { data: recentEvents } = await supabase
        .from("lead_tracking_events")
        .select("id, contact_id, event_type, event_data, created_at")
        .order("created_at", { ascending: false })
        .limit(8);

      const eventsWithContacts = await Promise.all(
        (recentEvents || []).map(async (event) => {
          const { data: contact } = await supabase
            .from("contacts")
            .select("first_name, last_name, company")
            .eq("id", event.contact_id)
            .single();
          return { ...event, contact: contact || undefined };
        })
      );

      setEvents(eventsWithContacts);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getEventIcon = (eventType: string) => {
    const iconClass = "w-4 h-4";
    switch (eventType) {
      case "page_view":
        return <Eye className={`${iconClass} text-blue-400`} />;
      case "video_play":
      case "video_progress":
      case "video_complete":
        return <Play className={`${iconClass} text-green-400`} />;
      case "button_click":
      case "cta_click":
        return <MousePointer className={`${iconClass} text-amber-400`} />;
      case "booking_click":
        return <ExternalLink className={`${iconClass} text-purple-400`} />;
      case "time_on_page":
        return <Clock className={`${iconClass} text-cyan-400`} />;
      default:
        return <Eye className={`${iconClass} text-muted-foreground`} />;
    }
  };

  const getEventLabel = (event: TrackingEvent) => {
    const data = event.event_data || {};
    switch (event.event_type) {
      case "page_view":
        return "Landing Page besucht";
      case "video_play":
        return "Video gestartet";
      case "video_progress":
        return `Video ${data.progress || 0}% angesehen`;
      case "video_complete":
        return "Video 100% angesehen";
      case "button_click":
        return `Button geklickt`;
      case "cta_click":
        return "CTA-Button geklickt";
      case "booking_click":
        return "Booking-Seite geöffnet";
      case "time_on_page":
        return `${Math.round((data.seconds || 0) / 60)} Min. auf Seite`;
      default:
        return event.event_type;
    }
  };

  const getIconBgColor = (eventType: string) => {
    switch (eventType) {
      case "page_view":
        return "bg-blue-500/15";
      case "video_play":
      case "video_progress":
      case "video_complete":
        return "bg-green-500/15";
      case "button_click":
      case "cta_click":
        return "bg-amber-500/15";
      case "booking_click":
        return "bg-purple-500/15";
      case "time_on_page":
        return "bg-cyan-500/15";
      default:
        return "bg-muted";
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-pulse text-muted-foreground">Lädt Dashboard...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen noise-bg dotted-grid">
        <div className="max-w-7xl mx-auto p-1">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <LayoutDashboard className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
              <p className="text-sm text-muted-foreground">Übersicht Ihrer Kampagnen und Leads</p>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid lg:grid-cols-5 gap-6">
            {/* Left Side - Stats Cards */}
            <div className="lg:col-span-2">
              <div className="grid grid-cols-2 gap-4">
                {/* Kampagnen gesamt */}
                <div className="stat-card">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">Kampagnen gesamt</p>
                      <p className="text-3xl font-bold text-foreground">{leadStats.totalCampaigns}</p>
                    </div>
                    <div className="icon-glow icon-glow-blue">
                      <Megaphone className="w-5 h-5" />
                    </div>
                  </div>
                </div>

                {/* Kampagnen aktiv */}
                <div className="stat-card">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">Kampagnen aktiv</p>
                      <p className="text-3xl font-bold text-foreground">{leadStats.activeCampaigns}</p>
                    </div>
                    <div className="icon-glow icon-glow-green">
                      <Play className="w-5 h-5" />
                    </div>
                  </div>
                </div>

                {/* Leads gesamt */}
                <div className="stat-card">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">Leads gesamt</p>
                      <p className="text-3xl font-bold text-foreground">{leadStats.totalLeads}</p>
                    </div>
                    <div className="icon-glow icon-glow-purple">
                      <Users className="w-5 h-5" />
                    </div>
                  </div>
                </div>

                {/* Landing Page Besuche */}
                <div className="stat-card">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">Landing Page Besuche</p>
                      <p className="text-3xl font-bold text-foreground">{leadStats.pageViews}</p>
                    </div>
                    <div className="icon-glow icon-glow-cyan">
                      <Eye className="w-5 h-5" />
                    </div>
                  </div>
                </div>

                {/* Heiße Leads - Highlighted */}
                <div className="stat-card stat-card-hot">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs text-orange-400/80 mb-2">Heiße Leads aktiv</p>
                      <p className="text-3xl font-bold text-orange-400">{leadStats.hotLeads}</p>
                    </div>
                    <div className="icon-glow icon-glow-orange animate-subtle-pulse">
                      <Flame className="w-5 h-5" />
                    </div>
                  </div>
                </div>

                {/* Termine gebucht */}
                <div className="stat-card">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">Termine gebucht</p>
                      <p className="text-3xl font-bold text-foreground">{leadStats.bookings}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">letzte 30 Tage</p>
                    </div>
                    <div className="icon-glow icon-glow-blue">
                      <Calendar className="w-5 h-5" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Engagement Feed */}
            <div className="lg:col-span-3">
              <div className="glass-card p-6 h-full">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">Engagement Feed</h2>
                    <p className="text-sm text-muted-foreground">Neueste Aktivitäten Ihrer Leads</p>
                  </div>
                </div>

                <div className="space-y-1">
                  {events.length === 0 ? (
                    <p className="text-muted-foreground text-sm text-center py-8">
                      Noch keine Aktivitäten
                    </p>
                  ) : (
                    events.map((event) => (
                      <div key={event.id} className="activity-item">
                        <div className={`activity-icon ${getIconBgColor(event.event_type)}`}>
                          {getEventIcon(event.event_type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground">
                            {event.contact
                              ? `${event.contact.first_name} ${event.contact.last_name}`
                              : "Unbekannter Besucher"}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {event.contact?.company || "Unbekanntes Unternehmen"}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-xs text-foreground/80">{getEventLabel(event)}</p>
                          <p className="text-[10px] text-muted-foreground">
                            vor {formatDistanceToNow(new Date(event.created_at), {
                              locale: de,
                            })}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {events.length > 0 && (
                  <div className="mt-6 pt-4 border-t border-border/50">
                    <Button 
                      variant="ghost" 
                      className="w-full text-muted-foreground hover:text-foreground hover:bg-white/5"
                    >
                      Mehr anzeigen
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
