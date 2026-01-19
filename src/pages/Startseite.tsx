import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { 
  CheckCircle2, 
  Circle, 
  ArrowRight, 
  Users, 
  Flame, 
  Calendar, 
  LayoutDashboard,
  TrendingUp,
  Sparkles,
  ChevronRight,
  Clock,
  User,
  Building2
} from "lucide-react";
import { formatDistanceToNow, isToday, isTomorrow, isPast, format, subDays } from "date-fns";
import { de } from "date-fns/locale";
import { toast } from "sonner";
import { DashboardLiveCallWidget } from "@/components/DashboardLiveCallWidget";

interface UserProfile {
  name: string;
  avatar_url: string | null;
}

interface Task {
  id: string;
  title: string;
  due_date: string | null;
  status: string;
  related_type: string | null;
  related_id: string | null;
  contact?: {
    first_name: string;
    last_name: string;
    company: string | null;
  };
}

interface QuickStats {
  totalLeads: number;
  hotLeads: number;
  appointmentsThisWeek: number;
  conversionRate: number;
}

interface SetupTask {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  link: string;
  action: string;
}

const Startseite = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<QuickStats>({
    totalLeads: 0,
    hotLeads: 0,
    appointmentsThisWeek: 0,
    conversionRate: 0
  });
  const [loading, setLoading] = useState(true);
  const [setupTasks, setSetupTasks] = useState<SetupTask[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('name, avatar_url')
        .eq('id', user.id)
        .single();

      setProfile(profileData);

      // Fetch tasks
      const { data: tasksData } = await supabase
        .from('tasks')
        .select('*')
        .eq('assignee_id', user.id)
        .eq('status', 'open')
        .order('due_date', { ascending: true, nullsFirst: false })
        .limit(8);

      // Fetch contact info for tasks
      const tasksWithContacts = await Promise.all(
        (tasksData || []).map(async (task) => {
          if (task.related_type === 'contact' && task.related_id) {
            const { data: contact } = await supabase
              .from('contacts')
              .select('first_name, last_name, company')
              .eq('id', task.related_id)
              .single();
            return { ...task, contact: contact || undefined };
          }
          return { ...task, contact: undefined };
        })
      );

      setTasks(tasksWithContacts as Task[]);

      // Fetch quick stats
      const daysAgo = subDays(new Date(), 7);

      const { count: totalLeads } = await supabase
        .from('contacts')
        .select('id', { count: 'exact', head: true });

      const { count: hotLeads } = await supabase
        .from('contacts')
        .select('id', { count: 'exact', head: true })
        .gte('lead_score', 70);

      const { data: weekDeals } = await supabase
        .from('deals')
        .select('stage, updated_at')
        .gte('updated_at', daysAgo.toISOString());

      const appointmentsThisWeek = weekDeals?.filter(d => 
        ['Setting terminiert', 'Closing terminiert', 'Termin gesetzt', 'Termin gelegt'].includes(d.stage as string)
      ).length || 0;

      const { count: closedDeals } = await supabase
        .from('deals')
        .select('id', { count: 'exact', head: true })
        .eq('stage', 'Abgeschlossen');

      const conversionRate = totalLeads && totalLeads > 0 
        ? Math.round(((closedDeals || 0) / totalLeads) * 100) 
        : 0;

      setStats({
        totalLeads: totalLeads || 0,
        hotLeads: hotLeads || 0,
        appointmentsThisWeek,
        conversionRate
      });

      // Generate setup tasks based on profile completion
      const setupChecklist: SetupTask[] = [
        {
          id: 'profile',
          title: 'Füge dein Profilbild hinzu',
          description: 'Damit die Besucher deiner Seite ein Bild vor Augen haben.',
          completed: !!profileData?.avatar_url,
          link: '/profile',
          action: 'Jetzt hinzufügen'
        },
        {
          id: 'campaign',
          title: 'Erstelle deine erste Kampagne',
          description: 'Starte mit deiner ersten Outreach-Kampagne.',
          completed: false, // Will be checked
          link: '/campaigns',
          action: 'Jetzt erstellen'
        },
        {
          id: 'leads',
          title: 'Importiere deine ersten Leads',
          description: 'Füge Kontakte zu deiner Kampagne hinzu.',
          completed: (totalLeads || 0) > 0,
          link: '/import-leads',
          action: 'Jetzt importieren'
        },
        {
          id: 'calendar',
          title: 'Verbinde deinen Kalender',
          description: 'Für automatische Terminbuchungen.',
          completed: false, // Will be checked
          link: '/profile',
          action: 'Jetzt verbinden'
        }
      ];

      // Check for campaigns
      const { count: campaignCount } = await supabase
        .from('campaigns')
        .select('id', { count: 'exact', head: true });
      
      setupChecklist[1].completed = (campaignCount || 0) > 0;

      // Check calendar URL
      const { data: calendarData } = await supabase
        .from('profiles')
        .select('calendar_url')
        .eq('id', user.id)
        .single();
      
      setupChecklist[3].completed = !!calendarData?.calendar_url;

      setSetupTasks(setupChecklist);

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteTask = async (taskId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: 'done' })
        .eq('id', taskId);

      if (error) throw error;

      setTasks(tasks.filter(t => t.id !== taskId));
      toast.success("Aufgabe erledigt!");
    } catch (error) {
      console.error('Error completing task:', error);
      toast.error("Fehler beim Aktualisieren");
    }
  };

  const getDueDateBadge = (dueDate: string | null) => {
    if (!dueDate) return null;
    
    const date = new Date(dueDate);
    
    if (isPast(date) && !isToday(date)) {
      return (
        <Badge variant="destructive" className="text-[10px]">
          Überfällig
        </Badge>
      );
    }
    
    if (isToday(date)) {
      return (
        <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[10px]">
          Heute
        </Badge>
      );
    }
    
    if (isTomorrow(date)) {
      return (
        <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-[10px]">
          Morgen
        </Badge>
      );
    }
    
    return null;
  };

  const formatDueDate = (dueDate: string | null) => {
    if (!dueDate) return "Kein Datum";
    
    const date = new Date(dueDate);
    const utcHours = date.getUTCHours();
    const utcMinutes = date.getUTCMinutes();
    const hasTime = !(utcHours === 0 && utcMinutes === 0);
    
    if (isToday(date)) {
      return hasTime ? format(date, "'Heute' HH:mm", { locale: de }) : "Heute";
    }
    
    if (isTomorrow(date)) {
      return hasTime ? format(date, "'Morgen' HH:mm", { locale: de }) : "Morgen";
    }
    
    return hasTime 
      ? format(date, "dd.MM.yyyy HH:mm", { locale: de })
      : format(date, "dd.MM.yyyy", { locale: de });
  };

  const completedSetupTasks = setupTasks.filter(t => t.completed).length;
  const setupProgress = setupTasks.length > 0 
    ? Math.round((completedSetupTasks / setupTasks.length) * 100) 
    : 0;

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-pulse text-muted-foreground">Lädt...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen noise-bg">
        <div className="max-w-7xl mx-auto p-1">
          {/* Live Call Widget */}
          <DashboardLiveCallWidget className="mb-6" />

          {/* Welcome Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Willkommen zurück, {profile?.name?.split(' ')[0] || 'User'}! 🎉
            </h1>
            <p className="text-muted-foreground">
              Hier ist dein Überblick für heute. Lass uns durchstarten!
            </p>
          </div>

          {/* Main Grid Layout */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left Column - Stats & Quick Actions */}
            <div className="lg:col-span-2 space-y-6">
              {/* Quick Stats Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="stat-card">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Leads gesamt</p>
                      <p className="text-2xl font-bold text-foreground">{stats.totalLeads}</p>
                    </div>
                    <div className="icon-glow icon-glow-blue">
                      <Users className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                <div className="stat-card stat-card-hot">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs text-orange-400/80 mb-1">Heiße Leads</p>
                      <p className="text-2xl font-bold text-orange-400">{stats.hotLeads}</p>
                    </div>
                    <div className="icon-glow icon-glow-orange animate-subtle-pulse">
                      <Flame className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Termine (7T)</p>
                      <p className="text-2xl font-bold text-foreground">{stats.appointmentsThisWeek}</p>
                    </div>
                    <div className="icon-glow icon-glow-green">
                      <Calendar className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Conversion</p>
                      <p className="text-2xl font-bold text-foreground">{stats.conversionRate}%</p>
                    </div>
                    <div className="icon-glow icon-glow-purple">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <Link 
                  to="/dashboard" 
                  className="glass-card p-4 hover:bg-white/5 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                      <LayoutDashboard className="h-5 w-5 text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-foreground">Dashboard</p>
                      <p className="text-xs text-muted-foreground">Detaillierte Übersicht</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </div>
                </Link>

                <Link 
                  to="/campaigns" 
                  className="glass-card p-4 hover:bg-white/5 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                      <Sparkles className="h-5 w-5 text-purple-400" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-foreground">Kampagnen</p>
                      <p className="text-xs text-muted-foreground">Outreach verwalten</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </div>
                </Link>

                <Link 
                  to="/pipeline" 
                  className="glass-card p-4 hover:bg-white/5 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                      <TrendingUp className="h-5 w-5 text-amber-400" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-foreground">Pipeline</p>
                      <p className="text-xs text-muted-foreground">Deals bearbeiten</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </div>
                </Link>
              </div>

              {/* Setup Progress (if not complete) */}
              {setupProgress < 100 && (
                <Card className="glass-card border-primary/20">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-primary" />
                        Einrichtung abschließen
                      </CardTitle>
                      <Badge variant="secondary" className="text-xs">
                        {completedSetupTasks}/{setupTasks.length}
                      </Badge>
                    </div>
                    <Progress value={setupProgress} className="h-2 mt-2" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {setupTasks.slice(0, 4).map((task) => (
                        <div 
                          key={task.id}
                          className={`flex items-start gap-3 p-3 rounded-xl transition-colors ${
                            task.completed 
                              ? 'bg-green-500/5 border border-green-500/10' 
                              : 'bg-white/[0.02] border border-white/5'
                          }`}
                        >
                          {task.completed ? (
                            <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                          ) : (
                            <Circle className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium ${task.completed ? 'text-green-400' : 'text-foreground'}`}>
                              {task.title}
                            </p>
                            <p className="text-xs text-muted-foreground">{task.description}</p>
                          </div>
                          {!task.completed && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(task.link)}
                              className="flex-shrink-0 text-primary hover:text-primary/80"
                            >
                              {task.action}
                              <ArrowRight className="w-3 h-3 ml-1" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right Column - Tasks */}
            <div className="space-y-6">
              <Card className="glass-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                      ToDo Liste
                    </div>
                    <Badge variant="secondary" className="text-[10px]">
                      {tasks.length} offen
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {tasks.length === 0 ? (
                    <div className="text-center py-8">
                      <CheckCircle2 className="w-10 h-10 mx-auto mb-3 text-green-400 opacity-50" />
                      <p className="text-sm text-muted-foreground">
                        Keine offenen Aufgaben 🎉
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Du hast alles erledigt!
                      </p>
                    </div>
                  ) : (
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-2">
                        {tasks.map((task) => (
                          <div
                            key={task.id}
                            className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors cursor-pointer group"
                          >
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 flex-shrink-0 opacity-50 hover:opacity-100"
                              onClick={(e) => handleCompleteTask(task.id, e)}
                            >
                              <Circle className="h-4 w-4 text-muted-foreground hover:text-green-400" />
                            </Button>
                            
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">
                                {task.title}
                              </p>
                              
                              {task.contact && (
                                <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                                  <User className="w-3 h-3" />
                                  <span>{task.contact.first_name} {task.contact.last_name}</span>
                                  {task.contact.company && (
                                    <>
                                      <span>•</span>
                                      <Building2 className="w-3 h-3" />
                                      <span className="truncate">{task.contact.company}</span>
                                    </>
                                  )}
                                </div>
                              )}
                              
                              <div className="flex items-center gap-2 mt-1">
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Clock className="w-3 h-3" />
                                  <span>{formatDueDate(task.due_date)}</span>
                                </div>
                                {getDueDateBadge(task.due_date)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}

                  {tasks.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-white/5">
                      <Button 
                        variant="ghost" 
                        className="w-full text-muted-foreground hover:text-foreground"
                        onClick={() => navigate('/dashboard')}
                      >
                        Alle Aufgaben anzeigen
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Startseite;
