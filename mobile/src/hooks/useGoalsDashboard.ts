/**
 * useGoalsDashboard Hook
 * 
 * Simple hook - just fetches data from backend and returns it.
 * No complex state management, no calculations.
 */

import { useState, useEffect, useCallback } from 'react';
import goalsDashboardService, {
  GoalsDashboardData,
  GoalId,
} from '../services/goalsDashboardService';

interface UseGoalsDashboardReturn {
  data: GoalsDashboardData | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  selectGoal: (goalId: GoalId) => Promise<void>;
  clearGoal: () => Promise<void>;
}

export function useGoalsDashboard(
  period: 'today' | 'week' | 'month' = 'today'
): UseGoalsDashboardReturn {
  const [data, setData] = useState<GoalsDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const dashboardData = await goalsDashboardService.getDashboard(period);
      setData(dashboardData);
    } catch (err) {
      setError('Failed to load dashboard');
      console.error('[useGoalsDashboard] Error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [period]);

  // Fetch on mount and when period changes
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const selectGoal = useCallback(async (goalId: GoalId) => {
    const result = await goalsDashboardService.setActiveGoal(goalId);
    if (result.success) {
      await fetchData(); // Refresh to get updated data
    }
  }, [fetchData]);

  const clearGoal = useCallback(async () => {
    const result = await goalsDashboardService.clearActiveGoal();
    if (result.success) {
      await fetchData();
    }
  }, [fetchData]);

  return {
    data,
    isLoading,
    error,
    refresh: fetchData,
    selectGoal,
    clearGoal,
  };
}

export default useGoalsDashboard;
