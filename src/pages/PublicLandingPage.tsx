import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { 
  CheckCircle, Zap, Shield, Star, Clock, Users, Award, Target, 
  TrendingUp, Heart, Sparkles, Rocket, Globe, Lock, BarChart, 
  Mail, Phone, MessageSquare, Loader2 
} from "lucide-react";
import { Helmet } from "react-helmet";

interface LandingPageContent {
  hero?: {
    headline: string;
    subheadline: string;
    ctaText: string;
    ctaLink: string;
  };
  benefits?: Array<{
    icon: string;
    title: string;
    description: string;
  }>;
  features?: Array<{
    title: string;
    description: string;
    bulletPoints: string[];
  }>;
  testimonials?: Array<{
    quote: string;
    author: string;
    company: string;
    role: string;
  }>;
  faq?: Array<{
    question: string;
    answer: string;
  }>;
  cta?: {
    headline: string;
    description: string;
    buttonText: string;
    buttonLink: string;
  };
  footer?: {
    companyName: string;
    tagline: string;
  };
}

interface LandingPageStyles {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  fontFamily: string;
}

interface LandingPageData {
  id: string;
  name: string;
  content: LandingPageContent;
  styles: LandingPageStyles;
  meta_title: string | null;
  meta_description: string | null;
  og_image_url: string | null;
}

const iconMap: Record<string, any> = {
  CheckCircle, Zap, Shield, Star, Clock, Users, Award, Target,
  TrendingUp, Heart, Sparkles, Rocket, Globe, Lock, BarChart,
  Mail, Phone, MessageSquare
};

const PublicLandingPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [page, setPage] = useState<LandingPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPage();
  }, [slug]);

  const loadPage = async () => {
    if (!slug) {
      setError("Seite nicht gefunden");
      setLoading(false);
      return;
    }

    try {
      const { data, error: fetchError } = await supabase
        .from('landing_pages')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'published')
        .single();

      if (fetchError || !data) {
        setError("Seite nicht gefunden");
        setLoading(false);
        return;
      }

      // Increment view count
      await supabase
        .from('landing_pages')
        .update({ view_count: (data.view_count || 0) + 1 })
        .eq('id', data.id);

      const defaultStyles: LandingPageStyles = {
        primaryColor: "#3B82F6",
        secondaryColor: "#1E40AF",
        accentColor: "#F59E0B",
        backgroundColor: "#FFFFFF",
        textColor: "#1F2937",
        fontFamily: "Inter",
      };

      const parsedStyles = data.styles as Record<string, unknown> | null;
      const pageStyles: LandingPageStyles = parsedStyles ? {
        primaryColor: (parsedStyles.primaryColor as string) || defaultStyles.primaryColor,
        secondaryColor: (parsedStyles.secondaryColor as string) || defaultStyles.secondaryColor,
        accentColor: (parsedStyles.accentColor as string) || defaultStyles.accentColor,
        backgroundColor: (parsedStyles.backgroundColor as string) || defaultStyles.backgroundColor,
        textColor: (parsedStyles.textColor as string) || defaultStyles.textColor,
        fontFamily: (parsedStyles.fontFamily as string) || defaultStyles.fontFamily,
      } : defaultStyles;

      setPage({
        id: data.id,
        name: data.name,
        content: (data.content || {}) as LandingPageContent,
        styles: pageStyles,
        meta_title: data.meta_title,
        meta_description: data.meta_description,
        og_image_url: data.og_image_url,
      });
    } catch (err) {
      console.error('Error loading page:', err);
      setError("Fehler beim Laden der Seite");
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (iconName: string) => {
    const Icon = iconMap[iconName] || CheckCircle;
    return <Icon className="w-6 h-6" />;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Globe className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h1 className="text-2xl font-bold mb-2">Seite nicht gefunden</h1>
          <p className="text-muted-foreground">Diese Landing Page existiert nicht oder wurde nicht veröffentlicht.</p>
        </div>
      </div>
    );
  }

  const { content, styles } = page;

  return (
    <>
      <Helmet>
        <title>{page.meta_title || page.name}</title>
        {page.meta_description && <meta name="description" content={page.meta_description} />}
        {page.og_image_url && <meta property="og:image" content={page.og_image_url} />}
        <meta property="og:title" content={page.meta_title || page.name} />
        {page.meta_description && <meta property="og:description" content={page.meta_description} />}
        <link 
          href={`https://fonts.googleapis.com/css2?family=${styles.fontFamily.replace(' ', '+')}:wght@400;500;600;700&display=swap`} 
          rel="stylesheet" 
        />
      </Helmet>

      <div 
        className="min-h-screen"
        style={{ 
          backgroundColor: styles.backgroundColor,
          color: styles.textColor,
          fontFamily: styles.fontFamily
        }}
      >
        {/* Hero Section */}
        {content.hero && (
          <section 
            className="py-20 md:py-32 px-6 text-center"
            style={{ 
              background: `linear-gradient(135deg, ${styles.primaryColor} 0%, ${styles.secondaryColor} 100%)`,
              color: '#fff'
            }}
          >
            <div className="max-w-4xl mx-auto">
              <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
                {content.hero.headline}
              </h1>
              <p className="text-xl md:text-2xl opacity-90 mb-10 max-w-2xl mx-auto">
                {content.hero.subheadline}
              </p>
              <a
                href={content.hero.ctaLink}
                className="inline-block px-10 py-4 rounded-lg font-semibold text-lg transition-all hover:scale-105 hover:shadow-lg"
                style={{ backgroundColor: styles.accentColor, color: '#fff' }}
              >
                {content.hero.ctaText}
              </a>
            </div>
          </section>
        )}

        {/* Benefits Section */}
        {content.benefits && content.benefits.length > 0 && (
          <section className="py-16 md:py-24 px-6">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-center mb-12" style={{ color: styles.primaryColor }}>
                Ihre Vorteile
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {content.benefits.map((benefit, index) => (
                  <div 
                    key={index} 
                    className="text-center p-8 rounded-2xl transition-all hover:scale-105"
                    style={{ backgroundColor: `${styles.primaryColor}08` }}
                  >
                    <div 
                      className="w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center"
                      style={{ backgroundColor: styles.primaryColor, color: '#fff' }}
                    >
                      {getIcon(benefit.icon)}
                    </div>
                    <h3 className="font-bold text-xl mb-3">{benefit.title}</h3>
                    <p className="opacity-75">{benefit.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Features Section */}
        {content.features && content.features.length > 0 && (
          <section className="py-16 md:py-24 px-6" style={{ backgroundColor: `${styles.primaryColor}05` }}>
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-center mb-12" style={{ color: styles.primaryColor }}>
                Unsere Leistungen
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {content.features.map((feature, index) => (
                  <div key={index} className="p-8 rounded-2xl bg-white shadow-lg">
                    <h3 className="font-bold text-2xl mb-4" style={{ color: styles.primaryColor }}>
                      {feature.title}
                    </h3>
                    <p className="mb-6 opacity-75 text-lg">{feature.description}</p>
                    <ul className="space-y-3">
                      {feature.bulletPoints.map((point, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <CheckCircle className="w-5 h-5 mt-0.5 shrink-0" style={{ color: styles.accentColor }} />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Testimonials Section */}
        {content.testimonials && content.testimonials.length > 0 && (
          <section className="py-16 md:py-24 px-6">
            <div className="max-w-5xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-center mb-12" style={{ color: styles.primaryColor }}>
                Das sagen unsere Kunden
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {content.testimonials.map((testimonial, index) => (
                  <div 
                    key={index} 
                    className="p-8 rounded-2xl border-2"
                    style={{ borderColor: `${styles.primaryColor}20` }}
                  >
                    <p className="italic text-lg mb-6">"{testimonial.quote}"</p>
                    <div className="flex items-center gap-4">
                      <div 
                        className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                        style={{ backgroundColor: styles.primaryColor }}
                      >
                        {testimonial.author.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold">{testimonial.author}</p>
                        <p className="text-sm opacity-75">{testimonial.role}, {testimonial.company}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* FAQ Section */}
        {content.faq && content.faq.length > 0 && (
          <section className="py-16 md:py-24 px-6" style={{ backgroundColor: `${styles.primaryColor}05` }}>
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-center mb-12" style={{ color: styles.primaryColor }}>
                Häufige Fragen
              </h2>
              <div className="space-y-6">
                {content.faq.map((item, index) => (
                  <div key={index} className="p-6 rounded-2xl bg-white shadow-md">
                    <h4 className="font-bold text-lg mb-3" style={{ color: styles.primaryColor }}>
                      {item.question}
                    </h4>
                    <p className="opacity-75">{item.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* CTA Section */}
        {content.cta && (
          <section 
            className="py-20 md:py-32 px-6 text-center"
            style={{ 
              background: `linear-gradient(135deg, ${styles.primaryColor} 0%, ${styles.secondaryColor} 100%)`,
              color: '#fff'
            }}
          >
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-5xl font-bold mb-6">
                {content.cta.headline}
              </h2>
              <p className="text-xl opacity-90 mb-10">
                {content.cta.description}
              </p>
              <a
                href={content.cta.buttonLink}
                className="inline-block px-10 py-4 rounded-lg font-semibold text-lg transition-all hover:scale-105 hover:shadow-lg"
                style={{ backgroundColor: styles.accentColor, color: '#fff' }}
              >
                {content.cta.buttonText}
              </a>
            </div>
          </section>
        )}

        {/* Footer */}
        {content.footer && (
          <footer 
            className="py-12 px-6 text-center"
            style={{ backgroundColor: styles.textColor, color: styles.backgroundColor }}
          >
            <p className="font-bold text-xl mb-2">{content.footer.companyName}</p>
            <p className="opacity-75">{content.footer.tagline}</p>
            <p className="mt-6 text-sm opacity-50">
              Erstellt mit Content-Leads
            </p>
          </footer>
        )}
      </div>
    </>
  );
};

export default PublicLandingPage;
