import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Play, Calendar, Check, X, Star, CheckCircle, Megaphone, Pen, 
  Users, Loader2, ExternalLink, Save, Wand2, Palette, Type, 
  Layout, Plus, Trash2, RotateCcw, Upload, ImageIcon
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface LeadPageTemplate {
  id?: string;
  name: string;
  is_active: boolean;
  header_logo_text: string;
  header_logo_accent: string;
  header_logo_url: string;
  header_nav_items: string[];
  header_cta_text: string;
  hero_headline: string;
  hero_subheadline: string;
  hero_cta_text: string;
  hero_video_caption: string;
  coaching_badge: string;
  coaching_headline: string;
  coaching_subheadline: string;
  pillar1_title: string;
  pillar1_subtitle: string;
  pillar1_description: string;
  pillar1_items: string[];
  pillar2_title: string;
  pillar2_subtitle: string;
  pillar2_description: string;
  pillar2_items: string[];
  combined_headline: string;
  combined_text: string;
  comparison_badge: string;
  comparison_headline: string;
  comparison_subheadline: string;
  others_title: string;
  others_items: string[];
  us_title: string;
  us_items: string[];
  primary_color: string;
  secondary_color: string;
  background_color: string;
  text_color: string;
  accent_color: string;
  calendar_url: string;
  footer_company_name: string;
  footer_tagline: string;
}

const defaultTemplate: LeadPageTemplate = {
  name: "Standard-Vorlage",
  is_active: true,
  header_logo_text: "Content-Leads",
  header_logo_accent: "Content",
  header_logo_url: "",
  header_nav_items: ["Warum wir?", "Unser Ansatz", "FAQ"],
  header_cta_text: "{{first_name}}, lass uns sprechen!",
  hero_headline: "Hey {{first_name}}, sieh dir das 2-minütige Video an",
  hero_subheadline: "… und erfahre, wie {{company}} mit personalisierten Outreach-Kampagnen und starkem Content qualifizierte Leads generiert.",
  hero_cta_text: "Gratis Termin vereinbaren",
  hero_video_caption: "Nur für dich {{first_name}}, nimm dir die 2 Minuten und schau kurz rein!!",
  coaching_badge: "Exklusives Coaching-Programm",
  coaching_headline: "Die zwei Säulen für deinen LinkedIn-Erfolg",
  coaching_subheadline: "Lerne, wie du mit Outreach Umsatz generierst und mit Content Anfragen bekommst – für {{company}}",
  pillar1_title: "Säule 1: Outreach",
  pillar1_subtitle: "= Umsatz generieren",
  pillar1_description: "Wir zeigen dir, wie du personalisierte Kampagnen erstellst, die direkt bei deiner Zielgruppe ankommen.",
  pillar1_items: [
    "Du lernst hyperpersonalisierte Nachrichten zu schreiben",
    "Wie du direkte Terminbuchungen durch warme Kontakte bekommst",
    "Datengetriebene Zielgruppenansprache verstehen",
    "A/B-Tests für maximale Conversion durchführen",
    "Schritt-für-Schritt Anleitungen zum Nachmachen"
  ],
  pillar2_title: "Säule 2: Inbound Content",
  pillar2_subtitle: "= Anfragen generieren",
  pillar2_description: "Lerne, wie du hochwertigen Content erstellst, der deine Expertise zeigt und organisch Leads anzieht.",
  pillar2_items: [
    "So schreibst du Posts, die viral gehen",
    "Thought Leadership aufbauen",
    "Die richtige Posting-Frequenz finden",
    "Community Building & Engagement-Strategien",
    "Branding & Sichtbarkeit systematisch steigern"
  ],
  combined_headline: "🚀 Outreach + Content = Maximale Wirkung",
  combined_text: "Im Coaching lernst du beide Strategien zu meistern. Während dein Outreach aktiv Termine generiert, baut dein Content gleichzeitig Vertrauen und Autorität auf. Das Ergebnis: planbar mehr Umsatz und Anfragen.",
  comparison_badge: "#1 LinkedIn Beratung in der DACH-Region",
  comparison_headline: "Was uns von anderen unterscheidet",
  comparison_subheadline: "Keine leeren Versprechungen – wir liefern Ergebnisse mit Garantie.",
  others_title: "Andere Anbieter",
  others_items: [
    "Erste Ergebnisse nach 3-6 Monaten",
    "Keine Umsatzgarantie",
    "Nur Theorie, keine Umsetzungsbegleitung",
    "Standard-Inhalte für alle",
    "Du bist nach dem Kurs auf dich allein gestellt"
  ],
  us_title: "Unser Coaching bei Content-Leads",
  us_items: [
    "Erste Anfragen bereits in 7 Tagen",
    "Umsatzgarantie – wir verdoppeln dein Investment",
    "Intensive 1:1 Betreuung bei der Umsetzung",
    "Individuell auf deine Situation angepasst",
    "Persönlicher Coach dauerhaft an deiner Seite"
  ],
  primary_color: "#06b6d4",
  secondary_color: "#a855f7",
  background_color: "#0f172a",
  text_color: "#f8fafc",
  accent_color: "#f59e0b",
  calendar_url: "",
  footer_company_name: "Content-Leads",
  footer_tagline: "Alle Rechte vorbehalten."
};

