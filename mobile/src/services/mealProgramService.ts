/**
 * Meal Programs Service
 * 
 * Client service for AI-generated meal plans and meal logging with offline sync.
 * Connects to: /api/meal-programs endpoints on services.wihy.ai
 * 
 * OFFLINE SUPPORT:
 * - Meal programs cached locally
 * - Meal logs stored locally first, synced when online
 * - Supports queued operations when offline
 */

import { storageService } from './storage/storageService';
import { syncEngine } from './sync/syncEngine';
import { connectivityService } from './connectivity/connectivityService';
import { authService } from './authService';
import { fetchWithLogging } from '../utils/apiLogger';

// ============================================
// TYPES - What the backend returns/expects
// ============================================

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface MealsPerDay {
  breakfast: boolean;
  lunch: boolean;
  dinner: boolean;
  snack: boolean;
}

export interface MealProgramDay {
  day: number;
  date?: string;
  meals: {
    breakfast?: ProgramMeal;
    lunch?: ProgramMeal;
    dinner?: ProgramMeal;
    snack?: ProgramMeal;
  };
  totals: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

export interface ProgramMeal {
  name: string;
  description?: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  prepTimeMin?: number;
  cookTimeMin?: number;
  ingredients?: string[];
  instructions?: string[];
  imageUrl?: string;
}

export interface MealProgram {
  id: string;
  userId: string;
  mode: 'plan' | 'track';
  name: string;
  duration: number; // days
  servings: number;
  mealsPerDay: MealsPerDay;
  dietaryRestrictions: string[];
  days: MealProgramDay[];
  createdAt: string;
  updatedAt?: string;
}

export interface MealLog {
  id: string;
  localId?: string; // For offline-first tracking
  userId: string;
  programId?: string;
  mealType: MealType;
  mealName: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  loggedAt: string;
  photoUri?: string;
  notes?: string;
  createdAt: string;
  syncedAt?: string;
  isDirty?: boolean; // True if not synced to server
}

export interface DailyNutritionSummary {
  date: string;
  totals: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber?: number;
    sugar?: number;
  };
  targets?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  mealsLogged: number;
  percentComplete: number;
}

export interface CreateMealProgramRequest {
  mode: 'plan' | 'track';
  duration: number;
  servings: number;
  mealsPerDay: MealsPerDay;
  dietaryRestrictions?: string[];
  calorieTarget?: number;
  proteinTarget?: number;
  preferences?: {
    cuisines?: string[];
    excludeIngredients?: string[];
    prepTimeMax?: number;
  };
}

export interface LogMealRequest {
  programId?: string;
  mealType: MealType;
  mealName: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  loggedAt?: string; // ISO string, defaults to now
  photoUri?: string;
  notes?: string;
}

// ============================================
// CACHE CONFIGURATION
// ============================================

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://services.wihy.ai';

const CACHE_KEY_PROGRAMS = 'meal_programs';
const CACHE_KEY_LOGS = 'meal_logs';
const CACHE_KEY_TODAY_SUMMARY = 'meal_today_summary';
const CACHE_TTL_PROGRAMS = 60 * 60 * 1000; // 1 hour
const CACHE_TTL_LOGS = 5 * 60 * 1000; // 5 minutes
const CACHE_TTL_SUMMARY = 2 * 60 * 1000; // 2 minutes

// ============================================
// SERVICE IMPLEMENTATION
// ============================================

class MealProgramService {
  private baseUrl = `${API_BASE_URL}/api/meal-programs`;

  /**
   * Get authorization headers
   */
  private async getAuthHeaders(): Promise<HeadersInit> {
    const token = await authService.getAccessToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  // ==========================================
  // MEAL PROGRAMS
  // ==========================================

  /**
   * Get user's meal programs
   * Cached locally for offline access
   */
  async getMealPrograms(): Promise<MealProgram[]> {
    // Check cache first
    const cached = await storageService.get<MealProgram[]>(CACHE_KEY_PROGRAMS);
    const isOnline = await connectivityService.isOnline();

    if (!isOnline && cached) {
      return cached;
    }

    try {
      const headers = await this.getAuthHeaders();
      const response = await fetchWithLogging(this.baseUrl, {
        method: 'GET',
        headers,
      });

      const data = await response.json();

      if (data.success && data.programs) {
        // Cache the programs
        await storageService.setCachedWithExpiry(CACHE_KEY_PROGRAMS, data.programs, CACHE_TTL_PROGRAMS);
        return data.programs;
      }

      // Return cached on API error
      return cached || [];
    } catch (error) {
      console.error('[MealProgramService] Error fetching programs:', error);
      return cached || [];
    }
  }

  /**
   * Create a new meal program (AI-generated)
   * Returns immediately if offline, queues for sync
   */
  async createMealProgram(request: CreateMealProgramRequest): Promise<MealProgram | null> {
    const isOnline = await connectivityService.isOnline();

    if (!isOnline) {
      // Queue for later sync
      await syncEngine.enqueue({
        operation: 'create',
        endpoint: this.baseUrl,
        payload: request,
        priority: 'normal',
      });
      
      // Return a placeholder program
      const placeholder: MealProgram = {
        id: `local_${Date.now()}`,
        userId: '',
        mode: request.mode,
        name: `${request.mode === 'plan' ? 'Meal Plan' : 'Tracking'} - Pending Sync`,
        duration: request.duration,
        servings: request.servings,
        mealsPerDay: request.mealsPerDay,
        dietaryRestrictions: request.dietaryRestrictions || [],
        days: [],
        createdAt: new Date().toISOString(),
      };
      
      return placeholder;
    }

    try {
      const headers = await this.getAuthHeaders();
      const response = await fetchWithLogging(this.baseUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(request),
      });

      const data = await response.json();

      if (data.success && data.program) {
        // Invalidate programs cache
        await storageService.remove(CACHE_KEY_PROGRAMS);
        return data.program;
      }

      throw new Error(data.error || 'Failed to create meal program');
    } catch (error) {
      console.error('[MealProgramService] Error creating program:', error);
      throw error;
    }
  }

