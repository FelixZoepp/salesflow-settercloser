import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAccountFilter } from "@/hooks/useAccountFilter";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Coins } from "lucide-react";
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
  const { accountId } = useAccountFilter();
  const location = useLocation();
  const currentMonth = new Date().toISOString().slice(0, 7);

  const { data: credits } = useQuery({
    queryKey: ['enrichment-credits-topbar', accountId, currentMonth],
    queryFn: async () => {
      if (!accountId) return null;
      const { data } = await supabase
        .from('enrichment_credits')
        .select('phone_credits_used, phone_credits_limit, email_credits_used, email_credits_limit')
        .eq('account_id', accountId)
        .eq('month_year', currentMonth)
        .maybeSingle();
      return data;
    },
    enabled: !!accountId,
  });

  const totalUsed = (credits?.phone_credits_used ?? 0) + (credits?.email_credits_used ?? 0);
  const totalLimit = (credits?.phone_credits_limit ?? 100) + (credits?.email_credits_limit ?? 100);
  const remaining = totalLimit - totalUsed;

  const pageTitle = pageTitles[location.pathname] || "";

  return (
    <div className="hidden md:flex items-center justify-between h-14 px-6 border-b border-border/50 bg-background/60 backdrop-blur-sm shrink-0">
      <div className="text-sm font-medium text-muted-foreground">
        {pageTitle}
      </div>

      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/50 border border-border/50 cursor-default">
            <Coins className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-semibold text-foreground">{remaining}</span>
            <span className="text-xs text-muted-foreground">Credits</span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p className="text-xs">{totalUsed} / {totalLimit} Credits verbraucht</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
