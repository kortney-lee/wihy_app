/**
 * WIHY Checkout Service
 * 
 * Handles subscription plan checkout with Stripe integration.
 * Supports all platforms: Web, Android, iOS with proper callback handling.
 * 
 * @see https://auth.wihy.ai for API documentation
 */

import { Platform, Linking } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as ExpoLinking from 'expo-linking';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from './config';
import { fetchWithLogging } from '../utils/apiLogger';
import { authService } from './authService';

// ============= TYPES =============

export interface Plan {
  id: string;
  name: string;
  displayName: string;
  price: number;
  interval: 'month' | 'year' | 'one-time';
  description: string;
  features: string[];
  stripePriceId?: string;
  popular?: boolean;
  savings?: string;
}

export interface CheckoutRequest {
  plan: string;
  email: string;
  source: 'web' | 'ios' | 'android';
  successUrl?: string;
  cancelUrl?: string;
  metadata?: Record<string, string>;
}

export interface CheckoutResponse {
  success: boolean;
  checkoutUrl?: string;
  sessionId?: string;
  error?: string;
}

export interface PaymentStatus {
  success: boolean;
  subscriptionActive: boolean;
  plan?: string;
  expiresAt?: string;
  error?: string;
}

export interface CheckoutResult {
  success: boolean;
  canceled?: boolean;
  sessionId?: string;
  plan?: string;
  error?: string;
}

// ============= CONSTANTS =============

const CHECKOUT_STORAGE_KEY = '@wihy_pending_checkout';
const API_BASE_URL = API_CONFIG.authUrl || 'https://auth.wihy.ai';

// Available plans
export const WIHY_PLANS: Plan[] = [
  {
    id: 'free',
    name: 'free',
    displayName: 'Free',
    price: 0,
    interval: 'month',
    description: 'Get started with basic features',
    features: [
      'Basic nutrition search',
      'Barcode scanning (5/day)',
      'Daily health tips',
    ],
  },
  {
    id: 'premium',
    name: 'premium',
    displayName: 'Premium',
    price: 12.99,
    interval: 'month',
    description: 'Full access to WIHY AI',
    features: [
      'Unlimited nutrition search',
      'Unlimited barcode scanning',
      'WIHY AI chat assistant',
      'Personalized meal plans',
      'Health score tracking',
      'Export data & reports',
    ],
    popular: true,
  },
  {
    id: 'premium-yearly',
    name: 'premium-yearly',
    displayName: 'Premium Annual',
    price: 99.99,
    interval: 'year',
    description: 'Best value - save 36%',
    features: [
      'All Premium features',
      'Priority support',
      '2 months free',
    ],
    savings: 'Save $55.89/year',
  },
  {
    id: 'family-basic',
    name: 'family-basic',
    displayName: 'Family Basic',
    price: 24.99,
    interval: 'month',
    description: 'Perfect for families up to 4',
    features: [
      'All Premium features',
      'Up to 4 family members',
      'Family health dashboard',
      'Shared meal planning',
      'Parental controls',
    ],
  },
  {
    id: 'family-pro',
    name: 'family-pro',
    displayName: 'Family Pro',
    price: 49.99,
    interval: 'month',
    description: 'Growing families up to 8',
    features: [
      'All Family Basic features',
      'Up to 8 family members',
      'Advanced analytics',
      'Priority support',
    ],
  },
  {
    id: 'coach',
    name: 'coach',
    displayName: 'Coach',
    price: 99.99,
    interval: 'one-time',
    description: 'For health & fitness coaches',
    features: [
      'Client management dashboard',
      'Client health tracking',
      'Custom meal plan creation',
      'Revenue sharing (90%)',
      'Stripe Connect integration',
      'White-label options',
    ],
  },
];

// ============= SERVICE IMPLEMENTATION =============

