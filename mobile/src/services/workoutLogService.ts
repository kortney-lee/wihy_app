/**
 * Workout Log Service
 * 
 * Client service for workout tracking and history with offline sync.
 * Connects to: /api/workout-logs endpoints on services.wihy.ai
 * 
 * OFFLINE SUPPORT:
 * - Workout logs stored locally first, synced when online
 * - Summaries cached for offline access
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

export interface Exercise {
  name: string;
  sets?: number;
  reps?: number;
  weight?: number;
  weightUnit?: 'lb' | 'kg';
  durationMin?: number;
  distance?: number;
  distanceUnit?: 'mi' | 'km';
  notes?: string;
}

export interface WorkoutLog {
  id: string;
  localId?: string; // For offline-first tracking
  userId: string;
  workoutId?: string; // Reference to workout program if applicable
  workoutName: string;
  workoutType?: 'strength' | 'cardio' | 'hiit' | 'flexibility' | 'sports' | 'other';
  durationMin: number;
  caloriesBurned?: number;
  exercises: Exercise[];
  completedAt: string;
  notes?: string;
  heartRateAvg?: number;
  heartRateMax?: number;
  location?: string;
  createdAt: string;
  syncedAt?: string;
  isDirty?: boolean; // True if not synced to server
}

export interface WorkoutSummary {
  period: 'today' | 'week' | 'month';
  startDate: string;
  endDate: string;
  totalWorkouts: number;
  totalDurationMin: number;
  totalCaloriesBurned: number;
  avgDurationMin: number;
  avgCaloriesBurned: number;
  workoutsByType: Record<string, number>;
  streak: number;
  longestStreak: number;
  mostFrequentExercises: Array<{
    name: string;
    count: number;
  }>;
}

export interface LogWorkoutRequest {
  workoutId?: string;
  workoutName: string;
  workoutType?: 'strength' | 'cardio' | 'hiit' | 'flexibility' | 'sports' | 'other';
  durationMin: number;
  caloriesBurned?: number;
  exercises: Exercise[];
  completedAt?: string; // ISO string, defaults to now
  notes?: string;
  heartRateAvg?: number;
  heartRateMax?: number;
  location?: string;
}

// ============================================
// CACHE CONFIGURATION
// ============================================

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://services.wihy.ai';

const CACHE_KEY_LOGS = 'workout_logs';
const CACHE_KEY_SUMMARY = 'workout_summary';
const CACHE_TTL_LOGS = 5 * 60 * 1000; // 5 minutes
const CACHE_TTL_SUMMARY = 5 * 60 * 1000; // 5 minutes

// ============================================
// SERVICE IMPLEMENTATION
// ============================================

class WorkoutLogService {
  private baseUrl = `${API_BASE_URL}/api/workout-logs`;

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
  // WORKOUT LOGGING
  // ==========================================

  /**
   * Log a workout
   * Stores locally first for offline support, syncs when online
   */
  async logWorkout(request: LogWorkoutRequest): Promise<WorkoutLog> {
    const localId = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    const localLog: WorkoutLog = {
      id: localId,
      localId,
      userId: '',
      workoutId: request.workoutId,
      workoutName: request.workoutName,
      workoutType: request.workoutType,
      durationMin: request.durationMin,
      caloriesBurned: request.caloriesBurned,
      exercises: request.exercises,
      completedAt: request.completedAt || now,
      notes: request.notes,
      heartRateAvg: request.heartRateAvg,
      heartRateMax: request.heartRateMax,
      location: request.location,
      createdAt: now,
      isDirty: true,
    };

    // Store locally first
    await this.saveLogLocally(localLog);

    // Invalidate summary cache
    await storageService.remove(CACHE_KEY_SUMMARY);

    const isOnline = await connectivityService.isOnline();

    if (!isOnline) {
      // Queue for sync
      await syncEngine.enqueue({
        operation: 'create',
        endpoint: this.baseUrl,
        payload: request,
        localId,
        priority: 'high',
      });
      
      return localLog;
    }

    // Try to sync immediately
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetchWithLogging(this.baseUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(request),
      });

      const data = await response.json();

      if (data.success && data.log) {
        // Update local log with server ID
        const syncedLog: WorkoutLog = {
          ...data.log,
          localId,
          isDirty: false,
          syncedAt: now,
        };
        await this.updateLogLocally(localId, syncedLog);
        return syncedLog;
      }

      throw new Error(data.error || 'Failed to log workout');
    } catch (error) {
      console.error('[WorkoutLogService] Error logging workout:', error);
      // Return local log - will sync later
      return localLog;
    }
  }

  /**
   * Get workout logs for a date range
   */
  async getWorkoutLogs(startDate: string, endDate?: string): Promise<WorkoutLog[]> {
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

      const response = await fetchWithLogging(`${this.baseUrl}?${params}`, {
        method: 'GET',
        headers,
      });

      const data = await response.json();

      if (data.success && data.logs) {
        // Merge server logs with unsynced local logs
        const serverLogs = data.logs as WorkoutLog[];
        const unsyncedLogs = localLogs.filter(l => l.isDirty);
        
        // Deduplicate by ID
        const mergedLogs = [...serverLogs];
        for (const unsyncedLog of unsyncedLogs) {
          if (!mergedLogs.find(l => l.id === unsyncedLog.id || l.id === unsyncedLog.localId)) {
            mergedLogs.push(unsyncedLog);
          }
        }

        // Sort by completedAt descending
        mergedLogs.sort((a, b) => 
          new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
        );

        // Cache merged result
        await storageService.setCachedWithExpiry(cacheKey, mergedLogs, CACHE_TTL_LOGS);
        
        return mergedLogs;
      }

      return localLogs;
    } catch (error) {
      console.error('[WorkoutLogService] Error fetching workout logs:', error);
      return localLogs;
    }
  }

  /**
   * Get workout summary for a period
   */
  async getWorkoutSummary(period: 'today' | 'week' | 'month' = 'week'): Promise<WorkoutSummary> {
    const cacheKey = `${CACHE_KEY_SUMMARY}_${period}`;
    
    // Check cache
    const cached = await storageService.get<WorkoutSummary>(cacheKey);
    
    const isOnline = await connectivityService.isOnline();
    if (!isOnline && cached) {
      return cached;
    }

    try {
      const headers = await this.getAuthHeaders();
      const response = await fetchWithLogging(`${this.baseUrl}/summary?period=${period}`, {
        method: 'GET',
        headers,
      });

      const data = await response.json();

      if (data.success && data.summary) {
        await storageService.setCachedWithExpiry(cacheKey, data.summary, CACHE_TTL_SUMMARY);
        return data.summary;
      }

      // Calculate from local logs if API fails
      return cached || this.calculateLocalSummary(period);
    } catch (error) {
      console.error('[WorkoutLogService] Error fetching workout summary:', error);
      return cached || this.calculateLocalSummary(period);
    }
  }

  /**
   * Get today's workouts
   */
  async getTodaysWorkouts(): Promise<WorkoutLog[]> {
    const today = new Date().toISOString().split('T')[0];
    return this.getWorkoutLogs(today);
  }

  /**
   * Get this week's workouts
   */
  async getThisWeeksWorkouts(): Promise<WorkoutLog[]> {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    
    return this.getWorkoutLogs(startOfWeek.toISOString().split('T')[0]);
  }

  // ==========================================
  // LOCAL STORAGE HELPERS
  // ==========================================

  private async saveLogLocally(log: WorkoutLog): Promise<void> {
    const logs = await this.getAllLocalLogs();
    logs.push(log);
    await storageService.set('workout_logs_local', logs);
  }

  private async updateLogLocally(localId: string, updatedLog: WorkoutLog): Promise<void> {
    const logs = await this.getAllLocalLogs();
    const index = logs.findIndex(l => l.localId === localId || l.id === localId);
    if (index >= 0) {
      logs[index] = updatedLog;
      await storageService.set('workout_logs_local', logs);
    }
  }

  private async getAllLocalLogs(): Promise<WorkoutLog[]> {
    return await storageService.get<WorkoutLog[]>('workout_logs_local') || [];
  }

  private async getLocalLogs(startDate: string, endDate?: string): Promise<WorkoutLog[]> {
    const allLogs = await this.getAllLocalLogs();
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();

    return allLogs.filter(log => {
      const logDate = new Date(log.completedAt);
      return logDate >= start && logDate <= end;
    });
  }

  private async calculateLocalSummary(period: 'today' | 'week' | 'month'): Promise<WorkoutSummary> {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'today':
        startDate = new Date(now.toISOString().split('T')[0]);
        break;
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 1);
        break;
    }

    const logs = await this.getLocalLogs(startDate.toISOString().split('T')[0]);

    const totalDurationMin = logs.reduce((sum, log) => sum + log.durationMin, 0);
    const totalCaloriesBurned = logs.reduce((sum, log) => sum + (log.caloriesBurned || 0), 0);
    
    const workoutsByType: Record<string, number> = {};
    const exerciseCounts: Record<string, number> = {};

    for (const log of logs) {
      const type = log.workoutType || 'other';
      workoutsByType[type] = (workoutsByType[type] || 0) + 1;
      
      for (const exercise of log.exercises) {
        exerciseCounts[exercise.name] = (exerciseCounts[exercise.name] || 0) + 1;
      }
    }

    const mostFrequentExercises = Object.entries(exerciseCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      period,
      startDate: startDate.toISOString(),
      endDate: now.toISOString(),
      totalWorkouts: logs.length,
      totalDurationMin,
      totalCaloriesBurned,
      avgDurationMin: logs.length > 0 ? Math.round(totalDurationMin / logs.length) : 0,
      avgCaloriesBurned: logs.length > 0 ? Math.round(totalCaloriesBurned / logs.length) : 0,
      workoutsByType,
      streak: this.calculateStreak(logs),
      longestStreak: this.calculateStreak(logs), // Simplified - would need full history
      mostFrequentExercises,
    };
  }

  private calculateStreak(logs: WorkoutLog[]): number {
    if (logs.length === 0) return 0;

    // Sort by date descending
    const sortedLogs = [...logs].sort((a, b) => 
      new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
    );

    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    const workoutDates = new Set(
      sortedLogs.map(log => new Date(log.completedAt).toISOString().split('T')[0])
    );

    // Check if worked out today or yesterday to start streak
    const today = currentDate.toISOString().split('T')[0];
    const yesterday = new Date(currentDate);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (!workoutDates.has(today) && !workoutDates.has(yesterdayStr)) {
      return 0;
    }

    // Count consecutive days
    const checkDate = workoutDates.has(today) ? new Date(today) : new Date(yesterdayStr);
    
    while (workoutDates.has(checkDate.toISOString().split('T')[0])) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    }

    return streak;
  }

  // ==========================================
  // SYNC HELPERS
  // ==========================================

  /**
   * Get unsynced workout logs
   */
  async getUnsyncedLogs(): Promise<WorkoutLog[]> {
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
      await storageService.set('workout_logs_local', logs);
    }
  }

  /**
   * Delete a workout log
   */
  async deleteWorkoutLog(logId: string): Promise<void> {
    // Remove from local storage
    const logs = await this.getAllLocalLogs();
    const filteredLogs = logs.filter(l => l.id !== logId && l.localId !== logId);
    await storageService.set('workout_logs_local', filteredLogs);

    // Invalidate cache
    await storageService.remove(CACHE_KEY_SUMMARY);

    const isOnline = await connectivityService.isOnline();
    if (!isOnline) {
      // Queue delete operation
      await syncEngine.enqueue({
        operation: 'delete',
        endpoint: `${this.baseUrl}/${logId}`,
        payload: { id: logId },
        priority: 'normal',
      });
      return;
    }

    // Delete from server
    try {
      const headers = await this.getAuthHeaders();
      await fetchWithLogging(`${this.baseUrl}/${logId}`, {
        method: 'DELETE',
        headers,
      });
    } catch (error) {
      console.error('[WorkoutLogService] Error deleting workout:', error);
      // Queued locally, will retry on next sync
    }
  }

  /**
   * Clear local cache (for logout/testing)
   */
  async clearLocalData(): Promise<void> {
    await storageService.remove(CACHE_KEY_LOGS);
    await storageService.remove(CACHE_KEY_SUMMARY);
    await storageService.remove('workout_logs_local');
  }
}

// Export singleton instance
export const workoutLogService = new WorkoutLogService();
export default workoutLogService;
