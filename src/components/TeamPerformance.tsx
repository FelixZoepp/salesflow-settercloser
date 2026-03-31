import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Trophy, Phone, MessageSquare, Calendar, TrendingUp, Loader2 } from "lucide-react";

interface MemberStats {
  id: string;
  name: string;
  connectionsAccepted: number;
  messagesSent: number;
  positiveReplies: number;
  appointmentsBooked: number;
  totalLeads: number;
}

export default function TeamPerformance() {
  const [members, setMembers] = useState<MemberStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeamStats();
  }, []);

  const fetchTeamStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase.from("profiles").select("account_id").eq("id", user.id).single();
      if (!profile?.account_id) return;

      // Get all team members
      const { data: teamProfiles } = await supabase
        .from("profiles")
        .select("id, name")
        .eq("account_id", profile.account_id);

      if (!teamProfiles || teamProfiles.length <= 1) { setLoading(false); return; }

      // Get all outbound contacts with owner
      const { data: contacts } = await supabase
        .from("contacts")
        .select("owner_user_id, workflow_status")
        .eq("account_id", profile.account_id)
        .eq("lead_type", "outbound");

      const memberStats: MemberStats[] = teamProfiles.map(p => {
        const myContacts = (contacts || []).filter((c: any) => c.owner_user_id === p.id);
        const countStatus = (statuses: string[]) => myContacts.filter((c: any) => statuses.includes(c.workflow_status)).length;

        const advanced = ['vernetzung_angenommen', 'erstnachricht_gesendet', 'fu1_gesendet', 'fu2_gesendet', 'fu3_gesendet', 'reagiert_warm', 'positiv_geantwortet', 'termin_gebucht', 'abgeschlossen'];
        const messaged = ['erstnachricht_gesendet', 'fu1_gesendet', 'fu2_gesendet', 'fu3_gesendet', 'reagiert_warm', 'positiv_geantwortet', 'termin_gebucht', 'abgeschlossen'];

        return {
          id: p.id,
          name: p.name || "Unbenannt",
          connectionsAccepted: countStatus(advanced),
          messagesSent: countStatus(messaged),
          positiveReplies: countStatus(['positiv_geantwortet', 'termin_gebucht', 'abgeschlossen']),
          appointmentsBooked: countStatus(['termin_gebucht', 'abgeschlossen']),
          totalLeads: myContacts.length,
        };
      }).sort((a, b) => b.appointmentsBooked - a.appointmentsBooked);

      setMembers(memberStats);
    } catch (err) {
      console.error("Error fetching team stats:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return null;
  if (members.length <= 1) return null; // Don't show for solo users

  const topPerformer = members[0];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Users className="w-4 h-4" />
          Team Performance
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {members.map((member, idx) => (
            <div key={member.id} className={`flex items-center gap-3 p-2.5 rounded-lg ${idx === 0 ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-muted/30'}`}>
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                {idx === 0 ? <Trophy className="w-4 h-4 text-amber-500" /> : member.name[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium truncate">{member.name}</span>
                  {idx === 0 && <Badge className="text-[9px] bg-amber-500/20 text-amber-400 border-amber-500/30">Top</Badge>}
                </div>
                <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-0.5"><Users className="w-3 h-3" />{member.totalLeads}</span>
                  <span className="flex items-center gap-0.5"><MessageSquare className="w-3 h-3" />{member.messagesSent}</span>
                  <span className="flex items-center gap-0.5 text-green-400"><TrendingUp className="w-3 h-3" />{member.positiveReplies}</span>
                  <span className="flex items-center gap-0.5 text-pink-400"><Calendar className="w-3 h-3" />{member.appointmentsBooked}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
