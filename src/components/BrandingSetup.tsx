import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAccountFilter } from "@/hooks/useAccountFilter";
import { Json } from "@/integrations/supabase/types";
import { 
  Palette, 
  Building2, 
  FileText, 
  Plus, 
  X, 
  Sparkles,
  Loader2,
  Upload,
  ImageIcon,
  Trash2
} from "lucide-react";

interface CaseStudy {
  title: string;
  description: string;
  result: string;
}

interface BrandingData {
  logo_url: string;
  primary_brand_color: string;
  secondary_brand_color: string;
  service_description: string;
  case_studies: CaseStudy[];
  unique_selling_points: string[];
  target_audience: string;
  tagline: string;
}

interface BrandingSetupProps {
  onSave?: () => void;
  showCard?: boolean;
}

export const BrandingSetup = ({ onSave, showCard = true }: BrandingSetupProps) => {
  const { accountId, loading: accountLoading } = useAccountFilter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [branding, setBranding] = useState<BrandingData>({
    logo_url: "",
    primary_brand_color: "#06b6d4",
    secondary_brand_color: "#a855f7",
    service_description: "",
    case_studies: [],
    unique_selling_points: [],
    target_audience: "",
    tagline: "",
  });

  const [newUsp, setNewUsp] = useState("");
  const [newCaseStudy, setNewCaseStudy] = useState<CaseStudy>({
    title: "",
    description: "",
    result: "",
  });

  useEffect(() => {
    if (accountId) {
      fetchBranding();
    }
  }, [accountId]);

  const fetchBranding = async () => {
    if (!accountId) return;
    
    try {
      const { data, error } = await supabase
        .from("accounts")
        .select("logo_url, primary_brand_color, secondary_brand_color, service_description, case_studies, unique_selling_points, target_audience, tagline")
        .eq("id", accountId)
        .single();

      if (error) throw error;

      if (data) {
        setBranding({
          logo_url: data.logo_url || "",
          primary_brand_color: data.primary_brand_color || "#06b6d4",
          secondary_brand_color: data.secondary_brand_color || "#a855f7",
          service_description: data.service_description || "",
          case_studies: Array.isArray(data.case_studies) 
            ? (data.case_studies as unknown as CaseStudy[]) 
            : [],
          unique_selling_points: data.unique_selling_points || [],
          target_audience: data.target_audience || "",
          tagline: data.tagline || "",
        });
      }
    } catch (error) {
      console.error("Error fetching branding:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!accountId) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("accounts")
        .update({
          logo_url: branding.logo_url || null,
          primary_brand_color: branding.primary_brand_color,
          secondary_brand_color: branding.secondary_brand_color,
          service_description: branding.service_description || null,
          case_studies: branding.case_studies as unknown as Json,
          unique_selling_points: branding.unique_selling_points,
          target_audience: branding.target_audience || null,
          tagline: branding.tagline || null,
        })
        .eq("id", accountId);

      if (error) throw error;

      toast.success("Branding gespeichert!");
      onSave?.();
    } catch (error) {
      console.error("Error saving branding:", error);
      toast.error("Fehler beim Speichern");
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (file: File) => {
    if (!accountId) return;
    
    if (!file.type.startsWith('image/')) {
      toast.error("Bitte nur Bilddateien hochladen");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Maximale Dateigröße: 5MB");
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${accountId}/logo-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('account-logos')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('account-logos')
        .getPublicUrl(fileName);

      setBranding(prev => ({ ...prev, logo_url: publicUrl }));
      toast.success("Logo hochgeladen!");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Fehler beim Hochladen");
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleLogoUpload(file);
    }
  }, [accountId]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleLogoUpload(file);
    }
  };

  const removeLogo = () => {
    setBranding(prev => ({ ...prev, logo_url: "" }));
  };

  const addUsp = () => {
    if (newUsp.trim()) {
      setBranding(prev => ({
        ...prev,
        unique_selling_points: [...prev.unique_selling_points, newUsp.trim()],
      }));
      setNewUsp("");
    }
  };

  const removeUsp = (index: number) => {
    setBranding(prev => ({
      ...prev,
      unique_selling_points: prev.unique_selling_points.filter((_, i) => i !== index),
    }));
  };

  const addCaseStudy = () => {
    if (newCaseStudy.title.trim() && newCaseStudy.result.trim()) {
      setBranding(prev => ({
        ...prev,
        case_studies: [...prev.case_studies, { ...newCaseStudy }],
      }));
      setNewCaseStudy({ title: "", description: "", result: "" });
    }
  };

  const removeCaseStudy = (index: number) => {
    setBranding(prev => ({
      ...prev,
      case_studies: prev.case_studies.filter((_, i) => i !== index),
    }));
  };

  if (accountLoading || loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  const content = (
    <div className="space-y-8">
      {/* Basic Info Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-lg font-semibold">
          <Building2 className="h-5 w-5 text-primary" />
          <span>Grundlegende Informationen</span>
        </div>
        
        {/* Logo Upload Section */}
        <div className="space-y-2">
          <Label>Logo</Label>
          {branding.logo_url ? (
            <div className="flex items-center gap-4 p-4 border rounded-lg bg-muted/30">
              <div className="h-16 w-16 rounded-lg border bg-background flex items-center justify-center overflow-hidden">
                <img 
                  src={branding.logo_url} 
                  alt="Logo" 
                  className="h-full w-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '';
                    (e.target as HTMLImageElement).alt = 'Fehler beim Laden';
                  }}
                />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Logo hochgeladen</p>
                <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                  {branding.logo_url.split('/').pop()}
                </p>
              </div>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={removeLogo}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`
                relative border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer
                ${isDragging 
                  ? 'border-primary bg-primary/5' 
                  : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30'
                }
              `}
            >
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              {uploading ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Wird hochgeladen...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                    <Upload className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      Logo hierher ziehen oder <span className="text-primary">klicken</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      PNG, JPG, SVG bis 5MB
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="tagline">Tagline / Slogan</Label>
            <Input
              id="tagline"
              value={branding.tagline}
              onChange={(e) => setBranding(prev => ({ ...prev, tagline: e.target.value }))}
              placeholder="z.B. 'Mehr Termine. Weniger Aufwand.'"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="target_audience">Zielgruppe</Label>
            <Input
              id="target_audience"
              value={branding.target_audience}
              onChange={(e) => setBranding(prev => ({ ...prev, target_audience: e.target.value }))}
              placeholder="z.B. 'B2B SaaS-Unternehmen mit 10-100 Mitarbeitern'"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="service_description">Dienstleistung / Produkt</Label>
          <Textarea
            id="service_description"
            value={branding.service_description}
            onChange={(e) => setBranding(prev => ({ ...prev, service_description: e.target.value }))}
            placeholder="Beschreibe kurz, was du anbietest. Dies wird auf den Lead-Seiten verwendet."
            rows={3}
          />
        </div>
      </div>

      {/* Colors Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-lg font-semibold">
          <Palette className="h-5 w-5 text-primary" />
          <span>Markenfarben</span>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="primary_color">Primärfarbe</Label>
            <div className="flex gap-2">
              <Input
                id="primary_color"
                type="color"
                value={branding.primary_brand_color}
                onChange={(e) => setBranding(prev => ({ ...prev, primary_brand_color: e.target.value }))}
                className="w-16 h-10 p-1 cursor-pointer"
              />
              <Input
                value={branding.primary_brand_color}
                onChange={(e) => setBranding(prev => ({ ...prev, primary_brand_color: e.target.value }))}
                placeholder="#06b6d4"
                className="flex-1"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="secondary_color">Sekundärfarbe</Label>
            <div className="flex gap-2">
              <Input
                id="secondary_color"
                type="color"
                value={branding.secondary_brand_color}
                onChange={(e) => setBranding(prev => ({ ...prev, secondary_brand_color: e.target.value }))}
                className="w-16 h-10 p-1 cursor-pointer"
              />
              <Input
                value={branding.secondary_brand_color}
                onChange={(e) => setBranding(prev => ({ ...prev, secondary_brand_color: e.target.value }))}
                placeholder="#a855f7"
                className="flex-1"
              />
            </div>
          </div>
        </div>
      </div>

      {/* USPs Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-lg font-semibold">
          <Sparkles className="h-5 w-5 text-primary" />
          <span>Alleinstellungsmerkmale (USPs)</span>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {branding.unique_selling_points.map((usp, index) => (
            <Badge key={index} variant="secondary" className="py-1.5 px-3 text-sm">
              {usp}
              <button
                onClick={() => removeUsp(index)}
                className="ml-2 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>

        <div className="flex gap-2">
          <Input
            value={newUsp}
            onChange={(e) => setNewUsp(e.target.value)}
            placeholder="z.B. '10+ Jahre Erfahrung'"
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addUsp())}
          />
          <Button type="button" variant="outline" onClick={addUsp}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Case Studies Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-lg font-semibold">
          <FileText className="h-5 w-5 text-primary" />
          <span>Fallstudien / Referenzen</span>
        </div>

        {branding.case_studies.length > 0 && (
          <div className="space-y-3">
            {branding.case_studies.map((cs, index) => (
              <Card key={index} className="relative">
                <button
                  onClick={() => removeCaseStudy(index)}
                  className="absolute top-2 right-2 p-1 hover:bg-destructive/10 rounded"
                >
                  <X className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                </button>
                <CardContent className="pt-4">
                  <p className="font-medium">{cs.title}</p>
                  {cs.description && (
                    <p className="text-sm text-muted-foreground mt-1">{cs.description}</p>
                  )}
                  <p className="text-sm text-primary mt-2 font-medium">
                    Ergebnis: {cs.result}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Card className="border-dashed">
          <CardContent className="pt-4 space-y-3">
            <Input
              value={newCaseStudy.title}
              onChange={(e) => setNewCaseStudy(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Kunde / Projekt"
            />
            <Textarea
              value={newCaseStudy.description}
              onChange={(e) => setNewCaseStudy(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Kurze Beschreibung (optional)"
              rows={2}
            />
            <Input
              value={newCaseStudy.result}
              onChange={(e) => setNewCaseStudy(prev => ({ ...prev, result: e.target.value }))}
              placeholder="Ergebnis (z.B. '+50% Umsatz')"
            />
            <Button 
              type="button" 
              variant="outline" 
              onClick={addCaseStudy}
              disabled={!newCaseStudy.title.trim() || !newCaseStudy.result.trim()}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Fallstudie hinzufügen
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Save Button */}
      <Button onClick={handleSave} disabled={saving} className="w-full">
        {saving ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Speichert...
          </>
        ) : (
          "Branding speichern"
        )}
      </Button>
    </div>
  );

  if (!showCard) {
    return content;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Lead-Seite Anpassen
        </CardTitle>
        <CardDescription>
          Passe deine Lead-Seiten mit deinem Branding, Dienstleistung und Fallstudien an
        </CardDescription>
      </CardHeader>
      <CardContent>{content}</CardContent>
    </Card>
  );
};

export default BrandingSetup;
