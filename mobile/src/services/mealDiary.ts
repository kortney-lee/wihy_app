/**
 * Meal Diary API Service
 * Handles all meal tracking, dietary preferences, and meal history operations
 * Base URL: https://user.wihy.ai/api
 * 
 * IMPORTANT: Meal diary endpoints moved from services.wihy.ai to user.wihy.ai
 * Using services.wihy.ai returns 410 Gone (deprecated)
 */

import { fetchWithLogging } from '../utils/apiLogger';

const API_BASE = 'https://user.wihy.ai/api';

// ============================================================================
// Types
// ============================================================================

export interface Nutrition {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface Ingredient {
  name: string;
  amount: number;
  unit: string;
}

export interface Meal {
  meal_id: string;
  user_id?: string;
  name: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'pre-workout' | 'post-workout';
  nutrition: Nutrition;
  ingredients: Array<Ingredient | string>;
  tags?: string[];
  is_favorite?: boolean;
  times_logged?: number;
  last_logged?: string;
  serving_size?: number;
  preparation_time?: number;
  cooking_time?: number;
  instructions?: string[];
  image_url?: string | null;
  source?: string;
  recipe_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface DietaryPreferences {
  user_id?: string;
  diet_type: 'none' | 'keto' | 'paleo' | 'vegan' | 'vegetarian' | 'pescatarian' | 'mediterranean' | 'low-carb' | 'high-protein';
  dietary_restrictions?: string[];
  allergies?: string[];
  calorie_goal: number;
  protein_goal: number;
  carb_goal: number;
  fat_goal: number;
  meals_per_day?: number;
  preferred_cuisines?: string[];
  disliked_ingredients?: string[];
  cooking_skill_level?: 'beginner' | 'intermediate' | 'advanced';
  max_prep_time_minutes?: number;
  budget_preference?: 'budget' | 'moderate' | 'premium';
  created_at?: string;
  updated_at?: string;
}

export interface MealDiaryResponse {
  success: boolean;
  user_id: string;
  dietary_preferences: DietaryPreferences;
  recent_meals: Meal[];
  total_meals: number;
  has_more: boolean;
}

export interface GetAllMealsResponse {
  success: boolean;
  meals: Meal[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export interface CreateMealRequest {
  name: string;
  meal_type: string;
  nutrition: Nutrition;
  ingredients: Array<{ name: string; amount: number; unit: string }>;
  tags?: string[];
  preparation_time?: number;
  cooking_time?: number;
  instructions?: string[];
}

export interface CreateMealResponse {
  success: boolean;
  meal: Meal;
}

export interface GetMealResponse {
  success: boolean;
  meal: Meal;
}

export interface UpdateMealRequest {
  name?: string;
  nutrition?: Partial<Nutrition>;
  tags?: string[];
  image_url?: string;
}

export interface DeleteMealResponse {
  success: boolean;
  message: string;
}

export interface FavoriteToggleResponse {
  success: boolean;
  is_favorite: boolean;
  message: string;
}

export interface LogMealResponse {
  success: boolean;
  times_logged: number;
  last_logged: string;
}

export interface GetPreferencesResponse {
  success: boolean;
  preferences: DietaryPreferences;
}

export interface UpdatePreferencesResponse {
  success: boolean;
  preferences: DietaryPreferences;
}

export interface ErrorResponse {
  success: false;
  error: string;
  code?: string;
}

// ============================================================================
// MealDiaryAPI Service
// ============================================================================

export class MealDiaryAPI {
  private token: string = '';

  constructor(token?: string) {
    if (token) {
      this.token = token;
    }
  }

  /**
   * Set or update the JWT token
   */
  setToken(token: string): void {
    this.token = token;
  }

  /**
   * Get headers with authorization
   */
  private get headers(): HeadersInit {
    return {
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json',
    };
  }

  // ========================================================================
  // Meal Diary Endpoints
  // ========================================================================

  /**
   * Get all user meals (Meal Library)
   * GET /api/users/:userId/meals
   * Returns paginated list of meals with full details
   */
  async getAllMeals(
    userId: string,
    options?: {
      limit?: number;
      offset?: number;
      meal_type?: string;
      search?: string;
      sort?: string;
      order?: 'asc' | 'desc';
    }
  ): Promise<GetAllMealsResponse> {
    try {
      const params = new URLSearchParams();
      if (options?.limit) params.append('limit', options.limit.toString());
      if (options?.offset) params.append('offset', options.offset.toString());
      if (options?.meal_type) params.append('meal_type', options.meal_type);
      if (options?.search) params.append('search', options.search);
      if (options?.sort) params.append('sort', options.sort);
      if (options?.order) params.append('order', options.order);

      const url = `${API_BASE}/users/${userId}/meals${params.toString() ? `?${params.toString()}` : ''}`;
      
      const response = await fetchWithLogging(url, {
        method: 'GET',
        headers: this.headers,
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get user's meal diary with dietary preferences
   * GET /api/users/:userId/meals/diary
   */
  async getMealDiary(
    userId: string,
    options?: {
      limit?: number;
      offset?: number;
      meal_type?: string;
    }
  ): Promise<MealDiaryResponse> {
    try {
      const params = new URLSearchParams();
      if (options?.limit) params.append('limit', options.limit.toString());
      if (options?.offset) params.append('offset', options.offset.toString());
      if (options?.meal_type) params.append('meal_type', options.meal_type);

      const url = `${API_BASE}/users/${userId}/meals/diary${params.toString() ? `?${params.toString()}` : ''}`;
      
      const response = await fetchWithLogging(url, {
        method: 'GET',
        headers: this.headers,
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Create a new meal
   * POST /api/users/:userId/meals
   */
  async createMeal(
    userId: string,
    mealData: CreateMealRequest
  ): Promise<CreateMealResponse> {
    try {
      const url = `${API_BASE}/users/${userId}/meals`;
      
      const response = await fetchWithLogging(url, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(mealData),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      console.log('[MealDiaryAPI] Meal created:', data.meal?.meal_id);
      return data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get a specific meal
   * GET /api/users/:userId/meals/:mealId
   */
  async getMeal(userId: string, mealId: string): Promise<GetMealResponse> {
    try {
      const url = `${API_BASE}/users/${userId}/meals/${mealId}`;
      
      const response = await fetchWithLogging(url, {
        method: 'GET',
        headers: this.headers,
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Update a meal
   * PATCH /api/users/:userId/meals/:mealId
   */
  async updateMeal(
    userId: string,
    mealId: string,
    updates: UpdateMealRequest
  ): Promise<GetMealResponse> {
    try {
      const url = `${API_BASE}/users/${userId}/meals/${mealId}`;
      
      const response = await fetchWithLogging(url, {
        method: 'PATCH',
        headers: this.headers,
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      console.log('[MealDiaryAPI] Meal updated:', mealId);
      return data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Delete a meal
   * DELETE /api/users/:userId/meals/:mealId
   */
  async deleteMeal(userId: string, mealId: string): Promise<DeleteMealResponse> {
    try {
      const url = `${API_BASE}/users/${userId}/meals/${mealId}`;
      
      const response = await fetchWithLogging(url, {
        method: 'DELETE',
        headers: this.headers,
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      console.log('[MealDiaryAPI] Meal deleted:', mealId);
      return data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Toggle favorite status of a meal
   * POST /api/users/:userId/meals/:mealId/favorite
   */
  async toggleFavorite(userId: string, mealId: string): Promise<FavoriteToggleResponse> {
    try {
      const url = `${API_BASE}/users/${userId}/meals/${mealId}/favorite`;
      
      const response = await fetchWithLogging(url, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      console.log('[MealDiaryAPI] Favorite toggled:', mealId, data.is_favorite);
      return data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Log a meal (mark as eaten)
   * POST /api/users/:userId/meals/:mealId/log
   */
  async logMeal(userId: string, mealId: string): Promise<LogMealResponse> {
    try {
      const url = `${API_BASE}/users/${userId}/meals/${mealId}/log`;
      
      const response = await fetchWithLogging(url, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      console.log('[MealDiaryAPI] Meal logged:', mealId, `(${data.times_logged} times)`);
      return data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ========================================================================
  // Dietary Preferences Endpoints
  // ========================================================================

  /**
   * Get user's dietary preferences
   * GET /api/users/:userId/preferences/dietary
   */
  async getPreferences(userId: string): Promise<GetPreferencesResponse> {
    try {
      const url = `${API_BASE}/users/${userId}/preferences/dietary`;
      
      const response = await fetchWithLogging(url, {
        method: 'GET',
        headers: this.headers,
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Update user's dietary preferences
   * PUT /api/users/:userId/preferences/dietary
   */
  async updatePreferences(
    userId: string,
    preferences: Partial<DietaryPreferences>
  ): Promise<UpdatePreferencesResponse> {
    try {
      const url = `${API_BASE}/users/${userId}/preferences/dietary`;
      
      const response = await fetchWithLogging(url, {
        method: 'PUT',
        headers: this.headers,
        body: JSON.stringify(preferences),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      console.log('[MealDiaryAPI] Preferences updated for user:', userId);
      return data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ========================================================================
  // Error Handling
  // ========================================================================

  private handleError(error: any): Error {
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      const networkError = new Error('Network error - unable to reach API');
      (networkError as any).status = 0;
      (networkError as any).code = 'NETWORK_ERROR';
      return networkError;
    }

    if (error instanceof Error) {
      return error;
    }

    const unknownError = new Error('Unknown error occurred');
    (unknownError as any).code = 'UNKNOWN_ERROR';
    return unknownError;
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let mealDiaryInstance: MealDiaryAPI | null = null;

/**
 * Get or create meal diary service instance
 */
export function getMealDiaryService(token?: string): MealDiaryAPI {
  if (!mealDiaryInstance) {
    mealDiaryInstance = new MealDiaryAPI(token);
  } else if (token) {
    mealDiaryInstance.setToken(token);
  }
  return mealDiaryInstance;
}

/**
 * Create a new meal diary service instance (useful for testing)
 */
export function createMealDiaryService(token?: string): MealDiaryAPI {
  return new MealDiaryAPI(token);
}

// ============================================================================
// Default Export
// ============================================================================

const mealDiaryService = new MealDiaryAPI();
export default mealDiaryService;
