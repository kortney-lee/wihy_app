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
  const response = await fetch(
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
    const response = await fetch(`${API_BASE}/instacart/meal-plan/recipe`, {
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
  const response = await fetch(`${API_BASE}/instacart/meal/recipe`, {
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
