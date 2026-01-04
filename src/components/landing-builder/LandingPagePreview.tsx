import { Card } from "@/components/ui/card";
import { 
  CheckCircle, Zap, Shield, Star, Clock, Users, Award, Target, 
  TrendingUp, Heart, Sparkles, Rocket, Globe, Lock, BarChart, 
  Mail, Phone, MessageSquare 
} from "lucide-react";

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

interface LandingPagePreviewProps {
  content: LandingPageContent;
  styles: LandingPageStyles;
}

const iconMap: Record<string, any> = {
  CheckCircle, Zap, Shield, Star, Clock, Users, Award, Target,
  TrendingUp, Heart, Sparkles, Rocket, Globe, Lock, BarChart,
  Mail, Phone, MessageSquare
};

export const LandingPagePreview = ({ content, styles }: LandingPagePreviewProps) => {
  const getIcon = (iconName: string) => {
    const Icon = iconMap[iconName] || CheckCircle;
    return <Icon className="w-6 h-6" />;
  };

  if (!content.hero) {
    return (
      <Card className="glass-card border-white/10 p-12 text-center">
        <div className="text-muted-foreground">
          <Globe className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Generiere eine Landing Page, um die Vorschau zu sehen</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border-0 rounded-xl shadow-2xl">
      <div 
        className="min-h-[600px]"
        style={{ 
          backgroundColor: styles.backgroundColor,
          color: styles.textColor,
          fontFamily: styles.fontFamily
        }}
      >
        {/* Hero Section */}
        <section 
          className="py-16 px-6 text-center"
          style={{ 
            background: `linear-gradient(135deg, ${styles.primaryColor} 0%, ${styles.secondaryColor} 100%)`,
            color: '#fff'
          }}
        >
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl md:text-5xl font-bold mb-4">
              {content.hero.headline}
            </h1>
            <p className="text-lg md:text-xl opacity-90 mb-8">
              {content.hero.subheadline}
            </p>
            <button
              className="px-8 py-3 rounded-lg font-semibold text-lg transition-transform hover:scale-105"
              style={{ backgroundColor: styles.accentColor, color: '#fff' }}
            >
              {content.hero.ctaText}
            </button>
          </div>
        </section>

        {/* Benefits Section */}
        {content.benefits && content.benefits.length > 0 && (
          <section className="py-12 px-6">
            <div className="max-w-5xl mx-auto">
              <h2 className="text-2xl font-bold text-center mb-8" style={{ color: styles.primaryColor }}>
                Ihre Vorteile
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {content.benefits.map((benefit, index) => (
                  <div key={index} className="text-center p-6 rounded-lg" style={{ backgroundColor: `${styles.primaryColor}10` }}>
                    <div 
                      className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center"
                      style={{ backgroundColor: styles.primaryColor, color: '#fff' }}
                    >
                      {getIcon(benefit.icon)}
                    </div>
                    <h3 className="font-semibold text-lg mb-2">{benefit.title}</h3>
                    <p className="text-sm opacity-75">{benefit.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Features Section */}
        {content.features && content.features.length > 0 && (
          <section className="py-12 px-6" style={{ backgroundColor: `${styles.primaryColor}05` }}>
            <div className="max-w-5xl mx-auto">
              <h2 className="text-2xl font-bold text-center mb-8" style={{ color: styles.primaryColor }}>
                Unsere Leistungen
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {content.features.map((feature, index) => (
                  <div key={index} className="p-6 rounded-lg bg-white shadow-sm">
                    <h3 className="font-semibold text-xl mb-3" style={{ color: styles.primaryColor }}>
                      {feature.title}
                    </h3>
                    <p className="mb-4 opacity-75">{feature.description}</p>
                    <ul className="space-y-2">
                      {feature.bulletPoints.map((point, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" style={{ color: styles.accentColor }} />
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
          <section className="py-12 px-6">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl font-bold text-center mb-8" style={{ color: styles.primaryColor }}>
                Das sagen unsere Kunden
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {content.testimonials.map((testimonial, index) => (
                  <div key={index} className="p-6 rounded-lg border" style={{ borderColor: `${styles.primaryColor}30` }}>
                    <p className="italic mb-4">"{testimonial.quote}"</p>
                    <div>
                      <p className="font-semibold">{testimonial.author}</p>
                      <p className="text-sm opacity-75">{testimonial.role}, {testimonial.company}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* FAQ Section */}
        {content.faq && content.faq.length > 0 && (
          <section className="py-12 px-6" style={{ backgroundColor: `${styles.primaryColor}05` }}>
            <div className="max-w-3xl mx-auto">
              <h2 className="text-2xl font-bold text-center mb-8" style={{ color: styles.primaryColor }}>
                Häufige Fragen
              </h2>
              <div className="space-y-4">
                {content.faq.map((item, index) => (
                  <div key={index} className="p-4 rounded-lg bg-white shadow-sm">
                    <h4 className="font-semibold mb-2">{item.question}</h4>
                    <p className="text-sm opacity-75">{item.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* CTA Section */}
        {content.cta && (
          <section 
            className="py-16 px-6 text-center"
            style={{ 
              background: `linear-gradient(135deg, ${styles.primaryColor} 0%, ${styles.secondaryColor} 100%)`,
              color: '#fff'
            }}
          >
            <div className="max-w-3xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">
                {content.cta.headline}
              </h2>
              <p className="text-lg opacity-90 mb-8">
                {content.cta.description}
              </p>
              <button
                className="px-8 py-3 rounded-lg font-semibold text-lg transition-transform hover:scale-105"
                style={{ backgroundColor: styles.accentColor, color: '#fff' }}
              >
                {content.cta.buttonText}
              </button>
            </div>
          </section>
        )}

        {/* Footer */}
        {content.footer && (
          <footer className="py-8 px-6 text-center" style={{ backgroundColor: styles.textColor, color: styles.backgroundColor }}>
            <p className="font-semibold">{content.footer.companyName}</p>
            <p className="text-sm opacity-75">{content.footer.tagline}</p>
          </footer>
        )}
      </div>
    </Card>
  );
};
