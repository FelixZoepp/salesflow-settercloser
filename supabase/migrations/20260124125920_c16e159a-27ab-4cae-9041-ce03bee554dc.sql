-- Add new sections to lead_page_templates

-- Guarantee Section
ALTER TABLE public.lead_page_templates
ADD COLUMN IF NOT EXISTS guarantee_badge text DEFAULT 'Unsere Garantie',
ADD COLUMN IF NOT EXISTS guarantee_headline text DEFAULT 'Deine Investition ist geschützt',
ADD COLUMN IF NOT EXISTS guarantee_description text DEFAULT 'Wir sind so überzeugt von unserer Methode, dass wir dir eine 100% Zufriedenheitsgarantie geben. Wenn du nicht zufrieden bist, bekommst du dein Geld zurück.',
ADD COLUMN IF NOT EXISTS guarantee_items jsonb DEFAULT '["Geld-zurück-Garantie in den ersten 30 Tagen", "Kostenlose Nachbetreuung bei Fragen", "Lifetime-Zugang zu allen Updates"]'::jsonb;

-- FAQ Section
ALTER TABLE public.lead_page_templates
ADD COLUMN IF NOT EXISTS faq_badge text DEFAULT 'Häufige Fragen',
ADD COLUMN IF NOT EXISTS faq_headline text DEFAULT 'Noch Fragen?',
ADD COLUMN IF NOT EXISTS faq_subheadline text DEFAULT 'Hier findest du Antworten auf die wichtigsten Fragen',
ADD COLUMN IF NOT EXISTS faq_items jsonb DEFAULT '[{"question": "Wie schnell sehe ich Ergebnisse?", "answer": "Die meisten Kunden sehen erste Ergebnisse innerhalb der ersten 7 Tage."}, {"question": "Brauche ich technische Vorkenntnisse?", "answer": "Nein, wir führen dich Schritt für Schritt durch den gesamten Prozess."}, {"question": "Wie viel Zeit muss ich investieren?", "answer": "Wir empfehlen ca. 2-3 Stunden pro Woche für optimale Ergebnisse."}]'::jsonb;

-- CTA Section
ALTER TABLE public.lead_page_templates
ADD COLUMN IF NOT EXISTS cta_badge text DEFAULT 'Jetzt starten',
ADD COLUMN IF NOT EXISTS cta_headline text DEFAULT 'Bereit für den nächsten Schritt, {{first_name}}?',
ADD COLUMN IF NOT EXISTS cta_description text DEFAULT 'Vereinbare jetzt ein kostenloses Strategiegespräch und erfahre, wie wir dir helfen können.',
ADD COLUMN IF NOT EXISTS cta_button_text text DEFAULT 'Kostenloses Gespräch buchen';

-- Testimonials Section
ALTER TABLE public.lead_page_templates
ADD COLUMN IF NOT EXISTS testimonials_badge text DEFAULT 'Was unsere Kunden sagen',
ADD COLUMN IF NOT EXISTS testimonials_headline text DEFAULT 'Echte Erfolgsgeschichten',
ADD COLUMN IF NOT EXISTS testimonials_subheadline text DEFAULT 'Höre, was andere über ihre Erfahrungen berichten',
ADD COLUMN IF NOT EXISTS testimonials jsonb DEFAULT '[{"quote": "Innerhalb von 2 Wochen hatte ich meinen ersten Abschluss über LinkedIn. Absolut empfehlenswert!", "author": "Michael S.", "role": "Geschäftsführer", "company": "Digital Consulting GmbH"}, {"quote": "Die persönliche Betreuung ist einzigartig. Man fühlt sich wirklich gut aufgehoben.", "author": "Sarah K.", "role": "Marketing Managerin", "company": "TechStart AG"}]'::jsonb;