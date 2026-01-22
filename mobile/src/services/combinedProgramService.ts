/**
 * Combined Program Service
 * 
 * Service for combining Fitness + Meals into unified health programs.
 * Calls the services.wihy.ai backend API for combined program management.
 * 
 * @see WIHY_COMBINED_PROGRAMS_GUIDE.md for full documentation
 * @see SERVICES_WIHY_IMPLEMENTATION_GUIDE.md for backend API spec
 */

import { API_CONFIG } from './config';
import { authService } from './authService';
import { storageService } from './storage/storageService';
import { syncEngine } from './sync/syncEngine';
import { connectivityService } from './connectivity/connectivityService';
import { fetchWithLogging } from '../utils/apiLogger';
import type {
  CookingSkillLevel,
  MealVariety,
  TimePerMeal,
} from './mealService';

// ============================================
// TYPES & INTERFACES
// ============================================

export type CombinedGoal = 
  | 'weight_loss'
  | 'muscle_gain'
  | 'maintenance'
  | 'athletic_performance'
  | 'general_health'
  | 'body_recomposition';

export type FitnessMode = 'quick' | 'routine' | 'training';
export type MealMode = 'quick' | 'plan' | 'diet';

export interface UserProfile {
  userId: string;
  age: number;
  weight: number; // lbs
  height: number; // inches
  gender: 'male' | 'female' | 'other';
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
}

export interface SyncOptions {
  calorieAdjustment: boolean;
  postWorkoutMeals: boolean;
  restDayNutrition: boolean;
  mealTiming: boolean;
}

export interface WorkoutDay {
  day: string;
  dayNumber: number;
  type: string;
  workout?: any;
  duration?: number;
  estimatedCalories?: number;
  isRest: boolean;
}

export interface SyncedMealDay {
  date: string;
  dayNumber: number;
  dayName: string;
  isWorkoutDay: boolean;
  workoutCalories: number;
  baseCalories: number;
  adjustedCalories: number;
  meals: any[];
  postWorkoutMeal?: any;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
}

export interface CombinedProgram {
  id: string;
  goal: CombinedGoal;
  status: 'active' | 'paused' | 'completed';
  
  fitness: {
    mode: FitnessMode;
    programId?: string;
    daysPerWeek: number;
    workoutSchedule: WorkoutDay[];
    totalWeeklyCalories: number;
  };
  
  meals: {
    mode: MealMode;
    programId?: string;
    workoutDayCalories: number;
    restDayCalories: number;
    proteinTarget: number;
  };
  
  sync: SyncOptions;
  
  syncedDays: SyncedMealDay[];
  
  duration: number; // days
  startDate: string;
  endDate: string;
  
  config: CombinedProgramConfig;
  
  progress: {
    currentDay: number;
    workoutsCompleted: number;
    workoutsScheduled: number;
    mealsLogged: number;
    mealsPlanned: number;
    complianceRate: number;
  };
  
  createdAt: string;
  updatedAt: string;
}

export interface CombinedProgramConfig {
  goal: CombinedGoal;
  fitness: {
    mode: FitnessMode;
    daysPerWeek: number;
    workoutType: string;
    intensity: string;
    duration: number;
  };
  meals: {
    mode: MealMode;
    fitnessGoal: string;
    workoutDayCalories: number;
    restDayCalories: number;
    proteinTarget: number;
    suggestedDiets: string[];
  };
  sync: SyncOptions;
}

export interface CombinedProgramOptions {
  duration?: number;
  fitnessOverrides?: Partial<{
    mode: FitnessMode;
    daysPerWeek: number;
    workoutTypes: string[];
    intensity: string;
    duration: number;
    equipment: string[];
    sport?: string;
  }>;
  mealOverrides?: Partial<{
    mode: MealMode;
    dietaryRestrictions: string[];
    preferredStores: string[];
    cookingLevel: CookingSkillLevel;
    mealVariety: MealVariety;
    timePerMeal: TimePerMeal;
  }>;
}

export interface PostWorkoutMealSuggestion {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  prepTime: number;
  description: string;
}

export interface PostWorkoutCombo {
  workout: {
    type: string;
    duration: number;
    caloriesBurned: number;
    musclesWorked: string[];
  };
  postWorkoutMeal: {
    timing: string;
    targetProtein: number;
    targetCarbs: number;
    suggestions: PostWorkoutMealSuggestion[];
  };
}

export interface CombinedDashboardView {
  activeProgram: {
    id: string;
    goal: string;
    goalLabel: string;
    daysRemaining: number;
    overallProgress: number;
  } | null;
  
  today: {
    workout: {
      scheduled: any | null;
      completed: boolean;
      caloriesBurned: number;
    };
    meals: {
      planned: any[];
      caloriesTarget: number;
      caloriesLogged: number;
      caloriesRemaining: number;
      proteinTarget: number;
      proteinLogged: number;
    };
    netCalories: number;
    isWorkoutDay: boolean;
  };
  
  thisWeek: {
    workoutsCompleted: number;
    workoutsRemaining: number;
    avgCalorieBalance: number;
    avgProteinIntake: number;
  };
  
  recommendations: Recommendation[];
}

export interface Recommendation {
  icon: string;
  text: string;
  color: string;
}

// Local interface for meal plan response (used in offline sync)
interface MealPlanResponse {
  program_id?: string;
  days?: Array<{
    meals: any[];
    total_protein?: number;
    total_carbs?: number;
    total_fat?: number;
  }>;
}

// ============================================
// CONSTANTS
// ============================================

const ACTIVITY_MULTIPLIERS: Record<string, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

