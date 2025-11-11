import { ChartType } from './chartTypes';
import { CardData } from './cardConfig';

/**
 * API response mapping interface
 */
export interface ApiResponse {
  [key: string]: any;
}

/**
 * Dynamic card mapping based on API response data
 */
export interface DynamicCardMapping {
  cardId: string;
  chartType: ChartType;
  dataPath: string; // Path to data in API response (e.g., 'health.bmi')
  condition?: (data: any) => boolean; // Optional condition to show card
  transform?: (data: any) => any; // Optional data transformation
}

/**
 * Default dynamic mappings for cards 2-5
 * Card 1 is always QuickInsights and doesn't need dynamic mapping
 */
export const DYNAMIC_CARD_MAPPINGS: DynamicCardMapping[] = [
  {
    cardId: 'card-2',
    chartType: ChartType.BMI_DOMAIN,
    dataPath: 'health.bmi',
    condition: (data) => data && typeof data === 'object' && data.value !== undefined
  },
  {
    cardId: 'card-2',
    chartType: ChartType.HEALTH_RISK,
    dataPath: 'health.risk',
    condition: (data) => data && Array.isArray(data.factors) && data.factors.length > 0
  },
  {
    cardId: 'card-3',
    chartType: ChartType.WEIGHT_TREND,
    dataPath: 'activity.weight',
    condition: (data) => data && Array.isArray(data.history) && data.history.length > 1
  },
  {
    cardId: 'card-3',
    chartType: ChartType.STEPS,
    dataPath: 'activity.steps',
    condition: (data) => data && (data.daily !== undefined || data.weekly !== undefined)
  },
  {
    cardId: 'card-4',
    chartType: ChartType.ACTIVE_MINUTES,
    dataPath: 'activity.activeMinutes',
    condition: (data) => data && data.total !== undefined
  },
  {
    cardId: 'card-4',
    chartType: ChartType.SLEEP,
    dataPath: 'activity.sleep',
    condition: (data) => data && (data.duration !== undefined || data.quality !== undefined)
  },
  {
    cardId: 'card-5',
    chartType: ChartType.HYDRATION,
    dataPath: 'activity.hydration',
    condition: (data) => data && data.dailyIntake !== undefined
  },
  {
    cardId: 'card-5',
    chartType: ChartType.CALORIES,
    dataPath: 'nutrition.calories',
    condition: (data) => data && (data.consumed !== undefined || data.burned !== undefined)
  },
  {
    cardId: 'card-5',
    chartType: ChartType.NUTRITION,
    dataPath: 'nutrition.overview',
    condition: (data) => data && typeof data === 'object'
  }
];

/**
 * Get nested value from object using dot notation path
 */
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

/**
 * Determine chart type and data for a card based on API response
 */
export function determineCardContent(
  cardId: string,
  apiResponse: ApiResponse
): { chartType: ChartType; data: any } | null {
  
  // Card 1 is always QuickInsights
  if (cardId === 'card-1') {
    return {
      chartType: ChartType.QUICK_INSIGHTS,
      data: apiResponse // Pass full response for overview
    };
  }
  
  // Find the first available mapping for this card
  const availableMappings = DYNAMIC_CARD_MAPPINGS.filter(mapping => mapping.cardId === cardId);
  
  for (const mapping of availableMappings) {
    const data = getNestedValue(apiResponse, mapping.dataPath);
    
    if (data && (!mapping.condition || mapping.condition(data))) {
      return {
        chartType: mapping.chartType,
        data: mapping.transform ? mapping.transform(data) : data
      };
    }
  }
  
  return null; // No suitable data found for this card
}

/**
 * Generate dynamic card configurations based on API response
 */
export function generateDynamicCards(
  apiResponse: ApiResponse,
  cardIds: string[] = ['card-1', 'card-2', 'card-3', 'card-4', 'card-5']
): CardData[] {
  const cards: CardData[] = [];
  
  for (const cardId of cardIds) {
    const content = determineCardContent(cardId, apiResponse);
    
    if (content || cardId === 'card-1') { // Card 1 always appears
      cards.push({
        id: cardId,
        title: getChartTypeTitle(content?.chartType || ChartType.QUICK_INSIGHTS),
        chartType: content?.chartType || ChartType.QUICK_INSIGHTS,
        data: content?.data,
        priority: getChartTypePriority(content?.chartType || ChartType.QUICK_INSIGHTS),
        isAlwaysVisible: cardId === 'card-1'
      });
    }
  }
  
  return cards;
}

/**
 * Helper function to get chart type title
 */
