import { Platform } from 'react-native';
import { API_CONFIG } from './config';
import { fetchWithLogging } from '../utils/apiLogger';
import { authService } from './authService';

// In-App Purchases only work on native platforms (iOS/Android)
// Web uses Stripe checkout instead - this service is a no-op on web
const isNative = Platform.OS === 'ios' || Platform.OS === 'android';

// Product/Subscription IDs - update with your real store IDs
const PRODUCT_IDS = Platform.select({
  ios: [
    'com.wihy.native.premium_monthly',
    'com.wihy.native.premium_yearly',
    'com.wihy.native.family_basic_monthly',
    'com.wihy.native.family_basic_yearly',
    'com.wihy.native.family_premium_monthly',
    'com.wihy.native.family_premium_yearly',
    'com.wihy.native.coach_monthly',
    'com.wihy.native.coach_yearly',
    'com.wihy.native.nutrition_analysis',
  ],
  android: [
    'com.wihy.native.premium_monthly',
    'com.wihy.native.premium_yearly',
    'com.wihy.native.family_basic_monthly',
    'com.wihy.native.family_basic_yearly',
    'com.wihy.native.family_premium_monthly',
    'com.wihy.native.family_premium_yearly',
    'com.wihy.native.coach_monthly',
    'com.wihy.native.coach_yearly',
    'com.wihy.native.nutrition_analysis',
  ],
  default: [],
}) || [];

// Type definitions for IAP
export interface IAPItemDetails {
  productId: string;
  title: string;
  description: string;
  price: string;
  priceAmountMicros: number;
  priceCurrencyCode: string;
  subscriptionPeriod?: string;
}

export interface InAppPurchase {
  productId: string;
  purchaseToken?: string;
  transactionReceipt?: string;
  acknowledged: boolean;
  purchaseState: number;
  purchaseTime: number;
}

export interface PurchaseServiceState {
  products: IAPItemDetails[];
  isInitialized: boolean;
  purchaseHistory: InAppPurchase[];
}

class PurchaseService {
  private state: PurchaseServiceState = {
    products: [],
    isInitialized: false,
    purchaseHistory: [],
  };

  /**
   * Initialize the IAP connection
   * On web, this is a no-op (web uses Stripe instead)
   */
  async initialize(): Promise<void> {
    if (!isNative) {
      console.log('[PurchaseService] Web platform - IAP not available, use Stripe checkout');
      return;
    }

    if (this.state.isInitialized) {
      console.log('[PurchaseService] Already initialized');
      return;
    }

    // TODO: When building for native, install expo-in-app-purchases and implement:
    // - connectAsync()
    // - setPurchaseListener()
    // - getProductsAsync()
    console.log('[PurchaseService] Native IAP - implement with expo-in-app-purchases');
    this.state.isInitialized = true;
  }

  /**
   * Load available products
   */
  async loadProducts(): Promise<void> {
    if (!isNative) {
      console.log('[PurchaseService] Web platform - no products to load');
      return;
    }

    // TODO: Implement with expo-in-app-purchases getProductsAsync(PRODUCT_IDS)
    console.log('[PurchaseService] Loading products:', PRODUCT_IDS);
  }

  /**
   * Purchase a product or subscription
   * On web, throws an error - use Stripe checkout instead
   */
  async purchase(productId: string): Promise<void> {
    if (!isNative) {
      throw new Error('In-App Purchases not available on web. Use Stripe checkout.');
    }

    // TODO: Implement with expo-in-app-purchases purchaseItemAsync()
    console.log('[PurchaseService] Purchase requested for:', productId);
    throw new Error('Native IAP not yet implemented. Install expo-in-app-purchases.');
  }

  /**
   * Restore previous purchases
   */
  async restorePurchases(): Promise<InAppPurchase[]> {
    if (!isNative) {
      console.log('[PurchaseService] Web platform - cannot restore purchases');
      return [];
    }

    // TODO: Implement with expo-in-app-purchases getPurchaseHistoryAsync()
    console.log('[PurchaseService] Restore purchases requested');
    return [];
  }

  getProducts(): IAPItemDetails[] {
    return this.state.products;
  }

  isAvailable(): boolean {
    return isNative;
  }

  async disconnect(): Promise<void> {
    if (!isNative) return;
    
    // TODO: Implement with expo-in-app-purchases disconnectAsync()
    this.state.isInitialized = false;
    console.log('[PurchaseService] Disconnected');
  }

  // ============= BACKEND RECEIPT VERIFICATION =============

  /**
   * Get authorization headers with JWT token
   */
  private async getAuthHeaders(): Promise<HeadersInit> {
    const token = await authService.getAccessToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  /**
   * Verify Apple App Store receipt with backend
   * POST /api/iap/verify-receipt
   * 
   * @param receipt - Base64 encoded receipt data from StoreKit
   * @param productId - The product ID that was purchased
   * @returns Verification result with subscription status
   */
  async verifyAppleReceipt(receipt: string, productId: string): Promise<{
    valid: boolean;
    subscription?: {
      productId: string;
      expiresAt: string;
      isTrialPeriod: boolean;
      autoRenewing: boolean;
    };
    error?: string;
  }> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetchWithLogging(
        `${API_CONFIG.authUrl}/api/iap/verify-receipt`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({
            receipt,
            productId,
            platform: 'ios',
          }),
        }
      );

