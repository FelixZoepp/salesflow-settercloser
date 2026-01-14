import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAccountFilter } from "@/hooks/useAccountFilter";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Key, User, Mic, Eye, EyeOff, CheckCircle, AlertCircle, ExternalLink } from "lucide-react";
import SmtpSettings from "@/components/SmtpSettings";
import DomainSettings from "@/components/DomainSettings";
import SipProviderSettings from "@/components/SipProviderSettings";

const Integrations = () => {
  const { accountId, loading: accountLoading } = useAccountFilter();
  const queryClient = useQueryClient();

  const [apiKey, setApiKey] = useState("");
  const [avatarId, setAvatarId] = useState("");
  const [voiceId, setVoiceId] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [hasExistingKey, setHasExistingKey] = useState(false);

  // Fetch existing integration settings
  const { data: integration, isLoading } = useQuery({
    queryKey: ['account-integrations', accountId],
    queryFn: async () => {
      if (!accountId) return null;
      
      const { data, error } = await supabase
        .from('account_integrations')
        .select('*')
        .eq('account_id', accountId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!accountId,
  });

  // Check if API key exists (without revealing it)
  const { data: keyStatus } = useQuery({
    queryKey: ['heygen-key-status', accountId],
    queryFn: async () => {
      if (!accountId) return { hasKey: false };
      
      const { data, error } = await supabase.functions.invoke('check-heygen-key', {
        body: { accountId },
      });

      if (error) {
        console.error('Error checking key status:', error);
        return { hasKey: false };
      }
      return data;
    },
    enabled: !!accountId,
  });

  useEffect(() => {
    if (integration) {
      setAvatarId(integration.heygen_avatar_id || "");
      setVoiceId(integration.heygen_voice_id || "");
    }
    if (keyStatus) {
      setHasExistingKey(keyStatus.hasKey);
    }
  }, [integration, keyStatus]);

  // Save integration settings
  const saveSettings = useMutation({
    mutationFn: async () => {
      if (!accountId) throw new Error('Kein Account gefunden');

      // Save API key if provided (via edge function for encryption)
      if (apiKey) {
        const { error: keyError } = await supabase.functions.invoke('save-heygen-key', {
          body: { 
            accountId,
            apiKey,
          },
        });
        if (keyError) throw keyError;
      }

      // Save/update other settings
      const { error } = await supabase
        .from('account_integrations')
        .upsert({
          account_id: accountId,
          heygen_avatar_id: avatarId || null,
          heygen_voice_id: voiceId || null,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'account_id',
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Einstellungen gespeichert!');
      setApiKey(""); // Clear API key input after save
      queryClient.invalidateQueries({ queryKey: ['account-integrations', accountId] });
      queryClient.invalidateQueries({ queryKey: ['heygen-key-status', accountId] });
    },
    onError: (error) => {
      toast.error(`Fehler: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`);
    },
  });

  // Test connection
  const testConnection = useMutation({
    mutationFn: async () => {
      if (!accountId) throw new Error('Kein Account gefunden');
      
      const { data, error } = await supabase.functions.invoke('test-heygen-connection', {
        body: { accountId },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.message || 'Verbindung fehlgeschlagen');
      
      return data;
    },
    onSuccess: (data) => {
      toast.success(`Verbindung erfolgreich! Credits: ${data.credits || 'N/A'}`);
    },
    onError: (error) => {
      toast.error(`Verbindungsfehler: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`);
    },
  });

  if (accountLoading || isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6 max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Integrationen</h1>
          <p className="text-muted-foreground">
            Verbinde deine externen Dienste
          </p>
        </div>

        {/* Custom Domain */}
        <DomainSettings />

        {/* SMTP Email Integration */}
        <SmtpSettings />

        {/* SIP Provider (BYOC) */}
        <SipProviderSettings />

        {/* HeyGen Integration */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <img 
                    src="https://www.heygen.com/favicon.ico" 
                    alt="HeyGen" 
                    className="h-5 w-5"
                  />
                  HeyGen
                </CardTitle>
                <CardDescription>
                  Personalisierte Video-Avatare für deine Leads
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {hasExistingKey ? (
                  <span className="flex items-center gap-1 text-sm text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    Verbunden
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-sm text-yellow-600">
                    <AlertCircle className="h-4 w-4" />
                    Nicht konfiguriert
                  </span>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* API Key */}
            <div className="space-y-2">
              <Label htmlFor="apiKey" className="flex items-center gap-2">
                <Key className="h-4 w-4" />
                API Key
                {hasExistingKey && (
                  <span className="text-xs text-muted-foreground">(bereits gespeichert)</span>
                )}
              </Label>
              <div className="relative">
                <Input
                  id="apiKey"
                  type={showApiKey ? "text" : "password"}
                  placeholder={hasExistingKey ? "••••••••••••••••" : "Dein HeyGen API Key"}
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
                  HeyGen Einstellungen
                  <ExternalLink className="h-3 w-3" />
                </a>
              </p>
            </div>

            {/* Avatar ID */}
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
              <p className="text-xs text-muted-foreground">
                Die ID deines persönlichen Avatar-Klons aus HeyGen
              </p>
            </div>

            {/* Voice ID */}
            <div className="space-y-2">
              <Label htmlFor="voiceId" className="flex items-center gap-2">
                <Mic className="h-4 w-4" />
                Voice ID
              </Label>
              <Input
                id="voiceId"
                placeholder="z.B. voice_xyz789..."
                value={voiceId}
                onChange={(e) => setVoiceId(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Die ID deiner geklonten Stimme aus HeyGen
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-4">
              <Button 
                onClick={() => saveSettings.mutate()}
                disabled={saveSettings.isPending}
              >
                {saveSettings.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Speichern
              </Button>
              <Button 
                variant="outline"
                onClick={() => testConnection.mutate()}
                disabled={testConnection.isPending || !hasExistingKey}
              >
                {testConnection.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Verbindung testen
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Setup Guide */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">So richtest du HeyGen ein</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <ol className="list-decimal list-inside space-y-2">
              <li>
                <strong>Avatar erstellen:</strong> Gehe zu{" "}
                <a 
                  href="https://app.heygen.com/avatars" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  HeyGen Avatars
                </a>{" "}
                und erstelle deinen persönlichen Klon
              </li>
              <li>
                <strong>Stimme klonen:</strong> Lade ein Audio deiner Stimme hoch für die Voice-Clone Funktion
              </li>
              <li>
                <strong>IDs kopieren:</strong> Kopiere die Avatar-ID und Voice-ID aus deinem HeyGen Dashboard
              </li>
              <li>
                <strong>API Key generieren:</strong> Erstelle einen API Key in den HeyGen Einstellungen
              </li>
              <li>
                <strong>Hier eintragen:</strong> Füge alle Daten oben ein und speichere
              </li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Integrations;
