import { API_CONFIG } from './config';
import { fetchWithLogging } from '../utils/apiLogger';

export interface MealLog {
  userId: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  foodName: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g?: number;
  sugar_g?: number;
  servings?: number;
  photo_url?: string;
  notes?: string;
}

export interface WaterLog {
  userId: string;
  amountMl: number;
  timestamp?: string;
}

export interface NutritionGoals {
  userId: string;
  daily_calories?: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
  fiber_g?: number;
  sugar_g?: number;
  water_ml?: number;
}

export interface DailySummary {
  date: string;
  totals: {
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    fiber_g: number;
    sugar_g: number;
  };
  goals: {
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    fiber_g: number;
    sugar_g: number;
  };
  progress: {
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
  };
  water_ml: number;
  water_goal_ml: number;
  water_progress: number;
  meals: Array<{
    meal_type: string;
    food_name: string;
    calories: number;
    logged_at: string;
  }>;
}

export interface WeeklyTrends {
  period: string;
  daily_averages: {
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    water_ml: number;
  };
  days: Array<{
    date: string;
    calories: number;
    protein_g: number;
  }>;
}

class NutritionService {
  // All methods now use API_CONFIG.userUrl directly
  // Endpoints: https://user.wihy.ai/api/users/:userId/nutrition/...

  /**
   * Log a meal with nutrition information
   * POST /api/users/:userId/nutrition/log-meal
   */
  async logMeal(meal: MealLog): Promise<any> {
    if (!meal.userId) {
      throw new Error('userId is required for logMeal');
    }
    const response = await fetchWithLogging(
      `${API_CONFIG.userUrl}/api/users/${meal.userId}/nutrition/log-meal`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(meal),
      }
    );
    return response.json();
  }

  /**
   * Get daily nutrition summary with goals comparison
   * GET /api/users/:userId/nutrition/daily-summary?date=YYYY-MM-DD
   */
  async getDailySummary(userId: string, date?: string): Promise<DailySummary> {
    if (!userId) {
      throw new Error('userId is required for getDailySummary');
    }
    const dateParam = date || new Date().toISOString().split('T')[0];
    const response = await fetchWithLogging(
      `${API_CONFIG.userUrl}/api/users/${userId}/nutrition/daily-summary?date=${dateParam}`
    );
    const data = await response.json();
    return data.data;
  }

  /**
   * Get weekly nutrition trends
   * GET /api/users/:userId/nutrition/weekly-trends?startDate=YYYY-MM-DD
   */
  async getWeeklyTrends(userId: string, startDate?: string): Promise<WeeklyTrends> {
    if (!userId) {
      throw new Error('userId is required for getWeeklyTrends');
    }
    const params = startDate ? `?startDate=${startDate}` : '';
    const response = await fetchWithLogging(
      `${API_CONFIG.userUrl}/api/users/${userId}/nutrition/weekly-trends${params}`
    );
    const data = await response.json();
    return data.data;
  }

  /**
   * Get meal history with date range filtering
   * GET /api/users/:userId/nutrition/history?startDate=X&endDate=Y&mealType=Z
   */
  async getHistory(
    userId: string,
    options?: {
      startDate?: string;
      endDate?: string;
      mealType?: string;
    }
  ): Promise<any> {
    if (!userId) {
      throw new Error('userId is required for getHistory');
    }
    const params = new URLSearchParams();
    if (options?.startDate) params.append('startDate', options.startDate);
    if (options?.endDate) params.append('endDate', options.endDate);
    if (options?.mealType) params.append('mealType', options.mealType);

    const queryString = params.toString();
    const url = queryString
      ? `${API_CONFIG.userUrl}/api/users/${userId}/nutrition/history?${queryString}`
      : `${API_CONFIG.userUrl}/api/users/${userId}/nutrition/history`;

    const response = await fetchWithLogging(url);
    return response.json();
  }

  /**
   * Log water intake
   * POST /api/users/:userId/nutrition/log-water
   */
  async logWater(water: WaterLog): Promise<any> {
    if (!water.userId) {
      throw new Error('userId is required for logWater');
    }
    const response = await fetchWithLogging(
      `${API_CONFIG.userUrl}/api/users/${water.userId}/nutrition/log-water`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(water),
      }
    );
    return response.json();
  }

  /**
   * Update nutrition goals
   * PUT /api/users/:userId/nutrition/goals
   */
  async updateGoals(goals: NutritionGoals): Promise<any> {
    if (!goals.userId) {
      throw new Error('userId is required for updateGoals');
    }
    const response = await fetchWithLogging(
      `${API_CONFIG.userUrl}/api/users/${goals.userId}/nutrition/goals`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(goals),
      }
    );
    return response.json();
  }

  /**
   * Get current nutrition goals
   * GET /api/users/:userId/nutrition/goals
   */
  async getGoals(userId: string): Promise<NutritionGoals> {
    if (!userId) {
      throw new Error('userId is required for getGoals');
    }
    const response = await fetchWithLogging(
      `${API_CONFIG.userUrl}/api/users/${userId}/nutrition/goals`
    );
    const data = await response.json();
    return data.data;
  }

  /**
   * Get nutrition data for a date range
   * Fetches daily summaries for each day in the range
   */
  async getRangeSummary(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<DailySummary[]> {
    const summaries: DailySummary[] = [];
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      try {
        const summary = await this.getDailySummary(userId, dateStr);
        if (summary) {
          summaries.push(summary);
        }
      } catch (error) {
        console.warn(`[NutritionService] No data for ${dateStr}`);
      }
    }
    
    return summaries;
  }

  /**
   * Calculate average macros for a period
   * Useful for coach dashboard summary views
   */
  calculateAverageMacros(summaries: DailySummary[]): {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  } {
    if (summaries.length === 0) {
      return { calories: 0, protein: 0, carbs: 0, fat: 0 };
    }

    const totals = summaries.reduce(
      (acc, day) => ({
        calories: acc.calories + (day.totals?.calories || 0),
        protein: acc.protein + (day.totals?.protein_g || 0),
        carbs: acc.carbs + (day.totals?.carbs_g || 0),
        fat: acc.fat + (day.totals?.fat_g || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );

    return {
      calories: Math.round(totals.calories / summaries.length),
      protein: Math.round(totals.protein / summaries.length),
      carbs: Math.round(totals.carbs / summaries.length),
      fat: Math.round(totals.fat / summaries.length),
    };
  }
}

export const nutritionService = new NutritionService();
