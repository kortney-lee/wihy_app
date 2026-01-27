/**
 * MyProgress API Client Service
 * 
 * Provides comprehensive user progress tracking, dashboard analytics, 
 * and goal management capabilities for the WIHY mobile application.
 * 
 * Base URL: https://user.wihy.ai/api/progress
 * 
 * @see docs/MYPROGRESS_API_REQUIREMENTS.md for full API documentation
 */

import { API_CONFIG } from './config';
import { fetchWithLogging } from './apiLogger';

// =============================================================================
// TYPES & INTERFACES
// =============================================================================

export interface ProgressCard {
  id: string;
  title: string;
  current: number;
  target: number;
  unit: string;
  icon: string;
  color: string;
  percentage?: number;
}

export interface ProgressSummary {
  period: 'today' | 'week' | 'month';
  periodStart: string;
  periodEnd: string;
  progressCards: ProgressCard[];
  overallProgress: number;
  dayStreak: number;
  completedActions: number;
  totalActions: number;
}

export interface WeightEntry {
  date: string;
  weight: number;
}

export interface WeightChange {
  amount: number;
  percentage: number;
  direction: 'up' | 'down' | 'stable';
  periodLabel: string;
}

export interface WeightData {
  current: number;
  starting: number;
  target: number;
  unit: 'lbs' | 'kg';
  change: WeightChange;
  history: WeightEntry[];
  projectedGoalDate?: string;
  weeklyAvgLoss?: number;
}

export interface ActionItem {
  id: string;
  title: string;
  description: string;
  type: 'workout' | 'meal' | 'habit' | 'hydration' | 'health';
  icon: string;
  completed: boolean;
  completedAt?: string;
  scheduledTime?: string;
  progress?: number;
  target?: number;
}

export interface ActionsSummary {
  completed: number;
  total: number;
  percentage: number;
}

export interface Recommendation {
  id: string;
  title: string;
  message: string;
  type: 'nutrition' | 'workout' | 'wellness' | 'goal';
  priority: 'high' | 'medium' | 'low';
  icon: string;
  actionLabel?: string;
  actionRoute?: string;
}

export interface HydrationEntry {
  time: string;
  amount: number;
}

export interface HydrationData {
  date: string;
  current: number;
  target: number;
  unit: string;
  entries: HydrationEntry[];
  weeklyAverage: number;
}

export interface MacroBreakdown {
  grams: number;
  calories: number;
  percentage: number;
}

export interface MacrosData {
  period: 'today' | 'week' | 'month';
  totals: {
    calories: number;
    caloriesTarget: number;
    protein: number;
    proteinTarget: number;
    carbs: number;
    carbsTarget: number;
    fat: number;
    fatTarget: number;
  };
  breakdown: {
    protein: MacroBreakdown;
    carbs: MacroBreakdown;
    fat: MacroBreakdown;
  };
  dailyHistory: Array<{
    date: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  }>;
}

export interface StreakAchievement {
  id: string;
  title: string;
  icon: string;
  earnedAt: string;
}

export interface StreaksData {
  currentDayStreak: number;
  longestDayStreak: number;
  weeklyConsistency: number;
  monthlyConsistency: number;
  achievements: StreakAchievement[];
  calendar: {
    month: string;
    completedDays: number[];
    partialDays: number[];
    missedDays: number[];
  };
}

export interface BodyMeasurements {
  waist?: number;
  chest?: number;
  hips?: number;
  arms?: number;
  thighs?: number;
}

export interface MeasurementsEntry {
  date: string;
  waist?: number;
  chest?: number;
  hips?: number;
  arms?: number;
  thighs?: number;
  unit: 'inches' | 'cm';
}

export interface MeasurementsData {
  latest: MeasurementsEntry;
  starting: MeasurementsEntry;
  changes: {
    [key: string]: {
      amount: number;
      percentage: number;
    };
  };
  history: MeasurementsEntry[];
}

export interface Goal {
  id: string;
  label: string;
  formula: string;
  icon: string;
  color: string;
  isActive: boolean;
}

export interface GoalProgress {
  overallProgress: number;
  weightLost: number;
  weightRemaining: number;
  daysActive: number;
  projectedCompletion?: string;
}

