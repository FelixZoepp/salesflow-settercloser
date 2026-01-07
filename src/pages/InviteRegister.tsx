import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { UserPlus, AlertCircle, CheckCircle2 } from "lucide-react";
import { z } from "zod";

const registerSchema = z.object({
  name: z.string().min(2, "Name muss mindestens 2 Zeichen haben").max(100),
  email: z.string().email("Ungültige E-Mail-Adresse"),
  password: z.string().min(6, "Passwort muss mindestens 6 Zeichen haben"),
});

interface Invitation {
  id: string;
  token: string;
  account_id: string;
  email_hint: string | null;
  role: string;
  expires_at: string;
  used_at: string | null;
  accounts?: { name: string };
}

export default function InviteRegister() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (token) {
      checkInvitation();
    }
  }, [token]);

  const checkInvitation = async () => {
    try {
      const { data, error } = await supabase
        .from("invitations")
        .select(`
          *,
          accounts:account_id (name)
        `)
        .eq("token", token)
        .single();

      if (error || !data) {
        setError("Ungültiger Einladungslink");
        return;
      }

      if (data.used_at) {
        setError("Diese Einladung wurde bereits verwendet");
        return;
      }

      if (new Date(data.expires_at) < new Date()) {
        setError("Diese Einladung ist abgelaufen");
        return;
      }

      setInvitation(data);
      if (data.email_hint) {
        setEmail(data.email_hint);
      }
    } catch (err) {
      setError("Fehler beim Laden der Einladung");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors({});

    // Validate
    const result = registerSchema.safeParse({ name, email, password });
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          errors[err.path[0] as string] = err.message;
        }
      });
      setValidationErrors(errors);
      return;
    }

    if (!invitation) return;

    setSubmitting(true);
    try {
      // 1. Create user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            name,
          },
        },
      });

      if (authError) {
        if (authError.message.includes("already registered")) {
          toast.error("Diese E-Mail ist bereits registriert. Bitte melde dich an.");
          navigate("/auth");
          return;
        }
        throw authError;
      }

      if (!authData.user) {
        throw new Error("Benutzer konnte nicht erstellt werden");
      }

      // 2. Calculate trial end date (7 days from now)
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 7);

      // 3. Update profile with account_id, role, and trial period
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          account_id: invitation.account_id,
          role: invitation.role as "setter" | "closer" | "admin",
          name,
          trial_ends_at: trialEndsAt.toISOString(),
          invited_via: invitation.id,
        })
        .eq("id", authData.user.id);

      if (profileError) {
        console.error("Profile update error:", profileError);
      }

      // 4. Mark invitation as used
      const { error: inviteError } = await supabase
        .from("invitations")
        .update({
          used_at: new Date().toISOString(),
          used_by: authData.user.id,
        })
        .eq("id", invitation.id);

      if (inviteError) {
        console.error("Invitation update error:", inviteError);
      }

      setSuccess(true);
      toast.success("Account erfolgreich erstellt!");
      
      // Redirect after short delay
      setTimeout(() => {
        navigate("/");
      }, 2000);
    } catch (err: any) {
      console.error("Registration error:", err);
      toast.error("Fehler: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Einladung ungültig</h2>
                <p className="text-muted-foreground mt-2">{error}</p>
              </div>
              <Button variant="outline" onClick={() => navigate("/auth")}>
                Zur Anmeldung
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Willkommen!</h2>
                <p className="text-muted-foreground mt-2">
                  Dein Account wurde erstellt. Du wirst gleich weitergeleitet...
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <UserPlus className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Testzugang erstellen</CardTitle>
          <CardDescription>
            Du wurdest eingeladen, einen Testzugang für{" "}
            <span className="font-medium text-foreground">
              {invitation?.accounts?.name || "dieses Unternehmen"}
            </span>{" "}
            zu erstellen.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Max Mustermann"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              {validationErrors.name && (
                <p className="text-sm text-destructive">{validationErrors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-Mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="test@beispiel.de"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              {validationErrors.email && (
                <p className="text-sm text-destructive">{validationErrors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Passwort</Label>
              <Input
                id="password"
                type="password"
                placeholder="Mindestens 6 Zeichen"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              {validationErrors.password && (
                <p className="text-sm text-destructive">{validationErrors.password}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Wird erstellt..." : "Account erstellen"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
