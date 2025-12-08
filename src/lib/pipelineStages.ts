export type PipelineType = 'cold' | 'setting_closing' | 'inbound';

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
  'New',
  'Qualifiziert',
  'Termin gesetzt',
  'Angebot',
  'Verhandlung',
  'Gewonnen',
  'Verloren'
] as const;

export const SETTER_CLOSER_STAGES = [
  'Setting terminiert',
  'Setting No Show',
  'Setting Follow Up',
  'Closing terminiert',
  'Closing No Show',
  'Closing Follow Up',
  'CC2 terminiert',
  'Angebot versendet',
  'Abgeschlossen',
  'Verloren'
] as const;

export type ColdStage = typeof COLD_PIPELINE_STAGES[number];
export type SetterCloserStage = typeof SETTER_CLOSER_STAGES[number];

export const getStageColor = (stage: string): string => {
  // Cold Pipeline - Grau
  if (COLD_PIPELINE_STAGES.includes(stage as ColdStage)) {
    return 'bg-muted text-muted-foreground';
  }
  
  // Setting stages - Blau
  if (stage.includes('Setting')) {
    return 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]';
  }
  
  // Follow Up stages - Orange
  if (stage.includes('Follow Up') || stage.includes('No Show')) {
    return 'bg-[hsl(var(--warning))] text-[hsl(var(--warning-foreground))]';
  }
  
  // Won stages - Grün
  if (stage === 'Abgeschlossen') {
    return 'bg-[hsl(var(--success))] text-[hsl(var(--success-foreground))]';
  }
  
  // Lost stages - Rot
  if (stage === 'Verloren' || stage === 'Kein Interesse / Kein Bedarf') {
    return 'bg-[hsl(var(--danger))] text-[hsl(var(--danger-foreground))]';
  }
  
  return 'bg-secondary text-secondary-foreground';
};

export const getPipelineStages = (pipeline: PipelineType) => {
  if (pipeline === 'cold') return COLD_PIPELINE_STAGES;
  if (pipeline === 'inbound') return INBOUND_PIPELINE_STAGES;
  return SETTER_CLOSER_STAGES;
};
