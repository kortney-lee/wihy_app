/**
 * Product Search API Client
 * Base URL: https://services.wihy.ai/api/products
 * Authentication: Not required (public endpoints)
 * 
 * Searches 4M+ products from OpenFoodFacts, OpenBeautyFacts, OpenPetFoodFacts
 * 
 * Endpoints:
 * - GET /trending - Popular search terms for empty search box
 * - GET /suggest - Autocomplete suggestions as user types (2+ chars)
 * - GET /search - Full search results when user submits
 */

import { fetchWithLogging } from '../utils/apiLogger';

const BASE_URL = 'https://services.wihy.ai/api/products';

// ==========================================
// TYPES
// ==========================================

export interface TrendingResponse {
  success: boolean;
  type: string;
  trending: string[];
  timestamp: string;
}

export interface SuggestResponse {
  success: boolean;
  query: string;
  type: string;
  suggestions: string[];
  products: Array<{
    name: string;
    brand?: string;
    type: string;
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    fiber?: number;
    sugar?: number;
    sodium?: number;
    servingSize?: string;
    nutriscoreGrade?: string;
  }>;
  brands: string[];
  categories: string[];
  responseTime: string;
  fromCache: boolean;
  timestamp: string;
}

// Nutrition values structure (per serving or per 100g)
export interface NutritionValues {
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  saturated_fat?: number;
  salt?: number;
}

// Full nutrition object from API
export interface ProductNutrition {
  per_serving?: NutritionValues;
  per_100g?: NutritionValues;
  serving_size?: string;
  serving_size_grams?: number;
}

export interface FoodProduct {
  // Identifiers
  id: string;
  domain?: 'foods' | 'openfoodfacts';
  score: number;
  
  // Basic Info
  name: string;
  brand?: string;
  categories?: string;
  
  // Visual
  image_url?: string;
  imageUrl?: string; // Legacy alias
  
  // Nutrition (nested object from API)
  nutrition?: ProductNutrition;
  
  // Legacy flat nutrition fields (for backward compatibility)
  calories?: number;
  protein?: number;
  fat?: number;
  carbs?: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  
  // Product Info
  nutrition_grade?: string;
  nutriscore_grade?: string; // Legacy alias
  ingredients_text?: string;
  ingredients?: string; // Legacy alias
  allergens_tags?: string[];
  allergens?: string[]; // Legacy alias
  additives_tags?: string[];
  additives?: string[]; // Legacy alias
  labels?: string;
  nova_group?: number;
  
  // Location
  countries?: string;
  country_code?: string;
  
  // Serving size
  serving_size?: string;
  servingSize?: string; // Legacy alias
  
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
   * Get trending searches for empty search box
   * Call this when search input is focused with empty query
   * 
   * @param type - Product type filter
   * @param limit - Number of trending terms (1-20, default 10)
   * @returns TrendingResponse with array of trending search terms
   * 
   * @example
   * const trending = await productSearchService.trending('food');
   * console.log(trending.trending); // ["Organic snacks", "Protein bars", ...]
   */
  async trending(
    type: 'food' | 'beauty' | 'petfood' | 'all' = 'all',
    limit: number = 10
  ): Promise<TrendingResponse> {
    const params = new URLSearchParams();
    if (type !== 'all') params.append('type', type);
    params.append('limit', limit.toString());

    try {
      const response = await fetchWithLogging(`${this.baseUrl}/trending?${params}`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error(`Trending search failed: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error('Trending search error:', error);
      // Return empty trending on error
      return {
        success: false,
        type,
        trending: [],
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Get autocomplete suggestions as user types
   * Call this with debounce (150ms) after 2+ characters
   * 
   * @param query - Search query (min 2 chars)
   * @param type - Product type filter
   * @param limit - Number of suggestions (1-15, default 8)
   * @returns SuggestResponse with suggestions, products, and brands
   * 
   * @example
   * const suggestions = await productSearchService.suggest('coke', 'food');
   * console.log(suggestions.suggestions); // ["Diet coke soda", "Coke Zero", ...]
   * console.log(suggestions.products); // [{ name, brand, type }, ...]
   */
  async suggest(
    query: string,
    type: 'food' | 'beauty' | 'petfood' | 'all' = 'all',
    limit: number = 8
  ): Promise<SuggestResponse> {
    if (query.length < 2) {
      return {
        success: true,
        query,
        type,
        suggestions: [],
        products: [],
        brands: [],
        categories: [],
        responseTime: '0ms',
        fromCache: false,
        timestamp: new Date().toISOString(),
      };
    }

    const params = new URLSearchParams({
      q: query,
      limit: limit.toString(),
    });
    if (type !== 'all') params.append('type', type);

    try {
      const response = await fetchWithLogging(`${this.baseUrl}/suggest?${params}`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error(`Suggest failed: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error('Suggest error:', error);
      // Return empty suggestions on error
      return {
        success: false,
        query,
        type,
        suggestions: [],
        products: [],
        brands: [],
        categories: [],
        responseTime: '0ms',
        fromCache: false,
        timestamp: new Date().toISOString(),
      };
    }
  }

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