  /**
   * Get a specific meal program by ID
   */
  async getMealProgram(programId: string): Promise<MealProgram | null> {
    // Check cache first
    const cached = await storageService.get<MealProgram[]>(CACHE_KEY_PROGRAMS);
    const cachedProgram = cached?.find(p => p.id === programId);

    const isOnline = await connectivityService.isOnline();
    if (!isOnline && cachedProgram) {
      return cachedProgram;
    }

    try {
      const headers = await this.getAuthHeaders();
      const response = await fetchWithLogging(`${this.baseUrl}/${programId}`, {
        method: 'GET',
        headers,
      });

      const data = await response.json();

      if (data.success && data.program) {
        return data.program;
      }

      return cachedProgram || null;
    } catch (error) {
      console.error('[MealProgramService] Error fetching program:', error);
      return cachedProgram || null;
    }
  }

  // ==========================================
  // MEAL LOGGING
  // ==========================================

  /**
   * Log a meal
   * Stores locally first for offline support, syncs when online
   */
  async logMeal(request: LogMealRequest): Promise<MealLog> {
    const localId = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    const localLog: MealLog = {
      id: localId,
      localId,
      userId: '',
      programId: request.programId,
      mealType: request.mealType,
      mealName: request.mealName,
      calories: request.calories,
      protein: request.protein,
      carbs: request.carbs,
      fat: request.fat,
      fiber: request.fiber,
      sugar: request.sugar,
      sodium: request.sodium,
      loggedAt: request.loggedAt || now,
      photoUri: request.photoUri,
      notes: request.notes,
      createdAt: now,
      isDirty: true,
    };

    // Store locally first
    await this.saveLogLocally(localLog);

    // Invalidate today's summary cache
    await storageService.remove(CACHE_KEY_TODAY_SUMMARY);

    const isOnline = await connectivityService.isOnline();

    if (!isOnline) {
      // Queue for sync
      await syncEngine.enqueue({
        operation: 'create',
        endpoint: `${this.baseUrl}/logs`,
        payload: request,
        localId,
        priority: 'high',
      });
      
      return localLog;
    }

    // Try to sync immediately
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetchWithLogging(`${this.baseUrl}/logs`, {
        method: 'POST',
        headers,
        body: JSON.stringify(request),
      });

      const data = await response.json();

      if (data.success && data.log) {
        // Update local log with server ID
        const syncedLog: MealLog = {
          ...data.log,
          localId,
          isDirty: false,
          syncedAt: now,
        };
        await this.updateLogLocally(localId, syncedLog);
        return syncedLog;
      }

      throw new Error(data.error || 'Failed to log meal');
    } catch (error) {
      console.error('[MealProgramService] Error logging meal:', error);
      // Return local log - will sync later
      return localLog;
    }
  }

  /**
   * Get meal logs for a date range
   */
  async getMealLogs(startDate: string, endDate?: string): Promise<MealLog[]> {
    const cacheKey = `${CACHE_KEY_LOGS}_${startDate}_${endDate || 'now'}`;
    
    // Get local logs first (includes unsynced)
    const localLogs = await this.getLocalLogs(startDate, endDate);
    
    const isOnline = await connectivityService.isOnline();
    if (!isOnline) {
      return localLogs;
    }

    try {
      const headers = await this.getAuthHeaders();
      const params = new URLSearchParams({ startDate });
      if (endDate) params.append('endDate', endDate);

      const response = await fetchWithLogging(`${this.baseUrl}/logs?${params}`, {
        method: 'GET',
        headers,
      });

      const data = await response.json();

      if (data.success && data.logs) {
        // Merge server logs with unsynced local logs
        const serverLogs = data.logs as MealLog[];
        const unsyncedLogs = localLogs.filter(l => l.isDirty);
        
        // Deduplicate by ID
        const mergedLogs = [...serverLogs];
        for (const unsyncedLog of unsyncedLogs) {
          if (!mergedLogs.find(l => l.id === unsyncedLog.id || l.id === unsyncedLog.localId)) {
            mergedLogs.push(unsyncedLog);
          }
        }

        // Sort by loggedAt descending
        mergedLogs.sort((a, b) => 
          new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime()
        );

        // Cache merged result
        await storageService.setCachedWithExpiry(cacheKey, mergedLogs, CACHE_TTL_LOGS);
        
        return mergedLogs;
      }

      return localLogs;
    } catch (error) {
      console.error('[MealProgramService] Error fetching meal logs:', error);
      return localLogs;
    }
  }

  /**
   * Get today's nutrition summary
   */
  async getTodaysSummary(): Promise<DailyNutritionSummary> {
    // Check cache
    const cached = await storageService.get<DailyNutritionSummary>(CACHE_KEY_TODAY_SUMMARY);
    
    const isOnline = await connectivityService.isOnline();
    if (!isOnline && cached) {
      return cached;
    }

    try {
      const headers = await this.getAuthHeaders();
      const response = await fetchWithLogging(`${this.baseUrl}/logs/today`, {
        method: 'GET',
        headers,
      });

      const data = await response.json();

      if (data.success && data.summary) {
        await storageService.setCachedWithExpiry(CACHE_KEY_TODAY_SUMMARY, data.summary, CACHE_TTL_SUMMARY);
        return data.summary;
      }

      // Calculate from local logs if API fails
      return cached || this.calculateLocalSummary();
    } catch (error) {
      console.error('[MealProgramService] Error fetching today summary:', error);
      return cached || this.calculateLocalSummary();
    }
  }

  // ==========================================
  // LOCAL STORAGE HELPERS
  // ==========================================

  private async saveLogLocally(log: MealLog): Promise<void> {
    const logs = await this.getAllLocalLogs();
    logs.push(log);
    await storageService.set('meal_logs_local', logs);
  }

  private async updateLogLocally(localId: string, updatedLog: MealLog): Promise<void> {
    const logs = await this.getAllLocalLogs();
    const index = logs.findIndex(l => l.localId === localId || l.id === localId);
    if (index >= 0) {
      logs[index] = updatedLog;
      await storageService.set('meal_logs_local', logs);
    }
  }

  private async getAllLocalLogs(): Promise<MealLog[]> {
    return await storageService.get<MealLog[]>('meal_logs_local') || [];
  }

  private async getLocalLogs(startDate: string, endDate?: string): Promise<MealLog[]> {
    const allLogs = await this.getAllLocalLogs();
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();

    return allLogs.filter(log => {
      const logDate = new Date(log.loggedAt);
      return logDate >= start && logDate <= end;
    });
  }

  private async calculateLocalSummary(): Promise<DailyNutritionSummary> {
    const today = new Date().toISOString().split('T')[0];
    const logs = await this.getLocalLogs(today);

    const totals = logs.reduce(
      (acc, log) => ({
        calories: acc.calories + log.calories,
        protein: acc.protein + log.protein,
        carbs: acc.carbs + log.carbs,
        fat: acc.fat + log.fat,
        fiber: acc.fiber + (log.fiber || 0),
        sugar: acc.sugar + (log.sugar || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0 }
    );

    return {
      date: today,
      totals,
      mealsLogged: logs.length,
      percentComplete: Math.min(100, Math.round((totals.calories / 2000) * 100)),
    };
  }

  // ==========================================
  // SYNC HELPERS
  // ==========================================

  /**
   * Get unsynced meal logs
   */
  async getUnsyncedLogs(): Promise<MealLog[]> {
    const allLogs = await this.getAllLocalLogs();
    return allLogs.filter(log => log.isDirty);
  }

  /**
   * Mark a log as synced
   */
  async markLogSynced(localId: string, serverId: string): Promise<void> {
    const logs = await this.getAllLocalLogs();
    const index = logs.findIndex(l => l.localId === localId);
    if (index >= 0) {
      logs[index] = {
        ...logs[index],
        id: serverId,
        isDirty: false,
        syncedAt: new Date().toISOString(),
      };
      await storageService.set('meal_logs_local', logs);
    }
  }

  /**
   * Clear local cache (for logout/testing)
   */
  async clearLocalData(): Promise<void> {
    await storageService.remove(CACHE_KEY_PROGRAMS);
    await storageService.remove(CACHE_KEY_LOGS);
    await storageService.remove(CACHE_KEY_TODAY_SUMMARY);
    await storageService.remove('meal_logs_local');
  }
}

// Export singleton instance
export const mealProgramService = new MealProgramService();
export default mealProgramService;