const INTENSITY_CALORIES_PER_MIN: Record<string, number> = {
  light: 5,
  moderate: 8,
  intense: 12,
  moderate_to_intense: 10,
};

const GOAL_LABELS: Record<CombinedGoal, string> = {
  weight_loss: 'Weight Loss',
  muscle_gain: 'Muscle Gain',
  maintenance: 'Maintenance',
  athletic_performance: 'Athletic Performance',
  general_health: 'General Health',
  body_recomposition: 'Body Recomposition',
};

interface GoalPairing {
  fitness: {
    preferredModes: FitnessMode[];
    workoutTypes: string[];
    daysPerWeek: number[];
    intensity: string;
  };
  meals: {
    preferredModes: MealMode[];
    fitnessGoal: string;
    calorieApproach: 'deficit' | 'surplus' | 'maintenance';
    proteinTarget: 'moderate' | 'high' | 'very_high';
    diets: string[];
  };
}

const GOAL_PAIRINGS: Record<CombinedGoal, GoalPairing> = {
  weight_loss: {
    fitness: {
      preferredModes: ['routine', 'quick'],
      workoutTypes: ['hiit', 'cardio', 'full_body'],
      daysPerWeek: [3, 4, 5],
      intensity: 'moderate',
    },
    meals: {
      preferredModes: ['diet', 'plan'],
      fitnessGoal: 'weight_loss',
      calorieApproach: 'deficit',
      proteinTarget: 'high',
      diets: ['mediterranean', 'high_protein', 'low_carb'],
    },
  },
  muscle_gain: {
    fitness: {
      preferredModes: ['routine', 'training'],
      workoutTypes: ['strength', 'upper_body', 'lower_body'],
      daysPerWeek: [4, 5, 6],
      intensity: 'moderate_to_intense',
    },
    meals: {
      preferredModes: ['diet', 'plan'],
      fitnessGoal: 'muscle_gain',
      calorieApproach: 'surplus',
      proteinTarget: 'very_high',
      diets: ['high_protein'],
    },
  },
  maintenance: {
    fitness: {
      preferredModes: ['routine', 'quick'],
      workoutTypes: ['full_body', 'cardio', 'flexibility'],
      daysPerWeek: [3, 4],
      intensity: 'moderate',
    },
    meals: {
      preferredModes: ['plan', 'diet'],
      fitnessGoal: 'maintenance',
      calorieApproach: 'maintenance',
      proteinTarget: 'moderate',
      diets: ['mediterranean', 'balanced'],
    },
  },
  athletic_performance: {
    fitness: {
      preferredModes: ['training', 'routine'],
      workoutTypes: ['sport_specific', 'strength', 'cardio'],
      daysPerWeek: [5, 6],
      intensity: 'intense',
    },
    meals: {
      preferredModes: ['diet', 'plan'],
      fitnessGoal: 'muscle_gain',
      calorieApproach: 'surplus',
      proteinTarget: 'very_high',
      diets: ['high_protein'],
    },
  },
  general_health: {
    fitness: {
      preferredModes: ['quick', 'routine'],
      workoutTypes: ['full_body', 'cardio', 'flexibility'],
      daysPerWeek: [2, 3, 4],
      intensity: 'moderate',
    },
    meals: {
      preferredModes: ['plan', 'quick'],
      fitnessGoal: 'maintenance',
      calorieApproach: 'maintenance',
      proteinTarget: 'moderate',
      diets: ['mediterranean', 'balanced'],
    },
  },
  body_recomposition: {
    fitness: {
      preferredModes: ['routine'],
      workoutTypes: ['strength', 'full_body', 'hiit'],
      daysPerWeek: [4, 5],
      intensity: 'moderate_to_intense',
    },
    meals: {
      preferredModes: ['diet'],
      fitnessGoal: 'weight_loss',
      calorieApproach: 'deficit',
      proteinTarget: 'very_high',
      diets: ['high_protein', 'low_carb'],
    },
  },
};

const POST_WORKOUT_MEALS: PostWorkoutMealSuggestion[] = [
  {
    name: 'Protein Shake + Banana',
    calories: 350,
    protein: 35,
    carbs: 45,
    fat: 5,
    prepTime: 2,
    description: 'Quick and easy post-workout recovery',
  },
  {
    name: 'Chicken & Rice Bowl',
    calories: 450,
    protein: 42,
    carbs: 55,
    fat: 8,
    prepTime: 15,
    description: 'Classic muscle-building meal',
  },
  {
    name: 'Greek Yogurt Parfait',
    calories: 320,
    protein: 28,
    carbs: 40,
    fat: 6,
    prepTime: 5,
    description: 'Protein-rich with antioxidants',
  },
  {
    name: 'Turkey & Avocado Wrap',
    calories: 420,
    protein: 35,
    carbs: 35,
    fat: 16,
    prepTime: 10,
    description: 'Balanced macros for recovery',
  },
  {
    name: 'Egg White Omelette',
    calories: 280,
    protein: 32,
    carbs: 8,
    fat: 12,
    prepTime: 10,
    description: 'Low-carb protein option',
  },
  {
    name: 'Salmon & Sweet Potato',
    calories: 480,
    protein: 38,
    carbs: 45,
    fat: 18,
    prepTime: 25,
    description: 'Omega-3 rich recovery meal',
  },
];

// ============================================
// UTILITY FUNCTIONS
// ============================================

