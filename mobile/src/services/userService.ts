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
    
    // Preferences
    preferences: '/api/users/me/preferences',
    
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
    uploadAvatar: '/api/profile/me/avatar',
    
    // Password (for local accounts)
    changePassword: '/api/profile/me/change-password',
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
  
  // Profile fields
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other';
  height?: number;
  weight?: number;
  activityLevel?: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  timezone?: string;
  goals?: string[];
  
  // Subscription & Plan
  plan: string;
  planStatus?: 'active' | 'trial' | 'expired' | 'cancelled';
  planExpiresAt?: string;
  addOns?: string[];
  capabilities: UserCapabilities;
  role?: string;
  status?: string;
  
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
   * PUT /api/profile/:userId
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
    }>
  ): Promise<ApiResponse<UserProfile>> {
    const endpoint = `${this.baseUrl}${USER_SERVICE_CONFIG.endpoints.updateProfile}/${userId}`;
    const headers = await this.getAuthHeaders();
    
    console.log('=== UPDATE USER PROFILE ===');
    console.log('Endpoint:', endpoint);
    console.log('Updates:', Object.keys(updates));
    
    try {
      const response = await fetchWithLogging(endpoint, {
        method: 'PUT',
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
}

// Export singleton instance
export const userService = new UserService();
export default userService;
