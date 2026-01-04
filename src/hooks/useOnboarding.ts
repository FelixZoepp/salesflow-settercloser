import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface OnboardingStatus {
  isComplete: boolean;
  currentStep: number;
  steps: {
    heygen: boolean;
    pitchVideo: boolean;
    leads: boolean;
    script: boolean;
    landingPage: boolean;
  };
}

export const useOnboarding = () => {
  const [status, setStatus] = useState<OnboardingStatus>({
    isComplete: false,
    currentStep: 0,
    steps: {
      heygen: false,
      pitchVideo: false,
      leads: false,
      script: false,
      landingPage: false,
    },
  });
  const [loading, setLoading] = useState(true);

  const checkOnboardingStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get profile with onboarding status
      const { data: profile } = await supabase
        .from('profiles')
        .select('account_id, onboarding_completed, onboarding_step')
        .eq('id', user.id)
        .single();

      if (!profile?.account_id) return;

      // Check HeyGen integration
      const { data: integration } = await supabase
        .from('account_integrations')
        .select('heygen_api_key_id, heygen_avatar_id')
        .eq('account_id', profile.account_id)
        .maybeSingle();

      const heygenComplete = !!(integration?.heygen_api_key_id && integration?.heygen_avatar_id);

      // Check if there's a campaign with pitch video
      const { data: campaigns } = await supabase
        .from('campaigns')
        .select('id, pitch_video_url')
        .eq('account_id', profile.account_id)
        .not('pitch_video_url', 'is', null)
        .limit(1);

      const pitchVideoComplete = campaigns && campaigns.length > 0;

      // Check if there are any contacts
      const { count: contactCount } = await supabase
        .from('contacts')
        .select('id', { count: 'exact', head: true })
        .eq('account_id', profile.account_id);

      const leadsComplete = (contactCount || 0) > 0;

      // Check if there's a call script
      const { data: scripts } = await supabase
        .from('call_scripts')
        .select('id')
        .eq('account_id', profile.account_id)
        .eq('is_active', true)
        .limit(1);

      const scriptComplete = scripts && scripts.length > 0;

      // Check if there's a published landing page
      const { data: landingPages } = await supabase
        .from('landing_pages')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'published')
        .limit(1);

      const landingPageComplete = landingPages && landingPages.length > 0;

      // Calculate current step
      let currentStep = 0;
      if (heygenComplete) currentStep = 1;
      if (pitchVideoComplete) currentStep = 2;
      if (leadsComplete) currentStep = 3;
      if (scriptComplete) currentStep = 4;
      if (landingPageComplete) currentStep = 5;

      const isComplete = heygenComplete && pitchVideoComplete && leadsComplete && scriptComplete && landingPageComplete;

      setStatus({
        isComplete,
        currentStep,
        steps: {
          heygen: heygenComplete,
          pitchVideo: pitchVideoComplete,
          leads: leadsComplete,
          script: scriptComplete,
          landingPage: landingPageComplete,
        },
      });

      // Update profile if onboarding is complete
      if (isComplete && !profile.onboarding_completed) {
        await supabase
          .from('profiles')
          .update({ onboarding_completed: true, onboarding_step: 5 })
          .eq('id', user.id);
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  return { status, loading, refresh: checkOnboardingStatus };
};
