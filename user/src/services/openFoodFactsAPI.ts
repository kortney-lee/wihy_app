// Simple openFoodFactsAPI stub for user app
export const openFoodFactsAPI = {
  searchFood: async (query: string) => {
    // Stub implementation - in a real app this would connect to OpenFoodFacts API
    return {
      success: true,
      products: [
        {
          product_name: `Sample product for ${query}`,
          nutriments: {
            energy_100g: 100,
            proteins_100g: 5,
            carbohydrates_100g: 10,
            fat_100g: 2
          },
          nova_group: 1
        }
      ]
    };
  },

  searchProducts: async (query: string, limit?: number) => {
    // Alias for searchFood to match expected API
    return await openFoodFactsAPI.searchFood(query);
  },

  getProductByBarcode: async (barcode: string) => {
    // Stub implementation
    return {
      success: true,
      product: {
        product_name: `Product ${barcode}`,
        nutriments: {
          energy_100g: 150,
          proteins_100g: 8,
          carbohydrates_100g: 15,
          fat_100g: 3
        },
        nova_group: 2
      },
      message: 'Product found'
    };
  }
};