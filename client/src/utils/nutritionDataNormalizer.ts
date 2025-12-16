// Utility to normalize various food data sources into NutritionFactsData format

import { NutritionFactsData, FoodSource } from '../types/nutritionFacts';

/**
 * Normalize a barcode scan result to NutritionFactsData format
 */
export const normalizeBarcodeScan = (scanResult: any): NutritionFactsData => {
  // Handle BarcodeScanResult from wihyScanningService
  const data = scanResult.data || scanResult;
  const metadata = data.metadata || scanResult.analysis?.metadata || {};
  
  return {
    source: 'barcode',
    name: data.product?.name || metadata.product_name,
    brand: data.product?.brand || metadata.brand,
    imageUrl: data.product?.image_url,
    
    // Health scores
    healthScore: data.health_score || metadata.health_score,
    grade: data.nutrition?.grade || metadata.grade,
    novaScore: data.nova_group || data.product?.nova_group || metadata.nova_group,
    ultraProcessed: (data.nova_group || data.product?.nova_group || metadata.nova_group) >= 4,
    
    // Nutrition data
    calories: data.nutrition?.per_100g?.energy_kcal,
    macros: {
      protein: data.nutrition?.per_100g?.proteins,
      carbs: data.nutrition?.per_100g?.carbohydrates,
      fat: data.nutrition?.per_100g?.fat,
      sugar: data.nutrition?.per_100g?.sugars,
      fiber: data.nutrition?.per_100g?.fiber,
    },
    servingSize: '100g',
    
    // Ingredients and additives
    ingredientsText: metadata.ingredients_text,
    additives: metadata.additives || data.additives || {},
    
    // Insights from health_analysis
    negatives: (data.health_analysis?.alerts || []).map((alert: any) => ({
      label: alert.message,
      description: alert.severity ? `Severity: ${alert.severity}` : undefined,
    })),
    
    positives: data.health_score && data.health_score > 70 
      ? [{ 
          label: 'Good overall health score', 
          description: `Score: ${data.health_score}/100` 
        }]
      : [],
    
    recommendations: [],
  };
};

/**
 * Normalize an image analysis result to NutritionFactsData format
 */
export const normalizeImageAnalysis = (imageResult: any): NutritionFactsData => {
  const analysis = imageResult.analysis || imageResult.data || imageResult;
  
  return {
    source: 'image',
    name: analysis.detected_items?.[0] || 'Analyzed Food',
    imageUrl: imageResult.imageUrl || analysis.image_url,
    
    healthScore: analysis.health_score,
    grade: analysis.grade,
    
    // Extract nutrition if available
    calories: analysis.nutrition?.calories,
    macros: {
      protein: analysis.nutrition?.protein,
      carbs: analysis.nutrition?.carbs,
      fat: analysis.nutrition?.fat,
      sugar: analysis.nutrition?.sugar,
      fiber: analysis.nutrition?.fiber,
    },
    
    positives: (analysis.positives || []).map((p: any) => ({
      label: typeof p === 'string' ? p : p.label || p.name,
      description: p.description,
    })),
    
    negatives: (analysis.negatives || []).map((n: any) => ({
      label: typeof n === 'string' ? n : n.label || n.name,
      description: n.description,
    })),
    
    recommendations: analysis.recommendations || [],
  };
};

/**
 * Normalize a nutrition label scan to NutritionFactsData format
 */
export const normalizeNutritionLabel = (labelResult: any): NutritionFactsData => {
  const data = labelResult.data || labelResult;
  
  return {
    source: 'nutrition_label',
    name: data.product_name || 'Scanned Product',
    brand: data.brand,
    
    calories: data.calories,
    macros: {
      protein: data.protein,
      carbs: data.carbohydrates || data.carbs,
      fat: data.fat,
      sugar: data.sugars || data.sugar,
      fiber: data.fiber,
    },
    servingSize: data.serving_size,
    servingsPerContainer: data.servings_per_container,
    
    healthScore: data.health_score,
    grade: data.grade,
    novaScore: data.nova_score,
    
    positives: [],
    negatives: [],
    recommendations: [],
  };
};

/**
 * Normalize a meal photo analysis to NutritionFactsData format
 */
export const normalizeMealAnalysis = (mealResult: any): NutritionFactsData => {
  const data = mealResult.data || mealResult;
  
  return {
    source: 'meal',
    name: data.meal_name || 'Analyzed Meal',
    imageUrl: mealResult.imageUrl || data.image_url,
    
    calories: data.total_calories,
    macros: {
      protein: data.total_protein,
      carbs: data.total_carbs,
      fat: data.total_fat,
      sugar: data.total_sugar,
      fiber: data.total_fiber,
    },
    
    healthScore: data.health_score,
    grade: data.grade,
    
    positives: (data.healthy_components || []).map((item: string) => ({
      label: item,
    })),
    
    negatives: (data.concerns || []).map((item: string) => ({
      label: item,
    })),
    
    recommendations: data.suggestions || [],
  };
};

/**
 * Auto-detect type and normalize any food analysis result
 */
export const normalizeAnyFoodData = (result: any): NutritionFactsData => {
  if (!result) {
    throw new Error('No data provided to normalize');
  }
  
  // Check type field if available
  const type = result.type || result.scanType;
  
  switch (type) {
    case 'barcode_scan':
    case 'barcode':
      return normalizeBarcodeScan(result);
      
    case 'image_analysis':
    case 'vision_analysis':
      return normalizeImageAnalysis(result);
      
    case 'nutrition_label':
      return normalizeNutritionLabel(result);
      
    case 'meal':
    case 'meal_analysis':
      return normalizeMealAnalysis(result);
      
    default:
      // Try to infer from data structure
      if (result.data?.product || result.product) {
        return normalizeBarcodeScan(result);
      } else if (result.imageUrl || result.detected_items) {
        return normalizeImageAnalysis(result);
      } else if (result.serving_size || result.servings_per_container) {
        return normalizeNutritionLabel(result);
      } else {
        // Fallback: generic format
        return {
          source: 'generic',
          name: result.name || 'Food Item',
          healthScore: result.health_score || result.score,
          grade: result.grade,
          positives: result.positives || [],
          negatives: result.negatives || [],
          recommendations: result.recommendations || [],
        };
      }
  }
};
