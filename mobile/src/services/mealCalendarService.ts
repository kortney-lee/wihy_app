/**
 * Meal Calendar Service
 * 
 * Handles meal scheduling, calendar management, and meal programs.
 * Base URL: https://services.wihy.ai/api/meals
 * 
 * @see docs/MEALS_API_CLIENT_GUIDE.md for full API documentation
 */

import { API_CONFIG } from './config';
import { fetchWithLogging } from '../utils/apiLogger';

// =============================================================================
// TYPES & INTERFACES
// =============================================================================

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export type MealSlot = MealType | 'pre-workout' | 'post-workout';
export type CuisineType = string;
export type DietaryRestriction = 
  | 'vegan' 
  | 'vegetarian' 
  | 'gluten_free' 
  | 'dairy_free' 
  | 'nut_free' 
  | 'keto' 
  | 'paleo' 
  | 'low_carb'
  | string;

export type TimeConstraint = 'quick' | 'moderate' | 'standard';
export type Difficulty = 'beginner' | 'intermediate' | 'advanced';
export type FitnessGoal = 'weight_loss' | 'muscle_gain' | 'maintenance';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';

// Meal Ingredient
export interface MealIngredient {
  name: string;
  amount: number;
  unit: string;
}

// Meal Nutrition
export interface MealNutrition {
  caloriesPerServing: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

// Generated Meal
export interface GeneratedMeal {
  id: string;
  name: string;
  mealType: MealType;
  cuisineType: string;
  servings: number;
  prepTime: number;
  cookTime: number;
  totalTime: number;
  difficulty: Difficulty;
  ingredients: MealIngredient[];
  instructions: string[];
  nutrition: MealNutrition;
  dietaryRestrictions: string[];
  tags: string[];
}

// Meal Generation - Quick Mode
export interface QuickMealRequest {
  mode: 'quick';
  userId: string;
  mealType: MealType;
  cuisineType?: string;
  dietaryRestrictions?: DietaryRestriction[];
  servings?: number;
  timeConstraint?: TimeConstraint;
}

// Meal Generation - Plan Mode
export interface PlanMealRequest {
  mode: 'plan';
  userId: string;
  duration: 3 | 7 | 14 | 30;
  mealsPerDay: {
    breakfast: boolean;
    lunch: boolean;
    dinner: boolean;
    snack: boolean;
  };
  servings?: number;
  dietaryRestrictions?: DietaryRestriction[];
}

// Meal Generation - Diet Mode
export interface DietMealRequest {
  mode: 'diet';
  userId: string;
  duration: 3 | 7 | 14 | 30;
  fitnessGoal: FitnessGoal;
  activityLevel: ActivityLevel;
  dailyCalorieTarget?: number;
  macrosTarget?: {
    protein: number;
    carbs: number;
    fat: number;
  };
}

export type CreateMealRequest = QuickMealRequest | PlanMealRequest | DietMealRequest;

// Meal Generation Response
export interface CreateMealResponse {
  success: boolean;
  mode: 'quick' | 'plan' | 'diet';
  meal?: GeneratedMeal;
  meals?: GeneratedMeal[];
  plan?: {
    duration: number;
    totalMeals: number;
    mealsPerDay: number;
    dailyTotals: MealNutrition;
  };
  message?: string;
  error?: string;
}

// Schedule Entry
export interface ScheduleEntry {
  schedule_id: number;
  meal_id: string;
  user_id: string;
  scheduled_date: string;  // YYYY-MM-DD
  meal_slot: MealSlot;
  servings: number;
  notes?: string;
  is_completed: boolean;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

// Schedule Meal Request
export interface ScheduleMealRequest {
  mealId: string;
  scheduledDate: string;  // YYYY-MM-DD
  mealSlot: MealSlot;
  servings?: number;
  notes?: string;
}

// Bulk Schedule Request
export interface BulkScheduleRequest {
  schedules: {
    mealId: string;
    scheduledDate: string;
    mealSlot: MealSlot;
    servings?: number;
    notes?: string;
  }[];
}

// Calendar Day
export interface CalendarDay {
  date: string;
  dayName?: string;
  meals: {
    schedule_id: number;
    meal_id: string;
    meal_slot: MealSlot;
    servings: number;
    is_completed: boolean;
    notes?: string;
    meal: {
      name: string;
      mealType: MealType;
      nutrition: {
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
        fiber?: number;
      };
    };
  }[];
  totals: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  };
}

// Calendar Stats
export interface CalendarStats {
  totalScheduled: number;
  totalCompleted: number;
  completionRate: number;
  upcomingMeals: number;
  streakDays: number;
  averageDailyCalories: number;
  mostScheduledMealType: MealSlot;
}

// Copy Day Request
export interface CopyDayRequest {
  sourceDate: string;
  targetDate: string;
}

// Meal Template
export interface MealTemplate {
  id: string;
  name: string;
  description: string;
  mealType: MealType;
  cuisineType: string;
  difficulty: Difficulty;
  prepTime: number;
  cookTime: number;
  servings: number;
  tags: string[];
  nutrition: MealNutrition;
}

// Meal Program
export interface MealProgram {
  id: string;
  name: string;
  description: string;
  duration: number;
  fitnessGoal: FitnessGoal;
  totalMeals: number;
  difficulty: Difficulty;
  isActive: boolean;
  startDate?: string;
  endDate?: string;
}

// Day Plan
export interface DayPlan {
  breakfast: GeneratedMeal;
  lunch: GeneratedMeal;
  dinner: GeneratedMeal;
  snack?: GeneratedMeal;
  totals: MealNutrition;
}

// Active Meal Plan
export interface ActiveMealPlan {
  id: string;
  userId: string;
  name: string;
  startDate: string;
  endDate: string;
  currentDay: number;
  totalDays: number;
  meals: GeneratedMeal[];
  isActive: boolean;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface CalendarResponse {
  success: boolean;
  days: CalendarDay[];
  startDate: string;
  endDate: string;
}

export interface ScheduleResponse {
  success: boolean;
  schedule?: ScheduleEntry;
  schedules?: ScheduleEntry[];
  message?: string;
}

export interface StatsResponse {
  success: boolean;
  stats: CalendarStats;
}

// =============================================================================
// SERVICE IMPLEMENTATION
// =============================================================================

class MealCalendarService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_CONFIG.servicesUrl || 'https://services.wihy.ai';
  }

