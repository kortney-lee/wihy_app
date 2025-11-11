import { UnifiedResponse, AskHealthResponse, HealthQuestionResponse } from '../services/wihyAPI';

/**
 * Extract health metrics from API response for dashboard display
 */
export interface HealthMetrics {
  weight: {
    current: number;
    goal: number;
    unit: string;
    progress: number;
  };
  calories: {
    consumed: number;
    burned: number;
    unit: string;
    progress: number;
  };
  steps: {
    current: number;
    goal: number;
    progress: number;
  };
  sleep: {
    hours: number;
    quality: number;
    goal: number;
    progress: number;
  };
  hydration: {
    current: number;
    goal: number;
    unit: string;
    progress: number;
  };
  bmi: {
    value: number;
    category: string;
    healthScore: number;
    target?: number;
  };
  healthScore: number;
  lastUpdated: string;
}

/**
 * Extract health metrics from various API response formats
 */
export function extractHealthMetrics(apiResponse?: any): HealthMetrics {
  // Default values - can be replaced with real data when available
  const defaultMetrics: HealthMetrics = {
    weight: {
      current: 68.5,
      goal: 65,
      unit: 'kg',
      progress: 70
    },
    calories: {
      consumed: 1850,
      burned: 2100,
      unit: 'kcal',
      progress: 85
    },
    steps: {
      current: 8742,
      goal: 10000,
      progress: 87
    },
    sleep: {
      hours: 7.2,
      quality: 82,
      goal: 8,
      progress: 82
    },
    hydration: {
      current: 1.8,
      goal: 2.5,
      unit: 'L',
      progress: 72
    },
    bmi: {
      value: 23.1,
      category: 'Normal weight',
      healthScore: 85,
      target: 22.5
    },
    healthScore: 75,
    lastUpdated: new Date().toLocaleDateString()
  };

  if (!apiResponse) {
    return defaultMetrics;
  }

  try {
    // Handle test data format first
    if (apiResponse.dataSource === 'test_generator' && apiResponse.data) {
      const testData = apiResponse.data;
      
      if (testData.analysis) {
        const healthMetrics = testData.analysis.health_metrics;
        const activityMetrics = testData.analysis.activity_metrics;
        
        return {
          weight: {
            current: healthMetrics?.weight?.current || defaultMetrics.weight.current,
            goal: healthMetrics?.weight?.target || defaultMetrics.weight.goal,
            unit: healthMetrics?.weight?.unit || 'kg',
            progress: Math.round((1 - Math.abs(healthMetrics?.weight?.current - healthMetrics?.weight?.target) / healthMetrics?.weight?.target) * 100) || 70
          },
          calories: {
            consumed: activityMetrics?.calories?.consumed || defaultMetrics.calories.consumed,
            burned: activityMetrics?.calories?.burned || defaultMetrics.calories.burned,
            unit: 'kcal',
            progress: Math.round((activityMetrics?.calories?.consumed / activityMetrics?.calories?.goal) * 100) || 85
          },
          steps: {
            current: activityMetrics?.steps?.daily || defaultMetrics.steps.current,
            goal: activityMetrics?.steps?.goal || defaultMetrics.steps.goal,
            progress: Math.round((activityMetrics?.steps?.daily / activityMetrics?.steps?.goal) * 100) || 87
          },
          sleep: {
            hours: activityMetrics?.sleep?.duration || defaultMetrics.sleep.hours,
            quality: activityMetrics?.sleep?.quality || defaultMetrics.sleep.quality,
            goal: 8,
            progress: activityMetrics?.sleep?.quality || 82
          },
          hydration: {
            current: activityMetrics?.hydration?.daily || defaultMetrics.hydration.current,
            goal: activityMetrics?.hydration?.goal || defaultMetrics.hydration.goal,
            unit: 'L',
            progress: Math.round((activityMetrics?.hydration?.daily / activityMetrics?.hydration?.goal) * 100) || 72
          },
          bmi: {
            value: healthMetrics?.bmi?.value || defaultMetrics.bmi.value,
            category: healthMetrics?.bmi?.category || defaultMetrics.bmi.category,
            healthScore: healthMetrics?.bmi?.healthScore || defaultMetrics.bmi.healthScore,
            target: healthMetrics?.bmi?.goal || defaultMetrics.bmi.target
          },
          healthScore: healthMetrics?.healthScore?.overall || defaultMetrics.healthScore,
          lastUpdated: new Date().toLocaleDateString()
        };
      }
    }

    // Handle UnifiedResponse format
    if ('success' in apiResponse && apiResponse.success && apiResponse.data) {
      const data = apiResponse.data;
      
      // Extract nutrition data if available
      if (data.nutrition?.facts) {
        const nutrition = data.nutrition.facts;
        defaultMetrics.calories.consumed = nutrition.calories_per_serving || defaultMetrics.calories.consumed;
        
        // Calculate BMI if we have weight data (placeholder - would need actual user data)
        if (nutrition.protein_g) {
          // Use protein content as a health indicator for BMI calculation
          const proteinFactor = Math.min(nutrition.protein_g / 20, 2); // Higher protein = healthier
          defaultMetrics.bmi.healthScore = Math.min(85 + (proteinFactor * 5), 95);
        }
      }

      // Extract health analysis if available
      if (data.health_analysis) {
        const healthAnalysis = data.health_analysis;
        if (healthAnalysis.safety_score !== undefined) {
          defaultMetrics.healthScore = Math.round(healthAnalysis.safety_score);
          defaultMetrics.bmi.healthScore = Math.round(healthAnalysis.safety_score);
        }
      }

      // Extract chart data if available
      if (data.charts_data?.daily_nutrition_progress?.nutrients) {
        const nutrients = data.charts_data.daily_nutrition_progress.nutrients;
        
        // Use nutrition progress to estimate overall health score
        const nutritionScores = nutrients.map((n: any) => (n.current / n.target) * 100);
        if (nutritionScores.length > 0) {
          const avgNutritionScore = nutritionScores.reduce((a: number, b: number) => a + b, 0) / nutritionScores.length;
          defaultMetrics.healthScore = Math.round(Math.min(avgNutritionScore, 100));
        }
      }
    }

    // Handle HealthQuestionResponse format
    else if ('data' in apiResponse && apiResponse.data?.nutrition_data) {
      const nutritionData = apiResponse.data.nutrition_data;
      
      // Extract calories if available
      if (nutritionData.calories) {
        defaultMetrics.calories.consumed = nutritionData.calories;
      }
      
      // Extract health insights for health score
      if (apiResponse.data.health_insights) {
        const insights = apiResponse.data.health_insights;
        if (insights.key_benefits?.length) {
          // More benefits = higher health score
          defaultMetrics.healthScore = Math.min(75 + (insights.key_benefits.length * 5), 95);
        }
      }
    }

    // Handle legacy WihyResponse format
    else if ('wihy_response' in apiResponse) {
      const wihyResponse = apiResponse.wihy_response;
      
      // Use confidence as health indicator
      if (apiResponse.confidence !== undefined) {
        defaultMetrics.healthScore = Math.round(apiResponse.confidence * 100);
        defaultMetrics.bmi.healthScore = Math.round(apiResponse.confidence * 100);
      }
    }

  } catch (error) {
    console.warn('Error extracting health metrics from API response:', error);
  }

  // Ensure all progress values are between 0-100
  defaultMetrics.weight.progress = Math.min(Math.max(defaultMetrics.weight.progress, 0), 100);
  defaultMetrics.calories.progress = Math.min(Math.max(defaultMetrics.calories.progress, 0), 100);
  defaultMetrics.steps.progress = Math.min(Math.max(defaultMetrics.steps.progress, 0), 100);
  defaultMetrics.sleep.progress = Math.min(Math.max(defaultMetrics.sleep.progress, 0), 100);
  defaultMetrics.hydration.progress = Math.min(Math.max(defaultMetrics.hydration.progress, 0), 100);

  return defaultMetrics;
}

