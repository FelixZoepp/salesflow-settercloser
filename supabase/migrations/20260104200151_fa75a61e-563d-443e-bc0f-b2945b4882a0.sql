-- Tabelle für Landing Pages
CREATE TABLE public.landing_pages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID REFERENCES public.accounts(id),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft', -- draft, published
  custom_domain TEXT,
  
  -- AI-generierter Content
  prompt TEXT, -- Original Prompt
  
  -- Page Content (JSON structure)
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Styling
  styles JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- SEO
  meta_title TEXT,
  meta_description TEXT,
  og_image_url TEXT,
  
  -- Analytics
  view_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  published_at TIMESTAMP WITH TIME ZONE,
  
  UNIQUE(slug)
);

-- Enable RLS
ALTER TABLE public.landing_pages ENABLE ROW LEVEL SECURITY;

-- Policies für eigene Landing Pages
CREATE POLICY "Users can view their own landing pages" 
ON public.landing_pages 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own landing pages" 
ON public.landing_pages 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own landing pages" 
ON public.landing_pages 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own landing pages" 
ON public.landing_pages 
FOR DELETE 
USING (auth.uid() = user_id);

-- Public access für veröffentlichte Seiten (via slug)
CREATE POLICY "Anyone can view published landing pages" 
ON public.landing_pages 
FOR SELECT 
USING (status = 'published');

-- Trigger für updated_at
CREATE TRIGGER update_landing_pages_updated_at
BEFORE UPDATE ON public.landing_pages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();