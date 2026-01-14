import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Eye, Save, Globe, Wand2, Loader2, Plus, Trash2, ExternalLink, Copy, Calendar, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { LandingPagePreview } from "@/components/landing-builder/LandingPagePreview";
import { LandingPageEditor } from "@/components/landing-builder/LandingPageEditor";
import { LandingPageList } from "@/components/landing-builder/LandingPageList";
import { LeadPageTemplatePreview } from "@/components/landing-builder/LeadPageTemplatePreview";
import type { Json } from "@/integrations/supabase/types";

interface LandingPageContent {
  hero?: {
    headline: string;
    subheadline: string;
    ctaText: string;
    ctaLink: string;
  };
  benefits?: Array<{
    icon: string;
    title: string;
    description: string;
  }>;
  features?: Array<{
    title: string;
    description: string;
    bulletPoints: string[];
  }>;
  testimonials?: Array<{
    quote: string;
    author: string;
    company: string;
    role: string;
  }>;
  faq?: Array<{
    question: string;
    answer: string;
  }>;
  cta?: {
    headline: string;
    description: string;
    buttonText: string;
    buttonLink: string;
  };
  footer?: {
    companyName: string;
    tagline: string;
  };
  suggestedColors?: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  suggestedName?: string;
}

interface LandingPageStyles {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  fontFamily: string;
}

interface LandingPage {
  id: string;
  name: string;
  slug: string;
  status: string;
  prompt: string | null;
  content: LandingPageContent;
  styles: LandingPageStyles;
  meta_title: string | null;
  meta_description: string | null;
  view_count: number;
  created_at: string;
  updated_at: string;
  calendar_url: string | null;
}

const defaultStyles: LandingPageStyles = {
  primaryColor: "#3B82F6",
  secondaryColor: "#1E40AF",
  accentColor: "#F59E0B",
  backgroundColor: "#FFFFFF",
  textColor: "#1F2937",
  fontFamily: "Inter",
};

