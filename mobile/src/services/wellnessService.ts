/**
 * Wellness Service
 * 
 * Manages wellness logs, daily health metrics, and wellness summaries.
 * 
 * Base URL: https://user.wihy.ai
 * Endpoints: /api/wellness/*
 */

import { userApi } from './userApiClient';
import {
  WellnessLog,
  WellnessSummary,
  WellnessSummaryResponse,
  ApiResponse,
} from '../types/api';

const WELLNESS_ENDPOINTS = {
  logs: '/api/wellness/logs',
  summary: (userId: string) => `/api/wellness/summary/${userId}`,
  userLogs: (userId: string) => `/api/wellness/logs/${userId}`,
  deleteLog: (userId: string, date: string) => `/api/wellness/logs/${userId}/${date}`,
};

// ============================================
// WELLNESS SERVICE CLASS
// ============================================

class WellnessService {
  /**
   * Submit daily wellness data
   * 
   * @param log - Wellness log data
   * @returns Success response with saved log
   * 
   * @example
   * ```ts
   * const result = await wellnessService.logWellness({
   *   userId: 'user-uuid',
   *   date: '2026-01-25',
   *   sleepHours: 7.5,
   *   steps: 8500,
   *   mood: 4,
   *   hydrationCups: 8,
   *   weightKg: 75.5
   * });
   * ```
   */
  async logWellness(log: WellnessLog): Promise<ApiResponse<WellnessLog>> {
    try {
      const response = await userApi.post<ApiResponse<WellnessLog>>(
        WELLNESS_ENDPOINTS.logs,
        log
      );
      return response;
    } catch (error: any) {
      console.error('[WellnessService] Error logging wellness:', error);
      return {
        success: false,
        error: error.message || 'Failed to log wellness data',
      };
    }
  }

  /**
   * Get computed wellness summary from recent logs
   * 
   * @param userId - User ID
   * @param days - Number of days to analyze (default: 7)
   * @returns Wellness summary with scores and recommendations
   * 
   * @example
   * ```ts
   * const summary = await wellnessService.getWellnessSummary('user-uuid', 7);
   * console.log('Overall Score:', summary.summary.overallScore);
   * console.log('Risk Level:', summary.summary.riskLevel);
   * ```
   */
  async getWellnessSummary(
    userId: string,
    days: number = 7
  ): Promise<WellnessSummaryResponse> {
    try {
      const response = await userApi.get<WellnessSummaryResponse>(
        WELLNESS_ENDPOINTS.summary(userId),
        { days: days.toString() }
      );
      return response;
    } catch (error: any) {
      console.error('[WellnessService] Error fetching wellness summary:', error);
      return {
        success: false,
        summary: {
          overallScore: 0,
          riskLevel: 'medium',
          metrics: {},
          recommendations: [],
        },
        logsAnalyzed: 0,
        dateRange: {
          from: '',
          to: '',
        },
      };
    }
  }

  /**
   * Get all wellness logs for a user
   * 
   * @param userId - User ID
   * @param limit - Maximum number of logs to retrieve (default: 30)
   * @returns List of wellness logs
   * 
   * @example
   * ```ts
   * const logs = await wellnessService.getUserLogs('user-uuid', 14);
   * console.log(`Retrieved ${logs.count} logs`);
   * ```
   */
  async getUserLogs(
    userId: string,
    limit: number = 30
  ): Promise<ApiResponse<WellnessLog[]>> {
    try {
      const response = await userApi.get<ApiResponse<WellnessLog[]>>(
        WELLNESS_ENDPOINTS.userLogs(userId),
        { limit: limit.toString() }
      );
      return response;
    } catch (error: any) {
      console.error('[WellnessService] Error fetching wellness logs:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch wellness logs',
        data: [],
        count: 0,
      };
    }
  }

  /**
   * Delete a specific wellness log
   * 
   * @param userId - User ID
   * @param date - Date of log to delete (YYYY-MM-DD)
   * @returns Success response
   * 
   * @example
   * ```ts
   * await wellnessService.deleteLog('user-uuid', '2026-01-25');
   * ```
   */
  async deleteLog(userId: string, date: string): Promise<ApiResponse<void>> {
    try {
      const response = await userApi.delete<ApiResponse<void>>(
        WELLNESS_ENDPOINTS.deleteLog(userId, date)
      );
      return response;
    } catch (error: any) {
      console.error('[WellnessService] Error deleting wellness log:', error);
      return {
        success: false,
        error: error.message || 'Failed to delete wellness log',
      };
    }
  }

