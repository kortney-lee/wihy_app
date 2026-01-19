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

const isDev = __DEV__;

class ApiLogger {
  private activeRequests: Map<string, number> = new Map();

  /**
   * Log API request
   */
  logRequest(method: string, url: string, options?: RequestInit): string {
    if (!isDev) return '';

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
    if (!isDev) return;

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
    if (!isDev) return;

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
    if (!isDev) return;

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
    if (!isDev) return;

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
    if (!isDev) return;

    console.log(
      `%c[NETWORK] ${isConnected ? '🟢 Connected' : '🔴 Disconnected'}`,
      `color: ${isConnected ? '#10b981' : '#ef4444'}; font-weight: bold`
    );
  }

  /**
   * Log cache hit/miss
   */
  logCache(key: string, hit: boolean): void {
    if (!isDev) return;

    console.log(
      `%c[CACHE] ${hit ? '✅ HIT' : '❌ MISS'}: ${key}`,
      `color: ${hit ? '#10b981' : '#f59e0b'}; font-weight: bold`
    );
  }
}

export const apiLogger = new ApiLogger();

/**
 * Import auth headers from config (lazy import to avoid circular dependency)
 */
const getAuthHeadersForUrl = (url: string): Record<string, string> => {
  try {
    // Lazy import to avoid circular dependency
    const { getMLAuthHeaders, getServicesAuthHeaders } = require('../services/config');
    
    // Determine which auth headers to use based on URL
    if (url.includes('ml.wihy.ai')) {
      return getMLAuthHeaders();
    } else if (url.includes('services.wihy.ai')) {
      return getServicesAuthHeaders();
    }
    return {};
  } catch {
    // Config not available yet
    return {};
  }
};

/**
 * Wrapper for fetch with automatic logging and auth headers
 */
export async function fetchWithLogging(
  url: string,
  options?: RequestInit
): Promise<Response> {
  const method = options?.method || 'GET';
  
  // Auto-inject client auth headers based on URL
  const authHeaders = getAuthHeadersForUrl(url);
  const mergedHeaders = {
    ...authHeaders,
    ...(options?.headers as Record<string, string> || {}),
  };
  
  const enhancedOptions: RequestInit = {
    ...options,
    headers: mergedHeaders,
  };
  
  const requestId = apiLogger.logRequest(method, url, enhancedOptions);

  try {
    const response = await fetch(url, enhancedOptions);
    
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
