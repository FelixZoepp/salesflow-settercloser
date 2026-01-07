import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SubscriptionStatus {
  subscribed: boolean;
  productId: string | null;
  subscriptionEnd: string | null;
  loading: boolean;
  error: string | null;
}

export const useSubscription = () => {
  const [status, setStatus] = useState<SubscriptionStatus>({
    subscribed: false,
    productId: null,
    subscriptionEnd: null,
    loading: true,
    error: null,
  });

  const checkSubscription = useCallback(async () => {
    try {
      setStatus(prev => ({ ...prev, loading: true, error: null }));
      
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        setStatus({
          subscribed: false,
          productId: null,
          subscriptionEnd: null,
          loading: false,
          error: null,
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke('check-subscription');
      
      if (error) {
        console.error('Subscription check error:', error);
        setStatus(prev => ({
          ...prev,
          loading: false,
          error: error.message,
        }));
        return;
      }

      setStatus({
        subscribed: data?.subscribed ?? false,
        productId: data?.product_id ?? null,
        subscriptionEnd: data?.subscription_end ?? null,
        loading: false,
        error: null,
      });
    } catch (err) {
      console.error('Subscription check failed:', err);
      setStatus(prev => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      }));
    }
  }, []);

  const openCustomerPortal = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      
      if (error) {
        console.error('Customer portal error:', error);
        return { error: error.message };
      }

      if (data?.url) {
        window.open(data.url, '_blank');
      }
      
      return { error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('Customer portal failed:', errorMessage);
      return { error: errorMessage };
    }
  };

  useEffect(() => {
    checkSubscription();

    // Re-check subscription every 60 seconds
    const interval = setInterval(checkSubscription, 60000);

    // Re-check when window regains focus (e.g., after payment)
    const handleFocus = () => {
      checkSubscription();
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [checkSubscription]);

  return {
    ...status,
    refresh: checkSubscription,
    openCustomerPortal,
  };
};
