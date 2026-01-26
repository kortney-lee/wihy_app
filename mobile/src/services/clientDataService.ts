/**
 * Client Data Service
 * 
 * Flexible key-value storage for client-side data including links, 
 * feature flags, cached values, session data, and preferences.
 * 
 * Base URL: https://user.wihy.ai/api/client-data
 * 
 * @see docs/WIHY_CLIENT_DATA_API.md for full API documentation
 */

import { userApi } from './userApiClient';
import { storageService } from './storage/storageService';

// ============================================
// TYPES
// ============================================

export type ClientDataNamespace = 
  | 'links' 
  | 'features' 
  | 'cache' 
  | 'preferences' 
  | 'social' 
  | 'widgets' 
  | 'session';

export interface ClientDataResponse<T = Record<string, any>> {
  success: boolean;
  data: T;
  meta?: {
    keysUpdated?: number;
  };
}

export interface ClientDataAllResponse {
  success: boolean;
  data: {
    links?: Record<string, string>;
    features?: Record<string, any>;
    cache?: Record<string, any>;
    preferences?: Record<string, any>;
    social?: Record<string, any>;
    widgets?: Record<string, any>;
    session?: SessionData;
  };
}

export interface UserLinks {
  referral_link?: string;
  share_profile_url?: string;
  invite_url?: string;
  deep_link_prefix?: string;
  custom_share_url?: string;
  avatar_url?: string;
}

export interface FeatureFlags {
  beta_features?: boolean;
  experimental_ui?: boolean;
  a_b_test_group?: string;
  [key: string]: any;
}

export interface SessionData {
  instacart_url?: string;
  instacart_urls?: Record<string, string>;
  active_meal_plan_id?: string;
  checkout_cart?: any;
  pending_actions?: any[];
  last_screen?: string;
  [key: string]: any;
}

export interface UserPreferences {
  home_widgets?: string[];
  dashboard_layout?: 'compact' | 'expanded';
  theme?: 'light' | 'dark' | 'system';
  quick_actions?: string[];
  [key: string]: any;
}

export interface SetValueOptions {
  expiresAt?: Date;
  platform?: 'ios' | 'android' | 'web';
}

// ============================================
// LOCAL CACHE KEYS
// ============================================

const CACHE_KEYS = {
  ALL_DATA: 'client_data_all',
  LINKS: 'client_data_links',
  FEATURES: 'client_data_features',
  SESSION: 'client_data_session',
  PREFERENCES: 'client_data_preferences',
};

const CACHE_TTL_MINUTES = 60; // 1 hour default cache

// ============================================
// CLIENT DATA SERVICE
// ============================================

class ClientDataService {
  private static instance: ClientDataService;
  private localCache: Record<string, any> = {};

  private constructor() {}

  static getInstance(): ClientDataService {
    if (!ClientDataService.instance) {
      ClientDataService.instance = new ClientDataService();
    }
    return ClientDataService.instance;
  }

  // ============================================
  // LOAD ALL DATA (APP STARTUP)
  // ============================================

  /**
   * Load all client data for the user.
   * Call this on app startup to get links, features, preferences, session in one call.
   */
  async loadAllData(): Promise<ClientDataAllResponse['data']> {
    try {
      const response = await userApi.get<ClientDataAllResponse>('/api/client-data');
      
      if (response.success && response.data) {
        // Cache locally
        this.localCache = response.data;
        await storageService.setCachedWithExpiry(CACHE_KEYS.ALL_DATA, response.data, CACHE_TTL_MINUTES);
        return response.data;
      }
      
      return {};
    } catch (error) {
      console.error('[ClientDataService] loadAllData failed:', error);
      
      // Try to return cached data
      const cached = await storageService.getCachedWithExpiry<ClientDataAllResponse['data']>(CACHE_KEYS.ALL_DATA);
      if (cached?.data) {
        this.localCache = cached.data;
        return cached.data;
      }
      
      return {};
    }
  }

  // ============================================
  // NAMESPACE OPERATIONS
  // ============================================

  /**
   * Get all data for a specific namespace
   */
  async getNamespace<T = Record<string, any>>(namespace: ClientDataNamespace): Promise<T> {
    try {
      const response = await userApi.get<ClientDataResponse<T>>(`/api/client-data/${namespace}`);
      
      if (response.success) {
        // Update local cache
        this.localCache[namespace] = response.data;
        return response.data;
      }
      
      return {} as T;
    } catch (error) {
      console.error(`[ClientDataService] getNamespace(${namespace}) failed:`, error);
      
      // Return from local cache if available
      if (this.localCache[namespace]) {
        return this.localCache[namespace] as T;
      }
      
      return {} as T;
    }
  }

  /**
   * Set multiple values in a namespace at once
   */
  async setNamespace<T = Record<string, any>>(
    namespace: ClientDataNamespace, 
    values: T
  ): Promise<T> {
    try {
      const response = await userApi.put<ClientDataResponse<T>>(`/api/client-data/${namespace}`, values);
      
      if (response.success) {
        // Update local cache
        this.localCache[namespace] = response.data;
        return response.data;
      }
      
      return values;
    } catch (error) {
      console.error(`[ClientDataService] setNamespace(${namespace}) failed:`, error);
      throw error;
    }
  }

