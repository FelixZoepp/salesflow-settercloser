-- Add missing stages to deal_stage enum
ALTER TYPE deal_stage ADD VALUE IF NOT EXISTS 'Lead';
ALTER TYPE deal_stage ADD VALUE IF NOT EXISTS '1× nicht erreicht';
ALTER TYPE deal_stage ADD VALUE IF NOT EXISTS '2× nicht erreicht';
ALTER TYPE deal_stage ADD VALUE IF NOT EXISTS '3× nicht erreicht';
ALTER TYPE deal_stage ADD VALUE IF NOT EXISTS 'Entscheider nicht erreichbar';
ALTER TYPE deal_stage ADD VALUE IF NOT EXISTS 'Im Urlaub';
ALTER TYPE deal_stage ADD VALUE IF NOT EXISTS 'Kein Interesse / Kein Bedarf';
ALTER TYPE deal_stage ADD VALUE IF NOT EXISTS 'Termin gelegt';
ALTER TYPE deal_stage ADD VALUE IF NOT EXISTS 'Setting terminiert';
ALTER TYPE deal_stage ADD VALUE IF NOT EXISTS 'Setting No Show';
ALTER TYPE deal_stage ADD VALUE IF NOT EXISTS 'Setting Follow Up';
ALTER TYPE deal_stage ADD VALUE IF NOT EXISTS 'Closing terminiert';
ALTER TYPE deal_stage ADD VALUE IF NOT EXISTS 'Closing No Show';
ALTER TYPE deal_stage ADD VALUE IF NOT EXISTS 'Closing Follow Up';
ALTER TYPE deal_stage ADD VALUE IF NOT EXISTS 'CC2 terminiert';
ALTER TYPE deal_stage ADD VALUE IF NOT EXISTS 'Angebot versendet';
ALTER TYPE deal_stage ADD VALUE IF NOT EXISTS 'Abgeschlossen';