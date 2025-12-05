import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Play } from "lucide-react";

interface ContactData {
  id: string;
  first_name: string;
  last_name: string;
  video_url: string | null;
  company: string | null;
  email: string | null;
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
      const { data, error: fetchError } = await supabase
        .from('contacts')
        .select('id, first_name, last_name, video_url, company, email')
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
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center" style={{ fontFamily: "'Inter', sans-serif" }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-[#111] border-t-transparent rounded-full animate-spin" />
          <p className="text-[#666] text-sm font-medium tracking-wide">Wird geladen...</p>
        </div>
      </div>
    );
  }

  if (error || !contact) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center px-6" style={{ fontFamily: "'Inter', sans-serif" }}>
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-[#f0f0f0] rounded-full flex items-center justify-center mx-auto mb-6">
            <Play className="w-8 h-8 text-[#999]" />
          </div>
          <h1 className="text-2xl font-semibold text-[#111] mb-3">
            {error || "Video nicht gefunden"}
          </h1>
          <p className="text-[#666] leading-relaxed">
            Dieser Link ist leider ungültig oder abgelaufen. Bitte kontaktiere den Absender für einen neuen Link.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa]" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Main Content */}
      <div className="max-w-[700px] mx-auto px-6 py-16 md:py-24">
        
        {/* Header Section */}
        <header className="text-center mb-12">
          <h1 className="text-[28px] md:text-[36px] font-semibold text-[#111] leading-tight mb-4 tracking-tight">
            Hey {contact.first_name}, ich habe dir eine persönliche Videonotiz aufgenommen.
          </h1>
          <p className="text-[#666] text-lg font-normal">
            Schau dir das kurze Video unten an.
          </p>
        </header>

        {/* Video Card */}
        <div className="bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.08)] overflow-hidden mb-10">
          {contact.video_url ? (
            <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
              <video
                src={contact.video_url}
                controls
                autoPlay
                playsInline
                className="absolute inset-0 w-full h-full object-cover"
              >
                Dein Browser unterstützt keine Videos.
              </video>
            </div>
          ) : (
            <div 
              className="relative w-full bg-gradient-to-br from-[#f5f5f5] to-[#e8e8e8] flex items-center justify-center"
              style={{ paddingBottom: '56.25%' }}
            >
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg mb-4">
                  <Play className="w-10 h-10 text-[#111] ml-1" />
                </div>
                <p className="text-[#999] text-sm">Video wird vorbereitet...</p>
              </div>
            </div>
          )}
        </div>

        {/* CTA Section */}
        <div className="text-center space-y-6">
          <p className="text-[#444] text-lg leading-relaxed">
            Wenn das für euch spannend klingt, sag kurz Bescheid.
          </p>
          
          {/* Reply Button */}
          <a
            href={`mailto:${contact.email || ''}?subject=Re: Videonotiz für ${contact.first_name}`}
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#111] text-white font-medium rounded-full hover:bg-[#333] transition-all duration-200 shadow-[0_2px_12px_rgba(0,0,0,0.15)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.2)] hover:-translate-y-0.5"
          >
            <Mail className="w-5 h-5" />
            Antwort schreiben
          </a>
        </div>

        {/* Footer */}
        <footer className="mt-20 pt-8 border-t border-[#eee] text-center">
          <p className="text-[#aaa] text-sm">
            Persönlich erstellt für {contact.first_name} {contact.last_name}
            {contact.company && <span> bei {contact.company}</span>}
          </p>
        </footer>
      </div>

      {/* Hidden Tracking Area - For future tracking code */}
      <div id="tracking-container" className="hidden" aria-hidden="true">
        {/* Custom tracking scripts can be added here */}
      </div>
    </div>
  );
};

export default VideoNote;