-- Add case_studies column to lead_page_templates table
ALTER TABLE public.lead_page_templates 
ADD COLUMN IF NOT EXISTS case_studies jsonb DEFAULT '[
  {
    "title": "Daddel GmbH",
    "company_type": "Webseitenagentur",
    "before_revenue": "10.000€",
    "after_revenue": "20.000€+",
    "timeframe": "in 60 Tagen",
    "description": "Von sporadischen Anfragen zu planbarem Wachstum durch LinkedIn Outreach",
    "video_url": "https://www.youtube.com/embed/evcR2kC6otA",
    "rating": 5
  },
  {
    "title": "Teo Hentzschel",
    "company_type": "Webseitenagentur", 
    "before_revenue": "0€",
    "after_revenue": "10.000€",
    "timeframe": "in 3 Tagen",
    "description": "Erster Deal direkt nach Start der LinkedIn Kampagne abgeschlossen",
    "video_url": "",
    "rating": 5
  },
  {
    "title": "Hendrik Hoffmann",
    "company_type": "Webseitenagentur",
    "before_revenue": "unregelmäßig",
    "after_revenue": "5-stellig",
    "timeframe": "in 30 Tagen",
    "description": "Zusätzlicher Cashflow durch systematische Kaltakquise auf LinkedIn",
    "video_url": "",
    "rating": 5
  }
]'::jsonb;

-- Add case studies section headline
ALTER TABLE public.lead_page_templates
ADD COLUMN IF NOT EXISTS case_studies_headline text DEFAULT 'Das könnten deine Ergebnisse sein';

ALTER TABLE public.lead_page_templates
ADD COLUMN IF NOT EXISTS case_studies_subheadline text DEFAULT 'Echte Kunden, echte Ergebnisse – keine leeren Versprechen';

ALTER TABLE public.lead_page_templates
ADD COLUMN IF NOT EXISTS case_studies_badge text DEFAULT 'Erfolgsgeschichten';