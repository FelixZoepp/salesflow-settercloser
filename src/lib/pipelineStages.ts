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
export type InboundStage = typeof INBOUND_PIPELINE_STAGES[number];
export type SetterCloserStage = typeof SETTER_CLOSER_STAGES[number];

export const getStageColor = (stage: string): string => {
  // Cold Pipeline - Grau (außer Termin gelegt)
  if (COLD_PIPELINE_STAGES.includes(stage as ColdStage)) {
    if (stage === 'Termin gelegt') {
      return 'bg-[hsl(var(--success))] text-[hsl(var(--success-foreground))]';
    }
    return 'bg-muted text-muted-foreground';
  }
  
  // Inbound Pipeline Stages
  if (stage === 'New') {
    return 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]';
  }
  if (stage === 'Qualifiziert') {
    return 'bg-blue-500/20 text-blue-600 border border-blue-500/30';
  }
  if (stage === 'Termin gesetzt') {
    return 'bg-indigo-500/20 text-indigo-600 border border-indigo-500/30';
  }
  if (stage === 'Angebot') {
    return 'bg-[hsl(var(--warning))] text-[hsl(var(--warning-foreground))]';
  }
  if (stage === 'Verhandlung') {
    return 'bg-orange-500/20 text-orange-600 border border-orange-500/30';
  }
  if (stage === 'Gewonnen') {
    return 'bg-[hsl(var(--success))] text-[hsl(var(--success-foreground))]';
  }
  
  // Setting stages - Blau
  if (stage.includes('Setting')) {
    return 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]';
  }
  
  // Closing stages - Lila
  if (stage.includes('Closing') || stage === 'CC2 terminiert') {
    return 'bg-purple-500/20 text-purple-600 border border-purple-500/30';
  }
  
  // Follow Up / No Show stages - Orange
  if (stage.includes('Follow Up') || stage.includes('No Show')) {
    return 'bg-[hsl(var(--warning))] text-[hsl(var(--warning-foreground))]';
  }
  
  // Won stages - Grün
  if (stage === 'Abgeschlossen' || stage === 'Angebot versendet') {
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
