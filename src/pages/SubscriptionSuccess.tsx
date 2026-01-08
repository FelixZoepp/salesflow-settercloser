import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Sparkles, ArrowRight, Loader2 } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";

export default function SubscriptionSuccess() {
  const navigate = useNavigate();
  const { refresh, subscribed, loading } = useSubscription();
  const { isProPlan, isStarterPlan } = useFeatureAccess();
  const [checkCount, setCheckCount] = useState(0);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    // Immediately check subscription status
    refresh();
    
    // Check multiple times to ensure Stripe has processed
    const interval = setInterval(() => {
      refresh();
      setCheckCount(prev => prev + 1);
    }, 2000);

    // Stop checking after 10 attempts (20 seconds)
    if (checkCount >= 10) {
      clearInterval(interval);
    }

    return () => clearInterval(interval);
  }, [checkCount, refresh]);

  useEffect(() => {
    if (subscribed && !loading) {
      setVerified(true);
    }
  }, [subscribed, loading]);

  const getPlanName = () => {
    if (isProPlan) return "Pro";
    if (isStarterPlan) return "Starter";
    return "Pitchfirst";
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-lg w-full border-primary/20">
        <CardContent className="pt-8 pb-8 text-center space-y-6">
          {verified ? (
            <>
              <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
                <CheckCircle className="w-10 h-10 text-green-500" />
              </div>
              
              <div>
                <h1 className="text-2xl font-bold mb-2">Willkommen bei Pitchfirst!</h1>
                <p className="text-muted-foreground">
                  Dein <span className="text-primary font-semibold">{getPlanName()}</span> Abo ist jetzt aktiv.
                </p>
              </div>

              {isProPlan && (
                <div className="bg-primary/10 rounded-lg p-4 text-left">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    <span className="font-semibold">Pro Features freigeschaltet:</span>
                  </div>
                  <ul className="text-sm text-muted-foreground space-y-1 ml-7">
                    <li>• KI-Telefonie aus dem Tool</li>
                    <li>• KI-Anrufzusammenfassungen</li>
                    <li>• Live KI-Einwandbehandlung</li>
                    <li>• E-Mail-Vorlagen & Outreach</li>
                  </ul>
                </div>
              )}

              <Button 
                size="lg"
                onClick={() => navigate('/dashboard')}
                className="w-full"
              >
                Zum Dashboard
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </>
          ) : (
            <>
              <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
              </div>
              
              <div>
                <h1 className="text-2xl font-bold mb-2">Zahlung wird verarbeitet...</h1>
                <p className="text-muted-foreground">
                  Wir prüfen deinen Abostatus. Das dauert nur wenige Sekunden.
                </p>
              </div>

              <div className="text-sm text-muted-foreground">
                Prüfung läuft... ({checkCount}/10)
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
