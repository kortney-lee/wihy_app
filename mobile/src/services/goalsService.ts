/**
 * Goals Service
 * 
 * Client for Goals & Milestones API (services.wihy.ai)
 * Handles goal creation, progress logging, and milestone tracking.
 * 
 * Endpoints:
 * - POST   /api/goals                Create goal
 * - GET    /api/goals                List goals
 * - GET    /api/goals/:id            Get goal details
 * - PUT    /api/goals/:id            Update goal
 * - DELETE /api/goals/:id            Delete goal
 * - POST   /api/goals/:id/progress   Log progress
 * - POST   /api/goals/:id/complete   Complete goal
 * - GET    /api/goals/active         Get active goals
 */

import { servicesApi, CachedApiResponse } from './servicesApiClient';
import { storageService } from './storage/storageService';
import {
  Goal,
  Milestone,
  ProgressEntry,
  CreateGoalRequest,
  UpdateGoalRequest,
  LogProgressRequest,
  GoalFilters,
  CreateGoalResponse,
  ListGoalsResponse,
  GetGoalResponse,
  LogProgressResponse,
  DeleteGoalResponse,
  ActiveGoalsResponse,
} from '../types/goals.types';

// ============================================
// CACHE KEYS
// ============================================

const CACHE_KEYS = {
  ALL_GOALS: 'goals_all',
  ACTIVE_GOALS: 'goals_active',
  GOAL_DETAIL: (id: string) => `goal_${id}`,
};

const CACHE_TTL_MINUTES = 5;

// ============================================
// GOALS SERVICE CLASS
// ============================================

class GoalsService {
  private basePath = '/api/goals';

  /**
   * Create a new goal with optional milestones
   */
  async createGoal(goalData: CreateGoalRequest): Promise<CreateGoalResponse> {
    const response = await servicesApi.post<CreateGoalResponse>(
      this.basePath,
      goalData
    );

    // Invalidate cache
    await this.invalidateCache();

    return response;
  }

  /**
   * Get all goals with optional filters
   */
  async getGoals(filters?: GoalFilters): Promise<CachedApiResponse<ListGoalsResponse>> {
    const cacheKey = filters 
      ? `${CACHE_KEYS.ALL_GOALS}_${JSON.stringify(filters)}`
      : CACHE_KEYS.ALL_GOALS;

    return servicesApi.getWithCache<ListGoalsResponse>(
      this.basePath,
      cacheKey,
      CACHE_TTL_MINUTES,
      filters
    );
  }

  /**
   * Get goal by ID with milestones and progress history
   */
  async getGoalById(goalId: string): Promise<CachedApiResponse<GetGoalResponse>> {
    return servicesApi.getWithCache<GetGoalResponse>(
      `${this.basePath}/${goalId}`,
      CACHE_KEYS.GOAL_DETAIL(goalId),
      CACHE_TTL_MINUTES
    );
  }

  /**
   * Update a goal
   */
  async updateGoal(goalId: string, updates: UpdateGoalRequest): Promise<{ goal: Goal }> {
    const response = await servicesApi.put<{ goal: Goal }>(
      `${this.basePath}/${goalId}`,
      updates
    );

    // Invalidate cache
    await this.invalidateCache();
    await storageService.remove(CACHE_KEYS.GOAL_DETAIL(goalId));

    return response;
  }

  /**
   * Delete a goal
   */
  async deleteGoal(goalId: string): Promise<DeleteGoalResponse> {
    const response = await servicesApi.delete<DeleteGoalResponse>(
      `${this.basePath}/${goalId}`
    );

    // Invalidate cache
    await this.invalidateCache();
    await storageService.remove(CACHE_KEYS.GOAL_DETAIL(goalId));

    return response;
  }

  /**
   * Log progress for a goal
   * Also updates current_value and checks milestone achievements
   */
  async logProgress(
    goalId: string,
    progress: LogProgressRequest
  ): Promise<LogProgressResponse> {
    const response = await servicesApi.post<LogProgressResponse>(
      `${this.basePath}/${goalId}/progress`,
      progress
    );

    // Invalidate cache
    await this.invalidateCache();
    await storageService.remove(CACHE_KEYS.GOAL_DETAIL(goalId));

    return response;
  }

  /**
   * Mark a goal as completed
   */
  async completeGoal(goalId: string, notes?: string): Promise<{ goal: Goal }> {
    const response = await servicesApi.post<{ goal: Goal }>(
      `${this.basePath}/${goalId}/complete`,
      { notes }
    );

    // Invalidate cache
    await this.invalidateCache();
    await storageService.remove(CACHE_KEYS.GOAL_DETAIL(goalId));

    return response;
  }

  /**
   * Get all active goals
   */
  async getActiveGoals(): Promise<CachedApiResponse<ActiveGoalsResponse>> {
    return servicesApi.getWithCache<ActiveGoalsResponse>(
      `${this.basePath}/active`,
      CACHE_KEYS.ACTIVE_GOALS,
      CACHE_TTL_MINUTES
    );
  }

  /**
   * Pause a goal
   */
  async pauseGoal(goalId: string): Promise<{ goal: Goal }> {
    return this.updateGoal(goalId, { status: 'paused' });
  }

  /**
   * Resume a paused goal
   */
  async resumeGoal(goalId: string): Promise<{ goal: Goal }> {
    return this.updateGoal(goalId, { status: 'active' });
  }

  /**
   * Calculate progress percentage
   */
  calculateProgress(currentValue: number, targetValue: number, startValue: number): number {
    if (targetValue === startValue) return 0;
    const progress = ((currentValue - startValue) / (targetValue - startValue)) * 100;
    return Math.max(0, Math.min(100, Math.round(progress)));
  }

  /**
   * Check if a milestone is achieved
   */
  isMilestoneAchieved(currentValue: number, milestoneValue: number, isDecreasing: boolean): boolean {
    return isDecreasing
      ? currentValue <= milestoneValue
      : currentValue >= milestoneValue;
  }

  /**
   * Get next upcoming milestone
   */
  getNextMilestone(milestones: Milestone[], currentValue: number, isDecreasing: boolean): Milestone | null {
    const unachieved = milestones
      .filter(m => !m.achieved)
      .sort((a, b) => isDecreasing ? b.value - a.value : a.value - b.value);
    
    return unachieved[0] || null;
  }

  /**
   * Invalidate all goal caches
   */
  private async invalidateCache(): Promise<void> {
    await storageService.remove(CACHE_KEYS.ALL_GOALS);
    await storageService.remove(CACHE_KEYS.ACTIVE_GOALS);
    // Note: Individual goal caches with filters will expire naturally
  }
}

// Export singleton
export const goalsService = new GoalsService();

export default goalsService;
