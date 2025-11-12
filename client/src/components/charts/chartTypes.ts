/**
 * Centralized chart type definitions with priority system
 * Higher priority numbers display first
 */
export enum ChartType {
  // Priority 100: Always visible core components
  QUICK_INSIGHTS = 'QUICK_INSIGHTS',

  // Priority 80-90: Essential health metrics
  BMI_DOMAIN = 'BMI_DOMAIN',
  HEALTH_RISK = 'HEALTH_RISK',
  HEALTH_SCORE = 'HEALTH_SCORE',
  CURRENT_WEIGHT = 'CURRENT_WEIGHT',
  WEIGHT_TREND = 'WEIGHT_TREND',

  // Priority 60-70: Activity and lifestyle
  ACTIVITY = 'ACTIVITY',
  STEPS = 'STEPS',
  STEPS_CHART = 'STEPS_CHART',
  ACTIVE_MINUTES = 'ACTIVE_MINUTES',
  SLEEP = 'SLEEP',
  HYDRATION = 'HYDRATION',
  HYDRATION_CHART = 'HYDRATION_CHART',
  BLOOD_PRESSURE = 'BLOOD_PRESSURE',
  HEART_RATE = 'HEART_RATE',

  // Priority 40-50: Nutrition and diet
  CALORIES = 'CALORIES',
  CALORIES_CHART = 'CALORIES_CHART',
  NUTRITION = 'NUTRITION',
  NUTRITION_TRACKING = 'NUTRITION_TRACKING',
  MACRONUTRIENTS = 'MACRONUTRIENTS',

  // Priority 30-40: Mind/behavior
  DOPAMINE = 'DOPAMINE',
  MOOD_CHART = 'MOOD_CHART',

  // Membership and user status
  MEMBERS_CARD = 'MEMBERS_CARD',

  // Priority 20-30: Research and analysis
  NOVA_SCORE = 'NOVA_SCORE',
  RESEARCH_QUALITY = 'RESEARCH_QUALITY',
  PUBLICATION_TIMELINE = 'PUBLICATION_TIMELINE',
  STUDY_TYPE_DISTRIBUTION = 'STUDY_TYPE_DISTRIBUTION',
  RESULT_QUALITY_PIE = 'RESULT_QUALITY_PIE',

  // Priority 10-20: Supplementary charts and detailed views
  VITAMIN_CONTENT = 'VITAMIN_CONTENT',
  DAILY_VALUE_PROGRESS = 'DAILY_VALUE_PROGRESS',
  BMI_BODY_FAT = 'BMI_BODY_FAT',
  SLEEP_CHART = 'SLEEP_CHART',
  HEALTH_RISK_CHART = 'HEALTH_RISK_CHART',
  NUTRITION_GRADE_BADGE = 'NUTRITION_GRADE_BADGE'
}

/**
 * Chart configuration metadata
 */
export interface ChartTypeConfig {
  type: ChartType;
  label: string;
  priority: number;
  requiresData: boolean;
  category: 'health' | 'activity' | 'nutrition' | 'research' | 'mind';
  tabView: ('overview' | 'charts' | 'nutrition' | 'research' | 'insights')[];
  description?: string;
}

/**
 * Complete chart type configurations organized by tab:
 * 📊 My Progress: General health + activity + daily tracking visuals
 * 🥗 Nutrition: All diet, macro/micro, and food classification data  
 * 💡 Insights: Behavioral, mood, coaching, and adaptive guidance layer
 * 🔬 Research: Evidence, literature, and study quality
 */
