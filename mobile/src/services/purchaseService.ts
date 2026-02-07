import { Platform, Alert } from 'react-native';
import { API_CONFIG } from './config';
import { fetchWithLogging } from '../utils/apiLogger';
import { authService } from './authService';

// In-App Purchases only work on native platforms (iOS/Android)
// Web uses Stripe checkout instead - this service is a no-op on web
const isNative = Platform.OS === 'ios' || Platform.OS === 'android';

// Conditionally import InAppPurchases only on native platforms
// This prevents "Cannot find native module 'ExpoInAppPurchases'" error on web/simulator
let InAppPurchases: typeof import('expo-in-app-purchases') | null = null;
if (isNative) {
  try {
    InAppPurchases = require('expo-in-app-purchases');
  } catch (e) {
    console.warn('[PurchaseService] expo-in-app-purchases not available:', e);
  }
}

// Payment service base URL for IAP verification
const PAYMENT_BASE_URL = API_CONFIG.paymentUrl || 'https://payment.wihy.ai';

// ============= APPLE APP STORE PRODUCT IDS =============
// These must match exactly what you create in App Store Connect
// Path: App Store Connect > Your App > Features > In-App Purchases
export const APPLE_PRODUCT_IDS = {
  // Auto-Renewable Subscriptions
  PREMIUM_MONTHLY: 'com.wihy.ai.app.premium_monthly',
  PREMIUM_YEARLY: 'com.wihy.ai.app.premium_yearly',
  FAMILY_BASIC_MONTHLY: 'com.wihy.ai.app.family_basic_monthly',
  FAMILY_BASIC_YEARLY: 'com.wihy.ai.app.family_basic_yearly',
  FAMILY_PRO_MONTHLY: 'com.wihy.ai.app.family_pro_monthly',
  FAMILY_PRO_YEARLY: 'com.wihy.ai.app.family_pro_yearly',
  COACH_MONTHLY: 'com.wihy.ai.app.coach_monthly',
  COACH_YEARLY: 'com.wihy.ai.app.coach_yearly',
  // Add-ons
  WIHY_COACH_AI: 'com.wihy.ai.app.coach_ai_addon',
  // Consumables (if any)
  NUTRITION_ANALYSIS: 'com.wihy.ai.app.nutrition_analysis',
};

// Map plan IDs from the app to Apple product IDs
export const PLAN_TO_APPLE_PRODUCT: Record<string, { monthly?: string; yearly?: string }> = {
  'premium': {
    monthly: APPLE_PRODUCT_IDS.PREMIUM_MONTHLY,
    yearly: APPLE_PRODUCT_IDS.PREMIUM_YEARLY,
  },
  'pro_monthly': {
    monthly: APPLE_PRODUCT_IDS.PREMIUM_MONTHLY,
  },
  'pro_yearly': {
    yearly: APPLE_PRODUCT_IDS.PREMIUM_YEARLY,
  },
  'family-basic': {
    monthly: APPLE_PRODUCT_IDS.FAMILY_BASIC_MONTHLY,
    yearly: APPLE_PRODUCT_IDS.FAMILY_BASIC_YEARLY,
  },
  'family_basic': {
    monthly: APPLE_PRODUCT_IDS.FAMILY_BASIC_MONTHLY,
    yearly: APPLE_PRODUCT_IDS.FAMILY_BASIC_YEARLY,
  },
  'family-pro': {
    monthly: APPLE_PRODUCT_IDS.FAMILY_PRO_MONTHLY,
    yearly: APPLE_PRODUCT_IDS.FAMILY_PRO_YEARLY,
  },
  'family_pro': {
    monthly: APPLE_PRODUCT_IDS.FAMILY_PRO_MONTHLY,
    yearly: APPLE_PRODUCT_IDS.FAMILY_PRO_YEARLY,
  },
  'coach': {
    monthly: APPLE_PRODUCT_IDS.COACH_MONTHLY,
    yearly: APPLE_PRODUCT_IDS.COACH_YEARLY,
  },
};

