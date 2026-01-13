import { useState, useEffect, useCallback, useMemo } from 'react';
import { consumptionService } from '../services/consumptionService';
import type {
  DashboardData,
  LogMealRequest,
  LogWaterRequest,
  LogFromScanRequest,
  LogFromRecipeRequest,
  LogFromShoppingRequest,
  ConfirmMealRequest,
  SkipMealRequest,
  PendingMeal,
  WeeklySummaryData,
  HistoryParams,
  HistoryLog,
  NutritionData,
  DashboardParams,
} from '../services/consumptionService';

interface UseConsumptionState {
  /** Daily consumption dashboard data */
  dashboard: DashboardData | null;
  /** List of pending meals from meal plans/shopping list */
  pendingMeals: PendingMeal[];
  /** Weekly summary for analytics */
  weeklySummary: WeeklySummaryData | null;
  /** Loading state */
  loading: boolean;
  /** Error message if any */
  error: string | null;
  /** Whether initial load is complete */
  initialized: boolean;
}

interface UseConsumptionActions {
  /** Refresh dashboard data */
  refresh: (params?: DashboardParams) => Promise<void>;
  /** Log a meal manually */
  logMeal: (meal: LogMealRequest) => Promise<{ log_id: string; daily_totals: NutritionData }>;
  /** Log water intake */
  logWater: (request: LogWaterRequest) => Promise<{ progress_pct: number; glasses_remaining: number }>;
  /** Log from a barcode/photo scan */
  logFromScan: (request: LogFromScanRequest) => Promise<{ log_id: string }>;
  /** Log from a saved recipe */
  logFromRecipe: (request: LogFromRecipeRequest) => Promise<{ log_id: string }>;
  /** Log from shopping list item */
  logFromShopping: (request: LogFromShoppingRequest) => Promise<{ log_id: string }>;
  /** Confirm a pending meal as eaten */
  confirmMeal: (request: ConfirmMealRequest) => Promise<{ log_id: string; pending_remaining: number }>;
  /** Skip a pending meal */
  skipMeal: (request: SkipMealRequest) => Promise<{ pending_remaining: number }>;
  /** Get consumption history */
  getHistory: (params?: HistoryParams) => Promise<HistoryLog[]>;
  /** Load weekly summary */
  loadWeeklySummary: () => Promise<void>;
  /** Load pending meals */
  loadPendingMeals: (date?: string) => Promise<void>;
  /** Delete a consumption log */
  deleteLog: (logId: string) => Promise<void>;
}

export type UseConsumptionResult = UseConsumptionState & UseConsumptionActions;

/**
 * React hook for consumption tracking functionality
 * 
 * Features:
 * - Daily dashboard with calories, macros, water, and meals
 * - Meal logging (manual, from scan, recipe, or shopping list)
 * - Water intake tracking with optimistic updates
 * - Pending meal management (confirm/skip)
 * - Consumption history and weekly summaries
 * 
 * @param userId - User identifier (required)
 * @returns State and action functions for consumption tracking
 * 
 * @example
 * ```tsx
 * const { dashboard, loading, logMeal, logWater, refresh } = useConsumption(userId);
 * 
 * // Log a meal
 * await logMeal({ name: 'Chicken Salad', nutrition: { calories: 450, protein_g: 35, carbs_g: 15, fat_g: 28 } });
 * 
 * // Log water (1 bottle = 500ml)
 * await logWater({ amount_ml: 500, container_type: 'bottle' });
 * 
 * // Display progress
 * <Text>Calories: {dashboard?.progress.calories_pct}%</Text>
 * <Text>Water: {dashboard?.water.glasses} / {dashboard?.water.glasses_goal} glasses</Text>
 * ```
 */
