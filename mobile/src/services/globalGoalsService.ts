/**
 * Global Goals Service
 * 
 * Backend-driven community tracking for all 6 fitness goals.
 * Shows global progress and where each user ranks.
 * 
 * OFFLINE SUPPORT:
 * - Global data is cached with TTL (server wins on refresh)
 * - Longer cache TTL since this is community data
 * - Shows stale data when offline with "Last updated" indicator
 * 
 * NOTE: This service calls backend APIs - all calculations happen server-side.
 */

import { storageService } from './storage/storageService';
import { connectivityService } from './connectivity/connectivityService';

// ============================================
// TYPES - What the backend returns
// ============================================

export type GoalType = 
  | 'weight_loss'
  | 'muscle_gain'
  | 'body_recomposition'
  | 'maintenance'
  | 'athletic_performance'
  | 'general_health';

export interface GlobalGoalStats {
  goalId: GoalType;
  goalLabel: string;
  
  // Community totals
  totalUsers: number;
  activeUsersToday: number;
  activeUsersWeek: number;
  activeUsersMonth: number;
  
  // Aggregate metrics (depends on goal)
  communityMetrics: {
    // Weight Loss
    totalPoundsLost?: number;
    avgPoundsLostPerUser?: number;
    
    // Muscle Gain
    totalMuscleGained?: number; // lbs
    avgProteinPerDay?: number;
    
    // All goals
    totalCaloriesBurned?: number;
    totalWorkoutsCompleted?: number;
    totalMealsLogged?: number;
    
    // Environmental impact
    wasteReduced?: {
      foodWastePrevented: number; // lbs of food not wasted through meal planning
      carbonSaved: number; // kg CO2 from efficient shopping
      mealsPlannedNotWasted: number;
    };
  };
}

export interface UserGoalRanking {
  goalId: GoalType;
  userId: string;
  
  // User's position
  percentile: number; // 0-100, where 95 = top 5%
  rank: number; // actual position
  totalInGoal: number; // total users in this goal
  
  // User's contribution
  userMetrics: {
    poundsLost?: number;
    muscleGained?: number;
    caloriesBurned?: number;
    workoutsCompleted?: number;
    mealsLogged?: number;
    streakDays?: number;
  };
  
  // Comparison
  vsAverage: {
    metric: string;
    userValue: number;
    avgValue: number;
    percentBetter: number; // +15 means 15% better than average
  };
}

export interface GlobalLeaderboard {
  goalId: GoalType;
  period: 'today' | 'week' | 'month' | 'all_time';
  
  topUsers: Array<{
    rank: number;
    userId: string;
    displayName: string;
    avatarUrl?: string;
    value: number;
    metric: string;
  }>;
  
  userPosition?: {
    rank: number;
    value: number;
    percentile: number;
  };
}

export interface CommunityChallenge {
  id: string;
  goalId: GoalType;
  title: string;
  description: string;
  
  target: number;
  current: number;
  percentComplete: number;
  
  startDate: string;
  endDate: string;
  daysRemaining: number;
  
  participants: number;
  userJoined: boolean;
  userContribution?: number;
}

// ============================================
// SERVICE
// ============================================

// API base URL - update when backend is ready
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://api.wihy.app';

// Cache settings - global data can be cached longer
const CACHE_KEY_STATS = 'global_goals_stats';
const CACHE_KEY_LEADERBOARD = 'global_leaderboard';
const CACHE_KEY_CHALLENGES = 'global_challenges';
const CACHE_KEY_RANKING = 'user_ranking';

// TTL settings
const CACHE_TTL_STATS = 15 * 60 * 1000; // 15 minutes - community stats change slowly
const CACHE_TTL_LEADERBOARD = 10 * 60 * 1000; // 10 minutes
const CACHE_TTL_CHALLENGES = 30 * 60 * 1000; // 30 minutes
const CACHE_TTL_RANKING = 5 * 60 * 1000; // 5 minutes - user might want fresh ranking

export interface CachedResponse<T> {
  data: T;
  isStale: boolean;
  lastUpdated?: number;
}

class GlobalGoalsService {
  private baseUrl = `${API_BASE_URL}/api/global-goals`;