/**
 * Extract BMI-specific data from API response
 */
export function extractBMIData(apiResponse?: any) {
  const metrics = extractHealthMetrics(apiResponse);
  return {
    bmi: metrics.bmi.value,
    category: metrics.bmi.category,
    healthScore: metrics.bmi.healthScore,
    goal: metrics.bmi.target
  };
}

/**
 * Extract nutrition data for nutrition analysis card
 */
export function extractNutritionData(apiResponse?: any) {
  if (!apiResponse) return undefined;

  try {
    // Handle test data format first
    if (apiResponse.dataSource === 'test_generator' && apiResponse.data?.analysis?.nutrition_data) {
      const nutrition = apiResponse.data.analysis.nutrition_data;
      
      return {
        calories: nutrition.macronutrients?.carbohydrates?.value + nutrition.macronutrients?.protein?.value * 4 + nutrition.macronutrients?.fat?.value * 9 || 2100,
        protein: nutrition.macronutrients?.protein?.value || 128,
        carbs: nutrition.macronutrients?.carbohydrates?.value || 245,
        fat: nutrition.macronutrients?.fat?.value || 82,
        fiber: 25, // Default for test data
        sugar: 50, // Default for test data  
        sodium: 2000, // Default for test data
        quality: nutrition.foodQuality || {
          novaScore: 2.3,
          processed: 25,
          ultraProcessed: 15,
          whole: 60
        },
        micronutrients: nutrition.micronutrients || {}
      };
    }

    // Handle UnifiedResponse format
    if ('success' in apiResponse && apiResponse.success && apiResponse.data?.nutrition?.facts) {
      const nutrition = apiResponse.data.nutrition.facts;
      return {
        calories: nutrition.calories_per_serving || 0,
        protein: nutrition.protein_g || 0,
        carbs: nutrition.carbs_g || 0,
        fat: nutrition.fat_g || 0,
        fiber: nutrition.fiber_g || 0,
        sugar: nutrition.sugar_g || 0,
        sodium: nutrition.sodium_mg || 0
      };
    }

    // Handle other formats...
    // Add more parsing logic as needed
  } catch (error) {
    console.warn('Error extracting nutrition data:', error);
  }

  return undefined;
}

