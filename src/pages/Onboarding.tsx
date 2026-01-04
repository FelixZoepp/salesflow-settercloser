import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAccountFilter } from "@/hooks/useAccountFilter";
import { useOnboarding } from "@/hooks/useOnboarding";
import { Json } from "@/integrations/supabase/types";
import { 
  CheckCircle2, 
  Circle, 
  ArrowRight, 
  Key, 
  User, 
  Mic, 
  Video, 
  Upload, 
  Users, 
  FileText,
  Loader2,
  ExternalLink,
  Eye,
  EyeOff,
  Sparkles,
  Rocket,
  Globe,
  Wand2,
  Palette,
  Calendar
} from "lucide-react";
import { LandingPagePreview } from "@/components/landing-builder/LandingPagePreview";

const STEP_TITLES = [
  "HeyGen Integration",
  "Pitch-Video hochladen",
  "Leads importieren",
  "Vertriebsskript erstellen",
  "Landing Page erstellen"
];

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
}

interface LandingPageStyles {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  fontFamily: string;
}

const defaultStyles: LandingPageStyles = {
  primaryColor: "#3b82f6",
  secondaryColor: "#1e40af",
  accentColor: "#f97316",
  backgroundColor: "#ffffff",
  textColor: "#1f2937",
  fontFamily: "Inter"
};