  /**
   * Delete all keys in a namespace
   */
  async deleteNamespace(namespace: ClientDataNamespace): Promise<void> {
    try {
      await userApi.delete(`/api/client-data/${namespace}`);
      
      // Clear from local cache
      delete this.localCache[namespace];
    } catch (error) {
      console.error(`[ClientDataService] deleteNamespace(${namespace}) failed:`, error);
      throw error;
    }
  }

  // ============================================
  // KEY-VALUE OPERATIONS
  // ============================================

  /**
   * Get a specific key value
   */
  async getValue<T = any>(namespace: ClientDataNamespace, key: string): Promise<T | null> {
    try {
      const response = await userApi.get<ClientDataResponse<Record<string, T>>>(`/api/client-data/${namespace}/${key}`);
      
      if (response.success && response.data) {
        return response.data[key] ?? null;
      }
      
      return null;
    } catch (error: any) {
      // 404 means key doesn't exist - return null
      if (error.message?.includes('404') || error.message?.includes('not found')) {
        return null;
      }
      
      console.error(`[ClientDataService] getValue(${namespace}/${key}) failed:`, error);
      
      // Try local cache
      if (this.localCache[namespace]?.[key] !== undefined) {
        return this.localCache[namespace][key] as T;
      }
      
      return null;
    }
  }

  /**
   * Set a specific key value
   */
  async setValue<T = any>(
    namespace: ClientDataNamespace, 
    key: string, 
    value: T,
    options?: SetValueOptions
  ): Promise<void> {
    try {
      const body: any = { value };
      
      if (options?.expiresAt) {
        body.expiresAt = options.expiresAt.toISOString();
      }
      
      if (options?.platform) {
        body.platform = options.platform;
      }
      
      await userApi.put(`/api/client-data/${namespace}/${key}`, body);
      
      // Update local cache
      if (!this.localCache[namespace]) {
        this.localCache[namespace] = {};
      }
      this.localCache[namespace][key] = value;
    } catch (error) {
      console.error(`[ClientDataService] setValue(${namespace}/${key}) failed:`, error);
      throw error;
    }
  }

  /**
   * Delete a specific key
   */
  async deleteValue(namespace: ClientDataNamespace, key: string): Promise<void> {
    try {
      await userApi.delete(`/api/client-data/${namespace}/${key}`);
      
      // Remove from local cache
      if (this.localCache[namespace]) {
        delete this.localCache[namespace][key];
      }
    } catch (error) {
      console.error(`[ClientDataService] deleteValue(${namespace}/${key}) failed:`, error);
      throw error;
    }
  }

  // ============================================
  // LINKS (SPECIAL ENDPOINTS)
  // ============================================

  /**
   * Get all user links. Auto-generates if none exist.
   */
  async getLinks(): Promise<UserLinks> {
    try {
      const response = await userApi.get<ClientDataResponse<UserLinks>>('/api/client-data/links');
      
      if (response.success) {
        this.localCache.links = response.data;
        return response.data;
      }
      
      return {};
    } catch (error) {
      console.error('[ClientDataService] getLinks failed:', error);
      return this.localCache.links || {};
    }
  }

  /**
   * Update user links
   */
  async updateLinks(links: Partial<UserLinks>): Promise<UserLinks> {
    try {
      const response = await userApi.put<ClientDataResponse<UserLinks>>('/api/client-data/links', links);
      
      if (response.success) {
        this.localCache.links = response.data;
        return response.data;
      }
      
      return links as UserLinks;
    } catch (error) {
      console.error('[ClientDataService] updateLinks failed:', error);
      throw error;
    }
  }

  /**
   * Generate standard user links
   */
  async generateLinks(userCode?: string): Promise<UserLinks> {
    try {
      const response = await userApi.post<ClientDataResponse<UserLinks>>(
        '/api/client-data/links/generate',
        userCode ? { userCode } : undefined
      );
      
      if (response.success) {
        this.localCache.links = response.data;
        return response.data;
      }
      
      return {};
    } catch (error) {
      console.error('[ClientDataService] generateLinks failed:', error);
      throw error;
    }
  }

  // ============================================
  // FEATURES (FEATURE FLAGS)
  // ============================================

  /**
   * Get feature flags for the user
   */
  async getFeatures(platform?: 'ios' | 'android' | 'web'): Promise<FeatureFlags> {
    try {
      const params = platform ? { platform } : undefined;
      const response = await userApi.get<ClientDataResponse<FeatureFlags>>(
        '/api/client-data/features',
        params
      );
      
      if (response.success) {
        this.localCache.features = response.data;
        return response.data;
      }
      
      return {};
    } catch (error) {
      console.error('[ClientDataService] getFeatures failed:', error);
      return this.localCache.features || {};
    }
  }

