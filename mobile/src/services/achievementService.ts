/**
 * Achievement Service
 * 
 * Client-side service for achievements, badges, streaks, and gamification
 * Connects to services.wihy.ai for achievement tracking.
 */

import { servicesApi } from './servicesApiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ============= TYPES =============

export type AchievementCategory = 
  | 'fitness' 
  | 'nutrition' 
  | 'wellness' 
  | 'consistency' 
  | 'social' 
  | 'milestone'
  | 'special';

export type AchievementRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export type StreakType = 
  | 'workout' 
  | 'meal_logging' 
  | 'water_intake' 
  | 'sleep' 
  | 'scanning' 
  | 'app_usage';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  rarity: AchievementRarity;
  points: number;
  requirement: {
    type: string;
    target: number;
    current?: number;
  };
  reward?: {
    type: 'badge' | 'points' | 'feature_unlock' | 'discount';
    value: string | number;
  };
  unlockedAt?: string;
  progress?: number;
  isSecret?: boolean;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  category: AchievementCategory;
  earnedAt: string;
  displayOrder: number;
}

export interface Streak {
  id: string;
  type: StreakType;
  currentCount: number;
  longestCount: number;
  startDate: string;
  lastActivityDate: string;
  isActive: boolean;
  nextMilestone: number;
  milestoneReached: number[];
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  userName: string;
  userAvatar?: string;
  points: number;
  achievements: number;
  streak: number;
  isCurrentUser?: boolean;
}

export interface GamificationProfile {
  userId: string;
  level: number;
  currentXP: number;
  nextLevelXP: number;
  totalPoints: number;
  totalAchievements: number;
  totalBadges: number;
  longestStreak: number;
  currentStreaks: Streak[];
  rank?: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
}

export interface AchievementProgress {
  achievementId: string;
  currentValue: number;
  targetValue: number;
  percentage: number;
  estimatedCompletion?: string;
}

// ============= CONSTANTS =============

const CACHE_KEYS = {
  ACHIEVEMENTS: '@achievements',
  BADGES: '@badges',
  STREAKS: '@streaks',
  PROFILE: '@gamification_profile',
  LEADERBOARD: '@leaderboard',
};

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// ============= SERVICE IMPLEMENTATION =============

class AchievementService {
  private cache: Map<string, { data: any; timestamp: number }> = new Map();

  // ==========================================
  // ACHIEVEMENTS
  // ==========================================

  /**
   * Get all achievements (earned and unearned)
   * 
   * @param includeSecret - Include secret achievements
   * @returns List of all achievements
   */
  async getAllAchievements(includeSecret: boolean = false): Promise<Achievement[]> {
    try {
      const response = await servicesApi.get<{ achievements: Achievement[] }>(
        `/api/achievements?includeSecret=${includeSecret}`
      );
      
      const achievements = response.achievements || [];
      await this.cacheData(CACHE_KEYS.ACHIEVEMENTS, achievements);
      return achievements;
    } catch (error) {
      console.error('[AchievementService] Error fetching achievements:', error);
      return this.getCachedData(CACHE_KEYS.ACHIEVEMENTS) || [];
    }
  }

  /**
   * Get earned achievements for a user
   * 
   * @param userId - User ID (optional, defaults to current user)
   * @returns List of earned achievements
   */
  async getEarnedAchievements(userId?: string): Promise<Achievement[]> {
    try {
      const endpoint = userId 
        ? `/api/achievements/earned?userId=${userId}`
        : '/api/achievements/earned';
        
      const response = await servicesApi.get<{ achievements: Achievement[] }>(endpoint);
      return response.achievements || [];
    } catch (error) {
      console.error('[AchievementService] Error fetching earned achievements:', error);
      return [];
    }
  }

  /**
   * Get achievement progress
   * 
   * @returns Progress on all incomplete achievements
   */
  async getAchievementProgress(): Promise<AchievementProgress[]> {
    try {
      const response = await servicesApi.get<{ progress: AchievementProgress[] }>(
        '/api/achievements/progress'
      );
      return response.progress || [];
    } catch (error) {
      console.error('[AchievementService] Error fetching progress:', error);
      return [];
    }
  }

  /**
   * Claim an achievement reward
   * 
   * @param achievementId - Achievement ID to claim
   * @returns Reward details
   */
  async claimReward(achievementId: string): Promise<{ success: boolean; reward?: any }> {
    try {
      const response = await servicesApi.post<{ success: boolean; reward?: any }>(
        `/api/achievements/${achievementId}/claim`,
        {}
      );
      return response;
    } catch (error) {
      console.error('[AchievementService] Error claiming reward:', error);
      return { success: false };
    }
  }

  /**
   * Check and award new achievements
   * Called after completing actions (workouts, meals, etc.)
   * 
   * @param actionType - Type of action completed
   * @param metadata - Additional context
   * @returns Newly unlocked achievements
   */
  async checkAchievements(
    actionType: string,
    metadata?: Record<string, any>
  ): Promise<Achievement[]> {
    try {
      const response = await servicesApi.post<{ newAchievements: Achievement[] }>(
        '/api/achievements/check',
        { actionType, metadata }
      );
      return response.newAchievements || [];
    } catch (error) {
      console.error('[AchievementService] Error checking achievements:', error);
      return [];
    }
  }

