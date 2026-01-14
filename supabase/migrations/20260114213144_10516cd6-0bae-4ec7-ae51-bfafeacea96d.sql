-- Create table to store lead page templates
CREATE TABLE public.lead_page_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID REFERENCES public.accounts(id),
  name TEXT NOT NULL DEFAULT 'Standard-Vorlage',
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  -- Header settings
  header_logo_text TEXT DEFAULT 'Content-Leads',
  header_logo_accent TEXT DEFAULT 'Content',
  header_nav_items JSONB DEFAULT '["Warum wir?", "Unser Ansatz", "FAQ"]'::jsonb,
  header_cta_text TEXT DEFAULT '{{first_name}}, lass uns sprechen!',
  
  -- Hero section
  hero_headline TEXT DEFAULT 'Hey {{first_name}}, sieh dir das 2-minütige Video an',
  hero_subheadline TEXT DEFAULT '… und erfahre, wie {{company}} mit personalisierten Outreach-Kampagnen und starkem Content qualifizierte Leads generiert.',
  hero_cta_text TEXT DEFAULT 'Gratis Termin vereinbaren',
  hero_video_caption TEXT DEFAULT 'Nur für dich {{first_name}}, nimm dir die 2 Minuten und schau kurz rein!!',
  
  -- Coaching section
  coaching_badge TEXT DEFAULT 'Exklusives Coaching-Programm',
  coaching_headline TEXT DEFAULT 'Die zwei Säulen für deinen LinkedIn-Erfolg',
  coaching_subheadline TEXT DEFAULT 'Lerne, wie du mit Outreach Umsatz generierst und mit Content Anfragen bekommst – für {{company}}',
  
  -- Pillar 1 - Outreach
  pillar1_title TEXT DEFAULT 'Säule 1: Outreach',
  pillar1_subtitle TEXT DEFAULT '= Umsatz generieren',
  pillar1_description TEXT DEFAULT 'Wir zeigen dir, wie du personalisierte Kampagnen erstellst, die direkt bei deiner Zielgruppe ankommen.',
  pillar1_items JSONB DEFAULT '["Du lernst hyperpersonalisierte Nachrichten zu schreiben", "Wie du direkte Terminbuchungen durch warme Kontakte bekommst", "Datengetriebene Zielgruppenansprache verstehen", "A/B-Tests für maximale Conversion durchführen", "Schritt-für-Schritt Anleitungen zum Nachmachen"]'::jsonb,
  
  -- Pillar 2 - Content
  pillar2_title TEXT DEFAULT 'Säule 2: Inbound Content',
  pillar2_subtitle TEXT DEFAULT '= Anfragen generieren',
  pillar2_description TEXT DEFAULT 'Lerne, wie du hochwertigen Content erstellst, der deine Expertise zeigt und organisch Leads anzieht.',
  pillar2_items JSONB DEFAULT '["So schreibst du Posts, die viral gehen", "Thought Leadership aufbauen", "Die richtige Posting-Frequenz finden", "Community Building & Engagement-Strategien", "Branding & Sichtbarkeit systematisch steigern"]'::jsonb,
  
  -- Combined effect
  combined_headline TEXT DEFAULT '🚀 Outreach + Content = Maximale Wirkung',
  combined_text TEXT DEFAULT 'Im Coaching lernst du beide Strategien zu meistern. Während dein Outreach aktiv Termine generiert, baut dein Content gleichzeitig Vertrauen und Autorität auf. Das Ergebnis: planbar mehr Umsatz und Anfragen.',
  
  -- Comparison section
  comparison_badge TEXT DEFAULT '#1 LinkedIn Beratung in der DACH-Region',
  comparison_headline TEXT DEFAULT 'Was uns von anderen unterscheidet',
  comparison_subheadline TEXT DEFAULT 'Keine leeren Versprechungen – wir liefern Ergebnisse mit Garantie.',
  
  -- Others column
  others_title TEXT DEFAULT 'Andere Anbieter',
  others_items JSONB DEFAULT '["Erste Ergebnisse nach 3-6 Monaten", "Keine Umsatzgarantie", "Nur Theorie, keine Umsetzungsbegleitung", "Standard-Inhalte für alle", "Du bist nach dem Kurs auf dich allein gestellt"]'::jsonb,
  
  -- Us column
  us_title TEXT DEFAULT 'Unser Coaching bei Content-Leads',
  us_items JSONB DEFAULT '["Erste Anfragen bereits in 7 Tagen", "Umsatzgarantie – wir verdoppeln dein Investment", "Intensive 1:1 Betreuung bei der Umsetzung", "Individuell auf deine Situation angepasst", "Persönlicher Coach dauerhaft an deiner Seite"]'::jsonb,
  
  -- Colors
  primary_color TEXT DEFAULT '#06b6d4',
  secondary_color TEXT DEFAULT '#a855f7',
  background_color TEXT DEFAULT '#0f172a',
  text_color TEXT DEFAULT '#f8fafc',
  accent_color TEXT DEFAULT '#f59e0b',
  
  -- Calendar URL
  calendar_url TEXT,
  
  -- Footer
  footer_company_name TEXT DEFAULT 'Content-Leads',
  footer_tagline TEXT DEFAULT 'Alle Rechte vorbehalten.',
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.lead_page_templates ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view templates from their account"
ON public.lead_page_templates
FOR SELECT
USING (account_id IN (SELECT account_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Admins can insert templates"
ON public.lead_page_templates
FOR INSERT
WITH CHECK (account_id IN (SELECT account_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Admins can update templates"
ON public.lead_page_templates
FOR UPDATE
USING (account_id IN (SELECT account_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Admins can delete templates"
ON public.lead_page_templates
FOR DELETE
USING (account_id IN (SELECT account_id FROM profiles WHERE id = auth.uid()));

-- Add trigger for updated_at
CREATE TRIGGER update_lead_page_templates_updated_at
BEFORE UPDATE ON public.lead_page_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();