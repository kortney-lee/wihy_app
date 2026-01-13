import { Platform } from 'react-native';
import * as InAppPurchases from 'expo-in-app-purchases';

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
}) || [];

export interface PurchaseServiceState {
  products: InAppPurchases.IAPItemDetails[];
  isInitialized: boolean;
  purchaseHistory: InAppPurchases.InAppPurchase[];
}

class PurchaseService {
  private state: PurchaseServiceState = {
    products: [],
    isInitialized: false,
    purchaseHistory: [],
  };

  private purchaseListenerSet = false;

  /**
   * Initialize the IAP connection and set up listener
   */
  async initialize(): Promise<void> {
    if (this.state.isInitialized) {
      console.log('[PurchaseService] Already initialized');
      return;
    }

    try {
      await InAppPurchases.connectAsync();

      this.setPurchaseListener();
      this.state.isInitialized = true;
      await this.loadProducts();
      console.log('[PurchaseService] Connection initialized');
    } catch (error) {
      console.error('[PurchaseService] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Register purchase listener (only once)
   */
  private setPurchaseListener() {
    if (this.purchaseListenerSet) return;

    InAppPurchases.setPurchaseListener(async ({ responseCode, results }) => {
      if (responseCode !== InAppPurchases.IAPResponseCode.OK || !results) {
        return;
      }

      for (const purchase of results) {
        try {
          // Verify purchase with backend
          await this.verifyPurchase(purchase);

          // Finish transaction
          await InAppPurchases.finishTransactionAsync(purchase, true);
          console.log('[PurchaseService] Transaction finished:', purchase.productId);
        } catch (err) {
          console.error('[PurchaseService] Purchase handling failed:', err);
        }
      }
    });

    this.purchaseListenerSet = true;
  }

  /**
   * Load available products
   */
  async loadProducts(): Promise<void> {
    try {
      const { results } = await InAppPurchases.getProductsAsync(PRODUCT_IDS);
      this.state.products = results || [];
      console.log('[PurchaseService] Products loaded:', this.state.products.length);
    } catch (error) {
      console.error('[PurchaseService] Failed to load products:', error);
      throw error;
    }
  }

  /**
   * Purchase a product or subscription
   */
  async purchase(productId: string): Promise<void> {
    try {
      await InAppPurchases.purchaseItemAsync(productId);
      console.log('[PurchaseService] Purchase requested for:', productId);
    } catch (error) {
      console.error('[PurchaseService] Purchase failed:', error);
      throw error;
    }
  }

  /**
   * Restore previous purchases
   */
  async restorePurchases(): Promise<InAppPurchases.InAppPurchase[]> {
    try {
      const { results } = await InAppPurchases.getPurchaseHistoryAsync();
      this.state.purchaseHistory = results || [];
      return this.state.purchaseHistory;
    } catch (error) {
      console.error('[PurchaseService] Restore failed:', error);
      throw error;
    }
  }

  /**
   * Verify purchase with backend
   * IMPORTANT: Implement actual server-side verification
   */
  private async verifyPurchase(purchase: InAppPurchases.InAppPurchase): Promise<boolean> {
    try {
      // TODO: Replace mock with backend verification
      // await fetch('https://services.wihy.ai/api/verify-purchase', { ... })
      console.log('[PurchaseService] Purchase verification (mock):', purchase.productId);
      return true;
    } catch (error) {
      console.error('[PurchaseService] Verification error:', error);
      throw error;
    }
  }

  getProducts(): InAppPurchases.IAPItemDetails[] {
    return this.state.products;
  }

  async disconnect(): Promise<void> {
    await InAppPurchases.disconnectAsync();
    this.state.isInitialized = false;
    console.log('[PurchaseService] Disconnected');
  }
}

export const purchaseService = new PurchaseService();
