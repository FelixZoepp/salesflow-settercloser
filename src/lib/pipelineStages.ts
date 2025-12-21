export type PipelineType = 'cold' | 'inbound';

export const COLD_PIPELINE_STAGES = [
  'Lead',
  '1× nicht erreicht',
  '2× nicht erreicht',
  '3× nicht erreicht',
  'Entscheider nicht erreichbar',
  'Im Urlaub',
  'Kein Interesse / Kein Bedarf',
  'Termin gelegt'
] as const;

export const INBOUND_PIPELINE_STAGES = [
  'Neuer Lead',
  'Erstgespräch gelegt',
  'Setting No Show',
  'Setting Follow Up',
  'Closing gelegt',
  'Closing No Show',
  'Closing Follow Up',
  'Verloren',
  'Gewonnen'
] as const;

export type ColdStage = typeof COLD_PIPELINE_STAGES[number];
export type InboundStage = typeof INBOUND_PIPELINE_STAGES[number];

export const getStageColor = (stage: string): string => {
  // Cold Pipeline - Grau (außer Termin gelegt)
  if (COLD_PIPELINE_STAGES.includes(stage as ColdStage)) {
    if (stage === 'Termin gelegt') {
      return 'bg-[hsl(var(--success))] text-[hsl(var(--success-foreground))]';
    }
    return 'bg-muted text-muted-foreground';
  }
  
  // Inbound Pipeline Stages
  if (stage === 'Neuer Lead') {
    return 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]';
  }
  if (stage === 'Erstgespräch gelegt') {
    return 'bg-blue-500/20 text-blue-400 border border-blue-500/30';
  }
  if (stage === 'Setting No Show' || stage === 'Closing No Show') {
    return 'bg-red-500/20 text-red-400 border border-red-500/30';
  }
  if (stage === 'Setting Follow Up' || stage === 'Closing Follow Up') {
    return 'bg-amber-500/20 text-amber-400 border border-amber-500/30';
  }
  if (stage === 'Closing gelegt') {
    return 'bg-purple-500/20 text-purple-400 border border-purple-500/30';
  }
  if (stage === 'Gewonnen') {
    return 'bg-[hsl(var(--success))] text-[hsl(var(--success-foreground))]';
  }
  if (stage === 'Verloren') {
    return 'bg-[hsl(var(--danger))] text-[hsl(var(--danger-foreground))]';
  }
  
  // Legacy support for old stages
  if (stage.includes('Setting')) {
    return 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]';
  }
  if (stage.includes('Closing')) {
    return 'bg-purple-500/20 text-purple-400 border border-purple-500/30';
  }
  if (stage === 'Kein Interesse / Kein Bedarf') {
    return 'bg-[hsl(var(--danger))] text-[hsl(var(--danger-foreground))]';
  }
  
  return 'bg-secondary text-secondary-foreground';
};

export const getPipelineStages = (pipeline: PipelineType) => {
  if (pipeline === 'cold') return COLD_PIPELINE_STAGES;
  return INBOUND_PIPELINE_STAGES;
};