interface LeadPageTemplatePreviewProps {
  calendarUrl?: string;
}

export const LeadPageTemplatePreview = ({ calendarUrl }: LeadPageTemplatePreviewProps) => {
  const [template, setTemplate] = useState<LeadPageTemplate>(defaultTemplate);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [accountId, setAccountId] = useState<string | null>(null);

  useEffect(() => {
    loadTemplate();
  }, []);

  const loadTemplate = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("account_id")
        .eq("id", user.id)
        .single();

      if (!profile?.account_id) return;
      setAccountId(profile.account_id);

      // Load account branding data
      const { data: account } = await supabase
        .from("accounts")
        .select("logo_url, primary_brand_color, secondary_brand_color, company_name, tagline")
        .eq("id", profile.account_id)
        .single();

      const { data, error } = await supabase
        .from("lead_page_templates")
        .select("*")
        .eq("account_id", profile.account_id)
        .eq("is_active", true)
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setTemplateId(data.id);
        setTemplate({
          id: data.id,
          name: data.name,
          is_active: data.is_active,
          header_logo_text: data.header_logo_text || defaultTemplate.header_logo_text,
          header_logo_accent: data.header_logo_accent || defaultTemplate.header_logo_accent,
          header_logo_url: account?.logo_url || "",
          header_nav_items: (data.header_nav_items as string[]) || defaultTemplate.header_nav_items,
          header_cta_text: data.header_cta_text || defaultTemplate.header_cta_text,
          hero_headline: data.hero_headline || defaultTemplate.hero_headline,
          hero_subheadline: data.hero_subheadline || defaultTemplate.hero_subheadline,
          hero_cta_text: data.hero_cta_text || defaultTemplate.hero_cta_text,
          hero_video_caption: data.hero_video_caption || defaultTemplate.hero_video_caption,
          coaching_badge: data.coaching_badge || defaultTemplate.coaching_badge,
          coaching_headline: data.coaching_headline || defaultTemplate.coaching_headline,
          coaching_subheadline: data.coaching_subheadline || defaultTemplate.coaching_subheadline,
          pillar1_title: data.pillar1_title || defaultTemplate.pillar1_title,
          pillar1_subtitle: data.pillar1_subtitle || defaultTemplate.pillar1_subtitle,
          pillar1_description: data.pillar1_description || defaultTemplate.pillar1_description,
          pillar1_items: (data.pillar1_items as string[]) || defaultTemplate.pillar1_items,
          pillar2_title: data.pillar2_title || defaultTemplate.pillar2_title,
          pillar2_subtitle: data.pillar2_subtitle || defaultTemplate.pillar2_subtitle,
          pillar2_description: data.pillar2_description || defaultTemplate.pillar2_description,
          pillar2_items: (data.pillar2_items as string[]) || defaultTemplate.pillar2_items,
          combined_headline: data.combined_headline || defaultTemplate.combined_headline,
          combined_text: data.combined_text || defaultTemplate.combined_text,
          comparison_badge: data.comparison_badge || defaultTemplate.comparison_badge,
          comparison_headline: data.comparison_headline || defaultTemplate.comparison_headline,
          comparison_subheadline: data.comparison_subheadline || defaultTemplate.comparison_subheadline,
          others_title: data.others_title || defaultTemplate.others_title,
          others_items: (data.others_items as string[]) || defaultTemplate.others_items,
          us_title: data.us_title || defaultTemplate.us_title,
          us_items: (data.us_items as string[]) || defaultTemplate.us_items,
          primary_color: data.primary_color || account?.primary_brand_color || defaultTemplate.primary_color,
          secondary_color: data.secondary_color || account?.secondary_brand_color || defaultTemplate.secondary_color,
          background_color: data.background_color || defaultTemplate.background_color,
          text_color: data.text_color || defaultTemplate.text_color,
          accent_color: data.accent_color || defaultTemplate.accent_color,
          calendar_url: data.calendar_url || calendarUrl || "",
          footer_company_name: data.footer_company_name || account?.company_name || defaultTemplate.footer_company_name,
          footer_tagline: data.footer_tagline || account?.tagline || defaultTemplate.footer_tagline,
        });
      } else {
        // Use account branding data if no template exists
        setTemplate({ 
          ...defaultTemplate, 
          calendar_url: calendarUrl || "",
          header_logo_url: account?.logo_url || "",
          primary_color: account?.primary_brand_color || defaultTemplate.primary_color,
          secondary_color: account?.secondary_brand_color || defaultTemplate.secondary_color,
          footer_company_name: account?.company_name || defaultTemplate.footer_company_name,
          footer_tagline: account?.tagline || defaultTemplate.footer_tagline,
        });
      }
    } catch (error) {
      console.error("Error loading template:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveTemplate = async () => {
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: profile } = await supabase
        .from("profiles")
        .select("account_id")
        .eq("id", user.id)
        .single();

      if (!profile?.account_id) throw new Error("No account found");

      const templateData = {
        account_id: profile.account_id,
        name: template.name,
        is_active: true,
        header_logo_text: template.header_logo_text,
        header_logo_accent: template.header_logo_accent,
        header_nav_items: template.header_nav_items,
        header_cta_text: template.header_cta_text,
        hero_headline: template.hero_headline,
        hero_subheadline: template.hero_subheadline,
        hero_cta_text: template.hero_cta_text,
        hero_video_caption: template.hero_video_caption,
        coaching_badge: template.coaching_badge,
        coaching_headline: template.coaching_headline,
        coaching_subheadline: template.coaching_subheadline,
        pillar1_title: template.pillar1_title,
        pillar1_subtitle: template.pillar1_subtitle,
        pillar1_description: template.pillar1_description,
        pillar1_items: template.pillar1_items,
        pillar2_title: template.pillar2_title,
        pillar2_subtitle: template.pillar2_subtitle,
        pillar2_description: template.pillar2_description,
        pillar2_items: template.pillar2_items,
        combined_headline: template.combined_headline,
        combined_text: template.combined_text,
        comparison_badge: template.comparison_badge,
        comparison_headline: template.comparison_headline,
        comparison_subheadline: template.comparison_subheadline,
        others_title: template.others_title,
        others_items: template.others_items,
        us_title: template.us_title,
        us_items: template.us_items,
        primary_color: template.primary_color,
        secondary_color: template.secondary_color,
        background_color: template.background_color,
        text_color: template.text_color,
        accent_color: template.accent_color,
        calendar_url: template.calendar_url,
        footer_company_name: template.footer_company_name,
        footer_tagline: template.footer_tagline,
      };

      // Also save branding to account
      await supabase
        .from("accounts")
        .update({
          logo_url: template.header_logo_url,
          primary_brand_color: template.primary_color,
          secondary_brand_color: template.secondary_color,
          company_name: template.footer_company_name,
          tagline: template.footer_tagline,
        })
        .eq("id", profile.account_id);

      if (templateId) {
        const { error } = await supabase
          .from("lead_page_templates")
          .update(templateData)
          .eq("id", templateId);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("lead_page_templates")
          .insert([templateData])
          .select()
          .single();

        if (error) throw error;
        setTemplateId(data.id);
      }

      toast.success("Vorlage gespeichert!");
    } catch (error: any) {
      console.error("Error saving template:", error);
      toast.error(error.message || "Fehler beim Speichern");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAICustomize = async () => {
    if (!aiPrompt.trim()) {
      toast.error("Bitte gib eine Beschreibung ein");
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("customize-lead-template", {
        body: { prompt: aiPrompt, currentTemplate: template }
      });

      if (error) throw error;

      if (data.template) {
        setTemplate({
          ...template,
          ...data.template,
          pillar1_items: data.template.pillar1_items || template.pillar1_items,
          pillar2_items: data.template.pillar2_items || template.pillar2_items,
          others_items: data.template.others_items || template.others_items,
          us_items: data.template.us_items || template.us_items,
          header_nav_items: data.template.header_nav_items || template.header_nav_items,
        });
        toast.success("Vorlage mit KI angepasst!");
        setAiPrompt("");
      }
    } catch (error: any) {
      console.error("AI customization error:", error);
      toast.error(error.message || "Fehler bei der KI-Anpassung");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReset = () => {
    setTemplate(defaultTemplate);
    toast.success("Vorlage auf Standard zurückgesetzt");
  };

  const updateListItem = (
    field: "pillar1_items" | "pillar2_items" | "others_items" | "us_items" | "header_nav_items",
    index: number,
    value: string
  ) => {
    const newItems = [...template[field]];
    newItems[index] = value;
    setTemplate({ ...template, [field]: newItems });
  };

  const addListItem = (field: "pillar1_items" | "pillar2_items" | "others_items" | "us_items") => {
    setTemplate({ ...template, [field]: [...template[field], "Neuer Punkt"] });
  };

  const removeListItem = (field: "pillar1_items" | "pillar2_items" | "others_items" | "us_items", index: number) => {
    const newItems = template[field].filter((_, i) => i !== index);
    setTemplate({ ...template, [field]: newItems });
  };

  // Logo upload handlers
  const handleLogoUpload = useCallback(async (file: File) => {
    if (!accountId) {
      toast.error("Account nicht gefunden");
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Bitte nur Bilddateien hochladen");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Datei ist zu groß (max. 5MB)");
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${accountId}/logo.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("account-logos")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("account-logos")
        .getPublicUrl(fileName);

      setTemplate({ ...template, header_logo_url: publicUrl });
      toast.success("Logo hochgeladen!");
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error.message || "Fehler beim Hochladen");
    } finally {
      setUploading(false);
    }
  }, [accountId, template]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleLogoUpload(file);
  }, [handleLogoUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleLogoUpload(file);
  }, [handleLogoUpload]);

  const removeLogo = () => {
    setTemplate({ ...template, header_logo_url: "" });
  };

  if (isLoading) {
    return (
      <Card className="glass-card border-white/10">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  const firstName = "{{first_name}}";
  const companyName = "{{company}}";

  return (
    <div className="space-y-4">
      {/* Header with Save Button */}
      <div className="flex items-center justify-between">
        <Badge variant="outline" className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
          Lead-Seiten Vorlage • Live-Vorschau
        </Badge>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleReset} className="gap-2">
            <RotateCcw className="w-4 h-4" />
            Zurücksetzen
          </Button>
          <Button onClick={saveTemplate} disabled={isSaving} className="gap-2">
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Speichern
          </Button>
        </div>
      </div>

      {/* Live Preview */}
      <Card className="glass-card border-white/10">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Live-Vorschau
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Unter <code className="bg-white/10 px-1 rounded">/p/[lead-slug]</code>
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <div 
            className="rounded-lg overflow-hidden border border-slate-700" 
            style={{ 
              maxHeight: "500px", 
              overflowY: "auto",
              backgroundColor: template.background_color,
              color: template.text_color 
            }}
          >
            {/* Header Preview */}
            <header className="border-b border-slate-800 px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {template.header_logo_url ? (
                    <img src={template.header_logo_url} alt="Logo" className="h-8 w-auto object-contain" />
                  ) : (
                    <div className="text-lg font-bold">
                      <span style={{ color: template.primary_color }}>{template.header_logo_accent}</span>
                      {template.header_logo_text.replace(template.header_logo_accent, "")}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-4 text-xs opacity-70">
                  {template.header_nav_items.map((item, i) => (
                    <span key={i}>{item}</span>
                  ))}
                </div>
                <div 
                  className="font-semibold px-3 py-1.5 rounded text-xs"
                  style={{ backgroundColor: template.primary_color, color: template.background_color }}
                >
                  {template.header_cta_text.replace("{{first_name}}", firstName)}
                </div>
              </div>
            </header>

            {/* Hero Section Preview */}
            <section className="py-8 px-4">
              <div className="grid md:grid-cols-2 gap-6 items-center">
                <div className="space-y-4">
                  <h1 className="text-2xl font-bold leading-tight">
                    {template.hero_headline.replace("{{first_name}}", firstName)}
                  </h1>
                  <p className="text-sm opacity-80">
                    {template.hero_subheadline
                      .replace("{{first_name}}", firstName)
                      .replace("{{company}}", companyName)
                      .split(companyName)
                      .map((part, i, arr) => (
                        <span key={i}>
                          {part}
                          {i < arr.length - 1 && <span style={{ color: template.primary_color, fontWeight: 600 }}>{companyName}</span>}
                        </span>
                      ))}
                  </p>
                  <div 
                    className="inline-flex items-center gap-2 font-semibold px-4 py-2 rounded text-sm"
                    style={{ backgroundColor: template.primary_color, color: template.background_color }}
                  >
                    <Calendar className="w-4 h-4" />
                    {template.hero_cta_text}
                  </div>
                </div>
                <div className="relative">
                  <div className="absolute -top-6 right-1/4 text-3xl animate-bounce">👇</div>
                  <div className="rounded-lg overflow-hidden border border-slate-600 aspect-video flex items-center justify-center" style={{ backgroundColor: `${template.primary_color}10` }}>
                    <div className="text-center">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2" style={{ backgroundColor: `${template.primary_color}30` }}>
                        <Play className="w-6 h-6" style={{ color: template.primary_color }} />
                      </div>
                      <p className="text-xs opacity-60">Personalisiertes Video</p>
                    </div>
                  </div>
                  <p className="text-center mt-2 text-xs opacity-70">
                    {template.hero_video_caption.replace("{{first_name}}", firstName)}
                  </p>
                </div>
              </div>
            </section>

            {/* Coaching Section Preview */}
            <section className="py-6 px-4" style={{ backgroundColor: `${template.background_color}cc` }}>
              <div className="text-center mb-4">
                <span 
                  className="inline-block px-3 py-1 rounded-full text-xs font-medium mb-2"
                  style={{ backgroundColor: `${template.primary_color}30`, color: template.primary_color }}
                >
                  {template.coaching_badge}
                </span>
                <h2 className="text-xl font-bold mb-2">{template.coaching_headline}</h2>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div 
                  className="rounded-lg p-4 border"
                  style={{ 
                    background: `linear-gradient(to bottom right, ${template.primary_color}15, transparent)`,
                    borderColor: `${template.primary_color}40`
                  }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded flex items-center justify-center" style={{ backgroundColor: `${template.primary_color}30` }}>
                      <Megaphone className="w-4 h-4" style={{ color: template.primary_color }} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold">{template.pillar1_title}</h3>
                      <p className="text-xs" style={{ color: template.primary_color }}>{template.pillar1_subtitle}</p>
                    </div>
                  </div>
                  <ul className="space-y-1">
                    {template.pillar1_items.slice(0, 3).map((item, i) => (
                      <li key={i} className="flex items-center gap-2 text-xs opacity-80">
                        <Check className="w-3 h-3 flex-shrink-0" style={{ color: template.primary_color }} />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div 
                  className="rounded-lg p-4 border"
                  style={{ 
                    background: `linear-gradient(to bottom right, ${template.secondary_color}15, transparent)`,
                    borderColor: `${template.secondary_color}40`
                  }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded flex items-center justify-center" style={{ backgroundColor: `${template.secondary_color}30` }}>
                      <Pen className="w-4 h-4" style={{ color: template.secondary_color }} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold">{template.pillar2_title}</h3>
                      <p className="text-xs" style={{ color: template.secondary_color }}>{template.pillar2_subtitle}</p>
                    </div>
                  </div>
                  <ul className="space-y-1">
                    {template.pillar2_items.slice(0, 3).map((item, i) => (
                      <li key={i} className="flex items-center gap-2 text-xs opacity-80">
                        <Check className="w-3 h-3 flex-shrink-0" style={{ color: template.secondary_color }} />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>

            {/* Footer Preview */}
            <footer className="border-t border-slate-800 py-4 px-4 text-center">
              <p className="text-xs opacity-60">
                © 2024 {template.footer_company_name}. {template.footer_tagline}
              </p>
            </footer>
          </div>
        </CardContent>
      </Card>

      {/* Editor Section Below Preview */}
      <Card className="glass-card border-white/10">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-primary" />
            Anpassen
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* AI Customization */}
          <div className="p-4 rounded-lg bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20">
            <div className="flex items-center gap-2 mb-3">
              <Wand2 className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">Mit KI anpassen</h3>
            </div>
            <Textarea
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="z.B. 'Passe die Seite für eine Immobilienmakler-Agentur an, die sich auf Luxusimmobilien spezialisiert hat.'"
              className="min-h-[80px] bg-white/5 border-white/10 mb-3"
            />
            <Button 
              onClick={handleAICustomize} 
              disabled={isGenerating || !aiPrompt.trim()}
              className="w-full gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  KI passt Vorlage an...
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  Mit KI anpassen
                </>
              )}
            </Button>
          </div>

          {/* Editor Tabs */}
          <Tabs defaultValue="branding" className="w-full">
            <TabsList className="w-full flex flex-wrap h-auto gap-1 bg-white/5 p-1">
              <TabsTrigger value="branding" className="gap-1 text-xs">
                <ImageIcon className="w-3 h-3" />
                Branding
              </TabsTrigger>
              <TabsTrigger value="hero" className="gap-1 text-xs">
                <Layout className="w-3 h-3" />
                Hero
              </TabsTrigger>
              <TabsTrigger value="coaching" className="gap-1 text-xs">
                <Users className="w-3 h-3" />
                Coaching
              </TabsTrigger>
              <TabsTrigger value="comparison" className="gap-1 text-xs">
                <Star className="w-3 h-3" />
                Vergleich
              </TabsTrigger>
              <TabsTrigger value="colors" className="gap-1 text-xs">
                <Palette className="w-3 h-3" />
                Farben
              </TabsTrigger>
              <TabsTrigger value="footer" className="gap-1 text-xs">
                <Type className="w-3 h-3" />
                Footer
              </TabsTrigger>
            </TabsList>

            <ScrollArea className="h-[350px] mt-4">
              {/* Branding Tab */}
              <TabsContent value="branding" className="space-y-4 m-0">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-muted-foreground mb-2 block">Logo</label>
                    {template.header_logo_url ? (
                      <div className="flex items-center gap-4 p-4 rounded-lg border border-white/10 bg-white/5">
                        <img src={template.header_logo_url} alt="Logo" className="h-16 w-auto object-contain" />
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground">Logo hochgeladen</p>
                        </div>
                        <Button variant="ghost" size="icon" onClick={removeLogo}>
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </Button>
                      </div>
                    ) : (
                      <div
                        className={`p-6 rounded-lg border-2 border-dashed transition-colors ${
                          isDragging 
                            ? "border-primary bg-primary/10" 
                            : "border-white/20 hover:border-white/40"
                        }`}
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                      >
                        <div className="flex flex-col items-center gap-2 text-center">
                          {uploading ? (
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                          ) : (
                            <Upload className="w-8 h-8 text-muted-foreground" />
                          )}
                          <p className="text-sm text-muted-foreground">
                            {uploading ? "Wird hochgeladen..." : "Logo hierher ziehen oder"}
                          </p>
                          {!uploading && (
                            <label className="cursor-pointer">
                              <span className="text-primary hover:underline text-sm">Datei auswählen</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleFileSelect}
                              />
                            </label>
                          )}
                          <p className="text-xs text-muted-foreground">PNG, JPG bis 5MB</p>
                        </div>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground mb-1 block">Firmenname</label>
                    <Input
                      value={template.footer_company_name}
                      onChange={(e) => setTemplate({ ...template, footer_company_name: e.target.value })}
                      className="bg-white/5 border-white/10"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground mb-1 block">Tagline</label>
                    <Input
                      value={template.footer_tagline}
                      onChange={(e) => setTemplate({ ...template, footer_tagline: e.target.value })}
                      className="bg-white/5 border-white/10"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-muted-foreground mb-1 block">Primärfarbe</label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={template.primary_color}
                          onChange={(e) => setTemplate({ ...template, primary_color: e.target.value })}
                          className="w-10 h-10 rounded cursor-pointer border-0"
                        />
                        <Input
                          value={template.primary_color}
                          onChange={(e) => setTemplate({ ...template, primary_color: e.target.value })}
                          className="bg-white/5 border-white/10"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground mb-1 block">Sekundärfarbe</label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={template.secondary_color}
                          onChange={(e) => setTemplate({ ...template, secondary_color: e.target.value })}
                          className="w-10 h-10 rounded cursor-pointer border-0"
                        />
                        <Input
                          value={template.secondary_color}
                          onChange={(e) => setTemplate({ ...template, secondary_color: e.target.value })}
                          className="bg-white/5 border-white/10"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Hero Tab */}
              <TabsContent value="hero" className="space-y-4 m-0">
                <div className="space-y-3">
                  <div>
                    <label className="text-sm text-muted-foreground mb-1 block">Logo Text (Fallback)</label>
                    <div className="flex gap-2">
                      <Input
                        value={template.header_logo_accent}
                        onChange={(e) => setTemplate({ ...template, header_logo_accent: e.target.value })}
                        placeholder="Akzent"
                        className="w-1/3 bg-white/5 border-white/10"
                      />
                      <Input
                        value={template.header_logo_text}
                        onChange={(e) => setTemplate({ ...template, header_logo_text: e.target.value })}
                        placeholder="Vollständiger Name"
                        className="flex-1 bg-white/5 border-white/10"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground mb-1 block">Hero Headline</label>
                    <Input
                      value={template.hero_headline}
                      onChange={(e) => setTemplate({ ...template, hero_headline: e.target.value })}
                      className="bg-white/5 border-white/10"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Nutze {"{{first_name}}"} für Personalisierung</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground mb-1 block">Hero Subheadline</label>
                    <Textarea
                      value={template.hero_subheadline}
                      onChange={(e) => setTemplate({ ...template, hero_subheadline: e.target.value })}
                      className="bg-white/5 border-white/10"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Nutze {"{{company}}"} für Firmenname</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm text-muted-foreground mb-1 block">CTA Button</label>
                      <Input
                        value={template.hero_cta_text}
                        onChange={(e) => setTemplate({ ...template, hero_cta_text: e.target.value })}
                        className="bg-white/5 border-white/10"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground mb-1 block">Header CTA</label>
                      <Input
                        value={template.header_cta_text}
                        onChange={(e) => setTemplate({ ...template, header_cta_text: e.target.value })}
                        className="bg-white/5 border-white/10"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground mb-1 block">Video Caption</label>
                    <Input
                      value={template.hero_video_caption}
                      onChange={(e) => setTemplate({ ...template, hero_video_caption: e.target.value })}
                      className="bg-white/5 border-white/10"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground mb-1 block">Kalender URL</label>
                    <Input
                      value={template.calendar_url}
                      onChange={(e) => setTemplate({ ...template, calendar_url: e.target.value })}
                      placeholder="https://calendly.com/..."
                      className="bg-white/5 border-white/10"
                    />
                  </div>
                </div>
              </TabsContent>

              {/* Coaching Tab */}
              <TabsContent value="coaching" className="space-y-4 m-0">
                <div className="space-y-3">
                  <div>
                    <label className="text-sm text-muted-foreground mb-1 block">Badge</label>
                    <Input
                      value={template.coaching_badge}
                      onChange={(e) => setTemplate({ ...template, coaching_badge: e.target.value })}
                      className="bg-white/5 border-white/10"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground mb-1 block">Headline</label>
                    <Input
                      value={template.coaching_headline}
                      onChange={(e) => setTemplate({ ...template, coaching_headline: e.target.value })}
                      className="bg-white/5 border-white/10"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground mb-1 block">Subheadline</label>
                    <Input
                      value={template.coaching_subheadline}
                      onChange={(e) => setTemplate({ ...template, coaching_subheadline: e.target.value })}
                      className="bg-white/5 border-white/10"
                    />
                  </div>

                  {/* Pillar 1 */}
                  <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Megaphone className="w-4 h-4 text-cyan-400" />
                      <span className="font-medium text-sm">Säule 1</span>
                    </div>
                    <div className="space-y-2">
                      <Input
                        value={template.pillar1_title}
                        onChange={(e) => setTemplate({ ...template, pillar1_title: e.target.value })}
                        placeholder="Titel"
                        className="bg-white/5 border-white/10"
                      />
                      <Input
                        value={template.pillar1_subtitle}
                        onChange={(e) => setTemplate({ ...template, pillar1_subtitle: e.target.value })}
                        placeholder="Untertitel"
                        className="bg-white/5 border-white/10"
                      />
                      <div className="space-y-1">
                        {template.pillar1_items.map((item, i) => (
                          <div key={i} className="flex gap-2">
                            <Input
                              value={item}
                              onChange={(e) => updateListItem("pillar1_items", i, e.target.value)}
                              className="flex-1 bg-white/5 border-white/10 text-sm"
                            />
                            <Button variant="ghost" size="icon" onClick={() => removeListItem("pillar1_items", i)}>
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                        <Button variant="outline" size="sm" onClick={() => addListItem("pillar1_items")} className="w-full">
                          <Plus className="w-3 h-3 mr-1" /> Punkt hinzufügen
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Pillar 2 */}
                  <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Pen className="w-4 h-4 text-purple-400" />
                      <span className="font-medium text-sm">Säule 2</span>
                    </div>
                    <div className="space-y-2">
                      <Input
                        value={template.pillar2_title}
                        onChange={(e) => setTemplate({ ...template, pillar2_title: e.target.value })}
                        placeholder="Titel"
                        className="bg-white/5 border-white/10"
                      />
                      <Input
                        value={template.pillar2_subtitle}
                        onChange={(e) => setTemplate({ ...template, pillar2_subtitle: e.target.value })}
                        placeholder="Untertitel"
                        className="bg-white/5 border-white/10"
                      />
                      <div className="space-y-1">
                        {template.pillar2_items.map((item, i) => (
                          <div key={i} className="flex gap-2">
                            <Input
                              value={item}
                              onChange={(e) => updateListItem("pillar2_items", i, e.target.value)}
                              className="flex-1 bg-white/5 border-white/10 text-sm"
                            />
                            <Button variant="ghost" size="icon" onClick={() => removeListItem("pillar2_items", i)}>
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                        <Button variant="outline" size="sm" onClick={() => addListItem("pillar2_items")} className="w-full">
                          <Plus className="w-3 h-3 mr-1" /> Punkt hinzufügen
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Comparison Tab */}
              <TabsContent value="comparison" className="space-y-4 m-0">
                <div className="space-y-3">
                  <div>
                    <label className="text-sm text-muted-foreground mb-1 block">Badge</label>
                    <Input
                      value={template.comparison_badge}
                      onChange={(e) => setTemplate({ ...template, comparison_badge: e.target.value })}
                      className="bg-white/5 border-white/10"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground mb-1 block">Headline</label>
                    <Input
                      value={template.comparison_headline}
                      onChange={(e) => setTemplate({ ...template, comparison_headline: e.target.value })}
                      className="bg-white/5 border-white/10"
                    />
                  </div>

                  {/* Others */}
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <X className="w-4 h-4 text-red-400" />
                      <span className="font-medium text-sm">{template.others_title}</span>
                    </div>
                    <Input
                      value={template.others_title}
                      onChange={(e) => setTemplate({ ...template, others_title: e.target.value })}
                      placeholder="Titel"
                      className="bg-white/5 border-white/10 mb-2"
                    />
                    <div className="space-y-1">
                      {template.others_items.map((item, i) => (
                        <div key={i} className="flex gap-2">
                          <Input
                            value={item}
                            onChange={(e) => updateListItem("others_items", i, e.target.value)}
                            className="flex-1 bg-white/5 border-white/10 text-sm"
                          />
                          <Button variant="ghost" size="icon" onClick={() => removeListItem("others_items", i)}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                      <Button variant="outline" size="sm" onClick={() => addListItem("others_items")} className="w-full">
                        <Plus className="w-3 h-3 mr-1" /> Punkt hinzufügen
                      </Button>
                    </div>
                  </div>

                  {/* Us */}
                  <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                      <span className="font-medium text-sm">{template.us_title}</span>
                    </div>
                    <Input
                      value={template.us_title}
                      onChange={(e) => setTemplate({ ...template, us_title: e.target.value })}
                      placeholder="Titel"
                      className="bg-white/5 border-white/10 mb-2"
                    />
                    <div className="space-y-1">
                      {template.us_items.map((item, i) => (
                        <div key={i} className="flex gap-2">
                          <Input
                            value={item}
                            onChange={(e) => updateListItem("us_items", i, e.target.value)}
                            className="flex-1 bg-white/5 border-white/10 text-sm"
                          />
                          <Button variant="ghost" size="icon" onClick={() => removeListItem("us_items", i)}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                      <Button variant="outline" size="sm" onClick={() => addListItem("us_items")} className="w-full">
                        <Plus className="w-3 h-3 mr-1" /> Punkt hinzufügen
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Colors Tab */}
              <TabsContent value="colors" className="space-y-4 m-0">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-muted-foreground mb-1 block">Hintergrundfarbe</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={template.background_color}
                        onChange={(e) => setTemplate({ ...template, background_color: e.target.value })}
                        className="w-10 h-10 rounded cursor-pointer border-0"
                      />
                      <Input
                        value={template.background_color}
                        onChange={(e) => setTemplate({ ...template, background_color: e.target.value })}
                        className="bg-white/5 border-white/10"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground mb-1 block">Textfarbe</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={template.text_color}
                        onChange={(e) => setTemplate({ ...template, text_color: e.target.value })}
                        className="w-10 h-10 rounded cursor-pointer border-0"
                      />
                      <Input
                        value={template.text_color}
                        onChange={(e) => setTemplate({ ...template, text_color: e.target.value })}
                        className="bg-white/5 border-white/10"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground mb-1 block">Akzentfarbe</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={template.accent_color}
                        onChange={(e) => setTemplate({ ...template, accent_color: e.target.value })}
                        className="w-10 h-10 rounded cursor-pointer border-0"
                      />
                      <Input
                        value={template.accent_color}
                        onChange={(e) => setTemplate({ ...template, accent_color: e.target.value })}
                        className="bg-white/5 border-white/10"
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Footer Tab */}
              <TabsContent value="footer" className="space-y-4 m-0">
                <div className="space-y-3">
                  <div>
                    <label className="text-sm text-muted-foreground mb-1 block">Firmenname</label>
                    <Input
                      value={template.footer_company_name}
                      onChange={(e) => setTemplate({ ...template, footer_company_name: e.target.value })}
                      className="bg-white/5 border-white/10"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground mb-1 block">Tagline</label>
                    <Input
                      value={template.footer_tagline}
                      onChange={(e) => setTemplate({ ...template, footer_tagline: e.target.value })}
                      className="bg-white/5 border-white/10"
                    />
                  </div>
                </div>
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export { defaultTemplate };