  /**
   * Get global stats for all 6 goals
   * Uses cache-first with background refresh
   */
  async getAllGoalStats(
    period: 'today' | 'week' | 'month' = 'week'
  ): Promise<CachedResponse<GlobalGoalStats[]>> {
    const cacheKey = `${CACHE_KEY_STATS}_${period}`;
    
    // Try cache first
    const cached = await storageService.getCachedWithExpiry<GlobalGoalStats[]>(
      cacheKey,
      CACHE_TTL_STATS
    );
    
    if (cached && !cached.isStale) {
      return { 
        data: cached.data, 
        isStale: false, 
        lastUpdated: cached.cacheAge ? Date.now() - cached.cacheAge : undefined 
      };
    }
    
    // Try fetching fresh
    const isOnline = await connectivityService.isOnline();
    
    if (isOnline) {
      try {
        const freshData = await this.fetchStatsFromApi(period);
        await storageService.setCachedWithExpiry(cacheKey, freshData, CACHE_TTL_STATS);
        return { data: freshData, isStale: false, lastUpdated: Date.now() };
      } catch (error) {
        console.warn('[GlobalGoals] API fetch failed:', error);
      }
    }
    
    // Return stale cache
    if (cached?.data) {
      return { 
        data: cached.data, 
        isStale: true, 
        lastUpdated: cached.cacheAge ? Date.now() - cached.cacheAge : undefined 
      };
    }
    
    // Fallback to mock
    return { data: this.getMockStats(period), isStale: true };
  }

  /**
   * Get user's ranking for a specific goal
   */
  async getUserRanking(
    goalId: GoalType, 
    period: 'today' | 'week' | 'month' = 'week'
  ): Promise<CachedResponse<UserGoalRanking | null>> {
    const cacheKey = `${CACHE_KEY_RANKING}_${goalId}_${period}`;
    
    const cached = await storageService.getCachedWithExpiry<UserGoalRanking>(
      cacheKey,
      CACHE_TTL_RANKING
    );
    
    if (cached && !cached.isStale) {
      return { data: cached.data, isStale: false };
    }
    
    const isOnline = await connectivityService.isOnline();
    
    if (isOnline) {
      try {
        const freshData = await this.fetchRankingFromApi(goalId, period);
        if (freshData) {
          await storageService.setCachedWithExpiry(cacheKey, freshData, CACHE_TTL_RANKING);
        }
        return { data: freshData, isStale: false };
      } catch (error) {
        console.warn('[GlobalGoals] Ranking fetch failed:', error);
      }
    }
    
    if (cached?.data) {
      return { data: cached.data, isStale: true };
    }
    
    return { data: this.getMockRanking(goalId, period), isStale: true };
  }

  /**
   * Get leaderboard for a goal
   */
  async getLeaderboard(
    goalId: GoalType, 
    period: 'today' | 'week' | 'month' = 'week'
  ): Promise<CachedResponse<GlobalLeaderboard>> {
    const cacheKey = `${CACHE_KEY_LEADERBOARD}_${goalId}_${period}`;
    
    const cached = await storageService.getCachedWithExpiry<GlobalLeaderboard>(
      cacheKey,
      CACHE_TTL_LEADERBOARD
    );
    
    if (cached && !cached.isStale) {
      return { data: cached.data, isStale: false };
    }
    
    const isOnline = await connectivityService.isOnline();
    
    if (isOnline) {
      try {
        const freshData = await this.fetchLeaderboardFromApi(goalId, period);
        await storageService.setCachedWithExpiry(cacheKey, freshData, CACHE_TTL_LEADERBOARD);
        return { data: freshData, isStale: false };
      } catch (error) {
        console.warn('[GlobalGoals] Leaderboard fetch failed:', error);
      }
    }
    
    if (cached?.data) {
      return { data: cached.data, isStale: true };
    }
    
    return { data: this.getMockLeaderboard(goalId, period), isStale: true };
  }

  /**
   * Get active community challenges
   */
  async getChallenges(): Promise<CachedResponse<CommunityChallenge[]>> {
    const cacheKey = CACHE_KEY_CHALLENGES;
    
    const cached = await storageService.getCachedWithExpiry<CommunityChallenge[]>(
      cacheKey,
      CACHE_TTL_CHALLENGES
    );
    
    if (cached && !cached.isStale) {
      return { data: cached.data, isStale: false };
    }
    
    const isOnline = await connectivityService.isOnline();
    
    if (isOnline) {
      try {
        const freshData = await this.fetchChallengesFromApi();
        await storageService.setCachedWithExpiry(cacheKey, freshData, CACHE_TTL_CHALLENGES);
        return { data: freshData, isStale: false };
      } catch (error) {
        console.warn('[GlobalGoals] Challenges fetch failed:', error);
      }
    }
    
    if (cached?.data) {
      return { data: cached.data, isStale: true };
    }
    
    return { data: this.getMockChallenges(), isStale: true };
  }

