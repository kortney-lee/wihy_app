/**
 * API Logger Utility
 * 
 * Logs all API requests and responses in development mode
 * Helps debug API issues on connected devices
 */

interface RequestLog {
  method: string;
  url: string;
  headers?: Record<string, string>;
  body?: any;
  timestamp: string;
}

interface ResponseLog {
  status: number;
  statusText: string;
  data?: any;
  duration: number;
  timestamp: string;
}

interface ErrorLog {
  error: any;
  request: RequestLog;
  timestamp: string;
}

// Check for dev mode - handle web and native
const isDev = typeof __DEV__ !== 'undefined' ? __DEV__ : process.env.NODE_ENV !== 'production';

// Force enable logging for debugging (set to true to always log)
const FORCE_LOGGING = true;

class ApiLogger {
  private activeRequests: Map<string, number> = new Map();

  /**
   * Log API request
   */
  logRequest(method: string, url: string, options?: RequestInit): string {
    if (!isDev && !FORCE_LOGGING) return '';

    const requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = new Date().toISOString();
    
    this.activeRequests.set(requestId, Date.now());

    const log: RequestLog = {
      method,
      url,
      timestamp,
    };

    // Include headers (sanitize sensitive data)
    if (options?.headers) {
      const headers = { ...options.headers } as Record<string, string>;
      
      // Redact sensitive headers
      if (headers['Authorization']) {
        headers['Authorization'] = '[REDACTED]';
      }
      if (headers['X-API-Key']) {
        headers['X-API-Key'] = '[REDACTED]';
      }
      if (headers['X-Client-Secret']) {
        headers['X-Client-Secret'] = '[REDACTED]';
      }
      
      log.headers = headers;
    }

    // Include body (sanitize sensitive data)
    if (options?.body) {
      try {
        const body = JSON.parse(options.body as string);
        
        // Redact sensitive fields
        const sanitized = this.sanitizeData(body);
        log.body = sanitized;
      } catch {
        log.body = options.body;
      }
    }

    console.log(
      `%c[API REQUEST] ${method} ${this.formatUrl(url)}`,
      'color: #3b82f6; font-weight: bold',
      log
    );

    return requestId;
  }

  /**
   * Log successful API response
   */
  logResponse(requestId: string, response: Response, data?: any): void {
    if (!isDev && !FORCE_LOGGING) return;

    const startTime = this.activeRequests.get(requestId);
    const duration = startTime ? Date.now() - startTime : 0;
    this.activeRequests.delete(requestId);

    const timestamp = new Date().toISOString();
    const log: ResponseLog = {
      status: response.status,
      statusText: response.statusText,
      duration,
      timestamp,
    };

    // Include response data (sanitize sensitive data)
    if (data !== undefined) {
      log.data = this.sanitizeData(data);
    }

    const color = response.ok ? '#10b981' : '#ef4444';
    const emoji = response.ok ? '✅' : '❌';
    
    console.log(
      `%c[API RESPONSE ${emoji}] ${response.status} (${duration}ms)`,
      `color: ${color}; font-weight: bold`,
      log
    );
  }

  /**
   * Log API error
   */
  logError(requestId: string, error: any, request?: { method: string; url: string; options?: RequestInit }): void {
    if (!isDev && !FORCE_LOGGING) return;

    const startTime = this.activeRequests.get(requestId);
    const duration = startTime ? Date.now() - startTime : 0;
    this.activeRequests.delete(requestId);

    const timestamp = new Date().toISOString();
    
    const log: ErrorLog = {
      error: {
        message: error?.message || 'Unknown error',
        name: error?.name,
        stack: error?.stack,
        code: error?.code,
      },
      request: {
        method: request?.method || 'UNKNOWN',
        url: request?.url || 'UNKNOWN',
        timestamp,
      },
      timestamp,
    };

    console.error(
      `%c[API ERROR] ❌ ${request?.method || 'REQUEST'} failed (${duration}ms)`,
      'color: #ef4444; font-weight: bold',
      log
    );
  }

  /**
   * Log general API info
   */
  logInfo(message: string, data?: any): void {
    if (!isDev && !FORCE_LOGGING) return;

    console.log(
      `%c[API INFO] ℹ️ ${message}`,
      'color: #6366f1; font-weight: bold',
      data || ''
    );
  }

  /**
   * Log API warning
   */
  logWarning(message: string, data?: any): void {
    if (!isDev && !FORCE_LOGGING) return;

    console.warn(
      `%c[API WARNING] ⚠️ ${message}`,
      'color: #f59e0b; font-weight: bold',
      data || ''
    );
  }

