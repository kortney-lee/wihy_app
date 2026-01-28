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
  servingSize?: number;
  servingUnit?: string;
  photo_url?: string;
  notes?: string;
  brand?: string;
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
  // Endpoints: https://user.wihy.ai/api/users/:userId/meals/...

  /**
   * Log a meal with nutrition information
   * POST /api/users/:userId/meals/log
   */
  async logMeal(meal: MealLog): Promise<any> {
    if (!meal.userId) {
      throw new Error('userId is required for logMeal');
    }
    const response = await fetchWithLogging(
      `${API_CONFIG.userUrl}/api/users/${meal.userId}/meals/log`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mealType: meal.mealType,
          foodName: meal.foodName,
          calories: meal.calories,
          protein: meal.protein_g,
          carbs: meal.carbs_g,
          fat: meal.fat_g,
          fiber: meal.fiber_g,
          servingSize: meal.servingSize || meal.servings || 1,
          servingUnit: meal.servingUnit || 'serving',
          brand: meal.brand,
        }),
      }
    );
    return response.json();
  }

  /**
   * Get daily nutrition summary with goals comparison
   * GET /api/users/:userId/meals/summary/daily?date=YYYY-MM-DD
   */
  async getDailySummary(userId: string, date?: string): Promise<DailySummary> {
    if (!userId) {
      throw new Error('userId is required for getDailySummary');
    }
    const dateParam = date || new Date().toISOString().split('T')[0];
    const response = await fetchWithLogging(
      `${API_CONFIG.userUrl}/api/users/${userId}/meals/summary/daily?date=${dateParam}`
    );
    const data = await response.json();
    
    // Map response to DailySummary interface
    if (data.success && data.totals) {
      return {
        date: dateParam,
        totals: {
          calories: data.totals.calories || 0,
          protein_g: data.totals.protein || 0,
          carbs_g: data.totals.carbs || 0,
          fat_g: data.totals.fat || 0,
          fiber_g: data.totals.fiber || 0,
          sugar_g: 0,
        },
        goals: {
          calories: data.totals.targets?.calories || 2000,
          protein_g: data.totals.targets?.protein || 150,
          carbs_g: data.totals.targets?.carbs || 250,
          fat_g: data.totals.targets?.fat || 65,
          fiber_g: 25,
          sugar_g: 50,
        },
        progress: {
          calories: data.totals.targets?.calories ? (data.totals.calories / data.totals.targets.calories) * 100 : 0,
          protein_g: data.totals.targets?.protein ? (data.totals.protein / data.totals.targets.protein) * 100 : 0,
          carbs_g: data.totals.targets?.carbs ? (data.totals.carbs / data.totals.targets.carbs) * 100 : 0,
          fat_g: data.totals.targets?.fat ? (data.totals.fat / data.totals.targets.fat) * 100 : 0,
        },
        water_ml: 0,
        water_goal_ml: 2500,
        water_progress: 0,
        meals: [],
      };
    }
    return data.data;
  }

  /**
   * Get meals grouped by date (recommended for daily consumption view)
   * GET /api/users/:userId/meals/diary/by-date?days=7
   */
  async getMealsByDate(userId: string, options?: { days?: number; startDate?: string; endDate?: string }): Promise<any> {
    if (!userId) {
      throw new Error('userId is required for getMealsByDate');
    }
    const params = new URLSearchParams();
    if (options?.days) params.append('days', options.days.toString());
    if (options?.startDate) params.append('startDate', options.startDate);
    if (options?.endDate) params.append('endDate', options.endDate);
    
    const queryString = params.toString();
    const response = await fetchWithLogging(
      `${API_CONFIG.userUrl}/api/users/${userId}/meals/diary/by-date${queryString ? '?' + queryString : ''}`
    );
    return response.json();
  }

  /**
   * Delete a meal log entry
   * DELETE /api/users/:userId/meals/log/:logId
   */
  async deleteMealLog(userId: string, logId: string): Promise<any> {
    if (!userId || !logId) {
      throw new Error('userId and logId are required for deleteMealLog');
    }
    const response = await fetchWithLogging(
      `${API_CONFIG.userUrl}/api/users/${userId}/meals/log/${logId}`,
      { method: 'DELETE' }
    );
    return response.json();
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
   * Set nutrition targets (calorie and macro targets)
   * POST /api/users/:userId/nutrition/targets
   */
  async setNutritionTargets(
    userId: string,
    targets: {
      daily_calories: number;
      protein_g: number;
      carbs_g: number;
      fat_g: number;
      fiber_g?: number;
      sugar_limit_g?: number;
      sodium_limit_mg?: number;
      water_oz?: number;
    }
  ): Promise<any> {
    if (!userId) {
      throw new Error('userId is required for setNutritionTargets');
    }
    const response = await fetchWithLogging(
      `${API_CONFIG.userUrl}/api/users/${userId}/nutrition/targets`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(targets),
      }
    );
    return response.json();
  }

  /**
   * Get current nutrition targets
   * GET /api/users/:userId/nutrition/targets
   */
  async getNutritionTargets(userId: string): Promise<{
    daily_calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    fiber_g?: number;
    sugar_limit_g?: number;
    sodium_limit_mg?: number;
    water_oz?: number;
  }> {
    if (!userId) {
      throw new Error('userId is required for getNutritionTargets');
    }
    const response = await fetchWithLogging(
      `${API_CONFIG.userUrl}/api/users/${userId}/nutrition/targets`
    );
    const data = await response.json();
    return data.data;
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
