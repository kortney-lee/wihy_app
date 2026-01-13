/**
 * Shopping List API Service
 * Handles shopping list creation, management, and item tracking
 * Base URL: https://services.wihy.ai/api
 */

import { fetchWithLogging } from '../utils/apiLogger';

const API_BASE = 'https://services.wihy.ai/api';

// ============================================================================
// Types
// ============================================================================

export interface ShoppingListItem {
  item_id: string;
  list_id: string;
  name: string;
  amount: number;
  unit: string;
  category?: string;
  is_checked: boolean;
  checked_by?: string;
  checked_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ShoppingList {
  list_id: string;
  user_id: string;
  name: string;
  description?: string;
  is_active: boolean;
  created_from_plan?: string;
  total_items: number;
  items_checked: number;
  items: ShoppingListItem[];
  created_at: string;
  updated_at: string;
}

export interface CreateShoppingListRequest {
  name: string;
  description?: string;
  items?: Array<{
    name: string;
    amount: number;
    unit: string;
    category?: string;
  }>;
  created_from_plan?: string;
}

export interface CreateShoppingListResponse {
  success: boolean;
  list: ShoppingList;
}

export interface GetShoppingListResponse {
  success: boolean;
  list: ShoppingList;
}

export interface GetShoppingListsResponse {
  success: boolean;
  lists: ShoppingList[];
  total: number;
}

export interface AddItemRequest {
  name: string;
  amount: number;
  unit: string;
  category?: string;
}

export interface AddItemResponse {
  success: boolean;
  item: ShoppingListItem;
}

export interface UpdateItemRequest {
  name?: string;
  amount?: number;
  unit?: string;
  category?: string;
  is_checked?: boolean;
}

export interface UpdateItemResponse {
  success: boolean;
  item: ShoppingListItem;
}

export interface CheckItemResponse {
  success: boolean;
  is_checked: boolean;
  checked_at: string;
}

export interface DeleteItemResponse {
  success: boolean;
  message: string;
}

export interface GenerateFromMealPlanRequest {
  meal_plan_id: string;
  servings?: number;
  dietary_restrictions?: string[];
}

export interface GenerateFromMealPlanResponse {
  success: boolean;
  list: ShoppingList;
  generated_items_count: number;
}

export interface ErrorResponse {
  success: false;
  error: string;
  code?: string;
}

// ============================================================================
// ShoppingListAPI Service
// ============================================================================

export class ShoppingListAPI {
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
  // Shopping List Endpoints
  // ========================================================================

