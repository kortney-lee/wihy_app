/**
 * WIHY Authentication Configuration
 * Manages auth service URLs, client IDs, and other constants
 */

// Environment-based configuration
const ENV = {
  dev: {
    AUTH_BASE_URL: 'http://localhost:5000',
    API_BASE_URL: 'http://localhost:3000',
    CLIENT_ID: 'wihy_native_2025',
    REDIRECT_URI: 'wihy://auth/callback',
  },
  staging: {
    AUTH_BASE_URL: 'https://auth-staging.wihy.ai',
    API_BASE_URL: 'https://api-staging.wihy.ai',
    CLIENT_ID: 'wihy_native_2025',
    REDIRECT_URI: 'wihy://auth/callback',
  },
  prod: {
    AUTH_BASE_URL: 'https://auth.wihy.ai',
    API_BASE_URL: 'https://api.wihy.ai',
    CLIENT_ID: 'wihy_native_2025',
    REDIRECT_URI: 'wihy://auth/callback',
  }
};

// Determine current environment
const getEnvironment = () => {
  if (__DEV__) {
    return ENV.dev;
  }
  // Can be expanded with release notes or build config
  return ENV.prod;
};

export const AUTH_CONFIG = getEnvironment();

// OAuth Provider Scopes
export const OAUTH_SCOPES = {
  google: ['profile', 'email'],
  facebook: ['public_profile', 'email'],
  microsoft: ['user.read', 'email']
};

// Token storage keys
export const STORAGE_KEYS = {
  SESSION_TOKEN: 'session_token',
  REFRESH_TOKEN: 'refresh_token',
  AUTH_STATE: 'auth_state',
  USER_INFO: 'user_info',
  LAST_AUTH_PROVIDER: 'last_auth_provider'
};

// API Endpoints
export const AUTH_ENDPOINTS = {
  // OAuth
  OAUTH_AUTHORIZE: '/api/oauth/authorize',
  OAUTH_TOKEN: '/api/oauth/token',
  OAUTH_USERINFO: '/api/oauth/userinfo',
  
  // Google OAuth
  GOOGLE_AUTHORIZE: '/api/auth/google/authorize',
  
  // Facebook OAuth
  FACEBOOK_AUTHORIZE: '/api/auth/facebook/authorize',
  
  // Microsoft OAuth
  MICROSOFT_AUTHORIZE: '/api/auth/microsoft/authorize',
  
  // Local Auth
  LOCAL_LOGIN: '/api/auth/local/login',
  LOCAL_REGISTER: '/api/auth/local/register',
  
  // Session Management
  VERIFY: '/api/auth/verify',
  LOGOUT: '/api/auth/logout',
  REFRESH: '/api/auth/refresh'
};

// Error Messages
export const AUTH_ERRORS = {
  NO_TOKEN: 'No authentication token found. Please log in first.',
  INVALID_STATE: 'Invalid state parameter - possible CSRF attack',
  NO_SESSION_TOKEN: 'No session token received from auth service',
  TOKEN_EXPIRED: 'Session expired. Please log in again.',
  INVALID_TOKEN: 'Invalid or expired token',
  LOGIN_FAILED: 'Login failed',
  REGISTRATION_FAILED: 'Registration failed',
  LOGOUT_FAILED: 'Logout failed',
  NETWORK_ERROR: 'Network error. Please check your connection.',
  AUTH_SERVICE_UNAVAILABLE: 'Authentication service unavailable'
};

// Token Refresh Configuration
export const TOKEN_REFRESH_CONFIG = {
  REFRESH_THRESHOLD_MS: 5 * 60 * 1000, // Refresh 5 minutes before expiry
  REFRESH_RETRY_COUNT: 3,
  REFRESH_RETRY_DELAY_MS: 1000
};

// Deep Link Configuration
export const DEEP_LINK_CONFIG = {
  SCHEME: 'wihy',
  AUTH_CALLBACK_PATH: '/auth/callback'
};
