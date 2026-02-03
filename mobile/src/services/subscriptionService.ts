/**
 * Subscription Service
 * 
 * Handles consumer subscriptions and add-ons
 * for both web (Stripe) and native (Apple/Google IAP)
 * 
 * Base URL: https://payment.wihy.ai
 */

import { Platform } from 'react-native';
import { apiClient } from './apiClient';

// ============= TYPES =============

export type PlanId = 
  | 'free'
  | 'pro_monthly'
  | 'pro_monthly_plus'
  | 'pro_yearly'
  | 'family_basic'
  | 'family_yearly'
  | 'family_pro_plus'
  | 'family_pro_plus_yearly'
  | 'coach'
  // Legacy plan IDs (backward compatibility)
  | 'family_pro'
  | 'family_pro_yearly';

export type AddOnId = 
  | 'wihy_coach'
  | 'instacart';

export interface SubscriptionPlan {
  id: PlanId;
  name: string;
  price: number;
  interval: 'month' | 'year';
  priceId: string;
  features: string[];
}

export interface AddOn {
  id: AddOnId;
  name: string;
  description: string;
  price: number;
  interval: 'month' | 'year';
  features: string[];
}

export interface CheckoutSession {
  checkoutUrl: string;
  sessionId: string;
  plan: PlanId;
  email: string;
}

export interface ActiveSubscription {
  id: string;
  providerSubscriptionId?: string;
  plan: PlanId;
  status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete';
  currentPeriodEnd: number; // Unix timestamp
  auto_renew: boolean;
  provider: 'stripe' | 'apple' | 'google';
  addons?: SubscriptionAddon[];
}

interface ApiActiveSubscription {
  id: string;
  plan: PlanId;
  status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete';
  provider: 'stripe' | 'apple' | 'google';
  startDate?: string;
  endDate?: string;
  trialEndDate?: string | null;
  provider_subscription_id?: string;
}

interface ActiveSubscriptionResponse {
  success: boolean;
  hasActiveSubscription: boolean;
  subscription: ApiActiveSubscription | null;
  userPlan: PlanId;
  userSubscriptionStatus: string;
}

interface VerifySubscriptionResponse {
  success: boolean;
  isActive: boolean;
  currentPlan: PlanId;
  subscriptionStatus: string;
  providers?: {
    stripe?: {
      status: string;
      currentPeriodEnd?: string;
      cancelAtPeriodEnd?: boolean;
    } | null;
    apple?: { status: string; expiresDate?: string } | null;
    google?: { status: string; expiresDate?: string } | null;
  };
}

export interface SubscriptionAddon {
  id: AddOnId;
  name: string;
  price: number;
  subscriptionItemId: string;
}

export interface UpgradeOption {
  id: PlanId;
  name: string;
  price: number;
  interval: 'month' | 'year';
}

// ============= SERVICE IMPLEMENTATION =============

class SubscriptionService {
  private baseUrl = 'https://payment.wihy.ai';

  /**
  * Get all available subscription plans
  * GET /api/stripe/plans
   */
  async getPlans(): Promise<SubscriptionPlan[]> {
    const response = await apiClient.payment<{ success: boolean; plans: SubscriptionPlan[] }>(
      'GET',
      '/api/stripe/plans'
    );
    return response.plans;
  }

  /**
  * Create Stripe checkout session for web
  * POST /api/stripe/create-checkout-session
   * 
   * @param plan - Plan ID (e.g., 'pro_monthly')
   * @param email - User email
   * @param successUrl - Redirect URL after successful payment
   * @param cancelUrl - Redirect URL if user cancels
   */
  async createCheckoutSession(
    plan: PlanId,
    email: string,
    successUrl?: string,
    cancelUrl?: string
  ): Promise<CheckoutSession> {
    const response = await apiClient.payment<{ success: boolean } & CheckoutSession>(
      'POST',
      '/api/stripe/create-checkout-session',
      {
        plan,
        email,
        source: Platform.OS,
        successUrl: successUrl || `${window?.location?.origin || ''}/payment/success`,
        cancelUrl: cancelUrl || `${window?.location?.origin || ''}/payment/cancel`,
      }
    );

    return {
      checkoutUrl: response.checkoutUrl,
      sessionId: response.sessionId,
      plan: response.plan,
      email: response.email,
    };
  }

  /**
   * Get Stripe customer portal URL for subscription management
   * GET /api/stripe/customer-portal
   */
  async getCustomerPortal(): Promise<string> {
    const response = await apiClient.payment<{ success: boolean; portalUrl: string }>(
      'GET',
      '/api/stripe/customer-portal'
    );
    return response.portalUrl;
  }

