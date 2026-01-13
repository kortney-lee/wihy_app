/**
 * useMealEnhancement Hook
 * 
 * Manages the progressive enhancement UX flow for meal plans.
 * Supports three enhancement levels:
 * - Basic: Generic meal plan (no shopping integration)
 * - Zipcode: Regional pricing + available stores
 * - Full: Real Instacart products + one-click ordering
 * 
 * @example
 * const {
 *   enhancementLevel,
 *   availableStores,
 *   createPlan,
 *   addZipcode,
 *   selectStore,
 *   shoppingReady
 * } = useMealEnhancement();
 */

import { useState, useCallback, useEffect } from 'react';
import { mealService } from '../services';
import { storageService } from '../services/storage/storageService';
import type {
  CreateMealPlanRequest,
  EnhancedMealPlanResponse,
  EnhancementLevel,
  AvailableStore,
  UserShoppingPreferences,
} from '../services/mealService';

// ============================================
// TYPES
// ============================================

export interface MealEnhancementState {
  /** Current meal plan (if any) */
  mealPlan: EnhancedMealPlanResponse | null;
  /** Current enhancement level */
  enhancementLevel: EnhancementLevel | null;
  /** Whether shopping cart is ready */
  shoppingReady: boolean;
  /** Whether plan can be enhanced further */
  canEnhance: boolean;
  /** Available stores in user's area */
  availableStores: AvailableStore[];
  /** User's saved postal code */
  savedPostalCode: string | null;
  /** User's saved store preference */
  savedStorePreference: string | null;
  /** Loading state */
  loading: boolean;
  /** Error message */
  error: string | null;
  /** Loading substates for UI feedback */
  loadingStates: {
    creatingPlan: boolean;
    addingZipcode: boolean;
    selectingStore: boolean;
    fetchingStores: boolean;
    loadingPreferences: boolean;
  };
}

export interface MealEnhancementActions {
  /** Create a meal plan (auto-enhances based on saved preferences) */
  createPlan: (request: Omit<CreateMealPlanRequest, 'postal_code' | 'store_preference'>, options?: {
    useStoredPreferences?: boolean;
    postal_code?: string;
    store_preference?: string;
  }) => Promise<EnhancedMealPlanResponse>;
  
  /** Add zipcode to existing plan to get available stores */
  addZipcode: (postalCode: string, savePreference?: boolean) => Promise<EnhancedMealPlanResponse>;
  
  /** Select store to get real Instacart products */
  selectStore: (storeId: string, savePreference?: boolean) => Promise<EnhancedMealPlanResponse>;
  
  /** Fetch available stores for a postal code */
  fetchStores: (postalCode: string) => Promise<AvailableStore[]>;
  
  /** Load user's saved shopping preferences */
  loadPreferences: (userId: string) => Promise<void>;
  
  /** Save user's shopping preferences */
  savePreferences: (userId: string, prefs: Partial<UserShoppingPreferences>) => Promise<void>;
  
  /** Clear current meal plan */
  clearPlan: () => void;
  
  /** Reset error state */
  clearError: () => void;
}

// Storage keys
const STORAGE_KEYS = {
  SHOPPING_PREFS: 'user_shopping_preferences',
  CACHED_STORES: 'cached_stores',
  ACTIVE_MEAL_PLAN: 'active_enhanced_meal_plan',
};

// Cache TTLs
const CACHE_TTL = {
  STORES: 6 * 60 * 60 * 1000, // 6 hours
  PREFERENCES: 24 * 60 * 60 * 1000, // 24 hours
  MEAL_PLAN: 7 * 24 * 60 * 60 * 1000, // 7 days
};

// ============================================
// HOOK
// ============================================

