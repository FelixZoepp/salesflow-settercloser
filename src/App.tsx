import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
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

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/pipeline" element={<ProtectedRoute><Pipeline /></ProtectedRoute>} />
          <Route path="/today" element={<ProtectedRoute><Today /></ProtectedRoute>} />
          <Route path="/contacts" element={<ProtectedRoute><Contacts /></ProtectedRoute>} />
          <Route path="/inbound" element={<ProtectedRoute><InboundLeads /></ProtectedRoute>} />
          <Route path="/outbound" element={<ProtectedRoute><OutboundLeads /></ProtectedRoute>} />
          <Route path="/campaigns" element={<ProtectedRoute><Campaigns /></ProtectedRoute>} />
          <Route path="/import-leads" element={<ProtectedRoute><ImportLeads /></ProtectedRoute>} />
          <Route path="/api-keys" element={<ProtectedRoute><ApiKeys /></ProtectedRoute>} />
          <Route path="/call-script" element={<ProtectedRoute><CallScript /></ProtectedRoute>} />
          <Route path="/objections" element={<ProtectedRoute><ObjectionLibrary /></ProtectedRoute>} />
          <Route path="/master-admin" element={<ProtectedRoute><MasterAdmin /></ProtectedRoute>} />
          <Route path="/power-dialer" element={<ProtectedRoute><PowerDialer /></ProtectedRoute>} />
          <Route path="/activity-log" element={<ProtectedRoute><ActivityLog /></ProtectedRoute>} />
          <Route path="/kpi" element={<ProtectedRoute><KPI /></ProtectedRoute>} />
          <Route path="/integrations" element={<ProtectedRoute><Integrations /></ProtectedRoute>} />
          <Route path="/landing-builder" element={<ProtectedRoute><LandingPageBuilder /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/p/:slug" element={<VideoNote />} />
          <Route path="/lp/:slug" element={<PublicLandingPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;