export const CHART_TYPE_CONFIGS: Record<ChartType, ChartTypeConfig> = {
  // --- OVERVIEW (keep minimal; gate via Search) ---
  [ChartType.QUICK_INSIGHTS]: {
    type: ChartType.QUICK_INSIGHTS,
    label: 'Quick Insights',
    priority: 100,
    requiresData: false, // render even with partial context
    category: 'health',
    tabView: ['overview'],
    description: 'Essential health overview and quick navigation'
  },

  // --- HEALTH: MY PROGRESS + INSIGHTS ---
  [ChartType.BMI_DOMAIN]: {
    type: ChartType.BMI_DOMAIN,
    label: 'BMI Domain Analysis',
    priority: 85,
    requiresData: true,
    category: 'health',
    tabView: ['charts'],
    description: 'Body Mass Index analysis and health domain insights'
  },
  [ChartType.HEALTH_RISK]: {
    type: ChartType.HEALTH_RISK,
    label: 'Health Risk Analysis',
    priority: 80,
    requiresData: true,
    category: 'health',
    tabView: ['insights'],
    description: 'Risk factors card view for behavioral and adaptive guidance'
  },
  [ChartType.HEALTH_SCORE]: {
    type: ChartType.HEALTH_SCORE,
    label: 'Health Score',
    priority: 79,
    requiresData: true,
    category: 'health',
    tabView: ['charts'],
    description: 'Overall health score gauge and metrics'
  },
  [ChartType.CURRENT_WEIGHT]: {
    type: ChartType.CURRENT_WEIGHT,
    label: 'Current Weight',
    priority: 78,
    requiresData: true,
    category: 'health',
    tabView: ['charts'],
    description: 'Current weight and goal tracking'
  },
  [ChartType.WEIGHT_TREND]: {
    type: ChartType.WEIGHT_TREND,
    label: 'Weight Trend',
    priority: 75,
    requiresData: true,
    category: 'health',
    tabView: ['charts'],
    description: 'Weight progression over time'
  },
  [ChartType.BLOOD_PRESSURE]: {
    type: ChartType.BLOOD_PRESSURE,
    label: 'Blood Pressure Trends',
    priority: 76,
    requiresData: true,
    category: 'health',
    tabView: ['charts'],
    description: 'Systolic and diastolic blood pressure monitoring'
  },
  [ChartType.BMI_BODY_FAT]: {
    type: ChartType.BMI_BODY_FAT,
    label: 'BMI & Body Fat',
    priority: 73,
    requiresData: true,
    category: 'health',
    tabView: ['charts'],
    description: 'BMI and body fat percentage analysis'
  },
  [ChartType.HEALTH_RISK_CHART]: {
    type: ChartType.HEALTH_RISK_CHART,
    label: 'Health Risk (Chart)',
    priority: 81,
    requiresData: true,
    category: 'health',
    tabView: ['charts'],
    description: 'Detailed health risk assessment chart'
  },

  // --- ACTIVITY: MY PROGRESS ---
  [ChartType.ACTIVITY]: {
    type: ChartType.ACTIVITY,
    label: 'Activity Overview',
    priority: 72,
    requiresData: true,
    category: 'activity',
    tabView: ['charts'],
    description: 'Comprehensive activity metrics and daily tracking visuals'
  },
  [ChartType.STEPS]: {
    type: ChartType.STEPS,
    label: 'Daily Steps (Card)',
    priority: 70,
    requiresData: true,
    category: 'activity',
    tabView: ['charts'],
    description: 'Step count tracking and goals'
  },
  [ChartType.STEPS_CHART]: {
    type: ChartType.STEPS_CHART,
    label: 'Steps History',
    priority: 68,
    requiresData: true,
    category: 'activity',
    tabView: ['charts'],
    description: 'Step count trends and historical analysis'
  },
  [ChartType.ACTIVE_MINUTES]: {
    type: ChartType.ACTIVE_MINUTES,
    label: 'Active Minutes',
    priority: 65,
    requiresData: true,
    category: 'activity',
    tabView: ['charts'],
    description: 'Daily active minutes and exercise tracking'
  },
  [ChartType.SLEEP]: {
    type: ChartType.SLEEP,
    label: 'Sleep (Card)',
    priority: 60,
    requiresData: true,
    category: 'activity',
    tabView: ['charts'],
    description: 'Sleep quality and duration summary'
  },
  [ChartType.SLEEP_CHART]: {
    type: ChartType.SLEEP_CHART,
    label: 'Sleep Patterns (Chart)',
    priority: 62,
    requiresData: true,
    category: 'activity',
    tabView: ['charts'],
    description: 'Detailed sleep pattern analysis'
  },
  [ChartType.HYDRATION]: {
    type: ChartType.HYDRATION,
    label: 'Hydration (Card)',
    priority: 55,
    requiresData: true,
    category: 'activity',
    tabView: ['charts'],
    description: 'Daily water intake summary'
  },
  [ChartType.HYDRATION_CHART]: {
    type: ChartType.HYDRATION_CHART,
    label: 'Hydration (Chart)',
    priority: 65,
    requiresData: true,
    category: 'activity',
    tabView: ['charts'],
    description: 'Daily hydration tracking and analysis'
  },
  [ChartType.HEART_RATE]: {
    type: ChartType.HEART_RATE,
    label: 'Heart Rate',
    priority: 68,
    requiresData: true,
    category: 'activity',
    tabView: ['charts'],
    description: 'Heart rate monitoring and zone analysis'
  },

  // --- NUTRITION: MY PROGRESS + NUTRITION + INSIGHTS ---
  [ChartType.CALORIES]: {
    type: ChartType.CALORIES,
    label: 'Calories (Card)',
    priority: 50,
    requiresData: true,
    category: 'nutrition',
    tabView: ['nutrition', 'charts'],
    description: 'Caloric intake vs expenditure summary - shared between My Progress and Nutrition'
  },
  [ChartType.CALORIES_CHART]: {
    type: ChartType.CALORIES_CHART,
    label: 'Calorie Tracking',
    priority: 55,
    requiresData: true,
    category: 'nutrition',
    tabView: ['nutrition', 'charts'],
    description: 'Calorie burn and intake analysis - shared between My Progress and Nutrition'
  },
  [ChartType.NUTRITION]: {
    type: ChartType.NUTRITION,
    label: 'Nutrition Overview',
    priority: 45,
    requiresData: true,
    category: 'nutrition',
    tabView: ['nutrition', 'charts'],
    description: 'Comprehensive nutritional analysis - shared between My Progress and Nutrition'
  },
  [ChartType.NUTRITION_TRACKING]: {
    type: ChartType.NUTRITION_TRACKING,
    label: 'Nutrition Tracking - Macronutrients',
    priority: 52,
    requiresData: true,
    category: 'nutrition',
    tabView: ['nutrition', 'insights'],
    description: 'Longitudinal intake trends for behavioral and adaptive guidance'
  },
  [ChartType.MACRONUTRIENTS]: {
    type: ChartType.MACRONUTRIENTS,
    label: 'Macronutrient Breakdown',
    priority: 40,
    requiresData: true,
    category: 'nutrition',
    tabView: ['nutrition', 'insights'],
    description: 'Habit-linked macro balance for behavioral coaching'
  },
  [ChartType.VITAMIN_CONTENT]: {
    type: ChartType.VITAMIN_CONTENT,
    label: 'Vitamin & Mineral Content',
    priority: 15,
    requiresData: true,
    category: 'nutrition',
    tabView: ['nutrition'],
    description: 'Micronutrient content and food classification data'
  },
  [ChartType.DAILY_VALUE_PROGRESS]: {
    type: ChartType.DAILY_VALUE_PROGRESS,
    label: 'Daily Value Progress',
    priority: 10,
    requiresData: true,
    category: 'nutrition',
    tabView: ['nutrition'],
    description: 'Percent DV progress across macro/micro nutrients'
  },
  [ChartType.NUTRITION_GRADE_BADGE]: {
    type: ChartType.NUTRITION_GRADE_BADGE,
    label: 'Nutrition Grade',
    priority: 48,
    requiresData: true,
    category: 'nutrition',
    tabView: ['nutrition', 'charts'],
    description: 'Nutrition quality grade badge - shared between My Progress and Nutrition'
  },

  // --- MIND/BEHAVIOR: INSIGHTS ---
  [ChartType.DOPAMINE]: {
    type: ChartType.DOPAMINE,
    label: 'Dopamine Levels',
    priority: 35,
    requiresData: false, // can render with modeled/estimated series
    category: 'mind',
    tabView: ['insights'],
    description: 'Behavioral reward & craving patterns for adaptive guidance'
  },
  [ChartType.MOOD_CHART]: {
    type: ChartType.MOOD_CHART,
    label: 'Mood & Well-being',
    priority: 38,
    requiresData: false,
    category: 'mind',
    tabView: ['insights'],
    description: 'Mood, energy, and stress trends for behavioral coaching'
  },

  // --- MEMBERSHIP & USER STATUS ---
  [ChartType.MEMBERS_CARD]: {
    type: ChartType.MEMBERS_CARD,
    label: 'Membership Status',
    priority: 95,
    requiresData: false,
    category: 'health',
    tabView: ['overview', 'charts'],
    description: 'Display member badge and benefits based on membership tier'
  },

  // --- RESEARCH: MULTI-TAB NOVA + RESEARCH ---
  [ChartType.NOVA_SCORE]: {
    type: ChartType.NOVA_SCORE,
    label: 'NOVA Food Processing',
    priority: 20,
    requiresData: true,
    category: 'research',
    tabView: ['charts', 'nutrition', 'research'], // My Progress (badge view), Nutrition (full data), Research (evidence)
    description: 'Food processing classification - badge view in My Progress, full data in Nutrition, evidence in Research'
  },
  [ChartType.RESEARCH_QUALITY]: {
    type: ChartType.RESEARCH_QUALITY,
    label: 'Research Quality',
    priority: 25,
    requiresData: true,
    category: 'research',
    tabView: ['research'],
    description: 'Scientific evidence quality assessment'
  },
  [ChartType.PUBLICATION_TIMELINE]: {
    type: ChartType.PUBLICATION_TIMELINE,
    label: 'Publication Timeline',
    priority: 20,
    requiresData: true,
    category: 'research',
    tabView: ['research'],
    description: 'Research publication chronology and literature timeline'
  },
  [ChartType.STUDY_TYPE_DISTRIBUTION]: {
    type: ChartType.STUDY_TYPE_DISTRIBUTION,
    label: 'Study Type Distribution',
    priority: 25,
    requiresData: true,
    category: 'research',
    tabView: ['research'],
    description: 'Distribution of research study types and methodologies'
  },
  [ChartType.RESULT_QUALITY_PIE]: {
    type: ChartType.RESULT_QUALITY_PIE,
    label: 'Result Quality Analysis',
    priority: 30,
    requiresData: true,
    category: 'research',
    tabView: ['research'],
    description: 'Research result quality distribution and study quality metrics'
  }
};

/**
 * Get chart types sorted by priority (highest first)
 */
export function getChartTypesByPriority(): ChartTypeConfig[] {
  return Object.values(CHART_TYPE_CONFIGS).sort((a, b) => b.priority - a.priority);
}

/**
 * Get chart types by category
 */
export function getChartTypesByCategory(
  category: 'health' | 'activity' | 'nutrition' | 'research' | 'mind'
): ChartTypeConfig[] {
  return Object.values(CHART_TYPE_CONFIGS)
    .filter(config => config.category === category)
    .sort((a, b) => b.priority - a.priority);
}

/**
 * Get chart types by tab view (Search-level grouping)
 */
export function getChartTypesByTab(
  tab: 'overview' | 'charts' | 'nutrition' | 'research' | 'insights' | 'all'
): ChartTypeConfig[] {
  if (tab === 'all') return getChartTypesByPriority();
  return Object.values(CHART_TYPE_CONFIGS)
    .filter(config => config.tabView.includes(tab))
    .sort((a, b) => b.priority - a.priority);
}