export function useMealEnhancement(userId?: string): MealEnhancementState & MealEnhancementActions {
  // State
  const [mealPlan, setMealPlan] = useState<EnhancedMealPlanResponse | null>(null);
  const [availableStores, setAvailableStores] = useState<AvailableStore[]>([]);
  const [savedPostalCode, setSavedPostalCode] = useState<string | null>(null);
  const [savedStorePreference, setSavedStorePreference] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Loading states
  const [loadingStates, setLoadingStates] = useState({
    creatingPlan: false,
    addingZipcode: false,
    selectingStore: false,
    fetchingStores: false,
    loadingPreferences: false,
  });

  // Computed values
  const loading = Object.values(loadingStates).some(Boolean);
  const enhancementLevel = mealPlan?.enhancement_level ?? null;
  const shoppingReady = mealPlan?.shopping_ready ?? false;
  const canEnhance = mealPlan?.can_enhance ?? false;

  // ============================================
  // LOAD PREFERENCES ON MOUNT
  // ============================================

  useEffect(() => {
    if (userId) {
      loadPreferences(userId);
    }
  }, [userId]);

  // ============================================
  // ACTIONS
  // ============================================

  /**
   * Load user's saved shopping preferences
   */
  const loadPreferences = useCallback(async (uid: string) => {
    setLoadingStates(prev => ({ ...prev, loadingPreferences: true }));
    
    try {
      // Try local cache first
      const cached = await storageService.getCachedWithExpiry<UserShoppingPreferences>(
        `${STORAGE_KEYS.SHOPPING_PREFS}_${uid}`,
        CACHE_TTL.PREFERENCES
      );
      
      if (cached?.data) {
        setSavedPostalCode(cached.data.postal_code ?? null);
        setSavedStorePreference(cached.data.store_preference ?? null);
        
        // If we have cached stores, use them
        if (cached.data.available_stores?.length) {
          setAvailableStores(cached.data.available_stores);
        }
        
        // If not stale, we're done
        if (!cached.isStale) {
          return;
        }
      }

      // Fetch from server
      const prefs = await mealService.getShoppingPreferences(uid);
      
      if (prefs) {
        setSavedPostalCode(prefs.postal_code ?? null);
        setSavedStorePreference(prefs.store_preference ?? null);
        
        // Cache locally
        await storageService.setCachedWithExpiry(
          `${STORAGE_KEYS.SHOPPING_PREFS}_${uid}`,
          prefs,
          CACHE_TTL.PREFERENCES
        );

        // If we have a postal code, fetch fresh stores
        if (prefs.postal_code) {
          const stores = await fetchStoresInternal(prefs.postal_code);
          
          // Update cached prefs with stores
          await storageService.setCachedWithExpiry(
            `${STORAGE_KEYS.SHOPPING_PREFS}_${uid}`,
            { ...prefs, available_stores: stores },
            CACHE_TTL.PREFERENCES
          );
        }
      }
    } catch (err) {
      console.error('[useMealEnhancement] Error loading preferences:', err);
      // Don't set error - preferences are optional
    } finally {
      setLoadingStates(prev => ({ ...prev, loadingPreferences: false }));
    }
  }, []);

  /**
   * Save user's shopping preferences
   */
  const savePreferences = useCallback(async (
    uid: string,
    prefs: Partial<UserShoppingPreferences>
  ) => {
    try {
      // Update local state immediately
      if (prefs.postal_code !== undefined) {
        setSavedPostalCode(prefs.postal_code ?? null);
      }
      if (prefs.store_preference !== undefined) {
        setSavedStorePreference(prefs.store_preference ?? null);
      }

      // Save to server
      const updated = await mealService.saveShoppingPreferences(uid, prefs);

      // Cache locally
      await storageService.setCachedWithExpiry(
        `${STORAGE_KEYS.SHOPPING_PREFS}_${uid}`,
        updated,
        CACHE_TTL.PREFERENCES
      );
    } catch (err: any) {
      console.error('[useMealEnhancement] Error saving preferences:', err);
      throw err;
    }
  }, []);

  /**
   * Internal helper to fetch stores
   */
  const fetchStoresInternal = async (postalCode: string): Promise<AvailableStore[]> => {
    // Check cache first
    const cacheKey = `${STORAGE_KEYS.CACHED_STORES}_${postalCode}`;
    const cached = await storageService.getCachedWithExpiry<AvailableStore[]>(
      cacheKey,
      CACHE_TTL.STORES
    );

    if (cached?.data && !cached.isStale) {
      return cached.data;
    }

    // Fetch from API
    const stores = await mealService.getAvailableStores(postalCode);

    // Cache the result
    await storageService.setCachedWithExpiry(cacheKey, stores, CACHE_TTL.STORES);

    return stores;
  };

  /**
   * Fetch available stores for a postal code
   */
  const fetchStores = useCallback(async (postalCode: string): Promise<AvailableStore[]> => {
    setLoadingStates(prev => ({ ...prev, fetchingStores: true }));
    setError(null);

    try {
      const stores = await fetchStoresInternal(postalCode);
      setAvailableStores(stores);
      return stores;
    } catch (err: any) {
      const message = err.message || 'Failed to fetch stores';
      setError(message);
      throw err;
    } finally {
      setLoadingStates(prev => ({ ...prev, fetchingStores: false }));
    }
  }, []);

  /**
   * Create a meal plan with optional enhancement
   */
  const createPlan = useCallback(async (
    request: Omit<CreateMealPlanRequest, 'postal_code' | 'store_preference'>,
    options?: {
      useStoredPreferences?: boolean;
      postal_code?: string;
      store_preference?: string;
    }
  ): Promise<EnhancedMealPlanResponse> => {
    setLoadingStates(prev => ({ ...prev, creatingPlan: true }));
    setError(null);

    try {
      // Build request with enhancement parameters
      const enhancedRequest: CreateMealPlanRequest = {
        ...request,
      };

      // Apply enhancement options
      if (options?.useStoredPreferences !== false) {
        // Use provided values or fall back to saved preferences
        enhancedRequest.postal_code = options?.postal_code ?? savedPostalCode ?? undefined;
        enhancedRequest.store_preference = options?.store_preference ?? savedStorePreference ?? undefined;
      } else {
        // Explicit override
        enhancedRequest.postal_code = options?.postal_code;
        enhancedRequest.store_preference = options?.store_preference;
      }

      console.log('[useMealEnhancement] Creating plan with enhancement:', {
        postal_code: enhancedRequest.postal_code,
        store_preference: enhancedRequest.store_preference,
      });

      const plan = await mealService.createEnhancedMealPlan(enhancedRequest);
      
      setMealPlan(plan);
      
      // Update available stores from response
      if (plan.available_stores?.length) {
        setAvailableStores(plan.available_stores);
      }

      // Cache the plan
      if (userId) {
        await storageService.setCachedWithExpiry(
          `${STORAGE_KEYS.ACTIVE_MEAL_PLAN}_${userId}`,
          plan,
          CACHE_TTL.MEAL_PLAN
        );
      }

      return plan;
    } catch (err: any) {
      const message = err.message || 'Failed to create meal plan';
      setError(message);
      throw err;
    } finally {
      setLoadingStates(prev => ({ ...prev, creatingPlan: false }));
    }
  }, [savedPostalCode, savedStorePreference, userId]);

  /**
   * Add zipcode to existing plan to get available stores
   */
  const addZipcode = useCallback(async (
    postalCode: string,
    savePreference = true
  ): Promise<EnhancedMealPlanResponse> => {
    if (!mealPlan) {
      throw new Error('No active meal plan to enhance');
    }

    setLoadingStates(prev => ({ ...prev, addingZipcode: true }));
    setError(null);

    try {
      const enhanced = await mealService.enhanceMealPlanShopping(
        mealPlan.program_id,
        { postal_code: postalCode }
      );

      setMealPlan(enhanced);
      
      // Update available stores
      if (enhanced.available_stores?.length) {
        setAvailableStores(enhanced.available_stores);
      }

      // Save preference if requested
      if (savePreference && userId) {
        await savePreferences(userId, { postal_code: postalCode });
      }

      return enhanced;
    } catch (err: any) {
      const message = err.message || 'Failed to add zipcode';
      setError(message);
      throw err;
    } finally {
      setLoadingStates(prev => ({ ...prev, addingZipcode: false }));
    }
  }, [mealPlan, userId, savePreferences]);

  /**
   * Select store to get real Instacart products
   */
  const selectStore = useCallback(async (
    storeId: string,
    savePreference = true
  ): Promise<EnhancedMealPlanResponse> => {
    if (!mealPlan) {
      throw new Error('No active meal plan to enhance');
    }

    setLoadingStates(prev => ({ ...prev, selectingStore: true }));
    setError(null);

    try {
      const enhanced = await mealService.enhanceMealPlanShopping(
        mealPlan.program_id,
        { store_preference: storeId }
      );

      setMealPlan(enhanced);

      // Save preference if requested
      if (savePreference && userId) {
        await savePreferences(userId, { store_preference: storeId });
      }

      return enhanced;
    } catch (err: any) {
      const message = err.message || 'Failed to select store';
      setError(message);
      throw err;
    } finally {
      setLoadingStates(prev => ({ ...prev, selectingStore: false }));
    }
  }, [mealPlan, userId, savePreferences]);

  /**
   * Clear current meal plan
   */
  const clearPlan = useCallback(() => {
    setMealPlan(null);
    setError(null);
  }, []);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // ============================================
  // RETURN
  // ============================================

  return {
    // State
    mealPlan,
    enhancementLevel,
    shoppingReady,
    canEnhance,
    availableStores,
    savedPostalCode,
    savedStorePreference,
    loading,
    error,
    loadingStates,
    // Actions
    createPlan,
    addZipcode,
    selectStore,
    fetchStores,
    loadPreferences,
    savePreferences,
    clearPlan,
    clearError,
  };
}

export default useMealEnhancement;
