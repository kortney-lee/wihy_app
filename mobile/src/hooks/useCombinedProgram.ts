/**
 * useCombinedProgram Hook
 * 
 * React hook for managing combined fitness + meal programs.
 * Provides state management, persistence, and easy access to program operations.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import combinedProgramService, {
  CombinedProgram,
  CombinedGoal,
  CombinedProgramConfig,
  CombinedProgramOptions,
  CombinedDashboardView,
  PostWorkoutCombo,
  UserProfile,
} from '../services/combinedProgramService';

// ============================================
// STORAGE KEYS
// ============================================

const STORAGE_KEYS = {
  ACTIVE_PROGRAM: '@wihy_combined_program_active',
  PROGRAM_HISTORY: '@wihy_combined_program_history',
  TODAY_WORKOUT_COMPLETED: '@wihy_today_workout_completed',
  TODAY_MEALS_LOGGED: '@wihy_today_meals_logged',
};

// ============================================
// TYPES
// ============================================

interface TodayMealsLogged {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  meals: string[]; // meal ids
}

interface UseCombinedProgramState {
  // Program State
  activeProgram: CombinedProgram | null;
  isLoading: boolean;
  error: string | null;
  
  // Today's State
  todayWorkoutCompleted: boolean;
  todayMealsLogged: TodayMealsLogged;
  
  // Dashboard
  dashboard: CombinedDashboardView | null;
}

interface UseCombinedProgramActions {
  // Program Management
  createProgram: (
    goal: CombinedGoal,
    userProfile: UserProfile,
    options?: CombinedProgramOptions
  ) => Promise<CombinedProgram>;
  
  pauseProgram: () => Promise<void>;
  resumeProgram: () => Promise<void>;
  endProgram: () => Promise<void>;
  
  // Preview
  previewConfig: (
    goal: CombinedGoal,
    userProfile: UserProfile,
    options?: CombinedProgramOptions
  ) => CombinedProgramConfig;
  
  // Daily Tracking
  markWorkoutCompleted: (caloriesBurned?: number) => Promise<void>;
  logMeal: (meal: { calories: number; protein: number; carbs: number; fat: number; id?: string }) => Promise<void>;
  resetDailyTracking: () => Promise<void>;
  
  // Post-Workout
  getPostWorkoutMeal: (
    workout: { type: string; duration: number; caloriesBurned: number; musclesWorked?: string[] },
    userProfile: UserProfile
  ) => PostWorkoutCombo;
  
  // Utilities
  refreshDashboard: () => void;
  getAvailableGoals: () => ReturnType<typeof combinedProgramService.getAvailableGoals>;
}

interface UseCombinedProgramReturn extends UseCombinedProgramState, UseCombinedProgramActions {}

// ============================================
// HOOK IMPLEMENTATION
// ============================================

export function useCombinedProgram(authToken?: string): UseCombinedProgramReturn {
  // State
  const [activeProgram, setActiveProgram] = useState<CombinedProgram | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [todayWorkoutCompleted, setTodayWorkoutCompleted] = useState(false);
  const [todayMealsLogged, setTodayMealsLogged] = useState<TodayMealsLogged>({
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    meals: [],
  });

  // ==========================================
  // PERSISTENCE
  // ==========================================

  // Load saved state on mount
  useEffect(() => {
    loadSavedState();
  }, []);

  const loadSavedState = async () => {
    try {
      setIsLoading(true);
      
      // Load active program
      const savedProgram = await AsyncStorage.getItem(STORAGE_KEYS.ACTIVE_PROGRAM);
      if (savedProgram) {
        const program = JSON.parse(savedProgram) as CombinedProgram;
        
        // Check if program is still valid (not expired)
        if (new Date(program.endDate) > new Date()) {
          setActiveProgram(program);
        } else {
          // Program expired, move to history
          await moveToHistory(program);
        }
      }
      
      // Load today's tracking (check date first)
      const todayKey = new Date().toISOString().split('T')[0];
      
      const savedWorkout = await AsyncStorage.getItem(`${STORAGE_KEYS.TODAY_WORKOUT_COMPLETED}_${todayKey}`);
      if (savedWorkout) {
        setTodayWorkoutCompleted(JSON.parse(savedWorkout));
      }
      
      const savedMeals = await AsyncStorage.getItem(`${STORAGE_KEYS.TODAY_MEALS_LOGGED}_${todayKey}`);
      if (savedMeals) {
        setTodayMealsLogged(JSON.parse(savedMeals));
      }
      
    } catch (err) {
      console.error('[useCombinedProgram] Error loading saved state:', err);
      setError('Failed to load saved program');
    } finally {
      setIsLoading(false);
    }
  };

  const saveProgram = async (program: CombinedProgram | null) => {
    try {
      if (program) {
        await AsyncStorage.setItem(STORAGE_KEYS.ACTIVE_PROGRAM, JSON.stringify(program));
      } else {
        await AsyncStorage.removeItem(STORAGE_KEYS.ACTIVE_PROGRAM);
      }
    } catch (err) {
      console.error('[useCombinedProgram] Error saving program:', err);
    }
  };

  const moveToHistory = async (program: CombinedProgram) => {
    try {
      const historyJson = await AsyncStorage.getItem(STORAGE_KEYS.PROGRAM_HISTORY);
      const history: CombinedProgram[] = historyJson ? JSON.parse(historyJson) : [];
      
      history.unshift({ ...program, status: 'completed' });
      
      // Keep only last 10 programs
      const trimmedHistory = history.slice(0, 10);
      
      await AsyncStorage.setItem(STORAGE_KEYS.PROGRAM_HISTORY, JSON.stringify(trimmedHistory));
      await AsyncStorage.removeItem(STORAGE_KEYS.ACTIVE_PROGRAM);
    } catch (err) {
      console.error('[useCombinedProgram] Error moving to history:', err);
    }
  };

  const saveTodayTracking = async (workout: boolean, meals: TodayMealsLogged) => {
    try {
      const todayKey = new Date().toISOString().split('T')[0];
      
      await AsyncStorage.setItem(
        `${STORAGE_KEYS.TODAY_WORKOUT_COMPLETED}_${todayKey}`,
        JSON.stringify(workout)
      );
      
      await AsyncStorage.setItem(
        `${STORAGE_KEYS.TODAY_MEALS_LOGGED}_${todayKey}`,
        JSON.stringify(meals)
      );
    } catch (err) {
      console.error('[useCombinedProgram] Error saving daily tracking:', err);
    }
  };

  // ==========================================
  // DASHBOARD
  // ==========================================

  const dashboard = useMemo(() => {
    return combinedProgramService.getDashboardView(
      activeProgram,
      todayWorkoutCompleted,
      todayMealsLogged
    );
  }, [activeProgram, todayWorkoutCompleted, todayMealsLogged]);

  const refreshDashboard = useCallback(() => {
    // Force re-render by updating a state
    setTodayMealsLogged(prev => ({ ...prev }));
  }, []);

  // ==========================================
  // PROGRAM MANAGEMENT
  // ==========================================

  const createProgram = useCallback(async (
    goal: CombinedGoal,
    userProfile: UserProfile,
    options?: CombinedProgramOptions
  ): Promise<CombinedProgram> => {
    try {
      setIsLoading(true);
      setError(null);
      
      // End any existing program
      if (activeProgram) {
        await moveToHistory(activeProgram);
      }
      
      // Create new program
      const program = await combinedProgramService.createCombinedProgram(
        goal,
        userProfile,
        options,
        authToken
      );
      
      setActiveProgram(program);
      await saveProgram(program);
      
      // Reset daily tracking
      setTodayWorkoutCompleted(false);
      setTodayMealsLogged({ calories: 0, protein: 0, carbs: 0, fat: 0, meals: [] });
      await saveTodayTracking(false, { calories: 0, protein: 0, carbs: 0, fat: 0, meals: [] });
      
      return program;
    } catch (err: any) {
      const errorMsg = err?.message || 'Failed to create program';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, [activeProgram, authToken]);

  const pauseProgram = useCallback(async () => {
    if (!activeProgram) return;
    
    const updated: CombinedProgram = {
      ...activeProgram,
      status: 'paused',
      updatedAt: new Date().toISOString(),
    };
    
    setActiveProgram(updated);
    await saveProgram(updated);
  }, [activeProgram]);

  const resumeProgram = useCallback(async () => {
    if (!activeProgram) return;
    
    const updated: CombinedProgram = {
      ...activeProgram,
      status: 'active',
      updatedAt: new Date().toISOString(),
    };
    
    setActiveProgram(updated);
    await saveProgram(updated);
  }, [activeProgram]);

  const endProgram = useCallback(async () => {
    if (!activeProgram) return;
    
    await moveToHistory(activeProgram);
    setActiveProgram(null);
  }, [activeProgram]);

  // ==========================================
  // PREVIEW
  // ==========================================

  const previewConfig = useCallback((
    goal: CombinedGoal,
    userProfile: UserProfile,
    options?: CombinedProgramOptions
  ): CombinedProgramConfig => {
    return combinedProgramService.previewProgramConfig(goal, userProfile, options);
  }, []);

  // ==========================================
  // DAILY TRACKING
  // ==========================================

  const markWorkoutCompleted = useCallback(async (caloriesBurned?: number) => {
    setTodayWorkoutCompleted(true);
    
    // Update program progress
    if (activeProgram) {
      const updated: CombinedProgram = {
        ...activeProgram,
        progress: {
          ...activeProgram.progress,
          workoutsCompleted: activeProgram.progress.workoutsCompleted + 1,
          complianceRate: Math.round(
            ((activeProgram.progress.workoutsCompleted + 1) / activeProgram.progress.workoutsScheduled) * 100
          ),
        },
        updatedAt: new Date().toISOString(),
      };
      
      setActiveProgram(updated);
      await saveProgram(updated);
    }
    
    await saveTodayTracking(true, todayMealsLogged);
  }, [activeProgram, todayMealsLogged]);

  const logMeal = useCallback(async (meal: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    id?: string;
  }) => {
    const updated: TodayMealsLogged = {
      calories: todayMealsLogged.calories + meal.calories,
      protein: todayMealsLogged.protein + meal.protein,
      carbs: todayMealsLogged.carbs + meal.carbs,
      fat: todayMealsLogged.fat + meal.fat,
      meals: meal.id ? [...todayMealsLogged.meals, meal.id] : todayMealsLogged.meals,
    };
    
    setTodayMealsLogged(updated);
    
    // Update program progress
    if (activeProgram) {
      const programUpdate: CombinedProgram = {
        ...activeProgram,
        progress: {
          ...activeProgram.progress,
          mealsLogged: activeProgram.progress.mealsLogged + 1,
        },
        updatedAt: new Date().toISOString(),
      };
      
      setActiveProgram(programUpdate);
      await saveProgram(programUpdate);
    }
    
    await saveTodayTracking(todayWorkoutCompleted, updated);
  }, [activeProgram, todayMealsLogged, todayWorkoutCompleted]);

  const resetDailyTracking = useCallback(async () => {
    setTodayWorkoutCompleted(false);
    setTodayMealsLogged({ calories: 0, protein: 0, carbs: 0, fat: 0, meals: [] });
    
    const todayKey = new Date().toISOString().split('T')[0];
    await AsyncStorage.removeItem(`${STORAGE_KEYS.TODAY_WORKOUT_COMPLETED}_${todayKey}`);
    await AsyncStorage.removeItem(`${STORAGE_KEYS.TODAY_MEALS_LOGGED}_${todayKey}`);
  }, []);

  // ==========================================
  // POST-WORKOUT
  // ==========================================

  const getPostWorkoutMeal = useCallback((
    workout: { type: string; duration: number; caloriesBurned: number; musclesWorked?: string[] },
    userProfile: UserProfile
  ): PostWorkoutCombo => {
    return combinedProgramService.getPostWorkoutMeal(
      workout,
      userProfile,
      activeProgram?.goal
    );
  }, [activeProgram?.goal]);

  // ==========================================
  // UTILITIES
  // ==========================================

  const getAvailableGoals = useCallback(() => {
    return combinedProgramService.getAvailableGoals();
  }, []);

  // ==========================================
  // RETURN
  // ==========================================

  return {
    // State
    activeProgram,
    isLoading,
    error,
    todayWorkoutCompleted,
    todayMealsLogged,
    dashboard,
    
    // Actions
    createProgram,
    pauseProgram,
    resumeProgram,
    endProgram,
    previewConfig,
    markWorkoutCompleted,
    logMeal,
    resetDailyTracking,
    getPostWorkoutMeal,
    refreshDashboard,
    getAvailableGoals,
  };
}

// ============================================
// CONVENIENCE HOOKS
// ============================================

/**
 * Hook for just reading the dashboard view
 */
export function useCombinedDashboard(authToken?: string) {
  const { dashboard, isLoading, error, refreshDashboard } = useCombinedProgram(authToken);
  return { dashboard, isLoading, error, refreshDashboard };
}

/**
 * Hook for goal selection flow
 */
export function useCombinedGoalSelection() {
  const { getAvailableGoals, previewConfig } = useCombinedProgram();
  
  const goals = useMemo(() => getAvailableGoals(), [getAvailableGoals]);
  
  return { goals, previewConfig };
}

/**
 * Hook for daily tracking only
 */
export function useDailyTracking(authToken?: string) {
  const {
    todayWorkoutCompleted,
    todayMealsLogged,
    markWorkoutCompleted,
    logMeal,
    resetDailyTracking,
    dashboard,
  } = useCombinedProgram(authToken);
  
  return {
    todayWorkoutCompleted,
    todayMealsLogged,
    markWorkoutCompleted,
    logMeal,
    resetDailyTracking,
    today: dashboard?.today,
  };
}

export default useCombinedProgram;