  /**
   * Create a new shopping list
   * POST /api/users/:userId/shopping-lists
   */
  async createList(
    userId: string,
    listData: CreateShoppingListRequest
  ): Promise<CreateShoppingListResponse> {
    try {
      const url = `${API_BASE}/users/${userId}/shopping-lists`;
      
      const response = await fetchWithLogging(url, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(listData),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      console.log('[ShoppingListAPI] List created:', data.list?.list_id);
      return data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get user's shopping lists
   * GET /api/users/:userId/shopping-lists
   */
  async getLists(
    userId: string,
    options?: {
      limit?: number;
      offset?: number;
      is_active?: boolean;
    }
  ): Promise<GetShoppingListsResponse> {
    try {
      const params = new URLSearchParams();
      if (options?.limit) params.append('limit', options.limit.toString());
      if (options?.offset) params.append('offset', options.offset.toString());
      if (options?.is_active !== undefined) params.append('is_active', options.is_active.toString());

      const url = `${API_BASE}/users/${userId}/shopping-lists${params.toString() ? `?${params.toString()}` : ''}`;
      
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
   * Get a specific shopping list
   * GET /api/users/:userId/shopping-lists/:listId
   */
  async getList(userId: string, listId: string): Promise<GetShoppingListResponse> {
    try {
      const url = `${API_BASE}/users/${userId}/shopping-lists/${listId}`;
      
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
   * Update shopping list
   * PATCH /api/users/:userId/shopping-lists/:listId
   */
  async updateList(
    userId: string,
    listId: string,
    updates: {
      name?: string;
      description?: string;
      is_active?: boolean;
    }
  ): Promise<GetShoppingListResponse> {
    try {
      const url = `${API_BASE}/users/${userId}/shopping-lists/${listId}`;
      
      const response = await fetchWithLogging(url, {
        method: 'PATCH',
        headers: this.headers,
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      console.log('[ShoppingListAPI] List updated:', listId);
      return data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Delete shopping list
   * DELETE /api/users/:userId/shopping-lists/:listId
   */
  async deleteList(userId: string, listId: string): Promise<DeleteItemResponse> {
    try {
      const url = `${API_BASE}/users/${userId}/shopping-lists/${listId}`;
      
      const response = await fetchWithLogging(url, {
        method: 'DELETE',
        headers: this.headers,
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      console.log('[ShoppingListAPI] List deleted:', listId);
      return data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Generate shopping list from meal plan
   * POST /api/users/:userId/shopping-lists
   */
  async generateFromMealPlan(
    userId: string,
    params: GenerateFromMealPlanRequest
  ): Promise<GenerateFromMealPlanResponse> {
    try {
      const url = `${API_BASE}/users/${userId}/shopping-lists`;
      
      const response = await fetchWithLogging(url, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      console.log('[ShoppingListAPI] List generated from meal plan:', data.generated_items_count, 'items');
      return data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ========================================================================
  // Shopping List Item Endpoints
  // ========================================================================

  /**
   * Add item to shopping list
   * POST /api/users/:userId/shopping-lists/:listId/items
   */
  async addItem(
    userId: string,
    listId: string,
    itemData: AddItemRequest
  ): Promise<AddItemResponse> {
    try {
      const url = `${API_BASE}/users/${userId}/shopping-lists/${listId}/items`;
      
      const response = await fetchWithLogging(url, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(itemData),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      console.log('[ShoppingListAPI] Item added:', data.item?.item_id);
      return data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Update shopping list item
   * PATCH /api/users/:userId/shopping-lists/:listId/items/:itemId
   */
  async updateItem(
    userId: string,
    listId: string,
    itemId: string,
    updates: UpdateItemRequest
  ): Promise<UpdateItemResponse> {
    try {
      const url = `${API_BASE}/users/${userId}/shopping-lists/${listId}/items/${itemId}`;
      
      const response = await fetchWithLogging(url, {
        method: 'PATCH',
        headers: this.headers,
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      console.log('[ShoppingListAPI] Item updated:', itemId);
      return data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Check/uncheck item
   * POST /api/users/:userId/shopping-lists/:listId/items/:itemId/check
   */
  async checkItem(
    userId: string,
    listId: string,
    itemId: string,
    isChecked: boolean
  ): Promise<CheckItemResponse> {
    try {
      const url = `${API_BASE}/users/${userId}/shopping-lists/${listId}/items/${itemId}/check`;
      
      const response = await fetchWithLogging(url, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({ is_checked: isChecked }),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      console.log('[ShoppingListAPI] Item checked:', itemId, isChecked);
      return data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Delete item from shopping list
   * DELETE /api/users/:userId/shopping-lists/:listId/items/:itemId
   */
  async deleteItem(
    userId: string,
    listId: string,
    itemId: string
  ): Promise<DeleteItemResponse> {
    try {
      const url = `${API_BASE}/users/${userId}/shopping-lists/${listId}/items/${itemId}`;
      
      const response = await fetchWithLogging(url, {
        method: 'DELETE',
        headers: this.headers,
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      console.log('[ShoppingListAPI] Item deleted:', itemId);
      return data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Clear all checked items from list
   * POST /api/users/:userId/shopping-lists/:listId/clear-checked
   */
  async clearCheckedItems(userId: string, listId: string): Promise<GetShoppingListResponse> {
    try {
      const url = `${API_BASE}/users/${userId}/shopping-lists/${listId}/clear-checked`;
      
      const response = await fetchWithLogging(url, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      console.log('[ShoppingListAPI] Checked items cleared from list:', listId);
      return data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Export shopping list
   * GET /api/users/:userId/shopping-lists/:listId/export
   */
  async exportList(userId: string, listId: string, format: 'pdf' | 'csv' | 'json' = 'json'): Promise<any> {
    try {
      const url = `${API_BASE}/users/${userId}/shopping-lists/${listId}/export?format=${format}`;
      
      const response = await fetchWithLogging(url, {
        method: 'GET',
        headers: this.headers,
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      console.log('[ShoppingListAPI] List exported as', format);
      
      if (format === 'json') {
        return await response.json();
      } else {
        return await response.blob();
      }
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

let shoppingListInstance: ShoppingListAPI | null = null;

/**
 * Get or create shopping list service instance
 */
export function getShoppingListService(token?: string): ShoppingListAPI {
  if (!shoppingListInstance) {
    shoppingListInstance = new ShoppingListAPI(token);
  } else if (token) {
    shoppingListInstance.setToken(token);
  }
  return shoppingListInstance;
}

/**
 * Create a new shopping list service instance (useful for testing)
 */
export function createShoppingListService(token?: string): ShoppingListAPI {
  return new ShoppingListAPI(token);
}

// ============================================================================
// Default Export
// ============================================================================

const shoppingListService = new ShoppingListAPI();
export default shoppingListService;
