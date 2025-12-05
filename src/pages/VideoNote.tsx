import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface ContactData {
  id: string;
  first_name: string;
  last_name: string;
  video_url: string | null;
  company: string | null;
}

const VideoNote = () => {
  const { slug } = useParams<{ slug: string }>();
  const [contact, setContact] = useState<ContactData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (slug) {
      loadContactAndTrackView();
    }
  }, [slug]);

  const loadContactAndTrackView = async () => {
    try {
      // Load contact by slug
      const { data, error: fetchError } = await supabase
        .from('contacts')
        .select('id, first_name, last_name, video_url, company')
        .eq('slug', slug)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (!data) {
        setError("Video nicht gefunden");
        setLoading(false);
        return;
      }

      setContact(data);

      // Track view via edge function
      try {
        await supabase.functions.invoke('track-video-view', {
          body: { slug }
        });
      } catch (trackError) {
        console.error('Tracking error:', trackError);
      }

    } catch (err) {
      console.error('Error loading video:', err);
      setError("Fehler beim Laden");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Lädt...</div>
      </div>
    );
  }

  if (error || !contact) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            {error || "Video nicht gefunden"}
          </h1>
          <p className="text-muted-foreground">
            Dieser Link ist ungültig oder abgelaufen.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* Greeting */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Hey {contact.first_name}, ich habe dir eine kurze Videonotiz aufgenommen.
          </h1>
          {contact.company && (
            <p className="text-muted-foreground">
              Speziell für dich bei {contact.company}
            </p>
          )}
        </div>

        {/* Video Player */}
        {contact.video_url ? (
          <div className="rounded-xl overflow-hidden shadow-2xl bg-card border">
            <video
              src={contact.video_url}
              controls
              autoPlay
              playsInline
              className="w-full aspect-video"
            >
              Dein Browser unterstützt keine Videos.
            </video>
          </div>
        ) : (
          <div className="rounded-xl bg-muted flex items-center justify-center aspect-video">
            <p className="text-muted-foreground">Kein Video verfügbar</p>
          </div>
        )}

        {/* Optional additional content section */}
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            Bei Fragen kannst du direkt auf diese Nachricht antworten.
          </p>
        </div>
      </div>
    </div>
  );
};

export default VideoNote;