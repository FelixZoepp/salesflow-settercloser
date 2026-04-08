import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { Globe, CheckCircle, AlertCircle, Copy, Info, Loader2, RefreshCw } from "lucide-react";
import { useAccountFilter } from "@/hooks/useAccountFilter";

export default function DomainSettings() {
  const { accountId } = useAccountFilter();
  const queryClient = useQueryClient();
  const [domain, setDomain] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<any>(null);

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

  const verifyDomain = async () => {
    const cleanDomain = domain.replace(/^https?:\/\//, "").replace(/\/$/, "").trim();
    if (!cleanDomain) {
      toast.error("Bitte gib zuerst eine Domain ein.");
      return;
    }
    setVerifying(true);
    setVerifyResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("verify-domain", {
        body: { domain: cleanDomain },
      });
      if (error) throw error;
      setVerifyResult(data);
      if (data?.reachable) {
        toast.success("Domain ist erreichbar!");
      } else {
        toast.info(data?.message || "Domain noch nicht erreichbar.");
      }
    } catch (err: any) {
      toast.error("Prüfung fehlgeschlagen: " + err.message);
    } finally {
      setVerifying(false);
    }
  };

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
            z.B. <code>leads.meine-firma.de</code> oder <code>hochpreis-leads.de</code>
          </p>
        </div>

        {cleanedDomain && (
          <>
            {/* DNS Configuration Instructions */}
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>DNS-Einrichtung:</strong> Füge bei deinem Domain-Provider folgende DNS-Einträge hinzu.
              </AlertDescription>
            </Alert>

            <div className="space-y-4 p-4 bg-muted/50 rounded-lg border">
              <h4 className="font-medium text-sm">Einrichtung in 3 Schritten:</h4>

              {/* Step 1: Lovable Dashboard */}
              <div className="space-y-2 p-3 bg-background rounded-lg border">
                <span className="text-xs font-semibold text-foreground">Schritt 1: Domain im Hosting hinzufügen</span>
                <p className="text-xs text-muted-foreground">
                  Gehe zu den <strong>Lovable Projekt-Einstellungen → Domains</strong> und füge <code className="bg-muted px-1 rounded">{cleanedDomain}</code> hinzu.
                  Dort wird die Domain verifiziert und mit deiner App verbunden.
                </p>
              </div>

              {/* Step 2: A-Records */}
              <div className="space-y-2 p-3 bg-background rounded-lg border">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">Schritt 2: DNS A-Records setzen</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2"
                    onClick={() => copyToClipboard("185.158.133.1")}
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    <span className="text-xs">IP kopieren</span>
                  </Button>
                </div>

                {/* A-Record for root */}
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="p-2 bg-muted rounded border">
                    <p className="text-muted-foreground">Typ</p>
                    <p className="font-mono font-semibold">A</p>
                  </div>
                  <div className="p-2 bg-muted rounded border">
                    <p className="text-muted-foreground">Name/Host</p>
                    <p className="font-mono">@</p>
                  </div>
                  <div className="p-2 bg-muted rounded border">
                    <p className="text-muted-foreground">Wert/Ziel</p>
                    <p className="font-mono text-primary">185.158.133.1</p>
                  </div>
                </div>

                {/* A-Record for www */}
                <div className="grid grid-cols-3 gap-2 text-xs mt-2">
                  <div className="p-2 bg-muted rounded border">
                    <p className="text-muted-foreground">Typ</p>
                    <p className="font-mono font-semibold">A</p>
                  </div>
                  <div className="p-2 bg-muted rounded border">
                    <p className="text-muted-foreground">Name/Host</p>
                    <p className="font-mono">www</p>
                  </div>
                  <div className="p-2 bg-muted rounded border">
                    <p className="text-muted-foreground">Wert/Ziel</p>
                    <p className="font-mono text-primary">185.158.133.1</p>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground mt-2">
                  Setze <strong>zwei A-Records</strong> bei deinem Domain-Provider (z.B. IONOS, Strato, Namecheap). DNS-Änderungen können bis zu 24h dauern.
                </p>
              </div>

              {/* Step 3: TXT Record */}
              <div className="space-y-2 p-3 bg-background rounded-lg border">
                <span className="text-xs font-semibold text-foreground">Schritt 3: TXT-Record zur Verifizierung</span>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="p-2 bg-muted rounded border">
                    <p className="text-muted-foreground">Typ</p>
                    <p className="font-mono font-semibold">TXT</p>
                  </div>
                  <div className="p-2 bg-muted rounded border">
                    <p className="text-muted-foreground">Name/Host</p>
                    <p className="font-mono">_lovable</p>
                  </div>
                  <div className="p-2 bg-muted rounded border">
                    <p className="text-muted-foreground">Wert/Ziel</p>
                    <p className="font-mono text-primary text-[10px]">Wert aus den Lovable Projekt-Einstellungen kopieren</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Den TXT-Verifizierungswert findest du in den Lovable Projekt-Einstellungen unter Domains, nachdem du die Domain hinzugefügt hast.
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

        <div className="flex gap-2">
          <Button 
            onClick={() => saveMutation.mutate()} 
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending ? "Speichert..." : "Domain speichern"}
          </Button>

          {cleanedDomain && (
            <Button
              variant="outline"
              onClick={verifyDomain}
              disabled={verifying}
            >
              {verifying ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Prüfe...</>
              ) : (
                <><RefreshCw className="h-4 w-4 mr-2" /> Domain prüfen</>
              )}
            </Button>
          )}
        </div>

        {/* Verify result */}
        {verifyResult && (
          <Alert variant={verifyResult.reachable ? "default" : "destructive"}>
            <AlertDescription className="flex items-center gap-2">
              {verifyResult.reachable ? (
                <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0" />
              )}
              {verifyResult.message}
            </AlertDescription>
          </Alert>
        )}

        {isConfigured && !verifyResult && (
          <p className="text-sm text-green-600 flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Domain konfiguriert. Stelle sicher, dass die DNS-Einträge gesetzt sind.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
