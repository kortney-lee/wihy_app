import { fetchWithLogging } from '../utils/apiLogger';
import { API_CONFIG } from './config';

// CRITICAL: Meals API is on user.wihy.ai, NOT services.wihy.ai
// See docs/BACKEND_MEALS_API_REQUIREMENTS.md for correct endpoint usage
const API_BASE = `${API_CONFIG.userUrl}/api`;

// Note: Mock data removed to expose real API issues

export interface MealPlan {
  id: number;
  clientId: string;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  status: string;
  dailyCalorieTarget?: number;
  macrosTarget?: {
    protein: number;
    carbs: number;
    fat: number;
  };
  dietaryRestrictions?: string[];
}

export interface CreateMealPlanRequest {
  clientId: string;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  dailyCalorieTarget?: number;
  macrosTarget?: {
    protein: number;
    carbs: number;
    fat: number;
  };
  dietaryRestrictions?: string[];
}

export interface ShoppingListItem {
  id: number;
  category: string;
  name: string;
  quantity: string;
  unit: string;
}

export interface ShoppingList {
  id: number;
  mealPlanId: number;
  totalItems: number;
  items: ShoppingListItem[];
  itemsByCategory: {
    [category: string]: ShoppingListItem[];
  };
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

/**
 * Create a new meal plan
 */
export async function createMealPlan(
  request: CreateMealPlanRequest
): Promise<MealPlan> {
  try {
    const response = await fetchWithLogging(`${API_BASE}/meal-plans`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Meal plan creation failed:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
      });
      throw new Error(`Failed to create meal plan: ${response.status} ${response.statusText}. ${errorText}`);
    }

    const result: ApiResponse<MealPlan> = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error in createMealPlan:', error);
    throw error;
  }
}

/**
 * Get meal plan details
 */
export async function getMealPlan(mealPlanId: number): Promise<MealPlan> {
  const response = await fetchWithLogging(`${API_BASE}/meal-plans/${mealPlanId}`);

  if (!response.ok) {
    throw new Error(`Failed to get meal plan: ${response.statusText}`);
  }

  const result: ApiResponse<MealPlan> = await response.json();
  return result.data;
}

/**
 * Generate shopping list from meal plan
 */
export async function generateShoppingList(
  mealPlanId: number
): Promise<ShoppingList> {
  try {
    const response = await fetchWithLogging(
      `${API_BASE}/meal-plans/${mealPlanId}/shopping-list`,
      {
        method: 'POST',
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Shopping list generation failed:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
      });
      throw new Error(`Failed to generate shopping list: ${response.status} ${response.statusText}. ${errorText}`);
    }

    const result: ApiResponse<ShoppingList> = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error in generateShoppingList:', error);
    throw error;
  }
}

/**
 * Add meal to a specific day in the meal plan
 */
export async function addMealToPlan(
  mealPlanId: number,
  dayNumber: number,
  meal: {
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
    recipeId: number;
    servings: number;
  }
): Promise<void> {
  const response = await fetchWithLogging(
    `${API_BASE}/meal-plans/${mealPlanId}/days/${dayNumber}/meals`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(meal),
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to add meal to plan: ${response.statusText}`);
  }
}

/**
 * Create manual shopping list
 */
export async function createShoppingList(
  userId: string,
  name: string,
  items: Array<{
    category: string;
    itemName: string;
    quantity: string;
  }>
): Promise<{ listId: string }> {
  const response = await fetchWithLogging(`${API_BASE}/shopping-lists`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      userId,
      name,
      items,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to create shopping list: ${response.statusText}`);
  }

  const result: ApiResponse<{ listId: string }> = await response.json();
  return result.data;
}

/**
 * Get user's saved meals from Meal Diary
 * Uses correct API endpoint: GET /api/users/:userId/meals/diary
 */
export async function getUserMeals(
  userId: string,
  searchQuery?: string,
  filterTag?: string | null
): Promise<any[]> {
  try {
    const params = new URLSearchParams();
    
    // Map filter parameters to Meal Diary API format
    if (filterTag && filterTag !== 'Favorites') {
      // Map tag to meal_type if it's a meal type
      const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
      const lowerTag = filterTag.toLowerCase();
      if (mealTypes.includes(lowerTag)) {
        params.append('meal_type', lowerTag);
      }
    }
    
    // Set reasonable limit
    params.append('limit', '50');
    
    const queryString = params.toString();
    const url = `${API_BASE}/users/${userId}/meals/diary${queryString ? '?' + queryString : ''}`;

    const response = await fetchWithLogging(url);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Get user meals failed:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
      });
      throw new Error(`Failed to get user meals: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    let meals = result.recent_meals || [];
    
    // Apply client-side filtering for search and favorites
    if (searchQuery?.trim()) {
      const query = searchQuery.toLowerCase();
      meals = meals.filter((meal: any) => 
        meal.name?.toLowerCase().includes(query) ||
        meal.tags?.some((tag: string) => tag.toLowerCase().includes(query))
      );
    }
    
    if (filterTag === 'Favorites') {
      meals = meals.filter((meal: any) => meal.is_favorite);
    }
    
    return meals;
  } catch (error) {
    console.error('Error in getUserMeals:', error);
    throw error;
  }
}

/**
 * Get detailed meal information
 */
export async function getMealDetails(mealId: string): Promise<any> {
  try {
    // Fetch from API
    const response = await fetchWithLogging(`${API_BASE}/meals/${mealId}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Get meal details failed:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
      });
      throw new Error(`Failed to get meal details: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    return result.meal || result.data || result;
  } catch (error) {
    console.error('Error in getMealDetails:', error);
    throw error;
  }
}
