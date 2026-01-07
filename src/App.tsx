import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/hooks/useSubscription";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import Pipeline from "./pages/Pipeline";
import Today from "./pages/Today";
import Contacts from "./pages/Contacts";
import KPI from "./pages/KPI";
import ActivityLog from "./pages/ActivityLog";
import PowerDialer from "./pages/PowerDialer";
import Landing from "./pages/Landing";
import NotFound from "./pages/NotFound";
import ImportLeads from "./pages/ImportLeads";
import ApiKeys from "./pages/ApiKeys";
import CallScript from "./pages/CallScript";
import ObjectionLibrary from "./pages/ObjectionLibrary";
import MasterAdmin from "./pages/MasterAdmin";
import VideoNote from "./pages/VideoNote";
import InboundLeads from "./pages/InboundLeads";
import OutboundLeads from "./pages/OutboundLeads";
import Campaigns from "./pages/Campaigns";
import Integrations from "./pages/Integrations";
import LandingPageBuilder from "./pages/LandingPageBuilder";
import PublicLandingPage from "./pages/PublicLandingPage";
import Profile from "./pages/Profile";
import SubscriptionRequired from "./pages/SubscriptionRequired";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Lädt...</div>;
  }

  if (!session) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};

const SubscriptionRoute = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const { subscribed, loading: subLoading } = useSubscription();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (authLoading || subLoading) {
    return <div className="flex items-center justify-center min-h-screen">Lädt...</div>;
  }

  if (!session) {
    return <Navigate to="/auth" replace />;
  }

  if (!subscribed) {
    return <Navigate to="/subscription-required" replace />;
  }

  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/subscription-required" element={<ProtectedRoute><SubscriptionRequired /></ProtectedRoute>} />
          <Route path="/onboarding" element={<SubscriptionRoute><Onboarding /></SubscriptionRoute>} />
          <Route path="/dashboard" element={<SubscriptionRoute><Dashboard /></SubscriptionRoute>} />
          <Route path="/pipeline" element={<SubscriptionRoute><Pipeline /></SubscriptionRoute>} />
          <Route path="/today" element={<SubscriptionRoute><Today /></SubscriptionRoute>} />
          <Route path="/contacts" element={<SubscriptionRoute><Contacts /></SubscriptionRoute>} />
          <Route path="/inbound" element={<SubscriptionRoute><InboundLeads /></SubscriptionRoute>} />
          <Route path="/outbound" element={<SubscriptionRoute><OutboundLeads /></SubscriptionRoute>} />
          <Route path="/campaigns" element={<SubscriptionRoute><Campaigns /></SubscriptionRoute>} />
          <Route path="/import-leads" element={<SubscriptionRoute><ImportLeads /></SubscriptionRoute>} />
          <Route path="/api-keys" element={<SubscriptionRoute><ApiKeys /></SubscriptionRoute>} />
          <Route path="/call-script" element={<SubscriptionRoute><CallScript /></SubscriptionRoute>} />
          <Route path="/objections" element={<SubscriptionRoute><ObjectionLibrary /></SubscriptionRoute>} />
          <Route path="/master-admin" element={<SubscriptionRoute><MasterAdmin /></SubscriptionRoute>} />
          <Route path="/power-dialer" element={<SubscriptionRoute><PowerDialer /></SubscriptionRoute>} />
          <Route path="/activity-log" element={<SubscriptionRoute><ActivityLog /></SubscriptionRoute>} />
          <Route path="/kpi" element={<SubscriptionRoute><KPI /></SubscriptionRoute>} />
          <Route path="/integrations" element={<SubscriptionRoute><Integrations /></SubscriptionRoute>} />
          <Route path="/landing-builder" element={<SubscriptionRoute><LandingPageBuilder /></SubscriptionRoute>} />
          <Route path="/profile" element={<SubscriptionRoute><Profile /></SubscriptionRoute>} />
          <Route path="/p/:slug" element={<VideoNote />} />
          <Route path="/lp/:slug" element={<PublicLandingPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;