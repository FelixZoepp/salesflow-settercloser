import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Globe } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { LeadPageTemplatePreview } from "@/components/landing-builder/LeadPageTemplatePreview";

const LandingPageBuilder = () => {
  const [userCalendarUrl, setUserCalendarUrl] = useState<string | null>(null);

  useEffect(() => {
    loadUserCalendarUrl();
  }, []);

  const loadUserCalendarUrl = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('profiles')
      .select('calendar_url')
      .eq('id', user.id)
      .single();

    if (data?.calendar_url) {
      setUserCalendarUrl(data.calendar_url);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Globe className="w-7 h-7 text-primary" />
            Lead-Seiten
          </h1>
          <p className="text-muted-foreground mt-1">
            Passe mit KI deine personalisierten Lead-Seiten an
          </p>
        </div>

        {/* Lead Page Template Preview & Editor */}
        <LeadPageTemplatePreview calendarUrl={userCalendarUrl || undefined} />
      </div>
    </Layout>
  );
};

export default LandingPageBuilder;
