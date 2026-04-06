import { useEffect, useState, useCallback } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Globe, Calendar, Play, ChevronDown } from "lucide-react";
import { Helmet } from "react-helmet";
import DOMPurify from "dompurify";

// Escape HTML entities to prevent XSS via URL params
function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

// ============================================================
// PUBLIC LANDING PAGE RENDERER
// Renders block-based slides with variable substitution
// ============================================================

interface Block {
  id: string;
  type: string;
  settings: Record<string, any>;
}

interface Slide {
  id: string;
  name: string;
  blocks: Block[];
}

interface PageSettings {
  name: string;
  slug: string;
  theme: number;
  accentOverride: string;
  maxWidth: number;
  blockGap: number;
  padding: number;
  metaTitle: string;
  metaDescription: string;
}

interface Theme {
  name: string;
  bg: string;
  accent: string;
  text: string;
}

// Helper: detect light theme and return theme-aware colors
function isLightBg(theme: Theme): boolean {
  const hex = theme.text.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.5;
}
function tc(theme: Theme) {
  const light = isLightBg(theme);
  const base = light ? "#000000" : "#ffffff";
  return { text: theme.text, muted: theme.text + "cc", subtle: theme.text + "88", faint: theme.text + "66", vfaint: theme.text + "55", ghost: theme.text + "44", cardBg: base + "08", cardBorder: base + "11", inputBg: base + "0a", inputBorder: base + "22", overlay: base + "06" };
}

const THEMES: Theme[] = [
  { name: "Dark Pro", bg: "linear-gradient(145deg, #0a0a0f 0%, #1a1a2e 50%, #16213e 100%)", accent: "#6C5CE7", text: "#ffffff" },
  { name: "Midnight Blue", bg: "linear-gradient(180deg, #0f0c29 0%, #302b63 50%, #24243e 100%)", accent: "#00d2ff", text: "#ffffff" },
  { name: "Clean White", bg: "linear-gradient(180deg, #ffffff 0%, #f8f9fa 100%)", accent: "#6C5CE7", text: "#1a1a2e" },
  { name: "Warm Coral", bg: "linear-gradient(145deg, #1a0a0a 0%, #2e1a1a 50%, #3e1616 100%)", accent: "#ff6b6b", text: "#ffffff" },
  { name: "Forest", bg: "linear-gradient(145deg, #0a1a0f 0%, #1a2e1a 50%, #163e16 100%)", accent: "#00b894", text: "#ffffff" },
  { name: "Sunset", bg: "linear-gradient(145deg, #1a0f1a 0%, #2e1a2e 50%, #3e163e 100%)", accent: "#fd79a8", text: "#ffffff" },
];

const PublicLandingPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const [slides, setSlides] = useState<Slide[]>([]);
  const [settings, setSettings] = useState<PageSettings | null>(null);
  const [activeSlideIdx, setActiveSlideIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pageData, setPageData] = useState<any>(null);
  const [calendarUrl, setCalendarUrl] = useState<string | null>(null);

  // Build variable map from URL params - HTML-escape all values to prevent XSS
  const safeParam = (key: string, ...alt: string[]) => {
    const val = searchParams.get(key) || alt.reduce((r, k) => r || searchParams.get(k) || "", "");
    return val ? escapeHtml(val) : "";
  };
  const variableMap: Record<string, string> = {
    "{{lead.firstName}}": safeParam("fn", "firstName"),
    "{{lead.lastName}}": safeParam("ln", "lastName"),
    "{{lead.company}}": safeParam("co", "company"),
    "{{lead.position}}": safeParam("pos", "position"),
    "{{lead.email}}": safeParam("email"),
    "{{lead.industry}}": safeParam("ind", "industry"),
    "{{lead.city}}": safeParam("city"),
    "{{lead.phone}}": safeParam("phone"),
    "{{lead.linkedinUrl}}": safeParam("li"),
    "{{lead.customField1}}": safeParam("cf1"),
    "{{lead.videoUrl}}": (() => { const v = searchParams.get("video") || searchParams.get("videoUrl") || ""; try { return v && new URL(v).protocol.startsWith("http") ? v : ""; } catch { return ""; } })(),
    "{{sender.name}}": safeParam("sn", "senderName"),
    "{{sender.company}}": safeParam("sc", "senderCompany"),
    "{{sender.calendarLink}}": (() => { const v = searchParams.get("cal") || searchParams.get("calendarLink") || ""; try { return v && new URL(v).protocol.startsWith("http") ? v : ""; } catch { return ""; } })(),
    "{{tracking.id}}": safeParam("tid"),
    "{{tracking.utm_source}}": safeParam("utm_source"),
    "{{tracking.utm_campaign}}": safeParam("utm_campaign"),
  };

  const replaceVars = useCallback((str: any): string => {
    if (typeof str !== "string") return str || "";
    let result = str;
    Object.entries(variableMap).forEach(([key, value]) => {
      if (value) result = result.split(key).join(value);
    });
    // Remove unreplaced variables
    result = result.replace(/\{\{[^}]+\}\}/g, "");
    // Sanitize HTML to prevent XSS - allow safe formatting tags only
    return DOMPurify.sanitize(result, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'br', 'span', 'p', 'u'],
      ALLOWED_ATTR: ['style'],
    });
  }, [variableMap]);

  useEffect(() => {
    loadPage();
  }, [slug]);

  // Heartbeat: update viewed_at every 10s so the app knows lead is currently online
  // Only update if contact belongs to the same account as the landing page
  useEffect(() => {
    const contactId = searchParams.get("cid");
    if (!contactId || !pageData?.account_id) return;

    const safeUpdate = (fields: Record<string, any>) => {
      supabase.from("contacts").update(fields)
        .eq("id", contactId)
        .eq("account_id", pageData.account_id) // Ensure same account
        .then(() => {});
    };

    safeUpdate({ viewed: true, viewed_at: new Date().toISOString() });

    const heartbeat = setInterval(() => {
      safeUpdate({ viewed_at: new Date().toISOString() });
    }, 10000);

    return () => clearInterval(heartbeat);
  }, [searchParams, pageData?.account_id]);

  const loadPage = async () => {
    if (!slug) { setError("Seite nicht gefunden"); setLoading(false); return; }

    try {
      const { data, error: fetchError } = await supabase
        .from("landing_pages")
        .select("*")
        .eq("slug", slug)
        .eq("status", "published")
        .single();

      if (fetchError || !data) { setError("Seite nicht gefunden"); setLoading(false); return; }

      setPageData(data);

      // Increment view count
      await supabase.from("landing_pages").update({ view_count: (data.view_count || 0) + 1 }).eq("id", data.id);

      // Track page view if contact_id is available
      const trackingId = searchParams.get("tid");
      const contactId = searchParams.get("cid");
      if (trackingId && data.account_id && contactId) {
        supabase.from("lead_tracking_events").insert({
          account_id: data.account_id,
          contact_id: contactId,
          event_type: "page_view",
          event_data: {
            page_id: data.id,
            slug: data.slug,
            tracking_id: trackingId,
            utm_source: searchParams.get("utm_source"),
            utm_campaign: searchParams.get("utm_campaign"),
            referrer: document.referrer,
          } as any,
        }).then(() => {});
      }

      // Fetch calendar URL
      let finalCalendarUrl = data.calendar_url;
      if (!finalCalendarUrl && data.user_id) {
        const { data: profile } = await supabase.from("profiles").select("calendar_url").eq("id", data.user_id).single();
        if (profile?.calendar_url) finalCalendarUrl = profile.calendar_url;
      }
      setCalendarUrl(finalCalendarUrl);

      // Parse content
      const content = data.content as any;

      if (content?.slides) {
        setSlides(content.slides);
        if (content.settings) setSettings(content.settings);
      } else if (Array.isArray(content)) {
        setSlides([{ id: "slide_1", name: "Main", blocks: content }]);
      } else if (content?.blocks) {
        setSlides([{ id: "slide_1", name: "Main", blocks: content.blocks }]);
      } else {
        setError("Seiteninhalt konnte nicht geladen werden");
      }
    } catch (err) {
      console.error("Error loading page:", err);
      setError("Fehler beim Laden der Seite");
    } finally {
      setLoading(false);
    }
  };

  const theme = settings
    ? { ...THEMES[settings.theme || 0], accent: settings.accentOverride || THEMES[settings.theme || 0].accent }
    : THEMES[0];

  const goToSlide = (idx: number) => {
    if (idx >= 0 && idx < slides.length) {
      setActiveSlideIdx(idx);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Handle quiz option clicks - advance to next slide
  const handleQuizSelect = (slideIdx: number) => {
    if (slideIdx < slides.length - 1) {
      setTimeout(() => goToSlide(slideIdx + 1), 300);
    }
  };

  // Handle form submit - track and advance
  const handleFormSubmit = async (e: React.FormEvent, fields: any[]) => {
    e.preventDefault();
    const formData: Record<string, string> = {};
    const form = e.target as HTMLFormElement;
    fields.forEach((f: any) => {
      const input = form.querySelector(`[name="${f.label}"]`) as HTMLInputElement;
      if (input) formData[f.label] = input.value;
    });

    // Track form submission if contact_id available
    const trackingId = searchParams.get("tid");
    const contactId = searchParams.get("cid");
    if (trackingId && pageData?.account_id && contactId) {
      await supabase.from("lead_tracking_events").insert({
        account_id: pageData.account_id,
        contact_id: contactId,
        event_type: "form_submit",
        event_data: { page_id: pageData.id, form_data: formData, tracking_id: trackingId } as any,
      });
    }

    // Advance to next slide
    if (activeSlideIdx < slides.length - 1) {
      goToSlide(activeSlideIdx + 1);
    }
  };

  // Track video play
  const handleVideoPlay = async () => {
    const trackingId = searchParams.get("tid");
    const contactId = searchParams.get("cid");
    if (trackingId && pageData?.account_id && contactId) {
      await supabase.from("lead_tracking_events").insert({
        account_id: pageData.account_id,
        contact_id: contactId,
        event_type: "video_play",
        event_data: { page_id: pageData.id, tracking_id: trackingId } as any,
      });
      // Also mark contact as viewed
      await supabase.from("contacts").update({
        viewed: true,
        viewed_at: new Date().toISOString(),
        view_count: (pageData.view_count || 0) + 1,
      }).eq("id", contactId);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0a0a0f" }}>
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  if (error || slides.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0a0a0f" }}>
        <div className="text-center">
          <Globe className="w-16 h-16 mx-auto mb-4 text-gray-500 opacity-50" />
          <h1 className="text-2xl font-bold mb-2 text-white">Seite nicht gefunden</h1>
          <p className="text-gray-400">Diese Landing Page existiert nicht oder wurde nicht veröffentlicht.</p>
        </div>
      </div>
    );
  }

  const activeSlide = slides[activeSlideIdx];
  const maxWidth = settings?.maxWidth || 480;
  const blockGap = settings?.blockGap || 20;
  const padding = settings?.padding || 24;

  return (
    <>
      <Helmet>
        <title>{replaceVars(settings?.metaTitle || pageData?.meta_title || pageData?.name || "")}</title>
        {(settings?.metaDescription || pageData?.meta_description) && (
          <meta name="description" content={replaceVars(settings?.metaDescription || pageData?.meta_description)} />
        )}
        {pageData?.og_image_url && <meta property="og:image" content={pageData.og_image_url} />}
        <meta property="og:title" content={replaceVars(settings?.metaTitle || pageData?.name || "")} />
      </Helmet>

      <div style={{ minHeight: "100vh", background: theme.bg, color: theme.text, fontFamily: "'Inter', 'DM Sans', system-ui, sans-serif" }}>
        {/* Slide content */}
        <div style={{ maxWidth, margin: "0 auto", padding, display: "flex", flexDirection: "column", gap: blockGap, minHeight: "100vh", justifyContent: "center" }}>
          {activeSlide.blocks.map((block) => (
            <PublicBlock
              key={block.id}
              block={block}
              theme={theme}
              replaceVars={replaceVars}
              calendarUrl={calendarUrl}
              onQuizSelect={() => handleQuizSelect(activeSlideIdx)}
              onFormSubmit={handleFormSubmit}
              onVideoPlay={handleVideoPlay}
            />
          ))}
        </div>

        {/* Navigation dots (perspective-style) */}
        {slides.length > 1 && (
          <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 8, background: "#00000066", backdropFilter: "blur(12px)", padding: "8px 16px", borderRadius: 20, zIndex: 50 }}>
            {slides.map((_, idx) => (
              <div
                key={idx}
                onClick={() => goToSlide(idx)}
                style={{
                  width: activeSlideIdx === idx ? 24 : 8,
                  height: 8,
                  borderRadius: 4,
                  background: activeSlideIdx === idx ? theme.accent : "#ffffff44",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                }}
              />
            ))}
          </div>
        )}

        {/* Scroll hint on first slide */}
        {slides.length > 1 && activeSlideIdx === 0 && (
          <div
            onClick={() => goToSlide(1)}
            style={{
              position: "fixed",
              bottom: 60,
              left: "50%",
              transform: "translateX(-50%)",
              cursor: "pointer",
              animation: "bounce 2s infinite",
              color: "#ffffff44",
            }}
          >
            <ChevronDown className="w-6 h-6" />
          </div>
        )}

        {/* Legal Footer */}
        {((settings as any)?.impressumUrl || (settings as any)?.datenschutzUrl) && (() => {
          const safeUrl = (url: string) => {
            try { const u = new URL(url); return u.protocol === "https:" || u.protocol === "http:" ? url : "#"; } catch { return "#"; }
          };
          return (
            <div style={{ textAlign: "center", padding: "16px 24px", fontSize: 11, color: "#ffffff44", borderTop: "1px solid #ffffff0d" }}>
              {(settings as any)?.impressumUrl && (
                <a href={safeUrl((settings as any).impressumUrl)} target="_blank" rel="noopener noreferrer" style={{ color: "#ffffff55", textDecoration: "none", marginRight: 16 }}>Impressum</a>
              )}
              {(settings as any)?.datenschutzUrl && (
                <a href={safeUrl((settings as any).datenschutzUrl)} target="_blank" rel="noopener noreferrer" style={{ color: "#ffffff55", textDecoration: "none" }}>Datenschutz</a>
              )}
            </div>
          );
        })()}

        <style>{`
          @keyframes bounce {
            0%, 20%, 50%, 80%, 100% { transform: translateX(-50%) translateY(0); }
            40% { transform: translateX(-50%) translateY(-8px); }
            60% { transform: translateX(-50%) translateY(-4px); }
          }
          @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.03); } }
          @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-3px); } 75% { transform: translateX(3px); } }
          @keyframes glow { 0%, 100% { box-shadow: 0 0 8px rgba(108,92,231,0.3); } 50% { box-shadow: 0 0 20px rgba(108,92,231,0.6); } }
        `}</style>
      </div>
    </>
  );
};

