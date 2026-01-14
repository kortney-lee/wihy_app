/**
 * Scan Response Helper Utilities
 * 
 * Provides safe accessors for Scan API responses handling both FLAT and NESTED structures.
 * 
 * API Version: 6.0 (Deployed January 13, 2026)
 * 
 * Breaking Changes:
 * - Photo Scan: FLAT → NESTED (analysis + metadata)
 * - Recipe Scan: FLAT → NESTED (analysis only)
 * - Label Scan: FLAT → NESTED (analysis only)
 * - Barcode Scan: FLAT (unchanged)
 * - Product Lookup: FLAT (unchanged)
 */

/**
 * Safe nested accessor for scan API responses
 * Navigates nested object paths safely, returning default if any level is undefined
 * 
 * @param response The API response object
 * @param path Dot-separated path (e.g., "metadata.health_score", "analysis.ingredients")
 * @param defaultValue Default value if path not found
 * @returns Field value or default
 * 
 * @example
 * // Photo scan
 * const healthScore = getScanField<number>(photoResponse, 'metadata.health_score', 0);
 * const foods = getScanField<any[]>(photoResponse, 'analysis.detected_foods', []);
 * 
 * // Recipe scan
 * const ingredients = getScanField<any[]>(recipeResponse, 'analysis.ingredients', []);
 * 
 * // Label scan
 * const greenwashing = getScanField<number>(labelResponse, 'analysis.greenwashing_score', 0);
 */
export function getScanField<T>(
  response: any,
  path: string,
  defaultValue?: T
): T | undefined {
  if (!response || !path) {
    return defaultValue;
  }

  const parts = path.split('.');
  let current = response;

  for (const part of parts) {
    if (current?.[part] === undefined) {
      return defaultValue;
    }
    current = current[part];
  }

  return current as T;
}

/**
 * Convenience accessors for Photo Scan responses (NESTED: analysis + metadata)
 * 
 * @example
 * const result = await scanService.scanFoodPhoto(imageUri);
 * const foods = getPhotoDetectedFoods(result);
 * const healthScore = getPhotoHealthScore(result);
 * const nutrition = getPhotoNutrition(result);
 */
export const PhotoScanHelpers = {
  /**
   * Get detected foods from analysis
   * Path: response.analysis.detected_foods
   */
  getDetectedFoods: (response: any) =>
    getScanField<any[]>(response, 'analysis.detected_foods', []),

  /**
   * Get analysis confidence score
   * Path: response.analysis.confidence_score
   */
  getConfidenceScore: (response: any) =>
    getScanField<number>(response, 'analysis.confidence_score', 0),

  /**
   * Get meal classification
   * Path: response.analysis.meal_classification
   */
  getMealClassification: (response: any) =>
    getScanField<string>(response, 'analysis.meal_classification', ''),

  /**
   * Get analysis summary
   * Path: response.analysis.summary
   */
  getSummary: (response: any) =>
    getScanField<string>(response, 'analysis.summary', ''),

  /**
   * Get health score from metadata
   * Path: response.metadata.health_score
   */
  getHealthScore: (response: any) =>
    getScanField<number>(response, 'metadata.health_score', 0),

  /**
   * Get nutrition facts from metadata
   * Path: response.metadata.nutrition_facts
   */
  getNutritionFacts: (response: any) =>
    getScanField<any>(response, 'metadata.nutrition_facts', {}),

  /**
   * Get nutrition grade from metadata
   * Path: response.metadata.nutrition_grade
   */
  getNutritionGrade: (response: any) =>
    getScanField<any>(response, 'metadata.nutrition_grade', {}),

  /**
   * Get nova group from metadata
   * Path: response.metadata.nova_group
   */
  getNovaGroup: (response: any) =>
    getScanField<number>(response, 'metadata.nova_group', 1),

  /**
   * Get processing level from metadata
   * Path: response.metadata.processing_level
   */
  getProcessingLevel: (response: any) =>
    getScanField<string>(response, 'metadata.processing_level', 'unknown'),

  /**
   * Get diet compatibility from metadata
   * Path: response.metadata.diet_compatibility
   */
  getDietCompatibility: (response: any) =>
    getScanField<any>(response, 'metadata.diet_compatibility', {}),

  /**
   * Get nutrition analysis from metadata
   * Path: response.metadata.nutrition_analysis
   */
  getNutritionAnalysis: (response: any) =>
    getScanField<any>(response, 'metadata.nutrition_analysis', {}),
};