const LandingPageBuilder = () => {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("lead-pages");
  const [selectedPage, setSelectedPage] = useState<LandingPage | null>(null);
  const [pages, setPages] = useState<LandingPage[]>([]);
  const [content, setContent] = useState<LandingPageContent>({});
  const [styles, setStyles] = useState<LandingPageStyles>(defaultStyles);
  const [pageName, setPageName] = useState("");
  const [pageSlug, setPageSlug] = useState("");
  const [calendarUrl, setCalendarUrl] = useState("");
  const [senderCompany, setSenderCompany] = useState("");
  const [userCalendarUrl, setUserCalendarUrl] = useState<string | null>(null);

  useEffect(() => {
    loadPages();
    loadUserCalendarUrl();
  }, []);

  const loadUserCalendarUrl = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('profiles')
      .select('calendar_url')
      .eq('id', user.id)
      .single();

    if (data?.calendar_url) {
      setUserCalendarUrl(data.calendar_url);
    }

    // Also load account company name
    const { data: accountData } = await supabase
      .from('accounts')
      .select('company_name, name')
      .limit(1)
      .single();

    if (accountData) {
      setSenderCompany(accountData.company_name || accountData.name || "");
    }
  };

  const loadPages = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('landing_pages')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading pages:', error);
      return;
    }

    // Transform the data to match our interface
    const transformedPages: LandingPage[] = (data || []).map(page => ({
      ...page,
      content: (page.content || {}) as LandingPageContent,
      styles: (page.styles || defaultStyles) as LandingPageStyles,
    }));

    setPages(transformedPages);
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[äöüß]/g, match => ({ 'ä': 'ae', 'ö': 'oe', 'ü': 'ue', 'ß': 'ss' }[match] || match))
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("Bitte gib einen Prompt ein");
      return;
    }

    if (!senderCompany.trim()) {
      toast.error("Bitte gib deinen Firmennamen ein");
      return;
    }

    setIsGenerating(true);
    try {
      // Include sender company name in the prompt for the AI
      const enrichedPrompt = `${prompt}\n\nWICHTIG - Absender-Firmenname: ${senderCompany}`;
      
      const { data, error } = await supabase.functions.invoke('generate-landing-page', {
        body: { prompt: enrichedPrompt }
      });

      if (error) throw error;

      if (data.content) {
        setContent(data.content);
        
        // Apply suggested colors
        if (data.content.suggestedColors) {
          setStyles({
            ...styles,
            primaryColor: data.content.suggestedColors.primary || styles.primaryColor,
            secondaryColor: data.content.suggestedColors.secondary || styles.secondaryColor,
            accentColor: data.content.suggestedColors.accent || styles.accentColor,
            backgroundColor: data.content.suggestedColors.background || styles.backgroundColor,
            textColor: data.content.suggestedColors.text || styles.textColor,
          });
        }

        // Set suggested name
        if (data.content.suggestedName) {
          setPageName(data.content.suggestedName);
          setPageSlug(generateSlug(data.content.suggestedName));
        }

        setActiveTab("preview");
        toast.success("Landing Page generiert!");
      }
    } catch (error) {
      console.error('Generation error:', error);
      toast.error("Fehler beim Generieren der Landing Page");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async (publish = false) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Bitte melde dich an");
      return;
    }

    if (!pageName.trim() || !pageSlug.trim()) {
      toast.error("Bitte gib einen Namen und Slug ein");
      return;
    }

    setIsSaving(true);
    try {
      const pageData = {
        user_id: user.id,
        name: pageName,
        slug: pageSlug,
        status: publish ? 'published' : 'draft',
        prompt,
        content: JSON.parse(JSON.stringify(content)) as Json,
        styles: JSON.parse(JSON.stringify(styles)) as Json,
        meta_title: content.hero?.headline || pageName,
        meta_description: content.hero?.subheadline || '',
        published_at: publish ? new Date().toISOString() : null,
        calendar_url: calendarUrl || null,
      };

      let result;
      if (selectedPage) {
        result = await supabase
          .from('landing_pages')
          .update(pageData)
          .eq('id', selectedPage.id)
          .select()
          .single();
      } else {
        result = await supabase
          .from('landing_pages')
          .insert([pageData])
          .select()
          .single();
      }

      if (result.error) throw result.error;

      toast.success(publish ? "Landing Page veröffentlicht!" : "Landing Page gespeichert!");
      loadPages();
      
      if (publish) {
        const publicUrl = `${window.location.origin}/lp/${pageSlug}`;
        navigator.clipboard.writeText(publicUrl);
        toast.info("Link in Zwischenablage kopiert!");
      }
    } catch (error: any) {
      console.error('Save error:', error);
      if (error.code === '23505') {
        toast.error("Dieser Slug ist bereits vergeben");
      } else {
        toast.error("Fehler beim Speichern");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleSelectPage = (page: LandingPage) => {
    setSelectedPage(page);
    setContent(page.content);
    setStyles(page.styles);
    setPageName(page.name);
    setPageSlug(page.slug);
    setPrompt(page.prompt || "");
    setCalendarUrl(page.calendar_url || "");
    setActiveTab("preview");
  };

  const handleNewPage = () => {
    setSelectedPage(null);
    setContent({});
    setStyles(defaultStyles);
    setPageName("");
    setPageSlug("");
    setPrompt("");
    setCalendarUrl("");
    setActiveTab("generator");
  };

  const handleSaveUserCalendarUrl = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('profiles')
      .update({ calendar_url: calendarUrl })
      .eq('id', user.id);

    if (error) {
      toast.error("Fehler beim Speichern");
      return;
    }

    setUserCalendarUrl(calendarUrl);
    toast.success("Kalender-URL gespeichert!");
  };

  const handleDeletePage = async (pageId: string) => {
    const { error } = await supabase
      .from('landing_pages')
      .delete()
      .eq('id', pageId);

    if (error) {
      toast.error("Fehler beim Löschen");
      return;
    }

    toast.success("Landing Page gelöscht");
    loadPages();
    if (selectedPage?.id === pageId) {
      handleNewPage();
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Globe className="w-7 h-7 text-primary" />
              Landing Page Builder
            </h1>
            <p className="text-muted-foreground mt-1">
              Erstelle mit KI personalisierte Landing Pages für deine Kunden
            </p>
          </div>
          <Button onClick={handleNewPage} className="gap-2">
            <Plus className="w-4 h-4" />
            Neue Seite
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Page List */}
          <div className="lg:col-span-1">
            <LandingPageList
              pages={pages}
              selectedPage={selectedPage}
              onSelect={handleSelectPage}
              onDelete={handleDeletePage}
            />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4 glass-button">
                <TabsTrigger value="lead-pages" className="gap-2">
                  <Users className="w-4 h-4" />
                  Lead-Seiten
                </TabsTrigger>
                <TabsTrigger value="generator" className="gap-2">
                  <Wand2 className="w-4 h-4" />
                  Generator
                </TabsTrigger>
                <TabsTrigger value="preview" className="gap-2">
                  <Eye className="w-4 h-4" />
                  Vorschau
                </TabsTrigger>
                <TabsTrigger value="editor" className="gap-2">
                  <Sparkles className="w-4 h-4" />
                  Editor
                </TabsTrigger>
              </TabsList>

              {/* Lead Pages Template Tab */}
              <TabsContent value="lead-pages">
                <LeadPageTemplatePreview calendarUrl={userCalendarUrl || undefined} />
              </TabsContent>

              {/* Generator Tab */}
              <TabsContent value="generator">
                <Card className="glass-card border-white/10">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Wand2 className="w-5 h-5 text-primary" />
                      KI Landing Page Generator
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm text-muted-foreground mb-2 block">
                        Beschreibe deine Landing Page
                      </label>
                      <Textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="z.B. Eine Landing Page für eine Webdesign-Agentur, die moderne Websites für lokale Unternehmen erstellt. Fokus auf schnelle Ladezeiten, SEO-Optimierung und responsives Design. Zielgruppe: Kleine bis mittlere Unternehmen in Deutschland."
                        className="min-h-[150px] bg-white/5 border-white/10"
                      />
                    </div>

                    {/* Sender Company Name - Important for personalization */}
                    <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                      <label className="text-sm font-medium text-primary mb-2 block">
                        Dein Firmenname (erscheint auf der Landing Page)
                      </label>
                      <Input
                        value={senderCompany}
                        onChange={(e) => setSenderCompany(e.target.value)}
                        placeholder="z.B. Mustermann GmbH"
                        className="bg-white/5 border-white/10"
                      />
                      <p className="text-xs text-muted-foreground mt-2">
                        Dieser Name erscheint im Footer und Angebotsbereich der Landing Page
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <label className="text-sm text-muted-foreground mb-2 block">
                          Seitenname
                        </label>
                        <Input
                          value={pageName}
                          onChange={(e) => {
                            setPageName(e.target.value);
                            setPageSlug(generateSlug(e.target.value));
                          }}
                          placeholder="z.B. Webdesign München"
                          className="bg-white/5 border-white/10"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="text-sm text-muted-foreground mb-2 block">
                          URL-Slug
                        </label>
                        <Input
                          value={pageSlug}
                          onChange={(e) => setPageSlug(generateSlug(e.target.value))}
                          placeholder="webdesign-muenchen"
                          className="bg-white/5 border-white/10"
                        />
                      </div>
                    </div>

                    <Button
                      onClick={handleGenerate}
                      disabled={isGenerating || !prompt.trim() || !senderCompany.trim()}
                      className="w-full gap-2"
                      size="lg"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Generiere Landing Page...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5" />
                          Landing Page generieren
                        </>
                      )}
                    </Button>

                    <div className="pt-4 border-t border-white/10">
                      <h4 className="text-sm font-medium mb-2">Beispiel-Prompts:</h4>
                      <div className="flex flex-wrap gap-2">
                        {[
                          "E-Mail Marketing Automation Agentur",
                          "Webdesign für Restaurants",
                          "Social Media Marketing für Ärzte",
                          "SEO Beratung für E-Commerce",
                        ].map((example) => (
                          <Badge
                            key={example}
                            variant="secondary"
                            className="cursor-pointer hover:bg-primary/20"
                            onClick={() => setPrompt(example)}
                          >
                            {example}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Preview Tab */}
              <TabsContent value="preview">
                <div className="space-y-4">
                  {/* Save Actions */}
                  <Card className="glass-card border-white/10 p-4">
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <Input
                            value={pageName}
                            onChange={(e) => {
                              setPageName(e.target.value);
                              if (!selectedPage) {
                                setPageSlug(generateSlug(e.target.value));
                              }
                            }}
                            placeholder="Seitenname"
                            className="w-48 bg-white/5 border-white/10"
                          />
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>/lp/</span>
                            <Input
                              value={pageSlug}
                              onChange={(e) => setPageSlug(generateSlug(e.target.value))}
                              placeholder="slug"
                              className="w-40 bg-white/5 border-white/10"
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {selectedPage?.status === 'published' && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-2"
                              onClick={() => {
                                const url = `${window.location.origin}/lp/${pageSlug}`;
                                window.open(url, '_blank');
                              }}
                            >
                              <ExternalLink className="w-4 h-4" />
                              Öffnen
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            onClick={() => handleSave(false)}
                            disabled={isSaving}
                            className="gap-2"
                          >
                            <Save className="w-4 h-4" />
                            Speichern
                          </Button>
                          <Button
                            onClick={() => handleSave(true)}
                            disabled={isSaving}
                            className="gap-2"
                          >
                            <Globe className="w-4 h-4" />
                            Veröffentlichen
                          </Button>
                        </div>
                      </div>
                      
                      {/* Calendar URL Input */}
                      <div className="flex items-center gap-3 pt-3 border-t border-white/10">
                        <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
                        <Input
                          value={calendarUrl}
                          onChange={(e) => setCalendarUrl(e.target.value)}
                          placeholder="Calendly/Cal.com Link (z.B. https://calendly.com/dein-name/termin)"
                          className="flex-1 bg-white/5 border-white/10"
                        />
                        {!userCalendarUrl && calendarUrl && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleSaveUserCalendarUrl}
                          >
                            Als Standard speichern
                          </Button>
                        )}
                      </div>
                      {userCalendarUrl && !calendarUrl && (
                        <p className="text-xs text-muted-foreground">
                          Dein Standard-Kalender wird verwendet: {userCalendarUrl}
                        </p>
                      )}
                    </div>
                  </Card>

                  {/* Preview */}
                  <LandingPagePreview 
                    content={content} 
                    styles={styles} 
                    calendarUrl={calendarUrl || userCalendarUrl || undefined}
                  />
                </div>
              </TabsContent>

              {/* Editor Tab */}
              <TabsContent value="editor">
                <LandingPageEditor
                  content={content}
                  styles={styles}
                  onContentChange={setContent}
                  onStylesChange={setStyles}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default LandingPageBuilder;
