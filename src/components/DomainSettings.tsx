import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { Globe, CheckCircle, AlertCircle, Copy, Info } from "lucide-react";
import { useAccountFilter } from "@/hooks/useAccountFilter";

export default function DomainSettings() {
  const { accountId } = useAccountFilter();
  const queryClient = useQueryClient();
  const [domain, setDomain] = useState("");

  const { data: account, isLoading } = useQuery({
    queryKey: ["account-domain", accountId],
    queryFn: async () => {
      if (!accountId) return null;
      const { data, error } = await supabase
        .from("accounts")
        .select("custom_domain")
        .eq("id", accountId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!accountId,
  });

  useEffect(() => {
    if (account?.custom_domain) {
      setDomain(account.custom_domain);
    }
  }, [account]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!accountId) throw new Error("Kein Account");
      
      // Clean domain input (remove https://, trailing slashes)
      const cleanDomain = domain
        .replace(/^https?:\/\//, "")
        .replace(/\/$/, "")
        .trim();

      const { error } = await supabase
        .from("accounts")
        .update({ custom_domain: cleanDomain || null })
        .eq("id", accountId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["account-domain"] });
      toast.success("Domain gespeichert!");
    },
    onError: (error) => {
      toast.error("Fehler: " + error.message);
    },
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("In Zwischenablage kopiert!");
  };

  const isConfigured = !!account?.custom_domain;
  const cleanedDomain = domain.replace(/^https?:\/\//, "").replace(/\/$/, "").trim();

  if (isLoading) {
    return <div>Laden...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          <CardTitle>Custom Domain</CardTitle>
          {isConfigured ? (
            <CheckCircle className="h-5 w-5 text-green-500" />
          ) : (
            <AlertCircle className="h-5 w-5 text-yellow-500" />
          )}
        </div>
        <CardDescription>
          Deine eigene Domain für personalisierte Lead-Seiten
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Deine Domain</Label>
          <div className="flex gap-2">
            <div className="flex items-center bg-muted px-3 rounded-l-md border border-r-0">
              <span className="text-muted-foreground text-sm">https://</span>
            </div>
            <Input
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="leads.meine-firma.de"
              className="rounded-l-none"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            z.B. <code>leads.meine-firma.de</code> oder <code>video.meine-firma.de</code>
          </p>
        </div>

        {cleanedDomain && (
          <>
            {/* DNS Configuration Instructions */}
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>DNS-Einrichtung:</strong> Füge einen A-Record <strong>oder</strong> CNAME-Record bei deinem Domain-Provider hinzu
              </AlertDescription>
            </Alert>

            <div className="space-y-4 p-4 bg-muted/50 rounded-lg border">
              <h4 className="font-medium text-sm">Einrichtung in 2 Schritten:</h4>

              {/* Step 1: Lovable Dashboard */}
              <div className="space-y-2 p-3 bg-background rounded-lg border">
                <span className="text-xs font-semibold text-foreground">Schritt 1: Domain im Hosting hinzufügen</span>
                <p className="text-xs text-muted-foreground">
                  Gehe zu <a href="https://lovable.dev/projects/4f53c2ca-95c3-4d43-b002-3bd9d8e39d32" target="_blank" rel="noopener noreferrer" className="text-primary underline">Lovable Dashboard</a> → Settings → Custom Domains → und füge <code className="bg-muted px-1 rounded">{cleanedDomain}</code> hinzu.
                  Dort erhältst du die korrekten DNS-Einträge.
                </p>
              </div>

              {/* Step 2: DNS */}
              <div className="space-y-2 p-3 bg-background rounded-lg border">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">Schritt 2: CNAME-Record setzen</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2"
                    onClick={() => copyToClipboard(cleanedDomain)}
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    <span className="text-xs">Kopieren</span>
                  </Button>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="p-2 bg-muted rounded border">
                    <p className="text-muted-foreground">Typ</p>
                    <p className="font-mono font-semibold">CNAME</p>
                  </div>
                  <div className="p-2 bg-muted rounded border">
                    <p className="text-muted-foreground">Name/Host</p>
                    <p className="font-mono">{cleanedDomain.includes('.') ? cleanedDomain.split('.')[0] : 'www'}</p>
                  </div>
                  <div className="p-2 bg-muted rounded border">
                    <p className="text-muted-foreground">Wert/Ziel</p>
                    <p className="font-mono text-primary">Den CNAME-Wert aus dem Lovable Dashboard kopieren</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Der CNAME-Wert wird dir im Lovable Dashboard angezeigt, nachdem du die Domain dort hinzugefügt hast. DNS-Änderungen können bis zu 24h dauern.
                </p>
              </div>
            </div>

            {/* Preview */}
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Vorschau personalisierte URL:</p>
              <code className="text-sm text-primary">
                https://{cleanedDomain}/p/max-mustermann-abc
              </code>
            </div>
          </>
        )}

        <Button 
          onClick={() => saveMutation.mutate()} 
          disabled={saveMutation.isPending}
        >
          {saveMutation.isPending ? "Speichert..." : "Domain speichern"}
        </Button>

        {isConfigured && (
          <p className="text-sm text-green-600 flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Domain konfiguriert. Stelle sicher, dass die DNS-Einträge gesetzt sind.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
