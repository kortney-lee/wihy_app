import { getApiEndpoint } from '../config/apiConfig';

export interface OpenFoodFactsProduct {
  success: boolean;
  item?: string;
  calories_per_serving?: number;
  macros?: {
    protein: string;
    carbs: string;
    fat: string;
  };
  processed_level?: string;
  verdict?: string;
  snap_eligible?: boolean;
  nova_classification?: number;
  message?: string;
  raw_product?: any;
}

export interface ProductSearchResult {
  success: boolean;
  products?: Array<{
    barcode: string;
    name: string;
    brand?: string;
    image_url?: string;
    nova_group?: number;
  }>;
  message?: string;
}

export interface NutritionFacts {
  success: boolean;
  facts?: {
    serving_size?: string;
    calories_per_serving?: number;
    nutrients?: Array<{
      name: string;
      amount: number;
      unit: string;
      daily_value?: number;
    }>;
  };
  message?: string;
}

class OpenFoodFactsAPI {
  private async handleResponse(response: Response) {
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
    }
    return await response.json();
  }

  /**
   * Get product by barcode
   */
  async getProductByBarcode(barcode: string): Promise<OpenFoodFactsProduct> {
    try {
      console.log('🔍 Calling backend for barcode lookup:', barcode);
      
      const response = await fetch(getApiEndpoint(`/openfoodfacts/barcode/${barcode}`), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      const result = await this.handleResponse(response);
      console.log('✅ Backend response for barcode:', result);
      
      return result;
    } catch (error) {
      console.error('❌ Barcode lookup error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to lookup barcode'
      };
    }
  }

  /**
   * Search products by name
   */
  async searchProducts(query: string, limit: number = 10): Promise<ProductSearchResult> {
    try {
      console.log('🔍 Calling backend for product search:', query);
      
      const searchParams = new URLSearchParams({
        q: query.trim(),
        limit: limit.toString()
      });

      const response = await fetch(getApiEndpoint(`/openfoodfacts/search?${searchParams}`), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      const result = await this.handleResponse(response);
      console.log('✅ Search results from backend:', result);
      
      return result;
    } catch (error) {
      console.error('❌ Product search error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Search failed'
      };
    }
  }

  /**
   * Get detailed nutrition facts
   */
  async getNutritionFacts(barcode: string): Promise<NutritionFacts> {
    try {
      console.log('📊 Getting nutrition facts for:', barcode);
      
      const response = await fetch(getApiEndpoint(`/openfoodfacts/nutrition/${barcode}`), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      const result = await this.handleResponse(response);
      console.log('✅ Nutrition facts received:', result);
      
      return result;
    } catch (error) {
      console.error('❌ Nutrition facts error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get nutrition facts'
      };
    }
  }

  /**
   * Get product categories and allergens
   */
  async getProductCategories(barcode: string) {
    try {
      console.log('🏷️ Getting categories for:', barcode);
      
      const response = await fetch(getApiEndpoint(`/openfoodfacts/categories/${barcode}`), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      const result = await this.handleResponse(response);
      console.log('✅ Categories received:', result);
      
      return result;
    } catch (error) {
      console.error('❌ Categories error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get categories'
      };
    }
  }

  /**
   * Check service status
   */
  async checkServiceStatus() {
    try {
      const response = await fetch(getApiEndpoint('/openfoodfacts/status'), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      const result = await this.handleResponse(response);
      return result;
    } catch (error) {
      console.error('❌ Service status error:', error);
      return {
        success: false,
        message: 'Backend service unavailable'
      };
    }
  }
}

export const openFoodFactsAPI = new OpenFoodFactsAPI();
export default openFoodFactsAPI;