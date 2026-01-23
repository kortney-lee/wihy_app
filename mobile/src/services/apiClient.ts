/**
 * WIHY API Client - Unified Authentication Handler
 * 
 * This module provides a centralized API client that automatically handles
 * authentication headers for all WIHY services.
 * 
 * AUTHENTICATION PATTERNS:
 * - auth.wihy.ai: Client credentials (X-Client-Id, X-Client-Secret) for login/register
 * - user.wihy.ai: JWT Bearer token for user profile, coaching, health data
 * - services.wihy.ai: JWT Bearer token for scanning, meals, workouts, nutrition
 * - ml.wihy.ai: JWT Bearer token + Client credentials for AI chat
 * - payment.wihy.ai: JWT Bearer token for subscriptions
 * 
 * USAGE:
 * ```typescript
 * import { apiClient } from './apiClient';
 * 
 * // Authenticated request (auto-injects Bearer token)
 * const data = await apiClient.get('/api/scan/history');
 * const result = await apiClient.post('/api/meals/log', { mealData });
 * 
 * // Specify service explicitly
 * const profile = await apiClient.get('/api/profile/me', { service: 'user' });
 * ```
 * 
 * @author WIHY Engineering Team
 * @version 1.0.0
 * @since January 2026
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG, getAppAuthHeaders, getMLAuthHeaders, getServicesAuthHeaders } from './config';
import { apiLogger } from '../utils/apiLogger';

// ============= TYPES =============

/** Available WIHY services */
export type WihyService = 'auth' | 'user' | 'services' | 'ml' | 'payment';

/** HTTP methods supported */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/** API request options */
export interface ApiRequestOptions {
  /** Target service (auto-detected from URL if not specified) */
  service?: WihyService;
  /** Skip adding Authorization header (for public endpoints like login) */
  skipAuth?: boolean;
  /** Additional headers to include */
  headers?: Record<string, string>;
  /** Request timeout in ms (default: 30000) */
  timeout?: number;
  /** Include user context in request body */
  includeUserContext?: boolean;
}

/** Standard API response wrapper */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  statusCode: number;
}

/** API error with details */
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public endpoint: string,
    public responseBody?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }

  isUnauthorized(): boolean {
    return this.statusCode === 401;
  }

  isForbidden(): boolean {
    return this.statusCode === 403;
  }

  isNotFound(): boolean {
    return this.statusCode === 404;
  }

  isServerError(): boolean {
    return this.statusCode >= 500;
  }
}

// ============= STORAGE KEYS =============

const STORAGE_KEYS = {
  SESSION_TOKEN: '@wihy_session_token',
  ACCESS_TOKEN: '@wihy_access_token',
  REFRESH_TOKEN: '@wihy_refresh_token',
  USER_DATA: '@wihy_user_data',
  TOKEN_EXPIRY: '@wihy_token_expiry',
};

// ============= SERVICE URL MAPPING =============

const SERVICE_URLS: Record<WihyService, string> = {
  auth: API_CONFIG.authUrl,
  user: API_CONFIG.userUrl,
  services: API_CONFIG.servicesUrl,
  ml: API_CONFIG.mlApiUrl,
  payment: API_CONFIG.paymentUrl,
};

// ============= API CLIENT CLASS =============

class ApiClient {
  private tokenRefreshPromise: Promise<string | null> | null = null;

  /**
   * Get the stored JWT token
   */
  async getToken(): Promise<string | null> {
    // Try access token first, then session token
    const accessToken = await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    if (accessToken) return accessToken;

    const sessionToken = await AsyncStorage.getItem(STORAGE_KEYS.SESSION_TOKEN);
    return sessionToken;
  }

  /**
   * Check if token is expired
   */
  async isTokenExpired(): Promise<boolean> {
    const expiryStr = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRY);
    if (!expiryStr) return true;

