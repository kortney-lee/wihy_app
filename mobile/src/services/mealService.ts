import { API_CONFIG } from './config';
import { fetchWithLogging } from '../utils/apiLogger';

// ============= CORE TYPES =============

export type DietType =
  | 'keto'
  | 'paleo'
  | 'vegan'
  | 'vegetarian'
  | 'mediterranean'
  | 'gluten-free'
  | 'dairy-free'
  | 'pescatarian'
  | 'low_carb'
  | 'high_protein'
  | 'whole30'
  | 'carnivore'
  | 'low_sodium'
  | 'diabetic_friendly'
  | 'fodmap_low'
  | 'anti_inflammatory'
  | 'intermittent_fasting'
  | 'daniel_fast';

export type RecipeDifficulty = 'easy' | 'medium' | 'hard';

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'dessert';

export type PlanningFocus = 'family' | 'quick_easy' | 'budget' | 'health_fitness';

export type CookingSkillLevel = 'beginner' | 'intermediate' | 'advanced';

export type MealVariety = 'balanced' | 'family_friendly' | 'maximum_variety' | 'batch_cooking' | 'high_protein';

export type TimePerMeal = 'quick' | 'moderate' | 'no_preference';

export type SpiceTolerance = 'none' | 'mild' | 'medium' | 'hot' | 'extra_hot';

// ============= DIET & FOOD PREFERENCES =============

/** Diet option for display */
export interface DietOption {
  id: string;
  label: string;
  description: string;
  icon: string;
  type: 'restriction' | 'macronutrient' | 'ancestral' | 'regional' | 'elimination' | 'medical' | 'therapeutic' | 'timing' | 'spiritual';
}

/** User food preferences for personalized meal plans */
export interface UserFoodPreferences {
  userId: string;
  food_exclusions: string[];
  favorite_foods: string[];
  cuisine_preferences: string[];
  cuisine_exclusions: string[];
  texture_dislikes: string[];
  spice_tolerance: SpiceTolerance;
  ingredient_substitutions: Record<string, string | null>;
  created_at?: string;
  updated_at?: string;
}

/** Common food exclusion categories */
export interface CommonExclusions {
  categories: {
    dairy: string[];
    proteins: string[];
    vegetables: string[];
    seafood: string[];
    textures: string[];
    flavors: string[];
  };
  most_common: string[];
}

// ============= LEGACY INTERFACES =============

export interface MealProgram {
  id?: string;
  name: string;
  description?: string;
  diet_type: DietType;
  daily_calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  duration_days?: number;
  created_by?: string;
  created_at?: string;
}

export interface Recipe {
  id?: string;
  name: string;
  description?: string;
  diet_tags?: DietType[];
  prep_time_min?: number;
  cook_time_min?: number;
  servings?: number;
  difficulty?: RecipeDifficulty;
  calories_per_serving: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g?: number;
  sugar_g?: number;
  ingredients?: Array<{
    item: string;
    amount: string;
    calories?: number;
  }>;
  instructions?: string[];
  image_url?: string;
}

export interface NutritionCalculation {
  total_calories: number;
  total_protein_g: number;
  total_carbs_g: number;
  total_fat_g: number;
  total_fiber_g: number;
  total_sugar_g: number;
  ingredients_breakdown: Array<{
    item: string;
    amount: string;
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
  }>;
}

// ============= NEW API INTERFACES =============

/** User's meal planning preferences */
export interface MealPlanningPreferences {
  userId?: string;
  planningFocus: PlanningFocus;
  dietaryNeeds: string[];
  preferredBrands?: string[];
  preferredStores?: string[];
  cookingSkillLevel: CookingSkillLevel;
}

/** Request body for AI meal plan generation via /api/meals/create-from-text */
export interface CreateMealPlanRequest {
  /** 
   * Mode selection (REQUIRED for proper routing):
   * - 'quick': Single meal generation
   * - 'plan': Multi-day meal planning (default)
   * - 'diet': Goal-specific fitness programs
   */
  mode?: 'quick' | 'plan' | 'diet';
  /** Optional - for creating plans for clients */
  userId?: string;
  /** Natural language description like "Easy family dinners for 4 using Costco ingredients" */
  description: string;
  /** Duration in days (7, 14, 30) */
  duration: number;
  /** Which meals to include per day */
  mealsPerDay: {
    breakfast: boolean;
    lunch: boolean;
    dinner: boolean;
    morningSnack?: boolean;
    eveningSnack?: boolean;
    snack?: boolean;
  };
  /** Meal variety preference */
  mealVariety: MealVariety;
  /** Preferred stores/brands */
  preferredStores?: string[];
  /** Time per meal */
  timePerMeal: TimePerMeal;
  /** Cooking complexity */
  cookingComplexity: CookingSkillLevel;
  /** Special focus areas */
  specialFocus?: string[];
  /** Dietary restrictions */
  dietaryRestrictions?: string[];
  /** Daily calorie target */
  dailyCalorieTarget?: number;
  /** Macros target percentages */
  macrosTarget?: {
    protein: number;
    carbs: number;
    fat: number;
  };
  /** Family size / servings */
  servings?: number;
  /** Budget per meal (in dollars) */
  budgetPerMeal?: number;
  /** Family size */
  familySize?: number;
  /** Fitness goal */
  fitnessGoal?: 'weight_loss' | 'muscle_gain' | 'maintenance' | 'general_health' | 'energy' | 'gut_health' | 'anti_inflammatory';
  /** Activity level */
  activityLevel?: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active' | 'light-weight-training';
  
  // Quick mode specific
  /** Meal type for quick mode */
  mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'dessert';
  /** Cuisine type for quick mode */
  cuisineType?: string;
  /** Time constraint for quick mode */
  timeConstraint?: 'quick' | 'moderate' | 'standard' | 'slow';
  
  // ⭐ Food Preferences (for personalized meal plans)
  /** Foods user NEVER wants (picky eaters) */
  food_exclusions?: string[];
  /** Foods user LOVES (include more often) */
  favorite_foods?: string[];
  /** Auto-substitute when recipe calls for excluded food */
  ingredient_substitutions?: Record<string, string | null>;
  
  // ⭐ Progressive Enhancement (for shopping integration)
  /** User's postal/zip code - enables Level 2 (zipcode mode) */
  postal_code?: string;
  /** Preferred store ID (e.g., 'costco', 'walmart') - enables Level 3 (full mode) */
  store_preference?: string;
}

/** Single meal in a plan */
export interface PlanMeal {
  meal_id: string;
  meal_type: MealType;
  meal_name: string;
  description?: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servings: number;
  recipe_id?: string;
  prep_time_min?: number;
  cook_time_min?: number;
  cost_estimate?: string;
  ingredients?: MealIngredient[];
  instructions?: string[];
  image_url?: string;
  brand_suggestions?: string[];
  store_suggestions?: string[];
  is_kid_friendly?: boolean;
  uses_leftovers?: boolean;
  leftover_from?: string;
}

/** Single day in a meal plan */
export interface PlanDay {
  date: string;
  day_number: number;
  day_name: string;
  meals: PlanMeal[];
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  has_breakfast: boolean;
  has_lunch: boolean;
  has_dinner: boolean;
  has_snacks: boolean;
  daily_cost_estimate?: string;
  notes?: string;
}

/** Full meal plan response */
export interface MealPlanResponse {
  success: boolean;
  program_id: string;
  name: string;
  description: string;
  duration_days: number;
  servings: number;
  created_at: string;
  days: PlanDay[];
  summary: {
    total_meals: number;
    avg_calories_per_day: number;
    avg_protein_per_day: number;
    avg_cost_per_day?: string;
    total_cost_estimate?: string;
    shopping_list_available: boolean;
  };
  preferences_used: {
    stores: string[];
    dietary_restrictions: string[];
    cooking_skill: string;
    meal_variety: string;
  };
}

// ============= PROGRESSIVE ENHANCEMENT TYPES =============

/** Enhancement level for meal plans */
export type EnhancementLevel = 'basic' | 'zipcode' | 'full';