export function useConsumption(userId: string): UseConsumptionResult {
  const [state, setState] = useState<UseConsumptionState>({
    dashboard: null,
    pendingMeals: [],
    weeklySummary: null,
    loading: true,
    error: null,
    initialized: false,
  });

  // ============= DATA LOADING =============

  /**
   * Refresh dashboard data
   */
  const refresh = useCallback(async (params?: DashboardParams) => {
    if (!userId) return;
    
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const data = await consumptionService.getDashboard(userId, params);
      setState(prev => ({
        ...prev,
        dashboard: data,
        loading: false,
        initialized: true,
      }));
    } catch (e: any) {
      console.error('[useConsumption] Failed to load dashboard:', e);
      setState(prev => ({
        ...prev,
        error: e.message || 'Failed to load consumption data',
        loading: false,
        initialized: true,
      }));
    }
  }, [userId]);

  /**
   * Load pending meals
   */
  const loadPendingMeals = useCallback(async (date?: string) => {
    if (!userId) return;
    
    try {
      const data = await consumptionService.getPendingMeals(userId, date);
      setState(prev => ({
        ...prev,
        pendingMeals: data.pending_meals,
      }));
    } catch (e: any) {
      console.error('[useConsumption] Failed to load pending meals:', e);
    }
  }, [userId]);

  /**
   * Load weekly summary
   */
  const loadWeeklySummary = useCallback(async () => {
    if (!userId) return;
    
    try {
      const data = await consumptionService.getWeeklySummary(userId);
      setState(prev => ({
        ...prev,
        weeklySummary: data,
      }));
    } catch (e: any) {
      console.error('[useConsumption] Failed to load weekly summary:', e);
    }
  }, [userId]);

  // Initial load
  useEffect(() => {
    refresh();
  }, [refresh]);

  // ============= MEAL LOGGING =============

  /**
   * Log a meal manually
   */
  const logMeal = useCallback(async (meal: LogMealRequest) => {
    const result = await consumptionService.logMeal(userId, meal);
    
    // Refresh dashboard to get updated totals
    await refresh();
    
    return {
      log_id: result.log_id,
      daily_totals: result.daily_totals,
    };
  }, [userId, refresh]);

  /**
   * Log from a scan result
   */
  const logFromScan = useCallback(async (request: LogFromScanRequest) => {
    const result = await consumptionService.logFromScan(userId, request);
    await refresh();
    return { log_id: result.log_id };
  }, [userId, refresh]);

  /**
   * Log from a recipe
   */
  const logFromRecipe = useCallback(async (request: LogFromRecipeRequest) => {
    const result = await consumptionService.logFromRecipe(userId, request);
    await refresh();
    return { log_id: result.log_id };
  }, [userId, refresh]);

  /**
   * Log from shopping list item
   */
  const logFromShopping = useCallback(async (request: LogFromShoppingRequest) => {
    const result = await consumptionService.logFromShopping(userId, request);
    await refresh();
    return { log_id: result.log_id };
  }, [userId, refresh]);

  // ============= WATER TRACKING =============

  /**
   * Log water intake with optimistic update
   */
  const logWater = useCallback(async (request: LogWaterRequest) => {
    // Optimistic update for immediate UI feedback
    if (state.dashboard) {
      const optimisticGlasses = state.dashboard.water.glasses + Math.round(request.amount_ml / 250);
      const optimisticProgress = Math.min(
        100,
        state.dashboard.water.progress_pct + (request.amount_ml / state.dashboard.water.goal_ml) * 100
      );
      
      setState(prev => ({
        ...prev,
        dashboard: prev.dashboard ? {
          ...prev.dashboard,
          water: {
            ...prev.dashboard.water,
            glasses: optimisticGlasses,
            progress_pct: optimisticProgress,
            total_ml: prev.dashboard.water.total_ml + request.amount_ml,
          },
        } : null,
      }));
    }

    try {
      const result = await consumptionService.logWater(userId, request);
      
      // Update with server response
      setState(prev => ({
        ...prev,
        dashboard: prev.dashboard ? {
          ...prev.dashboard,
          water: {
            ...prev.dashboard.water,
            total_ml: result.daily_total_ml,
            progress_pct: result.progress_pct,
            glasses: Math.floor(result.daily_total_ml / 250),
          },
        } : null,
      }));
      
      return {
        progress_pct: result.progress_pct,
        glasses_remaining: result.glasses_remaining,
      };
    } catch (e: any) {
      // Rollback on error
      await refresh();
      throw e;
    }
  }, [userId, state.dashboard, refresh]);

  // ============= PENDING MEALS =============

  /**
   * Confirm a pending meal as eaten
   */
  const confirmMeal = useCallback(async (request: ConfirmMealRequest) => {
    const result = await consumptionService.confirmPendingMeal(userId, request);
    
    // Remove from pending list
    setState(prev => ({
      ...prev,
      pendingMeals: prev.pendingMeals.filter(m => m.id !== request.pending_meal_id),
    }));
    
    // Refresh dashboard for updated totals
    await refresh();
    
    return {
      log_id: result.log_id,
      pending_remaining: result.pending_remaining,
    };
  }, [userId, refresh]);

  /**
   * Skip a pending meal
   */
  const skipMeal = useCallback(async (request: SkipMealRequest) => {
    const result = await consumptionService.skipPendingMeal(userId, request);
    
    // Remove from pending list
    setState(prev => ({
      ...prev,
      pendingMeals: prev.pendingMeals.filter(m => m.id !== request.pending_meal_id),
    }));
    
    return {
      pending_remaining: result.pending_remaining,
    };
  }, [userId]);

  // ============= HISTORY =============

  /**
   * Get consumption history
   */
  const getHistory = useCallback(async (params?: HistoryParams) => {
    const result = await consumptionService.getHistory(userId, params);
    return result.logs;
  }, [userId]);

  /**
   * Delete a consumption log
   */
  const deleteLog = useCallback(async (logId: string) => {
    await consumptionService.deleteLog(userId, logId);
    await refresh();
  }, [userId, refresh]);

  // ============= RETURN =============

  return useMemo(() => ({
    // State
    dashboard: state.dashboard,
    pendingMeals: state.pendingMeals,
    weeklySummary: state.weeklySummary,
    loading: state.loading,
    error: state.error,
    initialized: state.initialized,
    
    // Actions
    refresh,
    logMeal,
    logWater,
    logFromScan,
    logFromRecipe,
    logFromShopping,
    confirmMeal,
    skipMeal,
    getHistory,
    loadWeeklySummary,
    loadPendingMeals,
    deleteLog,
  }), [
    state,
    refresh,
    logMeal,
    logWater,
    logFromScan,
    logFromRecipe,
    logFromShopping,
    confirmMeal,
    skipMeal,
    getHistory,
    loadWeeklySummary,
    loadPendingMeals,
    deleteLog,
  ]);
}

export default useConsumption;
