import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

const hasRecoveryParams = () => {
  const hashParams = new URLSearchParams(window.location.hash.substring(1));
  const searchParams = new URLSearchParams(window.location.search);

  return (
    hashParams.get("type") === "recovery" ||
    searchParams.get("type") === "recovery" ||
    hashParams.has("access_token")
  );
};

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingLink, setCheckingLink] = useState(true);
  const [hasValidRecovery, setHasValidRecovery] = useState(() => hasRecoveryParams());

  const isReady = useMemo(() => !checkingLink && hasValidRecovery, [checkingLink, hasValidRecovery]);

  useEffect(() => {
    let mounted = true;

    const syncRecoveryState = async () => {
      const hasRecovery = hasRecoveryParams();

      if (hasRecovery) {
        if (!mounted) return;
        setHasValidRecovery(true);
        setCheckingLink(false);
        return;
      }

      const { data } = await supabase.auth.getSession();

      if (!mounted) return;

      setHasValidRecovery(Boolean(data.session));
      setCheckingLink(false);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      if (event === "PASSWORD_RECOVERY") {
        setHasValidRecovery(true);
        setCheckingLink(false);
        return;
      }

      if (session) {
        setHasValidRecovery(true);
      }
    });

    syncRecoveryState();
    window.addEventListener("hashchange", syncRecoveryState);

    return () => {
      mounted = false;
      subscription.unsubscribe();
      window.removeEventListener("hashchange", syncRecoveryState);
    };
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Passwörter stimmen nicht überein");
      return;
    }

    if (password.length < 6) {
      toast.error("Passwort muss mindestens 6 Zeichen haben");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) throw error;

      toast.success("Passwort erfolgreich geändert!");
      navigate("/auth", { replace: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Passwort konnte nicht geändert werden";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <Link
            to="/auth"
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2 w-fit"
          >
            <ArrowLeft className="h-4 w-4" />
            Zurück zur Anmeldung
          </Link>
          <CardTitle className="text-2xl">Neues Passwort setzen</CardTitle>
          <CardDescription>
            {checkingLink
              ? "Prüfe deinen Link…"
              : hasValidRecovery
                ? "Lege jetzt dein neues Passwort fest."
                : "Dieser Link ist ungültig oder abgelaufen. Bitte fordere eine neue Passwort-E-Mail an."}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {isReady ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Neues Passwort</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Passwort bestätigen</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Speichert…" : "Passwort ändern"}
              </Button>
            </form>
          ) : (
            <div className="space-y-4">
              <Button asChild className="w-full">
                <Link to="/auth">Neue Passwort-E-Mail anfordern</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;