import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { 
  CheckCircle, Zap, Shield, Star, Clock, Users, Award, Target, 
  TrendingUp, Heart, Sparkles, Rocket, Globe, Lock, BarChart, 
  Mail, Phone, MessageSquare, Loader2, Play, Calendar
} from "lucide-react";
import { Helmet } from "react-helmet";

interface LandingPageContent {
  hero?: {
    headline: string;
    subheadline: string;
    ctaText?: string;
    ctaLink?: string;
    videoPlaceholder?: boolean;
  };
  benefits?: Array<{
    icon: string;
    title: string;
    description: string;
  }>;
  offer?: {
    title: string;
    description: string;
    bulletPoints: string[];
  };
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
  calendar_url: string | null;
  user_id: string;
}

const iconMap: Record<string, any> = {
  CheckCircle, Zap, Shield, Star, Clock, Users, Award, Target,
  TrendingUp, Heart, Sparkles, Rocket, Globe, Lock, BarChart,
  Mail, Phone, MessageSquare
};

const PublicLandingPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [page, setPage] = useState<LandingPageData | null>(null);
  const [calendarUrl, setCalendarUrl] = useState<string | null>(null);
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

      // Fetch user's calendar URL if page doesn't have one
      let finalCalendarUrl = data.calendar_url;
      if (!finalCalendarUrl && data.user_id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('calendar_url')
          .eq('id', data.user_id)
          .single();
        
        if (profile?.calendar_url) {
          finalCalendarUrl = profile.calendar_url;
        }
      }
      setCalendarUrl(finalCalendarUrl);

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
        calendar_url: data.calendar_url,
        user_id: data.user_id,
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

  // Get calendar embed
  const getCalendarEmbed = (styles: LandingPageStyles) => {
    if (!calendarUrl) return null;
    
    // Calendly embed
    if (calendarUrl.includes('calendly.com')) {
      const cleanUrl = calendarUrl.replace(/\/$/, '');
      return (
        <div className="mt-8 rounded-2xl overflow-hidden bg-white shadow-lg" style={{ minHeight: '700px' }}>
          <iframe
            src={`${cleanUrl}?hide_gdpr_banner=1&background_color=ffffff&text_color=1f2937&primary_color=${styles.primaryColor.replace('#', '')}`}
            width="100%"
            height="700"
            frameBorder="0"
            title="Termin buchen"
          />
        </div>
      );
    }
    
    // Cal.com embed
    if (calendarUrl.includes('cal.com')) {
      return (
        <div className="mt-8 rounded-2xl overflow-hidden bg-white shadow-lg" style={{ minHeight: '700px' }}>
          <iframe
            src={calendarUrl}
            width="100%"
            height="700"
            frameBorder="0"
            title="Termin buchen"
          />
        </div>
      );
    }

    return null;
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
  const calendarEmbed = getCalendarEmbed(styles);

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
        {/* Hero Section with Video */}
        {content.hero && (
          <section 
            className="py-16 md:py-24 px-6"
            style={{ 
              background: `linear-gradient(135deg, ${styles.primaryColor} 0%, ${styles.secondaryColor} 100%)`,
              color: '#fff'
            }}
          >
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                {/* Text Content */}
                <div className="text-left">
                  <h1 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">
                    {content.hero.headline}
                  </h1>
                  <p className="text-lg md:text-xl opacity-90 mb-8">
                    {content.hero.subheadline}
                  </p>
                  <div className="flex items-center gap-2 text-sm opacity-75">
                    <Calendar className="w-5 h-5" />
                    <span>Persönliche Nachricht für Sie</span>
                  </div>
                </div>
                
                {/* Video Placeholder */}
                <div className="relative">
                  <div 
                    className="aspect-video rounded-2xl bg-black/30 backdrop-blur-sm flex items-center justify-center border-2 border-white/20 shadow-2xl"
                  >
                    <div className="text-center">
                      <div 
                        className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center cursor-pointer transition-transform hover:scale-110"
                        style={{ backgroundColor: styles.accentColor }}
                      >
                        <Play className="w-10 h-10 text-white ml-1" />
                      </div>
                      <p className="text-lg opacity-75">Ihr persönliches Video</p>
                      <p className="text-sm opacity-50 mt-1">Schauen Sie sich diese Nachricht an!</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Benefits Section */}
        {content.benefits && content.benefits.length > 0 && (
          <section className="py-16 md:py-24 px-6">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-center mb-12" style={{ color: styles.primaryColor }}>
                Ihre Vorteile auf einen Blick
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

        {/* Offer Section */}
        {content.offer && (
          <section className="py-16 md:py-24 px-6" style={{ backgroundColor: `${styles.primaryColor}05` }}>
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-6" style={{ color: styles.primaryColor }}>
                {content.offer.title}
              </h2>
              <p className="text-lg mb-10 opacity-80">{content.offer.description}</p>
              <div className="inline-block text-left bg-white rounded-2xl p-8 shadow-lg">
                <ul className="space-y-4">
                  {content.offer.bulletPoints.map((point, idx) => (
                    <li key={idx} className="flex items-start gap-4">
                      <CheckCircle 
                        className="w-6 h-6 mt-0.5 shrink-0" 
                        style={{ color: styles.accentColor }} 
                      />
                      <span className="text-lg">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        )}

        {/* Features Section (legacy support) */}
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

        {/* CTA Section with Calendar */}
        {content.cta && (
          <section 
            className="py-16 md:py-24 px-6 text-center"
            style={{ 
              background: `linear-gradient(135deg, ${styles.primaryColor} 0%, ${styles.secondaryColor} 100%)`,
              color: '#fff'
            }}
          >
            <div className="max-w-4xl mx-auto">
              <Calendar className="w-12 h-12 mx-auto mb-6 opacity-80" />
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                {content.cta.headline}
              </h2>
              <p className="text-lg md:text-xl opacity-90 mb-8">
                {content.cta.description}
              </p>
              
              {calendarEmbed ? (
                calendarEmbed
              ) : (
                <a
                  href={calendarUrl || content.cta.buttonLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block px-10 py-4 rounded-xl font-semibold text-lg transition-all hover:scale-105 hover:shadow-lg"
                  style={{ backgroundColor: styles.accentColor, color: '#fff' }}
                >
                  <span className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    {content.cta.buttonText}
                  </span>
                </a>
              )}
              
              <p className="text-sm opacity-60 mt-6">
                Unverbindlich & kostenlos
              </p>
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
