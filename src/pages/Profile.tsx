import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { User, Calendar, Phone, Mail, Save, Loader2 } from "lucide-react";

interface ProfileData {
  name: string;
  email: string;
  phone_number: string | null;
  calendar_url: string | null;
}

const Profile = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<ProfileData>({
    name: "",
    email: "",
    phone_number: null,
    calendar_url: null,
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("name, email, phone_number, calendar_url")
        .eq("id", user.id)
        .single();

      if (error) throw error;

      setProfile({
        name: data?.name || "",
        email: data?.email || user.email || "",
        phone_number: data?.phone_number || null,
        calendar_url: data?.calendar_url || null,
      });
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error("Fehler beim Laden des Profils");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Nicht eingeloggt");

      const { error } = await supabase
        .from("profiles")
        .update({
          name: profile.name,
          phone_number: profile.phone_number,
          calendar_url: profile.calendar_url,
        })
        .eq("id", user.id);

      if (error) throw error;

      toast.success("Profil gespeichert");
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error("Fehler beim Speichern");
    } finally {
      setSaving(false);
    }
  };

  const getCalendarPreviewUrl = () => {
    if (!profile.calendar_url) return null;
    
    if (profile.calendar_url.includes("calendly.com")) {
      return profile.calendar_url;
    }
    if (profile.calendar_url.includes("cal.com")) {
      return profile.calendar_url;
    }
    return null;
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Profil & Einstellungen</h1>
          <p className="text-muted-foreground mt-1">
            Verwalte deine persönlichen Daten und Integrationen
          </p>
        </div>

        {/* Personal Info */}
        <Card className="glass-card border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              Persönliche Daten
            </CardTitle>
            <CardDescription>
              Deine grundlegenden Kontaktinformationen
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                placeholder="Dein Name"
                className="glass-input"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                E-Mail
              </Label>
              <Input
                id="email"
                value={profile.email}
                disabled
                className="glass-input opacity-60"
              />
              <p className="text-xs text-muted-foreground">
                E-Mail-Adresse kann nicht geändert werden
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Telefon
              </Label>
              <Input
                id="phone"
                value={profile.phone_number || ""}
                onChange={(e) => setProfile({ ...profile, phone_number: e.target.value || null })}
                placeholder="+49 123 456789"
                className="glass-input"
              />
            </div>
          </CardContent>
        </Card>

        {/* Calendar Integration */}
        <Card className="glass-card border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-400" />
              Kalender-Integration
            </CardTitle>
            <CardDescription>
              Verbinde deinen Calendly oder Cal.com Kalender für automatische Terminbuchungen
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="calendar">Kalender-Link</Label>
              <Input
                id="calendar"
                value={profile.calendar_url || ""}
                onChange={(e) => setProfile({ ...profile, calendar_url: e.target.value || null })}
                placeholder="https://calendly.com/dein-name oder https://cal.com/dein-name"
                className="glass-input"
              />
              <p className="text-xs text-muted-foreground">
                Dieser Link wird auf deinen Landing Pages für Terminbuchungen verwendet
              </p>
            </div>

            {getCalendarPreviewUrl() && (
              <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <p className="text-sm text-emerald-400 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Kalender verbunden: {profile.calendar_url?.includes("calendly") ? "Calendly" : "Cal.com"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="glass-button"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Änderungen speichern
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default Profile;