/**
 * Convenience accessors for Recipe Scan responses (NESTED: analysis only)
 * 
 * @example
 * const result = await scanService.scanRecipe(imageUri);
 * const title = getRecipeTitle(result);
 * const ingredients = getRecipeIngredients(result);
 * const instructions = getRecipeInstructions(result);
 */
export const RecipeScanHelpers = {
  /**
   * Get recipe title
   * Path: response.analysis.recipe_title
   */
  getTitle: (response: any) =>
    getScanField<string>(response, 'analysis.recipe_title', ''),

  /**
   * Get ingredients array
   * Path: response.analysis.ingredients
   */
  getIngredients: (response: any) =>
    getScanField<any[]>(response, 'analysis.ingredients', []),

  /**
   * Get cooking instructions
   * Path: response.analysis.instructions
   */
  getInstructions: (response: any) =>
    getScanField<string[]>(response, 'analysis.instructions', []),

  /**
   * Get number of servings
   * Path: response.analysis.servings
   */
  getServings: (response: any) =>
    getScanField<number>(response, 'analysis.servings', 1),

  /**
   * Get preparation time in minutes
   * Path: response.analysis.prep_time_minutes
   */
  getPrepTime: (response: any) =>
    getScanField<number>(response, 'analysis.prep_time_minutes', 0),

  /**
   * Get cooking time in minutes
   * Path: response.analysis.cook_time_minutes
   */
  getCookTime: (response: any) =>
    getScanField<number>(response, 'analysis.cook_time_minutes', 0),

  /**
   * Get difficulty level
   * Path: response.analysis.difficulty
   */
  getDifficulty: (response: any) =>
    getScanField<string>(response, 'analysis.difficulty', 'medium'),

  /**
   * Get cuisine type
   * Path: response.analysis.cuisine_type
   */
  getCuisineType: (response: any) =>
    getScanField<string>(response, 'analysis.cuisine_type', ''),

  /**
   * Get overall confidence
   * Path: response.analysis.confidence
   */
  getConfidence: (response: any) =>
    getScanField<number>(response, 'analysis.confidence', 0),
};

/**
 * Convenience accessors for Label Scan responses (NESTED: analysis only)
 * 
 * @example
 * const result = await scanService.scanLabel(imageUri);
 * const greenwashing = getLabelGreenwashing(result);
 * const claims = getLabelDetectedClaims(result);
 * const flags = getLabelGreenwashingFlags(result);
 */
export const LabelScanHelpers = {
  /**
   * Get product name
   * Path: response.analysis.product_name
   */
  getProductName: (response: any) =>
    getScanField<string>(response, 'analysis.product_name', ''),

  /**
   * Get greenwashing score (0-100, lower is better)
   * Path: response.analysis.greenwashing_score
   */
  getGreenwashingScore: (response: any) =>
    getScanField<number>(response, 'analysis.greenwashing_score', 0),

  /**
   * Get array of greenwashing flags/concerns
   * Path: response.analysis.greenwashing_flags
   */
  getGreenwashingFlags: (response: any) =>
    getScanField<any[]>(response, 'analysis.greenwashing_flags', []),

  /**
   * Get detected marketing claims
   * Path: response.analysis.detected_claims
   */
  getDetectedClaims: (response: any) =>
    getScanField<any[]>(response, 'analysis.detected_claims', []),

  /**
   * Get ingredients list
   * Path: response.analysis.ingredients_list
   */
  getIngredientsList: (response: any) =>
    getScanField<string[]>(response, 'analysis.ingredients_list', []),

  /**
   * Get certifications found on label
   * Path: response.analysis.certifications
   */
  getCertifications: (response: any) =>
    getScanField<string[]>(response, 'analysis.certifications', []),

  /**
   * Get health claims on label
   * Path: response.analysis.health_claims
   */
  getHealthClaims: (response: any) =>
    getScanField<string[]>(response, 'analysis.health_claims', []),

  /**
   * Get sustainability score (0-100, higher is better)
   * Path: response.analysis.sustainability_score
   */
  getSustainabilityScore: (response: any) =>
    getScanField<number>(response, 'analysis.sustainability_score', 0),

  /**
   * Get confidence in label analysis
   * Path: response.analysis.confidence
   */
  getConfidence: (response: any) =>
    getScanField<number>(response, 'analysis.confidence', 0),
};

