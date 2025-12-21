import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, TrendingDown, Users, Eye, Megaphone, Play, Calendar, Flame, Activity } from "lucide-react";
import { toast } from "sonner";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import EngagementFeed from "@/components/EngagementFeed";

interface KPIData {
  dialAttempts: number;
  appointmentsSet: number;
  firstCalls: number;
  secondCalls: number;
  closedDeals: number;
  totalRevenue: number;
  revenuePerCustomer: number;
  revenuePerDial: number;
  appointmentRate: number;
  qualificationRate: number;
  closingRate: number;
  noShowRate: number;
}

interface TrendData {
  dialAttempts: number;
  appointmentsSet: number;
  firstCalls: number;
  secondCalls: number;
  closedDeals: number;
  totalRevenue: number;
  revenuePerCustomer: number;
  revenuePerDial: number;
}

interface MonthlyData {
  month: string;
  revenue: number;
}

interface LeadStats {
  totalCampaigns: number;
  activeCampaigns: number;
  totalLeads: number;
  pageViews: number;
  hotLeads: number;
  bookings: number;
}

const Dashboard = () => {
  const [kpis, setKPIs] = useState<KPIData>({
    dialAttempts: 0,
    appointmentsSet: 0,
    firstCalls: 0,
    secondCalls: 0,
    closedDeals: 0,
    totalRevenue: 0,
    revenuePerCustomer: 0,
    revenuePerDial: 0,
    appointmentRate: 0,
    qualificationRate: 0,
    closingRate: 0,
    noShowRate: 0,
  });
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [trends, setTrends] = useState<TrendData>({
    dialAttempts: 0,
    appointmentsSet: 0,
    firstCalls: 0,
    secondCalls: 0,
    closedDeals: 0,
    totalRevenue: 0,
    revenuePerCustomer: 0,
    revenuePerDial: 0,
  });
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("month");
  const [leadStats, setLeadStats] = useState<LeadStats>({
    totalCampaigns: 0,
    activeCampaigns: 0,
    totalLeads: 0,
    pageViews: 0,
    hotLeads: 0,
    bookings: 0,
  });

  useEffect(() => {
    fetchDashboardData();
    fetchLeadStats();
  }, [dateRange]);

  const getDateRanges = () => {
    const now = new Date();
    let currentStart: Date;
    let previousStart: Date;
    let previousEnd: Date;
    
    if (dateRange === 'today') {
      currentStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      previousEnd = new Date(currentStart);
      previousEnd.setDate(previousEnd.getDate() - 1);
      previousStart = new Date(previousEnd.getFullYear(), previousEnd.getMonth(), previousEnd.getDate());
    } else if (dateRange === 'week') {
      currentStart = new Date(now);
      currentStart.setDate(currentStart.getDate() - 7);
      previousEnd = new Date(currentStart);
      previousStart = new Date(previousEnd);
      previousStart.setDate(previousStart.getDate() - 7);
    } else {
      currentStart = new Date(now);
      currentStart.setDate(currentStart.getDate() - 30);
      previousEnd = new Date(currentStart);
      previousStart = new Date(previousEnd);
      previousStart.setDate(previousStart.getDate() - 30);
    }
    
    return {
      currentStart: currentStart.toISOString(),
      previousStart: previousStart.toISOString(),
      previousEnd: previousEnd.toISOString(),
    };
  };

  const calculateTrend = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const fetchDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { currentStart, previousStart, previousEnd } = getDateRanges();

      // Fetch current period activities (calls)
      const { data: currentActivities } = await supabase
        .from('activities')
        .select('*')
        .eq('type', 'call')
        .gte('timestamp', currentStart);

      // Fetch previous period activities
      const { data: previousActivities } = await supabase
        .from('activities')
        .select('*')
        .eq('type', 'call')
        .gte('timestamp', previousStart)
        .lt('timestamp', previousEnd);

      const dialAttempts = currentActivities?.length || 0;
      const prevDialAttempts = previousActivities?.length || 0;
      const reached = currentActivities?.filter(a => a.outcome === 'reached' || a.outcome === 'interested').length || 0;

      // Fetch current period deals
      const { data: currentDeals } = await supabase
        .from('deals')
        .select('*')
        .gte('created_at', currentStart);

      // Fetch previous period deals
      const { data: previousDeals } = await supabase
        .from('deals')
        .select('*')
        .gte('created_at', previousStart)
        .lt('created_at', previousEnd);

      const allDeals = currentDeals || [];
      const prevDeals = previousDeals || [];
      
      // Cold pipeline stats - current
      const appointmentsSet = allDeals.filter(d => d.stage === 'Termin gelegt').length;
      const prevAppointmentsSet = prevDeals.filter(d => d.stage === 'Termin gelegt').length;
      
      // Setter/Closer pipeline stats - current
      const settingDeals = allDeals.filter(d => d.pipeline === 'setting_closing');
      const prevSettingDeals = prevDeals.filter(d => d.pipeline === 'setting_closing');
      
      const firstCalls = settingDeals.filter(d => 
        d.stage === 'Setting terminiert' || d.stage === 'Closing terminiert'
      ).length;
      const prevFirstCalls = prevSettingDeals.filter(d => 
        d.stage === 'Setting terminiert' || d.stage === 'Closing terminiert'
      ).length;
      
      const secondCalls = settingDeals.filter(d => d.stage === 'CC2 terminiert').length;
      const prevSecondCalls = prevSettingDeals.filter(d => d.stage === 'CC2 terminiert').length;
      
      const closedDeals = allDeals.filter(d => d.stage === 'Abgeschlossen').length;
      const prevClosedDeals = prevDeals.filter(d => d.stage === 'Abgeschlossen').length;
      
      const noShows = settingDeals.filter(d => 
        d.stage === 'Setting No Show' || d.stage === 'Closing No Show'
      ).length;

      // Revenue calculations - current
      const totalRevenue = allDeals
        .filter(d => d.stage === 'Abgeschlossen')
        .reduce((sum, d) => sum + Number(d.amount_eur || 0), 0);
      const prevTotalRevenue = prevDeals
        .filter(d => d.stage === 'Abgeschlossen')
        .reduce((sum, d) => sum + Number(d.amount_eur || 0), 0);
      
      const revenuePerCustomer = closedDeals > 0 ? totalRevenue / closedDeals : 0;
      const prevRevenuePerCustomer = prevClosedDeals > 0 ? prevTotalRevenue / prevClosedDeals : 0;
      
      const revenuePerDial = dialAttempts > 0 ? totalRevenue / dialAttempts : 0;
      const prevRevenuePerDial = prevDialAttempts > 0 ? prevTotalRevenue / prevDialAttempts : 0;

      // Rates
      const appointmentRate = dialAttempts > 0 ? (appointmentsSet / dialAttempts) * 100 : 0;
      const qualificationRate = reached > 0 ? (appointmentsSet / reached) * 100 : 0;
      const closingRate = settingDeals.length > 0 ? (closedDeals / settingDeals.length) * 100 : 0;
      const noShowRate = settingDeals.length > 0 ? (noShows / settingDeals.length) * 100 : 0;

      // Calculate trends
      setTrends({
        dialAttempts: calculateTrend(dialAttempts, prevDialAttempts),
        appointmentsSet: calculateTrend(appointmentsSet, prevAppointmentsSet),
        firstCalls: calculateTrend(firstCalls, prevFirstCalls),
        secondCalls: calculateTrend(secondCalls, prevSecondCalls),
        closedDeals: calculateTrend(closedDeals, prevClosedDeals),
        totalRevenue: calculateTrend(totalRevenue, prevTotalRevenue),
        revenuePerCustomer: calculateTrend(revenuePerCustomer, prevRevenuePerCustomer),
        revenuePerDial: calculateTrend(revenuePerDial, prevRevenuePerDial),
      });

      setKPIs({
        dialAttempts,
        appointmentsSet,
        firstCalls,
        secondCalls,
        closedDeals,
        totalRevenue,
        revenuePerCustomer,
        revenuePerDial,
        appointmentRate,
        qualificationRate,
        closingRate,
        noShowRate,
      });

      // Monthly revenue data for chart
      const monthNames = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
      const currentMonth = new Date().getMonth();
      
      // Get deals from the last 12 months for the chart
      const yearStart = new Date();
      yearStart.setMonth(yearStart.getMonth() - 11);
      yearStart.setDate(1);

      const { data: yearDeals } = await supabase
        .from('deals')
        .select('*')
        .eq('stage', 'Abgeschlossen')
        .gte('created_at', yearStart.toISOString());

      const monthlyRevenue: { [key: string]: number } = {};
      
      // Initialize all months
      for (let i = 0; i < 12; i++) {
        const monthIndex = (currentMonth - 11 + i + 12) % 12;
        monthlyRevenue[monthNames[monthIndex]] = 0;
      }

      // Aggregate revenue by month
      yearDeals?.forEach(deal => {
        const dealDate = new Date(deal.created_at);
        const monthName = monthNames[dealDate.getMonth()];
        monthlyRevenue[monthName] = (monthlyRevenue[monthName] || 0) + Number(deal.amount_eur || 0);
      });

      const chartData = Object.entries(monthlyRevenue).map(([month, revenue]) => ({
        month,
        revenue: revenue / 1000, // Convert to thousands for display
      }));

      setMonthlyData(chartData);

    } catch (error: any) {
      console.error('Dashboard error:', error);
      toast.error("Fehler beim Laden des Dashboards");
    } finally {
      setLoading(false);
    }
  };

  const fetchLeadStats = async () => {
    try {
      // Fetch campaigns
      const { data: campaigns } = await supabase.from("campaigns").select("id, status");
      const totalCampaigns = campaigns?.length || 0;
      const activeCampaigns = campaigns?.filter(c => c.status === "active").length || 0;

      // Fetch leads count
      const { count: totalLeads } = await supabase.from("contacts").select("id", { count: "exact", head: true });

      // Fetch tracking stats
      const { data: trackingEvents } = await supabase
        .from("lead_tracking_events")
        .select("event_type");

      const pageViews = trackingEvents?.filter(e => e.event_type === "page_view").length || 0;
      const bookings = trackingEvents?.filter(e => e.event_type === "booking_click").length || 0;

      // Fetch hot leads (score >= 70)
      const { count: hotLeads } = await supabase
        .from("contacts")
        .select("id", { count: "exact", head: true })
        .gte("lead_score", 70);

      setLeadStats({
        totalCampaigns,
        activeCampaigns,
        totalLeads: totalLeads || 0,
        pageViews,
        hotLeads: hotLeads || 0,
        bookings,
      });
    } catch (error) {
      console.error("Error fetching lead stats:", error);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('de-DE', { 
      minimumFractionDigits: 0,
      maximumFractionDigits: 0 
    }).format(value);
  };

  const getTrendLabel = () => {
    if (dateRange === 'today') return 'zum Vortag';
    if (dateRange === 'week') return 'zur Vorwoche';
    return 'zum Vormonat';
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <p className="text-muted-foreground">Lädt Dashboard...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-muted/30 via-background to-primary/5 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-48 bg-card border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Heute</SelectItem>
                <SelectItem value="week">Letzte 7 Tage</SelectItem>
                <SelectItem value="month">Letzte 30 Tage</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Lead Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            <Card className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Megaphone className="w-4 h-4" />
                  <span className="text-xs">Kampagnen</span>
                </div>
                <p className="text-2xl font-bold">{leadStats.totalCampaigns}</p>
                <p className="text-xs text-muted-foreground">{leadStats.activeCampaigns} aktiv</p>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Users className="w-4 h-4" />
                  <span className="text-xs">Leads gesamt</span>
                </div>
                <p className="text-2xl font-bold">{leadStats.totalLeads}</p>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Eye className="w-4 h-4" />
                  <span className="text-xs">Seitenaufrufe</span>
                </div>
                <p className="text-2xl font-bold">{leadStats.pageViews}</p>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Flame className="w-4 h-4" />
                  <span className="text-xs">Heiße Leads</span>
                </div>
                <p className="text-2xl font-bold">{leadStats.hotLeads}</p>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Calendar className="w-4 h-4" />
                  <span className="text-xs">Termine gebucht</span>
                </div>
                <p className="text-2xl font-bold">{leadStats.bookings}</p>
              </CardContent>
            </Card>
          </div>

          {/* KPI Cards Row */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
            <KPICard
              label="Wählversuche"
              value={formatCurrency(kpis.dialAttempts)}
              trend={trends.dialAttempts}
              trendLabel={getTrendLabel()}
            />
            <KPICard
              label="Termine gelegt"
              value={kpis.appointmentsSet.toString()}
              trend={trends.appointmentsSet}
              trendLabel={getTrendLabel()}
            />
            <KPICard
              label="Erstgespräche"
              value={kpis.firstCalls.toString()}
              trend={trends.firstCalls}
              trendLabel={getTrendLabel()}
            />
            <KPICard
              label="Zweitgespräche"
              value={kpis.secondCalls.toString()}
              trend={trends.secondCalls}
              trendLabel={getTrendLabel()}
            />
            <KPICard
              label="Abschlüsse"
              value={kpis.closedDeals.toString()}
              trend={trends.closedDeals}
              trendLabel={getTrendLabel()}
              highlighted
            />
          </div>

          {/* Engagement Feed Section */}
          <div className="grid lg:grid-cols-3 gap-6 mb-8">
            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  Engagement Feed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <EngagementFeed />
              </CardContent>
            </Card>
            <div className="lg:col-span-2">
              <Card className="bg-card border-border h-full">
                <CardContent className="p-6">
                  <h3 className="text-sm font-medium text-muted-foreground mb-4">
                    Jährliche Umsatzübersicht
                  </h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthlyData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis 
                          dataKey="month" 
                          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                          axisLine={{ stroke: 'hsl(var(--border))' }}
                        />
                        <YAxis 
                          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                          axisLine={{ stroke: 'hsl(var(--border))' }}
                          tickFormatter={(value) => `${value}K €`}
                        />
                        <Tooltip 
                          formatter={(value: number) => [`${formatCurrency(value * 1000)}€`, 'Umsatz']}
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                          }}
                        />
                        <Bar 
                          dataKey="revenue" 
                          fill="hsl(38 92% 50%)" 
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quotes/Rates */}
            <Card className="bg-card border-border">
              <CardContent className="p-6 space-y-6">
                <QuoteRow 
                  label="Terminquote:" 
                  value={kpis.appointmentRate.toFixed(0)} 
                  positive 
                />
                <QuoteRow 
                  label="Qualifiquote:" 
                  value={kpis.qualificationRate.toFixed(0)} 
                  positive 
                />
                <QuoteRow 
                  label="Abschlussquote:" 
                  value={kpis.closingRate.toFixed(0)} 
                  positive 
                />
                <QuoteRow 
                  label="No-Showquote:" 
                  value={kpis.noShowRate.toFixed(0)} 
                  positive={false} 
                />
              </CardContent>
            </Card>
          </div>

          {/* Bottom Revenue Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <p className="text-sm text-muted-foreground mb-2">Umsatz Gesamt</p>
                <p className="text-3xl font-bold text-foreground">
                  {formatCurrency(kpis.totalRevenue)}€
                </p>
                <div className="flex items-center gap-1 mt-2">
                  {trends.totalRevenue >= 0 ? (
                    <TrendingUp className="w-3 h-3 text-[hsl(var(--success))]" />
                  ) : (
                    <TrendingDown className="w-3 h-3 text-[hsl(var(--danger))]" />
                  )}
                  <span className={`text-xs ${trends.totalRevenue >= 0 ? 'text-[hsl(var(--success))]' : 'text-[hsl(var(--danger))]'}`}>
                    {trends.totalRevenue >= 0 ? '+' : ''}{trends.totalRevenue.toFixed(1)}% {getTrendLabel()}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <p className="text-sm text-muted-foreground mb-2">Umsatz pro Kunde</p>
                <p className="text-3xl font-bold text-foreground">
                  {formatCurrency(kpis.revenuePerCustomer)}€
                </p>
                <div className="flex items-center gap-1 mt-2">
                  {trends.revenuePerCustomer >= 0 ? (
                    <TrendingUp className="w-3 h-3 text-[hsl(var(--success))]" />
                  ) : (
                    <TrendingDown className="w-3 h-3 text-[hsl(var(--danger))]" />
                  )}
                  <span className={`text-xs ${trends.revenuePerCustomer >= 0 ? 'text-[hsl(var(--success))]' : 'text-[hsl(var(--danger))]'}`}>
                    {trends.revenuePerCustomer >= 0 ? '+' : ''}{trends.revenuePerCustomer.toFixed(1)}% {getTrendLabel()}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <p className="text-sm text-muted-foreground mb-2">Umsatz pro Wählversuch</p>
                <p className="text-3xl font-bold text-foreground">
                  {kpis.revenuePerDial.toFixed(2)}€
                </p>
                <div className="flex items-center gap-1 mt-2">
                  {trends.revenuePerDial >= 0 ? (
                    <TrendingUp className="w-3 h-3 text-[hsl(var(--success))]" />
                  ) : (
                    <TrendingDown className="w-3 h-3 text-[hsl(var(--danger))]" />
                  )}
                  <span className={`text-xs ${trends.revenuePerDial >= 0 ? 'text-[hsl(var(--success))]' : 'text-[hsl(var(--danger))]'}`}>
                    {trends.revenuePerDial >= 0 ? '+' : ''}{trends.revenuePerDial.toFixed(1)}% {getTrendLabel()}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

// KPI Card Component
interface KPICardProps {
  label: string;
  value: string;
  trend: number;
  trendLabel: string;
  highlighted?: boolean;
}

const KPICard = ({ label, value, trend, trendLabel, highlighted }: KPICardProps) => {
  const isPositive = trend >= 0;
  
  return (
    <Card className={`${highlighted ? 'bg-primary text-primary-foreground' : 'bg-card'} border-border`}>
      <CardContent className="p-4">
        <p className={`text-xs ${highlighted ? 'text-primary-foreground/80' : 'text-muted-foreground'} mb-1`}>
          {label}
        </p>
        <p className={`text-2xl font-bold ${highlighted ? 'text-primary-foreground' : 'text-foreground'}`}>
          {value}
        </p>
        <div className="flex items-center gap-1 mt-1">
          {isPositive ? (
            <TrendingUp className={`w-3 h-3 ${highlighted ? 'text-primary-foreground/80' : 'text-[hsl(var(--success))]'}`} />
          ) : (
            <TrendingDown className={`w-3 h-3 ${highlighted ? 'text-primary-foreground/80' : 'text-[hsl(var(--danger))]'}`} />
          )}
          <span className={`text-xs ${highlighted ? 'text-primary-foreground/80' : isPositive ? 'text-[hsl(var(--success))]' : 'text-[hsl(var(--danger))]'}`}>
            {isPositive ? '+' : ''}{trend}% {trendLabel}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

// Quote Row Component
interface QuoteRowProps {
  label: string;
  value: string;
  positive: boolean;
}

const QuoteRow = ({ label, value, positive }: QuoteRowProps) => (
  <div className="flex items-center justify-between">
    <span className="text-sm text-muted-foreground">{label}</span>
    <div className="flex items-center gap-2">
      {positive ? (
        <TrendingUp className="w-4 h-4 text-[hsl(var(--success))]" />
      ) : (
        <TrendingDown className="w-4 h-4 text-[hsl(var(--danger))]" />
      )}
      <span className={`text-lg font-semibold ${positive ? 'text-[hsl(var(--success))]' : 'text-[hsl(var(--danger))]'}`}>
        {value}%
      </span>
    </div>
  </div>
);

export default Dashboard;
