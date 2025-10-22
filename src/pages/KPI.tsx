import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Phone, Calendar, TrendingUp, Target, Euro } from "lucide-react";
import { toast } from "sonner";

interface KPIData {
  callsToday: number;
  callsThisWeek: number;
  meetingsThisWeek: number;
  dealsWon: number;
  totalRevenue: number;
  winRate: number;
}

const KPI = () => {
  const [kpiData, setKpiData] = useState<KPIData>({
    callsToday: 0,
    callsThisWeek: 0,
    meetingsThisWeek: 0,
    dealsWon: 0,
    totalRevenue: 0,
    winRate: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchKPIs();
  }, []);

  const fetchKPIs = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date();
      const startOfToday = new Date(today.setHours(0, 0, 0, 0)).toISOString();
      const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay())).toISOString();

      // Calls today
      const { count: callsToday } = await supabase
        .from('activities')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('type', 'call')
        .gte('timestamp', startOfToday);

      // Calls this week
      const { count: callsThisWeek } = await supabase
        .from('activities')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('type', 'call')
        .gte('timestamp', startOfWeek);

      // Meetings this week
      const { count: meetingsThisWeek } = await supabase
        .from('activities')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('type', 'meeting')
        .gte('timestamp', startOfWeek);

      // Won deals
      const { data: wonDeals } = await supabase
        .from('deals')
        .select('amount_eur')
        .eq('stage', 'Gewonnen');

      const totalRevenue = wonDeals?.reduce((sum, deal) => sum + Number(deal.amount_eur), 0) || 0;
      const dealsWon = wonDeals?.length || 0;

      // Win rate (simplified)
      const { count: totalDeals } = await supabase
        .from('deals')
        .select('*', { count: 'exact', head: true })
        .in('stage', ['Gewonnen', 'Verloren']);

      const winRate = totalDeals ? (dealsWon / totalDeals) * 100 : 0;

      setKpiData({
        callsToday: callsToday || 0,
        callsThisWeek: callsThisWeek || 0,
        meetingsThisWeek: meetingsThisWeek || 0,
        dealsWon,
        totalRevenue,
        winRate,
      });
    } catch (error: any) {
      toast.error("Fehler beim Laden der KPIs");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <p className="text-muted-foreground">Lädt KPIs...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-8">KPIs & Performance</h1>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Calls Today */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Anrufe Heute</CardTitle>
              <Phone className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{kpiData.callsToday}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {kpiData.callsThisWeek} diese Woche
              </p>
            </CardContent>
          </Card>

          {/* Meetings */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Meetings diese Woche</CardTitle>
              <Calendar className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{kpiData.meetingsThisWeek}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Termine gesetzt
              </p>
            </CardContent>
          </Card>

          {/* Win Rate */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
              <Target className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{kpiData.winRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground mt-1">
                {kpiData.dealsWon} gewonnen
              </p>
            </CardContent>
          </Card>

          {/* Total Revenue */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Gesamtumsatz</CardTitle>
              <Euro className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">€{kpiData.totalRevenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Gewonnene Deals
              </p>
            </CardContent>
          </Card>

          {/* Activity Trend */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Aktivität</CardTitle>
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {kpiData.callsThisWeek + kpiData.meetingsThisWeek}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Aktivitäten diese Woche
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default KPI;