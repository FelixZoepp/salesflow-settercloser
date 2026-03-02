import { useLocation } from "react-router-dom";

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/startseite": "Startseite",
  "/today": "Heute",
  "/kpi": "KPIs",
  "/campaigns": "Kampagnen",
  "/contacts": "Kontakte",
  "/lead-search": "Lead-Recherche",
  "/import-leads": "Leads importieren",
  "/landing-pages": "Lead-Seiten",
  "/video-note": "Video-Nachrichten",
  "/pipeline": "Pipeline",
  "/deal-analytics": "Deal-Analytics",
  "/activity-log": "Aktivitäten",
  "/power-dialer": "Power Dialer",
  "/call-script": "Gesprächsleitfaden",
  "/objections": "Einwand-Bibliothek",
  "/email-campaigns": "Cold Mailing",
  "/email-templates": "E-Mail Templates",
  "/training": "Training",
  "/profile": "Profil",
  "/integrations": "Integrationen",
  "/api-keys": "API-Schlüssel",
  "/billing": "Abrechnung",
  "/partner-dashboard": "Partner-Programm",
  "/master-admin": "Admin",
};

export default function TopBar() {
  const location = useLocation();
  const pageTitle = pageTitles[location.pathname] || "";

  return (
    <div className="hidden md:flex items-center justify-between h-14 px-6 border-b border-border/50 bg-background/60 backdrop-blur-sm shrink-0">
      <div className="text-sm font-medium text-muted-foreground">
        {pageTitle}
      </div>
    </div>
  );
}
