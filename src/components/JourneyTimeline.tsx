import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Eye, Play, MousePointer, Clock, ScrollText, FormInput, Calendar, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";

interface TrackingEvent {
  id: string;
  event_type: string;
  event_data: any;
  created_at: string;
  page_url: string | null;
}

interface JourneyTimelineProps {
  contactId: string;
}

const JourneyTimeline = ({ contactId }: JourneyTimelineProps) => {
  const [events, setEvents] = useState<TrackingEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (contactId) {
      fetchEvents();

      // Subscribe to new events for this contact in real-time
      const channel = supabase
        .channel(`journey-realtime-${contactId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "lead_tracking_events",
            filter: `contact_id=eq.${contactId}`,
          },
          (payload) => {
            console.log("New tracking event received:", payload.new);
            setEvents((prev) => [payload.new as TrackingEvent, ...prev]);
          }
        )
        .subscribe((status) => {
          console.log("Realtime subscription status:", status);
        });

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [contactId]);

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from("lead_tracking_events")
        .select("id, event_type, event_data, created_at, page_url")
        .eq("contact_id", contactId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error("Error fetching journey events:", error);
    } finally {
      setLoading(false);
    }
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case "page_view":
        return <Eye className="w-4 h-4" />;
      case "video_play":
      case "video_progress":
      case "video_complete":
        return <Play className="w-4 h-4" />;
      case "button_click":
      case "cta_click":
        return <MousePointer className="w-4 h-4" />;
      case "booking_click":
        return <Calendar className="w-4 h-4" />;
      case "scroll_depth":
        return <ScrollText className="w-4 h-4" />;
      case "time_on_page":
        return <Clock className="w-4 h-4" />;
      case "form_submit":
        return <FormInput className="w-4 h-4" />;
      default:
        return <CheckCircle className="w-4 h-4" />;
    }
  };

  const getEventColor = (eventType: string) => {
    switch (eventType) {
      case "page_view":
        return "bg-blue-500";
      case "video_play":
      case "video_progress":
        return "bg-purple-500";
      case "video_complete":
        return "bg-green-500";
      case "button_click":
      case "cta_click":
        return "bg-amber-500";
      case "booking_click":
        return "bg-emerald-500";
      case "scroll_depth":
        return "bg-indigo-500";
      case "time_on_page":
        return "bg-cyan-500";
      case "form_submit":
        return "bg-pink-500";
      default:
        return "bg-muted-foreground";
    }
  };

  const getEventTitle = (event: TrackingEvent) => {
    const data = event.event_data || {};
    switch (event.event_type) {
      case "page_view":
        return "Landing Page besucht";
      case "video_play":
        return "Video gestartet";
      case "video_progress":
        return `Video ${data.progress || 0}% angesehen`;
      case "video_complete":
        return "Video vollständig angesehen";
      case "button_click":
        return data.button_text ? `"${data.button_text}" geklickt` : "Button geklickt";
      case "cta_click":
        return "CTA-Button geklickt";
      case "booking_click":
        return "Booking-Seite geöffnet";
      case "scroll_depth":
        return `Seite zu ${data.depth || 0}% gescrollt`;
      case "time_on_page":
        const minutes = Math.floor((data.seconds || 0) / 60);
        const seconds = (data.seconds || 0) % 60;
        return `${minutes}:${seconds.toString().padStart(2, "0")} Min. auf Seite verbracht`;
      case "form_submit":
        return "Formular abgeschickt";
      default:
        return event.event_type;
    }
  };

  const getEventBadge = (eventType: string) => {
    const isHighValue = ["video_complete", "booking_click", "cta_click", "form_submit"].includes(eventType);
    if (isHighValue) {
      return (
        <Badge variant="default" className="text-xs bg-green-500/20 text-green-400 border-green-500/30">
          Hot
        </Badge>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse flex gap-3">
            <div className="w-3 h-3 bg-muted rounded-full mt-1" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        <Eye className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Noch keine Aktivitäten erfasst</p>
        <p className="text-xs mt-1">
          Events werden aufgezeichnet, sobald der Lead die personalisierte Seite besucht.
        </p>
      </div>
    );
  }

  return (
    <div className="relative">
      <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
        Journey Timeline
        <Badge variant="secondary" className="text-xs">
          {events.length} Events
        </Badge>
      </h3>
      
      <div className="space-y-4">
        {events.map((event, index) => (
          <div key={event.id} className="relative flex gap-3">
            {/* Timeline line */}
            {index < events.length - 1 && (
              <div className="absolute left-[5px] top-6 w-0.5 h-full bg-border" />
            )}
            
            {/* Icon */}
            <div
              className={`w-3 h-3 rounded-full ${getEventColor(event.event_type)} flex items-center justify-center flex-shrink-0 mt-1 ring-2 ring-background`}
            />
            
            {/* Content */}
            <div className="flex-1 min-w-0 pb-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">
                    {getEventIcon(event.event_type)}
                  </span>
                  <span className="text-sm font-medium">{getEventTitle(event)}</span>
                  {getEventBadge(event.event_type)}
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {format(new Date(event.created_at), "dd.MM.yyyy, HH:mm", { locale: de })} Uhr
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default JourneyTimeline;
