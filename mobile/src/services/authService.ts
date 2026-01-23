/**
 * WIHY Authentication Service
 * Handles OAuth2, local auth, and session management
 * 
 * Base URL: https://auth.wihy.ai
 * 
 * For user profile, preferences, and subscription management,
 * use userService.ts (https://user.wihy.ai)
 * 
 * KEY PRINCIPLE: Clients only need their own client_id
 * ==========================================
 * - Your app uses: wihy_native_2025 (client_id only)
 * - Auth service handles ALL OAuth provider configurations (Google, Facebook, Microsoft)
 * - Auth service manages provider client IDs, secrets, endpoints
 * - Your app simply redirects to auth service endpoints
 * - Auth service returns session_token via deep link
 * 
 * AUTHENTICATION STRATEGY:
 * ==========================================
 * - WEB: Uses HttpOnly cookies (session_token cookie shared across *.wihy.ai)
 * - MOBILE: Uses Bearer token in Authorization header (stored in AsyncStorage)
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { EXPO_PUBLIC_WIHY_NATIVE_CLIENT_ID, EXPO_PUBLIC_AUTH_URL } from '@env';
import { fetchWithLogging } from '../utils/apiLogger';
import { affiliateService } from './affiliateService';

// Auth configuration - Only your client credentials needed
export const AUTH_CONFIG = {
  baseUrl: EXPO_PUBLIC_AUTH_URL || 'https://auth.wihy.ai',
  clientId: EXPO_PUBLIC_WIHY_NATIVE_CLIENT_ID || 'wihy_native_2025',
  // SECURITY: Mobile apps are PUBLIC clients - NEVER use client secret
  // OAuth flow: Auth service handles ALL provider configurations server-side
  // Mobile receives session_token directly via redirect (PKCE flow)
  redirectUri: 'wihy://auth/callback',
  // OAuth scopes - only profile and email are supported by auth service
  scopes: ['profile', 'email'],
  endpoints: {
    // === AUTH SERVICE ENDPOINTS (https://auth.wihy.ai) ===
    // Authentication
    health: '/api/health',
    providers: '/api/auth/providers',
    login: '/api/auth/login',
    register: '/api/auth/register',
    // OAuth endpoints require /authorize suffix
    googleAuth: '/api/auth/google/authorize',
    facebookAuth: '/api/auth/facebook/authorize',
    microsoftAuth: '/api/auth/microsoft/authorize',
    appleAuth: '/api/auth/apple/authorize',
    verify: '/api/auth/verify',
    refresh: '/api/auth/refresh',
    logout: '/api/auth/logout',
    forgotPassword: '/api/auth/forgot-password',
    resetPassword: '/api/auth/reset-password',
    
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

/**
 * Decode a JWT token without verification (client-side)
 * Used as fallback when verification endpoint fails
 * SECURITY: This does NOT verify the signature - use server verification when possible
 */
interface JWTPayload {
  sub?: string;        // User ID
  email?: string;
  name?: string;
  picture?: string;
  provider?: string;
  plan?: string;
  exp?: number;        // Expiration timestamp
  iat?: number;        // Issued at timestamp
  sessionId?: string;
  [key: string]: any;
}

function decodeJWT(token: string): JWTPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.warn('[AuthService] Invalid JWT format - expected 3 parts');
      return null;
    }
    
    // Decode base64url payload
    const payload = parts[1];
    // Handle base64url encoding (replace - with +, _ with /)
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    // Add padding if needed
    const padded = base64 + '='.repeat((4 - base64.length % 4) % 4);
    
    // Decode and parse
    const decoded = atob(padded);
    return JSON.parse(decoded);
  } catch (error) {
    console.error('[AuthService] Failed to decode JWT:', error);
    return null;
  }
}

/**
 * Check if a JWT token is expired
 */
function isJWTExpired(payload: JWTPayload): boolean {
  if (!payload.exp) {
    return false; // No expiration = never expires
  }
  const now = Math.floor(Date.now() / 1000);
  return payload.exp < now;
}

/**
 * Convert JWT payload to UserData format
 */
