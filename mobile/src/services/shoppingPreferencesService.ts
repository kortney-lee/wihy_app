/**
 * Shopping Preferences Service
 * 
 * Client-side service for managing user shopping preferences including
 * preferred stores, budget settings, organic preferences, brand choices,
 * and delivery options.
 * 
 * Connects to user.wihy.ai for shopping preferences management.
 * 
 * API Documentation: docs/SHOPPING_PREFERENCES_API.md
 */

import { userApi } from './userApiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ============= TYPES =============

export type BudgetPreference = 'budget' | 'moderate' | 'premium';
export type OrganicPreference = 'always' | 'when_possible' | 'never';
export type DeliveryPreference = 'asap' | 'scheduled' | 'pickup';

export type PreferredStore = 
  | 'costco'
  | 'trader_joes'
  | 'whole_foods'
  | 'safeway'
  | 'kroger'
  | 'walmart'
  | 'target'
  | 'aldi'
  | 'sprouts'
  | string; // Allow custom stores

export interface BrandPreferences {
  [category: string]: string;
  // Common categories:
  // chicken?: string;
  // milk?: string;
  // bread?: string;
  // yogurt?: string;
  // eggs?: string;
}

export interface ShoppingPreferences {
  user_id: string;
  preferred_stores: string[];
  budget_preference: BudgetPreference;
  organic_preference: OrganicPreference;
  brand_preferences: BrandPreferences;
  default_postal_code: string | null;
  delivery_preference: DeliveryPreference;
  updated_at?: string;
  created_at?: string;
}

export interface SavePreferencesRequest {
  userId: string;
  preferred_stores?: string[];
  budget_preference?: BudgetPreference;
  organic_preference?: OrganicPreference;
  brand_preferences?: BrandPreferences;
  default_postal_code?: string | null;
  delivery_preference?: DeliveryPreference;
}

export interface ShoppingPreferencesResponse {
  success: boolean;
  preferences: ShoppingPreferences;
}

export interface SavePreferencesResponse {
  success: boolean;
  message: string;
  preferences: ShoppingPreferences;
}

export interface DeletePreferencesResponse {
  success: boolean;
  message: string;
}

// ============= CONSTANTS =============

