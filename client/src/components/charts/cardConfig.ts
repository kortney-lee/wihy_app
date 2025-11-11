import { ChartType } from './chartTypes';

/**
 * Card data interface for passing configuration to dynamic cards
 */
export interface CardData {
  id: string;
  title: string;
  chartType: ChartType;
  data?: any;
  config?: any;
  links?: Array<{
    label: string;
    href: string;
    icon?: string;
  }>;
  className?: string;
  priority?: number;
  isAlwaysVisible?: boolean;
}

/**
 * Default configurations for numbered cards
 */
export const DEFAULT_CARD_CONFIGS: Record<string, Partial<CardData>> = {
  'card-1': {
    id: 'card-1',
    title: 'Quick Insights',
    chartType: ChartType.QUICK_INSIGHTS,
    priority: 100,
    isAlwaysVisible: true, // Card 1 is always visible
    links: [
      { label: 'Health Dashboard', href: '/health' },
      { label: 'Nutrition Analysis', href: '/nutrition' },
      { label: 'Activity Tracking', href: '/activity' },
      { label: 'Research Portal', href: '/research' }
    ]
  },
  'card-2': {
    id: 'card-2',
    title: 'BMI Domain Analysis',
    chartType: ChartType.BMI_DOMAIN,
    priority: 85
  },
  'card-3': {
    id: 'card-3',
    title: 'Health Risk Assessment',
    chartType: ChartType.HEALTH_RISK,
    priority: 80
  },
  'card-4': {
    id: 'card-4',
    title: 'Weight Trend',
    chartType: ChartType.WEIGHT_TREND,
    priority: 75
  },
  'card-5': {
    id: 'card-5',
    title: 'Daily Steps',
    chartType: ChartType.STEPS,
    priority: 70
  },
  'card-6': {
    id: 'card-6',
    title: 'Active Minutes',
    chartType: ChartType.ACTIVE_MINUTES,
    priority: 65
  },
  'card-7': {
    id: 'card-7',
    title: 'Sleep Analysis',
    chartType: ChartType.SLEEP,
    priority: 60
  },
  'card-8': {
    id: 'card-8',
    title: 'Hydration Tracking',
    chartType: ChartType.HYDRATION,
    priority: 55
  },
  'card-9': {
    id: 'card-9',
    title: 'Calorie Analysis',
    chartType: ChartType.CALORIES,
    priority: 50
  },
  'card-10': {
    id: 'card-10',
    title: 'Nutrition Overview',
    chartType: ChartType.NUTRITION,
    priority: 45
  },
  'card-11': {
    id: 'card-11',
    title: 'Macronutrient Distribution',
    chartType: ChartType.MACRONUTRIENTS,
    priority: 40
  },
  'card-12': {
    id: 'card-12',
    title: 'NOVA Food Processing',
    chartType: ChartType.NOVA_SCORE,
    priority: 30
  },
  'card-13': {
    id: 'card-13',
    title: 'Research Quality',
    chartType: ChartType.RESEARCH_QUALITY,
    priority: 25
  },
  'card-14': {
    id: 'card-14',
    title: 'Publication Timeline',
    chartType: ChartType.PUBLICATION_TIMELINE,
    priority: 20
  },
  'card-15': {
    id: 'card-15',
    title: 'Vitamin Content',
    chartType: ChartType.VITAMIN_CONTENT,
    priority: 15
  },
  'card-16': {
    id: 'card-16',
    title: 'Daily Value Progress',
    chartType: ChartType.DAILY_VALUE_PROGRESS,
    priority: 10
  }
};

/**
 * Generate card configuration with API data
 */
export function generateCardConfig(
  cardId: string, 
  apiData?: any, 
  overrides?: Partial<CardData>
): CardData {
  const defaultConfig = DEFAULT_CARD_CONFIGS[cardId];
  
  if (!defaultConfig) {
    throw new Error(`No default configuration found for card: ${cardId}`);
  }
  
  return {
    ...defaultConfig,
    data: apiData,
    ...overrides
  } as CardData;
}

/**
 * Card 1 specific configuration (always QuickInsights)
 */
export function getCard1Config(overrides?: Partial<CardData>): CardData {
  return generateCardConfig('card-1', undefined, overrides);
}