/**
 * Convenience accessors for Barcode Scan responses (FLAT - no changes)
 * All fields at root level
 * 
 * @example
 * const result = await scanService.scanBarcode(barcode);
 * const productName = getProductName(result);
 * const healthScore = getBarecodeHealthScore(result);
 */
export const BarcodeScanHelpers = {
  /**
   * Get product name
   * Path: response.product_name
   */
  getProductName: (response: any) =>
    getScanField<string>(response, 'product_name', ''),

  /**
   * Get health score
   * Path: response.health_score
   */
  getHealthScore: (response: any) =>
    getScanField<number>(response, 'health_score', 0),

  /**
   * Get nutrition grade
   * Path: response.nutrition_grade
   */
  getNutritionGrade: (response: any) =>
    getScanField<string>(response, 'nutrition_grade', ''),

  /**
   * Get calories per serving
   * Path: response.calories_per_serving
   */
  getCaloriesPerServing: (response: any) =>
    getScanField<number>(response, 'calories_per_serving', 0),

  /**
   * Get protein in grams
   * Path: response.protein_g
   */
  getProtein: (response: any) =>
    getScanField<number>(response, 'protein_g', 0),

  /**
   * Get carbs in grams
   * Path: response.carbs_g
   */
  getCarbs: (response: any) =>
    getScanField<number>(response, 'carbs_g', 0),

  /**
   * Get fat in grams
   * Path: response.fat_g
   */
  getFat: (response: any) =>
    getScanField<number>(response, 'fat_g', 0),

  /**
   * Get fiber in grams
   * Path: response.fiber_g
   */
  getFiber: (response: any) =>
    getScanField<number>(response, 'fiber_g', 0),

  /**
   * Get sugar in grams
   * Path: response.sugar_g
   */
  getSugar: (response: any) =>
    getScanField<number>(response, 'sugar_g', 0),

  /**
   * Get allergens array
   * Path: response.allergens
   */
  getAllergens: (response: any) =>
    getScanField<string[]>(response, 'allergens', []),

  /**
   * Get ingredients array
   * Path: response.ingredients
   */
  getIngredients: (response: any) =>
    getScanField<string[]>(response, 'ingredients', []),
};

/**
 * Validate response structure matches expected format
 * 
 * @param response API response to validate
 * @param expectedType Type of response ('photo', 'recipe', 'label', 'barcode')
 * @returns true if response has expected structure
 * 
 * @example
 * if (validateScanResponse(result, 'photo')) {
 *   const foods = getPhotoDetectedFoods(result);
 * }
 */
export function validateScanResponse(
  response: any,
  expectedType: 'photo' | 'recipe' | 'label' | 'barcode' | 'product'
): boolean {
  if (!response || !response.success) {
    return false;
  }

  switch (expectedType) {
    case 'photo':
      // Photo scan should have nested analysis and metadata
      return !!(response.analysis && response.metadata);

    case 'recipe':
      // Recipe scan should have nested analysis
      return !!(response.analysis && response.analysis.recipe_title);

    case 'label':
      // Label scan should have nested analysis with greenwashing data
      return !!(
        response.analysis &&
        response.analysis.greenwashing_score !== undefined
      );

    case 'barcode':
    case 'product':
      // Barcode/product should be flat structure
      return !!(response.product_name && response.health_score !== undefined);

    default:
      return false;
  }
}

/**
 * Get response type from API response
 * 
 * @param response API response
 * @returns Response type or 'unknown'
 */
export function getScanResponseType(
  response: any
): 'photo' | 'recipe' | 'label' | 'barcode' | 'product' | 'unknown' {
  if (!response?.success) {
    return 'unknown';
  }

  // Check for nested structure (photo, recipe, label)
  if (response.analysis) {
    if (response.metadata) {
      return 'photo'; // analysis + metadata
    } else if (response.analysis.greenwashing_score !== undefined) {
      return 'label'; // analysis with greenwashing
    } else if (response.analysis.recipe_title) {
      return 'recipe'; // analysis with recipe_title
    }
  }

  // Check for flat structure (barcode, product)
  if (response.product_name) {
    return response.barcode ? 'barcode' : 'product';
  }

  return 'unknown';
}
