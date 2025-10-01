const fetch = require('node-fetch');

class OpenFoodFactsService {
  constructor() {
    this.baseUrl = 'https://world.openfoodfacts.org';
    this.userAgent = 'vHealth-App/1.0 (https://vhealth.com)';
  }

  /**
   * Controller method: Get product by barcode
   */
  async getProductByBarcodeController(req, res) {
    try {
      const { barcode } = req.params;
      
      if (!barcode) {
        res.status(400).json({
          success: false,
          message: 'Barcode parameter is required'
        });
        return;
      }

      const result = await this.getProductByBarcode(barcode);
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(404).json(result);
      }
    } catch (error) {
      console.error('Barcode lookup controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Controller method: Search products
   */
  async searchProductsController(req, res) {
    try {
      const { q: query, limit = '10' } = req.query;
      
      if (!query || typeof query !== 'string') {
        res.status(400).json({
          success: false,
          message: 'Query parameter "q" is required'
        });
        return;
      }
      
      const result = await this.searchProducts(query, parseInt(limit));
      res.json(result);
    } catch (error) {
      console.error('Product search controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Controller method: Get nutrition facts
   */
  async getNutritionFactsController(req, res) {
    try {
      const { barcode } = req.params;
      
      if (!barcode) {
        res.status(400).json({
          success: false,
          message: 'Barcode parameter is required'
        });
        return;
      }

      const result = await this.getNutritionFacts(barcode);
      res.json(result);
    } catch (error) {
      console.error('Nutrition facts controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Controller method: Get product categories
   */
  async getProductCategoriesController(req, res) {
    try {
      const { barcode } = req.params;
      
      if (!barcode) {
        res.status(400).json({
          success: false,
          message: 'Barcode parameter is required'
        });
        return;
      }

      const result = await this.getProductCategories(barcode);
      res.json(result);
    } catch (error) {
      console.error('Product categories controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Controller method: Check service status
   */
  async checkServiceStatusController(req, res) {
    try {
      const result = await this.checkServiceStatus();
      res.json(result);
    } catch (error) {
      console.error('Service status controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Service check failed'
      });
    }
  }

  // Service methods (business logic)
  
  /**
   * Get product by barcode using direct API call
   */
  async getProductByBarcode(barcode) {
    try {
      console.log('🔍 Looking up barcode in OpenFoodFacts:', barcode);
      
      // Validate barcode format
      if (!/^\d{8,14}$/.test(barcode)) {
        return {
          success: false,
          message: 'Invalid barcode format. Must be 8-14 digits.'
        };
      }
      
      const response = await fetch(`${this.baseUrl}/api/v0/product/${barcode}.json`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': this.userAgent
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.status === 0 || !data.product) {
        return {
          success: false,
          message: `Product not found for barcode: ${barcode}`
        };
      }

      const product = data.product;
      console.log('✅ OpenFoodFacts product found:', product.product_name);

      return {
        success: true,
        item: product.product_name || 'Unknown Product',
        calories_per_serving: this.getCalories(product),
        macros: {
          protein: `${this.getNutrient(product, 'proteins') || 0}g`,
          carbs: `${this.getNutrient(product, 'carbohydrates') || 0}g`,
          fat: `${this.getNutrient(product, 'fat') || 0}g`
        },
        processed_level: this.getNovaDescription(product.nova_group),
        verdict: this.createVerdict(product),
        snap_eligible: false, // OpenFoodFacts doesn't provide SNAP info
        nova_classification: product.nova_group || 1,
        raw_product: product // For debugging/additional data
      };

    } catch (error) {
      console.error('❌ OpenFoodFacts API error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Search products by name
   */
  async searchProducts(query, limit = 10) {
    try {
      console.log('🔍 Searching OpenFoodFacts for:', query);
      
      if (!query.trim()) {
        return {
          success: false,
          message: 'Search query cannot be empty'
        };
      }
      
      const searchParams = new URLSearchParams({
        search_terms: query.trim(),
        search_simple: '1',
        action: 'process',
        json: '1',
        page_size: Math.min(limit, 50).toString(), // Cap at 50
        sort_by: 'popularity'
      });

      const response = await fetch(`${this.baseUrl}/cgi/search.pl?${searchParams}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': this.userAgent
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.products || data.products.length === 0) {
        return {
          success: false,
          message: `No products found for: ${query}`
        };
      }

      const products = data.products.map((product) => ({
        barcode: product.code || product._id,
        name: product.product_name || 'Unknown Product',
        brand: product.brands || undefined,
        image_url: product.image_url || product.image_front_url || undefined,
        nova_group: product.nova_group || undefined
      })).filter((product) => product.name !== 'Unknown Product'); // Filter out products without names

      console.log(`✅ Found ${products.length} products in OpenFoodFacts`);

      return {
        success: true,
        products
      };

    } catch (error) {
      console.error('❌ OpenFoodFacts search error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Search failed'
      };
    }
  }

  /**
   * Get detailed nutrition facts for a product
   */
  async getNutritionFacts(barcode) {
    try {
      const product = await this.getProductByBarcode(barcode);
      
      if (!product.success || !product.raw_product) {
        return {
          success: false,
          message: 'Product not found or no nutrition data available'
        };
      }

      const rawProduct = product.raw_product;

      const nutrients = [
        { name: 'Protein', amount: this.getNutrient(rawProduct, 'proteins'), unit: 'g' },
        { name: 'Carbohydrates', amount: this.getNutrient(rawProduct, 'carbohydrates'), unit: 'g' },
        { name: 'Total Fat', amount: this.getNutrient(rawProduct, 'fat'), unit: 'g' },
        { name: 'Saturated Fat', amount: this.getNutrient(rawProduct, 'saturated-fat'), unit: 'g' },
        { name: 'Sugars', amount: this.getNutrient(rawProduct, 'sugars'), unit: 'g' },
        { name: 'Dietary Fiber', amount: this.getNutrient(rawProduct, 'fiber'), unit: 'g' },
        { name: 'Sodium', amount: this.getNutrient(rawProduct, 'sodium'), unit: 'mg' },
        { name: 'Salt', amount: this.getNutrient(rawProduct, 'salt'), unit: 'g' },
        { name: 'Energy', amount: this.getCalories(rawProduct), unit: 'kcal' }
      ].filter(nutrient => nutrient.amount > 0);

      return {
        success: true,
        facts: {
          serving_size: rawProduct.serving_size || '100g',
          calories_per_serving: this.getCalories(rawProduct),
          nutrients
        }
      };

    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get nutrition facts'
      };
    }
  }

  /**
   * Get product categories and tags
   */
  async getProductCategories(barcode) {
    try {
      const product = await this.getProductByBarcode(barcode);
      
      if (!product.success || !product.raw_product) {
        return {
          success: false,
          message: 'Product not found'
        };
      }

      const rawProduct = product.raw_product;

      return {
        success: true,
        categories: rawProduct.categories ? rawProduct.categories.split(',').map((c) => c.trim()) : [],
        labels: rawProduct.labels ? rawProduct.labels.split(',').map((l) => l.trim()) : [],
        allergens: rawProduct.allergens ? rawProduct.allergens.split(',').map((a) => a.trim()) : []
      };

    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get product categories'
      };
    }
  }

  /**
   * Check service availability
   */
  async checkServiceStatus() {
    try {
      const startTime = Date.now();
      
      const response = await fetch(`${this.baseUrl}/api/v0/product/737628064502.json`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': this.userAgent
        }
      });

      const responseTime = Date.now() - startTime;

      if (response.ok) {
        return {
          success: true,
          message: 'OpenFoodFacts API is available',
          responseTime
        };
      } else {
        return {
          success: false,
          message: `OpenFoodFacts API returned status: ${response.status}`
        };
      }

    } catch (error) {
      return {
        success: false,
        message: 'OpenFoodFacts API is not available'
      };
    }
  }

  // Private helper methods
  getCalories(product) {
    // Try different calorie fields in order of preference
    const nutriments = product.nutriments || {};
    
    return Math.round(
      nutriments.energy_kcal_100g ||
      nutriments.energy_kcal_serving ||
      nutriments['energy-kcal_100g'] ||
      nutriments['energy-kcal_serving'] ||
      nutriments['energy-kcal'] ||
      (nutriments.energy_100g ? nutriments.energy_100g / 4.184 : 0) || // Convert kJ to kcal
      0
    );
  }

  getNutrient(product, nutrient) {
    const nutriments = product.nutriments;
    if (!nutriments) return 0;

    // Try different formats - OpenFoodFacts uses various naming conventions
    const value = nutriments[`${nutrient}_100g`] ||
                  nutriments[`${nutrient}_serving`] ||
                  nutriments[`${nutrient}-_100g`] ||
                  nutriments[`${nutrient}`] ||
                  0;

    return Math.round((value + Number.EPSILON) * 100) / 100; // Round to 2 decimal places
  }

  getNovaDescription(novaGroup) {
    const descriptions = {
      1: 'Unprocessed or minimally processed foods',
      2: 'Processed culinary ingredients', 
      3: 'Processed foods',
      4: 'Ultra-processed food and drink products'
    };
    return descriptions[novaGroup] || 'Processing level not determined';
  }

  createVerdict(product) {
    let verdict = '';
    
    // Add product name and brand
    if (product.product_name) {
      verdict += `${product.product_name}`;
    }
    if (product.brands) {
      verdict += ` by ${product.brands}`;
    }
    
    verdict += '\n\n';

    // Add basic nutrition summary
    const calories = this.getCalories(product);
    if (calories > 0) {
      verdict += `**Nutrition per 100g:**\n`;
      verdict += `• Calories: ${calories} kcal\n`;
      
      const protein = this.getNutrient(product, 'proteins');
      const carbs = this.getNutrient(product, 'carbohydrates');
      const fat = this.getNutrient(product, 'fat');
      
      if (protein > 0) verdict += `• Protein: ${protein}g\n`;
      if (carbs > 0) verdict += `• Carbohydrates: ${carbs}g\n`;
      if (fat > 0) verdict += `• Fat: ${fat}g\n`;
      
      verdict += '\n';
    }

    // Add Nova classification info
    if (product.nova_group) {
      verdict += `**Processing Level:** ${this.getNovaDescription(product.nova_group)}\n\n`;
    }

    // Add Nutri-Score if available
    if (product.nutriscore_grade) {
      verdict += `**Nutri-Score:** ${product.nutriscore_grade.toUpperCase()}\n\n`;
    }

    // Add ingredients (truncated)
    if (product.ingredients_text) {
      verdict += `**Ingredients:** ${product.ingredients_text.substring(0, 200)}`;
      if (product.ingredients_text.length > 200) {
        verdict += '...';
      }
      verdict += '\n\n';
    }

    // Add allergens if available
    if (product.allergens) {
      const allergens = product.allergens.split(',').map((a) => a.trim().replace('en:', ''));
      verdict += `**Allergens:** ${allergens.join(', ')}\n\n`;
    }

    verdict += '**Source:** OpenFoodFacts Community Database';

    return verdict || 'Product information available from OpenFoodFacts';
  }
}

// Export singleton instance
const openFoodFactsController = new OpenFoodFactsService();

module.exports = {
  openFoodFactsController,
  OpenFoodFactsService
};