  // ==========================================
  // BADGES
  // ==========================================

  /**
   * Get all badges for a user
   * 
   * @param userId - User ID (optional)
   * @returns List of earned badges
   */
  async getBadges(userId?: string): Promise<Badge[]> {
    try {
      const endpoint = userId 
        ? `/api/badges?userId=${userId}`
        : '/api/badges';
        
      const response = await servicesApi.get<{ badges: Badge[] }>(endpoint);
      
      const badges = response.badges || [];
      await this.cacheData(CACHE_KEYS.BADGES, badges);
      return badges;
    } catch (error) {
      console.error('[AchievementService] Error fetching badges:', error);
      return this.getCachedData(CACHE_KEYS.BADGES) || [];
    }
  }

  /**
   * Get featured badges to display on profile
   * 
   * @param limit - Max badges to return
   * @returns Featured badges
   */
  async getFeaturedBadges(limit: number = 3): Promise<Badge[]> {
    try {
      const response = await servicesApi.get<{ badges: Badge[] }>(
        `/api/badges/featured?limit=${limit}`
      );
      return response.badges || [];
    } catch (error) {
      console.error('[AchievementService] Error fetching featured badges:', error);
      return [];
    }
  }

  /**
   * Set featured badges for profile display
   * 
   * @param badgeIds - Badge IDs to feature
   */
  async setFeaturedBadges(badgeIds: string[]): Promise<void> {
    try {
      await servicesApi.put('/api/badges/featured', { badgeIds });
    } catch (error) {
      console.error('[AchievementService] Error setting featured badges:', error);
      throw error;
    }
  }

  // ==========================================
  // STREAKS
  // ==========================================

  /**
   * Get all active streaks
   * 
   * @returns List of user's streaks
   */
  async getStreaks(): Promise<Streak[]> {
    try {
      const response = await servicesApi.get<{ streaks: Streak[] }>('/api/streaks');
      
      const streaks = response.streaks || [];
      await this.cacheData(CACHE_KEYS.STREAKS, streaks);
      return streaks;
    } catch (error) {
      console.error('[AchievementService] Error fetching streaks:', error);
      return this.getCachedData(CACHE_KEYS.STREAKS) || [];
    }
  }

  /**
   * Get a specific streak
   * 
   * @param type - Streak type
   * @returns Streak details
   */
  async getStreak(type: StreakType): Promise<Streak | null> {
    try {
      const response = await servicesApi.get<{ streak: Streak }>(`/api/streaks/${type}`);
      return response.streak || null;
    } catch (error) {
      console.error('[AchievementService] Error fetching streak:', error);
      return null;
    }
  }

  /**
   * Log activity to maintain/extend streak
   * 
   * @param type - Streak type
   * @param metadata - Activity details
   * @returns Updated streak
   */
  async logStreakActivity(
    type: StreakType,
    metadata?: Record<string, any>
  ): Promise<Streak | null> {
    try {
      const response = await servicesApi.post<{ streak: Streak }>(
        `/api/streaks/${type}/log`,
        { metadata }
      );
      return response.streak || null;
    } catch (error) {
      console.error('[AchievementService] Error logging streak activity:', error);
      return null;
    }
  }

  /**
   * Get streak milestones and rewards
   * 
   * @param type - Streak type
   * @returns Milestone information
   */
  async getStreakMilestones(type: StreakType): Promise<{
    milestones: { days: number; reward: string; reached: boolean }[];
    nextMilestone: { days: number; reward: string; daysRemaining: number };
  }> {
    try {
      const response = await servicesApi.get(`/api/streaks/${type}/milestones`);
      return response as any;
    } catch (error) {
      console.error('[AchievementService] Error fetching milestones:', error);
      return {
        milestones: [],
        nextMilestone: { days: 7, reward: 'Badge', daysRemaining: 7 },
      };
    }
  }

  // ==========================================
  // GAMIFICATION PROFILE
  // ==========================================

  /**
   * Get user's gamification profile
   * 
   * @param userId - User ID (optional)
   * @returns Gamification profile with level, XP, etc.
   */
  async getProfile(userId?: string): Promise<GamificationProfile | null> {
    try {
      const endpoint = userId 
        ? `/api/gamification/profile?userId=${userId}`
        : '/api/gamification/profile';
        
      const response = await servicesApi.get<{ profile: GamificationProfile }>(endpoint);
      
      const profile = response.profile;
      if (profile) {
        await this.cacheData(CACHE_KEYS.PROFILE, profile);
      }
      return profile || null;
    } catch (error) {
      console.error('[AchievementService] Error fetching profile:', error);
      return this.getCachedData(CACHE_KEYS.PROFILE);
    }
  }

