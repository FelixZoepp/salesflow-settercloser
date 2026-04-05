import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import React from "react";
import { SubscriptionProvider, useSubscriptionContext } from "@/contexts/SubscriptionContext";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import Startseite from "./pages/Startseite";
import Pipeline from "./pages/Pipeline";
import Today from "./pages/Today";
import Contacts from "./pages/Contacts";
import KPI from "./pages/KPI";
import ActivityLog from "./pages/ActivityLog";
import PowerDialer from "./pages/PowerDialer";
import Landing from "./pages/Landing";
import AGB from "./pages/AGB";
import NotFound from "./pages/NotFound";
import ImportLeads from "./pages/ImportLeads";
import ApiKeys from "./pages/ApiKeys";
import CallScript from "./pages/CallScript";
import ObjectionLibrary from "./pages/ObjectionLibrary";
import MasterAdmin from "./pages/MasterAdmin";
import VideoNote from "./pages/VideoNote";
import VideoNoteAdmin from "./pages/VideoNoteAdmin";
import Campaigns from "./pages/Campaigns";
import Integrations from "./pages/Integrations";
import LandingPageBuilder from "./pages/LandingPageBuilder";
import PublicLandingPage from "./pages/PublicLandingPage";
import Profile from "./pages/Profile";
import SubscriptionRequired from "./pages/SubscriptionRequired";
import Billing from "./pages/Billing";
import EmailTemplates from "./pages/EmailTemplates";
import DealAnalytics from "./pages/DealAnalytics";
import Upgrade from "./pages/Upgrade";
import SubscriptionSuccess from "./pages/SubscriptionSuccess";
import PartnerDashboard from "./pages/PartnerDashboard";
import Partner from "./pages/Partner";
import LeadPagePreview from "./pages/LeadPagePreview";
import LeadPagesFeature from "./pages/features/LeadPages";
import KIVideosFeature from "./pages/features/KIVideos";
import CRMFeature from "./pages/features/CRM";
import PowerDialerFeature from "./pages/features/PowerDialerPage";
import LiveEinwandbehandlungFeature from "./pages/features/LiveEinwandbehandlung";
import KIKonfiguratorFeature from "./pages/features/KIKonfigurator";
import LeadScoringFeature from "./pages/features/LeadScoring";
import KampagnenFeature from "./pages/features/Kampagnen";
import Sequences from "./pages/Sequences";
import LeadSearch from "./pages/LeadSearch";
import TeamArena from "./pages/TeamArena";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Lädt...</div>;
  }

  if (!session) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};

const SubscriptionRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, loading: authLoading } = useAuth();
  const { subscribed, loading: subLoading } = useSubscriptionContext();

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

const SuperAdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, loading: authLoading } = useAuth();
  const { subscribed, loading: subLoading } = useSubscriptionContext();
  const [isSuperAdmin, setIsSuperAdmin] = React.useState<boolean | null>(null);
  const [checkingAdmin, setCheckingAdmin] = React.useState(true);

  React.useEffect(() => {
    const checkSuperAdmin = async () => {
      if (!session?.user?.id) {
        setIsSuperAdmin(false);
        setCheckingAdmin(false);
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('is_super_admin')
        .eq('id', session.user.id)
        .single();

      setIsSuperAdmin(profile?.is_super_admin || false);
      setCheckingAdmin(false);
    };

    if (!authLoading && session) {
      checkSuperAdmin();
    } else if (!authLoading) {
      setCheckingAdmin(false);
    }
  }, [session, authLoading]);

  if (authLoading || subLoading || checkingAdmin) {
    return <div className="flex items-center justify-center min-h-screen">Lädt...</div>;
  }

  if (!session) {
    return <Navigate to="/auth" replace />;
  }

  if (!subscribed) {
    return <Navigate to="/subscription-required" replace />;
  }

  if (!isSuperAdmin) {
    return <Navigate to="/startseite" replace />;
  }

  return <>{children}</>;
};