      const data = await response.json();
      
      if (!response.ok) {
        return {
          valid: false,
          error: data.error || 'Receipt verification failed',
        };
      }

      return data;
    } catch (error) {
      console.error('[PurchaseService] Apple receipt verification failed:', error);
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Verify Google Play purchase with backend
   * POST /api/google-play/verify-purchase
   * 
   * @param productId - The product ID (SKU) that was purchased
   * @param purchaseToken - The purchase token from Google Play
   * @returns Verification result with subscription status
   */
  async verifyGooglePlayPurchase(productId: string, purchaseToken: string): Promise<{
    valid: boolean;
    subscription?: {
      productId: string;
      expiresAt: string;
      autoRenewing: boolean;
      paymentState: number;
    };
    error?: string;
  }> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetchWithLogging(
        `${API_CONFIG.authUrl}/api/google-play/verify-purchase`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({
            productId,
            purchaseToken,
            platform: 'android',
          }),
        }
      );

      const data = await response.json();
      
      if (!response.ok) {
        return {
          valid: false,
          error: data.error || 'Purchase verification failed',
        };
      }

      return data;
    } catch (error) {
      console.error('[PurchaseService] Google Play verification failed:', error);
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Acknowledge Google Play purchase
   * POST /api/google-play/acknowledge
   * 
   * Required to prevent Google from automatically refunding after 3 days
   */
  async acknowledgeGooglePlayPurchase(productId: string, purchaseToken: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetchWithLogging(
        `${API_CONFIG.authUrl}/api/google-play/acknowledge`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({
            productId,
            purchaseToken,
          }),
        }
      );

      const data = await response.json();
      
      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Acknowledge failed',
        };
      }

      return { success: true };
    } catch (error) {
      console.error('[PurchaseService] Google Play acknowledge failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get Apple IAP subscription status
   * GET /api/iap/subscription
   */
  async getAppleSubscription(): Promise<{
    active: boolean;
    productId?: string;
    expiresAt?: string;
    autoRenewing?: boolean;
  } | null> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetchWithLogging(
        `${API_CONFIG.authUrl}/api/iap/subscription`,
        {
          method: 'GET',
          headers,
        }
      );

      if (!response.ok) {
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('[PurchaseService] Failed to get Apple subscription:', error);
      return null;
    }
  }

  /**
   * Get Google Play subscription status
   * GET /api/google-play/subscription
   */
  async getGooglePlaySubscription(): Promise<{
    active: boolean;
    productId?: string;
    expiresAt?: string;
    autoRenewing?: boolean;
  } | null> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetchWithLogging(
        `${API_CONFIG.authUrl}/api/google-play/subscription`,
        {
          method: 'GET',
          headers,
        }
      );

      if (!response.ok) {
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('[PurchaseService] Failed to get Google Play subscription:', error);
      return null;
    }
  }

  /**
   * Get active subscription from any source (IAP, Google Play, or Stripe)
   * GET /api/subscriptions/active
   * 
   * Unified endpoint that checks all payment sources
   */
  async getActiveSubscription(): Promise<{
    active: boolean;
    source: 'apple_iap' | 'google_play' | 'stripe' | 'none';
    subscription?: {
      productId?: string;
      planId?: string;
      expiresAt?: string;
      autoRenewing?: boolean;
      status?: string;
    };
  }> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetchWithLogging(
        `${API_CONFIG.authUrl}/api/subscriptions/active`,
        {
          method: 'GET',
          headers,
        }
      );

      if (!response.ok) {
        return { active: false, source: 'none' };
      }

      return await response.json();
    } catch (error) {
      console.error('[PurchaseService] Failed to get active subscription:', error);
      return { active: false, source: 'none' };
    }
  }

  /**
   * Verify purchase based on platform
   * Convenience method that routes to the correct verification
   */
  async verifyPurchase(purchase: InAppPurchase): Promise<{
    valid: boolean;
    error?: string;
  }> {
    if (Platform.OS === 'ios' && purchase.transactionReceipt) {
      return this.verifyAppleReceipt(purchase.transactionReceipt, purchase.productId);
    } else if (Platform.OS === 'android' && purchase.purchaseToken) {
      const result = await this.verifyGooglePlayPurchase(purchase.productId, purchase.purchaseToken);
      
      // Acknowledge if valid
      if (result.valid && purchase.purchaseToken) {
        await this.acknowledgeGooglePlayPurchase(purchase.productId, purchase.purchaseToken);
      }
      
      return result;
    }
    
    return { valid: false, error: 'No valid receipt or token' };
  }
}

export const purchaseService = new PurchaseService();
