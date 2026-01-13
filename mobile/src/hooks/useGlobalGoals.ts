/**
 * useGlobalGoals Hook
 * 
 * React hook for accessing global/community goal statistics.
 * Shows where the user ranks and community progress.
 * 
 * NOTE: All data methods now return CachedResponse with isStale indicator
 */

import { useState, useEffect, useCallback } from 'react';
import globalGoalsService, {
  GoalType,
  GlobalGoalStats,
  UserGoalRanking,
  GlobalLeaderboard,
  CommunityChallenge,
} from '../services/globalGoalsService';

interface UseGlobalGoalsReturn {
  // Data
  allGoalStats: GlobalGoalStats[];
  userRanking: UserGoalRanking | null;
  leaderboard: GlobalLeaderboard | null;
  challenges: CommunityChallenge[];
  
  // Staleness indicators
  isDataStale: boolean;
  
  // Loading states
  isLoading: boolean;
  isLoadingRanking: boolean;
  isLoadingLeaderboard: boolean;
  
  // Actions
  refreshStats: () => Promise<void>;
  getUserRanking: (goalId: GoalType) => Promise<void>;
  getLeaderboard: (goalId: GoalType) => Promise<void>;
  joinChallenge: (challengeId: string) => Promise<boolean>;
  
  // Computed
  getTotalCommunityUsers: () => number;
  getTotalWasteReduced: () => number;
  getUserPercentileLabel: () => string;
}

export function useGlobalGoals(
  period: 'today' | 'week' | 'month' = 'week',
  selectedGoal?: GoalType
): UseGlobalGoalsReturn {
  const [allGoalStats, setAllGoalStats] = useState<GlobalGoalStats[]>([]);
  const [userRanking, setUserRanking] = useState<UserGoalRanking | null>(null);
  const [leaderboard, setLeaderboard] = useState<GlobalLeaderboard | null>(null);
  const [challenges, setChallenges] = useState<CommunityChallenge[]>([]);
  const [isDataStale, setIsDataStale] = useState(false);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingRanking, setIsLoadingRanking] = useState(false);
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(false);

  // Load all stats on mount and period change
  useEffect(() => {
    refreshStats();
  }, [period]);

  // Load ranking when goal changes
  useEffect(() => {
    if (selectedGoal) {
      getUserRanking(selectedGoal);
    }
  }, [selectedGoal, period]);

  const refreshStats = useCallback(async () => {
    setIsLoading(true);
    try {
      const [statsResponse, challengeResponse] = await Promise.all([
        globalGoalsService.getAllGoalStats(period),
        globalGoalsService.getChallenges(),
      ]);
      setAllGoalStats(statsResponse.data);
      setChallenges(challengeResponse.data);
      setIsDataStale(statsResponse.isStale || challengeResponse.isStale);
    } catch (error) {
      console.error('[useGlobalGoals] Failed to refresh:', error);
    } finally {
      setIsLoading(false);
    }
  }, [period]);

  const getUserRanking = useCallback(async (goalId: GoalType) => {
    setIsLoadingRanking(true);
    try {
      const rankingResponse = await globalGoalsService.getUserRanking(goalId, period);
      setUserRanking(rankingResponse.data);
    } catch (error) {
      console.error('[useGlobalGoals] Failed to get ranking:', error);
    } finally {
      setIsLoadingRanking(false);
    }
  }, [period]);

  const getLeaderboard = useCallback(async (goalId: GoalType) => {
    setIsLoadingLeaderboard(true);
    try {
      const boardResponse = await globalGoalsService.getLeaderboard(goalId, period);
      setLeaderboard(boardResponse.data);
    } catch (error) {
      console.error('[useGlobalGoals] Failed to get leaderboard:', error);
    } finally {
      setIsLoadingLeaderboard(false);
    }
  }, [period]);

  const joinChallenge = useCallback(async (challengeId: string) => {
    const success = await globalGoalsService.joinChallenge(challengeId);
    if (success) {
      // Refresh challenges to show updated state
      const updatedResponse = await globalGoalsService.getChallenges();
      setChallenges(updatedResponse.data);
    }
    return success;
  }, []);

  // Computed values
  const getTotalCommunityUsers = useCallback(() => {
    return allGoalStats.reduce((sum, stat) => sum + stat.totalUsers, 0);
  }, [allGoalStats]);

  const getTotalWasteReduced = useCallback(() => {
    return allGoalStats.reduce((sum, stat) => {
      return sum + (stat.communityMetrics.wasteReduced?.foodWastePrevented || 0);
    }, 0);
  }, [allGoalStats]);

  const getUserPercentileLabel = useCallback(() => {
    if (!userRanking) return '';
    
    const percentile = userRanking.percentile;
    if (percentile >= 95) return 'Top 5%';
    if (percentile >= 90) return 'Top 10%';
    if (percentile >= 75) return 'Top 25%';
    if (percentile >= 50) return 'Top 50%';
    return `Top ${100 - percentile}%`;
  }, [userRanking]);

  return {
    // Data
    allGoalStats,
    userRanking,
    leaderboard,
    challenges,
    
    // Staleness indicators
    isDataStale,
    
    // Loading states
    isLoading,
    isLoadingRanking,
    isLoadingLeaderboard,
    
    // Actions
    refreshStats,
    getUserRanking,
    getLeaderboard,
    joinChallenge,
    
    // Computed
    getTotalCommunityUsers,
    getTotalWasteReduced,
    getUserPercentileLabel,
  };
}

export default useGlobalGoals;
