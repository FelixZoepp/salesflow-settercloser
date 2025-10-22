import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Calendar, Euro } from "lucide-react";
import { toast } from "sonner";

type DealStage = 'New' | 'Qualifiziert' | 'Termin gesetzt' | 'Angebot' | 'Verhandlung' | 'Gewonnen' | 'Verloren';

interface Deal {
  id: string;
  title: string;
  stage: DealStage;
  amount_eur: number;
  due_date: string | null;
  next_action: string | null;
  contacts: { first_name: string; last_name: string } | null;
  setter: { name: string } | null;
}

const Pipeline = () => {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);

  const stages: DealStage[] = ['New', 'Qualifiziert', 'Termin gesetzt', 'Angebot', 'Verhandlung', 'Gewonnen', 'Verloren'];

  useEffect(() => {
    fetchDeals();
  }, []);

  const fetchDeals = async () => {
    try {
      const { data, error } = await supabase
        .from('deals')
        .select(`
          *,
          contacts (first_name, last_name),
          setter:setter_id (name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDeals(data as any || []);
    } catch (error: any) {
      toast.error("Fehler beim Laden der Deals");
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

  const getStageDeals = (stage: DealStage) => {
    return deals.filter(deal => deal.stage === stage);
  };

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
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Pipeline</h1>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Neuer Deal
          </Button>
        </div>

        <div className="grid grid-cols-7 gap-4 overflow-x-auto">
          {stages.map(stage => {
            const stageDeals = getStageDeals(stage);
            const totalAmount = stageDeals.reduce((sum, deal) => sum + Number(deal.amount_eur), 0);

            return (
              <div key={stage} className="min-w-[280px]">
                <div className="mb-4">
                  <h3 className="font-semibold mb-1">{stage}</h3>
                  <div className="text-sm text-muted-foreground">
                    {stageDeals.length} Deals • €{totalAmount.toLocaleString()}
                  </div>
                </div>

                <div className="space-y-3">
                  {stageDeals.map(deal => (
                    <Card key={deal.id} className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">{deal.title}</CardTitle>
                        {deal.contacts && (
                          <p className="text-sm text-muted-foreground">
                            {deal.contacts.first_name} {deal.contacts.last_name}
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
      </div>
    </Layout>
  );
};

export default Pipeline;