  /**
   * Cancel subscription
   * POST /api/stripe/cancel-subscription
   */
  async cancelSubscription(subscriptionId: string, userId?: string): Promise<{ cancelAt?: number }> {
    const response = await apiClient.payment<{ success: boolean; cancelAt?: number }>(
      'POST',
      '/api/stripe/cancel-subscription',
      {
        subscriptionId,
        ...(userId ? { userId } : {}),
      }
    );
    return { cancelAt: response.cancelAt };
  }

  /**
   * Get all available add-ons
   * GET /api/stripe/addons
   */
  async getAddons(): Promise<AddOn[]> {
    const response = await apiClient.payment<{ success: boolean; addons: AddOn[] }>(
      'GET',
      '/api/stripe/addons'
    );
    return response.addons;
  }

  /**
  * Get valid upgrade options from current plan
  * GET /api/stripe/upgrade-options/:currentPlan
   * 
   * @param currentPlan - Current plan ID (e.g., 'pro_monthly')
   */
  async getUpgradeOptions(currentPlan: PlanId): Promise<UpgradeOption[]> {
    const response = await apiClient.payment<{ success: boolean; upgrades: UpgradeOption[] }>(
      'GET',
      `/api/stripe/upgrade-options/${currentPlan}`
    );
    return response.upgrades;
  }

  /**
  * Add an add-on or integration to existing subscription
  * POST /api/stripe/add-addon
   * 
   * @param subscriptionId - Stripe subscription ID
   * @param addonId - Add-on or integration ID
   */
  async addAddon(subscriptionId: string, addonId: AddOnId): Promise<SubscriptionAddon> {
    const response = await apiClient.payment<{ success: boolean; addon: SubscriptionAddon }>(
      'POST',
      '/api/stripe/add-addon',
      {
        subscriptionId,
        addonId,
      }
    );
    return response.addon;
  }

  /**
  * Remove an add-on from subscription
  * POST /api/stripe/remove-addon
   * 
   * @param subscriptionItemId - Stripe subscription item ID
   */
  async removeAddon(subscriptionItemId: string): Promise<void> {
    await apiClient.payment<{ success: boolean; message: string }>(
      'POST',
      '/api/stripe/remove-addon',
      {
        subscriptionItemId,
      }
    );
  }

  /**
  * Upgrade subscription to a higher-tier plan
  * POST /api/stripe/upgrade
   * 
   * @param subscriptionId - Current Stripe subscription ID
   * @param newPlan - New plan ID to upgrade to
   */
  async upgradeSubscription(subscriptionId: string, newPlan: PlanId): Promise<ActiveSubscription> {
    const response = await apiClient.payment<{ success: boolean; subscription: ActiveSubscription }>(
      'POST',
      '/api/stripe/upgrade',
      {
        subscriptionId,
        newPlan,
      }
    );
    return response.subscription;
  }

  /**
   * Get active subscription from any provider (Stripe, Apple, Google)
   * GET /api/subscriptions/active/:userId
   */
  async getActiveSubscription(userId: string): Promise<ActiveSubscription | null> {
    try {
      const response = await apiClient.payment<ActiveSubscriptionResponse>(
        'GET',
        `/api/subscriptions/active/${userId}`
      );

      if (!response.hasActiveSubscription || !response.subscription) {
        return null;
      }

      const mapped: ActiveSubscription = {
        id: response.subscription.provider_subscription_id || response.subscription.id,
        providerSubscriptionId: response.subscription.provider_subscription_id,
        plan: response.subscription.plan,
        status: response.subscription.status,
        provider: response.subscription.provider,
        currentPeriodEnd: response.subscription.endDate
          ? Math.floor(new Date(response.subscription.endDate).getTime() / 1000)
          : 0,
        auto_renew: response.subscription.status === 'active',
      };

      if (!mapped.providerSubscriptionId) {
        const subscriptions = await this.getAllSubscriptions(userId);
        const active = subscriptions.find((sub) => sub.status === 'active');
        if (active?.provider_subscription_id) {
          mapped.providerSubscriptionId = active.provider_subscription_id;
          mapped.id = active.provider_subscription_id;
        }
      }

      return mapped;
    } catch (error) {
      console.log('[SubscriptionService] No active subscription found');
      return null;
    }
  }

