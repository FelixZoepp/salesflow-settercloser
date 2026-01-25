import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { initializeTracking, attachVideoTracking } from "@/lib/leadTracker";
import { Play, ThumbsDown, ThumbsUp, Check, X, Calendar, MessageSquare, Users, Target, TrendingUp, Zap, ChevronDown, Pen, Megaphone, Star, CheckCircle, ExternalLink } from "lucide-react";
import linkedinPostImage from "@/assets/linkedin-post-screenshot.png";
import { useState as useStateLocal } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface ContactData {
  id: string;
  first_name: string;
  last_name: string;
  company: string | null;
  video_url: string | null;
  pitch_video_url: string | null;
}

// Helper to check if URL is YouTube
const isYouTubeUrl = (url: string): boolean => {
  return url.includes('youtube.com') || url.includes('youtu.be');
};

// Helper to extract YouTube video ID
const getYouTubeEmbedUrl = (url: string): string => {
  let videoId = '';
  
  if (url.includes('youtu.be/')) {
    videoId = url.split('youtu.be/')[1]?.split('?')[0] || '';
  } else if (url.includes('youtube.com/watch')) {
    const urlParams = new URLSearchParams(url.split('?')[1]);
    videoId = urlParams.get('v') || '';
  } else if (url.includes('youtube.com/embed/')) {
    videoId = url.split('embed/')[1]?.split('?')[0] || '';
  }
  
  return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
};

