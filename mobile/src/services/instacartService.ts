import { fetchWithLogging } from '../utils/apiLogger';

const API_BASE = 'https://services.wihy.ai/api';

export interface Retailer {
  name: string;
  distanceUnit?: string;
  services?: {
    delivery: boolean;
    pickup: boolean;
    sameDay: boolean;
  };
}

export interface ShoppingOptions {
  location: {
    postalCode: string;
    countryCode: string;
  };
  retailers: {
    all: Retailer[];
    byCategory: {
      organic?: Retailer[];
      budget?: Retailer[];
      premium?: Retailer[];
    };
    total: number;
  };
  recommendation: {
    closest?: Retailer;
    organic?: Retailer;
    budget?: Retailer;
  };
}

export interface InstacartRecipeResponse {
  productsLinkUrl: string;
  ingredientCount: number;
  mealCount: number;
}

export interface ShoppingListItem {
  name: string;
  quantity: number;
  unit: string;
  notes?: string;
  filters?: {
    brand_filters?: string[];      // ["Prego", "Classico"]
    health_filters?: string[];     // ["ORGANIC", "GLUTEN_FREE"]
  };
}

export interface InstacartLinkResponse {
  success: boolean;
  data: {
    productsLinkUrl: string;
    listId: string;
    createdAt: string;
  };
}

export type HealthFilter =
  | 'ORGANIC'
  | 'GLUTEN_FREE'
  | 'VEGAN'
  | 'VEGETARIAN'
  | 'KOSHER'
  | 'HALAL'
  | 'NON_GMO'
  | 'GRASS_FED'
  | 'NO_ADDED_SUGAR'
  | 'LOW_SODIUM';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

/**
 * Find nearby retailers for shopping
 */
export async function getShoppingOptions(
  postalCode: string
): Promise<ShoppingOptions> {
  const response = await fetchWithLogging(
    `${API_BASE}/instacart/shopping-options?postalCode=${postalCode}`
  );

  if (!response.ok) {
    throw new Error(`Failed to get shopping options: ${response.statusText}`);
  }

  const result: ApiResponse<ShoppingOptions> = await response.json();
  return result.data;
}

/**
 * Create Instacart shopping page from meal plan
 */
export async function createInstacartLinkFromMealPlan(
  mealPlanId: number
): Promise<InstacartRecipeResponse> {
  try {
    const response = await fetchWithLogging(`${API_BASE}/instacart/meal-plan/recipe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ mealPlanId }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Instacart link creation failed:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
      });
      throw new Error(`Failed to create Instacart link: ${response.status} ${response.statusText}. ${errorText}`);
    }

    const result: ApiResponse<InstacartRecipeResponse> = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error in createInstacartLinkFromMealPlan:', error);
    throw error;
  }
}

/**
 * Create Instacart shopping page from single meal/recipe
 */
export async function createInstacartLinkFromMeal(
  mealId: number
): Promise<InstacartRecipeResponse> {
  const response = await fetchWithLogging(`${API_BASE}/instacart/meal/recipe`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ mealId }),
  });

  if (!response.ok) {
    throw new Error(`Failed to create Instacart link: ${response.statusText}`);
  }

  const result: ApiResponse<InstacartRecipeResponse> = await response.json();
  return result.data;
}

/**
 * Create custom shopping list with brand preferences and filters
 */
export async function createShoppingList(
  items: ShoppingListItem[],
  userId: string,
  zipCode?: string
): Promise<InstacartLinkResponse> {
  try {
    const response = await fetchWithLogging(`${API_BASE}/instacart/shopping-list`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        list_data: {
          line_items: items,
        },
        options: {
          delivery_method: 'delivery',
          ...(zipCode && { zip_code: zipCode }),
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Shopping list creation failed:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
      });
      throw new Error(`Failed to create shopping list: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error in createShoppingList:', error);
    throw error;
  }
}
