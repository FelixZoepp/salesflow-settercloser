import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useSubscriptionContext } from "@/contexts/SubscriptionContext";
import { Lock, ArrowRight, Phone, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const SubscriptionRequired = () => {
  const navigate = useNavigate();
  const { subscribed, loading, refresh, openCustomerPortal } = useSubscriptionContext();

  // Redirect if already subscribed
  if (!loading && subscribed) {
    navigate("/dashboard");
    return null;
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const handleManageSubscription = async () => {
    const { error } = await openCustomerPortal();
    if (error) {
      toast.error("Fehler beim Öffnen des Kundenportals");
    }
  };

  const features = [
    "Pitchfirst Software – alle Features",
    "1x/Woche Live-Gruppen-Coaching mit Felix Zoepp",
    "Outreach-Videokurs inklusive",
    "Unbegrenzte KI-Landingpages",
    "Echtzeit-Tracking & Lead-Scoring"
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0e27] p-4">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/20 rounded-full blur-[120px]"></div>
      </div>
      
      <Card className="w-full max-w-lg relative z-10 bg-white/[0.02] border-white/10">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-2xl bg-primary/20 flex items-center justify-center">
            <Lock className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl text-white">Abo erforderlich</CardTitle>
          <CardDescription className="text-gray-400">
            Um Pitchfirst nutzen zu können, benötigst du ein aktives Abonnement.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            {features.map((feature, idx) => (
              <div key={idx} className="flex items-start gap-3 text-gray-300 text-sm">
                <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <span>{feature}</span>
              </div>
            ))}
          </div>

          {/* Demo CTA */}
          <div className="text-center p-6 rounded-xl border border-primary/30 bg-primary/5">
            <p className="text-sm text-gray-400 mb-2">Individuelle Beratung</p>
            <p className="text-white text-lg font-medium">
              Buche eine Demo um dein passendes Paket zu finden
            </p>
          </div>

          <div className="space-y-3">
            <a 
              href="https://calendly.com/zoepp-media/vorgesprach-demo-software"
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <Button 
                size="lg"
                className="w-full bg-gradient-to-r from-primary to-blue-500 hover:opacity-90 text-white"
              >
                <Phone className="mr-2 h-4 w-4" />
                Demo Termin buchen
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </a>
            
            <Button 
              variant="ghost"
              onClick={refresh}
              className="w-full text-gray-400 hover:text-white hover:bg-white/5"
            >
              Status aktualisieren
            </Button>

            <Button 
              variant="ghost"
              onClick={handleManageSubscription}
              className="w-full text-gray-400 hover:text-white hover:bg-white/5"
            >
              Bestehendes Abo verwalten
            </Button>
          </div>

          <div className="pt-4 border-t border-white/10 text-center">
            <button
              onClick={handleLogout}
              className="text-sm text-gray-500 hover:text-white transition-colors"
            >
              Abmelden
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SubscriptionRequired;
