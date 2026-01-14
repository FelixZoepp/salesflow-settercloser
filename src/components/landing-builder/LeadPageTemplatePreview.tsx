import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Play, Calendar, Check, X, Star, CheckCircle, Megaphone, Pen, Users, Eye, Edit, Loader2, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { LeadPageTemplateEditor, LeadPageTemplate, defaultTemplate } from "./LeadPageTemplateEditor";

interface LeadPageTemplatePreviewProps {
  calendarUrl?: string;
}

export const LeadPageTemplatePreview = ({ calendarUrl }: LeadPageTemplatePreviewProps) => {
  const [template, setTemplate] = useState<LeadPageTemplate>(defaultTemplate);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeView, setActiveView] = useState<"preview" | "edit">("preview");
  const [templateId, setTemplateId] = useState<string | null>(null);

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
          primary_color: data.primary_color || defaultTemplate.primary_color,
          secondary_color: data.secondary_color || defaultTemplate.secondary_color,
          background_color: data.background_color || defaultTemplate.background_color,
          text_color: data.text_color || defaultTemplate.text_color,
          accent_color: data.accent_color || defaultTemplate.accent_color,
          calendar_url: data.calendar_url || calendarUrl || "",
          footer_company_name: data.footer_company_name || defaultTemplate.footer_company_name,
          footer_tagline: data.footer_tagline || defaultTemplate.footer_tagline,
        });
      } else {
        // Use calendar URL from props if no template exists
        setTemplate({ ...defaultTemplate, calendar_url: calendarUrl || "" });
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
      setActiveView("preview");
    } catch (error: any) {
      console.error("Error saving template:", error);
      toast.error(error.message || "Fehler beim Speichern");
    } finally {
      setIsSaving(false);
    }
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

  // Preview with template values
  const firstName = "{{first_name}}";
  const companyName = "{{company}}";

  return (
    <div className="space-y-4">
      {/* View Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant={activeView === "preview" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveView("preview")}
            className="gap-2"
          >
            <Eye className="w-4 h-4" />
            Vorschau
          </Button>
          <Button
            variant={activeView === "edit" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveView("edit")}
            className="gap-2"
          >
            <Edit className="w-4 h-4" />
            Bearbeiten
          </Button>
        </div>
        <Badge variant="outline" className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
          Lead-Seiten Vorlage
        </Badge>
      </div>

      {activeView === "edit" ? (
        <LeadPageTemplateEditor
          template={template}
          onTemplateChange={setTemplate}
          onSave={saveTemplate}
          isSaving={isSaving}
        />
      ) : (
        <Card className="glass-card border-white/10">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Lead-Seiten Vorschau
              </CardTitle>
              <Button variant="outline" size="sm" onClick={() => setActiveView("edit")} className="gap-2">
                <Edit className="w-4 h-4" />
                Bearbeiten
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Diese Seite wird automatisch für jeden Lead unter <code className="bg-white/10 px-1 rounded">/p/[lead-slug]</code> generiert
            </p>
          </CardHeader>
          <CardContent>
            <div 
              className="rounded-lg overflow-hidden border border-slate-700" 
              style={{ 
                maxHeight: "600px", 
                overflowY: "auto",
                backgroundColor: template.background_color,
                color: template.text_color 
              }}
            >
              
              {/* Header Preview */}
              <header className="border-b border-slate-800 px-4 py-3">
                <div className="flex items-center justify-between">
                  <div className="text-lg font-bold">
                    <span style={{ color: template.primary_color }}>{template.header_logo_accent}</span>
                    {template.header_logo_text.replace(template.header_logo_accent, "")}
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
                        <p className="text-xs font-mono" style={{ color: template.primary_color }}>{"{{video_url}}"}</p>
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
                  <p className="text-xs opacity-70">
                    {template.coaching_subheadline
                      .replace("{{company}}", companyName)
                      .split(companyName)
                      .map((part, i, arr) => (
                        <span key={i}>
                          {part}
                          {i < arr.length - 1 && <span style={{ color: template.primary_color }}>{companyName}</span>}
                        </span>
                      ))}
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {/* Pillar 1 */}
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

                  {/* Pillar 2 */}
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

              {/* Comparison Section Preview */}
              <section className="py-6 px-4">
                <div className="text-center mb-4">
                  <div 
                    className="inline-flex items-center gap-1 rounded-full px-3 py-1 mb-2 border"
                    style={{ backgroundColor: `${template.accent_color}30`, borderColor: `${template.accent_color}60` }}
                  >
                    <Star className="w-3 h-3" style={{ color: template.accent_color, fill: template.accent_color }} />
                    <span className="font-semibold text-xs" style={{ color: template.accent_color }}>{template.comparison_badge}</span>
                    <Star className="w-3 h-3" style={{ color: template.accent_color, fill: template.accent_color }} />
                  </div>
                  <h2 className="text-xl font-bold">{template.comparison_headline}</h2>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="rounded-lg p-4 border" style={{ backgroundColor: "rgba(239, 68, 68, 0.05)", borderColor: "rgba(239, 68, 68, 0.2)" }}>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(239, 68, 68, 0.2)" }}>
                        <X className="w-3 h-3 text-red-400" />
                      </div>
                      <h3 className="text-sm font-bold">{template.others_title}</h3>
                    </div>
                    <ul className="space-y-1">
                      {template.others_items.slice(0, 3).map((item, i) => (
                        <li key={i} className="flex items-center gap-2 text-xs opacity-60">
                          <X className="w-3 h-3 text-red-400 flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="rounded-lg p-4 border" style={{ backgroundColor: "rgba(16, 185, 129, 0.05)", borderColor: "rgba(16, 185, 129, 0.2)" }}>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(16, 185, 129, 0.2)" }}>
                        <CheckCircle className="w-3 h-3 text-emerald-400" />
                      </div>
                      <h3 className="text-sm font-bold">{template.us_title}</h3>
                    </div>
                    <ul className="space-y-1">
                      {template.us_items.slice(0, 3).map((item, i) => (
                        <li key={i} className="flex items-center gap-2 text-xs opacity-80">
                          <CheckCircle className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </section>

              {/* Variables Info Box */}
              <div className="mx-4 mb-4 p-4 rounded-lg border" style={{ backgroundColor: `${template.primary_color}15`, borderColor: `${template.primary_color}40` }}>
                <h4 className="text-sm font-medium mb-2" style={{ color: template.primary_color }}>Verfügbare Variablen:</h4>
                <div className="flex flex-wrap gap-2">
                  {[
                    "{{first_name}}",
                    "{{last_name}}",
                    "{{company}}",
                    "{{video_url}}",
                    "{{pitch_video_url}}",
                  ].map((variable) => (
                    <code 
                      key={variable} 
                      className="px-2 py-1 rounded text-xs"
                      style={{ backgroundColor: `${template.background_color}`, color: template.primary_color }}
                    >
                      {variable}
                    </code>
                  ))}
                </div>
                <p className="text-xs mt-2 opacity-60">
                  Diese Variablen werden automatisch mit den Lead-Daten ersetzt
                </p>
              </div>

              {/* Footer Preview */}
              <footer className="border-t border-slate-800 py-4 px-4 text-center">
                <p className="text-xs opacity-60">
                  © 2024 {template.footer_company_name}. {template.footer_tagline}
                </p>
              </footer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