  /**
   * Add XP points to user
   * 
   * @param points - Points to add
   * @param source - Source of points (workout, meal, scan, etc.)
   * @returns Updated profile with level-up info
   */
  async addPoints(
    points: number,
    source: string
  ): Promise<{
    profile: GamificationProfile;
    leveledUp: boolean;
    newLevel?: number;
    newAchievements?: Achievement[];
  }> {
    try {
      const response = await servicesApi.post(
        '/api/gamification/points',
        { points, source }
      );
      return response as any;
    } catch (error) {
      console.error('[AchievementService] Error adding points:', error);
      throw error;
    }
  }

  // ==========================================
  // LEADERBOARD
  // ==========================================

  /**
   * Get global leaderboard
   * 
   * @param timeframe - Time period (weekly, monthly, all-time)
   * @param limit - Number of entries
   * @returns Leaderboard entries
   */
  async getLeaderboard(
    timeframe: 'weekly' | 'monthly' | 'all-time' = 'weekly',
    limit: number = 50
  ): Promise<LeaderboardEntry[]> {
    try {
      const response = await servicesApi.get<{ leaderboard: LeaderboardEntry[] }>(
        `/api/gamification/leaderboard?timeframe=${timeframe}&limit=${limit}`
      );
      
      const leaderboard = response.leaderboard || [];
      await this.cacheData(CACHE_KEYS.LEADERBOARD, leaderboard);
      return leaderboard;
    } catch (error) {
      console.error('[AchievementService] Error fetching leaderboard:', error);
      return this.getCachedData(CACHE_KEYS.LEADERBOARD) || [];
    }
  }

  /**
   * Get friends leaderboard
   * 
   * @param timeframe - Time period
   * @returns Friends leaderboard
   */
  async getFriendsLeaderboard(
    timeframe: 'weekly' | 'monthly' | 'all-time' = 'weekly'
  ): Promise<LeaderboardEntry[]> {
    try {
      const response = await servicesApi.get<{ leaderboard: LeaderboardEntry[] }>(
        `/api/gamification/leaderboard/friends?timeframe=${timeframe}`
      );
      return response.leaderboard || [];
    } catch (error) {
      console.error('[AchievementService] Error fetching friends leaderboard:', error);
      return [];
    }
  }

  /**
   * Get user's position on leaderboard
   * 
   * @param timeframe - Time period
   * @returns User's rank and nearby users
   */
  async getMyRank(timeframe: 'weekly' | 'monthly' | 'all-time' = 'weekly'): Promise<{
    rank: number;
    points: number;
    nearby: LeaderboardEntry[];
  }> {
    try {
      const response = await servicesApi.get(
        `/api/gamification/leaderboard/me?timeframe=${timeframe}`
      );
      return response as any;
    } catch (error) {
      console.error('[AchievementService] Error fetching rank:', error);
      return { rank: 0, points: 0, nearby: [] };
    }
  }

  // ==========================================
  // CHALLENGES
  // ==========================================

  /**
   * Get active challenges
   * 
   * @returns List of active challenges
   */
  async getActiveChallenges(): Promise<{
    id: string;
    name: string;
    description: string;
    type: 'daily' | 'weekly' | 'special';
    reward: number;
    progress: number;
    target: number;
    expiresAt: string;
  }[]> {
    try {
      const response = await servicesApi.get<{ challenges: any[] }>('/api/challenges/active');
      return response.challenges || [];
    } catch (error) {
      console.error('[AchievementService] Error fetching challenges:', error);
      return [];
    }
  }

  /**
   * Join a challenge
   * 
   * @param challengeId - Challenge ID
   */
  async joinChallenge(challengeId: string): Promise<void> {
    try {
      await servicesApi.post(`/api/challenges/${challengeId}/join`, {});
    } catch (error) {
      console.error('[AchievementService] Error joining challenge:', error);
      throw error;
    }
  }

  // ==========================================
  // CACHE HELPERS
  // ==========================================

  private async cacheData(key: string, data: any): Promise<void> {
    try {
      this.cache.set(key, { data, timestamp: Date.now() });
      await AsyncStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error('[AchievementService] Cache error:', error);
    }
  }

  private getCachedData<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data as T;
    }
    return null;
  }

  /**
   * Load cached data from AsyncStorage on app start
   */
  async loadCachedData(): Promise<void> {
    try {
      const keys = Object.values(CACHE_KEYS);
      for (const key of keys) {
        const data = await AsyncStorage.getItem(key);
        if (data) {
          this.cache.set(key, { data: JSON.parse(data), timestamp: Date.now() });
        }
      }
    } catch (error) {
      console.error('[AchievementService] Error loading cache:', error);
    }
  }

  /**
   * Clear all cached achievement data
   */
  async clearCache(): Promise<void> {
    try {
      this.cache.clear();
      const keys = Object.values(CACHE_KEYS);
      await AsyncStorage.multiRemove(keys);
    } catch (error) {
      console.error('[AchievementService] Error clearing cache:', error);
    }
  }
}

export const achievementService = new AchievementService();

export default achievementService;
