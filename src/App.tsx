import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { SubscriptionProvider, useSubscriptionContext } from "@/contexts/SubscriptionContext";
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
import Campaigns from "./pages/Campaigns";
import Integrations from "./pages/Integrations";
import LandingPageBuilder from "./pages/LandingPageBuilder";
import PublicLandingPage from "./pages/PublicLandingPage";
import Profile from "./pages/Profile";
import SubscriptionRequired from "./pages/SubscriptionRequired";
import Billing from "./pages/Billing";
import Invitations from "./pages/Invitations";
import InviteRegister from "./pages/InviteRegister";
import EmailTemplates from "./pages/EmailTemplates";
import DealAnalytics from "./pages/DealAnalytics";
import Upgrade from "./pages/Upgrade";
import SubscriptionSuccess from "./pages/SubscriptionSuccess";
import BrandingSetupPage from "./pages/BrandingSetup";

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

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Landing />} />
    <Route path="/auth" element={<Auth />} />
    <Route path="/subscription-required" element={<ProtectedRoute><SubscriptionRequired /></ProtectedRoute>} />
    <Route path="/onboarding" element={<SubscriptionRoute><Onboarding /></SubscriptionRoute>} />
    <Route path="/dashboard" element={<SubscriptionRoute><Dashboard /></SubscriptionRoute>} />
    <Route path="/pipeline" element={<SubscriptionRoute><Pipeline /></SubscriptionRoute>} />
    <Route path="/today" element={<SubscriptionRoute><Today /></SubscriptionRoute>} />
    <Route path="/contacts" element={<SubscriptionRoute><Contacts /></SubscriptionRoute>} />
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
    <Route path="/landing-pages" element={<SubscriptionRoute><LandingPageBuilder /></SubscriptionRoute>} />
    <Route path="/landing-builder" element={<SubscriptionRoute><LandingPageBuilder /></SubscriptionRoute>} />
    <Route path="/profile" element={<SubscriptionRoute><Profile /></SubscriptionRoute>} />
    <Route path="/billing" element={<SubscriptionRoute><Billing /></SubscriptionRoute>} />
    <Route path="/invitations" element={<SubscriptionRoute><Invitations /></SubscriptionRoute>} />
    <Route path="/email-templates" element={<SubscriptionRoute><EmailTemplates /></SubscriptionRoute>} />
    <Route path="/deal-analytics" element={<SubscriptionRoute><DealAnalytics /></SubscriptionRoute>} />
    <Route path="/branding" element={<SubscriptionRoute><BrandingSetupPage /></SubscriptionRoute>} />
    <Route path="/upgrade" element={<SubscriptionRoute><Upgrade /></SubscriptionRoute>} />
    <Route path="/subscription-success" element={<ProtectedRoute><SubscriptionSuccess /></ProtectedRoute>} />
    <Route path="/invite/:token" element={<InviteRegister />} />
    <Route path="/p/:slug" element={<VideoNote />} />
    <Route path="/lp/:slug" element={<PublicLandingPage />} />
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <SubscriptionProvider>
            <AppRoutes />
          </SubscriptionProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