/** Store available in user's area */
export interface AvailableStore {
  id: string;
  name: string;
  distance_mi?: number;
  supports_instacart: boolean;
  estimated_total_cost?: string;
  logo_url?: string;
  address?: string;
}

/** Enhanced ingredient with Instacart data */
export interface EnhancedIngredient extends MealIngredient {
  /** Real brand from store (in full mode) */
  brand?: string;
  /** Actual or estimated price */
  price?: number;
  /** Store aisle location */
  aisle?: string;
  /** Instacart product ID (full mode only) */
  instacart_product_id?: string | null;
  /** Product availability (full mode only) */
  available?: boolean | null;
  /** Direct product URL */
  product_url?: string;
}

/** Shopping data for enhanced meal plan */
export interface ShoppingData {
  total_estimated_cost: string;
  instacart_cart_url?: string;
  shopping_list_url: string;
  estimated_delivery_fee?: string;
  minimum_order?: string;
  meets_minimum?: boolean;
}

/** Next step action for progressive enhancement */
export interface NextStepAction {
  action: 'select_store' | 'add_zipcode' | 'checkout';
  endpoint: string;
  description: string;
}

/** Enhanced meal plan response with progressive enhancement */
export interface EnhancedMealPlanResponse extends MealPlanResponse {
  /** Current enhancement level */
  enhancement_level: EnhancementLevel;
  /** Whether shopping cart is ready */
  shopping_ready: boolean;
  /** Whether plan can be enhanced further */
  can_enhance: boolean;
  /** User's postal code (if provided) */
  postal_code?: string;
  /** Selected store (if provided) */
  store_preference?: string;
  /** Requested store that wasn't available */
  requested_store?: string;
  /** Stores available in user's area (zipcode/full modes) */
  available_stores?: AvailableStore[];
  /** Shopping data (full mode) */
  shopping?: ShoppingData;
  /** Warning message (e.g., store not available) */
  warning?: string;
  /** Next step for progressive enhancement */
  next_step?: NextStepAction;
}

/** Request to enhance meal plan with shopping setup */
export interface ShoppingSetupRequest {
  /** User's postal/zip code */
  postal_code?: string;
  /** Preferred store ID */
  store_preference?: string;
}

/** User's saved shopping preferences */
export interface UserShoppingPreferences {
  user_id: string;
  postal_code?: string;
  store_preference?: string;
  available_stores?: AvailableStore[];
  last_updated?: string;
}

/** Calendar view response */
export interface MealCalendarResponse {
  success: boolean;
  program_id: string;
  program_name: string;
  start_date: string;
  end_date: string;
  calendar_days: CalendarDay[];
  summary: CalendarSummary;
}

/** Single day in calendar view */
export interface CalendarDay {
  date: string;
  day_number: number;
  day_name: string;
  meals: Array<{
    meal_id: string;
    meal_type: MealType;
    meal_name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    servings: number;
    recipe_id?: string;
  }>;
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  has_breakfast: boolean;
  has_lunch: boolean;
  has_dinner: boolean;
  has_snacks: boolean;
}

/** Calendar summary stats */
export interface CalendarSummary {
  total_days: number;
  avg_calories_per_day: number;
  avg_protein_per_day: number;
  total_calories: number;
  days_with_breakfast: number;
  days_with_lunch: number;
  days_with_dinner: number;
  days_with_snacks: number;
}

/** Meal template */
export interface MealTemplate {
  template_id: string;
  name: string;
  description: string;
  category: MealType;
  nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber?: number;
  };
  ingredients: MealIngredient[];
  tags: string[];
  preparation_time: number;
  cooking_time: number;
  servings: number;
  difficulty: CookingSkillLevel;
  image_url?: string;
}

/** Ingredient in a meal */
export interface MealIngredient {
  name: string;
  amount: number;
  unit: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  category?: string;
  brand_suggestion?: string;
  store_suggestion?: string;
}

/** Scanned recipe result */
export interface ScannedRecipe {
  meal_name: string;
  ingredients: MealIngredient[];
  nutrition_facts: {
    per_serving: {
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
      fiber?: number;
    };
  };
  instructions: Array<{ step: number; text: string }>;
  suggested_tags: string[];
  servings?: number;
  prep_time_min?: number;
  cook_time_min?: number;
}

/** Shopping list item */
export interface ShoppingListItem {
  id?: string;
  name: string;
  quantity: number;
  unit: string;
  category?: 'Proteins' | 'Produce' | 'Dairy' | 'Grains' | 'Pantry' | 'Other';
  checked: boolean;
  brand_suggestion?: string;
  store_suggestion?: string;
  estimated_price?: number;
  notes?: string;
  /** Source meals this ingredient came from (for consolidated lists) */
  source_meals?: string[];
}

/** Shopping list */
export interface ShoppingList {
  list_id: string;
  user_id?: string;
  name: string;
  /** Status of the shopping list */
  status?: 'active' | 'completed' | 'archived';
  /** Associated meal plan ID (if generated from plan) */
  meal_plan_id?: string;
  duration_days?: number;
  created_at: string;
  updated_at?: string;
  items: ShoppingListItem[];
  items_by_category?: Record<string, ShoppingListItem[]>;
  total_items: number;
  checked_items?: number;
  estimated_total_cost?: number;
  instacart_url?: string;
}

/** Create shopping list request */
export interface CreateShoppingListRequest {
  userId: string;
  name: string;
  items: Array<{
    name: string;
    quantity: number;
    unit: string;
    category?: string;
    checked?: boolean;
  }>;
  mealPlanId?: string;
}

/** User's saved meal */
export interface SavedMeal {
  meal_id: string;
  name: string;
  description?: string;
  nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber?: number;
  };
  ingredients: MealIngredient[];
  tags: string[];
  notes?: string;
  is_favorite: boolean;
  times_logged: number;
  created_at: string;
  updated_at: string;
  serving_size: number;
  preparation_time?: number;
  cooking_time?: number;
  image_url?: string;
}

/** Quick template presets */
export interface QuickTemplatePreset {
  id: string;
  label: string;
  description: string;
  icon: string;
}

/** List of available quick templates */
export const QUICK_TEMPLATE_PRESETS: QuickTemplatePreset[] = [
  { id: 'easy_weeknight', label: '5 easy weeknight dinners', description: 'Quick dinners under 30 min', icon: '💡' },
  { id: 'budget_meals', label: 'Budget meals with store brands', description: 'Affordable family meals', icon: '💰' },
  { id: 'kid_lunches', label: 'Kid-friendly lunches for school', description: 'Packed lunches kids love', icon: '🎒' },
  { id: 'breakfast_prep', label: 'Quick breakfast meal prep', description: 'Make-ahead breakfasts', icon: '🍳' },
  { id: 'high_protein', label: 'High protein meals', description: 'Muscle-building meals', icon: '💪' },
  { id: 'vegetarian_week', label: 'Vegetarian week', description: 'Plant-based meal plan', icon: '🥗' },
];

