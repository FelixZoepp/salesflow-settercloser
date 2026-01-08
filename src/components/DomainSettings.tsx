import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { Globe, CheckCircle, AlertCircle, ExternalLink, Info } from "lucide-react";
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
      toast.success("Domain gespeichert! Alle Lead-URLs wurden aktualisiert.");
    },
    onError: (error) => {
      toast.error("Fehler: " + error.message);
    },
  });

  const isConfigured = !!account?.custom_domain;

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
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Wichtig:</strong> Du musst deine Domain zuerst in den{" "}
            <strong>Lovable Projekt-Einstellungen → Domains</strong> verbinden,
            bevor sie hier funktioniert.{" "}
            <a
              href="https://docs.lovable.dev/features/custom-domain"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline inline-flex items-center gap-1"
            >
              Anleitung lesen
              <ExternalLink className="h-3 w-3" />
            </a>
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <Label>Deine Domain</Label>
          <div className="flex gap-2">
            <div className="flex items-center bg-muted px-3 rounded-l-md border border-r-0">
              <span className="text-muted-foreground text-sm">https://</span>
            </div>
            <Input
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="meine-domain.de"
              className="rounded-l-none"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            z.B. <code>meine-firma.de</code> oder <code>leads.meine-firma.de</code>
          </p>
        </div>

        {domain && (
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Vorschau personalisierte URL:</p>
            <code className="text-sm text-primary">
              https://{domain.replace(/^https?:\/\//, "").replace(/\/$/, "")}/p/max-mustermann-abc
            </code>
          </div>
        )}

        <Button 
          onClick={() => saveMutation.mutate()} 
          disabled={saveMutation.isPending}
        >
          {saveMutation.isPending ? "Speichert..." : "Speichern"}
        </Button>

        {isConfigured && (
          <p className="text-sm text-green-600 flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Domain aktiv. Alle neuen Leads bekommen URLs mit dieser Domain.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
