import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, TrendingDown } from "lucide-react";
import { toast } from "sonner";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

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

interface MonthlyData {
  month: string;
  revenue: number;
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
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("month");

  useEffect(() => {
    fetchDashboardData();
  }, [dateRange]);

  const getDateRange = () => {
    const now = new Date();
    let startDate: Date;
    
    if (dateRange === 'today') {
      startDate = new Date(now.setHours(0, 0, 0, 0));
    } else if (dateRange === 'week') {
      startDate = new Date(now.setDate(now.getDate() - 7));
    } else {
      startDate = new Date(now.setDate(now.getDate() - 30));
    }
    
    return startDate.toISOString();
  };

  const fetchDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const startDate = getDateRange();

      // Fetch activities (calls)
      const { data: activities } = await supabase
        .from('activities')
        .select('*')
        .eq('type', 'call')
        .gte('timestamp', startDate);

      const dialAttempts = activities?.length || 0;
      const reached = activities?.filter(a => a.outcome === 'reached' || a.outcome === 'interested').length || 0;

      // Fetch deals
      const { data: deals } = await supabase
        .from('deals')
        .select('*')
        .gte('created_at', startDate);

      const allDeals = deals || [];
      
      // Cold pipeline stats
      const appointmentsSet = allDeals.filter(d => d.stage === 'Termin gelegt').length;
      
      // Setter/Closer pipeline stats
      const settingDeals = allDeals.filter(d => d.pipeline === 'setting_closing');
      const firstCalls = settingDeals.filter(d => 
        d.stage === 'Setting terminiert' || d.stage === 'Closing terminiert'
      ).length;
      const secondCalls = settingDeals.filter(d => 
        d.stage === 'CC2 terminiert'
      ).length;
      const closedDeals = allDeals.filter(d => d.stage === 'Abgeschlossen').length;
      const noShows = settingDeals.filter(d => 
        d.stage === 'Setting No Show' || d.stage === 'Closing No Show'
      ).length;

      // Revenue calculations
      const totalRevenue = allDeals
        .filter(d => d.stage === 'Abgeschlossen')
        .reduce((sum, d) => sum + Number(d.amount_eur || 0), 0);
      
      const revenuePerCustomer = closedDeals > 0 ? totalRevenue / closedDeals : 0;
      const revenuePerDial = dialAttempts > 0 ? totalRevenue / dialAttempts : 0;

      // Rates
      const appointmentRate = dialAttempts > 0 ? (appointmentsSet / dialAttempts) * 100 : 0;
      const qualificationRate = reached > 0 ? (appointmentsSet / reached) * 100 : 0;
      const closingRate = settingDeals.length > 0 ? (closedDeals / settingDeals.length) * 100 : 0;
      const noShowRate = settingDeals.length > 0 ? (noShows / settingDeals.length) * 100 : 0;

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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('de-DE', { 
      minimumFractionDigits: 0,
      maximumFractionDigits: 0 
    }).format(value);
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

          {/* KPI Cards Row */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
            <KPICard
              label="Wählversuche"
              value={formatCurrency(kpis.dialAttempts)}
              trend={6.5}
              trendLabel="zum Vormonat"
            />
            <KPICard
              label="Termine gelegt"
              value={kpis.appointmentsSet.toString()}
              trend={-1.5}
              trendLabel="zum Vormonat"
            />
            <KPICard
              label="Erstgespräche"
              value={kpis.firstCalls.toString()}
              trend={-1.5}
              trendLabel="zum Vormonat"
            />
            <KPICard
              label="Zweitgespräche"
              value={kpis.secondCalls.toString()}
              trend={-8.5}
              trendLabel="zum Vormonat"
            />
            <KPICard
              label="Abschlüsse"
              value={kpis.closedDeals.toString()}
              trend={1.5}
              trendLabel="zum Vormonat"
              highlighted
            />
          </div>

          {/* Main Content Grid */}
          <div className="grid lg:grid-cols-3 gap-6 mb-8">
            {/* Revenue Chart */}
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
                  <TrendingUp className="w-3 h-3 text-[hsl(var(--success))]" />
                  <span className="text-xs text-[hsl(var(--success))]">8.5% zum Vormonat</span>
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
                  <TrendingUp className="w-3 h-3 text-[hsl(var(--success))]" />
                  <span className="text-xs text-[hsl(var(--success))]">8.5% zum Vormonat</span>
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
                  <TrendingDown className="w-3 h-3 text-[hsl(var(--danger))]" />
                  <span className="text-xs text-[hsl(var(--danger))]">1.5% zum Vormonat</span>
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