function jwtPayloadToUserData(payload: JWTPayload): UserData | null {
  if (!payload.sub && !payload.email) {
    return null; // Need at least an ID or email
  }
  
  return {
    id: payload.sub || payload.email || 'unknown',
    email: payload.email || '',
    name: payload.name || payload.email?.split('@')[0] || 'User',
    avatar: payload.picture,
    provider: payload.provider as UserData['provider'],
    plan: payload.plan || 'free', // Default to free plan
    role: payload.role, // May be uppercase from backend
    status: payload.status, // May be uppercase from backend
    // Other fields will be undefined, which is fine
  };
}

// User settings nested in user object
export interface UserSettings {
  notificationsEnabled: boolean;
  privacyLevel: 'public' | 'friends' | 'private';
  unitsMetric: boolean;
}

export interface UserData {
  id: string;              // User ID (UUID) - maps to userId
  email: string;
  name: string;
  firstName?: string;      // From API - used to construct name if name is empty
  lastName?: string;       // From API - used to construct name if name is empty
  role?: 'user' | 'premium' | 'family-basic' | 'family-pro' | 'coach' | 'employee' | 'admin' | string;  // Backend may send uppercase
  status?: 'active' | 'inactive' | 'suspended' | 'pending' | string;  // Backend sends ACTIVE
  provider?: 'local' | 'google' | 'facebook' | 'microsoft' | 'apple';
  dateOfBirth?: string | null;
  gender?: 'male' | 'female' | 'other' | null;
  height?: number | null;
  weight?: number | null;
  activityLevel?: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active' | null;
  goals?: string[] | null;
  avatar?: string | null;
  emailVerified?: boolean;
  lastLogin?: string | null;
  settings?: UserSettings;
  createdAt?: string;
  profile_data?: any;      // Legacy field for backwards compatibility
  
  // Plan & Subscription (from backend)
  plan?: string;
  planStatus?: 'active' | 'trial' | 'expired' | 'cancelled';
  addOns?: string[];
  
  // Capabilities (computed by backend based on plan + addOns)
  capabilities?: import('../utils/capabilities').Capabilities;
  
  // Family info (from backend)
  familyId?: string | null;
  familyRole?: 'owner' | 'guardian' | 'member' | 'child' | null;
  guardianCode?: string | null;
  
  // Coach info (from backend)
  coachId?: string | null;
  commissionRate?: number | null;
  
  // Organization info (from backend)
  organizationId?: string | null;
  organizationRole?: 'admin' | 'user' | 'student' | 'employee' | null;
  
  // Health stats (from backend)
  healthScore?: number;
  streakDays?: number;
  memberSince?: string;
}

// Auth data nested inside response.data
export interface AuthData {
  user: UserData;
  token: string;
  refreshToken?: string;
  expiresIn: string;       // e.g., "24h" or "7d"
}

// API Response wrapper - all responses have this structure
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  error?: string;
  data?: T;
}

// Login/Register response follows ApiResponse<AuthData> structure
export interface LoginResponse {
  success: boolean;
  message?: string;
  error?: string;
  data?: AuthData;
  // Legacy flat fields for backwards compatibility
  session_token?: string;
  token?: string;
  expiresIn?: number | string;
  user?: UserData;
}

