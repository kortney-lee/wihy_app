/**
 * WIHY Authentication Service
 * Handles OAuth2, local auth, and session management
 * 
 * KEY PRINCIPLE: Clients only need their own client_id
 * ==========================================
 * - Your app uses: wihy_native_2025 (client_id only)
 * - Auth service handles ALL OAuth provider configurations (Google, Facebook, Microsoft)
 * - Auth service manages provider client IDs, secrets, endpoints
 * - Your app simply redirects to auth service endpoints
 * - Auth service returns session_token via deep link
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { WIHY_NATIVE_CLIENT_ID } from '@env';
import { fetchWithLogging } from '../utils/apiLogger';

// Auth configuration - Only your client credentials needed
export const AUTH_CONFIG = {
  baseUrl: 'https://auth.wihy.ai',
  clientId: WIHY_NATIVE_CLIENT_ID || 'wihy_native_2025',
  // SECURITY: Mobile apps are PUBLIC clients - NEVER use client secret
  // OAuth flow: Auth service handles ALL provider configurations server-side
  // Mobile receives session_token directly via redirect (PKCE flow)
  redirectUri: 'wihy://auth/callback',
  scopes: ['profile', 'email', 'health_data', 'offline_access'],
  endpoints: {
    // Authentication
    health: '/api/health',
    providers: '/api/auth/providers',
    login: '/api/auth/login',
    register: '/api/auth/register',
    googleAuth: '/api/auth/google',
    facebookAuth: '/api/auth/facebook',
    microsoftAuth: '/api/auth/microsoft',
    appleAuth: '/api/auth/apple',
    verify: '/api/auth/verify',
    logout: '/api/auth/logout',
    forgotPassword: '/api/auth/forgot-password',
    
    // User Management
    userProfile: '/api/users/me',
    updateProfile: '/api/users/me',
    updatePreferences: '/api/users/me/preferences',
    updatePlan: '/api/users/me/plan',
    addAddon: '/api/users/me/addons',
    removeAddon: '/api/users/me/addons',
    updateHealth: '/api/users/me/health',
    subscriptionHistory: '/api/users/me/subscriptions',
    userCapabilities: '/api/users/me/capabilities',
    
    // Plans
    plans: '/api/plans',
    planDetails: '/api/plans',
    
    // Organizations
    organizations: '/api/organizations',
    organizationDetails: '/api/organizations',
    updateOrganization: '/api/organizations',
    addOrgUser: '/api/organizations',
    removeOrgUser: '/api/organizations',
    updateOrgUserRole: '/api/organizations',
    listOrgMembers: '/api/organizations',
    orgAnalytics: '/api/organizations',
    updateOrgBranding: '/api/organizations',
    orgBilling: '/api/organizations',
    
    // Families
    families: '/api/families',
    familyDetails: '/api/families',
    updateFamily: '/api/families',
    joinFamily: '/api/families/join',
    removeFamilyMember: '/api/families',
    listFamilyMembers: '/api/families',
    guardianCode: '/api/families',
    regenerateCode: '/api/families',
    leaveFamily: '/api/families/leave',
    
    // Coaches
    coaches: '/api/coaches',
    coachDetails: '/api/coaches',
    updateCoach: '/api/coaches',
    addClient: '/api/coaches',
    removeClient: '/api/coaches',
    listClients: '/api/coaches',
    coachRevenue: '/api/coaches',
    connectStripe: '/api/coaches',
    payoutHistory: '/api/coaches',
    
    // OAuth2 Server
    oauthAuthorize: '/api/oauth/authorize',
    oauthToken: '/api/oauth/token',
    userInfo: '/api/oauth/userinfo',
  },
};

// Storage keys
const STORAGE_KEYS = {
  SESSION_TOKEN: '@wihy_session_token',
  ACCESS_TOKEN: '@wihy_access_token',
  REFRESH_TOKEN: '@wihy_refresh_token',
  USER_DATA: '@wihy_user_data',
  TOKEN_EXPIRY: '@wihy_token_expiry',
};

export interface UserData {
  email: string;
  name: string;
  provider: 'local' | 'google' | 'facebook' | 'microsoft';
  profile_data?: any;
  id?: string;
}

export interface LoginResponse {
  success: boolean;
  session_token?: string;  // Legacy field
  token?: string;          // Per spec: JWT token
  expiresIn?: number;      // Per spec: token expiration in seconds
  user?: UserData;
  message?: string;
  error?: string;
}

// Registration options per spec
export interface RegistrationOptions {
  phone?: string;
  plan?: string;
  referralCode?: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
}

// User Profile & Capabilities
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

export interface UserPreferences {
  notifications: boolean;
  biometrics: boolean;
  darkMode: boolean;
  analytics: boolean;
  autoScan: boolean;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  picture?: string;
  provider: 'local' | 'google' | 'facebook' | 'microsoft';
  plan: string;
  addOns?: string[];
  capabilities: UserCapabilities;
  familyId?: string;
  familyRole?: string;
  guardianCode?: string;
  organizationId?: string;
  organizationRole?: string;
  coachId?: string;
  commissionRate?: number;
  healthScore?: number;
  streakDays?: number;
  memberSince?: string;
  preferences?: UserPreferences;
}

// Plans
export interface PlanDetails {
  name: string;
  displayName: string;
  price: number;
  interval: string;
  description: string;
  features: string[];
  capabilities: UserCapabilities;
  limits?: {
    familyMembers?: number;
    requestsPerHour?: number;
    aiMessagesPerDay?: number;
  };
}

// Organizations
export interface Organization {
  id: string;
  name: string;
  type: string;
  plan: string;
  licenseCount: number;
  activeUsers: number;
  contactEmail: string;
  contactPhone?: string;
  billingEmail: string;
  whiteLabelConfig?: {
    logo?: string;
    primaryColor?: string;
    secondaryColor?: string;
    appName?: string;
  };
  customDomain?: string;
  contractStartDate?: string;
  contractEndDate?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface OrganizationMember {
  userId: string;
  email?: string;
  name?: string;
  role: string;
  joinedAt: string;
  isActive: boolean;
}

// Families
export interface Family {
  id: string;
  ownerId: string;
  name: string;
  plan: string;
  memberLimit: number;
  memberCount?: number;
  guardianCode: string;
  createdAt: string;
  updatedAt?: string;
}

export interface FamilyMember {
  userId: string;
  name?: string;
  email?: string;
  role: string;
  healthScore?: number;
  streakDays?: number;
  joinedAt: string;
}

// Coaches
export interface Coach {
  id: string;
  userId: string;
  name?: string;
  email?: string;
  plan: string;
  commissionRate: number;
  totalRevenue: number;
  clientCount: number;
  stripeConnectAccountId?: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CoachClient {
  clientId: string;
  name?: string;
  email?: string;
  plan?: string;
  healthScore?: number;
  startedAt: string;
  isActive: boolean;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface HealthCheckResponse {
  status: string;
  encryption: string;
  timestamp: string;
  providers: {
    local: boolean;
    oauth: string[];
    oauth2: boolean;
  };
  oauth2_server?: {
    grant_types_supported: string[];
    response_types_supported: string[];
    scopes_supported: string[];
    registered_clients: number;
    client_ids: string[];
    token_endpoint: string;
    authorization_endpoint: string;
    userinfo_endpoint: string;
  };
}

class AuthService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = AUTH_CONFIG.baseUrl;
  }

  /**
   * Login user with email/password
   */
  async login(
    email: string,
    password: string
  ): Promise<LoginResponse> {
    const startTime = Date.now();
    const endpoint = `${this.baseUrl}${AUTH_CONFIG.endpoints.login}`;
    
    console.log('=== LOGIN API CALL ===');
    console.log('Endpoint:', endpoint);
    console.log('Email:', email);
    
    try {
      const body = { email, password };
      
      const response = await fetchWithLogging(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const responseTime = Date.now() - startTime;
      console.log(`Response Status: ${response.status} (${responseTime}ms)`);

      const data = await response.json();
      console.log('Response Data:', JSON.stringify(data, null, 2));

      if (response.ok && data.success) {
        // Store session token and user data
        // Handle both 'token' (per spec) and 'session_token' (legacy) formats
        const authToken = data.token || data.session_token;
        if (authToken) {
          await this.storeSessionToken(authToken);
          
          // Store token expiry if provided
          if (data.expiresIn) {
            const expiryTime = Date.now() + (data.expiresIn * 1000);
            await AsyncStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRY, expiryTime.toString());
          }
        }
        if (data.user) {
          await this.storeUserData(data.user);
        }
        
        console.log('=== LOGIN SUCCESS ===');
        return data;
      } else {
        console.log('=== LOGIN FAILED ===');
        return {
          success: false,
          error: data.error || data.message || 'Login failed',
        };
      }
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      console.error('=== LOGIN ERROR ===');
      console.error('Error after', responseTime, 'ms:', error);
      console.error('Error message:', error.message);
      
      return {
        success: false,
        error: error.message || 'Network error during login',
      };
    }
  }

  /**
   * Register new user
   */
  async register(
    email: string,
    password: string,
    name: string,
    options?: RegistrationOptions
  ): Promise<LoginResponse> {
    const startTime = Date.now();
    const endpoint = `${this.baseUrl}${AUTH_CONFIG.endpoints.register}`;
    
    console.log('=== REGISTER API CALL ===');
    console.log('Endpoint:', endpoint);
    console.log('Email:', email);
    console.log('Name:', name);
    if (options?.plan) console.log('Plan:', options.plan);
    
    try {
      // Build request body per API spec
      const body: any = { 
        email, 
        password, 
        name,
        terms_accepted: true,  // Required by API
        ...(options?.phone && { phone: options.phone }),
        ...(options?.plan && { plan: options.plan }),
        ...(options?.referralCode && { referralCode: options.referralCode }),
      };
      
      const response = await fetchWithLogging(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const responseTime = Date.now() - startTime;
      console.log(`Response Status: ${response.status} (${responseTime}ms)`);

      const data = await response.json();
      console.log('Response Data:', JSON.stringify(data, null, 2));

      if (response.ok && data.success) {
        // Store session token and user data
        // Handle both 'token' (per spec) and 'session_token' (legacy) formats
        const authToken = data.token || data.session_token;
        if (authToken) {
          await this.storeSessionToken(authToken);
          
          // Store token expiry if provided
          if (data.expiresIn) {
            const expiryTime = Date.now() + (data.expiresIn * 1000);
            await AsyncStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRY, expiryTime.toString());
          }
        }
        if (data.user) {
          await this.storeUserData(data.user);
        }
        
        console.log('=== LOCAL REGISTER SUCCESS ===');
        return data;
      } else {
        console.log('=== REGISTER FAILED ===');
        return {
          success: false,
          error: data.error || data.message || 'Registration failed',
        };
      }
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      console.error('=== REGISTER ERROR ===');
      console.error('Error after', responseTime, 'ms:', error);
      
      return {
        success: false,
        error: error.message || 'Network error during registration',
      };
    }
  }

  /**
   * Register account after successful Stripe payment
   * This creates an account linked to an existing payment session
   * Per subscription flow: Email → Stripe checkout → Password creation
   */
  async registerAfterPayment(
    email: string,
    password: string,
    options: {
      planId: string;
      stripeSessionId?: string;
    }
  ): Promise<LoginResponse> {
    const startTime = Date.now();
    // Use a dedicated endpoint for post-payment registration
    const endpoint = `${this.baseUrl}/api/auth/register-after-payment`;
    
    console.log('=== REGISTER AFTER PAYMENT API CALL ===');
    console.log('Endpoint:', endpoint);
    console.log('Email:', email);
    console.log('Plan ID:', options.planId);
    console.log('Stripe Session:', options.stripeSessionId);
    
    try {
      const body = { 
        email, 
        password, 
        planId: options.planId,
        stripeSessionId: options.stripeSessionId,
      };
      
      const response = await fetchWithLogging(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const responseTime = Date.now() - startTime;
      console.log(`Response Status: ${response.status} (${responseTime}ms)`);

      const data = await response.json();
      console.log('Response Data:', JSON.stringify(data, null, 2));

      if (response.ok && data.success) {
        // Store session token and user data
        const authToken = data.token || data.session_token;
        if (authToken) {
          await this.storeSessionToken(authToken);
          
          if (data.expiresIn) {
            const expiryTime = Date.now() + (data.expiresIn * 1000);
            await AsyncStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRY, expiryTime.toString());
          }
        }
        if (data.user) {
          await this.storeUserData(data.user);
        }
        
        console.log('=== REGISTER AFTER PAYMENT SUCCESS ===');
        return data;
      } else {
        console.log('=== REGISTER AFTER PAYMENT FAILED ===');
        return {
          success: false,
          error: data.error || data.message || 'Account creation failed',
        };
      }
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      console.error('=== REGISTER AFTER PAYMENT ERROR ===');
      console.error('Error after', responseTime, 'ms:', error);
      
      return {
        success: false,
        error: error.message || 'Network error during account creation',
      };
    }
  }

  /**
   * Get OAuth authorization URL for mobile redirect flow
   * Auth service handles OAuth provider exchange and redirects back with session_token
   */
  getOAuthUrl(
    provider: 'google' | 'facebook' | 'microsoft' | 'apple',
    state?: string
  ): string {
    const stateParam = state || this.generateState();
    const redirectUri = encodeURIComponent(AUTH_CONFIG.redirectUri);
    const scope = encodeURIComponent(AUTH_CONFIG.scopes.join(' '));
    
    let endpoint: string;
    switch (provider) {
      case 'google':
        endpoint = AUTH_CONFIG.endpoints.googleAuth;
        break;
      case 'facebook':
        endpoint = AUTH_CONFIG.endpoints.facebookAuth;
        break;
      case 'microsoft':
        endpoint = AUTH_CONFIG.endpoints.microsoftAuth;
        break;
      case 'apple':
        endpoint = AUTH_CONFIG.endpoints.appleAuth;
        break;
    }
    
    // For mobile: auth service will handle OAuth and redirect back with session_token
    const url = `${this.baseUrl}${endpoint}?` +
      `client_id=${AUTH_CONFIG.clientId}&` +
      `redirect_uri=${redirectUri}&` +
      `scope=${scope}&` +
      `state=${stateParam}`;
    
    console.log(`=== OAUTH ${provider.toUpperCase()} URL GENERATED ===`);
    console.log('URL:', url);
    console.log('Note: Auth service will redirect back with session_token');
    
    return url;
  }

  /**
   * OAuth2 Authorization Code Flow - Get authorization URL
   */
  getAuthorizationUrl(state?: string): string {
    const stateParam = state || this.generateState();
    const redirectUri = encodeURIComponent(AUTH_CONFIG.redirectUri);
    const scope = encodeURIComponent(AUTH_CONFIG.scopes.join(' '));
    
    const url = `${this.baseUrl}${AUTH_CONFIG.endpoints.oauthAuthorize}?` +
      `response_type=code&` +
      `client_id=${AUTH_CONFIG.clientId}&` +
      `redirect_uri=${redirectUri}&` +
      `scope=${scope}&` +
      `state=${stateParam}`;
    
    console.log('=== OAUTH2 AUTHORIZATION URL ===');
    console.log('URL:', url);
    
    return url;
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForToken(
    code: string,
    clientSecret?: string
  ): Promise<TokenResponse | null> {
    const startTime = Date.now();
    const endpoint = `${this.baseUrl}${AUTH_CONFIG.endpoints.oauthToken}`;
    
    console.log('=== OAUTH TOKEN EXCHANGE ===');
    console.log('Endpoint:', endpoint);
    console.log('Code:', code.substring(0, 20) + '...');
    
    try {
      const body = new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: AUTH_CONFIG.clientId,
        code,
        redirect_uri: AUTH_CONFIG.redirectUri,
      });
      
      // Add client secret if provided (should be from secure storage)
      if (clientSecret) {
        body.append('client_secret', clientSecret);
      }
      
      const response = await fetchWithLogging(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      });

      const responseTime = Date.now() - startTime;
      console.log(`Response Status: ${response.status} (${responseTime}ms)`);

      if (response.ok) {
        const data: TokenResponse = await response.json();
        console.log('Token received, expires in:', data.expires_in);
        
        // Store tokens
        await this.storeTokens(data);
        
        console.log('=== OAUTH TOKEN EXCHANGE SUCCESS ===');
        return data;
      } else {
        const error = await response.text();
        console.error('=== OAUTH TOKEN EXCHANGE FAILED ===');
        console.error('Error:', error);
        return null;
      }
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      console.error('=== OAUTH TOKEN EXCHANGE ERROR ===');
      console.error('Error after', responseTime, 'ms:', error);
      return null;
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(): Promise<TokenResponse | null> {
    const refreshToken = await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    
    if (!refreshToken) {
      console.log('No refresh token available');
      return null;
    }
    
    const startTime = Date.now();
    const endpoint = `${this.baseUrl}${AUTH_CONFIG.endpoints.oauthToken}`;
    
    console.log('=== REFRESH TOKEN API CALL ===');
    console.log('Endpoint:', endpoint);
    
    try {
      const body = new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: AUTH_CONFIG.clientId,
        refresh_token: refreshToken,
      });
      
      const response = await fetchWithLogging(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      });

      const responseTime = Date.now() - startTime;
      console.log(`Response Status: ${response.status} (${responseTime}ms)`);

      if (response.ok) {
        const data: TokenResponse = await response.json();
        
        // Store new tokens
        await this.storeTokens(data);
        
        console.log('=== REFRESH TOKEN SUCCESS ===');
        return data;
      } else {
        console.error('=== REFRESH TOKEN FAILED ===');
        return null;
      }
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      console.error('=== REFRESH TOKEN ERROR ===');
      console.error('Error after', responseTime, 'ms:', error);
      return null;
    }
  }

  /**
   * Verify current session/token
   */
  async verifySession(): Promise<{ valid: boolean; user?: UserData }> {
    const sessionToken = await this.getSessionToken();
    
    if (!sessionToken) {
      return { valid: false };
    }
    
    const endpoint = `${this.baseUrl}${AUTH_CONFIG.endpoints.verify}`;
    
    console.log('=== VERIFY SESSION ===');
    console.log('Endpoint:', endpoint);
    
    try {
      const response = await fetchWithLogging(endpoint, {
        headers: {
          'Authorization': `Bearer ${sessionToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Session valid:', data.valid);
        
        if (data.user) {
          await this.storeUserData(data.user);
        }
        
        return data;
      } else {
        console.log('Session invalid');
        return { valid: false };
      }
    } catch (error) {
      console.error('Session verification error:', error);
      return { valid: false };
    }
  }

  /**
   * Get user info using access token
   */
  async getUserInfo(): Promise<UserData | null> {
    const accessToken = await this.getAccessToken();
    
    if (!accessToken) {
      console.log('No access token available');
      return null;
    }
    
    const endpoint = `${this.baseUrl}${AUTH_CONFIG.endpoints.userInfo}`;
    
    console.log('=== GET USER INFO ===');
    console.log('Endpoint:', endpoint);
    
    try {
      const response = await fetchWithLogging(endpoint, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        const user: UserData = await response.json();
        await this.storeUserData(user);
        console.log('User info retrieved:', user.email);
        return user;
      } else {
        console.log('Failed to get user info');
        return null;
      }
    } catch (error) {
      console.error('Get user info error:', error);
      return null;
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    const sessionToken = await this.getSessionToken();
    
    console.log('=== LOGOUT ===');
    
    if (sessionToken) {
      const endpoint = `${this.baseUrl}${AUTH_CONFIG.endpoints.logout}`;
      
      try {
        await fetchWithLogging(endpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${sessionToken}`,
          },
        });
        console.log('Server logout successful');
      } catch (error) {
        console.error('Server logout error:', error);
      }
    }
    
    // Clear all stored data
    await this.clearAllData();
    console.log('Local data cleared');
  }

  /**
   * Check service health
   */
  async checkHealth(): Promise<any> {
    const endpoint = `${this.baseUrl}${AUTH_CONFIG.endpoints.health}`;
    
    try {
      const response = await fetchWithLogging(endpoint);
      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (error) {
      console.error('Health check error:', error);
      return null;
    }
  }

  /**
   * Get available auth providers
   */
  async getProviders(): Promise<string[]> {
    const endpoint = `${this.baseUrl}${AUTH_CONFIG.endpoints.providers}`;
    
    try {
      const response = await fetchWithLogging(endpoint);
      if (response.ok) {
        const data = await response.json();
        return data.providers || [];
      }
      return [];
    } catch (error) {
      console.error('Get providers error:', error);
      return [];
    }
  }

  // === Storage Methods ===

  async storeSessionToken(token: string): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.SESSION_TOKEN, token);
    console.log('Session token stored');
  }

  private async storeTokens(tokens: TokenResponse): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, tokens.access_token);
    
    if (tokens.refresh_token) {
      await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokens.refresh_token);
    }
    
    // Store expiry time
    const expiryTime = Date.now() + (tokens.expires_in * 1000);
    await AsyncStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRY, expiryTime.toString());
  }

  private async storeUserData(user: UserData): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
  }

  async getSessionToken(): Promise<string | null> {
    return await AsyncStorage.getItem(STORAGE_KEYS.SESSION_TOKEN);
  }

  async getAccessToken(): Promise<string | null> {
    return await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  }

  async getRefreshToken(): Promise<string | null> {
    return await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  }

  async getUserData(): Promise<UserData | null> {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
    return data ? JSON.parse(data) : null;
  }

  async isTokenExpired(): Promise<boolean> {
    const expiryStr = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRY);
    if (!expiryStr) return true;
    
    const expiry = parseInt(expiryStr);
    return Date.now() >= expiry;
  }

  private async clearAllData(): Promise<void> {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.SESSION_TOKEN,
      STORAGE_KEYS.ACCESS_TOKEN,
      STORAGE_KEYS.REFRESH_TOKEN,
      STORAGE_KEYS.USER_DATA,
      STORAGE_KEYS.TOKEN_EXPIRY,
    ]);
  }

  // === Utility Methods ===

  private generateState(): string {
    return Math.random().toString(36).substring(2, 15) +
           Math.random().toString(36).substring(2, 15);
  }

  /**
   * Get authenticated request headers
   */
  async getAuthHeaders(): Promise<HeadersInit> {
    const accessToken = await this.getAccessToken();
    const sessionToken = await this.getSessionToken();
    
    const headers: HeadersInit = {
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
  // USER MANAGEMENT ENDPOINTS
  // ==========================================

  /**
   * Get current user's profile with capabilities
   */
  async getUserProfile(): Promise<UserProfile | null> {
    const endpoint = `${this.baseUrl}${AUTH_CONFIG.endpoints.userProfile}`;
    const headers = await this.getAuthHeaders();
    
    console.log('=== GET USER PROFILE ===');
    
    try {
      const response = await fetchWithLogging(endpoint, { headers });
      
      if (response.ok) {
        const profile: UserProfile = await response.json();
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
   * Update user profile information
   */
  async updateUserProfile(updates: {
    name?: string;
    picture?: string;
  }): Promise<ApiResponse<UserProfile>> {
    const endpoint = `${this.baseUrl}${AUTH_CONFIG.endpoints.updateProfile}`;
    const headers = await this.getAuthHeaders();
    
    console.log('=== UPDATE USER PROFILE ===');
    
    try {
      const response = await fetchWithLogging(endpoint, {
        method: 'PUT',
        headers,
        body: JSON.stringify(updates),
      });

      const data = await response.json();
      
      if (response.ok) {
        console.log('Profile updated successfully');
        return { success: true, data: data.user };
      } else {
        return { success: false, error: data.error, message: data.message };
      }
    } catch (error: any) {
      console.error('Update profile error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update user preferences
   */
  async updateUserPreferences(
    preferences: Partial<UserPreferences>
  ): Promise<ApiResponse<UserPreferences>> {
    const endpoint = `${this.baseUrl}${AUTH_CONFIG.endpoints.updatePreferences}`;
    const headers = await this.getAuthHeaders();
    
    console.log('=== UPDATE USER PREFERENCES ===');
    
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
        return { success: false, error: data.error, message: data.message };
      }
    } catch (error: any) {
      console.error('Update preferences error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Change user's subscription plan
   */
  async updateUserPlan(plan: string): Promise<ApiResponse<UserProfile>> {
    const endpoint = `${this.baseUrl}${AUTH_CONFIG.endpoints.updatePlan}`;
    const headers = await this.getAuthHeaders();
    
    console.log('=== UPDATE USER PLAN ===');
    console.log('New plan:', plan);
    
    try {
      const response = await fetchWithLogging(endpoint, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ plan }),
      });

      const data = await response.json();
      
      if (response.ok) {
        console.log('Plan updated successfully:', plan);
        return { success: true, data: data.user };
      } else {
        return { success: false, error: data.error, message: data.message };
      }
    } catch (error: any) {
      console.error('Update plan error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Add an add-on (AI or Instacart)
   */
  async addAddon(addon: 'ai' | 'instacart'): Promise<ApiResponse<UserProfile>> {
    const endpoint = `${this.baseUrl}${AUTH_CONFIG.endpoints.addAddon}`;
    const headers = await this.getAuthHeaders();
    
    console.log('=== ADD ADDON ===');
    console.log('Addon:', addon);
    
    try {
      const response = await fetchWithLogging(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({ addon }),
      });

      const data = await response.json();
      
      if (response.ok) {
        console.log('Add-on added successfully:', addon);
        return { success: true, data: data.user };
      } else {
        return { success: false, error: data.error, message: data.message };
      }
    } catch (error: any) {
      console.error('Add addon error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Remove an add-on
   */
  async removeAddon(addon: 'ai' | 'instacart'): Promise<ApiResponse<UserProfile>> {
    const endpoint = `${this.baseUrl}${AUTH_CONFIG.endpoints.removeAddon}/${addon}`;
    const headers = await this.getAuthHeaders();
    
    console.log('=== REMOVE ADDON ===');
    console.log('Addon:', addon);
    
    try {
      const response = await fetchWithLogging(endpoint, {
        method: 'DELETE',
        headers,
      });

      const data = await response.json();
      
      if (response.ok) {
        console.log('Add-on removed successfully:', addon);
        return { success: true, data: data.user };
      } else {
        return { success: false, error: data.error, message: data.message };
      }
    } catch (error: any) {
      console.error('Remove addon error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update health metrics
   */
  async updateHealthMetrics(metrics: {
    healthScore?: number;
    streakDays?: number;
    weight?: number;
    height?: number;
    age?: number;
    activityLevel?: string;
  }): Promise<ApiResponse> {
    const endpoint = `${this.baseUrl}${AUTH_CONFIG.endpoints.updateHealth}`;
    const headers = await this.getAuthHeaders();
    
    console.log('=== UPDATE HEALTH METRICS ===');
    
    try {
      const response = await fetchWithLogging(endpoint, {
        method: 'PUT',
        headers,
        body: JSON.stringify(metrics),
      });

      const data = await response.json();
      
      if (response.ok) {
        console.log('Health metrics updated successfully');
        return { success: true, data: data.metrics };
      } else {
        return { success: false, error: data.error, message: data.message };
      }
    } catch (error: any) {
      console.error('Update health metrics error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get subscription history
   */
  async getSubscriptionHistory(): Promise<any[]> {
    const endpoint = `${this.baseUrl}${AUTH_CONFIG.endpoints.subscriptionHistory}`;
    const headers = await this.getAuthHeaders();
    
    console.log('=== GET SUBSCRIPTION HISTORY ===');
    
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
   */
  async getUserCapabilities(): Promise<{
    plan: string;
    addOns: string[];
    capabilities: UserCapabilities;
    rateLimit?: any;
  } | null> {
    const endpoint = `${this.baseUrl}${AUTH_CONFIG.endpoints.userCapabilities}`;
    const headers = await this.getAuthHeaders();
    
    console.log('=== GET USER CAPABILITIES ===');
    
    try {
      const response = await fetchWithLogging(endpoint, { headers });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Capabilities retrieved for plan:', data.plan);
        return data;
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
  // PLAN ENDPOINTS
  // ==========================================

  /**
   * List all available plans
   */
  async listPlans(): Promise<PlanDetails[]> {
    const endpoint = `${this.baseUrl}${AUTH_CONFIG.endpoints.plans}`;
    
    console.log('=== LIST PLANS ===');
    
    try {
      const response = await fetchWithLogging(endpoint);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Plans retrieved:', data.plans.length);
        return data.plans || [];
      } else {
        console.error('Failed to list plans');
        return [];
      }
    } catch (error) {
      console.error('List plans error:', error);
      return [];
    }
  }

  /**
   * Get plan details
   */
  async getPlanDetails(planName: string): Promise<PlanDetails | null> {
    const endpoint = `${this.baseUrl}${AUTH_CONFIG.endpoints.planDetails}/${planName}`;
    
    console.log('=== GET PLAN DETAILS ===');
    console.log('Plan:', planName);
    
    try {
      const response = await fetchWithLogging(endpoint);
      
      if (response.ok) {
        const plan: PlanDetails = await response.json();
        console.log('Plan details retrieved:', plan.displayName);
        return plan;
      } else {
        console.error('Failed to get plan details');
        return null;
      }
    } catch (error) {
      console.error('Get plan details error:', error);
      return null;
    }
  }

  // ==========================================
  // ORGANIZATION ENDPOINTS
  // ==========================================

  /**
   * Create organization
   */
  async createOrganization(org: {
    name: string;
    type: string;
    plan: string;
    licenseCount: number;
    contactEmail: string;
    contactPhone?: string;
    billingEmail: string;
  }): Promise<ApiResponse<Organization>> {
    const endpoint = `${this.baseUrl}${AUTH_CONFIG.endpoints.organizations}`;
    const headers = await this.getAuthHeaders();
    
    console.log('=== CREATE ORGANIZATION ===');
    console.log('Organization:', org.name);
    
    try {
      const response = await fetchWithLogging(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(org),
      });

      const data = await response.json();
      
      if (response.ok) {
        console.log('Organization created:', data.organization.id);
        return { success: true, data: data.organization };
      } else {
        return { success: false, error: data.error, message: data.message };
      }
    } catch (error: any) {
      console.error('Create organization error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get organization details
   */
  async getOrganization(orgId: string): Promise<Organization | null> {
    const endpoint = `${this.baseUrl}${AUTH_CONFIG.endpoints.organizationDetails}/${orgId}`;
    const headers = await this.getAuthHeaders();
    
    console.log('=== GET ORGANIZATION ===');
    console.log('Organization ID:', orgId);
    
    try {
      const response = await fetchWithLogging(endpoint, { headers });
      
      if (response.ok) {
        const org: Organization = await response.json();
        console.log('Organization retrieved:', org.name);
        return org;
      } else {
        console.error('Failed to get organization');
        return null;
      }
    } catch (error) {
      console.error('Get organization error:', error);
      return null;
    }
  }

  /**
   * Update organization
   */
  async updateOrganization(
    orgId: string,
    updates: Partial<Organization>
  ): Promise<ApiResponse<Organization>> {
    const endpoint = `${this.baseUrl}${AUTH_CONFIG.endpoints.updateOrganization}/${orgId}`;
    const headers = await this.getAuthHeaders();
    
    console.log('=== UPDATE ORGANIZATION ===');
    
    try {
      const response = await fetchWithLogging(endpoint, {
        method: 'PUT',
        headers,
        body: JSON.stringify(updates),
      });

      const data = await response.json();
      
      if (response.ok) {
        console.log('Organization updated');
        return { success: true, data: data.organization };
      } else {
        return { success: false, error: data.error, message: data.message };
      }
    } catch (error: any) {
      console.error('Update organization error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Add user to organization
   */
  async addOrganizationUser(
    orgId: string,
    userId: string,
    role: string
  ): Promise<ApiResponse<OrganizationMember>> {
    const endpoint = `${this.baseUrl}${AUTH_CONFIG.endpoints.addOrgUser}/${orgId}/users`;
    const headers = await this.getAuthHeaders();
    
    console.log('=== ADD ORGANIZATION USER ===');
    
    try {
      const response = await fetchWithLogging(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({ userId, role }),
      });

      const data = await response.json();
      
      if (response.ok) {
        console.log('User added to organization');
        return { success: true, data: data.member };
      } else {
        return { success: false, error: data.error, message: data.message };
      }
    } catch (error: any) {
      console.error('Add organization user error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Remove user from organization
   */
  async removeOrganizationUser(
    orgId: string,
    userId: string
  ): Promise<ApiResponse> {
    const endpoint = `${this.baseUrl}${AUTH_CONFIG.endpoints.removeOrgUser}/${orgId}/users/${userId}`;
    const headers = await this.getAuthHeaders();
    
    console.log('=== REMOVE ORGANIZATION USER ===');
    
    try {
      const response = await fetchWithLogging(endpoint, {
        method: 'DELETE',
        headers,
      });

      const data = await response.json();
      
      if (response.ok) {
        console.log('User removed from organization');
        return { success: true, message: data.message };
      } else {
        return { success: false, error: data.error, message: data.message };
      }
    } catch (error: any) {
      console.error('Remove organization user error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update organization user role
   */
  async updateOrganizationUserRole(
    orgId: string,
    userId: string,
    role: string
  ): Promise<ApiResponse<OrganizationMember>> {
    const endpoint = `${this.baseUrl}${AUTH_CONFIG.endpoints.updateOrgUserRole}/${orgId}/users/${userId}/role`;
    const headers = await this.getAuthHeaders();
    
    console.log('=== UPDATE ORGANIZATION USER ROLE ===');
    
    try {
      const response = await fetchWithLogging(endpoint, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ role }),
      });

      const data = await response.json();
      
      if (response.ok) {
        console.log('User role updated');
        return { success: true, data: data.member };
      } else {
        return { success: false, error: data.error, message: data.message };
      }
    } catch (error: any) {
      console.error('Update organization user role error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * List organization members
   */
  async listOrganizationMembers(orgId: string): Promise<{
    members: OrganizationMember[];
    totalMembers: number;
    activeMembers: number;
    licenseCount: number;
  } | null> {
    const endpoint = `${this.baseUrl}${AUTH_CONFIG.endpoints.listOrgMembers}/${orgId}/users`;
    const headers = await this.getAuthHeaders();
    
    console.log('=== LIST ORGANIZATION MEMBERS ===');
    
    try {
      const response = await fetchWithLogging(endpoint, { headers });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Organization members retrieved:', data.totalMembers);
        return data;
      } else {
        console.error('Failed to list organization members');
        return null;
      }
    } catch (error) {
      console.error('List organization members error:', error);
      return null;
    }
  }

  /**
   * Get organization analytics
   */
  async getOrganizationAnalytics(orgId: string): Promise<any | null> {
    const endpoint = `${this.baseUrl}${AUTH_CONFIG.endpoints.orgAnalytics}/${orgId}/analytics`;
    const headers = await this.getAuthHeaders();
    
    console.log('=== GET ORGANIZATION ANALYTICS ===');
    
    try {
      const response = await fetchWithLogging(endpoint, { headers });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Organization analytics retrieved');
        return data;
      } else {
        console.error('Failed to get organization analytics');
        return null;
      }
    } catch (error) {
      console.error('Get organization analytics error:', error);
      return null;
    }
  }

  /**
   * Update organization branding
   */
  async updateOrganizationBranding(
    orgId: string,
    branding: {
      logo?: string;
      primaryColor?: string;
      secondaryColor?: string;
      appName?: string;
      customDomain?: string;
      supportEmail?: string;
      termsUrl?: string;
      privacyUrl?: string;
    }
  ): Promise<ApiResponse> {
    const endpoint = `${this.baseUrl}${AUTH_CONFIG.endpoints.updateOrgBranding}/${orgId}/branding`;
    const headers = await this.getAuthHeaders();
    
    console.log('=== UPDATE ORGANIZATION BRANDING ===');
    
    try {
      const response = await fetchWithLogging(endpoint, {
        method: 'PUT',
        headers,
        body: JSON.stringify(branding),
      });

      const data = await response.json();
      
      if (response.ok) {
        console.log('Organization branding updated');
        return { success: true, data: data.branding };
      } else {
        return { success: false, error: data.error, message: data.message };
      }
    } catch (error: any) {
      console.error('Update organization branding error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get organization billing
   */
  async getOrganizationBilling(orgId: string): Promise<any | null> {
    const endpoint = `${this.baseUrl}${AUTH_CONFIG.endpoints.orgBilling}/${orgId}/billing`;
    const headers = await this.getAuthHeaders();
    
    console.log('=== GET ORGANIZATION BILLING ===');
    
    try {
      const response = await fetchWithLogging(endpoint, { headers });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Organization billing retrieved');
        return data;
      } else {
        console.error('Failed to get organization billing');
        return null;
      }
    } catch (error) {
      console.error('Get organization billing error:', error);
      return null;
    }
  }

  // ==========================================
  // FAMILY ENDPOINTS
  // ==========================================

  /**
   * Create family
   */
  async createFamily(name: string, plan: string): Promise<ApiResponse<Family>> {
    const endpoint = `${this.baseUrl}${AUTH_CONFIG.endpoints.families}`;
    const headers = await this.getAuthHeaders();
    
    console.log('=== CREATE FAMILY ===');
    console.log('Family:', name);
    
    try {
      const response = await fetchWithLogging(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({ name, plan }),
      });

      const data = await response.json();
      
      if (response.ok) {
        console.log('Family created:', data.family.id);
        return { success: true, data: data.family };
      } else {
        return { success: false, error: data.error, message: data.message };
      }
    } catch (error: any) {
      console.error('Create family error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get family details
   */
  async getFamily(familyId: string): Promise<Family | null> {
    const endpoint = `${this.baseUrl}${AUTH_CONFIG.endpoints.familyDetails}/${familyId}`;
    const headers = await this.getAuthHeaders();
    
    console.log('=== GET FAMILY ===');
    console.log('Family ID:', familyId);
    
    try {
      const response = await fetchWithLogging(endpoint, { headers });
      
      if (response.ok) {
        const family: Family = await response.json();
        console.log('Family retrieved:', family.name);
        return family;
      } else {
        console.error('Failed to get family');
        return null;
      }
    } catch (error) {
      console.error('Get family error:', error);
      return null;
    }
  }

  /**
   * Update family
   */
  async updateFamily(
    familyId: string,
    updates: { name?: string }
  ): Promise<ApiResponse<Family>> {
    const endpoint = `${this.baseUrl}${AUTH_CONFIG.endpoints.updateFamily}/${familyId}`;
    const headers = await this.getAuthHeaders();
    
    console.log('=== UPDATE FAMILY ===');
    
    try {
      const response = await fetchWithLogging(endpoint, {
        method: 'PUT',
        headers,
        body: JSON.stringify(updates),
      });

      const data = await response.json();
      
      if (response.ok) {
        console.log('Family updated');
        return { success: true, data: data.family };
      } else {
        return { success: false, error: data.error, message: data.message };
      }
    } catch (error: any) {
      console.error('Update family error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Join family with guardian code
   */
  async joinFamily(guardianCode: string): Promise<ApiResponse<Family>> {
    const endpoint = `${this.baseUrl}${AUTH_CONFIG.endpoints.joinFamily}`;
    const headers = await this.getAuthHeaders();
    
    console.log('=== JOIN FAMILY ===');
    console.log('Guardian Code:', guardianCode);
    
    try {
      const response = await fetchWithLogging(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({ guardianCode }),
      });

      const data = await response.json();
      
      if (response.ok) {
        console.log('Joined family:', data.family.name);
        return { success: true, data: data.family };
      } else {
        return { success: false, error: data.error, message: data.message };
      }
    } catch (error: any) {
      console.error('Join family error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Remove family member
   */
  async removeFamilyMember(
    familyId: string,
    userId: string
  ): Promise<ApiResponse> {
    const endpoint = `${this.baseUrl}${AUTH_CONFIG.endpoints.removeFamilyMember}/${familyId}/members/${userId}`;
    const headers = await this.getAuthHeaders();
    
    console.log('=== REMOVE FAMILY MEMBER ===');
    
    try {
      const response = await fetchWithLogging(endpoint, {
        method: 'DELETE',
        headers,
      });

      const data = await response.json();
      
      if (response.ok) {
        console.log('Member removed from family');
        return { success: true, message: data.message };
      } else {
        return { success: false, error: data.error, message: data.message };
      }
    } catch (error: any) {
      console.error('Remove family member error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * List family members
   */
  async listFamilyMembers(familyId: string): Promise<{
    familyId: string;
    members: FamilyMember[];
    totalMembers: number;
    memberLimit: number;
  } | null> {
    const endpoint = `${this.baseUrl}${AUTH_CONFIG.endpoints.listFamilyMembers}/${familyId}/members`;
    const headers = await this.getAuthHeaders();
    
    console.log('=== LIST FAMILY MEMBERS ===');
    
    try {
      const response = await fetchWithLogging(endpoint, { headers });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Family members retrieved:', data.totalMembers);
        return data;
      } else {
        console.error('Failed to list family members');
        return null;
      }
    } catch (error) {
      console.error('List family members error:', error);
      return null;
    }
  }

  /**
   * Get guardian code
   */
  async getGuardianCode(familyId: string): Promise<{
    familyId: string;
    guardianCode: string;
    createdAt: string;
  } | null> {
    const endpoint = `${this.baseUrl}${AUTH_CONFIG.endpoints.guardianCode}/${familyId}/code`;
    const headers = await this.getAuthHeaders();
    
    console.log('=== GET GUARDIAN CODE ===');
    
    try {
      const response = await fetchWithLogging(endpoint, { headers });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Guardian code retrieved:', data.guardianCode);
        return data;
      } else {
        console.error('Failed to get guardian code');
        return null;
      }
    } catch (error) {
      console.error('Get guardian code error:', error);
      return null;
    }
  }

  /**
   * Regenerate guardian code
   */
  async regenerateGuardianCode(familyId: string): Promise<ApiResponse> {
    const endpoint = `${this.baseUrl}${AUTH_CONFIG.endpoints.regenerateCode}/${familyId}/code`;
    const headers = await this.getAuthHeaders();
    
    console.log('=== REGENERATE GUARDIAN CODE ===');
    
    try {
      const response = await fetchWithLogging(endpoint, {
        method: 'POST',
        headers,
      });

      const data = await response.json();
      
      if (response.ok) {
        console.log('Guardian code regenerated:', data.guardianCode);
        return { success: true, data };
      } else {
        return { success: false, error: data.error, message: data.message };
      }
    } catch (error: any) {
      console.error('Regenerate guardian code error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Leave family
   */
  async leaveFamily(): Promise<ApiResponse> {
    const endpoint = `${this.baseUrl}${AUTH_CONFIG.endpoints.leaveFamily}`;
    const headers = await this.getAuthHeaders();
    
    console.log('=== LEAVE FAMILY ===');
    
    try {
      const response = await fetchWithLogging(endpoint, {
        method: 'POST',
        headers,
      });

      const data = await response.json();
      
      if (response.ok) {
        console.log('Left family successfully');
        return { success: true, message: data.message };
      } else {
        return { success: false, error: data.error, message: data.message };
      }
    } catch (error: any) {
      console.error('Leave family error:', error);
      return { success: false, error: error.message };
    }
  }

  // ==========================================
  // COACH ENDPOINTS
  // ==========================================

  /**
   * Create coach profile
   */
  async createCoach(
    plan: string,
    commissionRate: number
  ): Promise<ApiResponse<Coach>> {
    const endpoint = `${this.baseUrl}${AUTH_CONFIG.endpoints.coaches}`;
    const headers = await this.getAuthHeaders();
    
    console.log('=== CREATE COACH PROFILE ===');
    
    try {
      const response = await fetchWithLogging(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({ plan, commissionRate }),
      });

      const data = await response.json();
      
      if (response.ok) {
        console.log('Coach profile created:', data.coach.id);
        return { success: true, data: data.coach };
      } else {
        return { success: false, error: data.error, message: data.message };
      }
    } catch (error: any) {
      console.error('Create coach error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get coach profile
   */
  async getCoach(coachId: string): Promise<Coach | null> {
    const endpoint = `${this.baseUrl}${AUTH_CONFIG.endpoints.coachDetails}/${coachId}`;
    const headers = await this.getAuthHeaders();
    
    console.log('=== GET COACH PROFILE ===');
    console.log('Coach ID:', coachId);
    
    try {
      const response = await fetchWithLogging(endpoint, { headers });
      
      if (response.ok) {
        const coach: Coach = await response.json();
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
   */
  async updateCoach(
    coachId: string,
    updates: { commissionRate?: number }
  ): Promise<ApiResponse<Coach>> {
    const endpoint = `${this.baseUrl}${AUTH_CONFIG.endpoints.updateCoach}/${coachId}`;
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
   */
  async addCoachClient(
    coachId: string,
    clientId: string
  ): Promise<ApiResponse<CoachClient>> {
    const endpoint = `${this.baseUrl}${AUTH_CONFIG.endpoints.addClient}/${coachId}/clients`;
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
   */
  async removeCoachClient(
    coachId: string,
    clientId: string
  ): Promise<ApiResponse> {
    const endpoint = `${this.baseUrl}${AUTH_CONFIG.endpoints.removeClient}/${coachId}/clients/${clientId}`;
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
   */
  async listCoachClients(coachId: string): Promise<{
    coachId: string;
    clients: CoachClient[];
    totalClients: number;
    activeClients: number;
  } | null> {
    const endpoint = `${this.baseUrl}${AUTH_CONFIG.endpoints.listClients}/${coachId}/clients`;
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
   */
  async getCoachRevenue(coachId: string): Promise<any | null> {
    const endpoint = `${this.baseUrl}${AUTH_CONFIG.endpoints.coachRevenue}/${coachId}/revenue`;
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
   */
  async connectCoachStripe(
    coachId: string,
    stripeAccountId: string
  ): Promise<ApiResponse<Coach>> {
    const endpoint = `${this.baseUrl}${AUTH_CONFIG.endpoints.connectStripe}/${coachId}/stripe`;
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
   */
  async getCoachPayouts(coachId: string): Promise<any | null> {
    const endpoint = `${this.baseUrl}${AUTH_CONFIG.endpoints.payoutHistory}/${coachId}/payouts`;
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

  /**
   * Request password reset email
   */
  async requestPasswordReset(email: string): Promise<{ success: boolean; error?: string }> {
    const endpoint = `${this.baseUrl}${AUTH_CONFIG.endpoints.forgotPassword}`;
    
    console.log('=== REQUEST PASSWORD RESET ===');
    console.log('Email:', email);
    
    try {
      const response = await fetchWithLogging(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      
      if (response.ok) {
        console.log('Password reset email sent successfully');
        return { success: true };
      } else {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || 'Failed to send reset email';
        console.error('Password reset request failed:', errorMessage);
        return { success: false, error: errorMessage };
      }
    } catch (error: any) {
      console.error('Password reset request error:', error);
      return { success: false, error: error.message || 'Network error' };
    }
  }
}

export const authService = new AuthService();