// All product IDs for fetching from store
const PRODUCT_IDS = Platform.select({
  ios: Object.values(APPLE_PRODUCT_IDS),
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

// Purchase result callback type
type PurchaseResultCallback = (result: {
  success: boolean;
  productId?: string;
  error?: string;
}) => void;

class PurchaseService {
  private state: PurchaseServiceState = {
    products: [],
    isInitialized: false,
    purchaseHistory: [],
  };

  private purchaseResultCallback: PurchaseResultCallback | null = null;

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

    try {
      console.log('[PurchaseService] Connecting to store...');
      if (!InAppPurchases) {
        throw new Error('InAppPurchases module not available');
      }
      await InAppPurchases.connectAsync();
      
      // Set up purchase listener to handle transaction updates
      InAppPurchases.setPurchaseListener(async ({ responseCode, results, errorCode }) => {
        console.log('[PurchaseService] Purchase listener triggered:', { responseCode, errorCode });
        
        if (responseCode === InAppPurchases.IAPResponseCode.OK && results) {
          for (const purchase of results) {
            console.log('[PurchaseService] Processing purchase:', purchase.productId);
            
            if (!purchase.acknowledged) {
              // Verify with backend
              const verification = await this.verifyPurchase({
                productId: purchase.productId,
                transactionReceipt: purchase.transactionReceipt,
                purchaseToken: purchase.purchaseToken,
                acknowledged: purchase.acknowledged,
                purchaseState: purchase.purchaseState,
                purchaseTime: purchase.purchaseTime,
              });
              
              if (verification.valid) {
                // Finish the transaction (acknowledge)
                await InAppPurchases!.finishTransactionAsync(purchase, true);
                console.log('[PurchaseService] Purchase completed and acknowledged:', purchase.productId);
                
                // Notify callback
                if (this.purchaseResultCallback) {
                  this.purchaseResultCallback({ success: true, productId: purchase.productId });
                }
              } else {
                console.error('[PurchaseService] Purchase verification failed:', verification.error);
                if (this.purchaseResultCallback) {
                  this.purchaseResultCallback({ 
                    success: false, 
                    productId: purchase.productId, 
                    error: verification.error 
                  });
                }
              }
            }
          }
        } else if (responseCode === InAppPurchases!.IAPResponseCode.USER_CANCELED) {
          console.log('[PurchaseService] User cancelled purchase');
          if (this.purchaseResultCallback) {
            this.purchaseResultCallback({ success: false, error: 'Purchase cancelled' });
          }
        } else {
          console.error('[PurchaseService] Purchase error:', errorCode);
          if (this.purchaseResultCallback) {
            this.purchaseResultCallback({ 
              success: false, 
              error: `Purchase failed with error code: ${errorCode}` 
            });
          }
        }
      });

      this.state.isInitialized = true;
      console.log('[PurchaseService] IAP initialized successfully');
      
      // Load products after initialization
      await this.loadProducts();
    } catch (error) {
      console.error('[PurchaseService] Failed to initialize IAP:', error);
      throw error;
    }
  }

  /**
   * Load available products from the store
   */
  async loadProducts(): Promise<IAPItemDetails[]> {
    if (!isNative) {
      console.log('[PurchaseService] Web platform - no products to load');
      return [];
    }

    if (!this.state.isInitialized) {
      console.log('[PurchaseService] Not initialized, initializing first...');
      await this.initialize();
    }

    try {
      console.log('[PurchaseService] Loading products:', PRODUCT_IDS);
      if (!InAppPurchases) {
        throw new Error('InAppPurchases module not available');
      }
      const { responseCode, results } = await InAppPurchases.getProductsAsync(PRODUCT_IDS);
      
      if (responseCode === InAppPurchases.IAPResponseCode.OK && results) {
        this.state.products = results;
        console.log('[PurchaseService] Loaded products:', results.map(p => p.productId));
        return results;
      } else {
        console.warn('[PurchaseService] Failed to load products, responseCode:', responseCode);
        return [];
      }
    } catch (error) {
      console.error('[PurchaseService] Error loading products:', error);
      return [];
    }
  }

  /**
   * Get product by ID
   */
  getProductById(productId: string): IAPItemDetails | undefined {
    return this.state.products.find(p => p.productId === productId);
  }

  /**
   * Get Apple product ID for a plan
   */
  getAppleProductId(planId: string, yearly: boolean = false): string | undefined {
    const mapping = PLAN_TO_APPLE_PRODUCT[planId];
    if (!mapping) return undefined;
    return yearly ? mapping.yearly : mapping.monthly;
  }

  /**
   * Purchase a product or subscription
   * On web, throws an error - use Stripe checkout instead
   */
  async purchase(productId: string): Promise<{ success: boolean; error?: string }> {
    if (!isNative) {
      throw new Error('In-App Purchases not available on web. Use Stripe checkout.');
    }

    if (!this.state.isInitialized) {
      await this.initialize();
    }

    return new Promise(async (resolve) => {
      try {
        console.log('[PurchaseService] Starting purchase for:', productId);
        
        // Set up callback for purchase result
        this.purchaseResultCallback = (result) => {
          this.purchaseResultCallback = null;
          resolve(result);
        };
        
        // Start the purchase
        if (!InAppPurchases) {
          throw new Error('InAppPurchases module not available');
        }
        await InAppPurchases.purchaseItemAsync(productId);
        
        // Note: The result will come through the purchase listener
      } catch (error) {
        console.error('[PurchaseService] Purchase error:', error);
        this.purchaseResultCallback = null;
        resolve({ 
          success: false, 
          error: error instanceof Error ? error.message : 'Purchase failed' 
        });
      }
    });
  }

  /**
   * Purchase by plan ID (convenience method)
   */
  async purchaseByPlanId(planId: string, yearly: boolean = false): Promise<{ success: boolean; error?: string }> {
    const productId = this.getAppleProductId(planId, yearly);
    if (!productId) {
      return { success: false, error: `No product ID found for plan: ${planId}` };
    }
    return this.purchase(productId);
  }

  /**
   * Restore previous purchases
   */
  async restorePurchases(): Promise<InAppPurchase[]> {
    if (!isNative) {
      console.log('[PurchaseService] Web platform - cannot restore purchases');
      return [];
    }

    if (!this.state.isInitialized) {
      await this.initialize();
    }

    try {
      console.log('[PurchaseService] Restoring purchases...');
      if (!InAppPurchases) {
        throw new Error('InAppPurchases module not available');
      }
      const { responseCode, results } = await InAppPurchases.getPurchaseHistoryAsync();
      
      if (responseCode === InAppPurchases.IAPResponseCode.OK && results) {
        this.state.purchaseHistory = results;
        console.log('[PurchaseService] Restored purchases:', results.length);
        
        // Verify each restored purchase with backend
        for (const purchase of results) {
          await this.verifyPurchase({
            productId: purchase.productId,
            transactionReceipt: purchase.transactionReceipt,
            purchaseToken: purchase.purchaseToken,
            acknowledged: purchase.acknowledged,
            purchaseState: purchase.purchaseState,
            purchaseTime: purchase.purchaseTime,
          });
        }
        
        return results;
      } else {
        console.warn('[PurchaseService] Failed to restore purchases, responseCode:', responseCode);
        return [];
      }
    } catch (error) {
      console.error('[PurchaseService] Error restoring purchases:', error);
      return [];
    }
  }

  getProducts(): IAPItemDetails[] {
    return this.state.products;
  }

  isAvailable(): boolean {
    return isNative;
  }

  isInitialized(): boolean {
    return this.state.isInitialized;
  }

  async disconnect(): Promise<void> {
    if (!isNative || !InAppPurchases) return;
    
    try {
      await InAppPurchases.disconnectAsync();
      this.state.isInitialized = false;
      this.state.products = [];
      console.log('[PurchaseService] Disconnected');
    } catch (error) {
      console.error('[PurchaseService] Error disconnecting:', error);
    }
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
        `${PAYMENT_BASE_URL}/api/iap/verify-receipt`,
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
        `${PAYMENT_BASE_URL}/api/google-play/verify-purchase`,
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
        `${PAYMENT_BASE_URL}/api/google-play/acknowledge`,
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
        `${PAYMENT_BASE_URL}/api/iap/subscription`,
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
        `${PAYMENT_BASE_URL}/api/google-play/subscription`,
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
        `${PAYMENT_BASE_URL}/api/subscriptions/active`,
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