    const expiry = parseInt(expiryStr, 10);
    // Consider expired if within 5 minutes of expiry
    return Date.now() >= (expiry - 5 * 60 * 1000);
  }
  
  /**
   * Check if JWT token is expired by decoding it
   * Falls back to checking stored expiry
   */
  async isJWTExpired(token: string): Promise<boolean> {
    try {
      // Decode JWT payload (second part)
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.exp) {
        // JWT exp is in seconds, convert to milliseconds
        const expiry = payload.exp * 1000;
        return Date.now() >= expiry;
      }
    } catch (error) {
      console.warn('[ApiClient] Failed to decode JWT:', error);
    }
    
    // Fall back to stored expiry
    return this.isTokenExpired();
  }

  /**
   * Get current user data
   */
  async getUserData(): Promise<{ id: string; email?: string } | null> {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
    return data ? JSON.parse(data) : null;
  }

  /**
   * Detect which service a URL belongs to
   */
  private detectService(url: string): WihyService {
    if (url.includes('auth.wihy.ai') || url.includes('/api/auth/')) return 'auth';
    if (url.includes('user.wihy.ai')) return 'user';
    if (url.includes('ml.wihy.ai')) return 'ml';
    if (url.includes('payment.wihy.ai')) return 'payment';
    return 'services'; // Default to services
  }

  /**
   * Build full URL from endpoint and service
   */
  private buildUrl(endpoint: string, service: WihyService): string {
    // If already a full URL, return as-is
    if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
      return endpoint;
    }

    const baseUrl = SERVICE_URLS[service];
    // Ensure endpoint starts with /
    const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${baseUrl}${path}`;
  }

  /**
   * Get authentication headers for a request
   */
  private async getAuthHeaders(
    service: WihyService,
    skipAuth: boolean
  ): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add client credentials for services that need them
    if (service === 'auth') {
      const appHeaders = getAppAuthHeaders();
      Object.assign(headers, appHeaders);
    } else if (service === 'ml') {
      const mlHeaders = getMLAuthHeaders();
      Object.assign(headers, mlHeaders);
    } else if (service === 'services') {
      const servicesHeaders = getServicesAuthHeaders();
      Object.assign(headers, servicesHeaders);
    }

    // Add Bearer token for authenticated requests (not auth service login/register)
    if (!skipAuth) {
      const token = await this.getToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  /**
   * Refresh the authentication token
   */
  private async refreshToken(): Promise<string | null> {
    // Prevent multiple simultaneous refresh attempts
    if (this.tokenRefreshPromise) {
      return this.tokenRefreshPromise;
    }

    this.tokenRefreshPromise = (async () => {
      try {
        const refreshToken = await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
        if (!refreshToken) {
          console.warn('[ApiClient] No refresh token available');
          return null;
        }

        const response = await fetch(`${API_CONFIG.authUrl}/api/auth/refresh`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getAppAuthHeaders(),
          },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });

        if (!response.ok) {
          console.error('[ApiClient] Token refresh failed:', response.status);
          return null;
        }

        const data = await response.json();
        
        if (data.token || data.access_token) {
          const newToken = data.token || data.access_token;
          await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, newToken);
          
          if (data.refresh_token) {
            await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, data.refresh_token);
          }
          
          if (data.expires_in) {
            const expiry = Date.now() + data.expires_in * 1000;
            await AsyncStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRY, expiry.toString());
          }

          console.log('[ApiClient] Token refreshed successfully');
          return newToken;
        }

        return null;
      } catch (error) {
        console.error('[ApiClient] Token refresh error:', error);
        return null;
      } finally {
        this.tokenRefreshPromise = null;
      }
    })();

    return this.tokenRefreshPromise;
  }

  /**
   * Make an authenticated API request
   */
  async request<T = any>(
    method: HttpMethod,
    endpoint: string,
    body?: any,
    options: ApiRequestOptions = {}
  ): Promise<T> {
    const {
      service: explicitService,
      skipAuth = false,
      headers: customHeaders = {},
      timeout = API_CONFIG.timeout,
      includeUserContext = false,
    } = options;

    // Detect service from URL or use explicit service
    const service = explicitService || this.detectService(endpoint);
    const url = this.buildUrl(endpoint, service);

    // Check if token is expired before making request (only for authenticated requests)
    if (!skipAuth && service !== 'auth') {
      const token = await this.getToken();
      if (token) {
        const tokenExpired = await this.isJWTExpired(token);
        if (tokenExpired) {
          console.log('[ApiClient] Token expired, attempting refresh...');
          const refreshed = await this.refreshToken();
          if (!refreshed) {
            console.error('[ApiClient] Token refresh failed - token expired and no valid refresh token');
            // Clear auth data and throw error
            await this.clearAuthData();
            throw new ApiError('Authentication expired - please login again', 401, url);
          }
        }
      }
    }

    // Build headers
    const authHeaders = await this.getAuthHeaders(service, skipAuth);
    const allHeaders = {
      ...authHeaders,
      ...customHeaders,
    };

    // Build request body
    let requestBody = body;
    if (includeUserContext && body && typeof body === 'object') {
      const userData = await this.getUserData();
      if (userData) {
        requestBody = {
          ...body,
          user_context: {
            userId: userData.id,
            ...body.user_context,
          },
        };
      }
    }

    // Log request
    const requestId = apiLogger.logRequest(method, url, {
      method,
      headers: allHeaders,
      body: requestBody ? JSON.stringify(requestBody) : undefined,
    });

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        method,
        headers: allHeaders,
        body: requestBody ? JSON.stringify(requestBody) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle 401 - try token refresh once
      if (response.status === 401 && !skipAuth && service !== 'auth') {
        console.log('[ApiClient] Got 401, attempting token refresh...');
        const newToken = await this.refreshToken();
        
        if (newToken) {
          // Retry request with new token
          const retryHeaders = {
            ...allHeaders,
            'Authorization': `Bearer ${newToken}`,
          };

          const retryResponse = await fetch(url, {
            method,
            headers: retryHeaders,
            body: requestBody ? JSON.stringify(requestBody) : undefined,
          });

          if (retryResponse.ok) {
            const data = await retryResponse.json();
            apiLogger.logResponse(requestId, retryResponse, data);
            return data;
          }
        }

        // Refresh failed or retry failed - throw unauthorized error
        throw new ApiError(
          'Session expired. Please log in again.',
          401,
          url
        );
      }

      // Parse response
      let responseData: any;
      const contentType = response.headers.get('content-type');
      
      if (contentType?.includes('application/json')) {
        responseData = await response.json();
      } else {
        responseData = await response.text();
      }

      apiLogger.logResponse(requestId, response, responseData);

      // Handle 401 Unauthorized - token invalid or expired
      if (response.status === 401) {
        console.error('[ApiClient] 401 Unauthorized - token invalid or expired');
        
        // Try to refresh token once
        if (!skipAuth && service !== 'auth') {
          console.log('[ApiClient] Attempting token refresh after 401...');
          const refreshed = await this.refreshToken();
          
          if (refreshed) {
            // Retry request with new token
            console.log('[ApiClient] Retrying request with refreshed token...');
            return this.request<T>(method, endpoint, body, options);
          }
        }
        
        // Refresh failed or not applicable - clear auth and throw
        await this.clearAuthData();
        throw new ApiError(
          'Authentication failed - please login again',
          401,
          url,
          responseData
        );
      }

      // Handle errors
      if (!response.ok) {
        const errorMessage = 
          responseData?.message || 
          responseData?.error || 
          `Request failed with status ${response.status}`;

        throw new ApiError(errorMessage, response.status, url, responseData);
      }

      return responseData;
    } catch (error: any) {
      clearTimeout(timeoutId);

      if (error.name === 'AbortError') {
        throw new ApiError(`Request timeout after ${timeout}ms`, 408, url);
      }

      if (error instanceof ApiError) {
        throw error;
      }

      // Network error
      apiLogger.logError(requestId, error, { method, url });
      throw new ApiError(
        error.message || 'Network request failed',
        0,
        url
      );
    }
  }

  // ============= CONVENIENCE METHODS =============

  /**
   * GET request
   */
  async get<T = any>(endpoint: string, options?: ApiRequestOptions): Promise<T> {
    return this.request<T>('GET', endpoint, undefined, options);
  }

  /**
   * POST request
   */
  async post<T = any>(endpoint: string, body?: any, options?: ApiRequestOptions): Promise<T> {
    return this.request<T>('POST', endpoint, body, options);
  }

  /**
   * PUT request
   */
  async put<T = any>(endpoint: string, body?: any, options?: ApiRequestOptions): Promise<T> {
    return this.request<T>('PUT', endpoint, body, options);
  }

  /**
   * PATCH request
   */
  async patch<T = any>(endpoint: string, body?: any, options?: ApiRequestOptions): Promise<T> {
    return this.request<T>('PATCH', endpoint, body, options);
  }

  /**
   * DELETE request
   */
  async delete<T = any>(endpoint: string, options?: ApiRequestOptions): Promise<T> {
    return this.request<T>('DELETE', endpoint, undefined, options);
  }

  // ============= SERVICE-SPECIFIC METHODS =============

  /**
   * Request to Auth service (auth.wihy.ai)
   * Note: Most auth endpoints don't require Bearer token
   */
  async auth<T = any>(
    method: HttpMethod,
    endpoint: string,
    body?: any,
    skipAuth = true
  ): Promise<T> {
    return this.request<T>(method, endpoint, body, { service: 'auth', skipAuth });
  }

  /**
   * Request to User service (user.wihy.ai)
   * Endpoints: /api/profile, /api/family, /api/coaches, /api/users/me/health-data
   */
  async user<T = any>(
    method: HttpMethod,
    endpoint: string,
    body?: any
  ): Promise<T> {
    return this.request<T>(method, endpoint, body, { service: 'user' });
  }

  /**
   * Request to Services API (services.wihy.ai)
   * Endpoints: /api/scan, /api/meals, /api/fitness, /api/nutrition
   */
  async services<T = any>(
    method: HttpMethod,
    endpoint: string,
    body?: any
  ): Promise<T> {
    return this.request<T>(method, endpoint, body, { service: 'services' });
  }

  /**
   * Request to ML API (ml.wihy.ai)
   * Endpoints: /ask, /chat/*
   */
  async ml<T = any>(
    method: HttpMethod,
    endpoint: string,
    body?: any
  ): Promise<T> {
    return this.request<T>(method, endpoint, body, { service: 'ml', includeUserContext: true });
  }

  /**
   * Request to Payment service (payment.wihy.ai)
   * Endpoints: /api/checkout, /api/subscriptions
   */
  async payment<T = any>(
    method: HttpMethod,
    endpoint: string,
    body?: any
  ): Promise<T> {
    return this.request<T>(method, endpoint, body, { service: 'payment' });
  }
  
  // ============= HELPER METHODS =============
  
  /**
   * Clear all auth data from storage
   * Called on 401 errors when token refresh fails
   */
  private async clearAuthData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.ACCESS_TOKEN,
        STORAGE_KEYS.SESSION_TOKEN,
        STORAGE_KEYS.REFRESH_TOKEN,
        STORAGE_KEYS.USER_DATA,
        STORAGE_KEYS.TOKEN_EXPIRY,
      ]);
      console.log('[ApiClient] Auth data cleared');
    } catch (error) {
      console.error('[ApiClient] Failed to clear auth data:', error);
    }
  }
}

// ============= SINGLETON EXPORT =============

export const apiClient = new ApiClient();

// ============= AUTHENTICATED FETCH WRAPPER =============

/**
 * Drop-in replacement for fetch with automatic authentication
 * Use this when migrating existing services
 * 
 * @example
 * // Before:
 * const response = await fetch(url, { method: 'GET', headers: {...} });
 * 
 * // After:
 * const response = await authenticatedFetch(url, { method: 'GET' });
 */
export async function authenticatedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  // Get token
  const token = await apiClient.getToken();

  // Detect service and get appropriate client headers
  let clientHeaders: Record<string, string> = {};
  if (url.includes('auth.wihy.ai')) {
    clientHeaders = getAppAuthHeaders();
  } else if (url.includes('ml.wihy.ai')) {
    clientHeaders = getMLAuthHeaders();
  } else if (url.includes('services.wihy.ai')) {
    clientHeaders = getServicesAuthHeaders();
  }

  // Merge headers
  const headers = new Headers(options.headers);
  
  // Add Content-Type if not present
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  // Add client headers
  Object.entries(clientHeaders).forEach(([key, value]) => {
    if (value && !headers.has(key)) {
      headers.set(key, value);
    }
  });

  // Add Authorization header if token exists and not already set
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Log request
  const requestId = apiLogger.logRequest(options.method || 'GET', url, {
    ...options,
    headers: Object.fromEntries(headers.entries()),
  });

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Clone to read body for logging
    const cloned = response.clone();
    try {
      const data = await cloned.json();
      apiLogger.logResponse(requestId, response, data);
    } catch {
      apiLogger.logResponse(requestId, response);
    }

    return response;
  } catch (error) {
    const method = options.method || 'GET';
    apiLogger.logError(requestId, error, { method, url, options });
    throw error;
  }
}

// ============= HELPER FUNCTIONS =============

/**
 * Get authorization headers for manual use
 * Use apiClient methods when possible - this is for edge cases
 */
export async function getAuthorizationHeaders(): Promise<{ Authorization: string } | {}> {
  const token = await apiClient.getToken();
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }
  return {};
}
