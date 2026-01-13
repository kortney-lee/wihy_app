import { API_CONFIG } from './config';
import { fetchWithLogging } from '../utils/apiLogger';

// ============= NUTRITION INTERFACES =============

/** Nutrition data structure used throughout the API */
export interface NutritionData {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g?: number;
  sugar_g?: number;
  sodium_mg?: number;
  saturated_fat_g?: number;
}

/** Nutrition goals for the user */
export interface NutritionGoals extends NutritionData {
  water_ml: number;
}

/** Progress percentages for each nutrient */
export interface NutritionProgress {
  calories_pct: number;
  protein_pct: number;
  carbs_pct: number;
  fat_pct: number;
  fiber_pct: number;
  overall_score: number;
}

// ============= MEAL INTERFACES =============

/** Meal types */
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

/** Source of the meal log */
export type MealSource = 'manual' | 'scan_barcode' | 'scan_photo' | 'recipe' | 'meal_plan' | 'shopping_list';

/** A logged meal */
export interface MealLog {
  id: string;
  meal_type: MealType;
  name: string;
  time: string;
  logged_at: string;
  source: MealSource;
  source_id: string | null;
  servings: number;
  nutrition: NutritionData;
  verified: boolean;
  photo_url: string | null;
  confidence_score: number | null;
  brand?: string;
  notes?: string;
}