export interface GoalsData {
  activeGoal: string | null;
  targetWeight?: number;
  targetDate?: string;
  available: Goal[];
  progress: GoalProgress;
}

// Dashboard response with trends
export interface DashboardData {
  summary: {
    period: string;
    cards: {
      calories: { current: number; target: number; unit: string };
      protein: { current: number; target: number; unit: string };
      workouts: { current: number; target: number; unit: string; period: string };
      hydration: { current: number; target: number; unit: string };
      sleep: { current: number; target: number; unit: string };
    };
    trends: {
      weight: { current: number; change: number; period: string };
      calories: { average: number; change: number; period: string };
      workouts: { total: number; change: number; period: string };
    };
  };
}

// =============================================================================
// API CLIENT CLASS
// =============================================================================

class ProgressService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = `${API_CONFIG.userUrl}/api/progress`;
  }

  /**
   * Get authentication headers for API requests
   */
  private getHeaders(userId: string): HeadersInit {
    return {
      'Content-Type': 'application/json',
      'x-user-id': userId,
      // JWT token would be added here from auth context
    };
  }

  /**
   * Handle API response and check for errors
   */
  private async handleResponse<T>(response: Response): Promise<T> {
    const data = await response.json();
    
    if (!response.ok || !data.success) {
      const errorMessage = data.error || data.message || 'API request failed';
      console.error('[ProgressService] API Error:', errorMessage, data.code);
      throw new Error(errorMessage);
    }
    
    return data;
  }

  // ===========================================================================
  // DASHBOARD
  // ===========================================================================

  /**
   * Get aggregated dashboard data including progress cards and trends
   * 
   * @param userId - User UUID
   * @returns Dashboard summary with cards and trends
   */
  async getDashboard(userId: string): Promise<DashboardData> {
    console.log('[ProgressService] Fetching dashboard for user:', userId);
    
    const response = await fetchWithLogging(
      `${this.baseUrl}/dashboard?user_id=${userId}`,
      { headers: this.getHeaders(userId) }
    );
    
    return this.handleResponse<DashboardData>(response);
  }

  // ===========================================================================
  // PROGRESS SUMMARY
  // ===========================================================================

  /**
   * Get progress summary for specified period
   * 
   * @param userId - User UUID
   * @param period - 'today' | 'week' | 'month'
   * @returns Progress summary with cards
   */
  async getSummary(
    userId: string, 
    period: 'today' | 'week' | 'month' = 'today'
  ): Promise<{ success: boolean; summary: ProgressSummary }> {
    console.log('[ProgressService] Fetching summary:', { userId, period });
    
    const response = await fetchWithLogging(
      `${this.baseUrl}/summary?user_id=${userId}&period=${period}`,
      { headers: this.getHeaders(userId) }
    );
    
    return this.handleResponse(response);
  }

  // ===========================================================================
  // WEIGHT TRACKING
  // ===========================================================================

  /**
   * Get weight tracking history and trends
   * 
   * @param userId - User UUID
   * @param period - Time period for history
   * @param limit - Max data points to return
   */
  async getWeight(
    userId: string,
    period: 'week' | 'month' | '3months' | '6months' | 'year' = 'month',
    limit: number = 30
  ): Promise<{ success: boolean; weight: WeightData }> {
    console.log('[ProgressService] Fetching weight data:', { userId, period, limit });
    
    const response = await fetchWithLogging(
      `${this.baseUrl}/weight?user_id=${userId}&period=${period}&limit=${limit}`,
      { headers: this.getHeaders(userId) }
    );
    
    return this.handleResponse(response);
  }

  /**
   * Log a new weight entry
   * 
   * @param userId - User UUID
   * @param weight - Weight value
   * @param unit - 'lbs' | 'kg'
   * @param notes - Optional notes
   */
  async logWeight(
    userId: string,
    weight: number,
    unit: 'lbs' | 'kg' = 'lbs',
    notes?: string
  ): Promise<{ success: boolean; entry: any }> {
    console.log('[ProgressService] Logging weight:', { userId, weight, unit });
    
    const response = await fetchWithLogging(
      `${this.baseUrl}/weight`,
      {
        method: 'POST',
        headers: this.getHeaders(userId),
        body: JSON.stringify({
          weight,
          unit,
          date: new Date().toISOString().split('T')[0],
          notes,
        }),
      }
    );
    
    return this.handleResponse(response);
  }

  // ===========================================================================
  // ACTION ITEMS
  // ===========================================================================

  /**
   * Get daily action items/tasks
   * 
   * @param userId - User UUID
   * @param date - Date in YYYY-MM-DD format (defaults to today)
   */
  async getActions(
    userId: string,
    date?: string
  ): Promise<{ success: boolean; actions: ActionItem[]; summary: ActionsSummary }> {
    console.log('[ProgressService] Fetching actions:', { userId, date });
    
    const params = new URLSearchParams({ user_id: userId });
    if (date) params.append('date', date);
    
    const response = await fetchWithLogging(
      `${this.baseUrl}/actions?${params.toString()}`,
      { headers: this.getHeaders(userId) }
    );
    
    return this.handleResponse(response);
  }

  /**
   * Toggle action item completion status
   * 
   * @param userId - User UUID
   * @param actionId - Action item ID
   * @param completed - New completion status
   */
  async toggleAction(
    userId: string,
    actionId: string,
    completed: boolean
  ): Promise<{ success: boolean; action: ActionItem }> {
    console.log('[ProgressService] Toggling action:', { userId, actionId, completed });
    
    const response = await fetchWithLogging(
      `${this.baseUrl}/actions/${actionId}`,
      {
        method: 'PATCH',
        headers: this.getHeaders(userId),
        body: JSON.stringify({ completed }),
      }
    );
    
    return this.handleResponse(response);
  }

  // ===========================================================================
  // AI RECOMMENDATIONS
  // ===========================================================================

  /**
   * Get AI-generated coach recommendations
   * 
   * @param userId - User UUID
   */
  async getRecommendations(
    userId: string
  ): Promise<{ success: boolean; recommendations: Recommendation[] }> {
    console.log('[ProgressService] Fetching recommendations:', userId);
    
    const response = await fetchWithLogging(
      `${this.baseUrl}/recommendations?user_id=${userId}`,
      { headers: this.getHeaders(userId) }
    );
    
    return this.handleResponse(response);
  }

  // ===========================================================================
  // HYDRATION TRACKING
  // ===========================================================================

  /**
   * Get hydration tracking for the day
   * 
   * @param userId - User UUID
   * @param date - Date in YYYY-MM-DD format (defaults to today)
   */
  async getHydration(
    userId: string,
    date?: string
  ): Promise<{ success: boolean; hydration: HydrationData }> {
    console.log('[ProgressService] Fetching hydration:', { userId, date });
    
    const params = new URLSearchParams({ user_id: userId });
    if (date) params.append('date', date);
    
    const response = await fetchWithLogging(
      `${this.baseUrl}/hydration?${params.toString()}`,
      { headers: this.getHeaders(userId) }
    );
    
    return this.handleResponse(response);
  }

  /**
   * Log water intake
   * 
   * @param userId - User UUID
   * @param amount - Number of glasses/units
   * @param unit - Unit type (default: 'glasses')
   */
  async logHydration(
    userId: string,
    amount: number = 1,
    unit: string = 'glasses'
  ): Promise<{ success: boolean; hydration: { current: number; target: number; remaining: number } }> {
    console.log('[ProgressService] Logging hydration:', { userId, amount, unit });
    
    const response = await fetchWithLogging(
      `${this.baseUrl}/hydration`,
      {
        method: 'POST',
        headers: this.getHeaders(userId),
        body: JSON.stringify({
          amount,
          unit,
          time: new Date().toISOString(),
        }),
      }
    );
    
    return this.handleResponse(response);
  }

  // ===========================================================================
  // MACROS
  // ===========================================================================

  /**
   * Get macro breakdown for charts
   * 
   * @param userId - User UUID
   * @param period - 'today' | 'week' | 'month'
   */
  async getMacros(
    userId: string,
    period: 'today' | 'week' | 'month' = 'today'
  ): Promise<{ success: boolean; macros: MacrosData }> {
    console.log('[ProgressService] Fetching macros:', { userId, period });
    
    const response = await fetchWithLogging(
      `${this.baseUrl}/macros?user_id=${userId}&period=${period}`,
      { headers: this.getHeaders(userId) }
    );
    
    return this.handleResponse(response);
  }

  // ===========================================================================
  // STREAKS
  // ===========================================================================

  /**
   * Get streak and consistency data
   * 
   * @param userId - User UUID
   */
  async getStreaks(
    userId: string
  ): Promise<{ success: boolean; streaks: StreaksData }> {
    console.log('[ProgressService] Fetching streaks:', userId);
    
    const response = await fetchWithLogging(
      `${this.baseUrl}/streaks?user_id=${userId}`,
      { headers: this.getHeaders(userId) }
    );
    
    return this.handleResponse(response);
  }

  // ===========================================================================
  // BODY MEASUREMENTS
  // ===========================================================================

  /**
   * Get body measurement history
   * 
   * @param userId - User UUID
   * @param period - Time period for history
   */
  async getMeasurements(
    userId: string,
    period: 'month' | '3months' | '6months' | 'year' = 'month'
  ): Promise<{ success: boolean; measurements: MeasurementsData }> {
    console.log('[ProgressService] Fetching measurements:', { userId, period });
    
    const response = await fetchWithLogging(
      `${this.baseUrl}/body-measurements?user_id=${userId}&period=${period}`,
      { headers: this.getHeaders(userId) }
    );
    
    return this.handleResponse(response);
  }

  /**
   * Log new body measurements
   * 
   * @param userId - User UUID
   * @param measurements - Body measurements object
   * @param unit - 'inches' | 'cm'
   */
  async logMeasurements(
    userId: string,
    measurements: BodyMeasurements,
    unit: 'inches' | 'cm' = 'inches'
  ): Promise<{ success: boolean; entry: MeasurementsEntry }> {
    console.log('[ProgressService] Logging measurements:', { userId, measurements });
    
    const response = await fetchWithLogging(
      `${this.baseUrl}/body-measurements`,
      {
        method: 'POST',
        headers: this.getHeaders(userId),
        body: JSON.stringify({
          date: new Date().toISOString().split('T')[0],
          measurements,
          unit,
        }),
      }
    );
    
    return this.handleResponse(response);
  }

  // ===========================================================================
  // GOALS
  // ===========================================================================

  /**
   * Get user's goals and progress
   * 
   * @param userId - User UUID
   */
  async getGoals(
    userId: string
  ): Promise<{ success: boolean; goals: GoalsData }> {
    console.log('[ProgressService] Fetching goals:', userId);
    
    const response = await fetchWithLogging(
      `${this.baseUrl}/goals?user_id=${userId}`,
      { headers: this.getHeaders(userId) }
    );
    
    return this.handleResponse(response);
  }

  /**
   * Update user's active goal
   * 
   * @param userId - User UUID
   * @param activeGoal - Goal ID to set as active
   * @param targetWeight - Optional target weight
   * @param targetDate - Optional target date
   */
  async updateGoal(
    userId: string,
    activeGoal: string,
    targetWeight?: number,
    targetDate?: string
  ): Promise<{ success: boolean; goals: GoalsData }> {
    console.log('[ProgressService] Updating goal:', { userId, activeGoal, targetWeight, targetDate });
    
    const response = await fetchWithLogging(
      `${this.baseUrl}/goals`,
      {
        method: 'PUT',
        headers: this.getHeaders(userId),
        body: JSON.stringify({
          activeGoal,
          ...(targetWeight && { targetWeight }),
          ...(targetDate && { targetDate }),
        }),
      }
    );
    
    return this.handleResponse(response);
  }

  /**
   * Clear active goal
   * 
   * @param userId - User UUID
   */
  async clearGoal(userId: string): Promise<{ success: boolean }> {
    console.log('[ProgressService] Clearing goal:', userId);
    
    const response = await fetchWithLogging(
      `${this.baseUrl}/goals`,
      {
        method: 'PUT',
        headers: this.getHeaders(userId),
        body: JSON.stringify({ activeGoal: null }),
      }
    );
    
    return this.handleResponse(response);
  }
}

// =============================================================================
// SINGLETON EXPORT
// =============================================================================

export const progressService = new ProgressService();
export default progressService;
