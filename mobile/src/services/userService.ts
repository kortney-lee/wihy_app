/**
 * WIHY User Service
 * Handles user profile, preferences, health metrics, and subscription management
 * 
 * Base URL: https://user.wihy.ai
 * Documentation: docs/WIHY_API_REFERENCE.md
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchWithLogging } from '../utils/apiLogger';

// User Service Configuration
export const USER_SERVICE_CONFIG = {
  baseUrl: 'https://user.wihy.ai',
  endpoints: {
    // User Profile
    userProfile: '/api/users/me',
    updateProfile: '/api/profile',
    userById: '/api/users',
    userByEmail: '/api/users/email',
    userPermissions: '/api/users', // + /:id/permissions
    userDashboard: '/api/users', // + /:id/dashboard
    
    // Preferences & Settings
    preferences: '/api/users', // + /:id/preferences
    settings: '/api/settings',
    
    // Subscription & Plan Management
    updatePlan: '/api/users/me/plan',
    addAddon: '/api/users/me/addons',
    removeAddon: '/api/users/me/addons',
    subscriptionHistory: '/api/users/me/subscriptions',
    capabilities: '/api/users/me/capabilities',
    
    // Health & Stats
    updateHealth: '/api/users/me/health',
    dashboard: '/api/users/me/dashboard',
    
    // Avatar
    uploadAvatar: '/api/profile', // + /:userId/avatar
    
    // Password (for local accounts)
    changePassword: '/api/profile', // + /:userId/change-password
    
    // Family Management
    family: '/api/family',
    familyJoin: '/api/family/join',
    familyMembers: '/api/family/members',
    familyRegenerateCode: '/api/family/regenerate-code',
    familyLeave: '/api/family/leave',
    
    // Goals
    goals: '/api/goals',
    goalsActive: '/api/goals/active',
    goalsStats: '/api/goals/stats',
    
    // Wellness
    wellness: '/api/wellness/logs',
    wellnessSummary: '/api/wellness/summary',
    
    // Progress
    progressPhotos: '/api/progress/photos',
    progressMeasurements: '/api/progress/measurements',
    
    // Coaching
    coaches: '/api/coaches',
    coachesDiscover: '/api/coaches/discover',
  },
};

// Storage keys
const STORAGE_KEYS = {
  SESSION_TOKEN: '@wihy_session_token',
  ACCESS_TOKEN: '@wihy_access_token',
};

// TypeScript Interfaces
export interface UserSettings {
  notificationsEnabled: boolean;
  privacyLevel: 'public' | 'friends' | 'private';
  unitsMetric: boolean;
}

export interface UserPreferences {
  notifications: boolean;
  biometrics: boolean;
  darkMode: boolean;
  analytics: boolean;
  autoScan: boolean;
}

export interface UserCapabilities {
  meals: boolean;
  workouts: boolean;
  family: boolean;
  coachPlatform: boolean;
  wihyAI: boolean;
  instacart: boolean;
  adminDashboard: boolean;
  usageAnalytics: boolean;
  roleManagement: boolean;
  whiteLabel: boolean;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  provider: 'local' | 'google' | 'facebook' | 'microsoft' | 'apple';
  role?: 'USER' | 'COACH' | 'ADMIN' | 'FAMILY_ADMIN';
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  
  // Profile fields (both at root level and in nested profile object)
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other';
  height?: number;
  weight?: number;
  activityLevel?: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  timezone?: string;
  goals?: string[];
  
  // Nested profile object from backend
  profile?: {
    goals?: string[];
    gender?: 'male' | 'female' | 'other';
    height?: number;
    weight?: number;
    is_developer?: boolean;
    activity_level?: string;
    dateOfBirth?: string;
    timezone?: string;
  };
  
  // Subscription & Plan
  plan: string;
  planStatus?: 'active' | 'trial' | 'expired' | 'cancelled';
  planExpiresAt?: string | null;
  addOns?: string[];
  capabilities?: UserCapabilities;
  
  // Family/Coach/Organization
  familyId?: string;
  familyName?: string;
  familyRole?: 'owner' | 'guardian' | 'member' | 'child';
  guardianCode?: string;
  familyMembers?: any[];
  organizationId?: string;
  organizationRole?: string;
  coachId?: string;
  coachName?: string;
  isCoach?: boolean;
  clientCount?: number;
  clients?: any[];
  commissionRate?: number;
  
  // Health Stats
  healthScore?: number;
  streakDays?: number;
  dayStreak?: number;
  scansCount?: number;
  memberSince?: string;
  
  // Metadata
  emailVerified?: boolean;
  lastLogin?: string;
  createdAt?: string;
  preferences?: UserPreferences;
  settings?: UserSettings;
  profile_data?: any;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  error?: string;
  data?: T;
  user?: T;
  profile?: T;
  preferences?: T;
}

class UserService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = USER_SERVICE_CONFIG.baseUrl;
  }

  /**
   * Get authorization headers
   */
  private async getAuthHeaders(): Promise<Record<string, string>> {
    const sessionToken = await AsyncStorage.getItem(STORAGE_KEYS.SESSION_TOKEN);
    const accessToken = await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    } else if (sessionToken) {
      headers['Authorization'] = `Bearer ${sessionToken}`;
    }
    
    return headers;
  }

  // ==========================================
  // USER PROFILE ENDPOINTS
  // ==========================================

  /**
   * Get current user's complete profile with capabilities
   * GET /api/users/me
   */
  async getUserProfile(): Promise<UserProfile | null> {
    const endpoint = `${this.baseUrl}${USER_SERVICE_CONFIG.endpoints.userProfile}`;
    const headers = await this.getAuthHeaders();
    
    console.log('=== GET USER PROFILE ===');
    console.log('Endpoint:', endpoint);
    
    try {
      const response = await fetchWithLogging(endpoint, { headers });
      
      if (response.ok) {
        const data = await response.json();
        const profile: UserProfile = data.user || data.profile || data;
        console.log('User profile retrieved:', profile.email);
        return profile;
      } else {
        console.error('Failed to get user profile:', response.status);
        return null;
      }
    } catch (error) {
      console.error('Get user profile error:', error);
      return null;
    }
  }

  /**
   * Get user by ID
   * GET /api/users/:id
   */
  async getUserById(userId: string): Promise<UserProfile | null> {
    const endpoint = `${this.baseUrl}${USER_SERVICE_CONFIG.endpoints.userById}/${userId}`;
    const headers = await this.getAuthHeaders();
    
    console.log('=== GET USER BY ID ===');
    console.log('User ID:', userId);
    
    try {
      const response = await fetchWithLogging(endpoint, { headers });
      
      if (response.ok) {
        const data = await response.json();
        return data.user || data;
      } else {
        console.error('Failed to get user by ID:', response.status);
        return null;
      }
    } catch (error) {
      console.error('Get user by ID error:', error);
      return null;
    }
  }

  /**
   * Get user by email
   * GET /api/users/email/:email
   */
  async getUserByEmail(email: string): Promise<UserProfile | null> {
    const endpoint = `${this.baseUrl}${USER_SERVICE_CONFIG.endpoints.userByEmail}/${email}`;
    const headers = await this.getAuthHeaders();
    
    console.log('=== GET USER BY EMAIL ===');
    console.log('Email:', email);
    
    try {
      const response = await fetchWithLogging(endpoint, { headers });
      
      if (response.ok) {
        const data = await response.json();
        return data.user || data;
      } else {
        console.error('Failed to get user by email:', response.status);
        return null;
      }
    } catch (error) {
      console.error('Get user by email error:', error);
      return null;
    }
  }

  /**
   * Update user profile information
   * PATCH /api/profile/:userId
   */
  async updateUserProfile(
    userId: string,
    updates: Partial<{
      name: string;
      firstName: string;
      lastName: string;
      email: string;
      avatar: string;
      dateOfBirth: string;
      gender: string;
      height: number;
      weight: number;
      activityLevel: string;
      timezone: string;
      goals: string[];
      healthScore: number;
      dayStreak: number;
      scansCount: number;
      healthPreferences: {
        goals?: string[];
        dietaryPref?: string;
        allergies?: string[];
      };
      onboardingCompleted: boolean;
    }>
  ): Promise<ApiResponse<UserProfile>> {
    const endpoint = `${this.baseUrl}${USER_SERVICE_CONFIG.endpoints.updateProfile}/${userId}`;
    const headers = await this.getAuthHeaders();
    
    console.log('=== UPDATE USER PROFILE ===');
    console.log('Endpoint:', endpoint);
    console.log('Updates:', Object.keys(updates));
    
    try {
      const response = await fetchWithLogging(endpoint, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(updates),
      });

      const data = await response.json();
      
      if (response.ok) {
        console.log('Profile updated successfully');
        return { 
          success: true, 
          data: data.user || data.profile || data,
        };
      } else {
        return { 
          success: false, 
          error: data.error || data.message,
        };
      }
    } catch (error: any) {
      console.error('Update profile error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Upload user avatar
   * POST /api/profile/:userId/avatar
   */
  async uploadAvatar(
    userId: string,
    avatarData: { avatarUrl?: string; avatarBase64?: string }
  ): Promise<ApiResponse<{ avatarUrl: string }>> {
    const endpoint = `${this.baseUrl}${USER_SERVICE_CONFIG.endpoints.uploadAvatar}`.replace('/me/', `/${userId}/`);
    const headers = await this.getAuthHeaders();
    
    console.log('=== UPLOAD AVATAR ===');
    
    try {
      const response = await fetchWithLogging(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(avatarData),
      });

      const data = await response.json();
      
      if (response.ok) {
        return { success: true, data: { avatarUrl: data.avatarUrl } };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error: any) {
      console.error('Upload avatar error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Change password for local accounts
   * POST /api/profile/:userId/change-password
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<ApiResponse> {
    const endpoint = `${this.baseUrl}${USER_SERVICE_CONFIG.endpoints.changePassword}`.replace('/me/', `/${userId}/`);
    const headers = await this.getAuthHeaders();
    
    console.log('=== CHANGE PASSWORD ===');
    
    try {
      const response = await fetchWithLogging(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await response.json();
      
      if (response.ok) {
        return { success: true, message: data.message };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error: any) {
      console.error('Change password error:', error);
      return { success: false, error: error.message };
    }
  }

  // ==========================================
  // USER PREFERENCES ENDPOINTS
  // ==========================================

  /**
   * Get user preferences
   * GET /api/users/:id/preferences
   */
  async getUserPreferences(userId: string): Promise<UserPreferences | null> {
    const endpoint = `${this.baseUrl}/api/users/${userId}/preferences`;
    const headers = await this.getAuthHeaders();
    
    console.log('=== GET USER PREFERENCES ===');
    
    try {
      const response = await fetchWithLogging(endpoint, { headers });
      
      if (response.ok) {
        const data = await response.json();
        return data.preferences || data;
      } else {
        console.error('Failed to get preferences');
        return null;
      }
    } catch (error) {
      console.error('Get preferences error:', error);
      return null;
    }
  }

  /**
   * Update user preferences
   * PUT /api/users/:id/preferences
   */
  async updateUserPreferences(
    userId: string,
    preferences: Partial<UserPreferences>
  ): Promise<ApiResponse<UserPreferences>> {
    const endpoint = `${this.baseUrl}/api/users/${userId}/preferences`;
    const headers = await this.getAuthHeaders();
    
    console.log('=== UPDATE USER PREFERENCES ===');
    console.log('Endpoint:', endpoint);
    
    try {
      const response = await fetchWithLogging(endpoint, {
        method: 'PUT',
        headers,
        body: JSON.stringify(preferences),
      });

      const data = await response.json();
      
      if (response.ok) {
        console.log('Preferences updated successfully');
        return { success: true, data: data.preferences };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error: any) {
      console.error('Update preferences error:', error);
      return { success: false, error: error.message };
    }
  }

  // ==========================================
  // SUBSCRIPTION & PLAN MANAGEMENT
  // ==========================================

  /**
   * Update user's subscription plan
   * PUT /api/users/me/plan
   */
  async updateUserPlan(plan: string): Promise<ApiResponse<UserProfile>> {
    const endpoint = `${this.baseUrl}${USER_SERVICE_CONFIG.endpoints.updatePlan}`;
    const headers = await this.getAuthHeaders();
    
    console.log('=== UPDATE USER PLAN ===');
    console.log('New plan:', plan);
    console.log('Endpoint:', endpoint);
    
    try {
      const response = await fetchWithLogging(endpoint, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ plan }),
      });

      const data = await response.json();
      
      if (response.ok) {
        console.log('Plan updated successfully:', plan);
        return { success: true, data: data.user || data.profile };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error: any) {
      console.error('Update plan error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Add an add-on (AI or Instacart)
   * POST /api/users/me/addons
   */
  async addAddon(addon: 'ai' | 'instacart'): Promise<ApiResponse<UserProfile>> {
    const endpoint = `${this.baseUrl}${USER_SERVICE_CONFIG.endpoints.addAddon}`;
    const headers = await this.getAuthHeaders();
    
    console.log('=== ADD ADDON ===');
    console.log('Addon:', addon);
    console.log('Endpoint:', endpoint);
    
    try {
      const response = await fetchWithLogging(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({ addon }),
      });

      const data = await response.json();
      
      if (response.ok) {
        console.log('Add-on added successfully:', addon);
        return { success: true, data: data.user || data.profile };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error: any) {
      console.error('Add addon error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Remove an add-on
   * DELETE /api/users/me/addons/:addon
   */
  async removeAddon(addon: 'ai' | 'instacart'): Promise<ApiResponse<UserProfile>> {
    const endpoint = `${this.baseUrl}${USER_SERVICE_CONFIG.endpoints.removeAddon}/${addon}`;
    const headers = await this.getAuthHeaders();
    
    console.log('=== REMOVE ADDON ===');
    console.log('Addon:', addon);
    console.log('Endpoint:', endpoint);
    
    try {
      const response = await fetchWithLogging(endpoint, {
        method: 'DELETE',
        headers,
      });

      const data = await response.json();
      
      if (response.ok) {
        console.log('Add-on removed successfully:', addon);
        return { success: true, data: data.user || data.profile };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error: any) {
      console.error('Remove addon error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get subscription history
   * GET /api/users/me/subscriptions
   */
  async getSubscriptionHistory(): Promise<any[]> {
    const endpoint = `${this.baseUrl}${USER_SERVICE_CONFIG.endpoints.subscriptionHistory}`;
    const headers = await this.getAuthHeaders();
    
    console.log('=== GET SUBSCRIPTION HISTORY ===');
    console.log('Endpoint:', endpoint);
    
    try {
      const response = await fetchWithLogging(endpoint, { headers });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Subscription history retrieved');
        return data.subscriptions || [];
      } else {
        console.error('Failed to get subscription history');
        return [];
      }
    } catch (error) {
      console.error('Get subscription history error:', error);
      return [];
    }
  }

  /**
   * Get user capabilities
   * GET /api/users/me/capabilities
   */
  async getUserCapabilities(): Promise<UserCapabilities | null> {
    const endpoint = `${this.baseUrl}${USER_SERVICE_CONFIG.endpoints.capabilities}`;
    const headers = await this.getAuthHeaders();
    
    console.log('=== GET USER CAPABILITIES ===');
    
    try {
      const response = await fetchWithLogging(endpoint, { headers });
      
      if (response.ok) {
        const data = await response.json();
        return data.capabilities || data;
      } else {
        console.error('Failed to get capabilities');
        return null;
      }
    } catch (error) {
      console.error('Get capabilities error:', error);
      return null;
    }
  }

  // ==========================================
  // HEALTH & STATS ENDPOINTS
  // ==========================================

  /**
   * Update health metrics
   * PUT /api/users/me/health
   */
  async updateHealthMetrics(metrics: {
    healthScore?: number;
    streakDays?: number;
    weight?: number;
    height?: number;
    age?: number;
    activityLevel?: string;
  }): Promise<ApiResponse> {
    const endpoint = `${this.baseUrl}${USER_SERVICE_CONFIG.endpoints.updateHealth}`;
    const headers = await this.getAuthHeaders();
    
    console.log('=== UPDATE HEALTH METRICS ===');
    console.log('Endpoint:', endpoint);
    
    try {
      const response = await fetchWithLogging(endpoint, {
        method: 'PUT',
        headers,
        body: JSON.stringify(metrics),
      });

      const data = await response.json();
      
      if (response.ok) {
        console.log('Health metrics updated successfully');
        return { success: true, data: data.metrics || data.user };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error: any) {
      console.error('Update health metrics error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get user dashboard summary
   * GET /api/users/:id/dashboard
   */
  async getUserDashboard(userId: string): Promise<any> {
    const endpoint = `${this.baseUrl}/api/users/${userId}/dashboard`;
    const headers = await this.getAuthHeaders();
    
    console.log('=== GET USER DASHBOARD ===');
    
    try {
      const response = await fetchWithLogging(endpoint, { headers });
      
      if (response.ok) {
        const data = await response.json();
        return data.dashboard || data;
      } else {
        console.error('Failed to get dashboard');
        return null;
      }
    } catch (error) {
      console.error('Get dashboard error:', error);
      return null;
    }
  }

  // ==========================================
  // SETTINGS ENDPOINTS
  // ==========================================

  /**
   * Get user settings
   * GET /api/settings/:userId
   */
  async getSettings(userId: string): Promise<UserSettings | null> {
    const endpoint = `${this.baseUrl}${USER_SERVICE_CONFIG.endpoints.settings}/${userId}`;
    const headers = await this.getAuthHeaders();
    
    console.log('=== GET SETTINGS ===');
    
    try {
      const response = await fetchWithLogging(endpoint, { headers });
      
      if (response.ok) {
        const data = await response.json();
        return data.settings || data;
      } else {
        console.error('Failed to get settings');
        return null;
      }
    } catch (error) {
      console.error('Get settings error:', error);
      return null;
    }
  }

  /**
   * Update user settings
   * PUT /api/settings/:userId
   */
  async updateSettings(
    userId: string,
    settings: Partial<UserSettings>
  ): Promise<ApiResponse<UserSettings>> {
    const endpoint = `${this.baseUrl}${USER_SERVICE_CONFIG.endpoints.settings}/${userId}`;
    const headers = await this.getAuthHeaders();
    
    console.log('=== UPDATE SETTINGS ===');
    
    try {
      const response = await fetchWithLogging(endpoint, {
        method: 'PUT',
        headers,
        body: JSON.stringify(settings),
      });

      const data = await response.json();
      
      if (response.ok) {
        return { success: true, data: data.settings };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error: any) {
      console.error('Update settings error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Toggle notifications
   * PATCH /api/settings/:userId/notifications
   */
  async toggleNotifications(userId: string, enabled: boolean): Promise<ApiResponse> {
    const endpoint = `${this.baseUrl}${USER_SERVICE_CONFIG.endpoints.settings}/${userId}/notifications`;
    const headers = await this.getAuthHeaders();
    
    try {
      const response = await fetchWithLogging(endpoint, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ enabled }),
      });

      const data = await response.json();
      return response.ok ? { success: true, data } : { success: false, error: data.error };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Update privacy level
   * PATCH /api/settings/:userId/privacy
   */
  async updatePrivacy(userId: string, level: 'private' | 'friends' | 'public'): Promise<ApiResponse> {
    const endpoint = `${this.baseUrl}${USER_SERVICE_CONFIG.endpoints.settings}/${userId}/privacy`;
    const headers = await this.getAuthHeaders();
    
    try {
      const response = await fetchWithLogging(endpoint, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ level }),
      });

      const data = await response.json();
      return response.ok ? { success: true, data } : { success: false, error: data.error };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // ==========================================
  // FAMILY ENDPOINTS
  // ==========================================

  /**
   * Get current user's family
   * GET /api/family
   */
  async getFamily(): Promise<any> {
    const endpoint = `${this.baseUrl}${USER_SERVICE_CONFIG.endpoints.family}`;
    const headers = await this.getAuthHeaders();
    
    console.log('=== GET FAMILY ===');
    
    try {
      const response = await fetchWithLogging(endpoint, { headers });
      
      if (response.ok) {
        const data = await response.json();
        return data.data?.family || data.family || null;
      } else {
        return null;
      }
    } catch (error) {
      console.error('Get family error:', error);
      return null;
    }
  }

  /**
   * Create a new family
   * POST /api/family
   */
  async createFamily(name: string): Promise<ApiResponse<any>> {
    const endpoint = `${this.baseUrl}${USER_SERVICE_CONFIG.endpoints.family}`;
    const headers = await this.getAuthHeaders();
    
    console.log('=== CREATE FAMILY ===');
    
    try {
      const response = await fetchWithLogging(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({ name }),
      });

      const data = await response.json();
      
      if (response.ok) {
        return { success: true, data: data.data?.family || data.family };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Join a family using guardian code
   * POST /api/family/join
   */
  async joinFamily(guardianCode: string, role: 'member' | 'child' = 'member'): Promise<ApiResponse<any>> {
    const endpoint = `${this.baseUrl}${USER_SERVICE_CONFIG.endpoints.familyJoin}`;
    const headers = await this.getAuthHeaders();
    
    console.log('=== JOIN FAMILY ===');
    
    try {
      const response = await fetchWithLogging(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({ guardianCode, role }),
      });

      const data = await response.json();
      
      if (response.ok) {
        return { success: true, data: data.data?.family || data.family };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Add a member to family (owner only)
   * POST /api/family/members
   */
  async addFamilyMember(targetUserId: string, role: 'member' | 'child' = 'member'): Promise<ApiResponse<any>> {
    const endpoint = `${this.baseUrl}${USER_SERVICE_CONFIG.endpoints.familyMembers}`;
    const headers = await this.getAuthHeaders();
    
    try {
      const response = await fetchWithLogging(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({ targetUserId, role }),
      });

      const data = await response.json();
      return response.ok ? { success: true, data: data.data?.member } : { success: false, error: data.error };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Remove a member from family (owner only)
   * DELETE /api/family/members/:memberId
   */
  async removeFamilyMember(memberId: string): Promise<ApiResponse> {
    const endpoint = `${this.baseUrl}${USER_SERVICE_CONFIG.endpoints.familyMembers}/${memberId}`;
    const headers = await this.getAuthHeaders();
    
    try {
      const response = await fetchWithLogging(endpoint, {
        method: 'DELETE',
        headers,
      });

      const data = await response.json();
      return response.ok ? { success: true, message: data.message } : { success: false, error: data.error };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Update family settings (owner only)
   * PUT /api/family
   */
  async updateFamily(updates: { name?: string }): Promise<ApiResponse<any>> {
    const endpoint = `${this.baseUrl}${USER_SERVICE_CONFIG.endpoints.family}`;
    const headers = await this.getAuthHeaders();
    
    try {
      const response = await fetchWithLogging(endpoint, {
        method: 'PUT',
        headers,
        body: JSON.stringify(updates),
      });

      const data = await response.json();
      return response.ok ? { success: true, data: data.data?.family } : { success: false, error: data.error };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete family (owner only)
   * DELETE /api/family
   */
  async deleteFamily(): Promise<ApiResponse> {
    const endpoint = `${this.baseUrl}${USER_SERVICE_CONFIG.endpoints.family}`;
    const headers = await this.getAuthHeaders();
    
    try {
      const response = await fetchWithLogging(endpoint, {
        method: 'DELETE',
        headers,
      });

      const data = await response.json();
      return response.ok ? { success: true, message: data.message } : { success: false, error: data.error };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Regenerate guardian code (owner only)
   * POST /api/family/regenerate-code
   */
  async regenerateFamilyCode(): Promise<ApiResponse<{ guardianCode: string; inviteCode: string }>> {
    const endpoint = `${this.baseUrl}${USER_SERVICE_CONFIG.endpoints.familyRegenerateCode}`;
    const headers = await this.getAuthHeaders();
    
    try {
      const response = await fetchWithLogging(endpoint, {
        method: 'POST',
        headers,
      });

      const data = await response.json();
      return response.ok ? { success: true, data: data.data } : { success: false, error: data.error };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Leave current family (for members, not owners)
   * POST /api/family/leave
   */
  async leaveFamily(): Promise<ApiResponse> {
    const endpoint = `${this.baseUrl}${USER_SERVICE_CONFIG.endpoints.familyLeave}`;
    const headers = await this.getAuthHeaders();
    
    try {
      const response = await fetchWithLogging(endpoint, {
        method: 'POST',
        headers,
      });

      const data = await response.json();
      return response.ok ? { success: true, message: data.message } : { success: false, error: data.error };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // ==========================================
  // GOALS ENDPOINTS
  // ==========================================

  /**
   * Create a new goal
   * POST /api/goals
   */
  async createGoal(goal: {
    user_id: string;
    type: string;
    title: string;
    target_value?: number;
    target_date?: string;
    category?: string;
    initial_value?: number;
  }): Promise<ApiResponse<any>> {
    const endpoint = `${this.baseUrl}${USER_SERVICE_CONFIG.endpoints.goals}`;
    const headers = await this.getAuthHeaders();
    
    try {
      const response = await fetchWithLogging(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(goal),
      });

      const data = await response.json();
      return response.ok ? { success: true, data: data.data } : { success: false, error: data.error };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get user's goals
   * GET /api/goals?user_id=xxx
   */
  async getGoals(userId: string, filters?: { status?: string; category?: string; type?: string }): Promise<any[]> {
    const params = new URLSearchParams({ user_id: userId, ...filters });
    const endpoint = `${this.baseUrl}${USER_SERVICE_CONFIG.endpoints.goals}?${params}`;
    const headers = await this.getAuthHeaders();
    
    try {
      const response = await fetchWithLogging(endpoint, { headers });
      
      if (response.ok) {
        const data = await response.json();
        return data.data || [];
      }
      return [];
    } catch (error) {
      console.error('Get goals error:', error);
      return [];
    }
  }

  /**
   * Get active goals
   * GET /api/goals/active?user_id=xxx
   */
  async getActiveGoals(userId: string): Promise<any[]> {
    const endpoint = `${this.baseUrl}${USER_SERVICE_CONFIG.endpoints.goalsActive}?user_id=${userId}`;
    const headers = await this.getAuthHeaders();
    
    try {
      const response = await fetchWithLogging(endpoint, { headers });
      
      if (response.ok) {
        const data = await response.json();
        return data.data || [];
      }
      return [];
    } catch (error) {
      console.error('Get active goals error:', error);
      return [];
    }
  }

  /**
   * Get goal statistics
   * GET /api/goals/stats?user_id=xxx
   */
  async getGoalStats(userId: string): Promise<any> {
    const endpoint = `${this.baseUrl}${USER_SERVICE_CONFIG.endpoints.goalsStats}?user_id=${userId}`;
    const headers = await this.getAuthHeaders();
    
    try {
      const response = await fetchWithLogging(endpoint, { headers });
      
      if (response.ok) {
        const data = await response.json();
        return data.data || null;
      }
      return null;
    } catch (error) {
      console.error('Get goal stats error:', error);
      return null;
    }
  }

  /**
   * Get a single goal
   * GET /api/goals/:id
   */
  async getGoal(goalId: string): Promise<any> {
    const endpoint = `${this.baseUrl}${USER_SERVICE_CONFIG.endpoints.goals}/${goalId}`;
    const headers = await this.getAuthHeaders();
    
    try {
      const response = await fetchWithLogging(endpoint, { headers });
      
      if (response.ok) {
        const data = await response.json();
        return data.data || null;
      }
      return null;
    } catch (error) {
      console.error('Get goal error:', error);
      return null;
    }
  }

  /**
   * Update a goal
   * PUT /api/goals/:id
   */
  async updateGoal(goalId: string, updates: Partial<any>): Promise<ApiResponse<any>> {
    const endpoint = `${this.baseUrl}${USER_SERVICE_CONFIG.endpoints.goals}/${goalId}`;
    const headers = await this.getAuthHeaders();
    
    try {
      const response = await fetchWithLogging(endpoint, {
        method: 'PUT',
        headers,
        body: JSON.stringify(updates),
      });

      const data = await response.json();
      return response.ok ? { success: true, data: data.data } : { success: false, error: data.error };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete a goal
   * DELETE /api/goals/:id
   */
  async deleteGoal(goalId: string): Promise<ApiResponse> {
    const endpoint = `${this.baseUrl}${USER_SERVICE_CONFIG.endpoints.goals}/${goalId}`;
    const headers = await this.getAuthHeaders();
    
    try {
      const response = await fetchWithLogging(endpoint, {
        method: 'DELETE',
        headers,
      });

      const data = await response.json();
      return response.ok ? { success: true, message: data.message } : { success: false, error: data.error };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Log progress for a goal
   * POST /api/goals/:id/progress
   */
  async logGoalProgress(goalId: string, value: number, date?: string, notes?: string): Promise<ApiResponse<any>> {
    const endpoint = `${this.baseUrl}${USER_SERVICE_CONFIG.endpoints.goals}/${goalId}/progress`;
    const headers = await this.getAuthHeaders();
    
    try {
      const response = await fetchWithLogging(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({ value, date: date || new Date().toISOString().split('T')[0], notes }),
      });

      const data = await response.json();
      return response.ok ? { success: true, data: data.data } : { success: false, error: data.error };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Mark a goal as complete
   * POST /api/goals/:id/complete
   */
  async completeGoal(goalId: string, notes?: string): Promise<ApiResponse<any>> {
    const endpoint = `${this.baseUrl}${USER_SERVICE_CONFIG.endpoints.goals}/${goalId}/complete`;
    const headers = await this.getAuthHeaders();
    
    try {
      const response = await fetchWithLogging(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({ completion_notes: notes }),
      });

      const data = await response.json();
      return response.ok ? { success: true, data: data.data } : { success: false, error: data.error };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // ==========================================
  // WELLNESS ENDPOINTS
  // ==========================================

  /**
   * Submit daily wellness data
   * POST /api/wellness/logs
   */
  async logWellness(log: {
    userId: string;
    date?: string;
    sleepHours?: number;
    steps?: number;
    mood?: number;
    bpSystolic?: number;
    bpDiastolic?: number;
    hydrationCups?: number;
    weightKg?: number;
  }): Promise<ApiResponse<any>> {
    const endpoint = `${this.baseUrl}${USER_SERVICE_CONFIG.endpoints.wellness}`;
    const headers = await this.getAuthHeaders();
    
    try {
      const response = await fetchWithLogging(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          ...log,
          date: log.date || new Date().toISOString().split('T')[0],
        }),
      });

      const data = await response.json();
      return response.ok ? { success: true, data: data.log } : { success: false, error: data.error };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get wellness summary
   * GET /api/wellness/summary/:userId?days=7
   */
  async getWellnessSummary(userId: string, days: number = 7): Promise<any> {
    const endpoint = `${this.baseUrl}${USER_SERVICE_CONFIG.endpoints.wellnessSummary}/${userId}?days=${days}`;
    const headers = await this.getAuthHeaders();
    
    try {
      const response = await fetchWithLogging(endpoint, { headers });
      
      if (response.ok) {
        const data = await response.json();
        return data.summary || data;
      }
      return null;
    } catch (error) {
      console.error('Get wellness summary error:', error);
      return null;
    }
  }

  /**
   * Get wellness logs
   * GET /api/wellness/logs/:userId?limit=14
   */
  async getWellnessLogs(userId: string, limit: number = 14): Promise<any[]> {
    const endpoint = `${this.baseUrl}${USER_SERVICE_CONFIG.endpoints.wellness}/${userId}?limit=${limit}`;
    const headers = await this.getAuthHeaders();
    
    try {
      const response = await fetchWithLogging(endpoint, { headers });
      
      if (response.ok) {
        const data = await response.json();
        return data.logs || [];
      }
      return [];
    } catch (error) {
      console.error('Get wellness logs error:', error);
      return [];
    }
  }

  /**
   * Delete a wellness log
   * DELETE /api/wellness/logs/:userId/:date
   */
  async deleteWellnessLog(userId: string, date: string): Promise<ApiResponse> {
    const endpoint = `${this.baseUrl}${USER_SERVICE_CONFIG.endpoints.wellness}/${userId}/${date}`;
    const headers = await this.getAuthHeaders();
    
    try {
      const response = await fetchWithLogging(endpoint, {
        method: 'DELETE',
        headers,
      });

      const data = await response.json();
      return response.ok ? { success: true, message: data.message } : { success: false, error: data.error };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // ==========================================
  // COACH DISCOVERY ENDPOINTS
  // ==========================================

  /**
   * Search and filter available coaches
   * GET /api/coaches/discover
   */
  async discoverCoaches(filters?: {
    search?: string;
    specialty?: string;
    city?: string;
    location?: string; // backward compatible: maps to city
    min_rating?: number;
    max_price?: number;
    accepting_clients?: boolean;
    sort?: 'rating' | 'price' | 'experience';
    limit?: number;
    offset?: number;
    page?: number; // backward compatible: converted to offset when limit present
  }): Promise<{ coaches: any[]; pagination: any }> {
    const params = new URLSearchParams();
    if (filters) {
      const {
        search,
        specialty,
        city,
        location,
        min_rating,
        max_price,
        accepting_clients,
        sort,
        limit,
        offset,
        page,
      } = filters;

      if (search !== undefined) params.append('search', String(search));
      if (specialty !== undefined) params.append('specialty', String(specialty));
      const cityParam = city || location;
      if (cityParam !== undefined) params.append('city', String(cityParam));
      if (min_rating !== undefined) params.append('min_rating', String(min_rating));
      if (max_price !== undefined) params.append('max_price', String(max_price));
      if (accepting_clients !== undefined) params.append('accepting_clients', String(accepting_clients));
      if (sort !== undefined) params.append('sort', String(sort));
      if (limit !== undefined) params.append('limit', String(limit));
      const derivedOffset = offset ?? (page !== undefined && limit ? (page - 1) * limit : undefined);
      if (derivedOffset !== undefined) params.append('offset', String(derivedOffset));
    }

    const endpoint = `${this.baseUrl}${USER_SERVICE_CONFIG.endpoints.coachesDiscover}?${params}`;
    const headers = await this.getAuthHeaders();
    
    try {
      const response = await fetchWithLogging(endpoint, { headers });
      
      if (response.ok) {
        const data = await response.json();
        return {
          coaches: data.data?.coaches || data.data || data.coaches || [],
          pagination: data.data?.pagination || data.pagination || { total: data.total, limit: data.limit, offset: data.offset },
        };
      }
      return { coaches: [], pagination: {} };
    } catch (error) {
      console.error('Discover coaches error:', error);
      return { coaches: [], pagination: {} };
    }
  }

  /**
   * Get detailed coach profile
   * GET /api/coaches/:coachId/profile
   */
  async getCoachProfile(coachId: string): Promise<any> {
    const endpoint = `${this.baseUrl}${USER_SERVICE_CONFIG.endpoints.coaches}/${coachId}/profile`;
    const headers = await this.getAuthHeaders();
    
    try {
      const response = await fetchWithLogging(endpoint, { headers });
      
      if (response.ok) {
        const data = await response.json();
        return data.data || null;
      }
      return null;
    } catch (error) {
      console.error('Get coach profile error:', error);
      return null;
    }
  }

  /**
   * Book a session with coach
   * POST /api/coaches/:coachId/bookings
   */
  async bookCoachSession(
    coachId: string,
    booking: {
      scheduled_at?: string;
      scheduledAt?: string; // backward compatible
      duration_minutes: number;
      session_type: string;
      notes?: string;
      price?: number;
      client_id?: string;
    }
  ): Promise<ApiResponse<any>> {
    const scheduledAt = booking.scheduled_at || booking.scheduledAt;
    if (!scheduledAt) {
      return { success: false, error: 'scheduled_at is required' };
    }

    const endpoint = `${this.baseUrl}${USER_SERVICE_CONFIG.endpoints.coaches}/${coachId}/bookings`;
    const headers = await this.getAuthHeaders();
    
    try {
      const response = await fetchWithLogging(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          scheduled_at: scheduledAt,
          duration_minutes: booking.duration_minutes,
          session_type: booking.session_type,
          notes: booking.notes,
          price: booking.price,
          client_id: booking.client_id,
        }),
      });

      const data = await response.json();
      return response.ok ? { success: true, data: data.data || data } : { success: false, error: data.error || data.message };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Client-led request to a coach
   * POST /api/coaches/:coachId/invite-client
   */
  async requestCoaching(
    coachId: string,
    payload: { client_id: string; message?: string; preferred_frequency?: string }
  ): Promise<ApiResponse<any>> {
    const endpoint = `${this.baseUrl}${USER_SERVICE_CONFIG.endpoints.coaches}/${coachId}/invite-client`;
    const headers = await this.getAuthHeaders();

    try {
      const response = await fetchWithLogging(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      return response.ok ? { success: true, data: data.data || data } : { success: false, error: data.error || data.message };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Coach-led invitation to a client
   * POST /api/coaches/:coachId/send-invitation
   */
  async sendCoachInvitation(
    coachId: string,
    payload: { client_email: string; client_name?: string; message?: string }
  ): Promise<ApiResponse<any>> {
    const endpoint = `${this.baseUrl}${USER_SERVICE_CONFIG.endpoints.coaches}/${coachId}/send-invitation`;
    const headers = await this.getAuthHeaders();

    try {
      const response = await fetchWithLogging(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      return response.ok ? { success: true, data: data.data || data } : { success: false, error: data.error || data.message };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Client accepts an invitation from a coach
   * POST /api/coaches/:coachId/accept-invitation
   */
  async acceptCoachInvitation(
    coachId: string,
    payload: { invitation_id: string; client_id: string }
  ): Promise<ApiResponse<any>> {
    const endpoint = `${this.baseUrl}${USER_SERVICE_CONFIG.endpoints.coaches}/${coachId}/accept-invitation`;
    const headers = await this.getAuthHeaders();

    try {
      const response = await fetchWithLogging(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      return response.ok ? { success: true, data: data.data || data } : { success: false, error: data.error || data.message };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // ==========================================
  // COACH MANAGEMENT ENDPOINTS (FOR COACHES)
  // ==========================================

  /**
   * Create coach profile
   * POST /api/coaches
   * 
   * REQUIRED fields:
   * - name: Coach's display name
   * - specialty: Coach's expertise area (e.g., "nutrition", "fitness", "wellness")
   * 
   * NOTE: Plan and commission are handled separately:
   * - Plan: via Payment Service /api/payment/coaches/subscription
   * - Commission: via Admin API (admin-only)
   */
  async createCoach(
    coachData: CreateCoachInput
  ): Promise<ApiResponse<Coach>> {
    const endpoint = `${this.baseUrl}${USER_SERVICE_CONFIG.endpoints.coaches}`;
    const headers = await this.getAuthHeaders();
    
    console.log('=== CREATE COACH PROFILE ===');
    console.log('Coach data:', JSON.stringify(coachData, null, 2));
    
    try {
      const response = await fetchWithLogging(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(coachData),
      });

      const data = await response.json();
      
      if (response.ok) {
        console.log('Coach profile created:', data.data?.id);
        return { success: true, data: data.data };
      } else {
        console.error('Coach creation failed:', data);
        return { 
          success: false, 
          error: data.error || 'Failed to create coach profile',
          message: data.hint || data.message 
        };
      }
    } catch (error: any) {
      console.error('Create coach error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get coach profile by ID
   * GET /api/coaches/:coachId
   */
  async getCoach(coachId: string): Promise<Coach | null> {
    const endpoint = `${this.baseUrl}${USER_SERVICE_CONFIG.endpoints.coaches}/${coachId}`;
    const headers = await this.getAuthHeaders();
    
    console.log('=== GET COACH PROFILE ===');
    
    try {
      const response = await fetchWithLogging(endpoint, { headers });
      
      if (response.ok) {
        const coach = await response.json();
        console.log('Coach profile retrieved:', coach.name);
        return coach;
      } else {
        console.error('Failed to get coach profile');
        return null;
      }
    } catch (error) {
      console.error('Get coach error:', error);
      return null;
    }
  }

  /**
   * Update coach profile
   * PUT /api/coaches/:coachId
   */
  async updateCoach(
    coachId: string,
    updates: { commissionRate?: number }
  ): Promise<ApiResponse<Coach>> {
    const endpoint = `${this.baseUrl}${USER_SERVICE_CONFIG.endpoints.coaches}/${coachId}`;
    const headers = await this.getAuthHeaders();
    
    console.log('=== UPDATE COACH PROFILE ===');
    
    try {
      const response = await fetchWithLogging(endpoint, {
        method: 'PUT',
        headers,
        body: JSON.stringify(updates),
      });

      const data = await response.json();
      
      if (response.ok) {
        console.log('Coach profile updated');
        return { success: true, data: data.coach };
      } else {
        return { success: false, error: data.error, message: data.message };
      }
    } catch (error: any) {
      console.error('Update coach error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Add client to coach roster
   * POST /api/coaches/:coachId/clients
   */
  async addCoachClient(
    coachId: string,
    clientId: string
  ): Promise<ApiResponse<CoachClient>> {
    const endpoint = `${this.baseUrl}${USER_SERVICE_CONFIG.endpoints.coaches}/${coachId}/clients`;
    const headers = await this.getAuthHeaders();
    
    console.log('=== ADD COACH CLIENT ===');
    
    try {
      const response = await fetchWithLogging(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({ clientId }),
      });

      const data = await response.json();
      
      if (response.ok) {
        console.log('Client added to coach roster');
        return { success: true, data: data.client };
      } else {
        return { success: false, error: data.error, message: data.message };
      }
    } catch (error: any) {
      console.error('Add coach client error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Remove client from coach roster
   * DELETE /api/coaches/:coachId/clients/:clientId
   */
  async removeCoachClient(
    coachId: string,
    clientId: string
  ): Promise<ApiResponse> {
    const endpoint = `${this.baseUrl}${USER_SERVICE_CONFIG.endpoints.coaches}/${coachId}/clients/${clientId}`;
    const headers = await this.getAuthHeaders();
    
    console.log('=== REMOVE COACH CLIENT ===');
    
    try {
      const response = await fetchWithLogging(endpoint, {
        method: 'DELETE',
        headers,
      });

      const data = await response.json();
      
      if (response.ok) {
        console.log('Client removed from coach roster');
        return { success: true, message: data.message };
      } else {
        return { success: false, error: data.error, message: data.message };
      }
    } catch (error: any) {
      console.error('Remove coach client error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * List coach clients
   * GET /api/coaches/:coachId/clients
   */
  async listCoachClients(coachId: string): Promise<{
    coachId: string;
    clients: CoachClient[];
    totalClients: number;
    activeClients: number;
  } | null> {
    const endpoint = `${this.baseUrl}${USER_SERVICE_CONFIG.endpoints.coaches}/${coachId}/clients`;
    const headers = await this.getAuthHeaders();
    
    console.log('=== LIST COACH CLIENTS ===');
    
    try {
      const response = await fetchWithLogging(endpoint, { headers });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Coach clients retrieved:', data.totalClients);
        return data;
      } else {
        console.error('Failed to list coach clients');
        return null;
      }
    } catch (error) {
      console.error('List coach clients error:', error);
      return null;
    }
  }

  /**
   * Get coach revenue analytics
   * GET /api/coaches/:coachId/revenue
   */
  async getCoachRevenue(coachId: string): Promise<any | null> {
    const endpoint = `${this.baseUrl}${USER_SERVICE_CONFIG.endpoints.coaches}/${coachId}/revenue`;
    const headers = await this.getAuthHeaders();
    
    console.log('=== GET COACH REVENUE ===');
    
    try {
      const response = await fetchWithLogging(endpoint, { headers });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Coach revenue retrieved');
        return data;
      } else {
        console.error('Failed to get coach revenue');
        return null;
      }
    } catch (error) {
      console.error('Get coach revenue error:', error);
      return null;
    }
  }

  /**
   * Connect Stripe account for payouts
   * POST /api/coaches/:coachId/stripe
   */
  async connectCoachStripe(
    coachId: string,
    stripeAccountId: string
  ): Promise<ApiResponse<Coach>> {
    const endpoint = `${this.baseUrl}${USER_SERVICE_CONFIG.endpoints.coaches}/${coachId}/stripe`;
    const headers = await this.getAuthHeaders();
    
    console.log('=== CONNECT COACH STRIPE ===');
    
    try {
      const response = await fetchWithLogging(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({ stripeAccountId }),
      });

      const data = await response.json();
      
      if (response.ok) {
        console.log('Stripe account connected');
        return { success: true, data: data.coach };
      } else {
        return { success: false, error: data.error, message: data.message };
      }
    } catch (error: any) {
      console.error('Connect coach Stripe error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get coach payout history
   * GET /api/coaches/:coachId/payouts
   */
  async getCoachPayouts(coachId: string): Promise<any | null> {
    const endpoint = `${this.baseUrl}${USER_SERVICE_CONFIG.endpoints.coaches}/${coachId}/payouts`;
    const headers = await this.getAuthHeaders();
    
    console.log('=== GET COACH PAYOUTS ===');
    
    try {
      const response = await fetchWithLogging(endpoint, { headers });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Coach payouts retrieved');
        return data;
      } else {
        console.error('Failed to get coach payouts');
        return null;
      }
    } catch (error) {
      console.error('Get coach payouts error:', error);
      return null;
    }
  }

  // ==========================================
  // FAMILY EXTENDED ENDPOINTS
  // ==========================================

  /**
   * Get family by ID (for guardians viewing existing family)
   * GET /api/family/:familyId
   */
  async getFamilyById(familyId: string): Promise<any> {
    const endpoint = `${this.baseUrl}${USER_SERVICE_CONFIG.endpoints.family}/${familyId}`;
    const headers = await this.getAuthHeaders();
    
    console.log('=== GET FAMILY BY ID ===');
    console.log('Family ID:', familyId);
    
    try {
      const response = await fetchWithLogging(endpoint, { headers });
      
      if (response.ok) {
        const data = await response.json();
        return data.data?.family || data.family || data;
      } else {
        return null;
      }
    } catch (error) {
      console.error('Get family by ID error:', error);
      return null;
    }
  }

  /**
   * List family members
   * GET /api/family/:familyId/members
   */
  async listFamilyMembers(familyId: string): Promise<{ members: any[] } | null> {
    const endpoint = `${this.baseUrl}${USER_SERVICE_CONFIG.endpoints.family}/${familyId}/members`;
    const headers = await this.getAuthHeaders();
    
    console.log('=== LIST FAMILY MEMBERS ===');
    
    try {
      const response = await fetchWithLogging(endpoint, { headers });
      
      if (response.ok) {
        const data = await response.json();
        return { members: data.data?.members || data.members || [] };
      } else {
        return null;
      }
    } catch (error) {
      console.error('List family members error:', error);
      return null;
    }
  }

  /**
   * Remove family member by ID (guardian action)
   * DELETE /api/family/:familyId/members/:memberId
   */
  async removeFamilyMemberById(familyId: string, memberId: string): Promise<ApiResponse> {
    const endpoint = `${this.baseUrl}${USER_SERVICE_CONFIG.endpoints.family}/${familyId}/members/${memberId}`;
    const headers = await this.getAuthHeaders();
    
    console.log('=== REMOVE FAMILY MEMBER ===');
    
    try {
      const response = await fetchWithLogging(endpoint, {
        method: 'DELETE',
        headers,
      });

      const data = await response.json();
      return response.ok ? { success: true, message: data.message } : { success: false, error: data.error };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get guardian code for family
   * GET /api/family/:familyId/guardian-code
   */
  async getGuardianCode(familyId: string): Promise<{ guardianCode: string } | null> {
    const endpoint = `${this.baseUrl}${USER_SERVICE_CONFIG.endpoints.family}/${familyId}/guardian-code`;
    const headers = await this.getAuthHeaders();
    
    console.log('=== GET GUARDIAN CODE ===');
    
    try {
      const response = await fetchWithLogging(endpoint, { headers });
      
      if (response.ok) {
        const data = await response.json();
        return { guardianCode: data.guardianCode || data.guardian_code || data.data?.guardianCode };
      } else {
        return null;
      }
    } catch (error) {
      console.error('Get guardian code error:', error);
      return null;
    }
  }

  /**
   * Regenerate guardian code for family
   * POST /api/family/:familyId/regenerate-code
   */
  async regenerateGuardianCode(familyId: string): Promise<ApiResponse<{ guardianCode: string; guardian_code?: string }>> {
    const endpoint = `${this.baseUrl}${USER_SERVICE_CONFIG.endpoints.family}/${familyId}/regenerate-code`;
    const headers = await this.getAuthHeaders();
    
    console.log('=== REGENERATE GUARDIAN CODE ===');
    
    try {
      const response = await fetchWithLogging(endpoint, {
        method: 'POST',
        headers,
      });

      const data = await response.json();
      if (response.ok) {
        return { 
          success: true, 
          data: { 
            guardianCode: data.guardianCode || data.guardian_code || data.data?.guardianCode,
            guardian_code: data.guardian_code || data.guardianCode || data.data?.guardian_code,
          }
        };
      }
      return { success: false, error: data.error };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}

// Coach interface for management
export interface Coach {
  id: string;
  userId?: string;
  name: string;
  title?: string;
  specialty: string;
  bio?: string;
  credentials?: string;
  experience_years?: number;
  years_experience?: number;
  session_rate?: number;
  currency?: string;
  phone?: string;
  city?: string;
  state?: string;
  country?: string;
  location?: {
    city?: string;
    state?: string;
    country?: string;
  };
  rates?: {
    session_rate?: number;
    currency?: string;
  };
  avatar_url?: string;
  profile_complete?: boolean;
  accepting_clients?: boolean;
  plan?: string;
  commissionRate?: number;
  totalRevenue?: number;
  clientCount?: number;
  stripeConnectAccountId?: string;
  isVerified?: boolean;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
}

// Coach creation input
export interface CreateCoachInput {
  name: string;                    // REQUIRED - Coach's display name
  specialty: string;                // REQUIRED - Coach's expertise area (e.g., "nutrition", "fitness")
  title?: string;                   // Optional - Professional title
  bio?: string;                     // Optional - Bio/description
  location?: {                      // Optional - Location
    city?: string;
    state?: string;
    country?: string;
  };
  phone?: string;                   // Optional - Contact phone
  rates?: {                         // Optional - Session pricing
    session_rate?: number;
    currency?: string;
  };
  credentials?: string;             // Optional - Professional credentials
  experience_years?: number;        // Optional - Years of experience
  avatar_url?: string;              // Optional - Profile avatar URL
}

// Coach client interface
export interface CoachClient {
  clientId: string;
  name?: string;
  email?: string;
  plan?: string;
  healthScore?: number;
  startedAt: string;
  isActive: boolean;
}

// Export singleton instance
export const userService = new UserService();
export default userService;
