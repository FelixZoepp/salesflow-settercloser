import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Phone, Save, TestTube, CheckCircle2, XCircle, Loader2, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface SipSettings {
  sip_provider: string | null;
  sip_server: string | null;
  sip_domain: string | null;
  sip_username: string | null;
  sip_password_encrypted: string | null;
  sip_display_name: string | null;
  sip_enabled: boolean;
}

const PROVIDER_PRESETS: Record<string, { server: string; domain: string; name: string; helpUrl: string }> = {
  placetel: {
    name: "Placetel",
    server: "wss://pbx.placetel.de",
    domain: "pbx.placetel.de",
    helpUrl: "https://www.placetel.de/ratgeber/webrtc"
  },
  sipgate: {
    name: "Sipgate",
    server: "wss://app.sipgate.com",
    domain: "sipgate.de",
    helpUrl: "https://www.sipgate.de/hilfe"
  },
  twilio: {
    name: "Twilio",
    server: "wss://your-domain.pstn.twilio.com",
    domain: "pstn.twilio.com",
    helpUrl: "https://www.twilio.com/docs/voice/sdks/javascript"
  },
  custom: {
    name: "Eigener SIP-Provider",
    server: "",
    domain: "",
    helpUrl: ""
  }
};

export default function SipProviderSettings() {
  const [settings, setSettings] = useState<SipSettings>({
    sip_provider: null,
    sip_server: null,
    sip_domain: null,
    sip_username: null,
    sip_password_encrypted: null,
    sip_display_name: null,
    sip_enabled: false
  });
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('account_id')
        .eq('id', user.id)
        .single();

      if (!profile?.account_id) return;

      const { data, error } = await supabase
        .from('account_integrations')
        .select('sip_provider, sip_server, sip_domain, sip_username, sip_password_encrypted, sip_display_name, sip_enabled')
        .eq('account_id', profile.account_id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setSettings({
          sip_provider: data.sip_provider,
          sip_server: data.sip_server,
          sip_domain: data.sip_domain,
          sip_username: data.sip_username,
          sip_password_encrypted: data.sip_password_encrypted,
          sip_display_name: data.sip_display_name,
          sip_enabled: data.sip_enabled || false
        });
        // Show masked password if exists
        if (data.sip_password_encrypted) {
          setPassword("••••••••");
        }
      }
    } catch (error) {
      console.error('Error loading SIP settings:', error);
      toast.error("Fehler beim Laden der SIP-Einstellungen");
    } finally {
      setLoading(false);
    }
  };

  const handleProviderChange = (provider: string) => {
    const preset = PROVIDER_PRESETS[provider];
    setSettings(prev => ({
      ...prev,
      sip_provider: provider,
      sip_server: preset.server || prev.sip_server,
      sip_domain: preset.domain || prev.sip_domain
    }));
    setTestResult(null);
  };

  const handleSave = async () => {
    if (!settings.sip_provider) {
      toast.error("Bitte wähle einen Provider");
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Nicht angemeldet");

      const { data: profile } = await supabase
        .from('profiles')
        .select('account_id')
        .eq('id', user.id)
        .single();

      if (!profile?.account_id) throw new Error("Kein Account gefunden");

      const updateData: any = {
        sip_provider: settings.sip_provider,
        sip_server: settings.sip_server,
        sip_domain: settings.sip_domain,
        sip_username: settings.sip_username,
        sip_display_name: settings.sip_display_name,
        sip_enabled: settings.sip_enabled,
        updated_at: new Date().toISOString()
      };

      // Only update password if it was changed (not masked)
      if (password && !password.includes("•")) {
        // In a real app, encrypt this before storing
        updateData.sip_password_encrypted = btoa(password);
      }

      const { error } = await supabase
        .from('account_integrations')
        .upsert({
          account_id: profile.account_id,
          ...updateData
        }, { onConflict: 'account_id' });

      if (error) throw error;

      toast.success("SIP-Einstellungen gespeichert");
    } catch (error: any) {
      console.error('Error saving SIP settings:', error);
      toast.error(error.message || "Fehler beim Speichern");
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    if (!settings.sip_server || !settings.sip_username) {
      toast.error("Bitte fülle alle Pflichtfelder aus");
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      // Test WebSocket connection to SIP server
      const ws = new WebSocket(settings.sip_server);
      
      const timeout = setTimeout(() => {
        ws.close();
        setTestResult('error');
        toast.error("Verbindungs-Timeout - Server nicht erreichbar");
        setTesting(false);
      }, 5000);

      ws.onopen = () => {
        clearTimeout(timeout);
        ws.close();
        setTestResult('success');
        toast.success("Verbindung zum SIP-Server erfolgreich!");
        setTesting(false);
      };

      ws.onerror = () => {
        clearTimeout(timeout);
        setTestResult('error');
        toast.error("Verbindung fehlgeschlagen - Prüfe die Server-URL");
        setTesting(false);
      };
    } catch (error) {
      setTestResult('error');
      toast.error("Verbindungstest fehlgeschlagen");
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <Card className="glass-card">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const selectedProvider = settings.sip_provider ? PROVIDER_PRESETS[settings.sip_provider] : null;

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Phone className="w-5 h-5 text-primary" />
          SIP-Provider (BYOC)
        </CardTitle>
        <CardDescription>
          Verbinde deinen eigenen SIP-Provider für Browser-Telefonie. Die Kosten gehen direkt an deinen Provider.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Enable Toggle */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-white/[0.02] border border-white/10">
          <div className="space-y-0.5">
            <Label className="text-base">Browser-Telefonie aktivieren</Label>
            <p className="text-sm text-muted-foreground">
              Ermöglicht Anrufe direkt aus der Pipeline
            </p>
          </div>
          <Switch
            checked={settings.sip_enabled}
            onCheckedChange={(checked) => setSettings(prev => ({ ...prev, sip_enabled: checked }))}
          />
        </div>

        {/* Provider Selection */}
        <div className="space-y-2">
          <Label>Provider</Label>
          <Select value={settings.sip_provider || ""} onValueChange={handleProviderChange}>
            <SelectTrigger>
              <SelectValue placeholder="Provider wählen..." />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(PROVIDER_PRESETS).map(([key, preset]) => (
                <SelectItem key={key} value={key}>
                  <div className="flex items-center gap-2">
                    {preset.name}
                    {key !== 'custom' && (
                      <Badge variant="secondary" className="text-[10px]">Vorkonfiguriert</Badge>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {settings.sip_provider && (
          <>
            {/* Provider Help */}
            {selectedProvider?.helpUrl && (
              <Alert>
                <Info className="w-4 h-4" />
                <AlertDescription>
                  <a 
                    href={selectedProvider.helpUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {selectedProvider.name} Hilfe & Dokumentation →
                  </a>
                </AlertDescription>
              </Alert>
            )}

            {/* Server Settings */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>WebSocket Server *</Label>
                <Input
                  value={settings.sip_server || ""}
                  onChange={(e) => setSettings(prev => ({ ...prev, sip_server: e.target.value }))}
                  placeholder="wss://pbx.example.de"
                />
                <p className="text-xs text-muted-foreground">WebSocket-URL des SIP-Servers</p>
              </div>

              <div className="space-y-2">
                <Label>SIP Domain</Label>
                <Input
                  value={settings.sip_domain || ""}
                  onChange={(e) => setSettings(prev => ({ ...prev, sip_domain: e.target.value }))}
                  placeholder="pbx.example.de"
                />
                <p className="text-xs text-muted-foreground">Domain für SIP-URI (user@domain)</p>
              </div>
            </div>

            {/* Credentials */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>SIP-Benutzername *</Label>
                <Input
                  value={settings.sip_username || ""}
                  onChange={(e) => setSettings(prev => ({ ...prev, sip_username: e.target.value }))}
                  placeholder="123456"
                />
              </div>

              <div className="space-y-2">
                <Label>SIP-Passwort *</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* Display Name */}
            <div className="space-y-2">
              <Label>Anzeigename (Caller ID)</Label>
              <Input
                value={settings.sip_display_name || ""}
                onChange={(e) => setSettings(prev => ({ ...prev, sip_display_name: e.target.value }))}
                placeholder="Max Mustermann"
              />
              <p className="text-xs text-muted-foreground">Name, der dem Angerufenen angezeigt wird</p>
            </div>

            {/* Test Result */}
            {testResult && (
              <div className={`flex items-center gap-2 p-3 rounded-lg ${
                testResult === 'success' 
                  ? 'bg-green-500/10 border border-green-500/20' 
                  : 'bg-red-500/10 border border-red-500/20'
              }`}>
                {testResult === 'success' ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    <span className="text-green-500">Verbindung erfolgreich</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5 text-red-500" />
                    <span className="text-red-500">Verbindung fehlgeschlagen</span>
                  </>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={handleTestConnection}
                disabled={testing || !settings.sip_server}
              >
                {testing ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <TestTube className="w-4 h-4 mr-2" />
                )}
                Verbindung testen
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Speichern
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