  /**
   * Get all subscriptions for a user (past and present)
   * GET /api/subscriptions/:userId
   */
  async getAllSubscriptions(userId: string): Promise<Array<ApiActiveSubscription & { provider_subscription_id?: string }>> {
    const response = await apiClient.payment<{ success: boolean; subscriptions: Array<ApiActiveSubscription & { provider_subscription_id?: string }>; data?: Array<ApiActiveSubscription & { provider_subscription_id?: string }> }>(
      'GET',
      `/api/subscriptions/${userId}`
    );
    return response.subscriptions || response.data || [];
  }

  /**
   * Verify all subscriptions (Stripe, Apple, Google) and sync status
   * POST /api/subscriptions/verify
   */
  async verifyAllSubscriptions(userId: string): Promise<VerifySubscriptionResponse | null> {
    try {
      const response = await apiClient.payment<VerifySubscriptionResponse>(
        'POST',
        '/api/subscriptions/verify',
        { userId }
      );
      return response;
    } catch (error) {
      console.error('[SubscriptionService] Failed to verify subscriptions:', error);
      return null;
    }
  }

  // ============= NATIVE IAP METHODS =============

  /**
   * Verify Apple IAP receipt
   * POST /api/iap/verify-receipt
   * 
   * @param receipt - Base64 encoded receipt data
   * @param productId - Product ID (e.g., 'com.wihy.premium.monthly')
   */
  async verifyAppleReceipt(receipt: string, productId: string): Promise<any> {
    const response = await apiClient.payment<{ success: boolean; data: any }>(
      'POST',
      '/iap/verify-receipt',
      {
        receipt,
        productId,
      }
    );
    return response.data;
  }

  /**
   * Get Apple IAP subscription status
   * GET /api/iap/subscription
   */
  async getAppleSubscription(): Promise<ActiveSubscription | null> {
    try {
      const response = await apiClient.payment<{ success: boolean; data: ActiveSubscription }>(
        'GET',
        '/iap/subscription'
      );
      return response.data;
    } catch (error) {
      console.log('[SubscriptionService] No Apple subscription found');
      return null;
    }
  }

  /**
   * Verify Google Play purchase
   * POST /api/google-play/verify-purchase
   * 
   * @param productId - Product ID
   * @param purchaseToken - Google Play purchase token
   */
  async verifyGooglePlayPurchase(productId: string, purchaseToken: string): Promise<any> {
    const response = await apiClient.payment<{ success: boolean; data: any }>(
      'POST',
      '/google-play/verify-purchase',
      {
        productId,
        purchaseToken,
      }
    );
    return response.data;
  }

  /**
   * Acknowledge Google Play purchase
   * POST /api/google-play/acknowledge
   * 
   * @param productId - Product ID
   * @param purchaseToken - Google Play purchase token
   */
  async acknowledgeGooglePlayPurchase(productId: string, purchaseToken: string): Promise<void> {
    await apiClient.payment<{ success: boolean }>(
      'POST',
      '/google-play/acknowledge',
      {
        productId,
        purchaseToken,
      }
    );
  }

  /**
   * Get Google Play subscription status
   * GET /api/google-play/subscription
   */
  async getGooglePlaySubscription(): Promise<ActiveSubscription | null> {
    try {
      const response = await apiClient.payment<{ success: boolean; data: ActiveSubscription }>(
        'GET',
        '/google-play/subscription'
      );
      return response.data;
    } catch (error) {
      console.log('[SubscriptionService] No Google Play subscription found');
      return null;
    }
  }

  // ============= HELPER METHODS =============

  /**
   * Check if user has active subscription
   */
  async hasActiveSubscription(userId: string): Promise<boolean> {
    const subscription = await this.getActiveSubscription(userId);
    return subscription?.status === 'active';
  }

  /**
   * Check if user has specific plan
   */
  async hasPlan(userId: string, planId: PlanId): Promise<boolean> {
    const subscription = await this.getActiveSubscription(userId);
    return subscription?.plan === planId;
  }

  /**
   * Get user's current plan (or 'free' if no subscription)
   */
  async getCurrentPlan(userId: string): Promise<PlanId> {
    const subscription = await this.getActiveSubscription(userId);
    return subscription?.plan || 'free';
  }

  /**
   * Check if user can upgrade to a specific plan
   */
  async canUpgradeTo(userId: string, newPlan: PlanId): Promise<boolean> {
    const currentPlan = await this.getCurrentPlan(userId);
    const upgradeOptions = await this.getUpgradeOptions(currentPlan);
    return upgradeOptions.some(option => option.id === newPlan);
  }
}

export const subscriptionService = new SubscriptionService();
