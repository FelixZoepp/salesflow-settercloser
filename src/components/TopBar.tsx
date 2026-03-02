import { useLocation } from "react-router-dom";
import { useAccountFilter } from "@/hooks/useAccountFilter";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Coins } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
  const { accountId } = useAccountFilter();
  const currentMonth = new Date().toISOString().slice(0, 7);

  const { data: credits } = useQuery({
    queryKey: ['enrichment-credits', accountId, currentMonth],
    queryFn: async () => {
      if (!accountId) return null;
      const { data, error } = await supabase
        .from('enrichment_credits')
        .select('*')
        .eq('account_id', accountId)
        .eq('month_year', currentMonth)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!accountId,
  });

  const phoneUsed = credits?.phone_credits_used ?? 0;
  const emailUsed = credits?.email_credits_used ?? 0;
  const phoneLimit = credits?.phone_credits_limit ?? 100;
  const emailLimit = credits?.email_credits_limit ?? 100;
  const phoneRemaining = phoneLimit - phoneUsed;
  const emailRemaining = emailLimit - emailUsed;
  const totalRemaining = phoneRemaining + emailRemaining;
  const totalLimit = phoneLimit + emailLimit;

  return (
    <div className="hidden md:flex items-center justify-between h-14 px-6 border-b border-border/50 bg-background/60 backdrop-blur-sm shrink-0">
      <div className="text-sm font-medium text-muted-foreground">
        {pageTitle}
      </div>
      {accountId && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2 text-sm cursor-default">
                <Coins className="h-4 w-4 text-amber-400" />
                <span className="font-medium text-foreground">{totalRemaining}</span>
                <span className="text-xs text-muted-foreground">Credits</span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <div className="text-xs space-y-1">
                <p>📞 Telefon: {phoneRemaining} übrig</p>
                <p>📧 E-Mail: {emailRemaining} übrig</p>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
}