const AppRoutes = () => (
  <Routes>
    {/* Fully public routes - no auth context needed */}
    <Route path="/p/:slug" element={<VideoNote />} />
    <Route path="/lp/:slug" element={<PublicLandingPage />} />
    
    <Route path="/partner" element={<Partner />} />
    <Route path="/features/lead-seiten" element={<LeadPagesFeature />} />
    <Route path="/features/ki-videos" element={<KIVideosFeature />} />
    <Route path="/features/crm" element={<CRMFeature />} />
    <Route path="/features/power-dialer" element={<PowerDialerFeature />} />
    <Route path="/features/live-einwandbehandlung" element={<LiveEinwandbehandlungFeature />} />
    <Route path="/features/ki-konfigurator" element={<KIKonfiguratorFeature />} />
    <Route path="/features/lead-scoring" element={<LeadScoringFeature />} />
    <Route path="/features/kampagnen" element={<KampagnenFeature />} />
    <Route path="/agb" element={<AGB />} />
    <Route path="/" element={<Landing />} />
    <Route path="/auth" element={<Auth />} />
    
    {/* Protected routes */}
    <Route path="/subscription-required" element={<ProtectedRoute><SubscriptionRequired /></ProtectedRoute>} />
    <Route path="/onboarding" element={<SubscriptionRoute><Onboarding /></SubscriptionRoute>} />
    <Route path="/startseite" element={<SubscriptionRoute><Startseite /></SubscriptionRoute>} />
    <Route path="/dashboard" element={<SubscriptionRoute><Dashboard /></SubscriptionRoute>} />
    <Route path="/pipeline" element={<SubscriptionRoute><Pipeline /></SubscriptionRoute>} />
    <Route path="/today" element={<SubscriptionRoute><Today /></SubscriptionRoute>} />
    <Route path="/contacts" element={<SubscriptionRoute><Contacts /></SubscriptionRoute>} />
    <Route path="/campaigns" element={<SubscriptionRoute><Campaigns /></SubscriptionRoute>} />
    <Route path="/import-leads" element={<SubscriptionRoute><ImportLeads /></SubscriptionRoute>} />
    <Route path="/lead-search" element={<SubscriptionRoute><LeadSearch /></SubscriptionRoute>} />
    <Route path="/api-keys" element={<SubscriptionRoute><ApiKeys /></SubscriptionRoute>} />
    <Route path="/call-script" element={<SubscriptionRoute><CallScript /></SubscriptionRoute>} />
    <Route path="/objections" element={<SubscriptionRoute><ObjectionLibrary /></SubscriptionRoute>} />
    <Route path="/master-admin" element={<SuperAdminRoute><MasterAdmin /></SuperAdminRoute>} />
    <Route path="/power-dialer" element={<SubscriptionRoute><PowerDialer /></SubscriptionRoute>} />
    <Route path="/activity-log" element={<SubscriptionRoute><ActivityLog /></SubscriptionRoute>} />
    <Route path="/kpi" element={<SubscriptionRoute><KPI /></SubscriptionRoute>} />
    <Route path="/integrations" element={<SubscriptionRoute><Integrations /></SubscriptionRoute>} />
    <Route path="/landing-pages" element={<SubscriptionRoute><LandingPageBuilder /></SubscriptionRoute>} />
    <Route path="/landing-pages/preview" element={<SubscriptionRoute><LeadPagePreview /></SubscriptionRoute>} />
    <Route path="/video-note" element={<SubscriptionRoute><VideoNoteAdmin /></SubscriptionRoute>} />
    <Route path="/landing-builder" element={<SubscriptionRoute><LandingPageBuilder /></SubscriptionRoute>} />
    <Route path="/profile" element={<SubscriptionRoute><Profile /></SubscriptionRoute>} />
    <Route path="/billing" element={<SubscriptionRoute><Billing /></SubscriptionRoute>} />
    
    <Route path="/email-templates" element={<SubscriptionRoute><EmailTemplates /></SubscriptionRoute>} />
    <Route path="/sequences" element={<SubscriptionRoute><Sequences /></SubscriptionRoute>} />
    <Route path="/deal-analytics" element={<SubscriptionRoute><DealAnalytics /></SubscriptionRoute>} />
    <Route path="/team-arena" element={<SubscriptionRoute><TeamArena /></SubscriptionRoute>} />
    <Route path="/upgrade" element={<SubscriptionRoute><Upgrade /></SubscriptionRoute>} />
    <Route path="/subscription-success" element={<ProtectedRoute><SubscriptionSuccess /></ProtectedRoute>} />
    <Route path="/partner-dashboard" element={<ProtectedRoute><PartnerDashboard /></ProtectedRoute>} />
    <Route path="*" element={<NotFound />} />
  </Routes>
);

// Wrapper for public pages that shouldn't wait for auth
const PublicPageWrapper = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Fully public routes OUTSIDE auth providers */}
          <Route path="/p/:slug" element={<VideoNote />} />
          <Route path="/lp/:slug" element={<PublicLandingPage />} />
          
          {/* All other routes with auth context */}
          <Route path="/*" element={
            <AuthProvider>
              <SubscriptionProvider>
                <AppRoutes />
              </SubscriptionProvider>
            </AuthProvider>
          } />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
