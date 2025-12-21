import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import { 
  TrendingUp, 
  Users, 
  MessageSquare, 
  Target,
  Flame,
  CheckCircle2,
  RefreshCw
} from "lucide-react";

interface CampaignStatisticsProps {
  campaignId: string;
  campaignName: string;
}

interface WorkflowStats {
  total: number;
  neu: number;
  bereit_fuer_vernetzung: number;
  vernetzung_ausstehend: number;
  vernetzung_angenommen: number;
  erstnachricht_gesendet: number;
  fu1_gesendet: number;
  fu2_gesendet: number;
  fu3_gesendet: number;
  reagiert_warm: number;
  abgeschlossen: number;
}

const CHART_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  'hsl(220, 70%, 50%)',
  'hsl(280, 65%, 60%)',
];

export function CampaignStatistics({ campaignId, campaignName }: CampaignStatisticsProps) {
  const [stats, setStats] = useState<WorkflowStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('contacts')
        .select('workflow_status')
        .eq('campaign_id', campaignId)
        .eq('lead_type', 'outbound');

      if (error) {
        console.error("Error fetching stats:", error);
        setLoading(false);
        return;
      }

      const contacts = data || [];
      const total = contacts.length;

      const countStatus = (status: string) => 
        contacts.filter(c => c.workflow_status === status).length;

      setStats({
        total,
        neu: countStatus('neu'),
        bereit_fuer_vernetzung: countStatus('bereit_fuer_vernetzung'),
        vernetzung_ausstehend: countStatus('vernetzung_ausstehend'),
        vernetzung_angenommen: countStatus('vernetzung_angenommen'),
        erstnachricht_gesendet: countStatus('erstnachricht_gesendet'),
        fu1_gesendet: countStatus('fu1_gesendet'),
        fu2_gesendet: countStatus('fu2_gesendet'),
        fu3_gesendet: countStatus('fu3_gesendet'),
        reagiert_warm: countStatus('reagiert_warm'),
        abgeschlossen: countStatus('abgeschlossen'),
      });
      setLoading(false);
    };

    fetchStats();
  }, [campaignId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!stats || stats.total === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Target className="h-12 w-12 mx-auto mb-2" />
        <p>Keine Leads in dieser Kampagne</p>
      </div>
    );
  }

  // Calculate rates
  const connectionsSent = stats.vernetzung_ausstehend + stats.vernetzung_angenommen + 
    stats.erstnachricht_gesendet + stats.fu1_gesendet + stats.fu2_gesendet + 
    stats.fu3_gesendet + stats.reagiert_warm + stats.abgeschlossen;
  
  const connectionsAccepted = stats.vernetzung_angenommen + stats.erstnachricht_gesendet + 
    stats.fu1_gesendet + stats.fu2_gesendet + stats.fu3_gesendet + 
    stats.reagiert_warm + stats.abgeschlossen;
  
  const messagesSent = stats.erstnachricht_gesendet + stats.fu1_gesendet + 
    stats.fu2_gesendet + stats.fu3_gesendet + stats.reagiert_warm + stats.abgeschlossen;
  
  const warmLeads = stats.reagiert_warm + stats.abgeschlossen;

  const acceptanceRate = connectionsSent > 0 ? (connectionsAccepted / connectionsSent) * 100 : 0;
  const responseRate = messagesSent > 0 ? (warmLeads / messagesSent) * 100 : 0;
  const conversionRate = stats.total > 0 ? (warmLeads / stats.total) * 100 : 0;

  // Funnel data for bar chart
  const funnelData = [
    { name: 'Gesamt', value: stats.total, fill: 'hsl(var(--muted-foreground))' },
    { name: 'Vernetzung gesendet', value: connectionsSent, fill: 'hsl(var(--primary))' },
    { name: 'Angenommen', value: connectionsAccepted, fill: 'hsl(var(--chart-2))' },
    { name: 'Nachricht gesendet', value: messagesSent, fill: 'hsl(var(--chart-3))' },
    { name: 'Warm/Reagiert', value: warmLeads, fill: 'hsl(var(--destructive))' },
  ];

  // Status distribution for pie chart with vibrant colors
  const statusData = [
    { name: 'Neu', value: stats.neu, color: '#94a3b8' },
    { name: 'Bereit', value: stats.bereit_fuer_vernetzung, color: '#3b82f6' },
    { name: 'Ausstehend', value: stats.vernetzung_ausstehend, color: '#f59e0b' },
    { name: 'Angenommen', value: stats.vernetzung_angenommen, color: '#10b981' },
    { name: 'Erstnachricht', value: stats.erstnachricht_gesendet, color: '#8b5cf6' },
    { name: 'Follow-ups', value: stats.fu1_gesendet + stats.fu2_gesendet + stats.fu3_gesendet, color: '#ec4899' },
    { name: 'Warm', value: stats.reagiert_warm, color: '#ef4444' },
    { name: 'Abgeschlossen', value: stats.abgeschlossen, color: '#22c55e' },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Gesamt Leads</span>
            </div>
            <p className="text-3xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="text-sm text-muted-foreground">Annahme-Rate</span>
            </div>
            <p className="text-3xl font-bold">{acceptanceRate.toFixed(1)}%</p>
            <Progress value={acceptanceRate} className="mt-2 h-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {connectionsAccepted} von {connectionsSent} angenommen
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="h-4 w-4 text-blue-500" />
              <span className="text-sm text-muted-foreground">Antwort-Rate</span>
            </div>
            <p className="text-3xl font-bold">{responseRate.toFixed(1)}%</p>
            <Progress value={responseRate} className="mt-2 h-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {warmLeads} von {messagesSent} reagiert
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <Flame className="h-4 w-4 text-destructive" />
              <span className="text-sm text-muted-foreground">Conversion-Rate</span>
            </div>
            <p className="text-3xl font-bold">{conversionRate.toFixed(1)}%</p>
            <Progress value={conversionRate} className="mt-2 h-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {warmLeads} von {stats.total} warm
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Funnel Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Funnel-Übersicht
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnelData} layout="vertical">
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--popover))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {funnelData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5" />
              Status-Verteilung
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                    labelLine={false}
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--popover))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Stats Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Detaillierte Statistiken</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground">Neu</p>
              <p className="text-xl font-bold">{stats.neu}</p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground">Bereit für Vernetzung</p>
              <p className="text-xl font-bold">{stats.bereit_fuer_vernetzung}</p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground">Vernetzung ausstehend</p>
              <p className="text-xl font-bold">{stats.vernetzung_ausstehend}</p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground">Vernetzung angenommen</p>
              <p className="text-xl font-bold">{stats.vernetzung_angenommen}</p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground">Erstnachricht gesendet</p>
              <p className="text-xl font-bold">{stats.erstnachricht_gesendet}</p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground">FU1 gesendet</p>
              <p className="text-xl font-bold">{stats.fu1_gesendet}</p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground">FU2 gesendet</p>
              <p className="text-xl font-bold">{stats.fu2_gesendet}</p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground">FU3 gesendet</p>
              <p className="text-xl font-bold">{stats.fu3_gesendet}</p>
            </div>
            <div className="p-3 bg-destructive/10 rounded-lg border border-destructive/20">
              <p className="text-xs text-muted-foreground">Reagiert / Warm</p>
              <p className="text-xl font-bold text-destructive">{stats.reagiert_warm}</p>
            </div>
            <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/20">
              <p className="text-xs text-muted-foreground">Abgeschlossen</p>
              <p className="text-xl font-bold text-green-600">{stats.abgeschlossen}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
