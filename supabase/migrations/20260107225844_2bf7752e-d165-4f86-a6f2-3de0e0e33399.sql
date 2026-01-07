-- Add new simplified pipeline stages to deal_stage enum
ALTER TYPE deal_stage ADD VALUE IF NOT EXISTS 'Hat Seite geöffnet';
ALTER TYPE deal_stage ADD VALUE IF NOT EXISTS 'Heißer Lead - Anrufen';
ALTER TYPE deal_stage ADD VALUE IF NOT EXISTS 'Setting';
ALTER TYPE deal_stage ADD VALUE IF NOT EXISTS 'Closing';