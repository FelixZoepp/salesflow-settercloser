import { useSubscriptionContext } from '@/contexts/SubscriptionContext';

// Stripe Product IDs
export const SUBSCRIPTION_TIERS = {
  STARTER_MONTHLY: 'prod_Tka87AKXNmsZUv',
  STARTER_YEARLY: 'prod_TkaAeLeq8rEn90',
  PRO_MONTHLY: 'prod_TkoJ98sfzflYyR',
  PRO_YEARLY: 'prod_TkoJ8E0e8l4vwV',
  SCALE_MONTHLY: 'prod_TrFB2U9xGL68vY',
  SCALE_YEARLY: 'prod_TrFB4brZtWtOvX',
} as const;

// Stripe Price IDs for checkout
export const PRICE_IDS = {
  starter: {
    monthly: 'price_1RUtXVG2AAmJlpyxLVYgkqxM',
    yearly: 'price_1RUtaIG2AAmJlpyxyLY3yMSZ',
  },
  pro: {
    monthly: 'price_1RV6LtG2AAmJlpyxZvpwDdYW',
    yearly: 'price_1RV6MkG2AAmJlpyxc1SZlbKD',
  },
  scale: {
    monthly: 'price_1StWgeEaO7RPawTGAOC9JZxj',
    yearly: 'price_1StWggEaO7RPawTGNXYsPtbD',
  },
} as const;

// Seat limits per tier
export const SEAT_LIMITS = {
  starter: 1,
  pro: 1, // +1 Add-on available for 49€
  scale: 3,
} as const;

// Features that require Pro or Scale
const PRO_FEATURES = [
  'ai_telephony',
  'call_summaries',
  'live_objection_handling',
  'objection_library',
  'email_templates',
  'email_outreach',
  'power_dialer',
] as const;

// Features exclusive to Scale
const SCALE_FEATURES = [
  'team_management',
  'advanced_analytics',
] as const;

// Features available to all subscribers (Starter + Pro + Scale)
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

export type ProFeature = typeof PRO_FEATURES[number];
export type ScaleFeature = typeof SCALE_FEATURES[number];
export type StarterFeature = typeof STARTER_FEATURES[number];
export type Feature = ProFeature | ScaleFeature | StarterFeature;

export const useFeatureAccess = () => {
  const { subscribed, productId, loading, isTrial } = useSubscriptionContext();

  // Check for Scale plan
  const isScalePlan = productId === SUBSCRIPTION_TIERS.SCALE_MONTHLY || 
                      productId === SUBSCRIPTION_TIERS.SCALE_YEARLY ||
                      productId === 'internal_Scale' ||
                      productId === 'db_scale' ||
                      productId === 'db_Scale' ||
                      productId?.toLowerCase() === 'scale' ||
                      productId?.toLowerCase()?.includes('scale');

  // Check for Pro plan - includes Stripe product IDs, internal Pro, and database subscriptions
  const isProPlan = !isScalePlan && (
                    productId === SUBSCRIPTION_TIERS.PRO_MONTHLY || 
                    productId === SUBSCRIPTION_TIERS.PRO_YEARLY ||
                    productId === 'internal_Pro' ||
                    productId === 'db_pro' ||
                    productId === 'db_Pro' ||
                    productId?.toLowerCase() === 'pro' ||
                    productId?.toLowerCase()?.includes('pro'));

  // Check for Starter plan - includes Stripe product IDs, internal Starter, database subscriptions, and "basic"
  const isStarterPlan = !isScalePlan && !isProPlan && (
                        productId === SUBSCRIPTION_TIERS.STARTER_MONTHLY || 
                        productId === SUBSCRIPTION_TIERS.STARTER_YEARLY ||
                        productId === 'internal_Starter' ||
                        productId === 'db_starter' ||
                        productId === 'db_Starter' ||
                        productId === 'db_basic' ||
                        productId === 'db_Basic' ||
                        productId?.toLowerCase() === 'starter' ||
                        productId?.toLowerCase() === 'basic' ||
                        productId?.toLowerCase()?.includes('starter') ||
                        productId?.toLowerCase()?.includes('basic'));

  // Get seat limit for current plan
  const getSeatLimit = (): number => {
    if (isScalePlan) return SEAT_LIMITS.scale;
    if (isProPlan) return SEAT_LIMITS.pro;
    if (isStarterPlan) return SEAT_LIMITS.starter;
    return 0;
  };

  const hasFeature = (feature: Feature): boolean => {
    // If loading, assume no access
    if (loading) return false;
    
    // If not subscribed at all, no access
    if (!subscribed) return false;

    // Trial users get Pro access
    if (isTrial) return true;

    // Check if it's a Scale-only feature
    if (SCALE_FEATURES.includes(feature as ScaleFeature)) {
      return isScalePlan;
    }

    // Check if it's a Pro feature (available to Pro and Scale)
    if (PRO_FEATURES.includes(feature as ProFeature)) {
      return isProPlan || isScalePlan;
    }

    // Starter features are available to all plans
    return isStarterPlan || isProPlan || isScalePlan;
  };

  const requiresPro = (feature: Feature): boolean => {
    return PRO_FEATURES.includes(feature as ProFeature);
  };

  const requiresScale = (feature: Feature): boolean => {
    return SCALE_FEATURES.includes(feature as ScaleFeature);
  };

  // Get current tier name
  const getCurrentTier = (): 'starter' | 'pro' | 'scale' | null => {
    if (isScalePlan) return 'scale';
    if (isProPlan) return 'pro';
    if (isStarterPlan) return 'starter';
    return null;
  };

  return {
    loading,
    subscribed,
    isScalePlan,
    isProPlan,
    isStarterPlan,
    isTrial,
    hasFeature,
    requiresPro,
    requiresScale,
    productId,
    seatLimit: getSeatLimit(),
    currentTier: getCurrentTier(),
    // Quick access checks
    canUseAITelephony: hasFeature('ai_telephony'),
    canUseCallSummaries: hasFeature('call_summaries'),
    canUseLiveObjectionHandling: hasFeature('live_objection_handling'),
    canUseObjectionLibrary: hasFeature('objection_library'),
    canUseEmailTemplates: hasFeature('email_templates'),
    canUseEmailOutreach: hasFeature('email_outreach'),
    canUsePowerDialer: hasFeature('power_dialer'),
    canUseTeamManagement: hasFeature('team_management'),
    canUseAdvancedAnalytics: hasFeature('advanced_analytics'),
  };
};