// Registration options per spec
export interface RegistrationOptions {
  phone?: string;
  plan?: string;           // 'free', 'premium', 'family-basic', 'family-pro', 'coach'
  referralCode?: string;
  date_of_birth?: string;
  gender?: string;
  height?: number;
  weight?: number;
  activity_level?: string;
  goals?: string[];
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
        // Web: credentials needed for Set-Cookie to work (fetchWithLogging handles this)
      });

      const responseTime = Date.now() - startTime;
      console.log(`Response Status: ${response.status} (${responseTime}ms)`);

      const responseData = await response.json();
      console.log('Response Data:', JSON.stringify(responseData, null, 2));

      if (response.ok && responseData.success) {
        // Handle nested data structure: response.data.user, response.data.token
        // Also support legacy flat structure for backwards compatibility
        const authData = responseData.data;
        const user = authData?.user || responseData.user;
        const authToken = authData?.token || responseData.token || responseData.session_token;
        const refreshToken = authData?.refreshToken || responseData.refreshToken;
        const expiresIn = authData?.expiresIn || responseData.expiresIn;
        
        // AUTHENTICATION STRATEGY:
        // - WEB: Server sets HttpOnly cookie via Set-Cookie header (auto-handled by browser)
        //        We still store token in AsyncStorage for backwards compatibility
        // - MOBILE: Store token in AsyncStorage, use in Authorization header
        if (authToken) {
          await this.storeSessionToken(authToken);
          
          // Store refresh token if provided
          if (refreshToken) {
            await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
          }
          
          // Store token expiry if provided
          if (expiresIn) {
            // Handle both string ("24h", "7d") and number (seconds) formats
            let expiryMs: number;
            if (typeof expiresIn === 'string') {
              if (expiresIn.endsWith('h')) {
                expiryMs = parseInt(expiresIn) * 60 * 60 * 1000;
              } else if (expiresIn.endsWith('d')) {
                expiryMs = parseInt(expiresIn) * 24 * 60 * 60 * 1000;
              } else {
                expiryMs = parseInt(expiresIn) * 1000;
              }
            } else {
              expiryMs = expiresIn * 1000;
            }
            const expiryTime = Date.now() + expiryMs;
            await AsyncStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRY, expiryTime.toString());
          }
        }
        
        if (user) {
          await this.storeUserData(user);
        }
        
        console.log('=== LOGIN SUCCESS ===');
        console.log(`Platform: ${Platform.OS}, Cookie auth: ${Platform.OS === 'web'}`);
        
        // Return in expected format with nested data
        return {
          success: true,
          message: responseData.message,
          data: {
            user: user,
            token: authToken,
            refreshToken: refreshToken,
            expiresIn: expiresIn,
          },
          // Also include flat fields for legacy compatibility
          user: user,
          token: authToken,
        };
      } else {
        console.log('=== LOGIN FAILED ===');
        return {
          success: false,
          error: responseData.error || responseData.message || 'Login failed',
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
   * For free tier: Just registers the user with plan='free', no payment needed
   * For paid tiers: User should complete payment first via checkoutService
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
      // Free tier defaults - no payment required
      const body: any = { 
        email, 
        password, 
        name,
        terms_accepted: true,  // Required by API
        plan: options?.plan || 'free',  // Default to free tier
        ...(options?.phone && { phone: options.phone }),
        ...(options?.referralCode && { referralCode: options.referralCode }),
        ...(options?.date_of_birth && { date_of_birth: options.date_of_birth }),
        ...(options?.gender && { gender: options.gender }),
        ...(options?.height && { height: options.height }),
        ...(options?.weight && { weight: options.weight }),
        ...(options?.activity_level && { activity_level: options.activity_level }),
        ...(options?.goals && { goals: options.goals }),
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

      const responseData = await response.json();
      console.log('Response Data:', JSON.stringify(responseData, null, 2));

      if (response.ok && responseData.success) {
        // Handle nested data structure: response.data.user, response.data.token
        // Also support legacy flat structure for backwards compatibility
        const authData = responseData.data;
        const user = authData?.user || responseData.user;
        const authToken = authData?.token || responseData.token || responseData.session_token;
        const refreshToken = authData?.refreshToken || responseData.refreshToken;
        const expiresIn = authData?.expiresIn || responseData.expiresIn;
        
        console.log('=== REGISTER: Parsed data ===');
        console.log('user:', user);
        console.log('authToken:', authToken ? 'present' : 'missing');
        console.log('refreshToken:', refreshToken ? 'present' : 'missing');
        console.log('expiresIn:', expiresIn);
        
        if (authToken) {
          console.log('=== REGISTER: Storing session token ===');
          await this.storeSessionToken(authToken);
          
          // Store refresh token if provided
          if (refreshToken) {
            console.log('=== REGISTER: Storing refresh token ===');
            await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
          }
          
          // Store token expiry if provided
          if (expiresIn) {
            console.log('=== REGISTER: Storing token expiry ===');
            // Handle both string ("24h", "7d") and number (seconds) formats
            let expiryMs: number;
            if (typeof expiresIn === 'string') {
              if (expiresIn.endsWith('h')) {
                expiryMs = parseInt(expiresIn) * 60 * 60 * 1000;
              } else if (expiresIn.endsWith('d')) {
                expiryMs = parseInt(expiresIn) * 24 * 60 * 60 * 1000;
              } else {
                expiryMs = parseInt(expiresIn) * 1000;
              }
            } else {
              expiryMs = expiresIn * 1000;
            }
            const expiryTime = Date.now() + expiryMs;
            await AsyncStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRY, expiryTime.toString());
          }
        }
        
        if (user) {
          console.log('=== REGISTER: Storing user data ===');
          await this.storeUserData(user);
        }
        
        console.log('=== REGISTER SUCCESS ===');
        console.log('=== REGISTER: Returning result ===');
        
        // Build result object and log it before returning
        const result = {
          success: true,
          message: responseData.message,
          data: {
            user: user,
            token: authToken,
            refreshToken: refreshToken,
            expiresIn: expiresIn,
          },
          // Also include flat fields for legacy compatibility
          user: user,
          token: authToken,
        };
        console.log('=== REGISTER: Result object ===');
        console.log('result.success:', result.success);
        console.log('result.user:', result.user);
        console.log('result.data.user:', result.data.user);
        
        // Track affiliate signup (web only, non-blocking)
        // Uses email for lead matching; Stripe customer ID matched via webhooks on first payment
        if (user?.email && user?.name) {
          affiliateService.trackSignup(user.name, user.email, user.id).catch((err) => {
            console.log('[Auth] Affiliate tracking skipped:', err);
          });
        }
        
        return result;
      } else {
        console.log('=== REGISTER FAILED ===');
        return {
          success: false,
          error: responseData.error || responseData.message || 'Registration failed',
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
   * NOTE: Free tier users should use register() directly, not this method
   */
  async registerAfterPayment(
    email: string,
    password: string,
    name: string,
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
        name,
        planId: options.planId,
        stripeSessionId: options.stripeSessionId,
        terms_accepted: true,
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

      const responseData = await response.json();
      console.log('Response Data:', JSON.stringify(responseData, null, 2));

      if (response.ok && responseData.success) {
        // Handle nested data structure
        const authData = responseData.data;
        const user = authData?.user || responseData.user;
        const authToken = authData?.token || responseData.token || responseData.session_token;
        const refreshToken = authData?.refreshToken || responseData.refreshToken;
        const expiresIn = authData?.expiresIn || responseData.expiresIn;
        
        if (authToken) {
          await this.storeSessionToken(authToken);
          
          if (refreshToken) {
            await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
          }
          
          if (expiresIn) {
            let expiryMs: number;
            if (typeof expiresIn === 'string') {
              if (expiresIn.endsWith('h')) {
                expiryMs = parseInt(expiresIn) * 60 * 60 * 1000;
              } else if (expiresIn.endsWith('d')) {
                expiryMs = parseInt(expiresIn) * 24 * 60 * 60 * 1000;
              } else {
                expiryMs = parseInt(expiresIn) * 1000;
              }
            } else {
              expiryMs = expiresIn * 1000;
            }
            const expiryTime = Date.now() + expiryMs;
            await AsyncStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRY, expiryTime.toString());
          }
        }
        
        if (user) {
          await this.storeUserData(user);
        }
        
        console.log('=== REGISTER AFTER PAYMENT SUCCESS ===');
        
        // Track affiliate signup (web only, non-blocking)
        // Uses email for lead matching; Stripe customer ID matched via webhooks on first payment
        if (user?.email && user?.name) {
          affiliateService.trackSignup(user.name, user.email, user.id).catch((err) => {
            console.log('[Auth] Affiliate tracking skipped:', err);
          });
        }
        
        return {
          success: true,
          message: responseData.message,
          data: {
            user: user,
            token: authToken,
            refreshToken: refreshToken,
            expiresIn: expiresIn,
          },
          user: user,
          token: authToken,
        };
      } else {
        console.log('=== REGISTER AFTER PAYMENT FAILED ===');
        return {
          success: false,
          error: responseData.error || responseData.message || 'Account creation failed',
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
   * Get OAuth URL for web platform with proper redirect URI
   * Stores state for CSRF verification on callback
   */
  async getWebOAuthUrl(
    provider: 'google' | 'facebook' | 'microsoft' | 'apple'
  ): Promise<{ url: string; state: string }> {
    // Generate and store state for CSRF protection
    const state = this.generateState();
    await AsyncStorage.setItem('@wihy_oauth_state', state);
    
    // Determine web redirect URI
    // IMPORTANT: Use env variable for production URL to ensure OAuth works in all environments
    // In local development, OAuth still redirects to production URL which handles the callback
    const webBaseUrl = process.env.EXPO_PUBLIC_WEB_URL || 'https://wihy.ai';
    const redirectUri = `${webBaseUrl}/auth/callback`;
    
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
    
    // CRITICAL: Include redirect_uri parameter so backend knows where to redirect after auth
    const url = `${this.baseUrl}${endpoint}?` +
      `client_id=${AUTH_CONFIG.clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `scope=${scope}&` +
      `state=${state}`;
    
    console.log(`=== WEB OAUTH ${provider.toUpperCase()} URL GENERATED ===`);
    console.log('URL:', url);
    console.log('Redirect URI:', redirectUri);
    console.log('State:', state);
    
    return { url, state };
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
   * Uses /api/auth/refresh with refresh token in body
   * Client credentials (x-client-id, x-client-secret) are auto-injected by fetchWithLogging
   */
  async refreshAccessToken(): Promise<TokenResponse | null> {
    const refreshToken = await this.getRefreshToken();
    
    if (!refreshToken) {
      console.log('No refresh token available for token refresh');
      return null;
    }
    
    const startTime = Date.now();
    const endpoint = `${this.baseUrl}${AUTH_CONFIG.endpoints.refresh}`;
    
    console.log('=== REFRESH TOKEN API CALL ===');
    console.log('Endpoint:', endpoint);
    
    try {
      const response = await fetchWithLogging(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refreshToken: refreshToken,
        }),
      });

      const responseTime = Date.now() - startTime;
      console.log(`Response Status: ${response.status} (${responseTime}ms)`);

      if (response.ok) {
        const responseData = await response.json();
        console.log('Refresh Response:', JSON.stringify(responseData, null, 2));
        
        // Handle nested data structure: response.data.token
        // Also support legacy flat structure for backwards compatibility
        const authData = responseData.data;
        const newToken = authData?.token || responseData.token || responseData.session_token;
        const newRefreshToken = authData?.refreshToken || responseData.refreshToken;
        const expiresIn = authData?.expiresIn || responseData.expiresIn;
        
        if (responseData.success && newToken) {
          // Store new access token
          await this.storeSessionToken(newToken);
          
          // Store new refresh token if provided (token rotation)
          if (newRefreshToken) {
            await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, newRefreshToken);
          }
          
          // Store expiry if provided
          if (expiresIn) {
            // Handle both string ("24h", "7d") and number (seconds) formats
            let expiryMs: number;
            if (typeof expiresIn === 'string') {
              if (expiresIn.endsWith('h')) {
                expiryMs = parseInt(expiresIn) * 60 * 60 * 1000;
              } else if (expiresIn.endsWith('d')) {
                expiryMs = parseInt(expiresIn) * 24 * 60 * 60 * 1000;
              } else {
                expiryMs = parseInt(expiresIn) * 1000;
              }
            } else {
              expiryMs = expiresIn * 1000;
            }
            const expiryTime = Date.now() + expiryMs;
            await AsyncStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRY, expiryTime.toString());
          }
          
          console.log('=== REFRESH TOKEN SUCCESS ===');
          return {
            access_token: newToken,
            token_type: 'Bearer',
            expires_in: typeof expiresIn === 'number' ? expiresIn : 86400, // Default 24h
          };
        }
        
        console.error('=== REFRESH TOKEN FAILED: No token in response ===');
        return null;
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('=== REFRESH TOKEN FAILED ===');
        console.error('Error:', errorData.error || errorData.message || response.statusText);
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
   * Uses POST /api/auth/verify with token in body
   * Includes retry logic and JWT fallback for resilience
   */
  async verifySession(options?: { 
    maxRetries?: number; 
    useFallback?: boolean;
  }): Promise<{ valid: boolean; user?: UserData; error?: string; usedFallback?: boolean }> {
    const { maxRetries = 2, useFallback = true } = options || {};
    const sessionToken = await this.getSessionToken();
    
    if (!sessionToken) {
      return { valid: false, error: 'No session token' };
    }
    
    const endpoint = `${this.baseUrl}${AUTH_CONFIG.endpoints.verify}`;
    
    console.log('=== VERIFY SESSION ===');
    console.log('Endpoint:', endpoint);
    console.log('Base URL:', this.baseUrl);
    
    // First, decode JWT to check if it's expired (client-side check)
    const jwtPayload = decodeJWT(sessionToken);
    if (jwtPayload && isJWTExpired(jwtPayload)) {
      console.warn('[AuthService] JWT token is expired (client-side check)');
      return { valid: false, error: 'Token expired' };
    }
    
    // Try verification with retries
    let lastError: string = 'Unknown error';
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          // Exponential backoff: 500ms, 1000ms, 2000ms...
          const delay = 500 * Math.pow(2, attempt - 1);
          console.log(`[AuthService] Retry attempt ${attempt} after ${delay}ms`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
        
        // Add timeout for fetch to prevent hanging
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

        const response = await fetchWithLogging(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token: sessionToken }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          console.log('Session verification response:', { success: data.success, valid: data.valid, hasUser: !!data.user });
          
          if (data.success && data.valid && data.user) {
            await this.storeUserData(data.user);
            return {
              valid: true,
              user: data.user,
            };
          } else {
            // Backend returned invalid - extract error message
            lastError = data.error || data.message || 'Session invalid';
            console.warn('[AuthService] Backend rejected session:', lastError);
            // Don't retry if backend explicitly rejected
            break;
          }
        } else {
          lastError = `HTTP ${response.status}`;
          console.warn(`[AuthService] Session verification failed - status: ${response.status}`);
          // Continue to retry on HTTP errors (might be temporary)
        }
      } catch (error: any) {
        if (error.name === 'AbortError') {
          lastError = 'Request timeout';
          console.error('[AuthService] Session verification timeout - likely network issue');
        } else if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
          lastError = 'Network error';
          console.error('[AuthService] Network error during session verification:', error.message);
        } else {
          lastError = error.message || 'Verification error';
          console.error('[AuthService] Session verification error:', error);
        }
        // Continue to retry on network errors
      }
    }
    
    // All retries failed - try JWT fallback if enabled
    if (useFallback && jwtPayload) {
      console.log('[AuthService] Verification failed, attempting JWT fallback');
      const fallbackUser = jwtPayloadToUserData(jwtPayload);
      
      if (fallbackUser) {
        console.log('[AuthService] Using JWT payload as fallback user data:', fallbackUser.email);
        // Store fallback user data
        await this.storeUserData(fallbackUser);
        return {
          valid: true,
          user: fallbackUser,
          usedFallback: true,
          error: `Verification failed (${lastError}), using cached token data`,
        };
      }
    }
    
    return { valid: false, error: lastError };
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
    // Store to both keys for compatibility across all services
    // Some services check ACCESS_TOKEN, others check SESSION_TOKEN
    await AsyncStorage.setItem(STORAGE_KEYS.SESSION_TOKEN, token);
    await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
    console.log('Session token stored (both session and access keys)');
  }

  private async storeTokens(tokens: TokenResponse): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, tokens.access_token);
    await AsyncStorage.setItem(STORAGE_KEYS.SESSION_TOKEN, tokens.access_token);
    
    if (tokens.refresh_token) {
      await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokens.refresh_token);
    }
    
    // Store expiry time
    const expiryTime = Date.now() + (tokens.expires_in * 1000);
    await AsyncStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRY, expiryTime.toString());
  }

  private async storeUserData(user: UserData): Promise<void> {
    // Ensure name is always populated - construct from firstName/lastName if missing
    const userData = { ...user };
    
    // Normalize avatar URL field (backend may send avatar_url, avatarUrl, or avatar)
    if (!userData.avatar) {
      userData.avatar = (user as any).avatar_url || (user as any).avatarUrl || null;
    }
    
    // Normalize name field
    if (!userData.name || userData.name === 'User' || userData.name === 'Guest') {
      const firstName = (user as any).firstName || (user as any).first_name || '';
      const lastName = (user as any).lastName || (user as any).last_name || '';
      if (firstName || lastName) {
        userData.name = `${firstName} ${lastName}`.trim();
      } else if (user.email) {
        // Fall back to email username
        userData.name = user.email.split('@')[0];
      }
    }
    
    // Normalize role to lowercase for consistency
    if (userData.role && typeof userData.role === 'string') {
      userData.role = userData.role.toLowerCase() as any;
    }
    
    // Normalize status to lowercase for consistency
    if (userData.status && typeof userData.status === 'string') {
      userData.status = userData.status.toLowerCase() as any;
    }
    
    await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
  }

  async getSessionToken(): Promise<string | null> {
    // Try session token first, then fall back to access token for compatibility
    const sessionToken = await AsyncStorage.getItem(STORAGE_KEYS.SESSION_TOKEN);
    if (sessionToken) return sessionToken;
    return await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  }

  async getAccessToken(): Promise<string | null> {
    // Try access token first, then fall back to session token for compatibility
    const accessToken = await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    if (accessToken) return accessToken;
    return await AsyncStorage.getItem(STORAGE_KEYS.SESSION_TOKEN);
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

  /**
   * Clear all authentication tokens (public alias for clearAllData)
   */
  async clearTokens(): Promise<void> {
    await this.clearAllData();
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
  // USER MANAGEMENT, PLANS, ORGANIZATIONS, FAMILIES, COACHES
  // ==========================================
  // These endpoints have been moved to userService.ts for proper service separation.
  // Import userService instead: import { userService } from './userService';
  //
  // userService methods include:
  // - Profile: getUserProfile(), getUserById(), getUserByEmail(), updateUserProfile(), uploadAvatar(), changePassword()
  // - Preferences: getUserPreferences(), updateUserPreferences()
  // - Subscription: updateUserPlan(), addAddon(), removeAddon(), getSubscriptionHistory()
  // - Health: getUserCapabilities(), updateHealthMetrics(), getUserDashboard()
  // - Family: getFamily(), joinFamily(), leaveFamily(), createFamily(), updateFamily(), getFamilyById(), listFamilyMembers(), removeFamilyMemberById(), getGuardianCode(), regenerateGuardianCode()
  // - Coaching: createCoach(), getCoach(), updateCoach(), addCoachClient(), removeCoachClient(), listCoachClients(), getCoachRevenue(), connectCoachStripe(), getCoachPayouts()

  // ==========================================
  // PASSWORD RESET ENDPOINTS
  // ==========================================

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

  /**
   * Complete password reset with token and new password
   */
  async resetPassword(token: string, newPassword: string): Promise<{ success: boolean; message?: string; error?: string }> {
    const endpoint = `${this.baseUrl}${AUTH_CONFIG.endpoints.resetPassword}`;
    
    console.log('=== RESET PASSWORD ===');
    
    try {
      const response = await fetchWithLogging(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, newPassword }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        console.log('Password reset successfully');
        return { success: true, message: data.message || 'Password reset successfully' };
      } else {
        const errorMessage = data.error || 'Failed to reset password';
        console.error('Password reset failed:', errorMessage);
        return { success: false, error: errorMessage };
      }
    } catch (error: any) {
      console.error('Password reset error:', error);
      return { success: false, error: error.message || 'Network error' };
    }
  }
}

export const authService = new AuthService();