function getChartTypeTitle(chartType: ChartType): string {
  const titles: Record<ChartType, string> = {
    [ChartType.QUICK_INSIGHTS]: 'Quick Insights',
    [ChartType.BMI_DOMAIN]: 'BMI Analysis',
    [ChartType.HEALTH_RISK]: 'Health Risk',
    [ChartType.HEALTH_SCORE]: 'Health Score',
    [ChartType.CURRENT_WEIGHT]: 'Current Weight',
    [ChartType.WEIGHT_TREND]: 'Weight Trend',
    [ChartType.ACTIVITY]: 'Activity Overview',
    [ChartType.STEPS]: 'Daily Steps',
    [ChartType.STEPS_CHART]: 'Steps History',
    [ChartType.ACTIVE_MINUTES]: 'Active Minutes',
    [ChartType.SLEEP]: 'Sleep Analysis',
    [ChartType.HYDRATION]: 'Hydration',
    [ChartType.HYDRATION_CHART]: 'Hydration Tracking',
    [ChartType.BLOOD_PRESSURE]: 'Blood Pressure Trends',
    [ChartType.HEART_RATE]: 'Heart Rate Analysis',
    [ChartType.CALORIES]: 'Calories',
    [ChartType.CALORIES_CHART]: 'Calorie Tracking',
    [ChartType.NUTRITION]: 'Nutrition',
    [ChartType.NUTRITION_TRACKING]: 'Nutrition Tracking',
    [ChartType.MACRONUTRIENTS]: 'Macronutrients',
    [ChartType.DOPAMINE]: 'Dopamine Analysis',
    [ChartType.MOOD_CHART]: 'Mood Tracking',
    [ChartType.NOVA_SCORE]: 'NOVA Score',
    [ChartType.RESEARCH_QUALITY]: 'Research Quality',
    [ChartType.PUBLICATION_TIMELINE]: 'Publications',
    [ChartType.VITAMIN_CONTENT]: 'Vitamins',
    [ChartType.DAILY_VALUE_PROGRESS]: 'Daily Values',
    [ChartType.STUDY_TYPE_DISTRIBUTION]: 'Study Types',
    [ChartType.RESULT_QUALITY_PIE]: 'Result Quality',
    [ChartType.BMI_BODY_FAT]: 'BMI & Body Fat',
    [ChartType.SLEEP_CHART]: 'Sleep Patterns',
    [ChartType.HEALTH_RISK_CHART]: 'Health Risk Chart',
    [ChartType.NUTRITION_GRADE_BADGE]: 'Nutrition Grade'
  };
  
  return titles[chartType] || chartType;
}

/**
 * Helper function to get chart type priority
 */
function getChartTypePriority(chartType: ChartType): number {
  const priorities: Record<ChartType, number> = {
    [ChartType.QUICK_INSIGHTS]: 100,
    [ChartType.BMI_DOMAIN]: 85,
    [ChartType.HEALTH_RISK]: 80,
    [ChartType.HEALTH_SCORE]: 79,
    [ChartType.CURRENT_WEIGHT]: 78,
    [ChartType.WEIGHT_TREND]: 75,
    [ChartType.ACTIVITY]: 72,
    [ChartType.STEPS]: 70,
    [ChartType.STEPS_CHART]: 68,
    [ChartType.ACTIVE_MINUTES]: 65,
    [ChartType.SLEEP]: 60,
    [ChartType.HYDRATION]: 55,
    [ChartType.HYDRATION_CHART]: 65,
    [ChartType.BLOOD_PRESSURE]: 76,
    [ChartType.HEART_RATE]: 68,
    [ChartType.CALORIES]: 50,
    [ChartType.CALORIES_CHART]: 55,
    [ChartType.NUTRITION]: 45,
    [ChartType.NUTRITION_TRACKING]: 52,
    [ChartType.MACRONUTRIENTS]: 40,
    [ChartType.DOPAMINE]: 35,
    [ChartType.MOOD_CHART]: 38,
    [ChartType.NOVA_SCORE]: 30,
    [ChartType.RESEARCH_QUALITY]: 25,
    [ChartType.STUDY_TYPE_DISTRIBUTION]: 25,
    [ChartType.PUBLICATION_TIMELINE]: 20,
    [ChartType.RESULT_QUALITY_PIE]: 20,
    [ChartType.VITAMIN_CONTENT]: 15,
    [ChartType.DAILY_VALUE_PROGRESS]: 10,
    [ChartType.BMI_BODY_FAT]: 73,
    [ChartType.SLEEP_CHART]: 62,
    [ChartType.HEALTH_RISK_CHART]: 81,
    [ChartType.NUTRITION_GRADE_BADGE]: 48
  };
  
  return priorities[chartType] || 0;
}