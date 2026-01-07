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
        async (payload) => {
          const newLead = payload.new as {
            id: string;
            first_name: string;
            last_name: string;
            company: string | null;
            lead_score: number;
            campaign_id: string | null;
            account_id: string;
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

            // Auto-create deal for hot lead
            try {
              const { data: { user } } = await supabase.auth.getUser();
              if (!user) return;

              // Check if deal already exists
              const { data: existingDeal } = await supabase
                .from('deals')
                .select('id')
                .eq('contact_id', newLead.id)
                .maybeSingle();

              if (!existingDeal) {
                // Create deal and set to "Lead" stage in cold pipeline
                const { error } = await supabase
                  .from('deals')
                  .insert({
                    contact_id: newLead.id,
                    title: `${newLead.first_name} ${newLead.last_name} - ${newLead.company || 'Hot Lead'}`,
                    stage: 'Lead',
                    pipeline: 'cold',
                    amount_eur: 0,
                    setter_id: user.id,
                    account_id: newLead.account_id,
                    next_action: 'Anrufen - Hot Lead!'
                  });

                if (error) {
                  console.error('Error creating deal for hot lead:', error);
                }
              }
            } catch (error) {
              console.error('Error auto-creating deal:', error);
            }

            toast.success(
              `🔥 Hot Lead: ${newLead.first_name} ${newLead.last_name}`,
              {
                description: `${newLead.company || "Unbekanntes Unternehmen"} - Score ${newLead.lead_score}. Deal wurde automatisch erstellt!`,
                duration: 10000,
                action: {
                  label: "Zur Pipeline",
                  onClick: () => {
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
