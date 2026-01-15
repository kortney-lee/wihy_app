import { Platform } from 'react-native';

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
}

export const purchaseService = new PurchaseService();