  // =============================================================================
  // MEAL GENERATION
  // =============================================================================

  /**
   * Create a meal using AI
   * 
   * POST /api/meals/create-from-text
   * 
   * Supports 3 modes:
   * - quick: Single meal generation
   * - plan: Multi-day meal planning
   * - diet: Fitness goal-based meal planning
   * 
   * @param request - Meal creation request (mode determines structure)
   * @returns Generated meal(s)
   */
  async createMealFromText(request: CreateMealRequest): Promise<CreateMealResponse> {
    try {
      const response = await fetchWithLogging(
        `${this.baseUrl}/api/meals/create-from-text`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(request),
        }
      );

      const data = await response.json();
      return data as CreateMealResponse;
    } catch (error) {
      console.error('[MealCalendarService] Error creating meal from text:', error);
      throw error;
    }
  }

  // =============================================================================
  // CALENDAR QUERIES
  // =============================================================================

  /**
   * Get calendar entries for a date range
   * 
   * GET /api/meals/calendar/:userId?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
   * 
   * @param userId - User ID
   * @param startDate - Start date (YYYY-MM-DD)
   * @param endDate - End date (YYYY-MM-DD)
   * @returns Calendar days with scheduled meals
   */
  async getCalendar(userId: string, startDate: string, endDate: string): Promise<CalendarDay[]> {
    try {
      const response = await fetchWithLogging(
        `${this.baseUrl}/api/meals/calendar/${userId}?startDate=${startDate}&endDate=${endDate}`,
        {
          method: 'GET',
        }
      );

      const data = await response.json();
      return data.days || [];
    } catch (error) {
      console.error('[MealCalendarService] Error fetching calendar:', error);
      return [];
    }
  }

  /**
   * Get today's scheduled meals
   * 
   * GET /api/meals/calendar/:userId/today
   * 
   * @param userId - User ID
   * @returns Today's calendar day
   */
  async getTodaysMeals(userId: string): Promise<CalendarDay | null> {
    try {
      const response = await fetchWithLogging(
        `${this.baseUrl}/api/meals/calendar/${userId}/today`,
        {
          method: 'GET',
        }
      );

      const data = await response.json();
      return data.day || null;
    } catch (error) {
      console.error('[MealCalendarService] Error fetching today\'s meals:', error);
      return null;
    }
  }

  /**
   * Get week view (Mon-Sun)
   * 
   * GET /api/meals/calendar/:userId/week
   * 
   * @param userId - User ID
   * @param startDate - Optional week start date (defaults to current week)
   * @returns 7 days of calendar data
   */
  async getWeekView(userId: string, startDate?: string): Promise<CalendarDay[]> {
    try {
      const url = startDate
        ? `${this.baseUrl}/api/meals/calendar/${userId}/week?startDate=${startDate}`
        : `${this.baseUrl}/api/meals/calendar/${userId}/week`;

      const response = await fetchWithLogging(url, {
        method: 'GET',
      });

      const data = await response.json();
      return data.days || [];
    } catch (error) {
      console.error('[MealCalendarService] Error fetching week view:', error);
      return [];
    }
  }

  /**
   * Get meals for a specific date
   * 
   * GET /api/meals/calendar/:userId/date/:date
   * 
   * @param userId - User ID
   * @param date - Date (YYYY-MM-DD)
   * @returns Calendar day
   */
  async getMealsForDate(userId: string, date: string): Promise<CalendarDay | null> {
    try {
      const response = await fetchWithLogging(
        `${this.baseUrl}/api/meals/calendar/${userId}/date/${date}`,
        {
          method: 'GET',
        }
      );

      const data = await response.json();
      return data.day || null;
    } catch (error) {
      console.error('[MealCalendarService] Error fetching meals for date:', error);
      return null;
    }
  }

  /**
   * Get calendar statistics
   * 
   * GET /api/meals/calendar/:userId/stats
   * 
   * @param userId - User ID
   * @param period - Optional period in days (default: 30)
   * @returns Calendar statistics
   */
  async getCalendarStats(userId: string, period: number = 30): Promise<CalendarStats | null> {
    try {
      const response = await fetchWithLogging(
        `${this.baseUrl}/api/meals/calendar/${userId}/stats?period=${period}`,
        {
          method: 'GET',
        }
      );

      const data = await response.json();
      return data.stats || null;
    } catch (error) {
      console.error('[MealCalendarService] Error fetching calendar stats:', error);
      return null;
    }
  }

  // =============================================================================
  // SCHEDULE OPERATIONS
  // =============================================================================

  /**
   * Schedule a meal
   * 
   * POST /api/meals/calendar/:userId/schedule
   * 
   * @param userId - User ID
   * @param request - Schedule request
   * @returns Created schedule entry
   */
  async scheduleMeal(userId: string, request: ScheduleMealRequest): Promise<ScheduleEntry | null> {
    try {
      const response = await fetchWithLogging(
        `${this.baseUrl}/api/meals/calendar/${userId}/schedule`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(request),
        }
      );

      const data = await response.json();
      return data.schedule || null;
    } catch (error) {
      console.error('[MealCalendarService] Error scheduling meal:', error);
      throw error;
    }
  }

  /**
   * Bulk schedule multiple meals
   * 
   * POST /api/meals/calendar/:userId/bulk-schedule
   * 
   * @param userId - User ID
   * @param request - Bulk schedule request
   * @returns Created schedule entries
   */
  async bulkScheduleMeals(userId: string, request: BulkScheduleRequest): Promise<ScheduleEntry[]> {
    try {
      const response = await fetchWithLogging(
        `${this.baseUrl}/api/meals/calendar/${userId}/bulk-schedule`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(request),
        }
      );

      const data = await response.json();
      return data.schedules || [];
    } catch (error) {
      console.error('[MealCalendarService] Error bulk scheduling meals:', error);
      throw error;
    }
  }

  /**
   * Mark meal as completed
   * 
   * PUT /api/meals/calendar/:userId/:scheduleId/complete
   * 
   * @param userId - User ID
   * @param scheduleId - Schedule entry ID
   * @param notes - Optional completion notes
   * @returns Updated schedule entry
   */
  async markMealComplete(
    userId: string,
    scheduleId: number,
    notes?: string
  ): Promise<ScheduleEntry | null> {
    try {
      const response = await fetchWithLogging(
        `${this.baseUrl}/api/meals/calendar/${userId}/${scheduleId}/complete`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ notes }),
        }
      );

      const data = await response.json();
      return data.schedule || null;
    } catch (error) {
      console.error('[MealCalendarService] Error marking meal complete:', error);
      throw error;
    }
  }

  /**
   * Remove a scheduled meal
   * 
   * DELETE /api/meals/calendar/:userId/:scheduleId
   * 
   * @param userId - User ID
   * @param scheduleId - Schedule entry ID
   */
  async removeScheduledMeal(userId: string, scheduleId: number): Promise<boolean> {
    try {
      const response = await fetchWithLogging(
        `${this.baseUrl}/api/meals/calendar/${userId}/${scheduleId}`,
        {
          method: 'DELETE',
        }
      );

      const data = await response.json();
      return data.success || false;
    } catch (error) {
      console.error('[MealCalendarService] Error removing scheduled meal:', error);
      return false;
    }
  }

  /**
   * Clear all meals for a specific date
   * 
   * DELETE /api/meals/calendar/:userId/date/:date
   * 
   * @param userId - User ID
   * @param date - Date to clear (YYYY-MM-DD)
   */
  async clearDay(userId: string, date: string): Promise<boolean> {
    try {
      const response = await fetchWithLogging(
        `${this.baseUrl}/api/meals/calendar/${userId}/date/${date}`,
        {
          method: 'DELETE',
        }
      );

      const data = await response.json();
      return data.success || false;
    } catch (error) {
      console.error('[MealCalendarService] Error clearing day:', error);
      return false;
    }
  }

  /**
   * Copy meals from one day to another
   * 
   * POST /api/meals/calendar/:userId/copy
   * 
   * @param userId - User ID
   * @param sourceDate - Source date (YYYY-MM-DD)
   * @param targetDate - Target date (YYYY-MM-DD)
   */
  async copyDay(userId: string, sourceDate: string, targetDate: string): Promise<ScheduleEntry[]> {
    try {
      const response = await fetchWithLogging(
        `${this.baseUrl}/api/meals/calendar/${userId}/copy`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ sourceDate, targetDate }),
        }
      );

      const data = await response.json();
      return data.schedules || [];
    } catch (error) {
      console.error('[MealCalendarService] Error copying day:', error);
      throw error;
    }
  }

  // =============================================================================
  // TEMPLATES & SUGGESTIONS
  // =============================================================================

  /**
   * Get meal templates
   * 
   * GET /api/meals/templates
   * 
   * @param mealType - Optional filter by meal type
   * @param cuisineType - Optional filter by cuisine
   * @returns List of meal templates
   */
  async getMealTemplates(mealType?: MealType, cuisineType?: string): Promise<MealTemplate[]> {
    try {
      let url = `${this.baseUrl}/api/meals/templates`;
      const params = new URLSearchParams();
      
      if (mealType) params.append('mealType', mealType);
      if (cuisineType) params.append('cuisineType', cuisineType);
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetchWithLogging(url, {
        method: 'GET',
      });

      const data = await response.json();
      return data.templates || [];
    } catch (error) {
      console.error('[MealCalendarService] Error fetching meal templates:', error);
      return [];
    }
  }

  /**
   * Get breakfast suggestions
   * 
   * GET /api/meals/breakfast
   * 
   * @param limit - Number of suggestions
   * @returns Breakfast meal suggestions
   */
  async getBreakfastSuggestions(limit: number = 5): Promise<GeneratedMeal[]> {
    try {
      const response = await fetchWithLogging(
        `${this.baseUrl}/api/meals/breakfast?limit=${limit}`,
        {
          method: 'GET',
        }
      );

      const data = await response.json();
      return data.meals || [];
    } catch (error) {
      console.error('[MealCalendarService] Error fetching breakfast suggestions:', error);
      return [];
    }
  }

  /**
   * Get lunch suggestions
   * 
   * GET /api/meals/lunch
   * 
   * @param limit - Number of suggestions
   * @returns Lunch meal suggestions
   */
  async getLunchSuggestions(limit: number = 5): Promise<GeneratedMeal[]> {
    try {
      const response = await fetchWithLogging(
        `${this.baseUrl}/api/meals/lunch?limit=${limit}`,
        {
          method: 'GET',
        }
      );

      const data = await response.json();
      return data.meals || [];
    } catch (error) {
      console.error('[MealCalendarService] Error fetching lunch suggestions:', error);
      return [];
    }
  }

  /**
   * Get dinner suggestions
   * 
   * GET /api/meals/dinner
   * 
   * @param limit - Number of suggestions
   * @returns Dinner meal suggestions
   */
  async getDinnerSuggestions(limit: number = 5): Promise<GeneratedMeal[]> {
    try {
      const response = await fetchWithLogging(
        `${this.baseUrl}/api/meals/dinner?limit=${limit}`,
        {
          method: 'GET',
        }
      );

      const data = await response.json();
      return data.meals || [];
    } catch (error) {
      console.error('[MealCalendarService] Error fetching dinner suggestions:', error);
      return [];
    }
  }

  /**
   * Get complete day plan (breakfast, lunch, dinner)
   * 
   * GET /api/meals/day-plan
   * 
   * @param userId - User ID
   * @param dietaryRestrictions - Optional dietary restrictions
   * @returns Complete day meal plan
   */
  async getDayPlan(userId: string, dietaryRestrictions?: DietaryRestriction[]): Promise<DayPlan | null> {
    try {
      let url = `${this.baseUrl}/api/meals/day-plan?userId=${userId}`;
      
      if (dietaryRestrictions?.length) {
        url += `&restrictions=${dietaryRestrictions.join(',')}`;
      }

      const response = await fetchWithLogging(url, {
        method: 'GET',
      });

      const data = await response.json();
      return data.plan || null;
    } catch (error) {
      console.error('[MealCalendarService] Error fetching day plan:', error);
      return null;
    }
  }

  // =============================================================================
  // MEAL PROGRAMS
  // =============================================================================

  /**
   * Get user's meal programs
   * 
   * GET /api/meal-programs?userId=xxx
   * 
   * @param userId - User ID
   * @returns List of meal programs
   */
  async getMealPrograms(userId: string): Promise<MealProgram[]> {
    try {
      const response = await fetchWithLogging(
        `${this.baseUrl}/api/meal-programs?userId=${userId}`,
        {
          method: 'GET',
        }
      );

      const data = await response.json();
      return data.programs || [];
    } catch (error) {
      console.error('[MealCalendarService] Error fetching meal programs:', error);
      return [];
    }
  }

  /**
   * Get active meal plan
   * 
   * GET /api/meals/active-plan/:userId
   * 
   * @param userId - User ID
   * @returns Active meal plan or null
   */
  async getActiveMealPlan(userId: string): Promise<ActiveMealPlan | null> {
    try {
      const response = await fetchWithLogging(
        `${this.baseUrl}/api/meals/active-plan/${userId}`,
        {
          method: 'GET',
        }
      );

      const data = await response.json();
      return data.plan || null;
    } catch (error) {
      console.error('[MealCalendarService] Error fetching active meal plan:', error);
      return null;
    }
  }
}

// =============================================================================
// SINGLETON EXPORT
// =============================================================================

export const mealCalendarService = new MealCalendarService();
export default mealCalendarService;