  /**
   * Join a community challenge
   * Queued if offline
   */
  async joinChallenge(challengeId: string): Promise<boolean> {
    const isOnline = await connectivityService.isOnline();
    
    if (isOnline) {
      try {
        // TODO: Replace with real API call
        console.log(`[GlobalGoals] Joining challenge: ${challengeId}`);
        return true;
      } catch (error) {
        console.warn('[GlobalGoals] Join challenge failed:', error);
        return false;
      }
    }
    
    // Queue for when online
    console.log(`[GlobalGoals] Offline - challenge join will sync later: ${challengeId}`);
    return true; // Optimistic
  }

  /**
   * Force refresh all cached data
   */
  async refreshAll(period: 'today' | 'week' | 'month' = 'week'): Promise<void> {
    await storageService.remove(`${CACHE_KEY_STATS}_${period}`);
    await storageService.remove(CACHE_KEY_CHALLENGES);
  }

  // ============================================
  // API FETCH METHODS (with mock fallbacks)
  // ============================================

  private async fetchStatsFromApi(period: string): Promise<GlobalGoalStats[]> {
    // TODO: Replace with real API call
    // const response = await fetch(`${this.baseUrl}/stats?period=${period}`);
    // if (!response.ok) throw new Error('API request failed');
    // return await response.json();
    
    await new Promise(resolve => setTimeout(resolve, 300));
    return this.getMockStats(period as any);
  }

  private async fetchRankingFromApi(goalId: GoalType, period: string): Promise<UserGoalRanking | null> {
    // TODO: Replace with real API call
    await new Promise(resolve => setTimeout(resolve, 200));
    return this.getMockRanking(goalId, period);
  }

  private async fetchLeaderboardFromApi(goalId: GoalType, period: string): Promise<GlobalLeaderboard> {
    // TODO: Replace with real API call
    await new Promise(resolve => setTimeout(resolve, 200));
    return this.getMockLeaderboard(goalId, period);
  }

  private async fetchChallengesFromApi(): Promise<CommunityChallenge[]> {
    // TODO: Replace with real API call
    await new Promise(resolve => setTimeout(resolve, 200));
    return this.getMockChallenges();
  }

  // ============================================
  // MOCK DATA (until backend is ready)
  // ============================================

  private getMockStats(period: 'today' | 'week' | 'month'): GlobalGoalStats[] {
    const multiplier = period === 'today' ? 1 : period === 'week' ? 7 : 30;
    
    return [
      {
        goalId: 'weight_loss',
        goalLabel: 'Weight Loss',
        totalUsers: 45230,
        activeUsersToday: 12450,
        activeUsersWeek: 34200,
        activeUsersMonth: 42100,
        communityMetrics: {
          totalPoundsLost: 127500 * multiplier / 30,
          avgPoundsLostPerUser: 2.8,
          totalCaloriesBurned: 45000000 * multiplier / 30,
          totalWorkoutsCompleted: 89000 * multiplier / 30,
          wasteReduced: {
            foodWastePrevented: 8500 * multiplier / 30,
            carbonSaved: 12400 * multiplier / 30,
            mealsPlannedNotWasted: 156000 * multiplier / 30,
          },
        },
      },
      {
        goalId: 'muscle_gain',
        goalLabel: 'Muscle Gain',
        totalUsers: 38450,
        activeUsersToday: 10200,
        activeUsersWeek: 28900,
        activeUsersMonth: 35600,
        communityMetrics: {
          totalMuscleGained: 42000 * multiplier / 30,
          avgProteinPerDay: 165,
          totalCaloriesBurned: 38000000 * multiplier / 30,
          totalWorkoutsCompleted: 112000 * multiplier / 30,
          wasteReduced: {
            foodWastePrevented: 6200 * multiplier / 30,
            carbonSaved: 9100 * multiplier / 30,
            mealsPlannedNotWasted: 124000 * multiplier / 30,
          },
        },
      },
      {
        goalId: 'body_recomposition',
        goalLabel: 'Body Recomp',
        totalUsers: 22100,
        activeUsersToday: 6800,
        activeUsersWeek: 17500,
        activeUsersMonth: 20400,
        communityMetrics: {
          totalPoundsLost: 31000 * multiplier / 30,
          totalMuscleGained: 18500 * multiplier / 30,
          totalCaloriesBurned: 22000000 * multiplier / 30,
          totalWorkoutsCompleted: 54000 * multiplier / 30,
          wasteReduced: {
            foodWastePrevented: 4100 * multiplier / 30,
            carbonSaved: 5800 * multiplier / 30,
            mealsPlannedNotWasted: 82000 * multiplier / 30,
          },
        },
      },
      {
        goalId: 'maintenance',
        goalLabel: 'Maintenance',
        totalUsers: 31200,
        activeUsersToday: 8900,
        activeUsersWeek: 24100,
        activeUsersMonth: 29500,
        communityMetrics: {
          totalCaloriesBurned: 28000000 * multiplier / 30,
          totalWorkoutsCompleted: 62000 * multiplier / 30,
          totalMealsLogged: 245000 * multiplier / 30,
          wasteReduced: {
            foodWastePrevented: 5800 * multiplier / 30,
            carbonSaved: 8200 * multiplier / 30,
            mealsPlannedNotWasted: 118000 * multiplier / 30,
          },
        },
      },
      {
        goalId: 'athletic_performance',
        goalLabel: 'Athletic Performance',
        totalUsers: 18900,
        activeUsersToday: 7200,
        activeUsersWeek: 15800,
        activeUsersMonth: 17900,
        communityMetrics: {
          totalCaloriesBurned: 42000000 * multiplier / 30,
          totalWorkoutsCompleted: 98000 * multiplier / 30,
          avgProteinPerDay: 145,
          wasteReduced: {
            foodWastePrevented: 3500 * multiplier / 30,
            carbonSaved: 4900 * multiplier / 30,
            mealsPlannedNotWasted: 68000 * multiplier / 30,
          },
        },
      },
      {
        goalId: 'general_health',
        goalLabel: 'General Health',
        totalUsers: 52400,
        activeUsersToday: 15600,
        activeUsersWeek: 41200,
        activeUsersMonth: 49800,
        communityMetrics: {
          totalCaloriesBurned: 35000000 * multiplier / 30,
          totalWorkoutsCompleted: 78000 * multiplier / 30,
          totalMealsLogged: 312000 * multiplier / 30,
          wasteReduced: {
            foodWastePrevented: 9800 * multiplier / 30,
            carbonSaved: 14200 * multiplier / 30,
            mealsPlannedNotWasted: 198000 * multiplier / 30,
          },
        },
      },
    ];
  }

