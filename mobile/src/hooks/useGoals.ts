/**
 * useGoals Hook
 * 
 * React hook for managing health goals and milestones.
 * Provides data fetching, caching, and state management.
 */

import { useState, useEffect, useCallback } from 'react';
import goalsService from '../services/goalsService';
import {
  Goal,
  Milestone,
  ProgressEntry,
  CreateGoalRequest,
  UpdateGoalRequest,
  LogProgressRequest,
  GoalFilters,
} from '../types/goals.types';

// ============================================
// TYPES
// ============================================

interface UseGoalsReturn {
  // Data
  goals: Goal[];
  activeGoals: Goal[];
  selectedGoal: Goal | null;
  milestones: Milestone[];
  progressHistory: ProgressEntry[];
  
  // State
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  isStale: boolean;
  
  // Actions
  fetchGoals: (filters?: GoalFilters) => Promise<void>;
  fetchGoalById: (goalId: string) => Promise<void>;
  createGoal: (goalData: CreateGoalRequest) => Promise<Goal>;
  updateGoal: (goalId: string, updates: UpdateGoalRequest) => Promise<Goal>;
  deleteGoal: (goalId: string) => Promise<void>;
  logProgress: (goalId: string, progress: LogProgressRequest) => Promise<{
    progress: ProgressEntry;
    milestonesAchieved: Milestone[];
  }>;
  completeGoal: (goalId: string, notes?: string) => Promise<void>;
  pauseGoal: (goalId: string) => Promise<void>;
  resumeGoal: (goalId: string) => Promise<void>;
  refreshGoals: () => Promise<void>;
  clearError: () => void;
  
  // Helpers
  getGoalProgress: (goal: Goal) => number;
  getNextMilestone: (goal: Goal) => Milestone | null;
}

// ============================================
// HOOK IMPLEMENTATION
// ============================================

export function useGoals(initialFilters?: GoalFilters): UseGoalsReturn {
  // State
  const [goals, setGoals] = useState<Goal[]>([]);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [progressHistory, setProgressHistory] = useState<ProgressEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isStale, setIsStale] = useState(false);

  // Computed
  const activeGoals = goals.filter(g => g.status === 'active');

  // Fetch goals
  const fetchGoals = useCallback(async (filters?: GoalFilters) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await goalsService.getGoals(filters);
      setGoals(response.data.goals);
      setIsStale(response.isStale);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch goals');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch goal by ID
  const fetchGoalById = useCallback(async (goalId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await goalsService.getGoalById(goalId);
      setSelectedGoal(response.data.goal);
      setMilestones(response.data.milestones);
      setProgressHistory(response.data.progress_history);
      setIsStale(response.isStale);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch goal');
    } finally {
      setLoading(false);
    }
  }, []);

  // Create goal
  const createGoal = useCallback(async (goalData: CreateGoalRequest): Promise<Goal> => {
    setError(null);
    
    try {
      const response = await goalsService.createGoal(goalData);
      setGoals(prev => [...prev, response.goal]);
      return response.goal;
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to create goal';
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  }, []);

  // Update goal
  const updateGoal = useCallback(async (goalId: string, updates: UpdateGoalRequest): Promise<Goal> => {
    setError(null);
    
    try {
      const response = await goalsService.updateGoal(goalId, updates);
      setGoals(prev => prev.map(g => g.id === goalId ? response.goal : g));
      
      if (selectedGoal?.id === goalId) {
        setSelectedGoal(response.goal);
      }
      
      return response.goal;
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to update goal';
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  }, [selectedGoal]);

  // Delete goal
  const deleteGoal = useCallback(async (goalId: string): Promise<void> => {
    setError(null);
    
    try {
      await goalsService.deleteGoal(goalId);
      setGoals(prev => prev.filter(g => g.id !== goalId));
      
      if (selectedGoal?.id === goalId) {
        setSelectedGoal(null);
        setMilestones([]);
        setProgressHistory([]);
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to delete goal';
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  }, [selectedGoal]);

  // Log progress
  const logProgress = useCallback(async (
    goalId: string,
    progress: LogProgressRequest
  ): Promise<{ progress: ProgressEntry; milestonesAchieved: Milestone[] }> => {
    setError(null);
    
    try {
      const response = await goalsService.logProgress(goalId, progress);
      
      // Update goal in list
      setGoals(prev => prev.map(g => 
        g.id === goalId ? response.goal_updated : g
      ));
      
      // Update selected goal if applicable
      if (selectedGoal?.id === goalId) {
        setSelectedGoal(response.goal_updated);
        setProgressHistory(prev => [response.progress, ...prev]);
        
        // Update milestones
        if (response.milestones_achieved.length > 0) {
          setMilestones(prev => prev.map(m => {
            const achieved = response.milestones_achieved.find(a => a.id === m.id);
            return achieved ? { ...m, achieved: true, achieved_at: new Date().toISOString() } : m;
          }));
        }
      }
      
      return {
        progress: response.progress,
        milestonesAchieved: response.milestones_achieved,
      };
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to log progress';
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  }, [selectedGoal]);

  // Complete goal
  const completeGoal = useCallback(async (goalId: string, notes?: string): Promise<void> => {
    setError(null);
    
    try {
      const response = await goalsService.completeGoal(goalId, notes);
      setGoals(prev => prev.map(g => g.id === goalId ? response.goal : g));
      
      if (selectedGoal?.id === goalId) {
        setSelectedGoal(response.goal);
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to complete goal';
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  }, [selectedGoal]);

  // Pause goal
  const pauseGoal = useCallback(async (goalId: string): Promise<void> => {
    await updateGoal(goalId, { status: 'paused' });
  }, [updateGoal]);

  // Resume goal
  const resumeGoal = useCallback(async (goalId: string): Promise<void> => {
    await updateGoal(goalId, { status: 'active' });
  }, [updateGoal]);

  // Refresh goals
  const refreshGoals = useCallback(async (): Promise<void> => {
    setRefreshing(true);
    await fetchGoals(initialFilters);
    setRefreshing(false);
  }, [fetchGoals, initialFilters]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Get goal progress percentage
  const getGoalProgress = useCallback((goal: Goal): number => {
    return goal.progress_percentage;
  }, []);

  // Get next milestone for a goal
  const getNextMilestone = useCallback((goal: Goal): Milestone | null => {
    const goalMilestones = milestones.filter(m => m.goal_id === goal.id);
    return goalsService.getNextMilestone(
      goalMilestones,
      goal.current_value,
      goal.type === 'weight_loss'
    );
  }, [milestones]);

  // Initial fetch
  useEffect(() => {
    fetchGoals(initialFilters);
  }, []);

  return {
    // Data
    goals,
    activeGoals,
    selectedGoal,
    milestones,
    progressHistory,
    
    // State
    loading,
    refreshing,
    error,
    isStale,
    
    // Actions
    fetchGoals,
    fetchGoalById,
    createGoal,
    updateGoal,
    deleteGoal,
    logProgress,
    completeGoal,
    pauseGoal,
    resumeGoal,
    refreshGoals,
    clearError,
    
    // Helpers
    getGoalProgress,
    getNextMilestone,
  };
}

export default useGoals;
