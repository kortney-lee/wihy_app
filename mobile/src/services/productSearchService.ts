/**
 * Product Search API Client
 * Base URL: https://services.wihy.ai/api/products
 * Authentication: Not required (public endpoints)
 * 
 * Searches 4M+ products from OpenFoodFacts, OpenBeautyFacts, OpenPetFoodFacts
 */

import { fetchWithLogging } from '../utils/apiLogger';

const BASE_URL = 'https://services.wihy.ai/api/products';

// ==========================================
// TYPES
// ==========================================

export interface FoodProduct {
  id: string;
  name: string;
  brand?: string;
  categories?: string;
  calories?: number;
  protein?: number;
  fat?: number;
  carbs?: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  imageUrl?: string;
  ingredients?: string;
  servingSize?: string;
  nutriscore?: string;
  score: number;
  type: 'food';
}

export interface BeautyProduct {
  id: string;
  name: string;
  brand?: string;
  categories?: string;
  imageUrl?: string;
  ingredients?: string;
  labels?: string;
  packaging?: string;
  quantity?: string;
  score: number;
  type: 'beauty';
}

export interface PetFoodProduct {
  id: string;
  name: string;
  brand?: string;
  categories?: string;
  imageUrl?: string;
  ingredients?: string;
  nutritionGrade?: string;
  score: number;
  type: 'petfood';
}

export interface ProductSearchResponse {
  success: boolean;
  query: string;
  type: string;
  food: FoodProduct[];
  beauty: BeautyProduct[];
  petfood: PetFoodProduct[];
  counts: {
    food: number;
    beauty: number;
    petfood: number;
  };
  total: number;
  searchType?: string;
  timing?: { totalMs: number };
  fromCache?: boolean;
  timestamp: string;
}

export interface BrowseSnacksResponse {
  success: boolean;
  snackType: string;
  products: FoodProduct[];
  total: number;
  metadata: {
    product_type: string;
    data_source: string;
  };
  timestamp: string;
}

export interface BrandResponse {
  success: boolean;
  type: string;
  category?: string;
  brands: string[];
  count: number;
  metadata: {
    data_source: string;
  };
  timestamp: string;
}

export type SnackType = 'chips' | 'crackers' | 'cookies' | 'candy' | 'nuts' | 'bars' | 'popcorn' | 'fruit' | 'yogurt';
export type BeautyCategory = 'skincare' | 'haircare' | 'makeup' | 'fragrance' | 'bodycare';
export type PetType = 'dog' | 'cat' | 'bird' | 'fish' | 'rabbit' | 'small_animal';

// ==========================================
// SERVICE
// ==========================================

class ProductSearchService {
  private baseUrl = BASE_URL;

  /**
   * Search across all product databases (food, beauty, petfood)
   * 
   * @param query - Search query (required)
   * @param options - Search options
   * @returns ProductSearchResponse with categorized results
   * 
   * @example
   * const results = await productSearchService.search('organic chips', { type: 'food', limit: 20 });
   * console.log(results.food); // Array of food products
   */
  async search(
    query: string,
    options?: {
      type?: 'food' | 'beauty' | 'petfood';
      limit?: number;
      offset?: number;
    }
  ): Promise<ProductSearchResponse> {
    const params = new URLSearchParams({ q: query });
    if (options?.type) params.append('type', options.type);
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.offset) params.append('offset', options.offset.toString());

    const response = await fetchWithLogging(`${this.baseUrl}/search?${params}`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`Product search failed: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Browse food snacks by type
   * 
   * @param type - Snack category
   * @param options - Browse options
   * @returns BrowseSnacksResponse
   * 
   * @example
   * const chips = await productSearchService.browseSnacks('chips', { limit: 20 });
   * const healthyBars = await productSearchService.browseSnacks('bars', { healthier: true });
   */
  async browseSnacks(
    type: SnackType = 'chips',
    options?: {
      brand?: string;
      healthier?: boolean;
      limit?: number;
    }
  ): Promise<BrowseSnacksResponse> {
    const params = new URLSearchParams({ type });
    if (options?.brand) params.append('brand', options.brand);
    if (options?.healthier) params.append('healthier', 'true');
    if (options?.limit) params.append('limit', options.limit.toString());

    const response = await fetchWithLogging(`${this.baseUrl}/snacks?${params}`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`Browse snacks failed: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Browse beauty products by category
   */
  async browseBeauty(
    category: BeautyCategory = 'skincare',
    options?: {
      brand?: string;
      limit?: number;
    }
  ): Promise<any> {
    const params = new URLSearchParams({ category });
    if (options?.brand) params.append('brand', options.brand);
    if (options?.limit) params.append('limit', options.limit.toString());

    const response = await fetchWithLogging(`${this.baseUrl}/beauty?${params}`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`Browse beauty failed: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Browse pet food by pet type
   */
  async browsePetFood(
    petType: PetType = 'dog',
    options?: {
      brand?: string;
      limit?: number;
    }
  ): Promise<any> {
    const params = new URLSearchParams({ pet_type: petType });
    if (options?.brand) params.append('brand', options.brand);
    if (options?.limit) params.append('limit', options.limit.toString());

    const response = await fetchWithLogging(`${this.baseUrl}/petfood?${params}`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`Browse pet food failed: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Get popular brands for a product type
   * 
   * @example
   * const brands = await productSearchService.getBrands('food', 'snacks');
   * console.log(brands.brands); // ["Lay's", "Pringles", "Doritos", ...]
   */
  async getBrands(
    type: 'food' | 'beauty' | 'petfood',
    category?: string
  ): Promise<BrandResponse> {
    const params = new URLSearchParams({ type });
    if (category) params.append('category', category);

    const response = await fetchWithLogging(`${this.baseUrl}/brands?${params}`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`Get brands failed: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Get product details by barcode (if supported)
   * This is a helper method for future barcode scanning integration
   */
  async getProductByBarcode(barcode: string): Promise<FoodProduct | null> {
    try {
      // Search by exact barcode as query
      const results = await this.search(barcode, { type: 'food', limit: 1 });
      
      if (results.food.length > 0 && results.food[0].id === barcode) {
        return results.food[0];
      }
      
      return null;
    } catch (error) {
      console.error('Get product by barcode error:', error);
      return null;
    }
  }

  /**
   * Check service health
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetchWithLogging(`${this.baseUrl}/health`, {
        method: 'GET',
      });
      const data = await response.json();
      return data.success && data.status === 'healthy';
    } catch {
      return false;
    }
  }

  /**
   * Helper: Convert product nutrition to meal format
   * Useful when adding searched products as ingredients to meals
   */
  convertProductToIngredient(product: FoodProduct): {
    name: string;
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    brand?: string;
  } {
    return {
      name: product.name,
      calories: product.calories,
      protein: product.protein,
      carbs: product.carbs,
      fat: product.fat,
      brand: product.brand,
    };
  }

  /**
   * Helper: Extract brands from search results
   * Useful for creating brand filters for Instacart integration
   */
  extractBrands(results: ProductSearchResponse): string[] {
    const brands = new Set<string>();
    
    results.food.forEach(product => {
      if (product.brand) brands.add(product.brand);
    });
    
    return Array.from(brands).sort();
  }
}

// Export singleton instance
export const productSearchService = new ProductSearchService();
export default productSearchService;
