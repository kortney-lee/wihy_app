import { CardData, generateCardConfig } from './cardConfig';
import { ChartType } from './chartTypes';

// Legacy API data interface - matches your demo data structure
export interface ApiData {
  weight?: {
    value: number;
    goal: number;
    progressPct: number;
    trend?: Array<{ date: string; kg: number }>;
  };
  calories?: {
    intake: number;
    burned: number;
    progressPct: number;
    trend?: Array<{ date: string; kcal: number }>;
  };
  steps?: {
    count: number;
    goal: number;
    progressPct: number;
    trend?: Array<{ date: string; steps: number }>;
  };
  sleep?: {
    hours: number;
    quality: number;
    progressPct: number;
    trend?: Array<{ date: string; hours: number }>;
  };
  hydration?: {
    liters: number;
    goal: number;
    progressPct: number;
    trend?: Array<{ date: string; liters: number }>;
  };
  activity?: {
    minutes: number;
    goal: number;
    progressPct: number;
    trend?: Array<{ date: string; min: number }>;
  };
}

// Legacy map API data to card configurations (for backward compatibility)
export const mapApiToCards = (apiData: ApiData): CardData[] => {
  const cards: CardData[] = [];

  // Weight card
  if (apiData.weight) {
    cards.push({
      id: 'weight-card',
      title: 'Weight Trend',
      chartType: ChartType.WEIGHT_TREND,
      priority: 75,
      data: {
        value: apiData.weight.value,
        goal: apiData.weight.goal,
        progressPct: apiData.weight.progressPct,
        trend: apiData.weight.trend,
        hasData: true,
      }
    });
  }

  // Hydration card
  if (apiData.hydration) {
    cards.push({
      id: 'hydration-card',
      title: 'Hydration Tracking',
      chartType: ChartType.HYDRATION,
      priority: 65,
      data: {
        value: apiData.hydration.liters,
        goal: apiData.hydration.goal,
        progressPct: apiData.hydration.progressPct,
        trend: apiData.hydration.trend,
        hasData: true,
      }
    });
  }

  // Active Minutes card
  if (apiData.activity) {
    cards.push({
      id: 'activity-card',
      title: 'Active Minutes',
      chartType: ChartType.ACTIVE_MINUTES,
      priority: 68,
      data: {
        value: apiData.activity.minutes,
        goal: apiData.activity.goal,
        progressPct: apiData.activity.progressPct,
        trend: apiData.activity.trend,
        hasData: true,
      }
    });
  }

  // Steps card
  if (apiData.steps) {
    cards.push({
      id: 'steps-card',
      title: 'Daily Steps',
      chartType: ChartType.STEPS,
      priority: 70,
      data: {
        value: apiData.steps.count,
        goal: apiData.steps.goal,
        progressPct: apiData.steps.progressPct,
        trend: apiData.steps.trend,
        hasData: true,
      }
    });
  }

  // Calories card
  if (apiData.calories) {
    cards.push({
      id: 'calories-card',
      title: 'Calorie Tracking',
      chartType: ChartType.CALORIES,
      priority: 50,
      data: {
        intake: apiData.calories.intake,
        burned: apiData.calories.burned,
        progressPct: apiData.calories.progressPct,
        trend: apiData.calories.trend,
        hasData: true,
      }
    });
  }

  // Sleep card
  if (apiData.sleep) {
    cards.push({
      id: 'sleep-card',
      title: 'Sleep Quality',
      chartType: ChartType.SLEEP,
      priority: 67,
      data: {
        hours: apiData.sleep.hours,
        quality: apiData.sleep.quality,
        progressPct: apiData.sleep.progressPct,
        trend: apiData.sleep.trend,
        hasData: true,
      }
    });
  }

  return cards;
};