// --- PUBLIC BLOCK RENDERER ---
function PublicBlock({
  block, theme, replaceVars, calendarUrl, onQuizSelect, onFormSubmit, onVideoPlay,
}: {
  block: Block;
  theme: Theme & { accent: string };
  replaceVars: (str: any) => string;
  calendarUrl: string | null;
  onQuizSelect: () => void;
  onFormSubmit: (e: React.FormEvent, fields: any[]) => void;
  onVideoPlay: () => void;
}) {
  const s = block.settings;
  const isMobile = window.innerWidth < 640;
  const c = tc(theme);

  switch (block.type) {
    case "heading": {
      const sizes: Record<string, number> = { h1: isMobile ? 26 : s.fontSize || 32, h2: isMobile ? 22 : (s.fontSize || 28), h3: isMobile ? 18 : (s.fontSize || 22) };
      const level = s.level || "h1";
      const Tag = level as keyof JSX.IntrinsicElements;
      return <Tag style={{ fontSize: sizes[level] || 32, fontWeight: 800, color: s.color || c.text, textAlign: s.align || "center", lineHeight: 1.2, margin: 0, letterSpacing: "-0.02em" }}
        dangerouslySetInnerHTML={{ __html: replaceVars(s.text) }} />;
    }
    case "text":
      return <p style={{ fontSize: isMobile ? 14 : (s.fontSize || 16), color: s.color || c.muted, textAlign: s.align || "center", lineHeight: s.lineHeight || 1.6, margin: 0, maxWidth: 520, marginLeft: "auto", marginRight: "auto" }}
        dangerouslySetInnerHTML={{ __html: replaceVars(s.text) }} />;

    case "image":
      return <div style={{ borderRadius: s.borderRadius || 12, overflow: "hidden", width: s.width || "100%" }}>
        {s.src ? <img src={replaceVars(s.src)} alt={s.alt} style={{ width: "100%", display: "block", objectFit: s.objectFit || "cover" }} loading="lazy" /> :
        null}
      </div>;

    case "video": {
      const videoSrc = replaceVars(s.src);
      const [videoPlayed, setVideoPlayed] = useState(false);
      const trackPlay = () => { if (!videoPlayed) { setVideoPlayed(true); onVideoPlay(); } };

      if (!videoSrc) {
        return <div style={{ borderRadius: s.borderRadius || 12, overflow: "hidden", background: "#000", position: "relative" }}>
          <div style={{ paddingTop: "56.25%", position: "relative" }}>
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #1a1a2e, #2d2d44)" }}>
              <Play className="w-12 h-12" style={{ color: theme.accent }} />
            </div>
          </div>
        </div>;
      }
      // YouTube / Vimeo / Loom embed - track on first interaction
      if (videoSrc.includes("youtube.com") || videoSrc.includes("youtu.be")) {
        const videoId = videoSrc.includes("youtu.be") ? videoSrc.split("/").pop() : (() => { try { return new URL(videoSrc).searchParams.get("v"); } catch { return videoSrc.split("v=")[1]?.split("&")[0]; } })();
        return <div onClick={trackPlay} style={{ borderRadius: s.borderRadius || 12, overflow: "hidden", position: "relative", paddingTop: "56.25%" }}>
          <iframe src={`https://www.youtube.com/embed/${videoId}?autoplay=${s.autoplay ? 1 : 0}&enablejsapi=1`} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none" }} allow="autoplay; encrypted-media" allowFullScreen />
        </div>;
      }
      if (videoSrc.includes("vimeo.com")) {
        const vimeoId = videoSrc.split("/").pop();
        return <div onClick={trackPlay} style={{ borderRadius: s.borderRadius || 12, overflow: "hidden", position: "relative", paddingTop: "56.25%" }}>
          <iframe src={`https://player.vimeo.com/video/${vimeoId}?autoplay=${s.autoplay ? 1 : 0}`} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none" }} allow="autoplay; fullscreen" allowFullScreen />
        </div>;
      }
      if (videoSrc.includes("loom.com")) {
        const loomId = videoSrc.split("/share/").pop()?.split("?")[0];
        return <div onClick={trackPlay} style={{ borderRadius: s.borderRadius || 12, overflow: "hidden", position: "relative", paddingTop: "56.25%" }}>
          <iframe src={`https://www.loom.com/embed/${loomId}?autoplay=${s.autoplay ? 1 : 0}`} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none" }} allow="autoplay; fullscreen" allowFullScreen />
        </div>;
      }
      // Direct video - track on play event
      return <div style={{ borderRadius: s.borderRadius || 12, overflow: "hidden" }}>
        <video src={videoSrc} poster={replaceVars(s.posterSrc)} controls={s.controls !== false} autoPlay={s.autoplay} playsInline onPlay={trackPlay} style={{ width: "100%", display: "block" }} />
      </div>;
    }

    case "button": {
      const rawBtnUrl = replaceVars(s.url);
      // Prevent javascript: protocol injection
      const btnUrl = rawBtnUrl && !rawBtnUrl.trim().toLowerCase().startsWith("javascript:") ? rawBtnUrl : "#";
      const animStyle = s.animation === "pulse" ? "pulse 2s infinite" : s.animation === "shake" ? "shake 3s infinite" : s.animation === "glow" ? "glow 2s infinite" : "none";
      return <div style={{ textAlign: "center" }}>
        <a href={btnUrl || "#"} target={btnUrl?.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer"
          style={{
            display: "inline-block", background: s.bgColor || theme.accent, color: s.textColor || "#fff",
            border: "none", borderRadius: s.borderRadius || 50, padding: `${s.paddingY || 16}px 40px`,
            fontSize: isMobile ? 16 : (s.fontSize || 18), fontWeight: 700, textDecoration: "none",
            width: s.fullWidth ? "100%" : "auto", maxWidth: 400,
            boxShadow: `0 4px 24px ${(s.bgColor || theme.accent)}44`, transition: "all 0.2s",
            animation: animStyle, textAlign: "center",
          }}
          dangerouslySetInnerHTML={{ __html: replaceVars(s.text) }}
        />
      </div>;
    }

    case "form":
      return <form onSubmit={(e) => onFormSubmit(e, s.fields || [])} style={{ maxWidth: 400, margin: "0 auto" }}>
        {(s.fields || []).map((f: any, i: number) => (
          <div key={i} style={{ marginBottom: 12 }}>
            <label style={{ display: "block", fontSize: 12, color: c.subtle, marginBottom: 4, fontWeight: 500 }}>{f.label}{f.required && " *"}</label>
            {f.type === "textarea" ? (
              <textarea name={f.label} placeholder={f.placeholder} required={f.required} rows={3}
                style={{ width: "100%", padding: "12px 16px", borderRadius: 10, border: `1px solid ${c.inputBorder}`, background: c.inputBg, color: c.text, fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "inherit", resize: "vertical" }} />
            ) : (
              <input type={f.type} name={f.label} placeholder={f.placeholder} required={f.required}
                style={{ width: "100%", padding: "12px 16px", borderRadius: 10, border: `1px solid ${c.inputBorder}`, background: c.inputBg, color: c.text, fontSize: 14, outline: "none", boxSizing: "border-box" }} />
            )}
          </div>
        ))}
        <button type="submit" style={{ width: "100%", padding: "14px", borderRadius: 10, border: "none", background: s.submitColor || theme.accent, color: "#fff", fontSize: 16, fontWeight: 700, cursor: "pointer", marginTop: 8 }}>
          {s.submitText || "Absenden"}
        </button>
      </form>;

    case "spacer": return <div style={{ height: s.height || 40 }} />;
    case "divider": return <div style={{ display: "flex", justifyContent: "center" }}><div style={{ width: s.width || "60%", height: 0, borderTop: `${s.thickness || 1}px ${s.style || "solid"} ${s.color || c.inputBorder}` }} /></div>;

    case "testimonial":
      return <div style={{ background: c.cardBg, borderRadius: 16, padding: isMobile ? 20 : 28, border: `1px solid ${c.cardBorder}` }}>
        <div style={{ color: theme.accent, fontSize: 20, marginBottom: 8 }}>{"★".repeat(s.rating || 5)}</div>
        <p style={{ fontSize: isMobile ? 14 : 16, color: c.muted, lineHeight: 1.6, margin: "0 0 16px 0", fontStyle: "italic" }}>
          "{replaceVars(s.quote)}"
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {s.image_url ? (
            <img src={s.image_url} alt={s.author} style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover" }} />
          ) : (
            <div style={{ width: 40, height: 40, borderRadius: "50%", background: theme.accent + "33", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, color: theme.accent }}>
              {(s.author || "A")[0]}
            </div>
          )}
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: c.text }}>{s.author}</div>
            <div style={{ fontSize: 12, color: c.faint }}>{s.role}</div>
          </div>
        </div>
      </div>;

    case "quiz": {
      const [selected, setSelected] = useState<number | null>(null);
      return <div>
        <p style={{ fontSize: isMobile ? 16 : 18, fontWeight: 700, color: c.text, textAlign: "center", margin: "0 0 16px 0" }}>
          {replaceVars(s.question)}
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, maxWidth: 400, margin: "0 auto" }}>
          {(s.options || []).map((opt: string, i: number) => (
            <div key={i} onClick={() => { setSelected(i); onQuizSelect(); }}
              style={{
                padding: "14px 16px", borderRadius: 12,
                border: `2px solid ${selected === i ? theme.accent : theme.accent + "33"}`,
                background: selected === i ? theme.accent + "22" : c.overlay,
                textAlign: "center", fontSize: 14, color: c.text, cursor: "pointer", fontWeight: 500,
                transition: "all 0.2s",
              }}>
              {opt}
            </div>
          ))}
        </div>
      </div>;
    }

    case "calendar": {
      const calUrl = replaceVars(s.calendarUrl) || calendarUrl;
      if (!calUrl) return null;
      if (calUrl.includes("calendly.com")) {
        return <div style={{ borderRadius: 12, overflow: "hidden", background: "#fff" }}>
          <iframe src={`${calUrl.replace(/\/$/, "")}?hide_gdpr_banner=1`} width="100%" height={isMobile ? 500 : (s.height || 600)} frameBorder="0" title="Termin buchen" />
        </div>;
      }
      return <div style={{ borderRadius: 12, overflow: "hidden", background: "#fff" }}>
        <iframe src={calUrl} width="100%" height={isMobile ? 500 : (s.height || 600)} frameBorder="0" title="Termin buchen" />
      </div>;
    }

    case "logo":
      return <div style={{ textAlign: "center" }}>
        <p style={{ fontSize: 12, color: c.vfaint, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 16px 0", fontWeight: 600 }}>{s.text}</p>
        <div style={{ display: "flex", justifyContent: "center", gap: isMobile ? 16 : 24, flexWrap: "wrap", alignItems: "center" }}>
          {(s.logos || []).map((l: any, i: number) => {
            const logoObj = typeof l === "string" ? { text: l, imageUrl: "" } : l;
            return logoObj.imageUrl ? (
              <img key={i} src={logoObj.imageUrl} alt={logoObj.text || `Logo ${i + 1}`} style={{ height: 36, maxWidth: 120, objectFit: "contain", opacity: 0.7 }} />
            ) : (
              <div key={i} style={{ width: 80, height: 36, borderRadius: 6, background: c.inputBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: c.ghost, border: `1px solid ${c.cardBorder}` }}>{logoObj.text}</div>
            );
          })}
        </div>
      </div>;

    case "timer": {
      const [timeLeft, setTimeLeft] = useState(() => {
        const savedEnd = localStorage.getItem(`timer_${block.id}`);
        if (savedEnd) return Math.max(0, Math.floor((Number(savedEnd) - Date.now()) / 1000));
        const end = Date.now() + (s.hours || 48) * 3600 * 1000;
        localStorage.setItem(`timer_${block.id}`, String(end));
        return (s.hours || 48) * 3600;
      });

      useEffect(() => {
        const interval = setInterval(() => setTimeLeft(prev => Math.max(0, prev - 1)), 1000);
        return () => clearInterval(interval);
      }, []);

      const hours = Math.floor(timeLeft / 3600);
      const minutes = Math.floor((timeLeft % 3600) / 60);
      const seconds = timeLeft % 60;

      return <div style={{ background: s.bgColor || "#ff6b6b22", borderRadius: 12, padding: "16px 24px", textAlign: "center" }}>
        <div style={{ fontSize: 12, color: s.textColor || "#ff6b6b", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>{s.label}</div>
        <div style={{ display: "flex", justifyContent: "center", gap: 12 }}>
          {[
            [String(hours).padStart(2, "0"), "Std"],
            [String(minutes).padStart(2, "0"), "Min"],
            [String(seconds).padStart(2, "0"), "Sek"],
          ].map(([val, unit], i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <div style={{ fontSize: isMobile ? 24 : 32, fontWeight: 800, color: s.textColor || "#ff6b6b" }}>{val}</div>
              <div style={{ fontSize: 10, color: (s.textColor || "#ff6b6b") + "99", textTransform: "uppercase" }}>{unit}</div>
            </div>
          ))}
        </div>
      </div>;
    }

    case "social":
      return <div style={{ textAlign: "center", padding: 20 }}>
        <div style={{ fontSize: isMobile ? 36 : 48, fontWeight: 900, color: theme.accent, letterSpacing: "-0.03em" }}>{s.number}</div>
        <div style={{ fontSize: 14, color: c.subtle, marginTop: 4 }}>{s.label}</div>
      </div>;

    default: return null;
  }
}

export default PublicLandingPage;