  /**
   * Update feature flags
   */
  async updateFeatures(features: Partial<FeatureFlags>): Promise<FeatureFlags> {
    try {
      const response = await userApi.put<ClientDataResponse<FeatureFlags>>('/api/client-data/features', features);
      
      if (response.success) {
        this.localCache.features = response.data;
        return response.data;
      }
      
      return features as FeatureFlags;
    } catch (error) {
      console.error('[ClientDataService] updateFeatures failed:', error);
      throw error;
    }
  }

  /**
   * Check if a specific feature is enabled
   */
  async isFeatureEnabled(featureKey: string): Promise<boolean> {
    const features = await this.getFeatures();
    return features[featureKey] === true;
  }

  // ============================================
  // SESSION (INSTACART, ACTIVE STATE)
  // ============================================

  /**
   * Get session data
   */
  async getSession(): Promise<SessionData> {
    return this.getNamespace<SessionData>('session');
  }

  /**
   * Update session data (batch)
   */
  async updateSession(data: Partial<SessionData>): Promise<SessionData> {
    return this.setNamespace<SessionData>('session', data as SessionData);
  }

  /**
   * Save Instacart URL to session
   * @param url The Instacart shopping list URL
   * @param planId Optional meal plan ID to associate the URL with
   */
  async saveInstacartUrl(url: string, planId?: string): Promise<void> {
    // Save as current URL with 24h expiry
    await this.setValue('session', 'instacart_url', url, {
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    });
    
    // Also save by plan ID if provided
    if (planId) {
      const existingUrls = await this.getValue<Record<string, string>>('session', 'instacart_urls') || {};
      existingUrls[planId] = url;
      
      await this.setValue('session', 'instacart_urls', existingUrls, {
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      });
    }
  }

  /**
   * Get Instacart URL (current or by plan ID)
   * @param planId Optional plan ID to get specific URL
   */
  async getInstacartUrl(planId?: string): Promise<string | null> {
    if (planId) {
      const urls = await this.getValue<Record<string, string>>('session', 'instacart_urls');
      return urls?.[planId] || null;
    }
    
    return this.getValue<string>('session', 'instacart_url');
  }

  /**
   * Set active meal plan ID
   */
  async setActiveMealPlan(planId: string): Promise<void> {
    await this.setValue('session', 'active_meal_plan_id', planId);
  }

  /**
   * Get active meal plan ID
   */
  async getActiveMealPlan(): Promise<string | null> {
    return this.getValue<string>('session', 'active_meal_plan_id');
  }

  /**
   * Save last visited screen for resume
   */
  async setLastScreen(screenName: string): Promise<void> {
    await this.setValue('session', 'last_screen', screenName, {
      expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
    });
  }

  /**
   * Get last visited screen
   */
  async getLastScreen(): Promise<string | null> {
    return this.getValue<string>('session', 'last_screen');
  }

  // ============================================
  // PREFERENCES
  // ============================================

  /**
   * Get user preferences
   */
  async getPreferences(): Promise<UserPreferences> {
    return this.getNamespace<UserPreferences>('preferences');
  }

  /**
   * Update user preferences (batch)
   */
  async updatePreferences(prefs: Partial<UserPreferences>): Promise<UserPreferences> {
    return this.setNamespace<UserPreferences>('preferences', prefs as UserPreferences);
  }

  /**
   * Get a specific preference
   */
  async getPreference<T = any>(key: string, defaultValue?: T): Promise<T> {
    const value = await this.getValue<T>('preferences', key);
    return value ?? defaultValue ?? (null as T);
  }

  /**
   * Set a specific preference
   */
  async setPreference<T = any>(key: string, value: T): Promise<void> {
    await this.setValue('preferences', key, value);
  }

  // ============================================
  // CACHE OPERATIONS
  // ============================================

  /**
   * Set a cached value with expiration
   */
  async setCached<T = any>(key: string, value: T, expiresInMinutes: number = 60): Promise<void> {
    await this.setValue('cache', key, value, {
      expiresAt: new Date(Date.now() + expiresInMinutes * 60 * 1000),
    });
  }

  /**
   * Get a cached value
   */
  async getCached<T = any>(key: string): Promise<T | null> {
    return this.getValue<T>('cache', key);
  }

  /**
   * Clear all cached data
   */
  async clearCache(): Promise<void> {
    await this.deleteNamespace('cache');
  }

  // ============================================
  // LOCAL CACHE HELPERS
  // ============================================

  /**
   * Get data from local memory cache (no API call)
   */
  getFromLocalCache<T = any>(namespace: ClientDataNamespace, key?: string): T | null {
    if (key) {
      return this.localCache[namespace]?.[key] ?? null;
    }
    return this.localCache[namespace] ?? null;
  }

  /**
   * Clear local memory cache
   */
  clearLocalCache(): void {
    this.localCache = {};
  }
}

// Export singleton instance
export const clientDataService = ClientDataService.getInstance();

export default clientDataService;