function generateId(): string {
  return `cp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function calculateBMR(profile: UserProfile): number {
  // Mifflin-St Jeor Equation
  const weightKg = profile.weight * 0.453592;
  const heightCm = profile.height * 2.54;
  
  if (profile.gender === 'male') {
    return 10 * weightKg + 6.25 * heightCm - 5 * profile.age + 5;
  } else {
    return 10 * weightKg + 6.25 * heightCm - 5 * profile.age - 161;
  }
}

function calculateTDEE(profile: UserProfile): number {
  const bmr = calculateBMR(profile);
  const multiplier = ACTIVITY_MULTIPLIERS[profile.activityLevel] || 1.55;
  return Math.round(bmr * multiplier);
}

function calculateProteinTarget(weightLbs: number, level: 'moderate' | 'high' | 'very_high'): number {
  const multipliers = {
    moderate: 0.8,
    high: 1.0,
    very_high: 1.2,
  };
  return Math.round(weightLbs * multipliers[level]);
}

function calculateWeeklyBurn(daysPerWeek: number, intensity: string, duration: number): number {
  const calsPerMin = INTENSITY_CALORIES_PER_MIN[intensity] || 8;
  return daysPerWeek * duration * calsPerMin;
}

function getWeekdayName(dayNumber: number): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[dayNumber % 7];
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

// ============================================
// AUTO-CONFIGURATION
// ============================================

function autoConfigureCombinedProgram(
  goal: CombinedGoal,
  userProfile: UserProfile
): CombinedProgramConfig {
  const pairing = GOAL_PAIRINGS[goal];
  const tdee = calculateTDEE(userProfile);
  
  // Adjust calories based on goal
  let baseCalories: number;
  switch (pairing.meals.calorieApproach) {
    case 'deficit':
      baseCalories = tdee - 500;
      break;
    case 'surplus':
      baseCalories = tdee + 300;
      break;
    default:
      baseCalories = tdee;
  }
  
  // Ensure minimum healthy calories
  baseCalories = Math.max(baseCalories, userProfile.gender === 'male' ? 1500 : 1200);
  
  // Calculate estimated workout burns
  const daysPerWeek = pairing.fitness.daysPerWeek[1]; // middle option
  const avgDuration = 45;
  const estimatedDailyBurn = (calculateWeeklyBurn(daysPerWeek, pairing.fitness.intensity, avgDuration)) / daysPerWeek;
  
  // Workout day gets extra calories (about 50% of burn)
  const workoutDayCalories = Math.round(baseCalories + estimatedDailyBurn * 0.5);
  const restDayCalories = baseCalories;
  
  const proteinTarget = calculateProteinTarget(userProfile.weight, pairing.meals.proteinTarget);
  
  return {
    goal,
    fitness: {
      mode: pairing.fitness.preferredModes[0],
      daysPerWeek,
      workoutType: pairing.fitness.workoutTypes[0],
      intensity: pairing.fitness.intensity,
      duration: avgDuration,
    },
    meals: {
      mode: pairing.meals.preferredModes[0],
      fitnessGoal: pairing.meals.fitnessGoal,
      workoutDayCalories,
      restDayCalories,
      proteinTarget,
      suggestedDiets: pairing.meals.diets,
    },
    sync: {
      calorieAdjustment: true,
      postWorkoutMeals: goal === 'muscle_gain' || goal === 'athletic_performance',
      restDayNutrition: goal === 'weight_loss' || goal === 'body_recomposition',
      mealTiming: goal === 'muscle_gain' || goal === 'athletic_performance',
    },
  };
}

// ============================================
// MAIN SERVICE CLASS
// ============================================

const COMBINED_PROGRAMS_CACHE_KEY = 'programs:combined';
const ACTIVE_PROGRAM_CACHE_KEY = 'programs:combined:active';

class CombinedProgramService {
  private readonly BASE_URL = `${API_CONFIG.baseUrl}/api/programs/combined`;
  
  /**
   * Get auth headers for API requests
   */
  private async getHeaders(): Promise<Record<string, string>> {
    const token = await authService.getAccessToken();
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Create a combined fitness + meal program
   */
  async createCombinedProgram(
    goal: CombinedGoal,
    userProfile: UserProfile,
    options?: CombinedProgramOptions,
    authToken?: string
  ): Promise<CombinedProgram> {
    console.log('[CombinedProgramService] Creating combined program for goal:', goal);
    
    const requestBody = {
      goal,
      duration: options?.duration || 28,
      user_profile: {
        age: userProfile.age,
        weight: userProfile.weight,
        height: userProfile.height,
        gender: userProfile.gender,
        activity_level: userProfile.activityLevel,
      },
      fitness_overrides: options?.fitnessOverrides ? {
        days_per_week: options.fitnessOverrides.daysPerWeek,
        workout_type: options.fitnessOverrides.workoutTypes?.[0],
        duration: options.fitnessOverrides.duration,
        equipment: options.fitnessOverrides.equipment,
      } : undefined,
      meal_overrides: options?.mealOverrides ? {
        dietary_restrictions: options.mealOverrides.dietaryRestrictions,
        meal_variety: options.mealOverrides.mealVariety,
        cooking_level: options.mealOverrides.cookingLevel,
      } : undefined,
      sync_options: {
        calorie_adjustment: true,
        post_workout_meals: true,
        rest_day_nutrition: true,
        meal_timing: true,
      },
    };

    // If offline, create locally and queue for sync
    if (!connectivityService.isOnline()) {
      return this.createProgramOffline(goal, userProfile, options);
    }

    try {
      const headers = await this.getHeaders();
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const response = await fetchWithLogging(this.BASE_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create combined program');
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to create combined program');
      }

      const program = this.transformApiResponse(data.program);
      
      // Cache the program locally
      await this.cacheProgram(program);
      
      console.log('[CombinedProgramService] Combined program created:', program.id);
      return program;
      
    } catch (error) {
      console.error('[CombinedProgramService] API call failed, falling back to offline:', error);
      return this.createProgramOffline(goal, userProfile, options);
    }
  }

  /**
   * List combined programs
   */
  async listPrograms(status?: 'active' | 'completed' | 'paused'): Promise<CombinedProgram[]> {
    // Return cached first
    const cached = await storageService.get<CombinedProgram[]>(COMBINED_PROGRAMS_CACHE_KEY);
    
    if (!connectivityService.isOnline()) {
      return cached || [];
    }

    try {
      const headers = await this.getHeaders();
      const params = status ? `?status=${status}` : '';
      
      const response = await fetchWithLogging(`${this.BASE_URL}${params}`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        return cached || [];
      }

      const data = await response.json();
      
      if (!data.success) {
        return cached || [];
      }

      const programs = data.programs.map((p: any) => this.transformApiResponse(p));
      await storageService.set(COMBINED_PROGRAMS_CACHE_KEY, programs);
      
      return programs;
      
    } catch (error) {
      console.error('[CombinedProgramService] Failed to list programs:', error);
      return cached || [];
    }
  }

  /**
   * Get a specific combined program by ID
   */
  async getProgram(programId: string): Promise<CombinedProgram | null> {
    // Check cache first
    const cached = await storageService.get<CombinedProgram[]>(COMBINED_PROGRAMS_CACHE_KEY);
    const cachedProgram = cached?.find(p => p.id === programId);
    
    if (!connectivityService.isOnline()) {
      return cachedProgram || null;
    }

    try {
      const headers = await this.getHeaders();
      
      const response = await fetchWithLogging(`${this.BASE_URL}/${programId}`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        return cachedProgram || null;
      }

      const data = await response.json();
      
      if (!data.success) {
        return cachedProgram || null;
      }

      return this.transformApiResponse(data.program);
      
    } catch (error) {
      console.error('[CombinedProgramService] Failed to get program:', error);
      return cachedProgram || null;
    }
  }

  /**
   * Get active combined program
   */
  async getActiveProgram(): Promise<CombinedProgram | null> {
    const programs = await this.listPrograms('active');
    return programs[0] || null;
  }

  /**
   * Update a combined program
   */
  async updateProgram(
    programId: string,
    updates: Partial<{ status: string; fitnessOverrides: any }>
  ): Promise<CombinedProgram | null> {
    if (!connectivityService.isOnline()) {
      // Queue for sync
      await syncEngine.enqueue({
        operation: 'update',
        endpoint: `/api/programs/combined/${programId}`,
        payload: updates,
        priority: 'normal',
      });
      return null;
    }

    try {
      const headers = await this.getHeaders();
      
      const response = await fetchWithLogging(`${this.BASE_URL}/${programId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Failed to update program');
      }

      const data = await response.json();
      return data.success ? this.transformApiResponse(data.program) : null;
      
    } catch (error) {
      console.error('[CombinedProgramService] Failed to update program:', error);
      return null;
    }
  }

  /**
   * Delete a combined program
   */
  async deleteProgram(programId: string): Promise<boolean> {
    if (!connectivityService.isOnline()) {
      await syncEngine.enqueue({
        operation: 'delete',
        endpoint: `/api/programs/combined/${programId}`,
        payload: {},
        priority: 'normal',
      });
      return true;
    }

    try {
      const headers = await this.getHeaders();
      
      const response = await fetchWithLogging(`${this.BASE_URL}/${programId}`, {
        method: 'DELETE',
        headers,
      });

      return response.ok;
      
    } catch (error) {
      console.error('[CombinedProgramService] Failed to delete program:', error);
      return false;
    }
  }

  /**
   * Log workout completion for a combined program
   */
  async logWorkoutCompletion(
    programId: string,
    workoutData: {
      workoutDay: number;
      duration: number;
      caloriesBurned: number;
      completedAt?: string;
      notes?: string;
    }
  ): Promise<{ workoutLog: any; postWorkoutMeal: any; progressUpdated: any } | null> {
    const payload = {
      workout_day: workoutData.workoutDay,
      duration: workoutData.duration,
      calories_burned: workoutData.caloriesBurned,
      completed_at: workoutData.completedAt || new Date().toISOString(),
      notes: workoutData.notes,
    };

    if (!connectivityService.isOnline()) {
      await syncEngine.enqueue({
        operation: 'create',
        endpoint: `/api/programs/combined/${programId}/workout`,
        payload,
        priority: 'high',
      });
      return null;
    }

    try {
      const headers = await this.getHeaders();
      
      const response = await fetchWithLogging(`${this.BASE_URL}/${programId}/workout`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Failed to log workout');
      }

      const data = await response.json();
      
      return data.success ? {
        workoutLog: data.workout_log,
        postWorkoutMeal: data.post_workout_meal,
        progressUpdated: data.progress_updated,
      } : null;
      
    } catch (error) {
      console.error('[CombinedProgramService] Failed to log workout:', error);
      return null;
    }
  }

  /**
   * Get post-workout meal suggestions from API
   */
  async getPostWorkoutMealFromApi(
    programId: string,
    workout: { type: string; duration: number; caloriesBurned: number; musclesWorked?: string[] }
  ): Promise<PostWorkoutCombo | null> {
    if (!connectivityService.isOnline()) {
      // Use local calculation as fallback
      return null;
    }

    try {
      const headers = await this.getHeaders();
      
      const response = await fetchWithLogging(`${this.BASE_URL}/${programId}/post-workout-meal`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          workout_type: workout.type,
          duration: workout.duration,
          calories_burned: workout.caloriesBurned,
          muscles_worked: workout.musclesWorked,
        }),
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return data.success ? data : null;
      
    } catch (error) {
      console.error('[CombinedProgramService] Failed to get post-workout meal:', error);
      return null;
    }
  }

  /**
   * Get post-workout meal suggestions (local fallback)
   */
  getPostWorkoutMeal(
    workout: { type: string; duration: number; caloriesBurned: number; musclesWorked?: string[] },
    userProfile: UserProfile,
    goal?: CombinedGoal
  ): PostWorkoutCombo {
    // Calculate targets based on workout intensity
    const targetProtein = Math.round(userProfile.weight * 0.15); // ~15% of body weight in grams
    const targetCarbs = Math.round(workout.caloriesBurned * 0.1); // Replenish glycogen
    
    // Filter and sort suggestions based on goal
    let suggestions = [...POST_WORKOUT_MEALS];
    
    if (goal === 'weight_loss') {
      suggestions = suggestions.filter(m => m.calories < 400);
    } else if (goal === 'muscle_gain') {
      suggestions = suggestions.filter(m => m.protein >= 35);
    }
    
    // Sort by protein content
    suggestions.sort((a, b) => b.protein - a.protein);
    
    return {
      workout: {
        type: workout.type,
        duration: workout.duration,
        caloriesBurned: workout.caloriesBurned,
        musclesWorked: workout.musclesWorked || [],
      },
      postWorkoutMeal: {
        timing: 'within 30-60 minutes',
        targetProtein,
        targetCarbs,
        suggestions: suggestions.slice(0, 4),
      },
    };
  }
  
  /**
   * Get dashboard view for active combined program
   */
  getDashboardView(
    program: CombinedProgram | null,
    todayWorkoutCompleted?: boolean,
    todayMealsLogged?: { calories: number; protein: number }
  ): CombinedDashboardView {
    const today = new Date();
    const dayOfWeek = today.getDay();
    
    if (!program) {
      return {
        activeProgram: null,
        today: {
          workout: { scheduled: null, completed: false, caloriesBurned: 0 },
          meals: {
            planned: [],
            caloriesTarget: 2000,
            caloriesLogged: 0,
            caloriesRemaining: 2000,
            proteinTarget: 120,
            proteinLogged: 0,
          },
          netCalories: 0,
          isWorkoutDay: false,
        },
        thisWeek: {
          workoutsCompleted: 0,
          workoutsRemaining: 0,
          avgCalorieBalance: 0,
          avgProteinIntake: 0,
        },
        recommendations: [{ icon: 'add-circle-outline', text: 'Create a combined program to get personalized recommendations!', color: '#6366f1' }],
      };
    }
    
    // Find today's schedule
    const todaySchedule = program.fitness.workoutSchedule.find(w => w.dayNumber === dayOfWeek);
    const todaySynced = program.syncedDays.find(d => d.dayNumber === dayOfWeek);
    const isWorkoutDay = todaySchedule && !todaySchedule.isRest;
    
    // Calculate progress
    const startDate = new Date(program.startDate);
    const currentDay = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const daysRemaining = Math.max(0, program.duration - currentDay);
    const overallProgress = Math.min(100, Math.round((currentDay / program.duration) * 100));
    
    // Calculate week stats
    const workoutsThisWeek = program.fitness.workoutSchedule.filter(w => !w.isRest).length;
    const workoutsCompleted = todayWorkoutCompleted ? 1 : 0; // In real app, track this
    
    // Today's nutrition
    const caloriesTarget = isWorkoutDay ? program.meals.workoutDayCalories : program.meals.restDayCalories;
    const caloriesLogged = todayMealsLogged?.calories || 0;
    const proteinLogged = todayMealsLogged?.protein || 0;
    const workoutCalories = todayWorkoutCompleted && todaySchedule?.estimatedCalories ? todaySchedule.estimatedCalories : 0;
    
    // Generate recommendations
    const recommendations: Recommendation[] = [];
    
    if (isWorkoutDay && !todayWorkoutCompleted) {
      recommendations.push({
        icon: 'fitness',
        text: `Today is a ${todaySchedule?.type || 'workout'} day - don't forget to exercise!`,
        color: '#f97316',
      });
    }
    
    if (caloriesLogged < caloriesTarget * 0.5) {
      recommendations.push({
        icon: 'restaurant',
        text: `You still have ${caloriesTarget - caloriesLogged} calories to eat today`,
        color: '#8b5cf6',
      });
    }
    
    if (proteinLogged < program.meals.proteinTarget * 0.5) {
      recommendations.push({
        icon: 'nutrition',
        text: `Focus on protein - aim for ${program.meals.proteinTarget - proteinLogged}g more`,
        color: '#ec4899',
      });
    }
    
    if (todayWorkoutCompleted && program.config.sync.postWorkoutMeals) {
      recommendations.push({
        icon: 'cafe',
        text: 'Time for a post-workout meal! High protein + carbs recommended',
        color: '#06b6d4',
      });
    }
    
    if (recommendations.length === 0) {
      recommendations.push({
        icon: 'checkmark-circle',
        text: 'You\'re on track! Keep up the great work!',
        color: '#10b981',
      });
    }
    
    return {
      activeProgram: {
        id: program.id,
        goal: program.goal,
        goalLabel: GOAL_LABELS[program.goal],
        daysRemaining,
        overallProgress,
      },
      today: {
        workout: {
          scheduled: isWorkoutDay ? todaySchedule : null,
          completed: todayWorkoutCompleted || false,
          caloriesBurned: workoutCalories,
        },
        meals: {
          planned: todaySynced?.meals || [],
          caloriesTarget,
          caloriesLogged,
          caloriesRemaining: Math.max(0, caloriesTarget - caloriesLogged),
          proteinTarget: program.meals.proteinTarget,
          proteinLogged,
        },
        netCalories: caloriesLogged - workoutCalories,
        isWorkoutDay: isWorkoutDay || false,
      },
      thisWeek: {
        workoutsCompleted,
        workoutsRemaining: workoutsThisWeek - workoutsCompleted,
        avgCalorieBalance: caloriesLogged > 0 ? caloriesLogged - caloriesTarget : 0,
        avgProteinIntake: proteinLogged,
      },
      recommendations,
    };
  }
  
  /**
   * Get available goals with descriptions
   */
  getAvailableGoals(): Array<{ id: CombinedGoal; label: string; description: string; icon: string }> {
    return [
      {
        id: 'weight_loss',
        label: 'Weight Loss',
        description: 'Caloric deficit with high protein to preserve muscle',
        icon: 'trending-down-outline',
      },
      {
        id: 'muscle_gain',
        label: 'Muscle Gain',
        description: 'Caloric surplus with strength training focus',
        icon: 'fitness-outline',
      },
      {
        id: 'body_recomposition',
        label: 'Body Recomp',
        description: 'Lose fat and build muscle simultaneously',
        icon: 'body-outline',
      },
      {
        id: 'maintenance',
        label: 'Maintenance',
        description: 'Maintain current weight with balanced nutrition',
        icon: 'shield-checkmark-outline',
      },
      {
        id: 'athletic_performance',
        label: 'Athletic Performance',
        description: 'Sport-specific training with performance nutrition',
        icon: 'trophy-outline',
      },
      {
        id: 'general_health',
        label: 'General Health',
        description: 'Balanced approach for overall wellness',
        icon: 'heart-outline',
      },
    ];
  }
  
  /**
   * Preview program configuration before creation
   */
  previewProgramConfig(
    goal: CombinedGoal,
    userProfile: UserProfile,
    options?: CombinedProgramOptions
  ): CombinedProgramConfig {
    const config = autoConfigureCombinedProgram(goal, userProfile);
    
    if (options?.fitnessOverrides) {
      Object.assign(config.fitness, options.fitnessOverrides);
    }
    
    if (options?.mealOverrides) {
      if (options.mealOverrides.dietaryRestrictions) {
        config.meals.suggestedDiets = options.mealOverrides.dietaryRestrictions;
      }
    }
    
    return config;
  }
  
  // ============================================
  // PRIVATE HELPERS
  // ============================================
  
  private buildWorkoutSchedule(fitnessProgram: any, daysPerWeek: number): WorkoutDay[] {
    const schedule: WorkoutDay[] = [];
    
    // If we have a routine with weekly_schedule, use it
    if (fitnessProgram?.weekly_schedule) {
      return fitnessProgram.weekly_schedule.map((day: any) => ({
        day: day.day || getWeekdayName(day.day_number - 1),
        dayNumber: day.day_number - 1, // Convert to 0-indexed
        type: day.type,
        workout: day.workout,
        duration: day.workout?.duration_minutes || 45,
        estimatedCalories: day.workout?.estimated_calories || 0,
        isRest: day.type === 'rest' || !day.workout,
      }));
    }
    
    // Otherwise, create a basic schedule
    const workoutDays = this.getOptimalWorkoutDays(daysPerWeek);
    
    for (let i = 0; i < 7; i++) {
      const isWorkoutDay = workoutDays.includes(i);
      schedule.push({
        day: getWeekdayName(i),
        dayNumber: i,
        type: isWorkoutDay ? 'full_body' : 'rest',
        workout: isWorkoutDay ? fitnessProgram?.workout : null,
        duration: isWorkoutDay ? 45 : 0,
        estimatedCalories: isWorkoutDay ? 300 : 0,
        isRest: !isWorkoutDay,
      });
    }
    
    return schedule;
  }
  
  private getOptimalWorkoutDays(daysPerWeek: number): number[] {
    // Return optimal workout day indices (0 = Sunday)
    switch (daysPerWeek) {
      case 2: return [1, 4]; // Mon, Thu
      case 3: return [1, 3, 5]; // Mon, Wed, Fri
      case 4: return [1, 2, 4, 5]; // Mon, Tue, Thu, Fri
      case 5: return [1, 2, 3, 4, 5]; // Mon-Fri
      case 6: return [1, 2, 3, 4, 5, 6]; // Mon-Sat
      default: return [1, 3, 5]; // Default to 3 days
    }
  }
  
  private createPlaceholderFitnessSchedule(daysPerWeek: number): any {
    const workoutDays = this.getOptimalWorkoutDays(daysPerWeek);
    
    return {
      routine_id: `placeholder_${Date.now()}`,
      weekly_schedule: Array.from({ length: 7 }, (_, i) => ({
        day_number: i + 1,
        day: getWeekdayName(i),
        type: workoutDays.includes(i) ? 'full_body' : 'rest',
        workout: workoutDays.includes(i) ? {
          title: 'Full Body Workout',
          duration_minutes: 45,
          estimated_calories: 300,
        } : null,
      })),
    };
  }
  
  private syncPrograms(
    workoutSchedule: WorkoutDay[],
    mealPlan: MealPlanResponse | null,
    config: CombinedProgramConfig,
    duration: number
  ): SyncedMealDay[] {
    const syncedDays: SyncedMealDay[] = [];
    const startDate = new Date();
    
    for (let i = 0; i < duration; i++) {
      const currentDate = addDays(startDate, i);
      const dayOfWeek = currentDate.getDay();
      const workoutDay = workoutSchedule.find(w => w.dayNumber === dayOfWeek);
      const isWorkoutDay = workoutDay && !workoutDay.isRest;
      const workoutCalories = isWorkoutDay ? (workoutDay.estimatedCalories || 300) : 0;
      
      // Get meal plan day if available
      const mealDayIndex = i % (mealPlan?.days?.length || 1);
      const mealDay = mealPlan?.days?.[mealDayIndex];
      
      // Calculate adjusted calories
      let baseCalories = isWorkoutDay ? config.meals.workoutDayCalories : config.meals.restDayCalories;
      let adjustedCalories = baseCalories;
      
      if (config.sync.calorieAdjustment && isWorkoutDay) {
        // Add back 50% of workout calories
        adjustedCalories += Math.round(workoutCalories * 0.5);
      }
      
      if (config.sync.restDayNutrition && !isWorkoutDay) {
        // Slightly lower carbs on rest days (reduce by ~10%)
        adjustedCalories = Math.round(baseCalories * 0.95);
      }
      
      syncedDays.push({
        date: currentDate.toISOString().split('T')[0],
        dayNumber: dayOfWeek,
        dayName: getWeekdayName(dayOfWeek),
        isWorkoutDay,
        workoutCalories,
        baseCalories,
        adjustedCalories,
        meals: mealDay?.meals || [],
        postWorkoutMeal: isWorkoutDay && config.sync.postWorkoutMeals 
          ? this.getPostWorkoutMealSuggestion(config.goal)
          : undefined,
        totalProtein: mealDay?.total_protein || config.meals.proteinTarget,
        totalCarbs: mealDay?.total_carbs || Math.round(adjustedCalories * 0.4 / 4),
        totalFat: mealDay?.total_fat || Math.round(adjustedCalories * 0.3 / 9),
      });
    }
    
    return syncedDays;
  }
  
  private getPostWorkoutMealSuggestion(goal: CombinedGoal): PostWorkoutMealSuggestion {
    const suggestions = POST_WORKOUT_MEALS.filter(m => {
      if (goal === 'weight_loss') return m.calories < 400;
      if (goal === 'muscle_gain') return m.protein >= 35;
      return true;
    });
    
    return suggestions[0] || POST_WORKOUT_MEALS[0];
  }

  /**
   * Transform API response to CombinedProgram format
   */
  private transformApiResponse(apiProgram: any): CombinedProgram {
    return {
      id: apiProgram.id,
      goal: apiProgram.goal,
      status: apiProgram.status,
      fitness: {
        mode: apiProgram.fitness?.mode || 'routine',
        programId: apiProgram.fitness?.program_id,
        daysPerWeek: apiProgram.fitness?.days_per_week || 3,
        workoutSchedule: (apiProgram.fitness?.workout_schedule || []).map((w: any) => ({
          day: w.day,
          dayNumber: w.day_number,
          type: w.type,
          workout: w.workout,
          duration: w.duration,
          estimatedCalories: w.estimated_calories,
          isRest: w.is_rest,
        })),
        totalWeeklyCalories: apiProgram.fitness?.total_weekly_calories || 0,
      },
      meals: {
        mode: apiProgram.meals?.mode || 'plan',
        programId: apiProgram.meals?.program_id,
        workoutDayCalories: apiProgram.meals?.workout_day_calories || 2000,
        restDayCalories: apiProgram.meals?.rest_day_calories || 1800,
        proteinTarget: apiProgram.meals?.protein_target || 150,
      },
      sync: {
        calorieAdjustment: apiProgram.sync?.calorie_adjustment ?? true,
        postWorkoutMeals: apiProgram.sync?.post_workout_meals ?? true,
        restDayNutrition: apiProgram.sync?.rest_day_nutrition ?? true,
        mealTiming: apiProgram.sync?.meal_timing ?? true,
      },
      syncedDays: (apiProgram.synced_days || []).map((d: any) => ({
        date: d.date,
        dayNumber: d.day_number,
        dayName: d.day_name,
        isWorkoutDay: d.is_workout_day,
        workoutCalories: d.workout_calories,
        baseCalories: d.base_calories,
        adjustedCalories: d.adjusted_calories,
        meals: d.meals || [],
        postWorkoutMeal: d.post_workout_meal,
        totalProtein: d.total_protein,
        totalCarbs: d.total_carbs,
        totalFat: d.total_fat,
      })),
      duration: apiProgram.duration,
      startDate: apiProgram.start_date,
      endDate: apiProgram.end_date,
      config: {
        goal: apiProgram.goal,
        fitness: apiProgram.fitness_config || apiProgram.config?.fitness || {},
        meals: apiProgram.meals_config || apiProgram.config?.meals || {},
        sync: apiProgram.sync_config || apiProgram.config?.sync || {},
      } as CombinedProgramConfig,
      progress: {
        currentDay: apiProgram.progress?.current_day || 1,
        workoutsCompleted: apiProgram.progress?.workouts_completed || 0,
        workoutsScheduled: apiProgram.progress?.workouts_scheduled || 0,
        mealsLogged: apiProgram.progress?.meals_logged || 0,
        mealsPlanned: apiProgram.progress?.meals_planned || 0,
        complianceRate: apiProgram.progress?.compliance_rate || 0,
      },
      createdAt: apiProgram.created_at,
      updatedAt: apiProgram.updated_at || apiProgram.created_at,
    };
  }

  /**
   * Cache program locally
   */
  private async cacheProgram(program: CombinedProgram): Promise<void> {
    const cached = await storageService.get<CombinedProgram[]>(COMBINED_PROGRAMS_CACHE_KEY) || [];
    const index = cached.findIndex(p => p.id === program.id);
    
    if (index >= 0) {
      cached[index] = program;
    } else {
      cached.push(program);
    }
    
    await storageService.set(COMBINED_PROGRAMS_CACHE_KEY, cached);
    
    // Also cache as active if it's active
    if (program.status === 'active') {
      await storageService.set(ACTIVE_PROGRAM_CACHE_KEY, program);
    }
  }

  /**
   * Create program offline (fallback when API unavailable)
   */
  private async createProgramOffline(
    goal: CombinedGoal,
    userProfile: UserProfile,
    options?: CombinedProgramOptions
  ): Promise<CombinedProgram> {
    console.log('[CombinedProgramService] Creating program offline');
    
    const config = autoConfigureCombinedProgram(goal, userProfile);
    
    if (options?.fitnessOverrides) {
      Object.assign(config.fitness, options.fitnessOverrides);
    }
    
    const duration = options?.duration || 28;
    const startDate = new Date();
    const endDate = addDays(startDate, duration);
    
    // Create placeholder fitness schedule
    const fitnessProgram = this.createPlaceholderFitnessSchedule(config.fitness.daysPerWeek);
    const workoutSchedule = this.buildWorkoutSchedule(fitnessProgram, config.fitness.daysPerWeek);
    const totalWeeklyCalories = workoutSchedule.reduce((sum, day) => sum + (day.estimatedCalories || 0), 0);
    
    // Create synced days without meal plan (will be populated on sync)
    const syncedDays = this.syncPrograms(workoutSchedule, null, config, duration);
    
    const program: CombinedProgram = {
      id: generateId(),
      goal,
      status: 'active',
      fitness: {
        mode: config.fitness.mode,
        programId: fitnessProgram.routine_id,
        daysPerWeek: config.fitness.daysPerWeek,
        workoutSchedule,
        totalWeeklyCalories,
      },
      meals: {
        mode: config.meals.mode,
        workoutDayCalories: config.meals.workoutDayCalories,
        restDayCalories: config.meals.restDayCalories,
        proteinTarget: config.meals.proteinTarget,
      },
      sync: config.sync,
      syncedDays,
      duration,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      config,
      progress: {
        currentDay: 1,
        workoutsCompleted: 0,
        workoutsScheduled: Math.ceil(duration / 7) * config.fitness.daysPerWeek,
        mealsLogged: 0,
        mealsPlanned: duration * 3,
        complianceRate: 0,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    // Cache locally
    await this.cacheProgram(program);
    
    // Queue for server sync
    await syncEngine.enqueue({
      operation: 'create',
      endpoint: '/api/programs/combined',
      payload: {
        goal,
        duration,
        user_profile: {
          age: userProfile.age,
          weight: userProfile.weight,
          height: userProfile.height,
          gender: userProfile.gender,
          activity_level: userProfile.activityLevel,
        },
        fitness_overrides: options?.fitnessOverrides,
        meal_overrides: options?.mealOverrides,
      },
      localId: program.id,
      priority: 'high',
    });
    
    return program;
  }

  /**
   * Fetch available goals from API
   */
  async fetchAvailableGoals(): Promise<Array<{ id: CombinedGoal; label: string; description: string; icon: string }>> {
    if (!connectivityService.isOnline()) {
      return this.getAvailableGoals();
    }

    try {
      const headers = await this.getHeaders();
      
      const response = await fetchWithLogging(`${this.BASE_URL}/goals`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        return this.getAvailableGoals();
      }

      const data = await response.json();
      return data.success ? data.goals : this.getAvailableGoals();
      
    } catch (error) {
      return this.getAvailableGoals();
    }
  }

  /**
   * Preview program config from API
   */
  async previewProgramConfigFromApi(
    goal: CombinedGoal,
    userProfile: UserProfile
  ): Promise<CombinedProgramConfig | null> {
    if (!connectivityService.isOnline()) {
      return this.previewProgramConfig(goal, userProfile);
    }

    try {
      const headers = await this.getHeaders();
      
      const response = await fetchWithLogging(`${this.BASE_URL}/preview`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          goal,
          user_profile: {
            age: userProfile.age,
            weight: userProfile.weight,
            height: userProfile.height,
            gender: userProfile.gender,
            activity_level: userProfile.activityLevel,
          },
        }),
      });

      if (!response.ok) {
        return this.previewProgramConfig(goal, userProfile);
      }

      const data = await response.json();
      return data.success ? data.config : this.previewProgramConfig(goal, userProfile);
      
    } catch (error) {
      return this.previewProgramConfig(goal, userProfile);
    }
  }

  /**
   * Get dashboard view from API
   */
  async getDashboardFromApi(programId: string): Promise<CombinedDashboardView | null> {
    if (!connectivityService.isOnline()) {
      return null;
    }

    try {
      const headers = await this.getHeaders();
      
      const response = await fetchWithLogging(`${this.BASE_URL}/${programId}/dashboard`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return data.success ? data.dashboard : null;
      
    } catch (error) {
      return null;
    }
  }
}

// ============================================
// EXPORT
// ============================================

export const combinedProgramService = new CombinedProgramService();
export default combinedProgramService;