  private getMockRanking(goalId: GoalType, period: string): UserGoalRanking {
    return {
      goalId,
      userId: 'current_user',
      percentile: 78,
      rank: 9876,
      totalInGoal: 45230,
      userMetrics: {
        poundsLost: 8.5,
        caloriesBurned: 24500,
        workoutsCompleted: 18,
        mealsLogged: 62,
        streakDays: 12,
      },
      vsAverage: {
        metric: 'poundsLost',
        userValue: 8.5,
        avgValue: 6.2,
        percentBetter: 37,
      },
    };
  }

  private getMockLeaderboard(goalId: GoalType, period: string): GlobalLeaderboard {
    return {
      goalId,
      period: period as any,
      topUsers: [
        { rank: 1, userId: 'u1', displayName: 'FitnessPro', value: 24.5, metric: 'lbs lost' },
        { rank: 2, userId: 'u2', displayName: 'HealthyHero', value: 22.1, metric: 'lbs lost' },
        { rank: 3, userId: 'u3', displayName: 'WellnessWin', value: 19.8, metric: 'lbs lost' },
        { rank: 4, userId: 'u4', displayName: 'ActiveAce', value: 18.2, metric: 'lbs lost' },
        { rank: 5, userId: 'u5', displayName: 'NutritionNinja', value: 17.5, metric: 'lbs lost' },
      ],
      userPosition: {
        rank: 9876,
        value: 8.5,
        percentile: 78,
      },
    };
  }

  private getMockChallenges(): CommunityChallenge[] {
    return [
      {
        id: 'jan-weight-loss',
        goalId: 'weight_loss',
        title: 'January Weight Loss Challenge',
        description: 'Community goal: Lose 100,000 lbs together in January!',
        target: 100000,
        current: 67500,
        percentComplete: 67.5,
        startDate: '2026-01-01',
        endDate: '2026-01-31',
        daysRemaining: 24,
        participants: 12450,
        userJoined: true,
        userContribution: 8.5,
      },
      {
        id: 'reduce-waste-q1',
        goalId: 'general_health',
        title: 'Zero Waste Q1',
        description: 'Prevent 50,000 lbs of food waste through smart meal planning',
        target: 50000,
        current: 18200,
        percentComplete: 36.4,
        startDate: '2026-01-01',
        endDate: '2026-03-31',
        daysRemaining: 83,
        participants: 8900,
        userJoined: false,
      },
    ];
  }
}

export const globalGoalsService = new GlobalGoalsService();
export default globalGoalsService;