  /**
   * Sanitize sensitive data from logs
   */
  private sanitizeData(data: any): any {
    if (!data || typeof data !== 'object') {
      return data;
    }

    const sensitiveFields = [
      'password',
      'token',
      'secret',
      'apiKey',
      'api_key',
      'accessToken',
      'access_token',
      'refreshToken',
      'refresh_token',
      'sessionId',
      'session_id',
      'creditCard',
      'credit_card',
      'ssn',
      'social_security',
    ];

    const sanitized = Array.isArray(data) ? [...data] : { ...data };

    for (const key in sanitized) {
      const lowerKey = key.toLowerCase();
      
      if (sensitiveFields.some(field => lowerKey.includes(field))) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
        sanitized[key] = this.sanitizeData(sanitized[key]);
      }
    }

    return sanitized;
  }

  /**
   * Format URL for display (truncate if too long)
   */
  private formatUrl(url: string): string {
    if (url.length <= 80) return url;
    
    try {
      const urlObj = new URL(url);
      return `${urlObj.origin}${urlObj.pathname.substring(0, 40)}...`;
    } catch {
      return url.substring(0, 80) + '...';
    }
  }

  /**
   * Log network connectivity status
   */
  logNetworkStatus(isConnected: boolean): void {
    if (!isDev && !FORCE_LOGGING) return;

    console.log(
      `%c[NETWORK] ${isConnected ? '🟢 Connected' : '🔴 Disconnected'}`,
      `color: ${isConnected ? '#10b981' : '#ef4444'}; font-weight: bold`
    );
  }

  /**
   * Log cache hit/miss
   */
  logCache(key: string, hit: boolean): void {
    if (!isDev && !FORCE_LOGGING) return;

    console.log(
      `%c[CACHE] ${hit ? '✅ HIT' : '❌ MISS'}: ${key}`,
      `color: ${hit ? '#10b981' : '#f59e0b'}; font-weight: bold`
    );
  }
}

export const apiLogger = new ApiLogger();

// Storage keys for JWT token (same as authService)
const TOKEN_STORAGE_KEYS = {
  ACCESS_TOKEN: '@wihy_access_token',
  SESSION_TOKEN: '@wihy_session_token',
};

/**
 * Get stored JWT token (async)
 * Tries access token first, then session token
 */
const getStoredToken = async (): Promise<string | null> => {
  try {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    const accessToken = await AsyncStorage.getItem(TOKEN_STORAGE_KEYS.ACCESS_TOKEN);
    if (accessToken) return accessToken;
    const sessionToken = await AsyncStorage.getItem(TOKEN_STORAGE_KEYS.SESSION_TOKEN);
    return sessionToken;
  } catch {
    return null;
  }
};

/**
 * Check if JWT token is expired by decoding it
 */
const isJWTExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (payload.exp) {
      // JWT exp is in seconds, convert to milliseconds
      const expiry = payload.exp * 1000;
      return Date.now() >= expiry;
    }
  } catch {
    return true; // If can't decode, assume expired
  }
  return false;
};

/**
 * Import auth headers from config (lazy import to avoid circular dependency)
 * 
 * Authentication patterns:
 * - auth.wihy.ai: Client credentials (x-client-id, x-client-secret) for login/register/verify
 * - user.wihy.ai: JWT Bearer token
 * - services.wihy.ai: JWT Bearer token + Client credentials
 * - ml.wihy.ai: JWT Bearer token + Client credentials
 * - payment.wihy.ai: JWT Bearer token
 */
const getAuthHeadersForUrl = (url: string): Record<string, string> => {
  try {
    // Lazy import to avoid circular dependency
    const { getMLAuthHeaders, getServicesAuthHeaders, getAppAuthHeaders } = require('../services/config');
    
    // Determine which client credential headers to use based on URL
    if (url.includes('ml.wihy.ai')) {
      return getMLAuthHeaders();
    } else if (url.includes('services.wihy.ai')) {
      return getServicesAuthHeaders();
    } else if (url.includes('auth.wihy.ai')) {
      // Auth service uses client credentials (for login, register, verify, etc.)
      return getAppAuthHeaders();
    }
    // user.wihy.ai and payment.wihy.ai only need Bearer tokens
    return {};
  } catch {
    // Config not available yet
    return {};
  }
};

/**
 * Check if a URL requires Bearer token authentication
 * Most endpoints require auth except public ones like login/register
 */
