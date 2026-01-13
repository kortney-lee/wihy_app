/**
 * WIHY Payment & Checkout Hooks
 * 
 * React hooks for payment and subscription management.
 * Provides easy-to-use interfaces for checkout, subscription status, and payment methods.
 */

import { useState, useEffect, useCallback } from 'react';
import { Alert, Platform, Linking } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { 
  checkoutService, 
  Plan, 
  CheckoutResult, 
  PaymentStatus,
  WIHY_PLANS 
} from '../services/checkoutService';
import { paymentService, Subscription, PaymentMethod } from '../services/paymentService';

// ============= useCheckout Hook =============

export interface UseCheckoutState {
  loading: boolean;
  plans: Plan[];
  selectedPlan: Plan | null;
  error: string | null;
}

export interface UseCheckoutActions {
  selectPlan: (planId: string) => void;
  checkout: (email?: string) => Promise<CheckoutResult>;
  checkStatus: (email: string) => Promise<PaymentStatus>;
  clearError: () => void;
}

export function useCheckout(): UseCheckoutState & UseCheckoutActions {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState<Plan[]>(WIHY_PLANS);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch plans on mount
  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const fetchedPlans = await checkoutService.getPlans();
      setPlans(fetchedPlans);
    } catch (err) {
      console.log('Using default plans');
    }
  };

  const selectPlan = useCallback((planId: string) => {
    const plan = plans.find(p => p.id === planId || p.name === planId);
    setSelectedPlan(plan || null);
    setError(null);
  }, [plans]);

  const checkout = useCallback(async (email?: string): Promise<CheckoutResult> => {
    const userEmail = email || user?.email;
    
    if (!selectedPlan) {
      const err = 'Please select a plan first';
      setError(err);
      return { success: false, error: err };
    }

    if (!userEmail) {
      const err = 'Email is required for checkout';
      setError(err);
      return { success: false, error: err };
    }

    setLoading(true);
    setError(null);

    try {
      const result = await checkoutService.checkout(selectedPlan.id, userEmail);
      
      if (!result.success && !result.canceled) {
        setError(result.error || 'Checkout failed');
      }

      return result;
    } catch (err: any) {
      const errorMsg = err.message || 'An unexpected error occurred';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, [selectedPlan, user?.email]);

  const checkStatus = useCallback(async (email: string): Promise<PaymentStatus> => {
    setLoading(true);
    try {
      return await checkoutService.getPaymentStatus(email);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    plans,
    selectedPlan,
    error,
    selectPlan,
    checkout,
    checkStatus,
    clearError,
  };
}

// ============= useSubscription Hook =============

export interface UseSubscriptionState {
  loading: boolean;
  subscription: Subscription | null;
  isActive: boolean;
  daysRemaining: number;
  error: string | null;
}

export interface UseSubscriptionActions {
  refresh: () => Promise<void>;
  cancel: (immediately?: boolean) => Promise<boolean>;
  resume: () => Promise<boolean>;
}

export function useSubscription(): UseSubscriptionState & UseSubscriptionActions {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      refresh();
    }
  }, [user?.id]);

  const refresh = useCallback(async () => {
    if (!user?.id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const subscriptions = await paymentService.getSubscriptions(user.id);
      // Get the first active subscription
      const active = subscriptions.find(s => 
        paymentService.isSubscriptionActive(s)
      );
      setSubscription(active || null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const cancel = useCallback(async (immediately = false): Promise<boolean> => {
    if (!subscription) return false;

    const confirmMessage = immediately 
      ? 'Cancel subscription immediately? You will lose access right away.'
      : 'Cancel subscription? You will have access until the end of your billing period.';

    return new Promise((resolve) => {
      if (Platform.OS === 'web') {
        if (window.confirm(confirmMessage)) {
          performCancel(immediately).then(resolve);
        } else {
          resolve(false);
        }
      } else {
        Alert.alert(
          'Cancel Subscription',
          confirmMessage,
          [
            { text: 'Keep Subscription', style: 'cancel', onPress: () => resolve(false) },
            { 
              text: 'Cancel', 
              style: 'destructive', 
              onPress: () => performCancel(immediately).then(resolve) 
            },
          ]
        );
      }
    });
  }, [subscription]);

  const performCancel = async (immediately: boolean): Promise<boolean> => {
    if (!subscription) return false;
    
    setLoading(true);
    try {
      await paymentService.cancelSubscription(subscription.id, immediately);
      await refresh();
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const resume = useCallback(async (): Promise<boolean> => {
    if (!subscription) return false;
    
    setLoading(true);
    try {
      await paymentService.resumeSubscription(subscription.id);
      await refresh();
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [subscription, refresh]);

  const isActive = subscription 
    ? paymentService.isSubscriptionActive(subscription) 
    : false;

  const daysRemaining = subscription 
    ? paymentService.getDaysRemaining(subscription) 
    : 0;

  return {
    loading,
    subscription,
    isActive,
    daysRemaining,
    error,
    refresh,
    cancel,
    resume,
  };
}

// ============= usePaymentMethods Hook =============

export interface UsePaymentMethodsState {
  loading: boolean;
  paymentMethods: PaymentMethod[];
  defaultMethod: PaymentMethod | null;
  error: string | null;
}

export interface UsePaymentMethodsActions {
  refresh: () => Promise<void>;
  addPaymentMethod: () => Promise<void>;
  setDefault: (methodId: string) => Promise<boolean>;
  remove: (methodId: string) => Promise<boolean>;
}

export function usePaymentMethods(): UsePaymentMethodsState & UsePaymentMethodsActions {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      refresh();
    }
  }, [user?.id]);

  const refresh = useCallback(async () => {
    if (!user?.id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const methods = await paymentService.getPaymentMethods(user.id);
      setPaymentMethods(methods);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const addPaymentMethod = useCallback(async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const setupIntent = await paymentService.createSetupIntent(user.id);
      // In a real implementation, you'd use Stripe's SDK to present the card form
      // For now, we'll open the Stripe customer portal
      console.log('Setup intent created:', setupIntent.setupIntentId);
      await refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user?.id, refresh]);

  const setDefault = useCallback(async (methodId: string): Promise<boolean> => {
    if (!user?.id) return false;
    
    setLoading(true);
    try {
      await paymentService.setDefaultPaymentMethod(user.id, methodId);
      await refresh();
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [user?.id, refresh]);

  const remove = useCallback(async (methodId: string): Promise<boolean> => {
    setLoading(true);
    try {
      await paymentService.deletePaymentMethod(methodId);
      await refresh();
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [refresh]);

  const defaultMethod = paymentMethods.find(m => m.isDefault) || null;

  return {
    loading,
    paymentMethods,
    defaultMethod,
    error,
    refresh,
    addPaymentMethod,
    setDefault,
    remove,
  };
}

// ============= usePaymentCallback Hook =============

export interface PaymentCallbackHandlers {
  onSuccess?: (result: CheckoutResult) => void;
  onCancel?: (result: CheckoutResult) => void;
}

/**
 * Hook to handle payment deep link callbacks
 * Set up in your app's root component to handle payment redirects
 */
export function usePaymentCallback(handlers: PaymentCallbackHandlers = {}) {
  const { user, updateUser } = useAuth();

  useEffect(() => {
    const handleSuccess = async (result: CheckoutResult) => {
      console.log('=== PAYMENT SUCCESS CALLBACK ===', result);
      
      // Update user subscription status
      if (user?.email && result.plan) {
        const status = await checkoutService.getPaymentStatus(user.email);
        if (status.subscriptionActive) {
          await updateUser({ 
            plan: result.plan as any,
          });
        }
      }
      
      // Clear pending checkout
      await checkoutService.clearPendingCheckout();
      
      handlers.onSuccess?.(result);
    };

    const handleCancel = async (result: CheckoutResult) => {
      console.log('=== PAYMENT CANCEL CALLBACK ===', result);
      
      // Clear pending checkout
      await checkoutService.clearPendingCheckout();
      
      handlers.onCancel?.(result);
    };

    // Set up deep link listener
    const cleanup = checkoutService.setupDeepLinkListener(handleSuccess, handleCancel);

    return cleanup;
  }, [user, updateUser, handlers.onSuccess, handlers.onCancel]);
}

// ============= Utility Functions =============

/**
 * Format plan price for display
 */
export function formatPlanPrice(plan: Plan): string {
  return checkoutService.formatPrice(plan.price, plan.interval);
}

/**
 * Get monthly equivalent price
 */
export function getMonthlyPrice(plan: Plan): string {
  const monthly = checkoutService.getMonthlyEquivalent(plan.price, plan.interval);
  return checkoutService.formatPrice(monthly, 'month');
}

/**
 * Check if plan is an upgrade from current
 */
export function isUpgrade(currentPlan: string, newPlan: string): boolean {
  const planOrder = ['free', 'premium', 'premium-yearly', 'family-basic', 'family-pro', 'coach'];
  const currentIndex = planOrder.indexOf(currentPlan);
  const newIndex = planOrder.indexOf(newPlan);
  return newIndex > currentIndex;
}