/** Meal breakdown by type */
export interface MealTypeBreakdown {
  count: number;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

/** Source breakdown for logged meals */
export interface SourceBreakdown {
  count: number;
  calories: number;
  percentage: number;
}

// ============= WATER INTERFACES =============

/** Water log entry */
export interface WaterLog {
  time: string;
  amount_ml: number;
}

/** Container types for water logging */
export type ContainerType = 'glass' | 'bottle' | 'cup';

/** Water tracking data */
export interface WaterData {
  total_ml: number;
  goal_ml: number;
  glasses: number;
  glasses_goal: number;
  progress_pct: number;
  logs: WaterLog[];
}

/** Water presets for quick add */
export const WATER_PRESETS = [
  { label: '1 Glass', amount_ml: 250, icon: 'glass-water' as const },
  { label: '1 Bottle', amount_ml: 500, icon: 'bottle-water' as const },
  { label: '1 Cup', amount_ml: 200, icon: 'cup' as const },
  { label: 'Custom', amount_ml: null, icon: 'edit' as const },
] as const;

// ============= DASHBOARD INTERFACES =============

/** Dashboard summary info */
export interface DashboardSummary {
  date: string;
  period: 'day' | 'week' | 'month';
  last_updated: string;
}

/** Trends comparing to previous period */
export interface ConsumptionTrends {
  vs_yesterday: {
    calories_diff: number;
    calories_pct_change: number;
    protein_diff: number;
    protein_pct_change: number;
  };
}

/** Nutrition recommendation */
export interface NutritionRecommendation {
  type: string;
  message: string;
  priority: 'high' | 'medium' | 'low';
}

/** Full dashboard response */
export interface DashboardData {
  summary: DashboardSummary;
  goals: NutritionGoals;
  totals: NutritionData;
  progress: NutritionProgress;
  water: WaterData;
  meals: MealLog[];
  by_meal_type: {
    breakfast: MealTypeBreakdown;
    lunch: MealTypeBreakdown;
    dinner: MealTypeBreakdown;
    snack: MealTypeBreakdown;
  };
  by_source?: Record<string, SourceBreakdown>;
  trends?: ConsumptionTrends;
  recommendations: NutritionRecommendation[];
}

// ============= PENDING MEALS INTERFACES =============

/** Pending meal status */
export type PendingMealStatus = 'pending' | 'purchased' | 'available';

/** Pending meal from meal plan or shopping list */
export interface PendingMeal {
  id: string;
  name: string;
  meal_type: MealType | 'available';
  scheduled_time?: string;
  source: 'meal_plan' | 'shopping_list';
  source_id: string;
  recipe_id?: string;
  item_id?: string;
  nutrition: NutritionData;
  status: PendingMealStatus;
  can_modify_servings?: boolean;
  default_servings?: number;
  quantity_available?: string;
  servings_available?: number;
}

/** Skip reason options */
export type SkipReason = 'not_hungry' | 'ate_different' | 'postponed' | 'other';

// ============= WEEKLY SUMMARY INTERFACES =============

/** Daily summary for weekly view */
export interface DailySummary {
  date: string;
  day_name: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  water_ml: number;
  meals_logged: number;
  on_track: boolean;
}

/** Top food item */
export interface TopFood {
  name: string;
  count: number;
  avg_calories: number;
}

/** Weekly summary data */
export interface WeeklySummaryData {
  period: {
    start: string;
    end: string;
  };
  averages: {
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    water_ml: number;
  };
  goals_hit: {
    calories: number;
    protein: number;
    water: number;
  };
  days: DailySummary[];
  top_foods: TopFood[];
  sources_breakdown: Record<string, { count: number; pct: number }>;
}

// ============= HISTORY INTERFACES =============

/** History log entry */
export interface HistoryLog {
  id: string;
  name: string;
  meal_type: MealType;
  servings: string;
  logged_at: string;
  consumed_at: string;
  source: MealSource;
  calories: number;
  protein_g: string;
  carbs_g: string;
  fat_g: string;
  fiber_g: string;
  photo_url: string | null;
  brand: string | null;
  verified: boolean;
}

/** Pagination info */
export interface Pagination {
  limit: number;
  offset: number;
  count: number;
}

// ============= REQUEST INTERFACES =============

/** Dashboard request parameters */
export interface DashboardParams {
  date?: string;
  period?: 'day' | 'week' | 'month';
  include_sources?: boolean;
  include_trends?: boolean;
}

/** Log meal request */
export interface LogMealRequest {
  meal_type?: MealType;
  name: string;
  servings?: number;
  time?: string;
  nutrition: NutritionData;
  photo_url?: string;
  notes?: string;
}

/** Log from scan request */
export interface LogFromScanRequest {
  scan_id: string;
  meal_type?: MealType;
  servings?: number;
  time?: string;
}

/** Log from recipe request */
export interface LogFromRecipeRequest {
  recipe_id: string;
  meal_type?: MealType;
  servings?: number;
  time?: string;
}

/** Log from shopping request */
export interface LogFromShoppingRequest {
  shopping_list_id: string;
  item_id: string;
  meal_type?: MealType;
  servings?: number;
  time?: string;
}

/** Confirm pending meal request */
export interface ConfirmMealRequest {
  pending_meal_id: string;
  servings?: number;
  actual_time?: string;
  notes?: string;
}

/** Skip pending meal request */
export interface SkipMealRequest {
  pending_meal_id: string;
  reason?: SkipReason;
  reschedule_to?: string;
}

/** Log water request */
export interface LogWaterRequest {
  amount_ml: number;
  time?: string;
  container_type?: ContainerType;
}

/** Update log request */
export interface UpdateLogRequest {
  servings?: number;
  time?: string;
  notes?: string;
}

/** History request parameters */
export interface HistoryParams {
  start_date?: string;
  end_date?: string;
  meal_type?: MealType;
  source?: MealSource;
  limit?: number;
  offset?: number;
}

// ============= RESPONSE INTERFACES =============

/** Log meal response */
export interface LogMealResponse {
  log_id: string;
  daily_totals: NutritionData;
  progress: {
    calories_pct: number;
    protein_pct: number;
  };
}

/** Log from source response */
export interface LogFromSourceResponse {
  log_id: string;
  nutrition_logged: NutritionData;
}

/** Log from shopping response */
export interface LogFromShoppingResponse extends LogFromSourceResponse {
  item_updated: {
    servings_consumed: number;
    servings_remaining: number;
  };
}

/** Confirm meal response */
export interface ConfirmMealResponse {
  log_id: string;
  nutrition_logged: NutritionData;
  daily_totals: NutritionData;
  pending_remaining: number;
}

/** Skip meal response */
export interface SkipMealResponse {
  status: 'skipped';
  pending_remaining: number;
}

/** Log water response */
export interface LogWaterResponse {
  log_id: number;
  daily_total_ml: number;
  goal_ml: number;
  progress_pct: number;
  glasses_remaining: number;
}

/** Update log response */
export interface UpdateLogResponse {
  log_id: string;
  updated_nutrition: NutritionData;
}

/** History response */
export interface HistoryResponse {
  logs: HistoryLog[];
  pagination: Pagination;
}

// ============= SERVICE CLASS =============

/**
 * ConsumptionService - Handles all consumption tracking API calls
 * 
 * Main Features:
 * - Daily dashboard with goals, totals, and progress
 * - Meal logging (manual, from scan, recipe, or shopping list)
 * - Water intake tracking
 * - Pending meal confirmation/skip
 * - Consumption history and weekly summaries
 * 
 * @example
 * const dashboard = await consumptionService.getDashboard(userId);
 * await consumptionService.logMeal(userId, { name: 'Chicken Salad', nutrition: { ... } });
 * await consumptionService.logWater(userId, { amount_ml: 500 });
 */
class ConsumptionService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_CONFIG.baseUrl;
  }

  // ============= DASHBOARD =============

  /**
   * Get daily consumption dashboard
   * The main endpoint for the Nutrition tab - call on app launch and after any logging action
   * 
   * @param userId - User identifier
   * @param params - Optional parameters for date, period, etc.
   * @returns Dashboard data with goals, totals, progress, meals, and water
   */
  async getDashboard(userId: string, params?: DashboardParams): Promise<DashboardData> {
    const queryParams = new URLSearchParams({ user_id: userId });
    
    if (params?.date) queryParams.append('date', params.date);
    if (params?.period) queryParams.append('period', params.period);
    if (params?.include_sources !== undefined) queryParams.append('include_sources', String(params.include_sources));
    if (params?.include_trends !== undefined) queryParams.append('include_trends', String(params.include_trends));

    console.log('[ConsumptionService] Getting dashboard for user:', userId);
    const response = await fetchWithLogging(`${this.baseUrl}/api/consumption/dashboard?${queryParams}`);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to fetch dashboard');
    }
    
    console.log('[ConsumptionService] Dashboard loaded:', data.data?.summary);
    return data.data;
  }

  // ============= PENDING MEALS =============

  /**
   * Get pending meals from meal plans and shopping list
   * Shows meals that user can confirm as eaten
   * 
   * @param userId - User identifier
   * @param date - Optional date (defaults to today)
   * @returns List of pending meals
   */
  async getPendingMeals(userId: string, date?: string): Promise<{ pending_meals: PendingMeal[] }> {
    const queryParams = new URLSearchParams({ user_id: userId });
    if (date) queryParams.append('date', date);

    console.log('[ConsumptionService] Getting pending meals for user:', userId);
    const response = await fetchWithLogging(`${this.baseUrl}/api/consumption/pending?${queryParams}`);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to fetch pending meals');
    }
    
    return data.data;
  }

  /**
   * Confirm a pending meal as eaten
   * Marks the meal as consumed and logs it to daily consumption
   * 
   * @param userId - User identifier
   * @param request - Confirm request with pending_meal_id and optional servings
   * @returns Logged nutrition and updated daily totals
   */
  async confirmPendingMeal(userId: string, request: ConfirmMealRequest): Promise<ConfirmMealResponse> {
    console.log('[ConsumptionService] Confirming pending meal:', request.pending_meal_id);
    const response = await fetchWithLogging(`${this.baseUrl}/api/consumption/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, ...request }),
    });
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to confirm meal');
    }
    
    return data.data;
  }

  /**
   * Skip a pending meal without logging it
   * Dismisses the meal from pending list
   * 
   * @param userId - User identifier
   * @param request - Skip request with pending_meal_id and optional reason
   * @returns Skip confirmation and remaining pending count
   */
  async skipPendingMeal(userId: string, request: SkipMealRequest): Promise<SkipMealResponse> {
    console.log('[ConsumptionService] Skipping pending meal:', request.pending_meal_id);
    const response = await fetchWithLogging(`${this.baseUrl}/api/consumption/skip`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, ...request }),
    });
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to skip meal');
    }
    
    return data.data;
  }

  // ============= MEAL LOGGING =============

  /**
   * Log a meal manually with full nutrition data
   * 
   * @param userId - User identifier
   * @param request - Meal data with name, nutrition, and optional meal_type
   * @returns Log ID, daily totals, and progress
   */
  async logMeal(userId: string, request: LogMealRequest): Promise<LogMealResponse> {
    console.log('[ConsumptionService] Logging meal:', request.name);
    const response = await fetchWithLogging(`${this.baseUrl}/api/consumption/log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, ...request }),
    });
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to log meal');
    }
    
    console.log('[ConsumptionService] Meal logged, new totals:', data.data.daily_totals);
    return data.data;
  }

  /**
   * Log consumption from a previously completed barcode/photo scan
   * 
   * @param userId - User identifier
   * @param request - Scan reference with scan_id and optional servings
   * @returns Log ID and logged nutrition
   */
  async logFromScan(userId: string, request: LogFromScanRequest): Promise<LogFromSourceResponse> {
    console.log('[ConsumptionService] Logging from scan:', request.scan_id);
    const response = await fetchWithLogging(`${this.baseUrl}/api/consumption/log-from-scan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, ...request }),
    });
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to log from scan');
    }
    
    return data.data;
  }

  /**
   * Log consumption from a saved recipe
   * 
   * @param userId - User identifier
   * @param request - Recipe reference with recipe_id and optional servings
   * @returns Log ID and logged nutrition
   */
  async logFromRecipe(userId: string, request: LogFromRecipeRequest): Promise<LogFromSourceResponse> {
    console.log('[ConsumptionService] Logging from recipe:', request.recipe_id);
    const response = await fetchWithLogging(`${this.baseUrl}/api/consumption/log-from-recipe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, ...request }),
    });
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to log from recipe');
    }
    
    return data.data;
  }

  /**
   * Log consumption from a purchased shopping list item
   * 
   * @param userId - User identifier
   * @param request - Shopping item reference with list_id and item_id
   * @returns Log ID, logged nutrition, and updated item servings
   */
  async logFromShopping(userId: string, request: LogFromShoppingRequest): Promise<LogFromShoppingResponse> {
    console.log('[ConsumptionService] Logging from shopping item:', request.item_id);
    const response = await fetchWithLogging(`${this.baseUrl}/api/consumption/log-from-shopping`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, ...request }),
    });
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to log from shopping');
    }
    
    return data.data;
  }

  // ============= WATER TRACKING =============

  /**
   * Log water intake
   * 
   * @param userId - User identifier
   * @param request - Water amount in ml and optional container type
   * @returns Updated daily water total and progress
   */
  async logWater(userId: string, request: LogWaterRequest): Promise<LogWaterResponse> {
    console.log('[ConsumptionService] Logging water:', request.amount_ml, 'ml');
    const response = await fetchWithLogging(`${this.baseUrl}/api/consumption/water`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, ...request }),
    });
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to log water');
    }
    
    console.log('[ConsumptionService] Water logged, progress:', data.data.progress_pct, '%');
    return data.data;
  }

  // ============= HISTORY & ANALYTICS =============

  /**
   * Get consumption history with filtering
   * 
   * @param userId - User identifier
   * @param params - Optional filters for date range, meal type, source
   * @returns List of consumption logs with pagination
   */
  async getHistory(userId: string, params?: HistoryParams): Promise<HistoryResponse> {
    const queryParams = new URLSearchParams({ user_id: userId });
    
    if (params?.start_date) queryParams.append('start_date', params.start_date);
    if (params?.end_date) queryParams.append('end_date', params.end_date);
    if (params?.meal_type) queryParams.append('meal_type', params.meal_type);
    if (params?.source) queryParams.append('source', params.source);
    if (params?.limit !== undefined) queryParams.append('limit', String(params.limit));
    if (params?.offset !== undefined) queryParams.append('offset', String(params.offset));

    console.log('[ConsumptionService] Getting history for user:', userId);
    const response = await fetchWithLogging(`${this.baseUrl}/api/consumption/history?${queryParams}`);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to fetch history');
    }
    
    return data.data;
  }

  /**
   * Get weekly consumption summary for analytics
   * 
   * @param userId - User identifier
   * @returns 7-day overview with averages, goals hit, and daily breakdown
   */
  async getWeeklySummary(userId: string): Promise<WeeklySummaryData> {
    console.log('[ConsumptionService] Getting weekly summary for user:', userId);
    const response = await fetchWithLogging(`${this.baseUrl}/api/consumption/weekly-summary?user_id=${userId}`);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to fetch weekly summary');
    }
    
    return data.data;
  }

  // ============= LOG MANAGEMENT =============

  /**
   * Update an existing consumption log
   * 
   * @param userId - User identifier
   * @param logId - Log ID to update
   * @param request - Fields to update (servings, time, notes)
   * @returns Updated log with recalculated nutrition
   */
  async updateLog(userId: string, logId: string, request: UpdateLogRequest): Promise<UpdateLogResponse> {
    console.log('[ConsumptionService] Updating log:', logId);
    const response = await fetchWithLogging(`${this.baseUrl}/api/consumption/${logId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, ...request }),
    });
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to update log');
    }
    
    return data.data;
  }

  /**
   * Delete a consumption log (soft delete)
   * 
   * @param userId - User identifier
   * @param logId - Log ID to delete
   */
  async deleteLog(userId: string, logId: string): Promise<void> {
    console.log('[ConsumptionService] Deleting log:', logId);
    const response = await fetchWithLogging(`${this.baseUrl}/api/consumption/${logId}?user_id=${userId}`, {
      method: 'DELETE',
    });
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to delete log');
    }
  }
}

// Export singleton instance
export const consumptionService = new ConsumptionService();
