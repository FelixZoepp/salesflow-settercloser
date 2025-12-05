import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Play, ThumbsDown, ThumbsUp, Check, X, Calendar, MessageSquare, Users, Target, TrendingUp, Zap, ChevronDown, Pen, Megaphone } from "lucide-react";
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
  video_url: string | null;
  company: string | null;
  email: string | null;
}

const VideoNote = () => {
  const { slug } = useParams<{ slug: string }>();
  const [contact, setContact] = useState<ContactData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  useEffect(() => {
    if (slug) {
      loadContactAndTrackView();
    }
  }, [slug]);

  const loadContactAndTrackView = async () => {
    try {
      const { data, error: fetchError } = await (supabase
        .rpc as any)('get_contact_by_slug', { contact_slug: slug });

      if (fetchError) throw fetchError;

      if (!data || data.length === 0) {
        setError("Video nicht gefunden");
        setLoading(false);
        return;
      }

      const contactData = data[0];
      setContact(contactData);

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

  const handlePlayVideo = () => {
    setIsVideoPlaying(true);
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

  const companyName = contact.company || "euer Unternehmen";

  return (
    <div className="min-h-screen bg-[#0f172a]" style={{ fontFamily: "'Inter', sans-serif" }}>
      
      {/* Header */}
      <header className="border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="text-xl font-bold text-white">
            <span className="text-cyan-400">LinkedIn</span>Growth
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm text-slate-300">
            <a href="#vorteile" className="hover:text-white transition-colors">Warum wir?</a>
            <a href="#ansatz" className="hover:text-white transition-colors">Unser Ansatz</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
          </nav>
          <a 
            href={`mailto:${contact.email || ''}?subject=Termin vereinbaren - ${contact.first_name}`}
            className="bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-semibold px-5 py-2.5 rounded-lg transition-all text-sm"
          >
            Lass uns sprechen {contact.first_name}!
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
                href={`mailto:${contact.email || ''}?subject=Gratis Termin - ${contact.first_name}`}
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
                {contact.video_url ? (
                  <>
                    {!isVideoPlaying ? (
                      <div 
                        className="relative cursor-pointer group"
                        onClick={handlePlayVideo}
                      >
                        <video
                          src={contact.video_url}
                          className="w-full aspect-video object-cover"
                          muted
                        />
                        <div className="absolute inset-0 bg-black/50 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                          <button className="bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-semibold px-10 py-5 rounded-full flex items-center gap-4 transition-all transform group-hover:scale-105 shadow-xl shadow-cyan-500/40 text-lg">
                            <Play className="w-7 h-7 fill-current" />
                            Jetzt ansehen
                          </button>
                        </div>
                      </div>
                    ) : (
                      <video
                        src={contact.video_url}
                        controls
                        autoPlay
                        playsInline
                        className="w-full aspect-video"
                      />
                    )}
                  </>
                ) : (
                  <div className="aspect-video bg-slate-800 flex items-center justify-center">
                    <div className="text-center">
                      <Play className="w-20 h-20 text-slate-600 mx-auto mb-4" />
                      <p className="text-slate-500 text-lg">Video wird vorbereitet...</p>
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

      {/* Services Section */}
      <section id="vorteile" className="py-20 bg-slate-900/50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Unsere zwei Säulen für deinen LinkedIn-Erfolg
            </h2>
            <p className="text-slate-400 text-lg">
              Personalisierter Outreach + hochwertiger Content = maximale Reichweite für <span className="text-cyan-400">{companyName}</span>
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Outreach */}
            <div className="bg-gradient-to-br from-cyan-500/10 to-slate-800/50 rounded-2xl p-8 border border-cyan-500/30">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center">
                  <Megaphone className="w-6 h-6 text-cyan-400" />
                </div>
                <h3 className="text-xl font-bold text-white">Personalisierte Outreach-Kampagnen</h3>
              </div>
              <p className="text-slate-400 mb-6">Wir entwickeln maßgeschneiderte Kampagnen, die direkt bei deiner Zielgruppe ankommen.</p>
              <ul className="space-y-4">
                {[
                  "Hyperpersonalisierte Nachrichten für jeden Lead",
                  "Direkte Terminbuchungen durch warme Kontakte",
                  "Datengetriebene Zielgruppenansprache",
                  "A/B-Tests für maximale Conversion",
                  "Vollständig Done-for-You Service"
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
                <h3 className="text-xl font-bold text-white">LinkedIn Content-Strategie</h3>
              </div>
              <p className="text-slate-400 mb-6">Hochwertiger Content, der deine Expertise zeigt und organisch Leads anzieht.</p>
              <ul className="space-y-4">
                {[
                  "Professionelle Ghostwriting-Posts",
                  "Thought Leadership Content",
                  "Regelmäßige Posting-Frequenz",
                  "Engagement & Community Building",
                  "Branding & Sichtbarkeit steigern"
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
              Während unser Outreach aktiv Termine generiert, baut dein Content gleichzeitig Vertrauen und Autorität auf. 
              Leads, die dich kontaktieren, kennen dich bereits – das macht jeden Termin wertvoller.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            {contact.first_name}, bereit für qualifizierte Leads?
          </h2>
          <p className="text-slate-400 text-lg mb-8">
            Starte mit einem kostenlosen Erstgespräch.<br />
            Kein langfristiges Commitment für {companyName}!
          </p>
          
          <div className="inline-flex flex-col items-center gap-4">
            <p className="text-slate-300 font-medium">{contact.first_name} {contact.last_name}</p>
            <a 
              href={`mailto:${contact.email || ''}?subject=Termin sichern - ${contact.first_name}`}
              className="inline-flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-semibold px-10 py-4 rounded-lg transition-all text-lg shadow-lg shadow-cyan-500/25"
            >
              <Calendar className="w-5 h-5" />
              Jetzt Termin sichern!
            </a>
            <span className="text-slate-500 text-sm">Kostenlos & unverbindlich</span>
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section id="ansatz" className="py-20 bg-slate-900/50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              So profitiert {companyName}!
            </h2>
            <p className="text-slate-400 text-lg">
              Unser Ansatz in 4 Schritten für maximale LinkedIn-Resultate.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Target,
                title: "Strategie & Analyse",
                desc: "Wir analysieren eure Zielgruppe und entwickeln die perfekte Strategie."
              },
              {
                icon: Pen,
                title: "Content Creation",
                desc: "Professioneller Content, der deine Expertise sichtbar macht."
              },
              {
                icon: Megaphone,
                title: "Outreach-Kampagnen",
                desc: "Personalisierte Nachrichten, die Termine generieren."
              },
              {
                icon: TrendingUp,
                title: "Skalierung",
                desc: "Kontinuierliche Optimierung für mehr Wachstum."
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
                Wie funktioniert der Outreach genau?
              </AccordionTrigger>
              <AccordionContent className="text-slate-400">
                Wir identifizieren deine idealen Kunden auf LinkedIn, entwickeln hyperpersonalisierte Nachrichten und führen die Kampagne komplett für dich durch. Du bekommst nur noch die qualifizierten Termine in deinen Kalender.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2" className="bg-slate-800/50 rounded-xl border border-slate-700 px-6">
              <AccordionTrigger className="text-white hover:text-cyan-400 text-left">
                Was ist im Content-Service enthalten?
              </AccordionTrigger>
              <AccordionContent className="text-slate-400">
                Unser Content-Team erstellt professionelle LinkedIn-Posts in deinem Namen (Ghostwriting). Wir kümmern uns um Themenrecherche, Texterstellung, Bildauswahl und Veröffentlichung – du musst nur noch die Resultate genießen.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3" className="bg-slate-800/50 rounded-xl border border-slate-700 px-6">
              <AccordionTrigger className="text-white hover:text-cyan-400 text-left">
                Brauche ich Outreach UND Content?
              </AccordionTrigger>
              <AccordionContent className="text-slate-400">
                Beide Services können einzeln gebucht werden. Die Kombination ist jedoch am effektivsten: Outreach generiert aktiv Termine, während Content langfristig Vertrauen aufbaut und passive Leads anzieht.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4" className="bg-slate-800/50 rounded-xl border border-slate-700 px-6">
              <AccordionTrigger className="text-white hover:text-cyan-400 text-left">
                Wie schnell sehe ich Ergebnisse?
              </AccordionTrigger>
              <AccordionContent className="text-slate-400">
                Outreach-Kampagnen generieren typischerweise innerhalb der ersten 2-4 Wochen die ersten Termine. Content braucht 2-3 Monate, um seine volle Wirkung zu entfalten – dafür ist der Effekt nachhaltiger.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5" className="bg-slate-800/50 rounded-xl border border-slate-700 px-6">
              <AccordionTrigger className="text-white hover:text-cyan-400 text-left">
                Gibt es eine Mindestlaufzeit?
              </AccordionTrigger>
              <AccordionContent className="text-slate-400">
                Wir empfehlen mindestens 3 Monate für optimale Ergebnisse, aber es gibt keine langfristige Bindung. Im kostenlosen Erstgespräch klären wir alle Details.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-6" className="bg-slate-800/50 rounded-xl border border-slate-700 px-6">
              <AccordionTrigger className="text-white hover:text-cyan-400 text-left">
                Wie läuft das Erstgespräch ab?
              </AccordionTrigger>
              <AccordionContent className="text-slate-400">
                Im 15-20 minütigen Gespräch analysieren wir gemeinsam deine aktuelle Situation, definieren deine Ziele und zeigen dir konkret, wie wir {companyName} unterstützen können. Komplett kostenlos und unverbindlich.
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
              Bereit, {contact.first_name}?
            </h2>
            <p className="text-slate-400 mb-8">
              Lass uns in einem kurzen Gespräch herausfinden, wie wir {companyName} mit Outreach & Content unterstützen können.
            </p>
            <a 
              href={`mailto:${contact.email || ''}?subject=Lass uns sprechen - ${contact.first_name}`}
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
          <p>Persönlich erstellt für {contact.first_name} {contact.last_name}{contact.company && ` bei ${contact.company}`}</p>
        </div>
      </footer>

      {/* Hidden Tracking Area */}
      <div id="tracking-container" className="hidden" aria-hidden="true" />
    </div>
  );
};

export default VideoNote;