class MealService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_CONFIG.baseUrl;
  }

  /**
   * Get standard headers for API calls
   * Note: Client auth headers are automatically added by fetchWithLogging
   */
  private getHeaders(authToken?: string): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
    return headers;
  }

  // ============= AI MEAL PLAN GENERATION (NEW) =============

  /**
   * Create a meal plan from natural language description
   * POST /api/meals/create-from-text (UNIVERSAL endpoint for all 3 modes)
   * 
   * Modes:
   * - 'quick': Single meal generation
   * - 'plan': Multi-day meal planning  
   * - 'diet': Goal-specific fitness programs
   * 
   * @example
   * const plan = await mealService.createMealPlanFromDescription({
   *   mode: 'plan',
   *   description: "Easy family dinners for 4 using Costco ingredients, kid-friendly, under 30 minutes",
   *   duration: 7,
   *   mealsPerDay: { breakfast: true, lunch: true, dinner: true },
   *   mealVariety: 'family_friendly',
   *   preferredStores: ['costco', 'trader_joes'],
   *   timePerMeal: 'quick',
   *   cookingComplexity: 'beginner',
   *   specialFocus: ['kid_friendly'],
   *   servings: 4
   * });
   */
  async createMealPlanFromDescription(
    request: CreateMealPlanRequest,
    authToken?: string
  ): Promise<MealPlanResponse> {
    const headers = this.getHeaders(authToken);

    // Use AbortController with longer timeout for AI meal generation (60 seconds)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    // Ensure mode is set (default to 'plan' for backwards compatibility)
    const requestWithMode = {
      ...request,
      mode: request.mode || 'plan',
    };

    console.log('[MealService] Creating meal plan with request:', JSON.stringify(requestWithMode, null, 2));

    try {
      const startTime = Date.now();
      const response = await fetchWithLogging(
        `${this.baseUrl}/api/meals/create-from-text`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify(requestWithMode),
          signal: controller.signal,
        }
      );
      
      clearTimeout(timeoutId);

      // Clone response to read body
      const clonedResponse = response.clone();
      const responseData = await clonedResponse.text();
      
      if (!response.ok) {
        console.error(`[MealService] Create meal plan failed (${response.status}):`, responseData);
        throw new Error(`Failed to create meal plan: ${response.status} - ${responseData}`);
      }
      
      // Parse JSON from original response
      const jsonData = await response.json();
      
      // Enhanced logging with compact summary
      console.log(`%c[MealService] 🔵 POST ${this.baseUrl}/api/meals/create-from-text`, 'color: #3b82f6; font-weight: bold;');
      console.log(`✅ Status: ${response.status} | Duration: ${Date.now() - startTime}ms | Size: ${responseData.length} bytes`);
      if (jsonData.days) {
        console.log(`📅 Plan: ${jsonData.days.length} days | Mode: ${requestWithMode.mode}`);
      }
      console.log(JSON.stringify(jsonData, null, 2));
      
      return jsonData;
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        console.error('[MealService] Request timed out after 60 seconds');
        throw new Error('Request timed out. Please try again.');
      }
      console.error('[MealService] Create meal plan error:', error.message);
      throw error;
    }
  }

  // ============= TODAY'S MEALS & CALENDAR =============

  /**
   * Get today's meals for quick dashboard display
   * GET /api/meals/today/:userId
   */
  async getTodaysMeals(userId: string): Promise<{
    date: string;
    meals: SavedMeal[];
    by_meal_type: {
      breakfast: { meals: SavedMeal[]; total_calories: number };
      lunch: { meals: SavedMeal[]; total_calories: number };
      dinner: { meals: SavedMeal[]; total_calories: number };
      snack: { meals: SavedMeal[]; total_calories: number };
    };
    totals: {
      calories: number;
      protein_g: number;
      carbs_g: number;
      fat_g: number;
    };
    meal_count: number;
  }> {
    try {
      const response = await fetchWithLogging(
        `${this.baseUrl}/api/meals/today/${userId}`
      );
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || "Failed to get today's meals");
      }
      
      return data.data;
    } catch (error) {
      console.error('[MealService] Error getting today\'s meals:', error);
      throw error;
    }
  }

  /**
   * Get user's active meal plan (if any)
   * GET /api/meals/active-plan/:userId
   */
  async getActiveMealPlan(userId: string): Promise<{
    has_active_plan: boolean;
    plan: MealPlanResponse | null;
  }> {
    try {
      const response = await fetchWithLogging(
        `${this.baseUrl}/api/meals/active-plan/${userId}`
      );
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to get active plan');
      }
      
      return data.data;
    } catch (error) {
      console.error('[MealService] Error getting active plan:', error);
      throw error;
    }
  }

  /**
   * Get calendar view of meals for a date range
   * GET /api/meals/calendar/:userId?start=YYYY-MM-DD&end=YYYY-MM-DD
   */
  async getCalendarDays(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<CalendarDay[]> {
    try {
      const response = await fetchWithLogging(
        `${this.baseUrl}/api/meals/calendar/${userId}?start=${startDate}&end=${endDate}`
      );
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to get calendar');
      }
      
      return data.data?.calendar_days || [];
    } catch (error) {
      console.error('[MealService] Error getting calendar:', error);
      throw error;
    }
  }

  /**
   * Get calendar view for a meal program (legacy)
   * GET /api/meal-programs/:programId/calendar
   * 
   * Use cases:
   * - Display weekly meal plans with all meals per day
   * - Show macros/calories for each day
   * - Plan grocery shopping by week
   * - Schedule meal prep reminders
   */
  async getMealPlanCalendar(
    programId: string,
    params?: {
      month?: string;
      start_date?: string;
      end_date?: string;
    },
    authToken?: string
  ): Promise<MealCalendarResponse> {
    const headers: Record<string, string> = {};
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    let queryString = '';
    if (params) {
      const queryParams = new URLSearchParams();
      if (params.month) queryParams.append('month', params.month);
      if (params.start_date) queryParams.append('start_date', params.start_date);
      if (params.end_date) queryParams.append('end_date', params.end_date);
      queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
    }

    const response = await fetchWithLogging(
      `${this.baseUrl}/api/meal-programs/${programId}/calendar${queryString}`,
      { headers }
    );
    return response.json();
  }

  /**
   * Get all days/meals for a meal program
   * GET /api/meal-programs/:programId/days
   */
  async getMealPlanDays(
    programId: string,
    params?: {
      day?: number;
      meal_type?: MealType;
    },
    authToken?: string
  ): Promise<{ days: PlanDay[]; total_days: number }> {
    const headers: Record<string, string> = {};
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    let queryString = '';
    if (params) {
      const queryParams = new URLSearchParams();
      if (params.day !== undefined) queryParams.append('day', params.day.toString());
      if (params.meal_type) queryParams.append('meal_type', params.meal_type);
      queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
    }

    const response = await fetchWithLogging(
      `${this.baseUrl}/api/meal-programs/${programId}/days${queryString}`,
      { headers }
    );
    return response.json();
  }

  /**
   * Get specific day details in a meal program
   * GET /api/meal-programs/:programId/days/:dayNumber
   */
  async getMealPlanDay(
    programId: string,
    dayNumber: number,
    authToken?: string
  ): Promise<PlanDay> {
    const headers: Record<string, string> = {};
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    const response = await fetchWithLogging(
      `${this.baseUrl}/api/meal-programs/${programId}/days/${dayNumber}`,
      { headers }
    );
    return response.json();
  }

  /**
   * Save user's meal planning preferences
   * PUT /api/users/meal-preferences
   */
  async saveMealPreferences(
    preferences: MealPlanningPreferences,
    authToken?: string
  ): Promise<{ success: boolean }> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    const response = await fetchWithLogging(
      `${this.baseUrl}/api/users/meal-preferences`,
      {
        method: 'PUT',
        headers,
        body: JSON.stringify(preferences),
      }
    );
    return response.json();
  }

  /**
   * Get user's meal planning preferences
   * GET /api/users/meal-preferences
   */
  async getMealPreferences(
    userId?: string,
    authToken?: string
  ): Promise<MealPlanningPreferences | null> {
    const headers: Record<string, string> = {};
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    const queryString = userId ? `?userId=${userId}` : '';
    const response = await fetchWithLogging(
      `${this.baseUrl}/api/users/meal-preferences${queryString}`,
      { headers }
    );
    const data = await response.json();
    return data.preferences || null;
  }

  // ============= PROGRESSIVE ENHANCEMENT =============

  /**
   * Create an enhanced meal plan with optional shopping integration
   * POST /api/meal-programs
   * 
   * Enhancement Levels:
   * - Basic: No postal_code or store_preference → generic meal plan
   * - Zipcode: postal_code only → regional pricing + available stores
   * - Full: postal_code + store_preference → real Instacart products + pricing
   * 
   * @example
   * // Basic mode (backward compatible)
   * const basic = await mealService.createEnhancedMealPlan({
   *   description: "7-day family dinners",
   *   duration: 7,
   *   servings: 4
   * });
   * 
   * // Full enhanced mode
   * const enhanced = await mealService.createEnhancedMealPlan({
   *   description: "7-day family dinners",
   *   duration: 7,
   *   servings: 4,
   *   postal_code: "90210",
   *   store_preference: "costco"
   * });
   */
  async createEnhancedMealPlan(
    request: CreateMealPlanRequest,
    authToken?: string
  ): Promise<EnhancedMealPlanResponse> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    // Validate: store_preference requires postal_code
    if (request.store_preference && !request.postal_code) {
      throw new Error('postal_code is required when store_preference is specified');
    }

    const controller = new AbortController();
    // Longer timeout for full enhancement mode (Instacart API calls)
    const timeoutMs = request.store_preference ? 90000 : 60000;
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    console.log('[MealService] Creating enhanced meal plan:', {
      enhancement_level: request.store_preference ? 'full' : (request.postal_code ? 'zipcode' : 'basic'),
      postal_code: request.postal_code,
      store_preference: request.store_preference,
    });

    try {
      const response = await fetchWithLogging(
        `${this.baseUrl}/api/meal-programs`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify(request),
          signal: controller.signal,
        }
      );
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.text();
        console.error(`[MealService] Enhanced meal plan failed (${response.status}):`, errorData);
        throw new Error(`Failed to create enhanced meal plan: ${response.status} - ${errorData}`);
      }
      
      const data: EnhancedMealPlanResponse = await response.json();
      console.log('[MealService] Enhanced meal plan created:', {
        program_id: data.program_id,
        enhancement_level: data.enhancement_level,
        shopping_ready: data.shopping_ready,
        can_enhance: data.can_enhance,
      });
      
      return data;
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Request timed out. Please try again.');
      }
      throw error;
    }
  }

  /**
   * Enhance an existing meal plan with shopping setup
   * PATCH /api/meal-programs/:programId/shopping-setup
   * 
   * Use cases:
   * - Add zipcode to Basic plan → get available stores
   * - Add store to Zipcode plan → get real products + Instacart
   * - Change store preference → re-fetch products
   * 
   * @example
   * // Step 1: Add zipcode to get stores
   * const withStores = await mealService.enhanceMealPlanShopping(
   *   'mp_123',
   *   { postal_code: '90210' }
   * );
   * 
   * // Step 2: Select store for full enhancement
   * const enhanced = await mealService.enhanceMealPlanShopping(
   *   'mp_123',
   *   { store_preference: 'costco' }
   * );
   */
  async enhanceMealPlanShopping(
    programId: string,
    setup: ShoppingSetupRequest,
    authToken?: string
  ): Promise<EnhancedMealPlanResponse> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    // Longer timeout for store selection (Instacart lookups)
    const controller = new AbortController();
    const timeoutMs = setup.store_preference ? 60000 : 30000;
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    console.log('[MealService] Enhancing meal plan shopping:', {
      programId,
      postal_code: setup.postal_code,
      store_preference: setup.store_preference,
    });

    try {
      const response = await fetchWithLogging(
        `${this.baseUrl}/api/meal-programs/${programId}/shopping-setup`,
        {
          method: 'PATCH',
          headers,
          body: JSON.stringify(setup),
          signal: controller.signal,
        }
      );
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.text();
        console.error(`[MealService] Shopping setup failed (${response.status}):`, errorData);
        throw new Error(`Failed to enhance meal plan: ${response.status} - ${errorData}`);
      }
      
      const data: EnhancedMealPlanResponse = await response.json();
      console.log('[MealService] Meal plan enhanced:', {
        enhancement_level: data.enhancement_level,
        shopping_ready: data.shopping_ready,
        available_stores: data.available_stores?.length,
      });
      
      return data;
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Request timed out. Please try again.');
      }
      throw error;
    }
  }

  /**
   * Get available stores for a postal code
   * GET /api/stores?postal_code=
   * 
   * Useful for pre-fetching stores before meal plan generation
   * or showing store selection in settings.
   */
  async getAvailableStores(
    postalCode: string,
    authToken?: string
  ): Promise<AvailableStore[]> {
    const headers: Record<string, string> = {};
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    try {
      const response = await fetchWithLogging(
        `${this.baseUrl}/api/stores?postal_code=${encodeURIComponent(postalCode)}`,
        { headers }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch stores: ${response.status}`);
      }

      const data = await response.json();
      return data.stores || [];
    } catch (error) {
      console.error('[MealService] Error getting available stores:', error);
      throw error;
    }
  }

  /**
   * Save user's shopping preferences (zipcode, store)
   * PUT /api/users/shopping-preferences
   */
  async saveShoppingPreferences(
    userId: string,
    preferences: Partial<UserShoppingPreferences>,
    authToken?: string
  ): Promise<UserShoppingPreferences> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    const response = await fetchWithLogging(
      `${this.baseUrl}/api/users/shopping-preferences`,
      {
        method: 'PUT',
        headers,
        body: JSON.stringify({ user_id: userId, ...preferences }),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to save shopping preferences: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Get user's saved shopping preferences
   * GET /api/users/shopping-preferences/:userId
   */
  async getShoppingPreferences(
    userId: string,
    authToken?: string
  ): Promise<UserShoppingPreferences | null> {
    const headers: Record<string, string> = {};
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    try {
      const response = await fetchWithLogging(
        `${this.baseUrl}/api/users/shopping-preferences/${userId}`,
        { headers }
      );

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error(`Failed to get shopping preferences: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error('[MealService] Error getting shopping preferences:', error);
      return null;
    }
  }

  // ============= SHOPPING LIST (NEW) =============

  /**
   * Create a shopping list from meal ingredients
   * POST /api/shopping-lists
   */
  async createShoppingList(
    request: CreateShoppingListRequest,
    authToken?: string
  ): Promise<ShoppingList> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    const response = await fetchWithLogging(
      `${this.baseUrl}/api/shopping-lists`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify(request),
      }
    );
    return response.json();
  }

  /**
   * Generate shopping list from a meal plan
   * POST /api/meal-programs/:programId/shopping-list
   */
  async generateShoppingListFromPlan(
    programId: string,
    params?: {
      startDay?: number;
      endDay?: number;
      preferredStores?: string[];
    },
    authToken?: string
  ): Promise<ShoppingList> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    const response = await fetchWithLogging(
      `${this.baseUrl}/api/meal-programs/${programId}/shopping-list`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify(params || {}),
      }
    );
    return response.json();
  }

  /**
   * Get a shopping list by ID
   * GET /api/shopping-lists/:listId
   */
  async getShoppingList(
    listId: string,
    authToken?: string
  ): Promise<ShoppingList> {
    const headers: Record<string, string> = {};
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    const response = await fetchWithLogging(
      `${this.baseUrl}/api/shopping-lists/${listId}`,
      { headers }
    );
    return response.json();
  }

  /**
   * Update shopping list (check items, add items, etc.)
   * PUT /api/shopping-lists/:listId
   */
  async updateShoppingList(
    listId: string,
    updates: {
      items?: ShoppingListItem[];
      name?: string;
    },
    authToken?: string
  ): Promise<ShoppingList> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    const response = await fetchWithLogging(
      `${this.baseUrl}/api/shopping-lists/${listId}`,
      {
        method: 'PUT',
        headers,
        body: JSON.stringify(updates),
      }
    );
    return response.json();
  }

  /**
   * Send shopping list to Instacart
   * POST /api/shopping-lists/:listId/instacart
   */
  async sendToInstacart(
    listId: string,
    params?: {
      storeType?: string;
      budget?: string;
    },
    authToken?: string
  ): Promise<{ cart_url: string; success: boolean }> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    const response = await fetchWithLogging(
      `${this.baseUrl}/api/shopping-lists/${listId}/instacart`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          preferences: params,
        }),
      }
    );
    return response.json();
  }

  /**
   * Get user's shopping lists
   * GET /api/shopping-lists?userId=
   */
  async getUserShoppingLists(
    userId: string,
    params?: {
      status?: 'active' | 'completed' | 'all';
      limit?: number;
    },
    authToken?: string
  ): Promise<ShoppingList[]> {
    const headers: Record<string, string> = {};
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    let url = `${this.baseUrl}/api/shopping-lists?userId=${userId}`;
    if (params?.status) url += `&status=${params.status}`;
    if (params?.limit) url += `&limit=${params.limit}`;

    const response = await fetchWithLogging(url, { headers });
    const data = await response.json();
    return data.lists || [];
  }

  /**
   * Delete a shopping list
   * DELETE /api/shopping-lists/:listId
   */
  async deleteShoppingList(
    listId: string,
    authToken?: string
  ): Promise<{ success: boolean }> {
    const headers: Record<string, string> = {};
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    const response = await fetchWithLogging(
      `${this.baseUrl}/api/shopping-lists/${listId}`,
      {
        method: 'DELETE',
        headers,
      }
    );
    return response.json();
  }

  // ============= MEAL PROGRAMS (LEGACY + ENHANCED) =============

  /**
   * List all meal programs with optional filtering
   */
  async listPrograms(params?: {
    diet?: DietType;
    limit?: number;
  }): Promise<MealProgram[]> {
    const queryString = params
      ? '?' + new URLSearchParams(params as any).toString()
      : '';
    const response = await fetchWithLogging(
      `${this.baseUrl}/api/meal-programs${queryString}`
    );
    const data = await response.json();
    return data.data || [];
  }

  /**
   * Get specific meal program
   */
  async getProgram(programId: string): Promise<MealProgram> {
    const response = await fetchWithLogging(
      `${this.baseUrl}/api/meal-programs/${programId}`
    );
    const data = await response.json();
    return data.data;
  }

  /**
   * Create a new meal program (legacy)
   * @deprecated Use createMealPlanFromDescription for AI-powered plan generation
   */
  async createProgram(program: MealProgram): Promise<any> {
    const response = await fetchWithLogging(`${this.baseUrl}/api/meal-programs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(program),
    });
    return response.json();
  }

  /**
   * Update meal program
   */
  async updateProgram(
    programId: string,
    updates: Partial<MealProgram>
  ): Promise<any> {
    const response = await fetchWithLogging(
      `${this.baseUrl}/api/meal-programs/${programId}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      }
    );
    return response.json();
  }

  /**
   * Delete meal program
   */
  async deleteProgram(programId: string): Promise<any> {
    const response = await fetchWithLogging(
      `${this.baseUrl}/api/meal-programs/${programId}`,
      {
        method: 'DELETE',
      }
    );
    return response.json();
  }

  // ============= RECIPES =============

  /**
   * Search recipes with filters
   */
  async searchRecipes(params?: {
    q?: string;
    diet?: DietType;
    limit?: number;
  }): Promise<Recipe[]> {
    const queryString = params
      ? '?' + new URLSearchParams(params as any).toString()
      : '';
    const response = await fetchWithLogging(
      `${this.baseUrl}/api/recipes/search${queryString}`
    );
    const data = await response.json();
    return data.data || [];
  }

  /**
   * Get specific recipe details
   */
  async getRecipe(recipeId: string): Promise<Recipe> {
    const response = await fetchWithLogging(`${this.baseUrl}/api/recipes/${recipeId}`);
    const data = await response.json();
    return data.data;
  }

  /**
   * Create custom recipe
   */
  async createRecipe(recipe: Recipe): Promise<any> {
    const response = await fetchWithLogging(`${this.baseUrl}/api/recipes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(recipe),
    });
    return response.json();
  }

  // ============= NUTRITION CALCULATION =============

  /**
   * Calculate nutrition for a list of ingredients
   */
  async calculateNutrition(ingredients: Array<{
    item: string;
    amount: string;
  }>): Promise<NutritionCalculation> {
    const response = await fetchWithLogging(
      `${this.baseUrl}/api/meals/calculate-nutrition`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ingredients }),
      }
    );
    const data = await response.json();
    return data.data;
  }

  // ============= CUSTOM MEALS MANAGEMENT =============

  /**
   * Create a custom meal (user-specific)
   * IMPORTANT: Meals must be saved to DB before sending to Instacart for deep links to work
   */
  async createMeal(userId: string, mealData: {
    name: string;
    meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
    ingredients: Array<{ name: string; amount: number; unit: string }>;
    instructions?: string[];
    nutrition?: { calories: number; protein: number; carbs: number; fat: number };
    tags?: string[];
    notes?: string;
    serving_size?: number;
    prep_time?: number;
    cook_time?: number;
    servings?: number;
  }): Promise<{ meal_id: string; id: string }> {
    try {
      const response = await fetchWithLogging(`${this.baseUrl}/api/meals/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          ...mealData,
          // Map fields to API expected format
          calories: mealData.nutrition?.calories,
          protein_g: mealData.nutrition?.protein,
          carbs_g: mealData.nutrition?.carbs,
          fat_g: mealData.nutrition?.fat,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to create meal');
      }

      // Return both meal_id and id for flexibility
      return { 
        meal_id: result.meal_id || result.meal?.id, 
        id: result.meal?.id || result.meal_id 
      };
    } catch (error) {
      console.error('Error creating meal:', error);
      throw error;
    }
  }

  /**
   * Save all meals from a meal plan to the database
   * This is REQUIRED before sending to Instacart so deep links work when user returns
   * 
   * @returns Array of saved meal IDs
   */
  async saveMealsFromPlan(
    userId: string, 
    plan: MealPlanResponse
  ): Promise<string[]> {
    const savedMealIds: string[] = [];
    
    if (!plan.days || plan.days.length === 0) {
      console.warn('[MealService] No days in meal plan to save');
      return savedMealIds;
    }

    console.log(`[MealService] Saving ${plan.days.length} days of meals to database...`);

    for (const day of plan.days) {
      if (!day.meals) continue;
      
      for (const meal of day.meals) {
        try {
          const result = await this.createMeal(userId, {
            name: meal.meal_name,
            meal_type: meal.meal_type as 'breakfast' | 'lunch' | 'dinner' | 'snack',
            ingredients: (meal.ingredients || []).map(ing => ({
              name: ing.name,
              amount: ing.amount || 1,
              unit: ing.unit || 'item',
            })),
            instructions: meal.instructions || [],
            nutrition: {
              calories: meal.calories || 0,
              protein: meal.protein || 0,
              carbs: meal.carbs || 0,
              fat: meal.fat || 0,
            },
            tags: [],
            prep_time: meal.prep_time_min,
            cook_time: meal.cook_time_min,
            servings: meal.servings,
          });
          
          savedMealIds.push(result.meal_id || result.id);
          console.log(`[MealService] Saved meal: ${meal.meal_name} -> ${result.meal_id || result.id}`);
        } catch (error) {
          console.error(`[MealService] Failed to save meal ${meal.meal_name}:`, error);
          // Continue with other meals even if one fails
        }
      }
    }

    console.log(`[MealService] Saved ${savedMealIds.length} meals to database`);
    return savedMealIds;
  }

  /**
   * Get all meals for a user with filtering
   * Uses Meal Diary API: GET /api/users/:userId/meals/diary
   * 
   * CRITICAL: This endpoint is on user.wihy.ai, NOT services.wihy.ai
   * Using services.wihy.ai returns 410 Gone (deprecated endpoint)
   */
  async getUserMeals(userId: string, filters?: {
    meal_type?: string;
    limit?: number;
    offset?: number;
  }): Promise<{
    meals: SavedMeal[];
    total: number;
    has_more: boolean;
  }> {
    try {
      const params = new URLSearchParams();
      
      if (filters?.meal_type) params.append('meal_type', filters.meal_type);
      if (filters?.limit) params.append('limit', filters.limit.toString());
      if (filters?.offset) params.append('offset', filters.offset.toString());

      // Use user.wihy.ai for meal diary endpoint (not services.wihy.ai)
      const url = `${API_CONFIG.userUrl}/api/users/${userId}/meals/diary${params.toString() ? '?' + params.toString() : ''}`;
      
      const response = await fetchWithLogging(url);
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to fetch meals');
      }

      // Convert Meal Diary API response to expected format
      const meals = (result.recent_meals || []).map((meal: any) => ({
        meal_id: meal.meal_id,
        user_id: meal.user_id || userId,
        name: meal.name,
        nutrition: meal.nutrition,
        ingredients: Array.isArray(meal.ingredients) 
          ? meal.ingredients.filter((ing: any) => typeof ing === 'object' && 'amount' in ing)
          : [],
        tags: meal.tags || [],
        notes: '',
        is_favorite: meal.is_favorite || false,
        times_logged: meal.times_logged || 0,
        created_at: meal.created_at || new Date().toISOString(),
        updated_at: meal.updated_at || new Date().toISOString(),
        serving_size: meal.serving_size || 1,
        preparation_time: meal.preparation_time,
        cooking_time: meal.cooking_time,
      })) as SavedMeal[];

      return {
        meals,
        total: result.total_meals || meals.length,
        has_more: result.has_more || false,
      };
    } catch (error) {
      console.error('Error fetching meals:', error);
      throw error;
    }
  }

  /**
   * Get a specific meal by ID
   * GET /api/meals/:mealId
   */
  async getMeal(mealId: string, authToken?: string): Promise<SavedMeal> {
    const headers: Record<string, string> = {};
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    const response = await fetchWithLogging(
      `${this.baseUrl}/api/meals/${mealId}`,
      { headers }
    );
    const data = await response.json();
    return data.meal || data;
  }

  /**
   * Update an existing meal
   */
  async updateMeal(
    mealId: string,
    userId: string,
    updates: Partial<SavedMeal>
  ): Promise<void> {
    try {
      const response = await fetchWithLogging(`${this.baseUrl}/api/meals/${mealId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          ...updates,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to update meal');
      }
    } catch (error) {
      console.error('Error updating meal:', error);
      throw error;
    }
  }

  /**
   * Delete a meal
   */
  async deleteMeal(mealId: string, userId: string): Promise<void> {
    try {
      const response = await fetchWithLogging(`${this.baseUrl}/api/meals/${mealId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to delete meal');
      }
    } catch (error) {
      console.error('Error deleting meal:', error);
      throw error;
    }
  }

  // ============= TEMPLATES =============

  /**
   * Get meal templates
   * GET /api/meals/templates
   */
  async getTemplates(
    category?: string,
    tags?: string
  ): Promise<MealTemplate[]> {
    try {
      const params = new URLSearchParams();
      
      if (category) params.append('category', category);
      if (tags) params.append('tags', tags);

      const url = `${this.baseUrl}/api/meals/templates${params.toString() ? '?' + params.toString() : ''}`;
      
      const response = await fetchWithLogging(url);
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to fetch templates');
      }

      return result.templates;
    } catch (error) {
      console.error('Error fetching templates:', error);
      throw error;
    }
  }

  /**
   * Get a specific template by ID
   * GET /api/meals/templates/:templateId
   */
  async getTemplate(templateId: string): Promise<MealTemplate> {
    const response = await fetchWithLogging(
      `${this.baseUrl}/api/meals/templates/${templateId}`
    );
    const data = await response.json();
    return data.template || data;
  }

  // ============= RECIPE SCANNING =============

  /**
   * Scan a recipe from an image
   * POST /api/scan/recipe
   */
  async scanRecipe(imageUri: string, userId?: string): Promise<ScannedRecipe> {
    try {
      // Check if it's already base64 data
      let imageData = imageUri;
      
      if (imageUri.startsWith('data:image')) {
        // Already base64 encoded, use as-is
        imageData = imageUri;
      } else if (imageUri.startsWith('file://') || imageUri.startsWith('/')) {
        // For React Native, use FormData with file URI
        const formData = new FormData();
        
        const filename = imageUri.split('/').pop() || 'recipe.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';

        formData.append('image', {
          uri: imageUri,
          name: filename,
          type,
        } as any);

        if (userId) {
          formData.append('user_id', userId);
        }

        const response = await fetchWithLogging(`${this.baseUrl}/api/scan/recipe`, {
          method: 'POST',
          body: formData,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.error || 'Failed to scan recipe');
        }

        return result.analysis || result.data || result;
      }
      
      // Use JSON body for base64 images
      const response = await fetchWithLogging(`${this.baseUrl}/api/scan/recipe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          image: imageData,
          extract_nutrition: true,
          extract_ingredients: true,
          extract_instructions: true,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to scan recipe');
      }

      // Normalize response format
      return {
        meal_name: result.meal_name || result.data?.meal_name || 'Scanned Recipe',
        ingredients: result.ingredients || result.data?.ingredients || [],
        nutrition_facts: result.nutrition_facts || result.nutrition || result.data?.nutrition || {
          per_serving: { calories: 0, protein: 0, carbs: 0, fat: 0 },
        },
        instructions: result.instructions || result.data?.instructions || [],
        suggested_tags: result.suggested_tags || result.tags || [],
        servings: result.servings || result.data?.servings || 1,
        prep_time_min: result.prep_time || result.prep_time_min || 0,
        cook_time_min: result.cook_time || result.cook_time_min || 0,
      };
    } catch (error) {
      console.error('Error scanning recipe:', error);
      throw error;
    }
  }

  // ============= HEALTH CONDITION MEALS =============

  /**
   * Get list of supported health conditions
   * GET /api/meals/conditions
   */
  async getHealthConditions(): Promise<string[]> {
    try {
      const response = await fetchWithLogging(`${this.baseUrl}/api/meals/conditions`);
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to get conditions');
      }
      
      return data.conditions || [];
    } catch (error) {
      console.error('[MealService] Error getting conditions:', error);
      throw error;
    }
  }

  /**
   * Get meals filtered by health conditions
   * GET /api/meals/for-condition?conditions=diabetes,hypertension&category=dinner
   */
  async getMealsForCondition(
    conditions: string[],
    options?: {
      category?: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'all';
      count?: number;
    }
  ): Promise<{ meals: SavedMeal[] }> {
    try {
      const params = new URLSearchParams();
      params.append('conditions', conditions.join(','));
      if (options?.category) params.append('category', options.category);
      if (options?.count) params.append('count', options.count.toString());

      const response = await fetchWithLogging(
        `${this.baseUrl}/api/meals/for-condition?${params.toString()}`
      );
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to get condition meals');
      }
      
      return { meals: data.meals || [] };
    } catch (error) {
      console.error('[MealService] Error getting condition meals:', error);
      throw error;
    }
  }

  /**
   * Get a full day meal plan optimized for health conditions
   * GET /api/meals/day-plan?conditions=diabetes&includeSnacks=true
   */
  async getDayPlanForConditions(
    conditions: string[],
    includeSnacks = true
  ): Promise<{
    breakfast: SavedMeal;
    lunch: SavedMeal;
    dinner: SavedMeal;
    snacks?: SavedMeal[];
    daily_totals: {
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
    };
  }> {
    try {
      const params = new URLSearchParams();
      params.append('conditions', conditions.join(','));
      params.append('includeSnacks', includeSnacks.toString());

      const response = await fetchWithLogging(
        `${this.baseUrl}/api/meals/day-plan?${params.toString()}`
      );
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to get day plan');
      }
      
      return data;
    } catch (error) {
      console.error('[MealService] Error getting day plan:', error);
      throw error;
    }
  }

  /**
   * Get breakfast meals (optionally filtered by conditions)
   * GET /api/meals/breakfast?conditions=diabetes
   */
  async getBreakfastMeals(conditions?: string[]): Promise<{ meals: SavedMeal[] }> {
    try {
      const params = conditions?.length 
        ? `?conditions=${conditions.join(',')}`
        : '';
      
      const response = await fetchWithLogging(
        `${this.baseUrl}/api/meals/breakfast${params}`
      );
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to get breakfast meals');
      }
      
      return { meals: data.meals || [] };
    } catch (error) {
      console.error('[MealService] Error getting breakfast meals:', error);
      throw error;
    }
  }

  /**
   * Get lunch meals (optionally filtered by conditions)
   * GET /api/meals/lunch?conditions=diabetes
   */
  async getLunchMeals(conditions?: string[]): Promise<{ meals: SavedMeal[] }> {
    try {
      const params = conditions?.length 
        ? `?conditions=${conditions.join(',')}`
        : '';
      
      const response = await fetchWithLogging(
        `${this.baseUrl}/api/meals/lunch${params}`
      );
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to get lunch meals');
      }
      
      return { meals: data.meals || [] };
    } catch (error) {
      console.error('[MealService] Error getting lunch meals:', error);
      throw error;
    }
  }

  /**
   * Get dinner meals (optionally filtered by conditions)
   * GET /api/meals/dinner?conditions=diabetes
   */
  async getDinnerMeals(conditions?: string[]): Promise<{ meals: SavedMeal[] }> {
    try {
      const params = conditions?.length 
        ? `?conditions=${conditions.join(',')}`
        : '';
      
      const response = await fetchWithLogging(
        `${this.baseUrl}/api/meals/dinner${params}`
      );
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to get dinner meals');
      }
      
      return { meals: data.meals || [] };
    } catch (error) {
      console.error('[MealService] Error getting dinner meals:', error);
      throw error;
    }
  }

  // ============= FAVORITES & LOGGING =============

  /**
   * Toggle favorite status for a meal
   */
  async toggleFavorite(mealId: string, userId: string, currentStatus: boolean): Promise<void> {
    return this.updateMeal(mealId, userId, {
      is_favorite: !currentStatus,
    } as any);
  }

  /**
   * Log a meal to nutrition tracking
   */
  async logMeal(
    userId: string,
    mealId: string,
    servings: number = 1,
    mealType: MealType = 'lunch'
  ): Promise<void> {
    try {
      const response = await fetchWithLogging(`${this.baseUrl}/api/nutrition-tracking/log-meal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          recipeId: mealId,
          servings,
          mealType,
          timestamp: new Date().toISOString(),
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to log meal');
      }
    } catch (error) {
      console.error('Error logging meal:', error);
      throw error;
    }
  }

  /**
   * Mark a meal as eaten on a specific date
   * POST /api/meal-programs/:programId/days/:dayNumber/meals/:mealId/eaten
   */
  async markMealAsEaten(
    programId: string,
    dayNumber: number,
    mealId: string,
    authToken?: string
  ): Promise<{ success: boolean }> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    const response = await fetchWithLogging(
      `${this.baseUrl}/api/meal-programs/${programId}/days/${dayNumber}/meals/${mealId}/eaten`,
      {
        method: 'POST',
        headers,
      }
    );
    return response.json();
  }

  // ============= USER MEAL PLANS =============

  /**
   * Get user's saved meal plans
   * GET /api/users/:userId/meal-plans
   * Endpoint: user.wihy.ai (NOT services.wihy.ai)
   */
  async getUserMealPlans(
    userId?: string,
    authToken?: string
  ): Promise<Array<{
    program_id: string;
    name: string;
    description: string;
    duration_days: number;
    created_at: string;
    is_active: boolean;
    completion_percentage: number;
  }>> {
    if (!userId) {
      throw new Error('userId is required for getUserMealPlans');
    }

    const headers: Record<string, string> = {};
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    // Use user.wihy.ai endpoint (not services.wihy.ai)
    const response = await fetchWithLogging(
      `${API_CONFIG.userUrl}/api/users/${userId}/meal-plans`,
      { headers }
    );
    const data = await response.json();
    return data.programs || data.data || [];
  }

  /**
   * Delete a meal plan
   * DELETE /api/meal-programs/:programId
   */
  async deleteMealPlan(
    programId: string,
    authToken?: string
  ): Promise<{ success: boolean }> {
    const headers: Record<string, string> = {};
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    const response = await fetchWithLogging(
      `${this.baseUrl}/api/meal-programs/${programId}`,
      {
        method: 'DELETE',
        headers,
      }
    );
    return response.json();
  }

  // ============= DIETS & FOOD PREFERENCES =============

  /**
   * Get all available diet types
   * Uses built-in diet options (no backend endpoint exists)
   * 
   * Returns list of diets with their descriptions, icons, and categories
   */
  async getDiets(): Promise<DietOption[]> {
    // Use built-in diet options - no backend endpoint available
    return this.getBuiltInDietOptions();
  }

  /**
   * Built-in diet options fallback
   */
  private getBuiltInDietOptions(): DietOption[] {
    return [
      // Restrictions (plant-based/animal-based)
      { id: 'vegetarian', label: 'Vegetarian', icon: 'leaf-outline', type: 'restriction', description: 'Plant-based, excludes meat but includes dairy/eggs' },
      { id: 'vegan', label: 'Vegan', icon: 'flower-outline', type: 'restriction', description: 'Strictly plant-based, no animal products' },
      { id: 'pescatarian', label: 'Pescatarian', icon: 'fish-outline', type: 'restriction', description: 'Vegetarian + fish/seafood' },
      
      // Macronutrient-focused
      { id: 'keto', label: 'Ketogenic', icon: 'flame-outline', type: 'macronutrient', description: 'Very low-carb, high-fat (5-10% carbs, 70-80% fats)' },
      { id: 'low_carb', label: 'Low Carb', icon: 'trending-down-outline', type: 'macronutrient', description: 'Reduced carbs (10-25%) without strict ketosis' },
      { id: 'high_protein', label: 'High Protein', icon: 'barbell-outline', type: 'macronutrient', description: '30-40% protein for muscle building' },
      
      // Ancestral/Regional
      { id: 'paleo', label: 'Paleo', icon: 'bonfire-outline', type: 'ancestral', description: 'No grains, legumes, dairy, processed foods' },
      { id: 'mediterranean', label: 'Mediterranean', icon: 'boat-outline', type: 'regional', description: 'Olive oil, fish, vegetables, whole grains' },
      
      // Elimination diets
      { id: 'whole30', label: 'Whole30', icon: 'calendar-outline', type: 'elimination', description: '30-day elimination of sugar, alcohol, grains, legumes, dairy' },
      { id: 'carnivore', label: 'Carnivore', icon: 'restaurant-outline', type: 'elimination', description: 'Animal products only, no plants' },
      
      // Medical/Therapeutic
      { id: 'gluten_free', label: 'Gluten-Free', icon: 'ban-outline', type: 'medical', description: 'Eliminates wheat, barley, rye' },
      { id: 'dairy_free', label: 'Dairy-Free', icon: 'water-outline', type: 'medical', description: 'Eliminates all dairy products' },
      { id: 'low_sodium', label: 'Low Sodium', icon: 'water-outline', type: 'medical', description: 'Restricts sodium (1500-2300mg daily)' },
      { id: 'diabetic_friendly', label: 'Diabetic Friendly', icon: 'pulse-outline', type: 'medical', description: 'Blood sugar management, low glycemic' },
      { id: 'fodmap_low', label: 'Low FODMAP', icon: 'medical-outline', type: 'medical', description: 'Reduces fermentable carbs for IBS' },
      { id: 'anti_inflammatory', label: 'Anti-Inflammatory', icon: 'shield-checkmark-outline', type: 'therapeutic', description: 'Reduces chronic inflammation' },
      
      // Timing-based
      { id: 'intermittent_fasting', label: 'Intermittent Fasting', icon: 'time-outline', type: 'timing', description: 'Eating windows (16:8, 18:6, OMAD)' },
      
      // Spiritual
      { id: 'daniel_fast', label: 'Daniel Fast', icon: 'book-outline', type: 'spiritual', description: 'Biblical fast - vegetables, fruits, water only' },
    ];
  }

  /**
   * Get user's food preferences (likes/dislikes)
   * GET /api/users/:userId/food-preferences
   */
  async getUserFoodPreferences(
    userId: string,
    authToken?: string
  ): Promise<UserFoodPreferences | null> {
    try {
      const headers: Record<string, string> = {};
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const response = await fetchWithLogging(
        `${this.baseUrl}/api/users/${userId}/food-preferences`,
        { headers }
      );
      const data = await response.json();
      
      if (data.success && data.preferences) {
        return data.preferences;
      }
      
      return null;
    } catch (error) {
      console.error('[MealService] Error fetching food preferences:', error);
      return null;
    }
  }

  /**
   * Save user's food preferences
   * PUT /api/users/:userId/food-preferences
   */
  async saveUserFoodPreferences(
    userId: string,
    preferences: Partial<UserFoodPreferences>,
    authToken?: string
  ): Promise<{ success: boolean; preferences: UserFoodPreferences }> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    const response = await fetchWithLogging(
      `${this.baseUrl}/api/users/${userId}/food-preferences`,
      {
        method: 'PUT',
        headers,
        body: JSON.stringify(preferences),
      }
    );
    return response.json();
  }

  /**
   * Add a single food exclusion (Quick "I don't like this" action)
   * POST /api/users/:userId/food-preferences/exclusions
   */
  async addFoodExclusion(
    userId: string,
    exclusion: {
      food: string;
      reason?: 'taste' | 'texture' | 'allergy' | 'intolerance';
      substitute?: string;
    },
    authToken?: string
  ): Promise<{ success: boolean; total_exclusions: number }> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    const response = await fetchWithLogging(
      `${this.baseUrl}/api/users/${userId}/food-preferences/exclusions`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify(exclusion),
      }
    );
    return response.json();
  }

  /**
   * Remove a food exclusion
   * DELETE /api/users/:userId/food-preferences/exclusions/:food
   */
  async removeFoodExclusion(
    userId: string,
    food: string,
    authToken?: string
  ): Promise<{ success: boolean; total_exclusions: number }> {
    const headers: Record<string, string> = {};
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    const response = await fetchWithLogging(
      `${this.baseUrl}/api/users/${userId}/food-preferences/exclusions/${encodeURIComponent(food)}`,
      {
        method: 'DELETE',
        headers,
      }
    );
    return response.json();
  }

  /**
   * Get common food exclusions (for UI suggestions)
   * GET /api/meals/common-exclusions
   */
  async getCommonExclusions(): Promise<CommonExclusions> {
    try {
      const response = await fetchWithLogging(
        `${this.baseUrl}/api/meals/common-exclusions`
      );
      const data = await response.json();
      
      if (data.success) {
        return data;
      }
      
      // Return built-in common exclusions if API not available
      return this.getBuiltInCommonExclusions();
    } catch (error) {
      console.error('[MealService] Error fetching common exclusions:', error);
      return this.getBuiltInCommonExclusions();
    }
  }

  /**
   * Built-in common exclusions fallback
   */
  private getBuiltInCommonExclusions(): CommonExclusions {
    return {
      categories: {
        dairy: ['cottage cheese', 'blue cheese', 'feta', 'goat cheese', 'milk'],
        proteins: ['liver', 'sardines', 'anchovies', 'tofu', 'tempeh', 'seitan'],
        vegetables: ['brussels sprouts', 'beets', 'okra', 'eggplant', 'mushrooms', 'onions', 'bell peppers'],
        seafood: ['fish', 'shrimp', 'shellfish', 'oysters', 'mussels'],
        textures: ['mushy foods', 'slimy foods', 'chewy foods'],
        flavors: ['bitter foods', 'sour foods', 'very spicy foods'],
      },
      most_common: [
        'cottage cheese',
        'liver',
        'brussels sprouts',
        'tofu',
        'fish',
        'mushrooms',
        'onions',
        'bell peppers',
        'eggs',
        'oatmeal',
      ],
    };
  }

  // ============= SNACKS & SPECIAL MEALS =============

  /**
   * Get healthy snack recipes (NOVA 1-2 only)
   * GET /api/meals/snacks?count=5&type=all
   */
  async getSnacks(
    count: number = 5,
    type: 'sweet' | 'savory' | 'all' = 'all'
  ): Promise<{ meals: SavedMeal[] }> {
    try {
      const response = await fetchWithLogging(
        `${this.baseUrl}/api/meals/snacks?count=${count}&type=${type}`
      );
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to get snacks');
      }
      
      return { meals: data.meals || data.snacks || [] };
    } catch (error) {
      console.error('[MealService] Error getting snacks:', error);
      throw error;
    }
  }

  /**
   * Get soup recipes (NOVA 1-2 only)
   * GET /api/meals/soups?count=4&type=all
   */
  async getSoups(
    count: number = 4,
    type: 'hearty' | 'creamy' | 'light' | 'all' = 'all'
  ): Promise<{ meals: SavedMeal[] }> {
    try {
      const response = await fetchWithLogging(
        `${this.baseUrl}/api/meals/soups?count=${count}&type=${type}`
      );
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to get soups');
      }
      
      return { meals: data.meals || data.soups || [] };
    } catch (error) {
      console.error('[MealService] Error getting soups:', error);
      throw error;
    }
  }

  // ============= GUIDES & EDUCATIONAL CONTENT =============

  /**
   * Get NOVA food classification guide
   * GET /api/meals/nova-guide
   */
  async getNovaGuide(): Promise<{
    nova_1: { description: string; examples: string[] };
    nova_2: { description: string; examples: string[] };
    nova_3: { description: string; examples: string[] };
    nova_4: { description: string; examples: string[]; harmful_additives: string[] };
  }> {
    try {
      const response = await fetchWithLogging(
        `${this.baseUrl}/api/meals/nova-guide`
      );
      return response.json();
    } catch (error) {
      console.error('[MealService] Error getting NOVA guide:', error);
      throw error;
    }
  }

  /**
   * Get intuitive eating guidelines
   * GET /api/meals/intuitive-eating
   */
  async getIntuitiveEatingGuide(): Promise<{
    hunger_scale: { level: number; description: string }[];
    ideal_eating_range: { start: number; stop: number };
    tips: string[];
  }> {
    try {
      const response = await fetchWithLogging(
        `${this.baseUrl}/api/meals/intuitive-eating`
      );
      return response.json();
    } catch (error) {
      console.error('[MealService] Error getting intuitive eating guide:', error);
      throw error;
    }
  }

  /**
   * Get fasting protocols
   * GET /api/meals/fasting-protocols?protocol=16:8
   */
  async getFastingProtocols(
    protocol?: '16:8' | '18:6' | '20:4' | 'circadian'
  ): Promise<{
    protocols: Array<{
      id: string;
      name: string;
      fasting_hours: number;
      eating_window: number;
      description: string;
      benefits: string[];
      best_for: string;
    }>;
  }> {
    try {
      const queryString = protocol ? `?protocol=${protocol}` : '';
      const response = await fetchWithLogging(
        `${this.baseUrl}/api/meals/fasting-protocols${queryString}`
      );
      return response.json();
    } catch (error) {
      console.error('[MealService] Error getting fasting protocols:', error);
      throw error;
    }
  }

  /**
   * Get seasoning library & recommendations
   * GET /api/meals/seasoning-library
   */
  async getSeasoningLibrary(): Promise<{
    herbs: Array<{ name: string; pairs_with: string[]; cuisines: string[] }>;
    spices: Array<{ name: string; pairs_with: string[]; cuisines: string[] }>;
    blends: Array<{ name: string; ingredients: string[]; best_for: string[] }>;
  }> {
    try {
      const response = await fetchWithLogging(
        `${this.baseUrl}/api/meals/seasoning-library`
      );
      return response.json();
    } catch (error) {
      console.error('[MealService] Error getting seasoning library:', error);
      throw error;
    }
  }

  /**
   * Get seasoning recommendations for a protein
   * GET /api/meals/seasoning-recommendations?protein=chicken
   */
  async getSeasoningRecommendations(
    protein: string
  ): Promise<{
    protein: string;
    recommended_seasonings: string[];
    flavor_profiles: Array<{ name: string; seasonings: string[] }>;
  }> {
    try {
      const response = await fetchWithLogging(
        `${this.baseUrl}/api/meals/seasoning-recommendations?protein=${encodeURIComponent(protein)}`
      );
      return response.json();
    } catch (error) {
      console.error('[MealService] Error getting seasoning recommendations:', error);
      throw error;
    }
  }

  /**
   * Create meal plan from natural language
   * POST /api/meals/create-from-text
   * 
   * User's saved food preferences are automatically applied!
   */
  async createMealFromText(
    userId: string,
    description: string,
    authToken?: string
  ): Promise<MealPlanResponse> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    const response = await fetchWithLogging(
      `${this.baseUrl}/api/meals/create-from-text`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          userId,
          description,
        }),
      }
    );
    return response.json();
  }
}

export const mealService = new MealService();
