import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Phone, Calendar, TrendingUp, Target, Euro, Users, PhoneOff, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

type TimeFilter = 'today' | 'week' | 'month';

interface ColdKPIData {
  callsTotal: number;
  callsReached: number;
  reachRate: number;
  decisionMakers: number;
  appointments: number;
  appointmentRate: number;
  rejectionRate: number;
}

interface SetterCloserKPIData {
  appointments: number;
  noShowRate: number;
  followUpRate: number;
  closingRate: number;
  revenue: number;
  dealsWon: number;
}

const KPI = () => {
  const [coldKPIs, setColdKPIs] = useState<ColdKPIData>({
    callsTotal: 0,
    callsReached: 0,
    reachRate: 0,
    decisionMakers: 0,
    appointments: 0,
    appointmentRate: 0,
    rejectionRate: 0,
  });
  
  const [setterCloserKPIs, setSetterCloserKPIs] = useState<SetterCloserKPIData>({
    appointments: 0,
    noShowRate: 0,
    followUpRate: 0,
    closingRate: 0,
    revenue: 0,
    dealsWon: 0,
  });
  
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('week');

  useEffect(() => {
    fetchKPIs();
  }, [timeFilter]);

  const getDateRange = () => {
    const now = new Date();
    let startDate: Date;
    
    if (timeFilter === 'today') {
      startDate = new Date(now.setHours(0, 0, 0, 0));
    } else if (timeFilter === 'week') {
      startDate = new Date(now.setDate(now.getDate() - 7));
    } else {
      startDate = new Date(now.setDate(now.getDate() - 30));
    }
    
    return startDate.toISOString();
  };

  const fetchKPIs = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const startDate = getDateRange();

      // Cold Pipeline KPIs
      const { data: coldActivities } = await supabase
        .from('activities')
        .select('*, deal_id(pipeline)')
        .eq('type', 'call')
        .gte('timestamp', startDate);

      const coldCalls = coldActivities?.filter((a: any) => a.deal_id?.pipeline === 'cold') || [];
      const callsTotal = coldCalls.length;
      const callsReached = coldCalls.filter((a: any) => 
        ['reached', 'decision_maker', 'interested', 'callback'].includes(a.outcome)
      ).length;
      const decisionMakers = coldCalls.filter((a: any) => a.outcome === 'decision_maker').length;

      const { count: appointments } = await supabase
        .from('deals')
        .select('*', { count: 'exact', head: true })
        .eq('pipeline', 'cold')
        .eq('stage', 'Termin gelegt' as any)
        .gte('created_at', startDate);

      const { count: rejections } = await supabase
        .from('deals')
        .select('*', { count: 'exact', head: true })
        .eq('pipeline', 'cold')
        .eq('stage', 'Kein Interesse / Kein Bedarf' as any)
        .gte('created_at', startDate);

      setColdKPIs({
        callsTotal,
        callsReached,
        reachRate: callsTotal > 0 ? (callsReached / callsTotal) * 100 : 0,
        decisionMakers,
        appointments: appointments || 0,
        appointmentRate: callsTotal > 0 ? ((appointments || 0) / callsTotal) * 100 : 0,
        rejectionRate: callsTotal > 0 ? ((rejections || 0) / callsTotal) * 100 : 0,
      });

      // Setter/Closer Pipeline KPIs
      const { data: setterCloserDeals } = await supabase
        .from('deals')
        .select('*')
        .eq('pipeline', 'setting_closing')
        .gte('created_at', startDate);

      const totalAppointments = setterCloserDeals?.length || 0;
      const noShows = setterCloserDeals?.filter((d: any) => 
        d.stage === 'Setting No Show' || d.stage === 'Closing No Show'
      ).length || 0;
      const followUps = setterCloserDeals?.filter((d: any) => 
        d.stage === 'Setting Follow Up' || d.stage === 'Closing Follow Up'
      ).length || 0;
      const won = setterCloserDeals?.filter((d: any) => d.stage === 'Abgeschlossen').length || 0;
      const totalRevenue = setterCloserDeals
        ?.filter((d: any) => d.stage === 'Abgeschlossen')
        .reduce((sum, d) => sum + Number(d.amount_eur), 0) || 0;

      setSetterCloserKPIs({
        appointments: totalAppointments,
        noShowRate: totalAppointments > 0 ? (noShows / totalAppointments) * 100 : 0,
        followUpRate: totalAppointments > 0 ? (followUps / totalAppointments) * 100 : 0,
        closingRate: totalAppointments > 0 ? (won / totalAppointments) * 100 : 0,
        revenue: totalRevenue,
        dealsWon: won,
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
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">KPIs & Performance</h1>
          <Tabs value={timeFilter} onValueChange={(v) => setTimeFilter(v as TimeFilter)}>
            <TabsList>
              <TabsTrigger value="today">Heute</TabsTrigger>
              <TabsTrigger value="week">Woche</TabsTrigger>
              <TabsTrigger value="month">Monat</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Kaltakquise</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Anwahlen</CardTitle>
                <Phone className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{coldKPIs.callsTotal}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {coldKPIs.callsReached} erreicht
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Erreichbarkeit</CardTitle>
                <CheckCircle className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{coldKPIs.reachRate.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {coldKPIs.decisionMakers} Entscheider
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Terminquote</CardTitle>
                <Calendar className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{coldKPIs.appointmentRate.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {coldKPIs.appointments} Termine
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Ablehnungsquote</CardTitle>
                <XCircle className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{coldKPIs.rejectionRate.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Kein Interesse
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Setter/Closer</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Termine</CardTitle>
                <Calendar className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{setterCloserKPIs.appointments}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Gesamt
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">No-Show-Rate</CardTitle>
                <PhoneOff className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{setterCloserKPIs.noShowRate.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Nicht erschienen
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Follow-Up-Quote</CardTitle>
                <TrendingUp className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{setterCloserKPIs.followUpRate.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Nachverfolgung
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Closing-Rate</CardTitle>
                <Target className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{setterCloserKPIs.closingRate.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {setterCloserKPIs.dealsWon} abgeschlossen
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Umsatz</CardTitle>
                <Euro className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">€{setterCloserKPIs.revenue.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Gewonnene Deals
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default KPI;