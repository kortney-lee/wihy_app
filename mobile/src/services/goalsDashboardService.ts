/**
 * Goals Dashboard API Service
 * 
 * All data comes from backend - client just displays.
 * No client-side calculations or state management.
 * 
 * OFFLINE SUPPORT:
 * - Data is cached locally with TTL
 * - Active goal is persisted locally
 * - Changes are queued when offline
 */

import { storageService } from './storage/storageService';
import { syncEngine } from './sync/syncEngine';
import { connectivityService } from './connectivity/connectivityService';

// ============================================
// TYPES - What the backend returns
// ============================================

export type GoalId = 
  | 'weight_loss'
  | 'muscle_gain'
  | 'body_recomposition'
  | 'maintenance'
  | 'athletic_performance'
  | 'general_health';

export interface GoalCard {
  id: GoalId;
  label: string;
  formula: string;  // "Burn > Eat", "Protein + Lift", etc.
  icon: string;     // Ionicons name
  color: string;    // Hex color
  isActive: boolean;
}

export interface UserGoalProgress {
  goalId: GoalId;
  goalLabel: string;
  
  // Progress for selected period
  period: 'today' | 'week' | 'month';
  
  // Key metrics (varies by goal)
  metrics: {
    caloriesBurned?: number;
    caloriesConsumed?: number;
    calorieDeficit?: number;
    proteinGrams?: number;
    proteinTarget?: number;
    workoutsCompleted?: number;
    workoutsTarget?: number;
    mealsLogged?: number;
    weight?: number;
    weightChange?: number;
  };
  
  // Overall progress percentage
  progressPercent: number;
  
  // Where user ranks globally
  ranking?: {
    percentile: number;
    label: string;  // "Top 10%"
    totalUsers: number;
  };
}

// Simplified user progress for display
export interface SimpleUserProgress {
  workoutsCompleted: number;
  caloriesLogged: number;
  overallProgress: number;
}

export interface GoalsDashboardData {
  // All 6 goal cards to display
  goals: GoalCard[];
  
  // User's currently active goal ID (if any)
  activeGoal?: GoalId;
  
  // Simple progress stats for display
  userProgress?: SimpleUserProgress;
  
  // Detailed progress for active goal (based on period)
  progress?: UserGoalProgress;
  
  // Community stats (for selected period)
  community: {
    totalActiveUsers: number;
    topGoal: string;
    totalWeightLost: number;
    totalWasteReduced: number;
  };
}

// ============================================
// API SERVICE
// ============================================

// API base URL - update when backend is ready
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://api.wihy.app';

// Cache keys
const CACHE_KEY_DASHBOARD = 'goals_dashboard';
const CACHE_KEY_ACTIVE_GOAL = 'active_goal';
const CACHE_TTL_DASHBOARD = 5 * 60 * 1000; // 5 minutes
const CACHE_TTL_ACTIVE_GOAL = 24 * 60 * 60 * 1000; // 24 hours

class GoalsDashboardService {
  private baseUrl = `${API_BASE_URL}/api/goals-dashboard`;
  
  // In-memory cache for current session
  private memoryActiveGoal: GoalId | null = null;
  private initialized = false;

  /**
   * Initialize service - load persisted active goal
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    try {
      const cached = await storageService.get<{ goalId: GoalId }>(CACHE_KEY_ACTIVE_GOAL);
      if (cached?.goalId) {
        this.memoryActiveGoal = cached.goalId;
      }
      this.initialized = true;
    } catch (error) {
      console.warn('[GoalsDashboard] Failed to load cached goal:', error);
    }
  }

  /**
   * Get all dashboard data in one call
   * Uses cache-first strategy with background refresh
   */
  async getDashboard(period: 'today' | 'week' | 'month' = 'today'): Promise<GoalsDashboardData> {
    await this.initialize();
    
    const cacheKey = `${CACHE_KEY_DASHBOARD}_${period}`;
    
    // Try cache first
    const cached = await storageService.getCachedWithExpiry<GoalsDashboardData>(
      cacheKey,
      CACHE_TTL_DASHBOARD
    );
    
    if (cached && !cached.isStale) {
      // Fresh cache - return immediately
      return this.applyLocalActiveGoal(cached.data);
    }
    
    // Try fetching fresh data
    const isOnline = await connectivityService.isOnline();
    
    if (isOnline) {
      try {
        const freshData = await this.fetchDashboardFromApi(period);
        
        // Cache the fresh data
        await storageService.setCachedWithExpiry(cacheKey, freshData, CACHE_TTL_DASHBOARD);
        
        return this.applyLocalActiveGoal(freshData);
      } catch (error) {
        console.warn('[GoalsDashboard] API fetch failed:', error);
      }
    }
    
    // Return stale cache if available
    if (cached?.data) {
      console.log('[GoalsDashboard] Using stale cache');
      return this.applyLocalActiveGoal(cached.data);
    }
    
    // Fallback to mock data
    return this.getMockData(period);
  }

  /**
   * Fetch dashboard data from API
   */
  private async fetchDashboardFromApi(period: string): Promise<GoalsDashboardData> {
    // TODO: Replace with real API call when backend is ready
    // const response = await fetch(`${this.baseUrl}?period=${period}`);
    // if (!response.ok) throw new Error('API request failed');
    // return await response.json();
    
    // For now, simulate API delay and return mock
    await new Promise(resolve => setTimeout(resolve, 300));
    return this.getMockData(period as 'today' | 'week' | 'month');
  }

