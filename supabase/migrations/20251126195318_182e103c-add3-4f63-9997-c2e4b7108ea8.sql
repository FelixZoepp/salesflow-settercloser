-- Create objections library table
CREATE TABLE objections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  keywords text[] NOT NULL DEFAULT '{}',
  standard_response text NOT NULL,
  category text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE objections ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Admins can manage objections"
  ON objections FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Users can view active objections"
  ON objections FOR SELECT
  USING (is_active = true AND auth.uid() IS NOT NULL);

-- Create trigger for updated_at
CREATE TRIGGER update_objections_updated_at
  BEFORE UPDATE ON objections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create index for keyword search
CREATE INDEX idx_objections_keywords ON objections USING GIN(keywords);
CREATE INDEX idx_objections_category ON objections(category);

-- Insert some default objections
INSERT INTO objections (title, keywords, standard_response, category) VALUES
(
  'Zu teuer / Budget',
  ARRAY['teuer', 'zu viel', 'kostet', 'preis', 'budget', 'leisten'],
  'Ich verstehe, dass der Preis eine wichtige Rolle spielt. Lassen Sie mich Ihnen zeigen, wie sich die Investition durch [konkrete Zeitersparnis/Umsatzsteigerung] bereits im ersten Monat amortisiert. Viele unserer Kunden haben innerhalb von 3 Monaten ihre Kosten wieder drin. Können wir kurz durchrechnen, was es Sie kostet, wenn Sie so weitermachen wie bisher?',
  'Preis'
),
(
  'Keine Zeit',
  ARRAY['keine zeit', 'zeit', 'später', 'beschäftigt', 'stress'],
  'Das höre ich oft - und genau deshalb haben wir [Produkt] entwickelt. Es spart Ihnen durchschnittlich [X Stunden] pro Woche. Gerade weil Sie keine Zeit haben, sollten wir uns 15 Minuten nehmen, um zu schauen, wie wir Ihnen Zeit zurückgeben können. Passt Ihnen [konkreter Terminvorschlag]?',
  'Zeit'
),
(
  'Muss mit Chef/Entscheider sprechen',
  ARRAY['chef', 'vorgesetzter', 'geschäftsführer', 'entscheider', 'entscheidung', 'kollege'],
  'Absolut verständlich. Damit Sie Ihrem Chef die beste Entscheidungsgrundlage geben können: Was sind aus Ihrer Sicht die 2-3 wichtigsten Punkte, die für eine Entscheidung relevant sind? Ich bereite Ihnen gerne alle Infos vor, die Sie für das Gespräch brauchen - oder wir machen direkt einen gemeinsamen Termin zu dritt?',
  'Autorität'
),
(
  'Haben bereits eine Lösung',
  ARRAY['bereits', 'schon', 'haben schon', 'andere lösung', 'zufrieden', 'funktioniert'],
  'Das freut mich zu hören! Darf ich fragen, was Ihnen an Ihrer aktuellen Lösung besonders gut gefällt? [Pause] Und gibt es vielleicht einen Bereich, wo Sie sich noch mehr Unterstützung wünschen würden? Viele unserer Kunden nutzen uns ergänzend, weil wir speziell [USP] bieten.',
  'Wettbewerb'
);

COMMENT ON TABLE objections IS 'Library of predefined objections with proven responses for AI reference';