const requiresBearerToken = (url: string): boolean => {
  // Public endpoints that don't need Bearer token
  const publicEndpoints = [
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/forgot-password',
    '/api/auth/reset-password',
    '/api/auth/providers',
    '/api/health',
    '/health',
  ];

  // Auth service login/register don't need Bearer token
  if (url.includes('auth.wihy.ai')) {
    for (const endpoint of publicEndpoints) {
      if (url.includes(endpoint)) {
        return false;
      }
    }
  }

  return true;
};

/**
 * Wrapper for fetch with automatic logging, client credentials, AND Bearer token
 * 
 * IMPORTANT: This function now automatically injects the JWT Bearer token
 * for all authenticated endpoints. No need to manually add Authorization header.
 * 
 * @param url - The URL to fetch
 * @param options - Standard RequestInit options
 * @returns Promise<Response>
 */
export async function fetchWithLogging(
  url: string,
  options?: RequestInit
): Promise<Response> {
  const method = options?.method || 'GET';
  
  // Get client credential headers (X-Client-Id, X-Client-Secret) based on URL
  const clientHeaders = getAuthHeadersForUrl(url);
  
  // Start building merged headers
  const existingHeaders = (options?.headers as Record<string, string>) || {};
  const mergedHeaders: Record<string, string> = {
    ...clientHeaders,
    ...existingHeaders,
  };

  // Auto-inject Bearer token if:
  // 1. URL requires authentication
  // 2. Authorization header not already provided
  if (requiresBearerToken(url) && !mergedHeaders['Authorization']) {
    const token = await getStoredToken();
    console.log(`[fetchWithLogging] Token for ${url}:`, token ? `${token.substring(0, 20)}...` : 'NO TOKEN FOUND');
    if (token) {
      // Check if token is expired before using it
      if (isJWTExpired(token)) {
        console.warn('[fetchWithLogging] Token expired, attempting refresh before request...');
        try {
          // Import authService dynamically to avoid circular dependency
          const { authService } = await import('../services/authService');
          const refreshed = await authService.refreshToken?.();
          
          if (refreshed) {
            // Get the new token
            const newToken = await getStoredToken();
            if (newToken) {
              mergedHeaders['Authorization'] = `Bearer ${newToken}`;
            }
          } else {
            // Use expired token anyway - let backend return 401
            mergedHeaders['Authorization'] = `Bearer ${token}`;
          }
        } catch (error) {
          console.error('[fetchWithLogging] Token refresh failed:', error);
          // Use expired token anyway - let backend return 401
          mergedHeaders['Authorization'] = `Bearer ${token}`;
        }
      } else {
        // Token is valid, use it
        mergedHeaders['Authorization'] = `Bearer ${token}`;
      }
    }
  }

  const enhancedOptions: RequestInit = {
    ...options,
    headers: mergedHeaders,
  };
  
  const requestId = apiLogger.logRequest(method, url, enhancedOptions);

  try {
    const response = await fetch(url, enhancedOptions);
    
    // Handle 401 Unauthorized - token expired or invalid
    if (response.status === 401 && requiresBearerToken(url)) {
      console.error('[fetchWithLogging] 401 Unauthorized - token may be expired');
      
      // Try to refresh token and retry
      if (!mergedHeaders['Authorization']) {
        try {
          // Import authService dynamically to avoid circular dependency
          const { authService } = await import('../services/authService');
          
          console.log('[fetchWithLogging] Attempting token refresh...');
          const refreshed = await authService.refreshToken?.();
          
          if (refreshed) {
            // Retry request with new token
            console.log('[fetchWithLogging] Retrying with refreshed token...');
            const newToken = await getStoredToken();
            if (newToken) {
              mergedHeaders['Authorization'] = `Bearer ${newToken}`;
              const retryOptions = {
                ...options,
                headers: mergedHeaders,
              };
              const retryResponse = await fetch(url, retryOptions);
              
              // Clone and log retry response
              const clonedRetry = retryResponse.clone();
              try {
                const data = await clonedRetry.json();
                apiLogger.logResponse(requestId, retryResponse, data);
              } catch {
                apiLogger.logResponse(requestId, retryResponse);
              }
              
              return retryResponse;
            }
          }
        } catch (refreshError) {
          console.error('[fetchWithLogging] Token refresh failed:', refreshError);
        }
      }
      
      // Log the 401 response
      apiLogger.logResponse(requestId, response);
      return response;
    }
    
    // Clone response to read body without consuming it
    const clonedResponse = response.clone();
    
    try {
      const data = await clonedResponse.json();
      apiLogger.logResponse(requestId, response, data);
    } catch {
      // Response is not JSON
      apiLogger.logResponse(requestId, response);
    }

    return response;
  } catch (error) {
    apiLogger.logError(requestId, error, { method, url, options: enhancedOptions });
    throw error;
  }
}