  /**
   * Apply locally stored active goal to dashboard data
   */
  private applyLocalActiveGoal(data: GoalsDashboardData): GoalsDashboardData {
    const activeGoal = this.memoryActiveGoal;
    
    return {
      ...data,
      activeGoal: activeGoal || undefined,
      goals: data.goals.map(g => ({
        ...g,
        isActive: g.id === activeGoal,
      })),
      userProgress: activeGoal ? data.userProgress : undefined,
    };
  }

  /**
   * Set user's active goal
   * Persists locally immediately, syncs to server when online
   */
  async setActiveGoal(goalId: GoalId): Promise<{ success: boolean }> {
    // Update memory immediately (optimistic)
    this.memoryActiveGoal = goalId;
    
    // Persist to local storage
    await storageService.set(CACHE_KEY_ACTIVE_GOAL, { goalId });
    
    // Queue sync to server
    const isOnline = await connectivityService.isOnline();
    
    if (isOnline) {
      try {
        await this.syncActiveGoalToServer(goalId);
      } catch (error) {
        // Queue for later sync
        await syncEngine.enqueue({
          operation: 'update',
          endpoint: 'goals/active',
          payload: { goalId },
          priority: 'high',
          callback: 'goalsDashboardService.onGoalSynced',
        });
      }
    } else {
      // Queue for sync when online
      await syncEngine.enqueue({
        operation: 'update',
        endpoint: 'goals/active',
        payload: { goalId },
        priority: 'high',
        callback: 'goalsDashboardService.onGoalSynced',
      });
    }
    
    return { success: true };
  }

  /**
   * Sync active goal to server
   */
  private async syncActiveGoalToServer(goalId: GoalId): Promise<void> {
    // TODO: Replace with real API call when backend is ready
    // const response = await fetch(`${this.baseUrl}/active`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ goalId }),
    // });
    // if (!response.ok) throw new Error('Failed to sync goal');
    
    console.log('[GoalsDashboard] Goal synced to server:', goalId);
  }

  /**
   * Callback when goal sync completes
   */
  async onGoalSynced(localId: string | undefined, data: any): Promise<void> {
    console.log('[GoalsDashboard] Server confirmed goal sync:', data);
  }

  /**
   * Clear active goal
   */
  async clearActiveGoal(): Promise<{ success: boolean }> {
    this.memoryActiveGoal = null;
    
    // Clear from local storage
    await storageService.remove(CACHE_KEY_ACTIVE_GOAL);
    
    // Queue sync to server
    await syncEngine.enqueue({
      operation: 'delete',
      endpoint: 'goals/active',
      payload: {},
      priority: 'normal',
    });
    
    return { success: true };
  }

  /**
   * Force refresh dashboard data from server
   */
  async refresh(period: 'today' | 'week' | 'month' = 'today'): Promise<GoalsDashboardData> {
    const cacheKey = `${CACHE_KEY_DASHBOARD}_${period}`;
    
    // Clear cache
    await storageService.remove(cacheKey);
    
    // Fetch fresh
    return this.getDashboard(period);
  }

  // ============================================
  // MOCK DATA (until backend is ready)
  // ============================================

  private getMockData(period: 'today' | 'week' | 'month'): GoalsDashboardData {
    const activeGoal = this.memoryActiveGoal;
    
    const goals: GoalCard[] = [
      {
        id: 'weight_loss',
        label: 'Weight Loss',
        formula: 'Burn > Eat',
        icon: 'trending-down-outline',
        color: '#ef4444',
        isActive: activeGoal === 'weight_loss',
      },
      {
        id: 'muscle_gain',
        label: 'Muscle Gain',
        formula: 'Protein + Lift',
        icon: 'fitness-outline',
        color: '#f97316',
        isActive: activeGoal === 'muscle_gain',
      },
      {
        id: 'body_recomposition',
        label: 'Body Recomp',
        formula: 'Burn Fat + Build',
        icon: 'body-outline',
        color: '#8b5cf6',
        isActive: activeGoal === 'body_recomposition',
      },
      {
        id: 'maintenance',
        label: 'Maintenance',
        formula: 'Balance In/Out',
        icon: 'shield-checkmark-outline',
        color: '#10b981',
        isActive: activeGoal === 'maintenance',
      },
      {
        id: 'athletic_performance',
        label: 'Athletic',
        formula: 'Train + Fuel',
        icon: 'trophy-outline',
        color: '#3b82f6',
        isActive: activeGoal === 'athletic_performance',
      },
      {
        id: 'general_health',
        label: 'General Health',
        formula: 'Move + Eat Well',
        icon: 'heart-outline',
        color: '#ec4899',
        isActive: activeGoal === 'general_health',
      },
    ];

    // Mock progress data when goal is active
    const userProgress: SimpleUserProgress | undefined = activeGoal
      ? {
          workoutsCompleted: period === 'today' ? 1 : period === 'week' ? 5 : 18,
          caloriesLogged: period === 'today' ? 1850 : period === 'week' ? 12950 : 55500,
          overallProgress: period === 'today' ? 68 : period === 'week' ? 74 : 82,
        }
      : undefined;

    return {
      goals,
      activeGoal: activeGoal || undefined,
      userProgress,
      community: {
        totalActiveUsers: period === 'today' ? 45230 : period === 'week' ? 156000 : 312000,
        topGoal: 'weight_loss',
        totalWeightLost: period === 'today' ? 4250 : period === 'week' ? 29750 : 127500,
        totalWasteReduced: period === 'today' ? 850 : period === 'week' ? 5950 : 25500,
      },
    };
  }
}

export const goalsDashboardService = new GoalsDashboardService();
export default goalsDashboardService;
