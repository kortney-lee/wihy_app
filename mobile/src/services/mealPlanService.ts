const API_BASE = 'https://services.wihy.ai/api';

// Mock Data Import
import mockMealPlan from '../../mock-data-muscle-building-meal-plan.json';

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
    const response = await fetch(`${API_BASE}/meal-plans`, {
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
  const response = await fetch(`${API_BASE}/meal-plans/${mealPlanId}`);

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
    const response = await fetch(
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
  const response = await fetch(
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
  const response = await fetch(`${API_BASE}/shopping-lists`, {
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
 * Get user's saved meals
 */
export async function getUserMeals(
  userId: string,
  searchQuery?: string,
  filterTag?: string | null
): Promise<any[]> {
  try {
    let url = `${API_BASE}/meals/user/${userId}`;
    const params = new URLSearchParams();
    
    if (searchQuery) {
      params.append('search', searchQuery);
    }
    if (filterTag && filterTag !== 'Favorites') {
      params.append('tags', filterTag);
    }
    if (filterTag === 'Favorites') {
      params.append('favorites', 'true');
    }
    
    const queryString = params.toString();
    if (queryString) {
      url += `?${queryString}`;
    }

    const response = await fetch(url);

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
    return result.meals || [];
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
    // First try to find meal in mock data
    for (const day of mockMealPlan.days) {
      const mockMeal = day.meals.find((m: any) => m.meal_id === mealId) as any;
      if (mockMeal) {
        return {
          meal_id: mockMeal.meal_id,
          name: mockMeal.meal_name,
          description: mockMeal.muscle_building_benefits?.join(' ') || '',
          nutrition: {
            calories: mockMeal.nutrition_per_serving.calories,
            protein: mockMeal.nutrition_per_serving.protein,
            carbs: mockMeal.nutrition_per_serving.carbs,
            fat: mockMeal.nutrition_per_serving.fat,
            fiber: mockMeal.nutrition_per_serving.fiber,
          },
          ingredients: mockMeal.ingredients?.map((ing: any) => ({
            name: ing.name,
            amount: ing.amount,
            unit: ing.unit,
            notes: ing.notes,
            category: ing.aisle,
          })) || [],
          instructions: mockMeal.instructions?.map((inst: any, index: number) => ({
            step: index + 1,
            text: inst,
          })) || [],
          tags: mockMeal.tags || [mockMeal.meal_type],
          notes: mockMeal.muscle_building_benefits?.join('\n'),
          preparation_time: mockMeal.prep_time,
          cooking_time: mockMeal.cook_time,
          servings: mockMeal.servings,
          is_favorite: false,
          cost_per_serving: mockMeal.cost_per_serving,
          difficulty: mockMeal.prep_time < 15 ? 'easy' : mockMeal.prep_time < 30 ? 'medium' : 'hard',
          meal_type: mockMeal.meal_type,
          tips: mockMeal.muscle_building_benefits,
        };
      }
    }
    
    // Fallback to API if not found in mock data
    const response = await fetch(`${API_BASE}/meals/${mealId}`);

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