const CACHE_KEY = '@shopping_preferences';
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes (preferences don't change often)

// Default preferences when none exist
const DEFAULT_PREFERENCES: Omit<ShoppingPreferences, 'user_id'> = {
  preferred_stores: [],
  budget_preference: 'moderate',
  organic_preference: 'when_possible',
  brand_preferences: {},
  default_postal_code: null,
  delivery_preference: 'asap',
};

// ============= SERVICE IMPLEMENTATION =============

class ShoppingPreferencesService {
  private cache: Map<string, { data: ShoppingPreferences; timestamp: number }> = new Map();

  /**
   * Get shopping preferences for a user
   * Returns cached data if available and fresh, otherwise fetches from API.
   * Returns default preferences if none exist.
   * 
   * @param userId - User ID
   * @param forceRefresh - Skip cache and fetch fresh data
   * @returns Shopping preferences
   */
  async getPreferences(userId: string, forceRefresh: boolean = false): Promise<ShoppingPreferences> {
    try {
      // Check cache first unless force refresh
      if (!forceRefresh) {
        const cached = this.cache.get(userId);
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
          console.log('[ShoppingPreferencesService] Returning cached preferences');
          return cached.data;
        }
      }

      // Fetch from API
      console.log('[ShoppingPreferencesService] Fetching preferences from API');
      const response = await userApi.get<ShoppingPreferencesResponse>(
        `/api/users/shopping-preferences/${userId}`
      );

      const preferences = response.preferences;

      // Update cache
      this.cache.set(userId, {
        data: preferences,
        timestamp: Date.now(),
      });

      // Update AsyncStorage cache
      await AsyncStorage.setItem(
        `${CACHE_KEY}_${userId}`,
        JSON.stringify(preferences)
      );

      return preferences;
    } catch (error: any) {
      console.error('[ShoppingPreferencesService] Error fetching preferences:', error);

      // Try to return cached data from AsyncStorage on error
      try {
        const cachedData = await AsyncStorage.getItem(`${CACHE_KEY}_${userId}`);
        if (cachedData) {
          console.log('[ShoppingPreferencesService] Returning AsyncStorage cache on error');
          return JSON.parse(cachedData);
        }
      } catch (cacheError) {
        console.error('[ShoppingPreferencesService] Cache retrieval failed:', cacheError);
      }

      // Return default preferences if all else fails
      console.log('[ShoppingPreferencesService] Returning default preferences');
      return {
        user_id: userId,
        ...DEFAULT_PREFERENCES,
      };
    }
  }

  /**
   * Save or update shopping preferences
   * All fields except userId are optional - send only what you want to update.
   * 
   * @param request - Preferences to save
   * @returns Updated preferences
   */
  async savePreferences(request: SavePreferencesRequest): Promise<ShoppingPreferences> {
    try {
      const response = await userApi.post<SavePreferencesResponse>(
        '/api/users/shopping-preferences',
        request
      );

      const preferences = response.preferences;

      // Update cache
      this.cache.set(request.userId, {
        data: preferences,
        timestamp: Date.now(),
      });

      // Update AsyncStorage cache
      await AsyncStorage.setItem(
        `${CACHE_KEY}_${request.userId}`,
        JSON.stringify(preferences)
      );

      console.log('[ShoppingPreferencesService] Preferences saved successfully');
      return preferences;
    } catch (error) {
      console.error('[ShoppingPreferencesService] Error saving preferences:', error);
      throw error;
    }
  }

  /**
   * Delete shopping preferences for a user
   * User will revert to default preferences.
   * 
   * @param userId - User ID
   */
  async deletePreferences(userId: string): Promise<void> {
    try {
      await userApi.delete<DeletePreferencesResponse>(
        `/api/users/shopping-preferences/${userId}`
      );

      // Clear cache
      this.cache.delete(userId);
      await AsyncStorage.removeItem(`${CACHE_KEY}_${userId}`);

      console.log('[ShoppingPreferencesService] Preferences deleted successfully');
    } catch (error) {
      console.error('[ShoppingPreferencesService] Error deleting preferences:', error);
      throw error;
    }
  }

  /**
   * Update specific fields in preferences
   * Convenience method that fetches current preferences, merges changes, and saves.
   * 
   * @param userId - User ID
   * @param updates - Partial preferences to update
   * @returns Updated preferences
   */
  async updatePreferences(
    userId: string,
    updates: Partial<Omit<ShoppingPreferences, 'user_id'>>
  ): Promise<ShoppingPreferences> {
    try {
      // Fetch current preferences
      const current = await this.getPreferences(userId);

      // Merge updates
      const merged: SavePreferencesRequest = {
        userId,
        preferred_stores: updates.preferred_stores ?? current.preferred_stores,
        budget_preference: updates.budget_preference ?? current.budget_preference,
        organic_preference: updates.organic_preference ?? current.organic_preference,
        brand_preferences: updates.brand_preferences 
          ? { ...current.brand_preferences, ...updates.brand_preferences }
          : current.brand_preferences,
        default_postal_code: updates.default_postal_code !== undefined 
          ? updates.default_postal_code 
          : current.default_postal_code,
        delivery_preference: updates.delivery_preference ?? current.delivery_preference,
      };

      // Save merged preferences
      return await this.savePreferences(merged);
    } catch (error) {
      console.error('[ShoppingPreferencesService] Error updating preferences:', error);
      throw error;
    }
  }

  /**
   * Add a store to preferred stores
   * 
   * @param userId - User ID
   * @param store - Store identifier to add
   * @returns Updated preferences
   */
  async addPreferredStore(userId: string, store: string): Promise<ShoppingPreferences> {
    const current = await this.getPreferences(userId);
    const stores = [...current.preferred_stores];
    
    if (!stores.includes(store)) {
      stores.push(store);
    }

    return await this.updatePreferences(userId, { preferred_stores: stores });
  }

  /**
   * Remove a store from preferred stores
   * 
   * @param userId - User ID
   * @param store - Store identifier to remove
   * @returns Updated preferences
   */
  async removePreferredStore(userId: string, store: string): Promise<ShoppingPreferences> {
    const current = await this.getPreferences(userId);
    const stores = current.preferred_stores.filter(s => s !== store);

    return await this.updatePreferences(userId, { preferred_stores: stores });
  }

  /**
   * Add or update a brand preference for a category
   * 
   * @param userId - User ID
   * @param category - Product category (e.g., 'chicken', 'milk', 'bread')
   * @param brand - Brand name
   * @returns Updated preferences
   */
  async setBrandPreference(
    userId: string,
    category: string,
    brand: string
  ): Promise<ShoppingPreferences> {
    const current = await this.getPreferences(userId);
    const brandPreferences = { ...current.brand_preferences, [category]: brand };

    return await this.updatePreferences(userId, { brand_preferences: brandPreferences });
  }

  /**
   * Remove a brand preference for a category
   * 
   * @param userId - User ID
   * @param category - Product category to remove
   * @returns Updated preferences
   */
  async removeBrandPreference(userId: string, category: string): Promise<ShoppingPreferences> {
    const current = await this.getPreferences(userId);
    const brandPreferences = { ...current.brand_preferences };
    delete brandPreferences[category];

    return await this.updatePreferences(userId, { brand_preferences: brandPreferences });
  }

  /**
   * Clear all caches (memory and AsyncStorage)
   */
  async clearCache(): Promise<void> {
    this.cache.clear();
    
    // Clear all AsyncStorage entries for shopping preferences
    try {
      const keys = await AsyncStorage.getAllKeys();
      const preferencesKeys = keys.filter(key => key.startsWith(CACHE_KEY));
      await AsyncStorage.multiRemove(preferencesKeys);
      console.log('[ShoppingPreferencesService] Cache cleared');
    } catch (error) {
      console.error('[ShoppingPreferencesService] Error clearing cache:', error);
    }
  }

  /**
   * Validate preference values before saving
   * 
   * @param preferences - Preferences to validate
   * @returns True if valid, throws error if invalid
   */
  validatePreferences(preferences: Partial<SavePreferencesRequest>): boolean {
    const validBudget: BudgetPreference[] = ['budget', 'moderate', 'premium'];
    const validOrganic: OrganicPreference[] = ['always', 'when_possible', 'never'];
    const validDelivery: DeliveryPreference[] = ['asap', 'scheduled', 'pickup'];

    if (preferences.budget_preference && !validBudget.includes(preferences.budget_preference)) {
      throw new Error(`Invalid budget_preference. Must be one of: ${validBudget.join(', ')}`);
    }

    if (preferences.organic_preference && !validOrganic.includes(preferences.organic_preference)) {
      throw new Error(`Invalid organic_preference. Must be one of: ${validOrganic.join(', ')}`);
    }

    if (preferences.delivery_preference && !validDelivery.includes(preferences.delivery_preference)) {
      throw new Error(`Invalid delivery_preference. Must be one of: ${validDelivery.join(', ')}`);
    }

    if (preferences.default_postal_code) {
      const postalCode = preferences.default_postal_code;
      // Basic validation for US (5 or 9 digits) or Canadian (A1A 1A1) postal codes
      const usZip = /^\d{5}(-\d{4})?$/;
      const caPostal = /^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/i;
      
      if (!usZip.test(postalCode) && !caPostal.test(postalCode)) {
        throw new Error('Invalid postal code format. Must be US (12345 or 12345-6789) or Canadian (A1A 1A1)');
      }
    }

    return true;
  }
}

// ============= EXPORT =============

export const shoppingPreferencesService = new ShoppingPreferencesService();
export default shoppingPreferencesService;