const Onboarding = () => {
  const navigate = useNavigate();
  const { accountId, loading: accountLoading } = useAccountFilter();
  const { status, loading: onboardingLoading, refresh } = useOnboarding();
  const [activeStep, setActiveStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // Step 1: HeyGen
  const [apiKey, setApiKey] = useState("");
  const [avatarId, setAvatarId] = useState("");
  const [voiceId, setVoiceId] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);

  // Step 2: Pitch Video
  const [campaignName, setCampaignName] = useState("Meine erste Kampagne");
  const [pitchVideoUrl, setPitchVideoUrl] = useState("");

  // Step 3: Leads (will redirect to import page)

  // Step 4: Script
  const [scriptName, setScriptName] = useState("Standard Opening Script");
  const [scriptContent, setScriptContent] = useState(`Guten Tag {{first_name}} {{last_name}},

hier ist [Ihr Name] von [Ihrer Firma].

Ich rufe an, weil ich mir Ihre Webseite bei {{company_name}} angeschaut habe und mir aufgefallen ist, dass...

[Ihr individueller Pitch]

Hätten Sie kurz Zeit für ein Gespräch?`);

  // Step 5: Landing Page
  const [landingPagePrompt, setLandingPagePrompt] = useState("");
  const [landingPageName, setLandingPageName] = useState("");
  const [generatedContent, setGeneratedContent] = useState<LandingPageContent | null>(null);
  const [generatedStyles, setGeneratedStyles] = useState<LandingPageStyles | null>(null);
  const [generating, setGenerating] = useState(false);
  const [calendarUrl, setCalendarUrl] = useState("");

  useEffect(() => {
    if (!onboardingLoading) {
      // Set active step to the first incomplete step
      if (!status.steps.heygen) setActiveStep(0);
      else if (!status.steps.pitchVideo) setActiveStep(1);
      else if (!status.steps.leads) setActiveStep(2);
      else if (!status.steps.script) setActiveStep(3);
      else if (!status.steps.landingPage) setActiveStep(4);
      else setActiveStep(4);
    }
  }, [status, onboardingLoading]);

  const handleSaveHeyGen = async () => {
    if (!accountId) return;
    
    if (!apiKey || !avatarId) {
      toast.error("Bitte API Key und Avatar ID eingeben");
      return;
    }

    setSaving(true);
    try {
      // Save API key via edge function
      const { error: keyError } = await supabase.functions.invoke('save-heygen-key', {
        body: { accountId, apiKey },
      });
      if (keyError) throw keyError;

      // Save avatar/voice IDs
      const { error } = await supabase
        .from('account_integrations')
        .upsert({
          account_id: accountId,
          heygen_avatar_id: avatarId || null,
          heygen_voice_id: voiceId || null,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'account_id' });

      if (error) throw error;

      toast.success("HeyGen Integration gespeichert!");
      await refresh();
      setActiveStep(1);
    } catch (error) {
      toast.error("Fehler beim Speichern");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCampaign = async () => {
    if (!accountId) return;
    
    if (!campaignName || !pitchVideoUrl) {
      toast.error("Bitte Kampagnenname und Video-URL eingeben");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('campaigns')
        .insert({
          account_id: accountId,
          name: campaignName,
          pitch_video_url: pitchVideoUrl,
          status: 'active',
        });

      if (error) throw error;

      toast.success("Kampagne erstellt!");
      await refresh();
      setActiveStep(2);
    } catch (error) {
      toast.error("Fehler beim Erstellen der Kampagne");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveScript = async () => {
    if (!accountId) return;
    
    if (!scriptName || !scriptContent) {
      toast.error("Bitte Skriptname und Inhalt eingeben");
      return;
    }

    setSaving(true);
    try {
      // First, deactivate any existing scripts
      await supabase
        .from('call_scripts')
        .update({ is_active: false })
        .eq('account_id', accountId);

      // Create new script
      const { error } = await supabase
        .from('call_scripts')
        .insert({
          account_id: accountId,
          name: scriptName,
          content: scriptContent,
          is_active: true,
        });

      if (error) throw error;

      toast.success("Vertriebsskript erstellt!");
      await refresh();
      setActiveStep(4);
    } catch (error) {
      toast.error("Fehler beim Erstellen des Skripts");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateLandingPage = async () => {
    if (!landingPagePrompt.trim()) {
      toast.error("Bitte beschreibe deine Landing Page");
      return;
    }

    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-landing-page', {
        body: { prompt: landingPagePrompt },
      });

      if (error) throw error;

      setGeneratedContent(data.content);
      setGeneratedStyles(data.styles);
      
      // Auto-generate name from headline if not set
      if (!landingPageName && data.content?.hero?.headline) {
        setLandingPageName(data.content.hero.headline.slice(0, 50));
      }

      toast.success("Landing Page generiert!");
    } catch (error) {
      console.error(error);
      toast.error("Fehler bei der Generierung");
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveLandingPage = async (publish: boolean = false) => {
    if (!generatedContent || !landingPageName) {
      toast.error("Bitte generiere zuerst eine Landing Page und gib einen Namen ein");
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Nicht angemeldet");

      // Save calendar URL to profile if provided
      if (calendarUrl) {
        await supabase
          .from('profiles')
          .update({ calendar_url: calendarUrl })
          .eq('id', user.id);
      }

      const slug = landingPageName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
        + '-' + Date.now().toString(36);

      const { error } = await supabase
        .from('landing_pages')
        .insert({
          user_id: user.id,
          account_id: accountId,
          name: landingPageName,
          slug,
          prompt: landingPagePrompt,
          content: generatedContent as unknown as Json,
          styles: (generatedStyles || defaultStyles) as unknown as Json,
          status: publish ? 'published' : 'draft',
          published_at: publish ? new Date().toISOString() : null,
          calendar_url: calendarUrl || null,
        });

      if (error) throw error;

      toast.success(publish ? "Landing Page veröffentlicht!" : "Landing Page gespeichert!");
      await refresh();
    } catch (error) {
      console.error(error);
      toast.error("Fehler beim Speichern");
    } finally {
      setSaving(false);
    }
  };

  const completedSteps = Object.values(status.steps).filter(Boolean).length;
  const progressPercent = (completedSteps / 5) * 100;

  if (accountLoading || onboardingLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </Layout>
    );
  }

  if (status.isComplete) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto p-6 space-y-6">
          <Card className="border-green-500/50 bg-green-500/5">
            <CardContent className="p-8 text-center space-y-4">
              <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
                <Rocket className="h-10 w-10 text-green-500" />
              </div>
              <h1 className="text-3xl font-bold">Onboarding abgeschlossen! 🎉</h1>
              <p className="text-muted-foreground">
                Du hast alle Schritte erfolgreich durchgeführt und bist bereit, 
                personalisierte Videos für deine Leads zu erstellen.
              </p>
              <div className="flex gap-4 justify-center pt-4">
                <Button onClick={() => navigate('/campaigns')}>
                  Zu den Kampagnen
                </Button>
                <Button variant="outline" onClick={() => navigate('/landing-builder')}>
                  Landing Pages verwalten
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 text-primary">
            <Sparkles className="h-6 w-6" />
            <span className="text-sm font-medium">Willkommen bei Content Leads</span>
          </div>
          <h1 className="text-3xl font-bold">Setup-Assistent</h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Richte dein System in wenigen Schritten ein, um personalisierte Videos für deine Leads zu erstellen.
          </p>
        </div>

        {/* Progress */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Fortschritt</span>
              <span className="text-sm text-muted-foreground">{completedSteps} von 5 Schritten</span>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </CardContent>
        </Card>

        {/* Steps */}
        <div className="grid grid-cols-5 gap-2">
          {STEP_TITLES.map((title, index) => {
            const stepKeys = ['heygen', 'pitchVideo', 'leads', 'script', 'landingPage'] as const;
            const isComplete = status.steps[stepKeys[index]];
            const isActive = activeStep === index;
            
            return (
              <button
                key={index}
                onClick={() => setActiveStep(index)}
                className={`p-3 rounded-lg text-center transition-all ${
                  isActive 
                    ? 'bg-primary text-primary-foreground' 
                    : isComplete 
                      ? 'bg-green-500/10 text-green-600 hover:bg-green-500/20' 
                      : 'bg-muted hover:bg-muted/80'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  {isComplete ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <Circle className="h-4 w-4" />
                  )}
                  <span className="text-xs font-medium hidden lg:inline">{title}</span>
                  <span className="text-sm font-medium lg:hidden">{index + 1}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Step Content */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              {activeStep === 0 && <Key className="h-6 w-6 text-primary" />}
              {activeStep === 1 && <Video className="h-6 w-6 text-primary" />}
              {activeStep === 2 && <Users className="h-6 w-6 text-primary" />}
              {activeStep === 3 && <FileText className="h-6 w-6 text-primary" />}
              {activeStep === 4 && <Globe className="h-6 w-6 text-primary" />}
              <div>
                <CardTitle>Schritt {activeStep + 1}: {STEP_TITLES[activeStep]}</CardTitle>
                <CardDescription>
                  {activeStep === 0 && "Verbinde dein HeyGen-Konto für personalisierte Avatar-Videos"}
                  {activeStep === 1 && "Lade dein 2-Minuten Pitch-Video hoch"}
                  {activeStep === 2 && "Importiere deine Leads per CSV oder manuell"}
                  {activeStep === 3 && "Erstelle ein Skript für deine Vertriebsanrufe"}
                  {activeStep === 4 && "Erstelle eine KI-generierte Landing Page für deine Kampagne"}
                </CardDescription>
              </div>
              {(() => {
                const stepKeys = ['heygen', 'pitchVideo', 'leads', 'script', 'landingPage'] as const;
                return status.steps[stepKeys[activeStep]] && (
                  <Badge className="ml-auto bg-green-500/20 text-green-600">
                    <CheckCircle2 className="h-3 w-3 mr-1" /> Abgeschlossen
                  </Badge>
                );
              })()}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Step 1: HeyGen */}
            {activeStep === 0 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="apiKey" className="flex items-center gap-2">
                    <Key className="h-4 w-4" />
                    API Key
                  </Label>
                  <div className="relative">
                    <Input
                      id="apiKey"
                      type={showApiKey ? "text" : "password"}
                      placeholder="Dein HeyGen API Key"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowApiKey(!showApiKey)}
                    >
                      {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Finde deinen API Key in den{" "}
                    <a 
                      href="https://app.heygen.com/settings?nav=API" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline inline-flex items-center gap-1"
                    >
                      HeyGen Einstellungen <ExternalLink className="h-3 w-3" />
                    </a>
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="avatarId" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Avatar ID
                  </Label>
                  <Input
                    id="avatarId"
                    placeholder="z.B. avatar_abc123..."
                    value={avatarId}
                    onChange={(e) => setAvatarId(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="voiceId" className="flex items-center gap-2">
                    <Mic className="h-4 w-4" />
                    Voice ID (optional)
                  </Label>
                  <Input
                    id="voiceId"
                    placeholder="z.B. voice_xyz789..."
                    value={voiceId}
                    onChange={(e) => setVoiceId(e.target.value)}
                  />
                </div>

                <Button 
                  onClick={handleSaveHeyGen} 
                  disabled={saving || !apiKey || !avatarId}
                  className="w-full"
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  HeyGen speichern & weiter
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </>
            )}

            {/* Step 2: Pitch Video */}
            {activeStep === 1 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="campaignName">Kampagnenname</Label>
                  <Input
                    id="campaignName"
                    placeholder="z.B. LinkedIn Outreach Q1"
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pitchVideoUrl" className="flex items-center gap-2">
                    <Video className="h-4 w-4" />
                    Pitch-Video URL
                  </Label>
                  <Input
                    id="pitchVideoUrl"
                    placeholder="https://... (z.B. von Vimeo, YouTube, oder direkte URL)"
                    value={pitchVideoUrl}
                    onChange={(e) => setPitchVideoUrl(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Lade dein 2-Minuten Pitch-Video auf einen Video-Host hoch und füge die URL hier ein.
                    Das Video wird nach dem personalisierten Intro abgespielt.
                  </p>
                </div>

                <Button 
                  onClick={handleSaveCampaign} 
                  disabled={saving || !campaignName || !pitchVideoUrl}
                  className="w-full"
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Kampagne erstellen & weiter
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </>
            )}

            {/* Step 3: Leads */}
            {activeStep === 2 && (
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  Importiere deine Lead-Liste per CSV-Datei oder lege Leads manuell an.
                </p>

                <div className="grid grid-cols-2 gap-4">
                  <Button 
                    variant="outline" 
                    className="h-24 flex-col gap-2"
                    onClick={() => navigate('/import-leads')}
                  >
                    <Upload className="h-6 w-6" />
                    CSV importieren
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-24 flex-col gap-2"
                    onClick={() => navigate('/contacts')}
                  >
                    <Users className="h-6 w-6" />
                    Leads manuell anlegen
                  </Button>
                </div>

                {status.steps.leads && (
                  <Button 
                    onClick={() => setActiveStep(3)}
                    className="w-full"
                  >
                    Weiter zum nächsten Schritt
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                )}
              </div>
            )}

            {/* Step 4: Script */}
            {activeStep === 3 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="scriptName">Skript-Name</Label>
                  <Input
                    id="scriptName"
                    placeholder="z.B. Standard Opening Script"
                    value={scriptName}
                    onChange={(e) => setScriptName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="scriptContent">Skript-Inhalt</Label>
                  <Textarea
                    id="scriptContent"
                    rows={10}
                    value={scriptContent}
                    onChange={(e) => setScriptContent(e.target.value)}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Verfügbare Platzhalter: {`{{first_name}}, {{last_name}}, {{company_name}}, {{email}}, {{position}}`}
                  </p>
                </div>

                <Button 
                  onClick={handleSaveScript} 
                  disabled={saving || !scriptName || !scriptContent}
                  className="w-full"
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Skript speichern & weiter
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </>
            )}

            {/* Step 5: Landing Page */}
            {activeStep === 4 && (
              <div className="space-y-6">
                {!generatedContent ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="landingPagePrompt" className="flex items-center gap-2">
                        <Wand2 className="h-4 w-4" />
                        Beschreibe deine Landing Page
                      </Label>
                      <Textarea
                        id="landingPagePrompt"
                        rows={4}
                        placeholder="z.B. Eine Landing Page für eine Webdesign-Agentur, die sich auf E-Commerce-Shops spezialisiert hat. Zielgruppe sind mittelständische Unternehmen, die ihren Online-Shop modernisieren möchten."
                        value={landingPagePrompt}
                        onChange={(e) => setLandingPagePrompt(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Je detaillierter du beschreibst, desto besser wird das Ergebnis. 
                        Erwähne deine Branche, Zielgruppe und wichtige Vorteile.
                      </p>
                    </div>

                    <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                      <h4 className="font-medium text-sm">Beispiel-Prompts:</h4>
                      <div className="grid gap-2">
                        {[
                          "Landing Page für eine Prozessautomatisierungs-Agentur zum Thema E-Mail Marketing Automation",
                          "Webseite für eine Webdesign-Agentur mit Fokus auf moderne, conversion-optimierte Designs",
                          "Landing Page für einen Coaching-Anbieter für Führungskräfte-Entwicklung"
                        ].map((example, i) => (
                          <button
                            key={i}
                            onClick={() => setLandingPagePrompt(example)}
                            className="text-left text-sm text-muted-foreground hover:text-foreground p-2 rounded hover:bg-muted transition-colors"
                          >
                            → {example}
                          </button>
                        ))}
                      </div>
                    </div>

                    <Button 
                      onClick={handleGenerateLandingPage} 
                      disabled={generating || !landingPagePrompt.trim()}
                      className="w-full"
                      size="lg"
                    >
                      {generating ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          KI generiert deine Seite...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-2" />
                          Landing Page generieren
                        </>
                      )}
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold flex items-center gap-2">
                        <Palette className="h-5 w-5" />
                        Vorschau deiner Landing Page
                      </h3>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setGeneratedContent(null);
                          setGeneratedStyles(null);
                        }}
                      >
                        Neu generieren
                      </Button>
                    </div>

                    <div className="border rounded-lg overflow-hidden max-h-[400px] overflow-y-auto">
                      <LandingPagePreview 
                        content={generatedContent} 
                        styles={generatedStyles || defaultStyles}
                        calendarUrl={calendarUrl || undefined}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="landingPageName">Name der Landing Page</Label>
                      <Input
                        id="landingPageName"
                        placeholder="z.B. E-Mail Marketing Automation"
                        value={landingPageName}
                        onChange={(e) => setLandingPageName(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="calendarUrl" className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Kalender-Link (Calendly / Cal.com)
                      </Label>
                      <Input
                        id="calendarUrl"
                        placeholder="https://calendly.com/dein-name/termin"
                        value={calendarUrl}
                        onChange={(e) => setCalendarUrl(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Leads können direkt auf deiner Landing Page einen Termin buchen
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <Button 
                        variant="outline"
                        onClick={() => handleSaveLandingPage(false)} 
                        disabled={saving || !landingPageName}
                      >
                        {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                        Als Entwurf speichern
                      </Button>
                      <Button 
                        onClick={() => handleSaveLandingPage(true)} 
                        disabled={saving || !landingPageName}
                      >
                        {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                        Veröffentlichen & abschließen
                        <CheckCircle2 className="h-4 w-4 ml-2" />
                      </Button>
                    </div>

                    <p className="text-xs text-muted-foreground text-center">
                      Nach dem Speichern kannst du die Seite im Landing Page Builder weiter anpassen.
                    </p>
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Skip for now */}
        <div className="text-center">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/dashboard')}
            className="text-muted-foreground"
          >
            Später fortsetzen
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default Onboarding;