/**
 * Extract health risk data from API response
 */
export function extractHealthRiskData(apiResponse?: any) {
  if (!apiResponse) return undefined;

  try {
    // Handle test data format first
    if (apiResponse.dataSource === 'test_generator' && apiResponse.data?.analysis?.health_risk) {
      const riskData = apiResponse.data.analysis.health_risk;
      
      return {
        riskLevel: riskData.overallRisk || 'Low-Moderate',
        riskScore: riskData.riskScore || 25,
        factors: riskData.categories?.flatMap(cat => cat.factors) || ['Regular exercise', 'Balanced diet', 'Normal BMI'],
        recommendations: riskData.categories?.flatMap(cat => cat.recommendations) || ['Maintain current lifestyle', 'Regular health checkups', 'Stay hydrated'],
        categories: riskData.categories || [],
        lifestyle: riskData.lifestyle || {}
      };
    }

    // Handle UnifiedResponse format with health analysis
    if ('success' in apiResponse && apiResponse.success && apiResponse.data?.health_analysis) {
      const healthAnalysis = apiResponse.data.health_analysis;
      
      const riskScore = 100 - (healthAnalysis.safety_score || 75); // Invert safety score to risk score
      let riskLevel: 'Low' | 'Moderate' | 'High' = 'Low';
      
      if (riskScore > 70) riskLevel = 'High';
      else if (riskScore > 30) riskLevel = 'Moderate';
      
      return {
        riskLevel,
        riskScore: Math.round(riskScore),
        factors: healthAnalysis.carcinogen_alerts || ['Regular exercise', 'Balanced diet', 'Normal BMI'],
        recommendations: ['Maintain current lifestyle', 'Regular health checkups', 'Stay hydrated']
      };
    }
  } catch (error) {
    console.warn('Error extracting health risk data:', error);
  }

  return undefined;
}