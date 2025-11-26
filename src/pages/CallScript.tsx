import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useUserRole } from "@/hooks/useUserRole";

interface CallScript {
  id: string;
  name: string;
  content: string;
  is_active: boolean;
}

export default function CallScript() {
  const [script, setScript] = useState<CallScript | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { role } = useUserRole();

  useEffect(() => {
    fetchScript();
  }, []);

  const fetchScript = async () => {
    try {
      const { data, error } = await supabase
        .from('call_scripts')
        .select('*')
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;
      setScript(data);
    } catch (error) {
      console.error('Error fetching script:', error);
      toast.error("Fehler beim Laden des Scripts");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!script) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('call_scripts')
        .update({
          name: script.name,
          content: script.content,
        })
        .eq('id', script.id);

      if (error) throw error;
      
      toast.success("Script erfolgreich gespeichert");
    } catch (error) {
      console.error('Error saving script:', error);
      toast.error("Fehler beim Speichern");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <p className="text-muted-foreground">Lädt...</p>
        </div>
      </Layout>
    );
  }

  if (role !== 'admin') {
    return (
      <Layout>
        <div className="p-8">
          <Alert variant="destructive">
            <AlertDescription>
              Nur Administratoren können Call-Scripts bearbeiten.
            </AlertDescription>
          </Alert>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Call-Script Verwaltung</h1>
          <p className="text-muted-foreground">
            Verwalten Sie das globale Opening-Script für alle Calls
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Verfügbare Tags</CardTitle>
            <CardDescription>
              Verwenden Sie diese dynamischen Platzhalter in Ihrem Script
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div>
                <strong>Kontakt:</strong>
                <ul className="mt-2 space-y-1 text-muted-foreground">
                  <li><code>{'{{first_name}}'}</code></li>
                  <li><code>{'{{last_name}}'}</code></li>
                  <li><code>{'{{email}}'}</code></li>
                  <li><code>{'{{phone}}'}</code></li>
                  <li><code>{'{{position}}'}</code></li>
                </ul>
              </div>
              <div>
                <strong>Firma:</strong>
                <ul className="mt-2 space-y-1 text-muted-foreground">
                  <li><code>{'{{company_name}}'}</code></li>
                  <li><code>{'{{website}}'}</code></li>
                  <li><code>{'{{company_phone}}'}</code></li>
                  <li><code>{'{{city}}'}</code></li>
                </ul>
              </div>
              <div>
                <strong>Sonstiges:</strong>
                <ul className="mt-2 space-y-1 text-muted-foreground">
                  <li><code>{'{{user_name}}'}</code></li>
                  <li><code>{'{{source}}'}</code></li>
                  <li><code>{'{{stage}}'}</code></li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {script && (
          <Card>
            <CardHeader>
              <CardTitle>Script bearbeiten</CardTitle>
              <CardDescription>
                Dieses Script wird bei jedem Lead angezeigt und automatisch mit Lead-Daten gefüllt
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Script-Name</Label>
                <Input
                  id="name"
                  value={script.name}
                  onChange={(e) => setScript({ ...script, name: e.target.value })}
                  placeholder="z.B. Standard Opening Script"
                />
              </div>

              <div>
                <Label htmlFor="content">Script-Inhalt</Label>
                <Textarea
                  id="content"
                  value={script.content}
                  onChange={(e) => setScript({ ...script, content: e.target.value })}
                  rows={15}
                  placeholder="Guten Tag {{first_name}} {{last_name}}..."
                  className="font-mono"
                />
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Verwenden Sie die Tags aus der Liste oben, um dynamische Werte einzufügen.
                  Diese werden automatisch mit den Lead-Informationen ersetzt.
                </AlertDescription>
              </Alert>

              <Button onClick={handleSave} disabled={saving} className="w-full">
                {saving ? (
                  <>Speichert...</>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Script speichern
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}