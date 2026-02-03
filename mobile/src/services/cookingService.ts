/**
 * Cooking Service
 * 
 * Handles combined shopping list + cooking instructions
 * Base URL: https://services.wihy.ai
 * 
 * Endpoints:
 * - GET /api/cooking/:listId - Combined shopping list AND cooking instructions
 * - GET /api/cooking/:listId/shopping - Shopping list only
 * - GET /api/cooking/:listId/instructions - Cooking instructions only
 * - GET /api/cooking/meal/:mealId - Single meal detailed instructions
 */

import { fetchWithLogging } from '../utils/apiLogger';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE = 'https://services.wihy.ai';

// ============================================================================
// Types
// ============================================================================

export interface CookingIngredient {
  name: string;
  quantity: number | string;
  unit?: string;
  checked?: boolean;
  category?: string;
}

export interface CookingInstruction {
  step_number: number;
  instruction: string;
}

export interface MealNutrition {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
}

export interface CookingMeal {
  meal_id: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  day_number?: number;
  day_label?: string;
  name: string;
  prep_time: number;
  cook_time: number;
  total_time: number;
  servings: number;
  image_url?: string | null;
  ingredients: CookingIngredient[];
  instructions: CookingInstruction[];
  nutrition: MealNutrition;
  tags?: string[];
  source?: string;
}

export interface ShoppingListItem {
  name: string;
  quantity: number | string;
  unit?: string;
  checked?: boolean;
  category?: string;
}

export interface ShoppingListByCategory {
  Proteins?: ShoppingListItem[];
  Produce?: ShoppingListItem[];
  Dairy?: ShoppingListItem[];
  Grains?: ShoppingListItem[];
  Pantry?: ShoppingListItem[];
  Other?: ShoppingListItem[];
  [key: string]: ShoppingListItem[] | undefined;
}

export interface ShoppingListData {
  list_id: string;
  name: string;
  status: 'active' | 'completed' | 'archived';
  total_items: number;
  checked_items: number;
  instacart_url?: string;
  items_by_category: ShoppingListByCategory;
  all_items: ShoppingListItem[];
}

export interface CookingData {
  total_meals: number;
  total_cooking_steps: number;
  total_cook_time_minutes: number;
  meals: CookingMeal[];
}

export interface CombinedCookingResponse {
  success: boolean;
  shopping_list: ShoppingListData;
  cooking: CookingData;
}

export interface ShoppingOnlyResponse {
  success: boolean;
  list_id: string;
  name: string;
  total_items: number;
  checked_items: number;
  items_by_category: ShoppingListByCategory;
  all_items: ShoppingListItem[];
}

export interface InstructionsOnlyResponse {
  success: boolean;
  list_id: string;
  list_name: string;
  total_meals: number;
  total_steps: number;
  meals: CookingMeal[];
}

export interface SingleMealResponse {
  success: boolean;
  meal: CookingMeal;
}

// ============================================================================
// Helper Functions
// ============================================================================

async function getAuthToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem('authToken');
  } catch {
    return null;
  }
}

async function getAuthHeaders(): Promise<HeadersInit> {
  const token = await getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };
}

// ============================================================================
// Cooking Service
// ============================================================================

class CookingService {
  /**
   * Get combined shopping list AND cooking instructions
   * GET /api/cooking/:listId
   * 
   * @param listId - Shopping list ID
   * @param options - Optional query parameters
   * @returns Combined shopping list and cooking instructions
   */
  async getCombinedCookingData(
    listId: string,
    options?: {
      source?: 'instacart' | 'app';
      includeNutrition?: boolean;
    }
  ): Promise<CombinedCookingResponse> {
    const headers = await getAuthHeaders();
    
    const params = new URLSearchParams();
    if (options?.source) params.append('source', options.source);
    if (options?.includeNutrition !== undefined) {
      params.append('includeNutrition', String(options.includeNutrition));
    }
    
    const queryString = params.toString();
    const url = `${API_BASE}/api/cooking/${listId}${queryString ? '?' + queryString : ''}`;
    
    console.log('[CookingService] getCombinedCookingData:', url);
    
    const response = await fetchWithLogging(url, { headers });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[CookingService] getCombinedCookingData failed:', {
        status: response.status,
        error: errorText,
      });
      throw new Error(`Failed to get cooking data: ${response.status}`);
    }
    
    return response.json();
  }

  /**
   * Get shopping list only (lightweight version)
   * GET /api/cooking/:listId/shopping
   * 
   * @param listId - Shopping list ID
   * @returns Shopping items only
   */
  async getShoppingList(listId: string): Promise<ShoppingOnlyResponse> {
    const headers = await getAuthHeaders();
    const url = `${API_BASE}/api/cooking/${listId}/shopping`;
    
    console.log('[CookingService] getShoppingList:', url);
    
    const response = await fetchWithLogging(url, { headers });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[CookingService] getShoppingList failed:', {
        status: response.status,
        error: errorText,
      });
      throw new Error(`Failed to get shopping list: ${response.status}`);
    }
    
    return response.json();
  }

  /**
   * Get cooking instructions only (lightweight version)
   * GET /api/cooking/:listId/instructions
   * 
   * @param listId - Shopping list ID
   * @returns Cooking instructions only
   */
  async getCookingInstructions(listId: string): Promise<InstructionsOnlyResponse> {
    const headers = await getAuthHeaders();
    const url = `${API_BASE}/api/cooking/${listId}/instructions`;
    
    console.log('[CookingService] getCookingInstructions:', url);
    
    const response = await fetchWithLogging(url, { headers });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[CookingService] getCookingInstructions failed:', {
        status: response.status,
        error: errorText,
      });
      throw new Error(`Failed to get cooking instructions: ${response.status}`);
    }
    
    return response.json();
  }

  /**
   * Get single meal detailed instructions
   * GET /api/cooking/meal/:mealId
   * 
   * @param mealId - Meal ID
   * @returns Single meal with full details
   */
  async getMealDetails(mealId: string): Promise<SingleMealResponse> {
    const headers = await getAuthHeaders();
    const url = `${API_BASE}/api/cooking/meal/${mealId}`;
    
    console.log('[CookingService] getMealDetails:', url);
    
    const response = await fetchWithLogging(url, { headers });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[CookingService] getMealDetails failed:', {
        status: response.status,
        error: errorText,
      });
      throw new Error(`Failed to get meal details: ${response.status}`);
    }
    
    return response.json();
  }
}

export const cookingService = new CookingService();
export default cookingService;
