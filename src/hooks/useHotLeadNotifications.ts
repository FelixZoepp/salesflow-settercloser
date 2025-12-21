import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const HOT_LEAD_THRESHOLD = 70;

export const useHotLeadNotifications = () => {
  // Track leads we've already notified about to avoid duplicates
  const notifiedLeads = useRef<Set<string>>(new Set());

  useEffect(() => {
    // Subscribe to changes on contacts table
    const channel = supabase
      .channel("hot-lead-notifications")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "contacts",
        },
        (payload) => {
          const newLead = payload.new as {
            id: string;
            first_name: string;
            last_name: string;
            company: string | null;
            lead_score: number;
          };
          const oldLead = payload.old as {
            id: string;
            lead_score: number;
          };

          // Check if lead just crossed the hot threshold
          const wasNotHot = (oldLead.lead_score || 0) < HOT_LEAD_THRESHOLD;
          const isNowHot = (newLead.lead_score || 0) >= HOT_LEAD_THRESHOLD;

          if (wasNotHot && isNowHot && !notifiedLeads.current.has(newLead.id)) {
            notifiedLeads.current.add(newLead.id);

            toast.success(
              `🔥 Hot Lead: ${newLead.first_name} ${newLead.last_name}`,
              {
                description: `${newLead.company || "Unbekanntes Unternehmen"} hat einen Score von ${newLead.lead_score} erreicht!`,
                duration: 10000,
                action: {
                  label: "Ansehen",
                  onClick: () => {
                    // Navigate to pipeline - user can find the lead there
                    window.location.href = "/pipeline";
                  },
                },
              }
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
};
