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
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCorners, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface Deal {
  id: string;
  title: string;
  stage: string;
  pipeline: PipelineType;
  amount_eur: number;
  due_date: string | null;
  next_action: string | null;
  contacts: { first_name: string; last_name: string; phone: string | null; mobile: string | null } | null;
  setter: { name: string } | null;
  closer: { name: string } | null;
}

const Pipeline = () => {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePipeline, setActivePipeline] = useState<PipelineType>('cold');
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);
  const [showPhoneSetup, setShowPhoneSetup] = useState(false);
  const [activeDealId, setActiveDealId] = useState<string | null>(null);
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

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
          contacts (first_name, last_name, phone, mobile),
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

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDealId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDealId(null);

    if (!over) return;

    const dealId = active.id as string;
    const newStage = over.id as string;
    const deal = deals.find(d => d.id === dealId);

    if (!deal || deal.stage === newStage) return;

    // Optimistic update
    setDeals(deals.map(d => d.id === dealId ? { ...d, stage: newStage } : d));

    try {
      const { error } = await supabase
        .from('deals')
        .update({ stage: newStage as any })
        .eq('id', dealId);

      if (error) throw error;
      
      toast.success(`Deal in ${newStage} verschoben`);
    } catch (error: any) {
      console.error('Error updating deal stage:', error);
      toast.error('Fehler beim Verschieben des Deals');
      // Revert optimistic update
      fetchDeals();
    }
  };

  const activeDeal = deals.find(d => d.id === activeDealId);

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
          <TabsList className="grid w-full max-w-lg grid-cols-3">
            <TabsTrigger value="cold">Kaltakquise</TabsTrigger>
            <TabsTrigger value="inbound">Inbound</TabsTrigger>
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

        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className={`grid gap-4 overflow-x-auto`} style={{ gridTemplateColumns: `repeat(${stages.length}, minmax(280px, 1fr))` }}>
            {stages.map(stage => {
            const stageDeals = getStageDeals(stage);
            const totalAmount = stageDeals.reduce((sum, deal) => sum + Number(deal.amount_eur), 0);

            return (
              <DroppableStage key={stage} stage={stage} stageColor={getStageColor(stage)} stageDeals={stageDeals} totalAmount={totalAmount}>
                {stageDeals.map(deal => (
                  <DraggableDealCard
                    key={deal.id}
                    deal={deal}
                    onOpenDetail={() => setSelectedDealId(deal.id)}
                  />
                ))}
              </DroppableStage>
            );
          })}
          </div>
          
          <DragOverlay>
            {activeDeal && (
              <Card className="opacity-80 rotate-3 cursor-grabbing shadow-xl">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{activeDeal.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm">
                    <Euro className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">€{Number(activeDeal.amount_eur).toLocaleString()}</span>
                  </div>
                </CardContent>
              </Card>
            )}
          </DragOverlay>
        </DndContext>

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

// Droppable Stage Component
interface DroppableStageProps {
  stage: string;
  stageColor: string;
  stageDeals: Deal[];
  totalAmount: number;
  children: React.ReactNode;
}

const DroppableStage = ({ stage, stageColor, stageDeals, totalAmount, children }: DroppableStageProps) => {
  const { setNodeRef, isOver } = useSortable({
    id: stage,
    data: { type: 'stage' }
  });

  return (
    <div 
      ref={setNodeRef}
      className={`min-w-[280px] transition-all ${isOver ? 'ring-2 ring-primary rounded-lg' : ''}`}
    >
      <div className="mb-4">
        <Badge className={`${stageColor} mb-2`}>{stage}</Badge>
        <div className="text-sm text-muted-foreground">
          {stageDeals.length} Deals • €{totalAmount.toLocaleString()}
        </div>
      </div>

      <SortableContext items={stageDeals.map(d => d.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-3 min-h-[100px]">
          {children}
        </div>
      </SortableContext>
    </div>
  );
};

// Draggable Deal Card Component
interface DraggableDealCardProps {
  deal: Deal;
  onOpenDetail: () => void;
}

const DraggableDealCard = ({ deal, onOpenDetail }: DraggableDealCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: deal.id,
    data: { type: 'deal', deal }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
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

  return (
    <Card 
      ref={setNodeRef}
      style={style}
      className={`hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing ${isDragging ? 'ring-2 ring-primary' : ''}`}
      {...attributes}
      {...listeners}
    >
      <CardHeader className="pb-3" onClick={(e) => {
        e.stopPropagation();
        onOpenDetail();
      }}>
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
                  const phoneNumber = contact.phone || contact.mobile;
                  if (phoneNumber) {
                    window.location.href = buildDialHref(phoneNumber);
                    toast.info('Rufe Kontakt an...');
                  } else {
                    toast.error('Keine Telefonnummer vorhanden');
                  }
                }
              }}
              disabled={!deal.contacts?.phone && !deal.contacts?.mobile}
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
  );
};

export default Pipeline;