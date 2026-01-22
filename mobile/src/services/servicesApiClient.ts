/**
 * Services API Client
 * 
 * HTTP client for services.wihy.ai with JWT authentication.
 * Integrates with existing auth system.
 * 
 * Base URL: https://services.wihy.ai
 */

import { authService } from './authService';
import { storageService } from './storage/storageService';
import { connectivityService } from './connectivity/connectivityService';
import { fetchWithLogging } from '../utils/apiLogger';

// ============================================
// CONFIGURATION
// ============================================

const SERVICES_BASE_URL = __DEV__
  ? 'http://localhost:3000'
  : 'https://services.wihy.ai';

const DEFAULT_TIMEOUT = 30000; // 30 seconds

// ============================================
// TYPES
// ============================================

interface RequestConfig {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  skipAuth?: boolean;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

export interface CachedApiResponse<T> {
  data: T;
  isStale: boolean;
  fromCache: boolean;
}

// ============================================
// API CLIENT CLASS
// ============================================

class ServicesApiClient {
  private baseUrl: string;
  private timeout: number;

  constructor() {
    this.baseUrl = SERVICES_BASE_URL;
    this.timeout = DEFAULT_TIMEOUT;
  }

  /**
   * Get authorization headers
   */
  private async getAuthHeaders(): Promise<Record<string, string>> {
    const token = await authService.getSessionToken();
    if (!token) {
      throw new Error('No authentication token. Please log in.');
    }
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Make an HTTP request with timeout
   */
  private async fetchWithTimeout(
    url: string,
    options: RequestInit,
    timeout: number
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetchWithLogging(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Request timed out');
      }
      throw error;
    }
  }

  /**
   * Make an authenticated API request
   */
  async request<T>(
    endpoint: string,
    config: RequestConfig
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    // Check connectivity
    const isOnline = await connectivityService.isOnline();
    if (!isOnline) {
      throw new Error('No internet connection');
    }

    // Build headers
    let headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (!config.skipAuth) {
      const authHeaders = await this.getAuthHeaders();
      headers = { ...headers, ...authHeaders };
    }

    if (config.headers) {
      headers = { ...headers, ...config.headers };
    }

    // Build request options
    const options: RequestInit = {
      method: config.method,
      headers,
    };

    if (config.body && ['POST', 'PUT', 'PATCH'].includes(config.method)) {
      options.body = JSON.stringify(config.body);
    }

    try {
      const response = await this.fetchWithTimeout(
        url,
        options,
        config.timeout || this.timeout
      );

      const data = await response.json();

      // Handle 401 - clear tokens and throw
      if (response.status === 401) {
        await authService.clearTokens();
        throw new Error('Session expired. Please log in again.');
      }

      // Handle other errors
      if (!response.ok) {
        throw new Error(data.error || `API error: ${response.status}`);
      }

      return data as T;
    } catch (error: any) {
      console.error(`[ServicesAPI] ${config.method} ${endpoint} failed:`, error.message);
      throw error;
    }
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    let url = endpoint;
    if (params) {
      const queryString = new URLSearchParams(
        Object.entries(params)
          .filter(([_, v]) => v !== undefined && v !== null)
          .map(([k, v]) => [k, String(v)])
      ).toString();
      if (queryString) {
        url = `${endpoint}?${queryString}`;
      }
    }

    return this.request<T>(url, { method: 'GET' });
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, body?: any): Promise<T> {
    return this.request<T>(endpoint, { method: 'POST', body });
  }

  /**
   * PUT request
   */
  async put<T>(endpoint: string, body?: any): Promise<T> {
    return this.request<T>(endpoint, { method: 'PUT', body });
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  /**
   * PATCH request
   */
  async patch<T>(endpoint: string, body?: any): Promise<T> {
    return this.request<T>(endpoint, { method: 'PATCH', body });
  }

  /**
   * GET with caching support
   */
  async getWithCache<T>(
    endpoint: string,
    cacheKey: string,
    ttlMinutes: number = 5,
    params?: Record<string, any>
  ): Promise<CachedApiResponse<T>> {
    // Try to get from cache first
    const cached = await storageService.getCachedWithExpiry<T>(cacheKey);
    
    // Check if online
    const isOnline = await connectivityService.isOnline();
    
    // If offline and have cache, return stale data
    if (!isOnline && cached) {
      return {
        data: cached.data,
        isStale: true,
        fromCache: true,
      };
    }

    // If online, try to fetch fresh data
    if (isOnline) {
      try {
        const freshData = await this.get<T>(endpoint, params);
        
        // Cache the response
        await storageService.setCachedWithExpiry(cacheKey, freshData, ttlMinutes);
        
        return {
          data: freshData,
          isStale: false,
          fromCache: false,
        };
      } catch (error) {
        // If fetch fails but we have cache, return stale data
        if (cached) {
          console.warn(`[ServicesAPI] Using cached data for ${endpoint}`);
          return {
            data: cached.data,
            isStale: true,
            fromCache: true,
          };
        }
        throw error;
      }
    }

    // No cache and offline
    throw new Error('No cached data available and device is offline');
  }
}

// Export singleton instance
export const servicesApi = new ServicesApiClient();

export default servicesApi;
