import { API_CONFIG } from './config';
import { fetchWithLogging } from '../utils/apiLogger';

export type ShoppingListStatus = 'active' | 'completed' | 'archived';

export interface ShoppingListItem {
  id?: string;
  name: string;
  /** Legacy field - use 'name' */
  item_name?: string;
  category: 'Proteins' | 'Produce' | 'Dairy' | 'Grains' | 'Pantry' | 'Other';
  quantity: number | string;
  unit?: string;
  checked?: boolean;
  brand_suggestion?: string;
  store_suggestion?: string;
  estimated_price?: number;
  notes?: string;
  /** Source meals this ingredient came from (for consolidated lists) */
  source_meals?: string[];
}

export interface ShoppingList {
  list_id?: string;
  /** Legacy field - use 'list_id' */
  id?: string;
  user_id?: string;
  /** Legacy field - use 'user_id' */
  userId?: string;
  name: string;
  status?: ShoppingListStatus;
  meal_plan_id?: string;
  duration_days?: number;
  items: ShoppingListItem[];
  items_by_category?: Record<string, ShoppingListItem[]>;
  total_items?: number;
  checked_items?: number;
  estimated_total_cost?: number;
  instacart_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ShoppingListByCategory {
  [category: string]: Array<{
    item_name: string;
    quantity: string;
    checked: boolean;
  }>;
}

export interface InstacartResponse {
  success: boolean;
  error?: string;
  orderId?: string;
  alternative?: {
    message: string;
    downloadUrl: string;
    inHouseDeliveryUrl: string;
  };
}

class ShoppingService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_CONFIG.baseUrl;
  }

  /**
   * Get shopping list by ID
   */
  async getList(listId: string): Promise<ShoppingList> {
    const response = await fetchWithLogging(`${this.baseUrl}/api/shopping-lists/${listId}`);
    const data = await response.json();
    return data.data;
  }

  /**
   * Create a new shopping list
   */
  async createList(list: ShoppingList): Promise<any> {
    const response = await fetchWithLogging(`${this.baseUrl}/api/shopping-lists`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(list),
    });
    return response.json();
  }

  /**
   * Update shopping list (status, items, etc.)
   */
  async updateList(
    listId: string,
    updates: Partial<ShoppingList>
  ): Promise<any> {
    const response = await fetchWithLogging(`${this.baseUrl}/api/shopping-lists/${listId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    return response.json();
  }

  /**
   * Generate shopping list from meal plan
   */
  async generateFromMealPlan(params: {
    userId: string;
    mealProgramId: string;
    days: number;
    servings?: number;
  }): Promise<ShoppingList> {
    const response = await fetchWithLogging(`${this.baseUrl}/api/shopping-lists/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const data = await response.json();
    return data.data;
  }

  /**
   * Get shopping list organized by category
   */
  async getByCategory(listId: string): Promise<ShoppingListByCategory> {
    const response = await fetchWithLogging(
      `${this.baseUrl}/api/shopping-lists/${listId}/categories`
    );
    const data = await response.json();
    return data.data;
  }

  /**
   * Send shopping list to Instacart
   * Note: Returns placeholder response if not configured
   */
  async sendToInstacart(
    listId: string,
    userId: string
  ): Promise<InstacartResponse> {
    const response = await fetchWithLogging(
      `${this.baseUrl}/api/shopping-lists/${listId}/instacart`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      }
    );
    return response.json();
  }

  /**
   * Sync Instacart order status
   */
  async syncInstacartOrder(
    listId: string,
    userId: string,
    orderId: string
  ): Promise<any> {
    const response = await fetchWithLogging(
      `${this.baseUrl}/api/shopping-lists/${listId}/instacart/sync?userId=${userId}&orderId=${orderId}`
    );
    return response.json();
  }

  /**
   * Delete a shopping list
   * DELETE /api/shopping-lists/:listId
   */
  async deleteList(listId: string): Promise<{ success: boolean }> {
    const response = await fetchWithLogging(
      `${this.baseUrl}/api/shopping-lists/${listId}`,
      { method: 'DELETE' }
    );
    return response.json();
  }

  /**
   * Get user's shopping lists
   * GET /api/shopping-lists?userId=&status=&limit=
   */
  async getUserLists(
    userId: string,
    params?: {
      status?: 'active' | 'completed' | 'all';
      limit?: number;
    }
  ): Promise<ShoppingList[]> {
    let url = `${this.baseUrl}/api/shopping-lists?userId=${userId}`;
    if (params?.status) url += `&status=${params.status}`;
    if (params?.limit) url += `&limit=${params.limit}`;
    
    const response = await fetchWithLogging(url);
    const data = await response.json();
    console.log('[ShoppingService] getUserLists response:', JSON.stringify(data, null, 2));
    // Handle different API response formats
    return data.lists || data.data || data || [];
  }

  /**
   * Create a manual shopping list (not from meal plan)
   * POST /api/shopping-lists/manual
   */
  async createManualList(
    userId: string,
    data?: {
      name?: string;
      description?: string;
      budget?: number;
      dueDate?: string;
    }
  ): Promise<ShoppingList> {
    const response = await fetchWithLogging(
      `${this.baseUrl}/api/shopping-lists/manual`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          name: data?.name || `Shopping List - ${new Date().toLocaleDateString()}`,
          description: data?.description,
          budget: data?.budget,
          due_date: data?.dueDate,
        }),
      }
    );
    const result = await response.json();
    return result.list || result.data;
  }

  /**
   * Add items to an existing shopping list
   * POST /api/shopping-lists/:listId/items
   */
  async addItemsToList(
    listId: string,
    items: ShoppingListItem[]
  ): Promise<{ listId: string; itemsAdded: number; list: ShoppingList }> {
    const response = await fetchWithLogging(
      `${this.baseUrl}/api/shopping-lists/${listId}/items`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      }
    );
    const result = await response.json();
    return {
      listId: result.list_id,
      itemsAdded: result.items_added,
      list: result.list,
    };
  }

  /**
   * Update an item in a shopping list
   * PUT /api/shopping-lists/:listId/items/:itemId
   */
  async updateItem(
    listId: string,
    itemId: string,
    updates: Partial<ShoppingListItem>
  ): Promise<{ item: ShoppingListItem; listSummary: any }> {
    const response = await fetchWithLogging(
      `${this.baseUrl}/api/shopping-lists/${listId}/items/${itemId}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      }
    );
    const result = await response.json();
    return {
      item: result.item,
      listSummary: result.list_summary,
    };
  }

  /**
   * Delete an item from a shopping list
   * DELETE /api/shopping-lists/:listId/items/:itemId
   */
  async deleteItem(
    listId: string,
    itemId: string
  ): Promise<{ success: boolean; listSummary: any }> {
    const response = await fetchWithLogging(
      `${this.baseUrl}/api/shopping-lists/${listId}/items/${itemId}`,
      { method: 'DELETE' }
    );
    const result = await response.json();
    return {
      success: result.success,
      listSummary: result.list_summary,
    };
  }

  /**
   * Bulk update items (check, uncheck, delete multiple items)
   * PATCH /api/shopping-lists/:listId/items/bulk
   */
  async bulkUpdateItems(
    listId: string,
    operation: 'check' | 'uncheck' | 'delete',
    itemIds: string[]
  ): Promise<{ itemsAffected: number; listSummary: any }> {
    const response = await fetchWithLogging(
      `${this.baseUrl}/api/shopping-lists/${listId}/items/bulk`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operation, item_ids: itemIds }),
      }
    );
    const result = await response.json();
    return {
      itemsAffected: result.items_affected,
      listSummary: result.list_summary,
    };
  }
}

export const shoppingService = new ShoppingService();