const VideoNote = () => {
  const { slug } = useParams<{ slug: string }>();
  const [contact, setContact] = useState<ContactData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [currentVideo, setCurrentVideo] = useState<'intro' | 'pitch'>('intro');
  const [pitchPreloaded, setPitchPreloaded] = useState(false);
  const introVideoRef = useRef<HTMLVideoElement | null>(null);
  const pitchVideoRef = useRef<HTMLVideoElement | null>(null);
  const videoTrackingCleanupRef = useRef<null | (() => void)>(null);

  useEffect(() => {
    if (slug) {
      loadContactAndTrackView();
    }
  }, [slug]);

  useEffect(() => {
    if (!slug || !contact) return;
    const cleanup = initializeTracking(slug);
    return () => cleanup();
  }, [slug, contact?.id]);

  // Preload pitch video when intro starts playing
  useEffect(() => {
    if (!isVideoPlaying || !contact?.pitch_video_url) return;
    if (isYouTubeUrl(contact.pitch_video_url)) return; // Can't preload YouTube
    
    // Create a hidden video element to preload
    const preloadVideo = document.createElement('video');
    preloadVideo.src = contact.pitch_video_url;
    preloadVideo.preload = 'auto';
    preloadVideo.muted = true;
    preloadVideo.load();
    
    preloadVideo.oncanplaythrough = () => {
      setPitchPreloaded(true);
    };
    
    return () => {
      preloadVideo.src = '';
    };
  }, [isVideoPlaying, contact?.pitch_video_url]);

  useEffect(() => {
    if (!slug || !contact?.video_url) return;
    const currentRef = currentVideo === 'intro' ? introVideoRef.current : pitchVideoRef.current;
    if (!currentRef) return;

    // Re-attach when the video element changes (preview vs. playing)
    videoTrackingCleanupRef.current?.();
    videoTrackingCleanupRef.current = attachVideoTracking(slug, currentRef);

    return () => {
      videoTrackingCleanupRef.current?.();
      videoTrackingCleanupRef.current = null;
    };
  }, [slug, contact?.video_url, isVideoPlaying, currentVideo]);

  const loadContactAndTrackView = async () => {
    console.log('Loading contact for slug:', slug);
    
    try {
      // Use the secure get_contact_by_slug function (returns minimal data only)
      const { data: contactResult, error: contactError } = await supabase
        .rpc('get_contact_by_slug', { contact_slug: slug });

      console.log('RPC result:', { contactResult, contactError });

      if (contactError) {
        console.error('RPC error:', contactError);
        throw contactError;
      }

      // The function returns an array, get first result
      const contactData = Array.isArray(contactResult) ? contactResult[0] : contactResult;

      if (!contactData) {
        console.log('No contact found for slug:', slug);
        setError("Video nicht gefunden");
        setLoading(false);
        return;
      }

      console.log('Contact loaded:', contactData);
      setContact(contactData);

      // NOTE: Page view is tracked via initializeTracking (leadTracker)
      // Video view is tracked separately when user clicks play button

    } catch (err) {
      console.error('Error loading video:', err);
      setError("Fehler beim Laden");
    } finally {
      setLoading(false);
    }
  };

  const handlePlayVideo = () => {
    setIsVideoPlaying(true);
    // If no intro video exists, jump directly to pitch
    setCurrentVideo(contact?.video_url ? 'intro' : 'pitch');
    
    // Track video view only when user actively clicks to play
    if (slug) {
      supabase.functions.invoke('track-video-view', {
        body: { slug }
      }).catch((trackError) => {
        console.error('Video view tracking error:', trackError);
      });
    }
  };

  const handleVideoEnded = () => {
    // When intro video ends, play the pitch video if available
    if (currentVideo === 'intro' && contact?.pitch_video_url) {
      setCurrentVideo('pitch');
    }
  };

  const scrollToVideo = () => {
    document.getElementById('video-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-sm font-medium">Wird geladen...</p>
        </div>
      </div>
    );
  }

  if (error || !contact) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
            <Play className="w-10 h-10 text-slate-500" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">
            {error || "Video nicht gefunden"}
          </h1>
          <p className="text-slate-400 leading-relaxed">
            Dieser Link ist leider ungültig oder abgelaufen.
          </p>
        </div>
      </div>
    );
  }

  const companyName = contact?.company || "dein Unternehmen";

  return (
    <div className="min-h-screen bg-[#0f172a]" style={{ fontFamily: "'Inter', sans-serif" }}>
      
      {/* Header */}
      <header className="border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="text-xl font-bold text-white">
            <span className="text-cyan-400">Content</span>-Leads
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm text-slate-300">
            <a href="#vorteile" className="hover:text-white transition-colors">Warum wir?</a>
            <a href="#ansatz" className="hover:text-white transition-colors">Unser Ansatz</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
          </nav>
          <a 
            href="https://calendly.com/zoepp-media/vorbereitungsgesprach-mit-felix-zoepp-klon"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-semibold px-5 py-2.5 rounded-lg transition-all text-sm"
          >
            {contact.first_name}, lass uns sprechen!
          </a>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 md:py-32">
        <div className="max-w-7xl mx-auto px-8 lg:px-16">
          <div className="grid md:grid-cols-2 gap-16 lg:gap-24 items-center">
            
            {/* Left Content */}
            <div className="space-y-8">
              <h1 className="text-4xl md:text-5xl lg:text-[3.5rem] font-bold text-white leading-[1.1]">
                Hey {contact.first_name}, sieh dir das 2-minütige Video an
              </h1>
              <p className="text-lg md:text-xl text-slate-300 leading-relaxed">
                … und erfahre, wie <span className="text-cyan-400 font-semibold">{companyName}</span> mit personalisierten Outreach-Kampagnen und starkem Content qualifizierte Leads generiert.
              </p>
              <a 
                href="https://calendly.com/zoepp-media/vorbereitungsgesprach-mit-felix-zoepp-klon"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-semibold px-10 py-5 rounded-xl transition-all text-lg shadow-lg shadow-cyan-500/25"
              >
                <Calendar className="w-5 h-5" />
                Gratis Termin vereinbaren
              </a>
            </div>

            {/* Right - Video */}
            <div id="video-section" className="relative">
              {/* Pointing Hand */}
              <div className="absolute -top-12 right-1/4 text-6xl animate-bounce z-10">
                👇
              </div>
              
              <div className="relative rounded-xl overflow-hidden shadow-2xl shadow-cyan-500/20 border border-slate-600/50 bg-slate-800">
                {contact.video_url || contact.pitch_video_url ? (
                  <>
                    {!isVideoPlaying ? (
                      <div 
                        className="relative cursor-pointer group"
                        onClick={handlePlayVideo}
                      >
                      {contact.video_url ? (
                        <video
                          ref={introVideoRef}
                          src={contact.video_url}
                          className="w-full aspect-video object-cover"
                          muted
                        />
                      ) : contact.pitch_video_url && isYouTubeUrl(contact.pitch_video_url) ? (
                        <div className="w-full aspect-video bg-slate-900 flex items-center justify-center">
                          <img 
                            src={`https://img.youtube.com/vi/${contact.pitch_video_url.includes('youtu.be/') ? contact.pitch_video_url.split('youtu.be/')[1]?.split('?')[0] : new URLSearchParams(contact.pitch_video_url.split('?')[1]).get('v')}/maxresdefault.jpg`}
                            alt="Video thumbnail"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <video
                          src={contact.pitch_video_url!}
                          className="w-full aspect-video object-cover"
                          muted
                        />
                      )}
                      <div className="absolute inset-0 bg-black/50 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                        <button className="bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-semibold px-10 py-5 rounded-full flex items-center gap-4 transition-all transform group-hover:scale-105 shadow-xl shadow-cyan-500/40 text-lg">
                          <Play className="w-7 h-7 fill-current" />
                          Jetzt ansehen
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="relative">
                      {/* Intro video - only if it exists */}
                      {contact.video_url && (
                        <video
                          ref={introVideoRef}
                          key="intro"
                          src={contact.video_url}
                          controls
                          autoPlay={currentVideo === 'intro'}
                          playsInline
                          className={`w-full aspect-video ${currentVideo === 'pitch' ? 'hidden' : ''}`}
                          onEnded={handleVideoEnded}
                        />
                      )}
                      
                      {/* MP4 Pitch video - preload and show after intro */}
                      {contact.pitch_video_url && !isYouTubeUrl(contact.pitch_video_url) && (
                        <video
                          ref={pitchVideoRef}
                          key="pitch"
                          src={contact.pitch_video_url}
                          controls
                          autoPlay={currentVideo === 'pitch' || !contact.video_url}
                          playsInline
                          preload="auto"
                          className={`w-full aspect-video ${currentVideo === 'intro' && contact.video_url ? 'hidden' : ''}`}
                        />
                      )}
                      
                      {/* YouTube pitch - render early but hide during intro to enable autoplay */}
                      {contact.pitch_video_url && isYouTubeUrl(contact.pitch_video_url) && isVideoPlaying && (
                        <div className={currentVideo === 'intro' && contact.video_url ? 'hidden' : ''}>
                          <iframe
                            src={getYouTubeEmbedUrl(contact.pitch_video_url)}
                            className="w-full aspect-video"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            title="Pitch Video"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="aspect-video bg-slate-800 flex items-center justify-center">
                  <div className="text-center px-6">
                    <Play className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400 text-lg font-medium mb-2">Video wird vorbereitet...</p>
                    <p className="text-slate-500 text-sm max-w-md">
                      Um das personalisierte Video zu sehen, muss eine aktive Kampagne mit Pitch-Video existieren und das Intro-Video generiert worden sein.
                    </p>
                  </div>
                </div>
              )}
            </div>
            
            <p className="text-center text-slate-400 mt-6 text-base">
              Nur für dich {contact.first_name}, nimm dir die 2 Minuten und schau kurz rein!!
            </p>
            </div>
          </div>
        </div>
      </section>

      {/* Coaching Section */}
      <section id="vorteile" className="py-20 bg-slate-900/50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-1.5 bg-cyan-500/20 text-cyan-400 rounded-full text-sm font-medium mb-4">
              Exklusives Coaching-Programm
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Die zwei Säulen für deinen LinkedIn-Erfolg
            </h2>
            <p className="text-slate-400 text-lg">
              Lerne, wie du mit Outreach Umsatz generierst und mit Content Anfragen bekommst – für <span className="text-cyan-400">{companyName}</span>
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Outreach */}
            <div className="bg-gradient-to-br from-cyan-500/10 to-slate-800/50 rounded-2xl p-8 border border-cyan-500/30">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center">
                  <Megaphone className="w-6 h-6 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Säule 1: Outreach</h3>
                  <p className="text-cyan-400 text-sm">= Umsatz generieren</p>
                </div>
              </div>
              <p className="text-slate-400 mb-6">Wir zeigen dir, wie du personalisierte Kampagnen erstellst, die direkt bei deiner Zielgruppe ankommen.</p>
              <ul className="space-y-4">
                {[
                  "Du lernst hyperpersonalisierte Nachrichten zu schreiben",
                  "Wie du direkte Terminbuchungen durch warme Kontakte bekommst",
                  "Datengetriebene Zielgruppenansprache verstehen",
                  "A/B-Tests für maximale Conversion durchführen",
                  "Schritt-für-Schritt Anleitungen zum Nachmachen"
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-slate-300">
                    <Check className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Content */}
            <div className="bg-gradient-to-br from-purple-500/10 to-slate-800/50 rounded-2xl p-8 border border-purple-500/30">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                  <Pen className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Säule 2: Inbound Content</h3>
                  <p className="text-purple-400 text-sm">= Anfragen generieren</p>
                </div>
              </div>
              <p className="text-slate-400 mb-6">Lerne, wie du hochwertigen Content erstellst, der deine Expertise zeigt und organisch Leads anzieht.</p>
              <ul className="space-y-4">
                {[
                  "So schreibst du Posts, die viral gehen",
                  "Thought Leadership aufbauen",
                  "Die richtige Posting-Frequenz finden",
                  "Community Building & Engagement-Strategien",
                  "Branding & Sichtbarkeit systematisch steigern"
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-slate-300">
                    <Check className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Combined Effect */}
          <div className="mt-12 bg-slate-800/50 rounded-2xl p-8 border border-slate-700 text-center">
            <h3 className="text-xl font-bold text-white mb-4">
              🚀 Outreach + Content = Maximale Wirkung
            </h3>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Im Coaching lernst du beide Strategien zu meistern. Während dein Outreach aktiv Termine generiert, 
              baut dein Content gleichzeitig Vertrauen und Autorität auf. Das Ergebnis: planbar mehr Umsatz und Anfragen.
            </p>
          </div>
        </div>
      </section>

      {/* #1 LinkedIn Beratung Section */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-amber-500/20 border border-amber-500/50 rounded-full px-6 py-2 mb-6">
              <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
              <span className="text-amber-300 font-semibold">#1 LinkedIn Beratung in der DACH-Region</span>
              <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Was uns von anderen unterscheidet
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              Keine leeren Versprechungen – wir liefern Ergebnisse mit Garantie.
            </p>
          </div>

          {/* Comparison Grid */}
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {/* Others */}
            <div className="bg-red-500/5 rounded-2xl p-8 border border-red-500/20">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
                  <X className="w-5 h-5 text-red-400" />
                </div>
                <h3 className="text-xl font-bold text-white">Andere Anbieter</h3>
              </div>
              <ul className="space-y-4">
                {[
                  "Erste Ergebnisse nach 3-6 Monaten",
                  "Keine Umsatzgarantie",
                  "Nur Theorie, keine Umsetzungsbegleitung",
                  "Standard-Inhalte für alle",
                  "Du bist nach dem Kurs auf dich allein gestellt"
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-slate-400">
                    <X className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Us */}
            <div className="bg-emerald-500/5 rounded-2xl p-8 border border-emerald-500/20">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="text-xl font-bold text-white">Unser Coaching bei Content-Leads</h3>
              </div>
              <ul className="space-y-4">
                {[
                  "Erste Anfragen bereits in 7 Tagen",
                  "Umsatzgarantie – wir verdoppeln dein Investment",
                  "Intensive 1:1 Betreuung bei der Umsetzung",
                  "Individuell auf deine Situation angepasst",
                  "Persönlicher Coach dauerhaft an deiner Seite"
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-slate-300">
                    <CheckCircle className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Stats */}
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700 text-center">
              <div className="text-4xl font-bold text-cyan-400 mb-2">7 Tage</div>
              <p className="text-slate-400">Erste qualifizierte Anfragen</p>
            </div>
            <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700 text-center">
              <div className="text-4xl font-bold text-emerald-400 mb-2">30 Tage</div>
              <p className="text-slate-400">Durchschnittlich erste Umsätze</p>
            </div>
            <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700 text-center">
              <div className="text-4xl font-bold text-amber-400 mb-2">100%</div>
              <p className="text-slate-400">Umsatzgarantie</p>
            </div>
          </div>

          {/* Guarantee Badge */}
          <div className="mt-12 bg-gradient-to-r from-emerald-500/10 via-cyan-500/10 to-emerald-500/10 rounded-2xl p-8 border border-emerald-500/30 text-center">
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-emerald-400" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">Unsere Umsatzgarantie</h3>
            <p className="text-slate-300 max-w-2xl mx-auto">
              Wir sind so überzeugt von unserer Coaching-Methode, dass wir dir eine echte Umsatzgarantie geben. 
              Erreichst du keine Ergebnisse in der vereinbarten Zeit, arbeiten wir kostenlos weiter – solange, bis wir dein Investment verdoppelt haben.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Bereit für qualifizierte Leads, {contact.first_name}?
          </h2>
          <p className="text-slate-400 text-lg mb-8">
            Starte mit einem kostenlosen Erstgespräch.<br />
            Kein langfristiges Commitment für {companyName}!
          </p>
          
          <div className="inline-flex flex-col items-center gap-4">
            <p className="text-slate-300 font-medium">{contact.first_name} {contact.last_name}</p>
            <a 
              href="https://calendly.com/zoepp-media/vorbereitungsgesprach-mit-felix-zoepp-klon"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-semibold px-10 py-4 rounded-lg transition-all text-lg shadow-lg shadow-cyan-500/25"
            >
              <Calendar className="w-5 h-5" />
              Jetzt Termin sichern!
            </a>
            <span className="text-slate-500 text-sm">Kostenlos & unverbindlich</span>
          </div>
        </div>
      </section>

      {/* Case Studies Section */}
      <section className="py-20 bg-slate-900/50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Das könnten deine Ergebnisse sein, {contact.first_name}
            </h2>
            <p className="text-slate-400 text-lg">
              Echte Kunden. Echte Resultate. Sieh selbst.
            </p>
          </div>

          <div className="space-y-8">
            {/* Case Study 1 - Daddel GmbH */}
            <div className="bg-slate-800/30 rounded-2xl overflow-hidden border border-slate-700/50 p-6 md:p-8">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                {/* Video */}
                <div className="aspect-video bg-slate-900 rounded-xl overflow-hidden">
                  <iframe
                    src="https://www.youtube.com/embed/evcR2kC6otA"
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
                
                {/* Content */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-2xl font-bold text-white">Daddel GmbH</h3>
                      <p className="text-slate-400 text-sm">Webseitenagentur</p>
                    </div>
                    <div className="flex gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-5 h-5 fill-emerald-400 text-emerald-400" />
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-4 mb-6">
                    <p className="text-slate-300">
                      <span className="text-emerald-400 font-semibold">Vorher:</span> „Wir hatten keinen planbaren Kanal, um Neukunden zu gewinnen. Jeden Monat war ungewiss, ob genug Umsatz reinkommt."
                    </p>
                    <p className="text-slate-300">
                      <span className="text-emerald-400 font-semibold">Nachher:</span> „Durch die Zusammenarbeit sind wir in nur 60 Tagen von 10.000€ auf über 20.000€ monatlich gewachsen – planbar und konstant."
                    </p>
                  </div>
                  
                  <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-4 py-3">
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                    <span className="text-white font-semibold">Von 10k auf 20k+ in 60 Tagen</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Case Study 2 - Teo Hentzschel */}
            <div className="bg-slate-800/30 rounded-2xl overflow-hidden border border-slate-700/50 p-6 md:p-8">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                {/* Content - Left side on this one */}
                <div className="order-2 md:order-1">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-2xl font-bold text-white">Teo Hentzschel</h3>
                      <p className="text-slate-400 text-sm">Webseitenagentur</p>
                    </div>
                    <div className="flex gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-5 h-5 fill-emerald-400 text-emerald-400" />
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-4 mb-6">
                    <p className="text-slate-300">
                      <span className="text-emerald-400 font-semibold">Vorher:</span> „Ich wusste nicht, wie ich über LinkedIn an Kunden komme. Alles fühlte sich nach Zufall an."
                    </p>
                    <p className="text-slate-300">
                      <span className="text-emerald-400 font-semibold">Nachher:</span> „Nach nur 3 Tagen habe ich über LinkedIn 10.000€ abgeschlossen. Die Strategie funktioniert einfach."
                    </p>
                  </div>
                  
                  <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-4 py-3">
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                    <span className="text-white font-semibold">10.000€ in 3 Tagen via LinkedIn</span>
                  </div>
                </div>
                
                {/* Video - Right side */}
                <div className="aspect-video bg-slate-900 rounded-xl overflow-hidden order-1 md:order-2">
                  <iframe
                    src="https://www.youtube.com/embed/fldoX_f864Y"
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            </div>

            {/* Case Study 3 - Hendrik Hoffmann */}
            <div className="bg-slate-800/30 rounded-2xl overflow-hidden border border-slate-700/50 p-6 md:p-8">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                {/* Video */}
                <div className="aspect-video bg-slate-900 rounded-xl overflow-hidden">
                  <iframe
                    src="https://www.youtube.com/embed/PXuqgYS5uiE"
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
                
                {/* Content */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-2xl font-bold text-white">Hendrik Hoffmann</h3>
                      <p className="text-slate-400 text-sm">Webseitenagentur</p>
                    </div>
                    <div className="flex gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-5 h-5 fill-emerald-400 text-emerald-400" />
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-4 mb-6">
                    <p className="text-slate-300">
                      <span className="text-emerald-400 font-semibold">Vorher:</span> „Ich hatte keine planbare Methode, um konstant Kunden zu gewinnen. Der Umsatz schwankte stark."
                    </p>
                    <p className="text-slate-300">
                      <span className="text-emerald-400 font-semibold">Nachher:</span> „Bereits in den ersten 30 Tagen hatte ich 5-stellig zusätzlichen Cashflow. Das System funktioniert."
                    </p>
                  </div>
                  
                  <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-4 py-3">
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                    <span className="text-white font-semibold">5-stellig Cashflow in 30 Tagen</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center mt-12">
            <a 
              href="https://calendly.com/zoepp-media/vorbereitungsgesprach-mit-felix-zoepp-klon"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-semibold px-10 py-4 rounded-lg transition-all text-lg shadow-lg shadow-cyan-500/25"
            >
              <Calendar className="w-5 h-5" />
              {contact.first_name}, das will ich auch!
            </a>
          </div>
        </div>
      </section>

      {/* Inbound Strategy Section */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-1.5 bg-purple-500/20 text-purple-400 rounded-full text-sm font-medium mb-4">
              Inbound Strategie
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Organische Reichweite durch LinkedIn-Content
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              Mit strategischem Content ziehen wir qualifizierte Leads direkt zu dir, {contact.first_name}.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 items-center">
            {/* Post Example - Clickable with Screenshot */}
            <a 
              href="https://www.linkedin.com/feed/update/urn:li:activity:7387459091897692160/"
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-slate-800/70 rounded-2xl overflow-hidden border border-slate-700 hover:border-purple-500/50 transition-all group cursor-pointer"
            >
              <img 
                src={linkedinPostImage} 
                alt="LinkedIn Post - Ich zahle meinem besten Vertriebler 0€" 
                className="w-full object-cover"
              />
              <div className="p-4 bg-slate-800/90">
                <div className="flex items-center justify-between text-slate-400 text-sm">
                  <span className="flex items-center gap-1">
                    <ThumbsUp className="w-4 h-4" /> 155+ Reaktionen
                  </span>
                  <span className="flex items-center gap-1 text-purple-400 font-semibold">
                    <MessageSquare className="w-4 h-4" /> 1.275 Kommentare
                  </span>
                </div>
                <div className="mt-3 text-xs text-slate-500 group-hover:text-purple-400 transition-colors flex items-center gap-1">
                  Auf LinkedIn ansehen <ExternalLink className="w-3 h-3" />
                </div>
              </div>
            </a>

            {/* Stats */}
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-white mb-6">
                Das Ergebnis dieses Posts:
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-800/50 rounded-xl p-6 text-center border border-purple-500/30">
                  <p className="text-3xl md:text-4xl font-bold text-purple-400">1.275</p>
                  <p className="text-slate-400 text-sm mt-1">Kommentare</p>
                </div>
                <div className="bg-slate-800/50 rounded-xl p-6 text-center border border-cyan-500/30">
                  <p className="text-3xl md:text-4xl font-bold text-cyan-400">300</p>
                  <p className="text-slate-400 text-sm mt-1">Leads generiert</p>
                </div>
              </div>
              <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl p-6 border border-green-500/30">
                <p className="text-2xl font-bold text-green-400 mb-1">5-stelliges Auftragsvolumen</p>
                <p className="text-slate-400 text-sm">generiert durch einen einzigen Post</p>
              </div>
              <p className="text-slate-400">
                Ein einziger Post kann Tausende erreichen und qualifizierte Leads generieren – 
                ohne einen Cent für Werbung auszugeben, {contact.first_name}.
              </p>
              <div className="bg-purple-500/10 rounded-xl p-4 border border-purple-500/30">
                <p className="text-purple-300 text-sm">
                  💡 <strong>Für {companyName}:</strong> Wir erstellen 3-4 Posts pro Woche, 
                  die deine Expertise zeigen und organisch Leads anziehen.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Outbound Strategy Section */}
      <section className="py-20 bg-slate-900/50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-1.5 bg-cyan-500/20 text-cyan-400 rounded-full text-sm font-medium mb-4">
              Outbound Strategie
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Personalisierte Video-Nachrichten wie diese hier
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              Im Coaching lernst du, wie du solche Seiten für deine Leads erstellst, {contact.first_name}.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 items-center">
            {/* Explanation */}
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-white">
                Das lernst du im Coaching:
              </h3>
              <div className="space-y-4">
                {[
                  {
                    step: "1",
                    title: "Zielgruppe definieren",
                    desc: "Du lernst, deine idealen Kunden auf LinkedIn zu identifizieren."
                  },
                  {
                    step: "2",
                    title: "Personalisierte Seite erstellen",
                    desc: "Wir zeigen dir, wie du solche Landingpages für jeden Lead erstellst."
                  },
                  {
                    step: "3",
                    title: "Video aufnehmen",
                    desc: "Du lernst, überzeugende persönliche Videos zu erstellen."
                  },
                  {
                    step: "4",
                    title: "Nachricht senden",
                    desc: "Wir zeigen dir die beste Strategie für maximale Antwortquoten."
                  }
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-cyan-500/20 rounded-full flex items-center justify-center text-cyan-400 font-bold flex-shrink-0">
                      {item.step}
                    </div>
                    <div>
                      <p className="text-white font-semibold">{item.title}</p>
                      <p className="text-slate-400 text-sm">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="bg-cyan-500/10 rounded-xl p-4 border border-cyan-500/30">
                <p className="text-cyan-300 text-sm">
                  🎯 <strong>Warum das funktioniert:</strong> 73% höhere Antwortrate als normale Nachrichten, 
                  weil der Lead sich persönlich angesprochen fühlt.
                </p>
              </div>
            </div>

            {/* Visual */}
            <div className="relative">
              <div className="bg-slate-800/70 rounded-2xl p-6 border border-cyan-500/30 shadow-lg shadow-cyan-500/10">
                <div className="aspect-video bg-slate-900 rounded-xl mb-4 flex items-center justify-center border border-slate-700">
                  <div className="text-center">
                    <Play className="w-16 h-16 text-cyan-400 mx-auto mb-2" />
                    <p className="text-slate-400 text-sm">Persönliches Video für</p>
                    <p className="text-white font-semibold">{contact.first_name} {contact.last_name}</p>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-slate-400">
                    <span>Personalisierte URL:</span>
                    <span className="text-cyan-400 font-mono">content-leads.de/p/{contact.first_name.toLowerCase()}-...</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Erstellt für:</span>
                    <span className="text-white">{contact.first_name} {contact.last_name}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Unternehmen:</span>
                    <span className="text-white">{companyName}</span>
                  </div>
                </div>
              </div>
              <div className="absolute -top-4 -right-4 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                LIVE BEISPIEL
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section id="ansatz" className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Das Coaching für {companyName}
            </h2>
            <p className="text-slate-400 text-lg">
              In 4 Phasen zum LinkedIn-Erfolg – du setzt alles selbst um, wir begleiten dich dabei.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Target,
                title: "Phase 1: Strategie",
                desc: "Du lernst, deine Zielgruppe zu analysieren und die perfekte Strategie zu entwickeln."
              },
              {
                icon: Pen,
                title: "Phase 2: Content lernen",
                desc: "Wir zeigen dir, wie du Content erstellst, der Anfragen bringt."
              },
              {
                icon: Megaphone,
                title: "Phase 3: Outreach meistern",
                desc: "Du lernst, personalisierte Nachrichten zu schreiben, die Umsatz generieren."
              },
              {
                icon: TrendingUp,
                title: "Phase 4: Skalieren",
                desc: "Du optimierst und skalierst deine Strategien eigenständig."
              }
            ].map((step, i) => (
              <div key={i} className="bg-slate-800/50 rounded-xl p-6 border border-slate-700 hover:border-cyan-500/50 transition-colors">
                <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center mb-4">
                  <step.icon className="w-6 h-6 text-cyan-400" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{step.title}</h3>
                <p className="text-slate-400 text-sm">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Häufige Fragen
            </h2>
            <p className="text-slate-400 text-lg">
              Alles, was du wissen musst, {contact.first_name}
            </p>
          </div>

          <Accordion type="single" collapsible className="space-y-4">
            <AccordionItem value="item-1" className="bg-slate-800/50 rounded-xl border border-slate-700 px-6">
              <AccordionTrigger className="text-white hover:text-cyan-400 text-left">
                Wie funktioniert das Coaching genau?
              </AccordionTrigger>
              <AccordionContent className="text-slate-400">
                Im Coaching lernst du Schritt für Schritt, wie du Outreach und Content-Strategien selbst umsetzt, {contact.first_name}. Du bekommst 1:1 Betreuung, Vorlagen, Anleitungen und persönliches Feedback zu deiner Umsetzung.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2" className="bg-slate-800/50 rounded-xl border border-slate-700 px-6">
              <AccordionTrigger className="text-white hover:text-cyan-400 text-left">
                Was lerne ich im Content-Bereich?
              </AccordionTrigger>
              <AccordionContent className="text-slate-400">
                Du lernst, wie du selbst professionelle LinkedIn-Posts schreibst, die viral gehen können, {contact.first_name}. Wir zeigen dir Themenrecherche, Post-Strukturen, Hook-Techniken und wie du kontinuierlich Content erstellst, der Anfragen generiert.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3" className="bg-slate-800/50 rounded-xl border border-slate-700 px-6">
              <AccordionTrigger className="text-white hover:text-cyan-400 text-left">
                Brauche ich beide Säulen?
              </AccordionTrigger>
              <AccordionContent className="text-slate-400">
                Beide Strategien ergänzen sich perfekt, {contact.first_name}. Outreach generiert aktiv Umsatz, während Content langfristig Anfragen bringt. Im Coaching lernst du beides zu meistern.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4" className="bg-slate-800/50 rounded-xl border border-slate-700 px-6">
              <AccordionTrigger className="text-white hover:text-cyan-400 text-left">
                Du fragst dich, wie schnell du Ergebnisse siehst, {contact.first_name}?
              </AccordionTrigger>
              <AccordionContent className="text-slate-400">
                Mit unseren Outreach-Strategien generierst du typischerweise innerhalb der ersten 1-2 Wochen die ersten Termine. Der Content braucht etwas länger, zeigt aber nach 4-8 Wochen erste Anfragen.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5" className="bg-slate-800/50 rounded-xl border border-slate-700 px-6">
              <AccordionTrigger className="text-white hover:text-cyan-400 text-left">
                Wie lange dauert das Coaching?
              </AccordionTrigger>
              <AccordionContent className="text-slate-400">
                Das Coaching ist auf 12 Wochen ausgelegt, damit du beide Säulen vollständig lernst und umsetzt, {contact.first_name}. Danach kannst du alles eigenständig weiterführen.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-6" className="bg-slate-800/50 rounded-xl border border-slate-700 px-6">
              <AccordionTrigger className="text-white hover:text-cyan-400 text-left">
                Wie läuft das Erstgespräch ab?
              </AccordionTrigger>
              <AccordionContent className="text-slate-400">
                Im 15-20 minütigen Gespräch analysieren wir gemeinsam deine aktuelle Situation, {contact.first_name}, definieren deine Ziele und zeigen dir, ob das Coaching für dich passt. Komplett kostenlos und unverbindlich.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <div className="bg-gradient-to-br from-cyan-500/20 to-slate-800 rounded-2xl p-10 border border-cyan-500/30">
            <Zap className="w-12 h-12 text-cyan-400 mx-auto mb-6" />
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
              Bist du bereit, {contact.first_name}?
            </h2>
            <p className="text-slate-400 mb-8">
              Lass uns in einem kurzen Gespräch herausfinden, wie wir {companyName} mit Outreach & Content unterstützen können.
            </p>
            <a 
              href="https://calendly.com/zoepp-media/vorbereitungsgesprach-mit-felix-zoepp-klon"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-semibold px-10 py-4 rounded-lg transition-all text-lg shadow-lg shadow-cyan-500/25"
            >
              Jetzt Gespräch vereinbaren
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-slate-800">
        <div className="max-w-6xl mx-auto px-6 text-center text-slate-500 text-sm">
          <p className="mb-4">Persönlich erstellt für {contact.first_name} {contact.last_name}</p>
          <div className="flex justify-center gap-6">
            <a 
              href="https://www.content-leads.de/impressum" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-cyan-400 transition-colors"
            >
              Impressum
            </a>
            <a 
              href="https://www.content-leads.de/datenschutz" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-cyan-400 transition-colors"
            >
              Datenschutzerklärung
            </a>
          </div>
        </div>
      </footer>

      {/* Hidden Tracking Area */}
      <div id="tracking-container" className="hidden" aria-hidden="true" />
    </div>
  );
};

export default VideoNote;
