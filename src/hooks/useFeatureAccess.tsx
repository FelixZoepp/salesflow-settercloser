import { useSubscription } from './useSubscription';

// Stripe Product IDs
export const SUBSCRIPTION_TIERS = {
  STARTER_MONTHLY: 'prod_Tka87AKXNmsZUv',
  STARTER_YEARLY: 'prod_TkaAeLeq8rEn90',
  PRO_MONTHLY: 'prod_TkoJ98sfzflYyR',
  PRO_YEARLY: 'prod_TkoJ8E0e8l4vwV',
} as const;

// Features that are only available in Pro
const PRO_ONLY_FEATURES = [
  'ai_telephony',
  'call_summaries',
  'live_objection_handling',
  'email_templates',
  'email_outreach',
  'power_dialer',
] as const;

// Features available to all subscribers (Starter + Pro)
const STARTER_FEATURES = [
  'campaigns',
  'crm',
  'landing_pages',
  'lead_tracking',
  'lead_scoring',
  'manual_calling',
  'coaching',
  'video_course',
] as const;

export type ProFeature = typeof PRO_ONLY_FEATURES[number];
export type StarterFeature = typeof STARTER_FEATURES[number];
export type Feature = ProFeature | StarterFeature;

export const useFeatureAccess = () => {
  const { subscribed, productId, loading, isTrial } = useSubscription();

  const isProPlan = productId === SUBSCRIPTION_TIERS.PRO_MONTHLY || 
                    productId === SUBSCRIPTION_TIERS.PRO_YEARLY;

  const isStarterPlan = productId === SUBSCRIPTION_TIERS.STARTER_MONTHLY || 
                        productId === SUBSCRIPTION_TIERS.STARTER_YEARLY;

  const hasFeature = (feature: Feature): boolean => {
    // If loading, assume no access
    if (loading) return false;
    
    // If not subscribed at all, no access
    if (!subscribed) return false;

    // Trial users get Pro access
    if (isTrial) return true;

    // Check if it's a Pro-only feature
    if (PRO_ONLY_FEATURES.includes(feature as ProFeature)) {
      return isProPlan;
    }

    // Starter features are available to both plans
    return isStarterPlan || isProPlan;
  };

  const requiresPro = (feature: Feature): boolean => {
    return PRO_ONLY_FEATURES.includes(feature as ProFeature);
  };

  return {
    loading,
    subscribed,
    isProPlan,
    isStarterPlan,
    isTrial,
    hasFeature,
    requiresPro,
    productId,
    // Quick access checks
    canUseAITelephony: hasFeature('ai_telephony'),
    canUseCallSummaries: hasFeature('call_summaries'),
    canUseLiveObjectionHandling: hasFeature('live_objection_handling'),
    canUseEmailTemplates: hasFeature('email_templates'),
    canUseEmailOutreach: hasFeature('email_outreach'),
    canUsePowerDialer: hasFeature('power_dialer'),
  };
};