class CheckoutService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  /**
   * Get the platform-specific source identifier
   */
  private getPlatformSource(): 'web' | 'ios' | 'android' {
    if (Platform.OS === 'web') return 'web';
    if (Platform.OS === 'ios') return 'ios';
    return 'android';
  }

  /**
   * Get callback URLs based on platform
   */
  private getCallbackUrls(): { successUrl: string; cancelUrl: string } {
    const source = this.getPlatformSource();
    
    if (source === 'web') {
      // Web uses HTTPS callbacks
      const baseUrl = typeof window !== 'undefined' 
        ? window.location.origin 
        : 'https://wihy.ai';
      return {
        successUrl: `${baseUrl}/payment/success`,
        cancelUrl: `${baseUrl}/payment/cancel`,
      };
    }
    
    // Mobile uses deep links
    return {
      successUrl: 'wihy://payment-success',
      cancelUrl: 'wihy://payment-cancel',
    };
  }

  /**
   * Get all available plans
   */
  async getPlans(): Promise<Plan[]> {
    try {
      const response = await fetchWithLogging(
        `${this.baseUrl}/api/payment/plans`,
        { method: 'GET' }
      );

      if (response.ok) {
        const data = await response.json();
        return data.plans || WIHY_PLANS;
      }
    } catch (error) {
      console.log('Failed to fetch plans from API, using defaults:', error);
    }
    
    return WIHY_PLANS;
  }

  /**
   * Get a specific plan by ID
   */
  getPlan(planId: string): Plan | undefined {
    return WIHY_PLANS.find(p => p.id === planId || p.name === planId);
  }

  /**
   * Initiate a checkout session
   * Returns a Stripe checkout URL
   */
  async initiateCheckout(plan: string, email: string): Promise<CheckoutResponse> {
    const source = this.getPlatformSource();
    const callbacks = this.getCallbackUrls();

    console.log('=== INITIATING CHECKOUT ===');
    console.log('Plan:', plan);
    console.log('Email:', email);
    console.log('Source:', source);
    console.log('Callbacks:', callbacks);

    try {
      // Store pending checkout info for callback handling
      await AsyncStorage.setItem(CHECKOUT_STORAGE_KEY, JSON.stringify({
        plan,
        email,
        initiatedAt: Date.now(),
      }));

      const request: CheckoutRequest = {
        plan,
        email,
        source,
        successUrl: callbacks.successUrl,
        cancelUrl: callbacks.cancelUrl,
      };

      // Get session token for authenticated requests
      const sessionToken = await authService.getSessionToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (sessionToken) {
        headers['Authorization'] = `Bearer ${sessionToken}`;
      }

      const response = await fetchWithLogging(
        `${this.baseUrl}/api/payment/create-checkout-session`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify(request),
        }
      );

      const data = await response.json();

      // Handle both old (checkout_url) and new (url) response formats
      const checkoutUrl = data.url || data.checkout_url;
      const sessionId = data.sessionId || data.session_id;

      if (response.ok && data.success && checkoutUrl) {
        console.log('=== CHECKOUT SESSION CREATED ===');
        console.log('Checkout URL:', checkoutUrl);
        
        return {
          success: true,
          checkoutUrl: checkoutUrl,
          sessionId: sessionId,
        };
      }

      console.log('=== CHECKOUT INITIATION FAILED ===');
      return {
        success: false,
        error: data.error || 'Failed to create checkout session',
      };
    } catch (error: any) {
      console.error('=== CHECKOUT ERROR ===', error);
      return {
        success: false,
        error: error.message || 'Network error during checkout',
      };
    }
  }

  /**
   * Open checkout in browser/webview
   * Handles platform-specific checkout experience
   */
  async openCheckout(checkoutUrl: string): Promise<CheckoutResult> {
    const source = this.getPlatformSource();

    console.log('=== OPENING CHECKOUT ===');
    console.log('URL:', checkoutUrl);
    console.log('Platform:', source);

    try {
      if (source === 'web') {
        // Web: Redirect to Stripe checkout
        if (typeof window !== 'undefined') {
          window.location.href = checkoutUrl;
        }
        return { success: true };
      }

      // Mobile: Use expo-web-browser with auth session
      const result = await WebBrowser.openAuthSessionAsync(
        checkoutUrl,
        'wihy://payment-success' // Listen for this callback
      );

      console.log('=== CHECKOUT RESULT ===', result);

      if (result.type === 'success' && result.url) {
        // Parse the callback URL
        return this.parseCheckoutCallback(result.url);
      }

      if (result.type === 'cancel' || result.type === 'dismiss') {
        return { success: false, canceled: true };
      }

      return { success: false, error: 'Checkout was not completed' };
    } catch (error: any) {
      console.error('=== CHECKOUT OPEN ERROR ===', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Complete checkout flow - initiate and open in one call
   */
  async checkout(plan: string, email: string): Promise<CheckoutResult> {
    const checkoutResponse = await this.initiateCheckout(plan, email);
    
    if (!checkoutResponse.success || !checkoutResponse.checkoutUrl) {
      return {
        success: false,
        error: checkoutResponse.error || 'Failed to create checkout session',
      };
    }

    return this.openCheckout(checkoutResponse.checkoutUrl);
  }

  /**
   * Parse checkout callback URL
   */
  parseCheckoutCallback(url: string): CheckoutResult {
    try {
      const parsed = ExpoLinking.parse(url);
      const queryParams = parsed.queryParams || {};

      console.log('=== PARSING CHECKOUT CALLBACK ===');
      console.log('URL:', url);
      console.log('Parsed:', parsed);

      if (url.includes('payment-success') || url.includes('success')) {
        return {
          success: true,
          sessionId: queryParams.session_id as string,
          plan: queryParams.plan as string,
        };
      }

      if (url.includes('payment-cancel') || url.includes('cancel')) {
        return {
          success: false,
          canceled: true,
          plan: queryParams.plan as string,
        };
      }

      return { success: false, error: 'Unknown callback type' };
    } catch (error: any) {
      console.error('=== CALLBACK PARSE ERROR ===', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Check payment/subscription status for a user
   */
  async getPaymentStatus(email: string): Promise<PaymentStatus> {
    try {
      const response = await fetchWithLogging(
        `${this.baseUrl}/api/payment/status/${encodeURIComponent(email)}`,
        { method: 'GET' }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        return {
          success: true,
          subscriptionActive: data.subscription_active || false,
          plan: data.plan,
          expiresAt: data.expires_at,
        };
      }

      return {
        success: false,
        subscriptionActive: false,
        error: data.error || 'Failed to check payment status',
      };
    } catch (error: any) {
      console.error('=== PAYMENT STATUS ERROR ===', error);
      return {
        success: false,
        subscriptionActive: false,
        error: error.message,
      };
    }
  }

  /**
   * Clear pending checkout data
   */
  async clearPendingCheckout(): Promise<void> {
    await AsyncStorage.removeItem(CHECKOUT_STORAGE_KEY);
  }

  /**
   * Get pending checkout data (if any)
   */
  async getPendingCheckout(): Promise<{ plan: string; email: string; initiatedAt: number } | null> {
    try {
      const data = await AsyncStorage.getItem(CHECKOUT_STORAGE_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  /**
   * Setup deep link listener for payment callbacks
   * Call this in your app's root component
   */
  setupDeepLinkListener(
    onSuccess: (result: CheckoutResult) => void,
    onCancel: (result: CheckoutResult) => void
  ): () => void {
    const handleUrl = (event: { url: string }) => {
      const result = this.parseCheckoutCallback(event.url);
      
      if (result.success) {
        onSuccess(result);
      } else if (result.canceled) {
        onCancel(result);
      }
    };

    // Listen for incoming links
    const subscription = Linking.addEventListener('url', handleUrl);

    // Check if app was opened with a URL
    Linking.getInitialURL().then(url => {
      if (url && (url.includes('payment-success') || url.includes('payment-cancel'))) {
        handleUrl({ url });
      }
    });

    // Return cleanup function
    return () => subscription.remove();
  }

  /**
   * Format price for display
   */
  formatPrice(price: number, interval?: string): string {
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);

    if (interval === 'year') {
      return `${formatted}/year`;
    }
    if (interval === 'month') {
      return `${formatted}/mo`;
    }
    return formatted;
  }

  /**
   * Calculate monthly equivalent for yearly plans
   */
  getMonthlyEquivalent(price: number, interval: string): number {
    if (interval === 'year') {
      return price / 12;
    }
    return price;
  }
}

// Export singleton instance
export const checkoutService = new CheckoutService();
export default checkoutService;