  /**
   * Get wellness log for a specific date
   * 
   * @param userId - User ID
   * @param date - Date of log (YYYY-MM-DD)
   * @returns Wellness log for the specified date
   */
  async getLogForDate(userId: string, date: string): Promise<ApiResponse<WellnessLog>> {
    try {
      const response = await this.getUserLogs(userId, 1);
      
      if (response.success && response.data) {
        const log = response.data.find((l: WellnessLog) => l.date === date);
        if (log) {
          return {
            success: true,
            data: log,
          };
        }
      }
      
      return {
        success: false,
        error: 'No log found for this date',
      };
    } catch (error: any) {
      console.error('[WellnessService] Error fetching log for date:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch wellness log',
      };
    }
  }

  /**
   * Update wellness log for a specific date
   * 
   * @param log - Updated wellness log data
   * @returns Success response
   */
  async updateLog(log: WellnessLog): Promise<ApiResponse<WellnessLog>> {
    // API uses POST for both create and update
    return this.logWellness(log);
  }

  /**
   * Get wellness trends over time
   * 
   * @param userId - User ID
   * @param days - Number of days to analyze
   * @returns Wellness logs and calculated trends
   */
  async getWellnessTrends(
    userId: string,
    days: number = 30
  ): Promise<{
    success: boolean;
    logs: WellnessLog[];
    trends: {
      sleepAverage: number;
      stepsAverage: number;
      moodAverage: number;
      hydrationAverage: number;
      weightChange: number;
    };
  }> {
    try {
      const response = await this.getUserLogs(userId, days);
      
      if (!response.success || !response.data || response.data.length === 0) {
        return {
          success: false,
          logs: [],
          trends: {
            sleepAverage: 0,
            stepsAverage: 0,
            moodAverage: 0,
            hydrationAverage: 0,
            weightChange: 0,
          },
        };
      }

      const logs = response.data;
      const count = logs.length;

      // Calculate averages
      const sleepAverage = logs.reduce((sum, log) => sum + (log.sleepHours || 0), 0) / count;
      const stepsAverage = logs.reduce((sum, log) => sum + (log.steps || 0), 0) / count;
      const moodAverage = logs.reduce((sum, log) => sum + (log.mood || 0), 0) / count;
      const hydrationAverage = logs.reduce((sum, log) => sum + (log.hydrationCups || 0), 0) / count;

      // Calculate weight change
      const firstWeight = logs[logs.length - 1]?.weightKg || 0;
      const lastWeight = logs[0]?.weightKg || 0;
      const weightChange = lastWeight - firstWeight;

      return {
        success: true,
        logs,
        trends: {
          sleepAverage: Math.round(sleepAverage * 10) / 10,
          stepsAverage: Math.round(stepsAverage),
          moodAverage: Math.round(moodAverage * 10) / 10,
          hydrationAverage: Math.round(hydrationAverage * 10) / 10,
          weightChange: Math.round(weightChange * 10) / 10,
        },
      };
    } catch (error: any) {
      console.error('[WellnessService] Error calculating wellness trends:', error);
      return {
        success: false,
        logs: [],
        trends: {
          sleepAverage: 0,
          stepsAverage: 0,
          moodAverage: 0,
          hydrationAverage: 0,
          weightChange: 0,
        },
      };
    }
  }

  /**
   * Check if user has logged wellness data today
   * 
   * @param userId - User ID
   * @returns True if log exists for today
   */
  async hasLoggedToday(userId: string): Promise<boolean> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await this.getLogForDate(userId, today);
      return response.success;
    } catch (error) {
      console.error('[WellnessService] Error checking today log:', error);
      return false;
    }
  }

  /**
   * Get current wellness streak (consecutive days with logs)
   * 
   * @param userId - User ID
   * @returns Number of consecutive days
   */
  async getWellnessStreak(userId: string): Promise<number> {
    try {
      const response = await this.getUserLogs(userId, 90);
      
      if (!response.success || !response.data || response.data.length === 0) {
        return 0;
      }

      const logs = response.data.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      let streak = 0;
      let currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0);

      for (const log of logs) {
        const logDate = new Date(log.date);
        logDate.setHours(0, 0, 0, 0);

        const daysDiff = Math.floor(
          (currentDate.getTime() - logDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysDiff === streak) {
          streak++;
          currentDate = logDate;
        } else {
          break;
        }
      }

      return streak;
    } catch (error) {
      console.error('[WellnessService] Error calculating wellness streak:', error);
      return 0;
    }
  }
}

// Export singleton instance
export const wellnessService = new WellnessService();
export { WellnessService };
