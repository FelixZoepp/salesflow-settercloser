import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Calendar, Euro, TrendingUp, Phone } from "lucide-react";
import { toast } from "sonner";
import { PipelineType, getPipelineStages, getStageColor } from "@/lib/pipelineStages";
import LeadDetailPanel from "@/components/LeadDetailPanel";
import PhoneIntegration from "@/components/PhoneIntegration";
import { buildDialHref } from "@/lib/dialerAdapter";

interface Deal {
  id: string;
  title: string;
  stage: string;
  pipeline: PipelineType;
  amount_eur: number;
  due_date: string | null;
  next_action: string | null;
  contacts: { first_name: string; last_name: string } | null;
  setter: { name: string } | null;
  closer: { name: string } | null;
}

const Pipeline = () => {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePipeline, setActivePipeline] = useState<PipelineType>('cold');
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);
  const [showPhoneSetup, setShowPhoneSetup] = useState(false);

  const stages = getPipelineStages(activePipeline);

  useEffect(() => {
    fetchDeals();
  }, [activePipeline]);

  const fetchDeals = async () => {
    try {
      // Debug: Check authentication
      const { data: { user } } = await supabase.auth.getUser();
      console.log('Current user:', user?.id, user?.email);
      
      // Debug: Check user profile
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('account_id, role')
          .eq('id', user.id)
          .single();
        console.log('User profile:', profile);
      }
      
      const { data, error } = await supabase
        .from('deals')
        .select(`
          *,
          contacts (first_name, last_name),
          setter:setter_id (name),
          closer:closer_id (name)
        `)
        .eq('pipeline', activePipeline)
        .order('created_at', { ascending: false });

      console.log('Deals query result:', { data, error });

      if (error) {
        console.error('Deals fetch error:', error);
        throw error;
      }
      
      setDeals(data as any || []);
    } catch (error: any) {
      console.error('Error in fetchDeals:', error);
      toast.error(`Fehler beim Laden der Deals: ${error.message || 'Unbekannter Fehler'}`);
    } finally {
      setLoading(false);
    }
  };

  const getDueDateColor = (dueDate: string | null) => {
    if (!dueDate) return "";
    const today = new Date();
    const due = new Date(dueDate);
    const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 3600 * 24));
    
    if (diffDays < 0) return "bg-[hsl(var(--danger))] text-[hsl(var(--danger-foreground))]";
    if (diffDays === 0) return "bg-[hsl(var(--warning))] text-[hsl(var(--warning-foreground))]";
    if (diffDays <= 7) return "bg-muted text-muted-foreground";
    return "";
  };

  const getStageDeals = (stage: string) => {
    return deals.filter(deal => deal.stage === stage);
  };

  const getPipelineStats = () => {
    const total = deals.length;
    const totalValue = deals.reduce((sum, deal) => sum + Number(deal.amount_eur), 0);
    
    if (activePipeline === 'cold') {
      const appointments = deals.filter(d => d.stage === 'Termin gelegt').length;
      return { total, totalValue, appointments };
    } else {
      const won = deals.filter(d => d.stage === 'Abgeschlossen').length;
      const lost = deals.filter(d => d.stage === 'Verloren').length;
      const winRate = total > 0 ? ((won / (won + lost)) * 100).toFixed(1) : '0';
      return { total, totalValue, won, lost, winRate };
    }
  };

  const stats = getPipelineStats();

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <p className="text-muted-foreground">Lädt Pipeline...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Pipeline</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowPhoneSetup(!showPhoneSetup)}>
              <Phone className="w-4 h-4 mr-2" />
              Telefon
            </Button>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Neuer Deal
            </Button>
          </div>
        </div>

        {showPhoneSetup && (
          <div className="mb-6">
            <PhoneIntegration />
          </div>
        )}

        {/* Pipeline Tabs */}
        <Tabs value={activePipeline} onValueChange={(v) => setActivePipeline(v as PipelineType)} className="mb-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="cold">Kaltakquise</TabsTrigger>
            <TabsTrigger value="setting_closing">Setter/Closer</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* KPI Badge Bar */}
        <div className="flex gap-4 mb-6 flex-wrap">
          <Badge variant="secondary" className="px-4 py-2 text-sm">
            <TrendingUp className="w-4 h-4 mr-2" />
            {stats.total} Deals
          </Badge>
          <Badge variant="secondary" className="px-4 py-2 text-sm">
            <Euro className="w-4 h-4 mr-2" />
            €{stats.totalValue.toLocaleString()}
          </Badge>
          {activePipeline === 'cold' && 'appointments' in stats && (
            <Badge variant="secondary" className="px-4 py-2 text-sm bg-[hsl(var(--success))] text-[hsl(var(--success-foreground))]">
              {stats.appointments} Termine gelegt
            </Badge>
          )}
          {activePipeline === 'setting_closing' && 'won' in stats && (
            <>
              <Badge variant="secondary" className="px-4 py-2 text-sm bg-[hsl(var(--success))] text-[hsl(var(--success-foreground))]">
                {stats.won} Gewonnen
              </Badge>
              <Badge variant="secondary" className="px-4 py-2 text-sm bg-[hsl(var(--danger))] text-[hsl(var(--danger-foreground))]">
                {stats.lost} Verloren
              </Badge>
              <Badge variant="secondary" className="px-4 py-2 text-sm">
                Win Rate: {stats.winRate}%
              </Badge>
            </>
          )}
        </div>

        <div className={`grid gap-4 overflow-x-auto`} style={{ gridTemplateColumns: `repeat(${stages.length}, minmax(280px, 1fr))` }}>
          {stages.map(stage => {
            const stageDeals = getStageDeals(stage);
            const totalAmount = stageDeals.reduce((sum, deal) => sum + Number(deal.amount_eur), 0);

            return (
              <div key={stage} className="min-w-[280px]">
                <div className="mb-4">
                  <Badge className={`${getStageColor(stage)} mb-2`}>{stage}</Badge>
                  <div className="text-sm text-muted-foreground">
                    {stageDeals.length} Deals • €{totalAmount.toLocaleString()}
                  </div>
                </div>

                <div className="space-y-3">
                  {stageDeals.map(deal => (
                    <Card 
                      key={deal.id} 
                      className="hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => setSelectedDealId(deal.id)}
                    >
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">{deal.title}</CardTitle>
                        {deal.contacts && (
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-muted-foreground">
                              {deal.contacts.first_name} {deal.contacts.last_name}
                            </p>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                const contact = deal.contacts;
                                if (contact) {
                                  // Try to find phone number - check if we need to fetch full contact
                                  window.location.href = buildDialHref('+49123456789'); // Placeholder
                                  toast.info('Rufe Kontakt an...');
                                }
                              }}
                            >
                              <Phone className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                        {deal.setter && (
                          <p className="text-xs text-muted-foreground">
                            Setter: {deal.setter.name}
                          </p>
                        )}
                        {deal.closer && (
                          <p className="text-xs text-muted-foreground">
                            Closer: {deal.closer.name}
                          </p>
                        )}
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Euro className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">€{Number(deal.amount_eur).toLocaleString()}</span>
                        </div>
                        
                        {deal.due_date && (
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <Badge variant="secondary" className={getDueDateColor(deal.due_date)}>
                              {new Date(deal.due_date).toLocaleDateString('de-DE')}
                            </Badge>
                          </div>
                        )}

                        {deal.next_action && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            📋 {deal.next_action}
                          </p>
                        )}

                        {!deal.next_action && (
                          <Badge variant="destructive" className="text-xs">
                            Keine nächste Aktion
                          </Badge>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {selectedDealId && (
          <LeadDetailPanel 
            dealId={selectedDealId} 
            onClose={() => setSelectedDealId(null)} 
          />
        )}
      </div>
    </Layout>
  );
};

export default Pipeline;