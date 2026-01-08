import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

type AuthMode = "login" | "register" | "forgot-password" | "reset-password";

const Auth = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const checkOnboardingAndRedirect = async (userId: string) => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_completed')
        .eq('id', userId)
        .single();

      if (profile?.onboarding_completed) {
        navigate("/");
      } else {
        navigate("/onboarding");
      }
    } catch (error) {
      navigate("/onboarding");
    }
  };

  useEffect(() => {
    // Check if this is a password reset callback
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const type = hashParams.get('type');
    
    if (type === 'recovery') {
      setMode("reset-password");
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session && mode !== "reset-password") {
        checkOnboardingAndRedirect(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setMode("reset-password");
      } else if (session && mode !== "reset-password") {
        setTimeout(() => {
          checkOnboardingAndRedirect(session.user.id);
        }, 0);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast.success("Erfolgreich eingeloggt!");
      } else if (mode === "register") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name: name,
            },
            emailRedirectTo: `${window.location.origin}/`,
          },
        });
        if (error) throw error;
        toast.success("Account erstellt! Sie können sich jetzt einloggen.");
        setMode("login");
      } else if (mode === "forgot-password") {
        // Use production domain for password reset
        const resetRedirectUrl = window.location.hostname.includes('lovable') 
          ? `${window.location.origin}/auth#type=recovery`
          : `https://pitchfirst.io/auth#type=recovery`;
        
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: resetRedirectUrl,
        });
        if (error) throw error;
        toast.success("E-Mail zum Zurücksetzen des Passworts wurde gesendet!");
        setMode("login");
      } else if (mode === "reset-password") {
        if (password !== confirmPassword) {
          toast.error("Passwörter stimmen nicht überein");
          return;
        }
        if (password.length < 6) {
          toast.error("Passwort muss mindestens 6 Zeichen haben");
          return;
        }
        const { error } = await supabase.auth.updateUser({
          password: password,
        });
        if (error) throw error;
        toast.success("Passwort erfolgreich geändert!");
        navigate("/");
      }
    } catch (error: any) {
      if (error.message.includes("Invalid login credentials")) {
        toast.error("Ungültige Anmeldedaten");
      } else if (error.message.includes("already registered")) {
        toast.error("Diese E-Mail ist bereits registriert");
      } else {
        toast.error(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    switch (mode) {
      case "login": return "Anmelden";
      case "register": return "Registrieren";
      case "forgot-password": return "Passwort vergessen";
      case "reset-password": return "Neues Passwort setzen";
    }
  };

  const getDescription = () => {
    switch (mode) {
      case "login": return "Melden Sie sich bei Ihrem Account an";
      case "register": return "Erstellen Sie einen neuen Account";
      case "forgot-password": return "Geben Sie Ihre E-Mail-Adresse ein";
      case "reset-password": return "Wählen Sie ein neues Passwort";
    }
  };

  const getButtonText = () => {
    if (loading) return "Lädt...";
    switch (mode) {
      case "login": return "Anmelden";
      case "register": return "Registrieren";
      case "forgot-password": return "Link senden";
      case "reset-password": return "Passwort ändern";
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          {(mode === "forgot-password" || mode === "reset-password") && (
            <button
              type="button"
              onClick={() => setMode("login")}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2 w-fit"
            >
              <ArrowLeft className="h-4 w-4" />
              Zurück zur Anmeldung
            </button>
          )}
          <CardTitle className="text-2xl">{getTitle()}</CardTitle>
          <CardDescription>{getDescription()}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            )}
            
            {mode !== "reset-password" && (
              <div className="space-y-2">
                <Label htmlFor="email">E-Mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            )}
            
            {(mode === "login" || mode === "register" || mode === "reset-password") && (
              <div className="space-y-2">
                <Label htmlFor="password">
                  {mode === "reset-password" ? "Neues Passwort" : "Passwort"}
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
            )}

            {mode === "reset-password" && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Passwort bestätigen</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {getButtonText()}
            </Button>
          </form>
          
          {mode === "login" && (
            <div className="mt-4 space-y-2 text-center">
              <button
                type="button"
                onClick={() => setMode("forgot-password")}
                className="text-sm text-muted-foreground hover:text-foreground block w-full"
              >
                Passwort vergessen?
              </button>
              <button
                type="button"
                onClick={() => setMode("register")}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Noch kein Account? Registrieren
              </button>
            </div>
          )}
          
          {mode === "register" && (
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => setMode("login")}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Bereits registriert? Anmelden
              </button>
            </div>
          )}
        </CardContent>
      </Card>
      <footer className="mt-8 text-center text-muted-foreground text-sm">
        <div className="flex justify-center gap-6">
          <a 
            href="https://www.content-leads.de/impressum" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors"
          >
            Impressum
          </a>
          <a 
            href="https://www.content-leads.de/datenschutz" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors"
          >
            Datenschutzerklärung
          </a>
        </div>
      </footer>
    </div>
  );
};

export default Auth;
