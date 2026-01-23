/**
 * WIHY API Service
 * Comprehensive API client for WIHY scanning services
 * 
 * Production Service URL: https://services.wihy.ai
 * API Version: v1
 * Last Updated: January 7, 2026
 */

import { API_CONFIG, getDefaultUserContext } from './config';
import { authService } from './authService';
import { fetchWithLogging } from '../utils/apiLogger';
import { compressImageForUpload } from '../utils/imageCompression';
import { WIHYError, WIHYErrorCode as ErrorCode, createErrorFromResponse, createNetworkError } from './errors';
import { RateLimiter } from '../utils/rateLimiter';
import type {
  BarcodeScanResult,
  BarcodeScanResponse,
  FoodPhotoScanResult,
  PhotoScanResponse,
  PillScanResult,
  LabelScanResult,
  LabelScanResponse,
  ScanHistoryResult,
  ScanHistoryItem,
  PillMatch,
} from './types';

// Health Trends type for scan-based health analytics
export interface HealthTrends {
  trends: Array<{ date: string; avgScore: number; scanCount: number }>;
  averageHealthScore: number;
  totalScans: number;
  scansByType: {
    barcode: number;
    food_photo: number;
    image: number;
    pill: number;
    product_label: number;
    label: number;
  };
}

// Configuration
const WIHY_CONFIG = {
  baseURL: API_CONFIG.baseUrl,
  apiVersion: 'v1',
  timeout: API_CONFIG.timeout,
  maxImageSize: 10 * 1024 * 1024, // 10MB
  endpoints: {
    scan: '/api/scan',
    scanPhoto: '/api/scan/photo',
    scanLabel: '/api/scan/label',
    scanHistory: '/api/scan/history',
    pillScan: '/api/v1/medications/pills/scan',
    pillConfirm: '/api/v1/medications/pills/confirm',
  },
};

// Cache for scan history
class ScanHistoryCache {
  private cache: Map<string, { data: ScanHistoryResult; timestamp: number }> = new Map();
  private cacheExpiry = 5 * 60 * 1000; // 5 minutes

  getCached(userId: string): ScanHistoryResult | null {
    const cached = this.cache.get(userId);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > this.cacheExpiry) {
      this.cache.delete(userId);
      return null;
    }

    return cached.data;
  }

  setCached(userId: string, result: ScanHistoryResult): void {
    this.cache.set(userId, { data: result, timestamp: Date.now() });
  }

  invalidate(userId?: string): void {
    if (userId) {
      this.cache.delete(userId);
    } else {
      this.cache.clear();
    }
  }
}

/**
 * WIHY API Service Class
 * Provides methods for all scanning operations
 */
export class WIHYApiService {
  private userId: string;
  private rateLimiter: RateLimiter;
  private cache: ScanHistoryCache;

  constructor(userId?: string) {
    this.userId = userId || getDefaultUserContext().userId;
    this.rateLimiter = new RateLimiter(1000); // 1 second between requests
    this.cache = new ScanHistoryCache();
  }

  /**
   * Set the user ID for API calls
   */
  setUserId(userId: string): void {
    this.userId = userId;
  }

  /**
   * Get current authenticated user ID from auth service.
   * Throws error if user is not authenticated - no fallbacks.
   */
  async getCurrentUserId(): Promise<string> {
    // If we already have a real user ID (not the default), use it
    if (this.userId && this.userId !== 'mobile-user') {
      return this.userId;
    }
    
    // Get the authenticated user's ID from auth service
    const userData = await authService.getUserData();
    if (userData?.id) {
      this.userId = userData.id;
      return userData.id;
    }
    
    throw new Error('User not authenticated. Please log in to continue.');
  }

  /**
   * Get current user ID (sync - may return stale default)
   * @deprecated Use getCurrentUserId() instead for accurate user ID
   */
  getUserId(): string {
    return this.userId;
  }

  /**
   * Make an authenticated request to the WIHY API
   */
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${WIHY_CONFIG.baseURL}${endpoint}`;
    
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': 'WIHY-Mobile/2.0.1',
      'X-Client-Version': '2.0.1',
      'X-Platform': 'react-native',
      ...options.headers,
    };

    try {
      const response = await fetchWithLogging(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw createErrorFromResponse(response.status, errorText);
      }

      return response.json() as Promise<T>;
    } catch (error) {
      if (error instanceof WIHYError) {
        throw error;
      }
      
      // Network error
      if (error instanceof TypeError && error.message.includes('Network')) {
        throw new WIHYError(ErrorCode.NETWORK_ERROR, 'Network connection error');
      }
      
      throw new WIHYError(ErrorCode.SERVER_ERROR, (error as Error).message);
    }
  }

  /**
   * Check rate limit before making request
   */
  private checkRateLimit(): void {
    if (!this.rateLimiter.canMakeRequest()) {
      const waitTime = this.rateLimiter.getWaitTime();
      throw new WIHYError(
        ErrorCode.RATE_LIMIT_EXCEEDED,
        `Rate limit exceeded. Please wait ${waitTime}ms before making another request.`
      );
    }
  }

  // ==========================================
  // BARCODE SCAN
  // ==========================================

  /**
   * Scan a product by barcode
   * @param barcode - The product barcode
   * @param trackHistory - Whether to track this scan in history
   * @returns Complete barcode scan result
   */
  async scanBarcode(
    barcode: string,
    trackHistory: boolean = true
  ): Promise<BarcodeScanResult> {
    this.checkRateLimit();

    const startTime = Date.now();
    console.log('[WIHYApiService] Scanning barcode:', barcode);

    try {
      // Get the current authenticated user ID
      const currentUserId = await this.getCurrentUserId();
      
      const requestBody = {
        barcode,
        user_context: {
          userId: currentUserId,
          trackHistory,
          include_charts: true,
          include_ingredients: true,
        },
      };

      const result = await this.makeRequest<BarcodeScanResult>(
        WIHY_CONFIG.endpoints.scan,
        {
          method: 'POST',
          body: JSON.stringify(requestBody),
        }
      );

      const processingTime = Date.now() - startTime;
      console.log(`[WIHYApiService] Barcode scan completed in ${processingTime}ms`);

      // Invalidate history cache after successful scan
      if (trackHistory) {
        this.cache.invalidate(currentUserId);
      }

      return {
        ...result,
        success: true,
        processing_time: processingTime,
      };
    } catch (error) {
      console.error('[WIHYApiService] Barcode scan failed:', error);
      return {
        success: false,
        error: (error as WIHYError).message || 'Failed to scan barcode',
      } as BarcodeScanResponse;
    }
  }

  // ==========================================
  // FOOD PHOTO SCAN
  // ==========================================

  /**
   * Scan a food photo for nutrition analysis
   * @param imageUri - Local image URI
   * @param trackHistory - Whether to track this scan in history
   * @returns Food photo scan result with nutrition data
   */
  async scanFoodPhoto(
    imageUri: string,
    trackHistory: boolean = true
  ): Promise<FoodPhotoScanResult> {
    this.checkRateLimit();

    const startTime = Date.now();
    console.log('[WIHYApiService] Scanning food photo...');

    try {
      // Get the current authenticated user ID
      const currentUserId = await this.getCurrentUserId();
      
      // Compress and encode image
      const base64Image = await compressImageForUpload(imageUri, {
        maxSizeKB: 500,
        maxWidth: 2048,
        maxHeight: 2048,
        quality: 0.85,
      });

      console.log(`[WIHYApiService] Image compressed, size: ${Math.round(base64Image.length / 1024)}KB`);

      const requestBody = {
        image: base64Image,
        user_context: {
          userId: currentUserId,
          trackHistory,
          include_charts: true,
        },
      };

      const result = await this.makeRequest<FoodPhotoScanResult>(
        WIHY_CONFIG.endpoints.scanPhoto,
        {
          method: 'POST',
          body: JSON.stringify(requestBody),
        }
      );

      const processingTime = Date.now() - startTime;
      console.log(`[WIHYApiService] Food photo scan completed in ${processingTime}ms`);

      // Invalidate history cache after successful scan
      if (trackHistory) {
        this.cache.invalidate(currentUserId);
      }

      return {
        ...result,
        success: true,
        processing_time: processingTime,
      };
    } catch (error) {
      console.error('[WIHYApiService] Food photo scan failed:', error);
      return {
        success: false,
        error: (error as WIHYError).message || 'Failed to scan food photo',
      } as PhotoScanResponse;
    }
  }

  // ==========================================
  // PILL IDENTIFICATION
  // ==========================================

  /**
   * Scan a pill for identification
   * @param imageUri - Local image URI of the pill
   * @param context - Optional pill context (imprint, color, shape)
   * @returns Pill scan result with matches
   */
  async scanPill(
    imageUri: string,
    context?: {
      imprint?: string;
      color?: string;
      shape?: string;
    }
  ): Promise<PillScanResult> {
    this.checkRateLimit();

    const startTime = Date.now();
    console.log('[WIHYApiService] Scanning pill...');

    try {
      // Get the current authenticated user ID
      const currentUserId = await this.getCurrentUserId();
      
      // Compress and encode image
      const base64Image = await compressImageForUpload(imageUri, {
        maxSizeKB: 500,
        maxWidth: 2048,
        maxHeight: 2048,
        quality: 0.9,
      });

      const requestBody = {
        images: [base64Image],
        context: {
          userId: currentUserId,
          ...context,
        },
      };

      const result = await this.makeRequest<PillScanResult>(
        WIHY_CONFIG.endpoints.pillScan,
        {
          method: 'POST',
          body: JSON.stringify(requestBody),
        }
      );

      const processingTime = Date.now() - startTime;
      console.log(`[WIHYApiService] Pill scan completed in ${processingTime}ms`);

      return {
        ...result,
        success: true,
      };
    } catch (error) {
      console.error('[WIHYApiService] Pill scan failed:', error);
      return {
        success: false,
        error: (error as WIHYError).message || 'Failed to identify pill',
      };
    }
  }

  /**
   * Confirm a pill identification
   * @param scanId - The scan ID from the initial pill scan
   * @param selectedRxcui - The RXCUI of the confirmed pill
   * @returns Confirmation result
   */
  async confirmPill(
    scanId: string,
    selectedRxcui: string
  ): Promise<{ success: boolean; medicationAdded: boolean; error?: string }> {
    this.checkRateLimit();

    console.log('[WIHYApiService] Confirming pill:', scanId, selectedRxcui);

    try {
      // Get the current authenticated user ID
      const currentUserId = await this.getCurrentUserId();
      
      const requestBody = {
        scanId,
        selectedRxcui,
        userId: currentUserId,
      };

      const result = await this.makeRequest<{
        success: boolean;
        medicationAdded: boolean;
      }>(WIHY_CONFIG.endpoints.pillConfirm, {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      return result;
    } catch (error) {
      console.error('[WIHYApiService] Pill confirmation failed:', error);
      return {
        success: false,
        medicationAdded: false,
        error: (error as WIHYError).message || 'Failed to confirm pill',
      };
    }
  }

  // ==========================================
  // LABEL SCAN (GREENWASHING DETECTION)
  // ==========================================

  /**
   * Scan a product label for greenwashing claims
   * @param imageUri - Local image URI of the label
   * @param trackHistory - Whether to track this scan in history
   * @returns Label scan result with greenwashing analysis
   */
  async scanProductLabel(
    imageUri: string,
    trackHistory: boolean = true
  ): Promise<LabelScanResult> {
    this.checkRateLimit();

    const startTime = Date.now();
    console.log('[WIHYApiService] Scanning product label...');

    try {
      // Get the current authenticated user ID
      const currentUserId = await this.getCurrentUserId();
      
      // Compress and encode image
      const base64Image = await compressImageForUpload(imageUri, {
        maxSizeKB: 500,
        maxWidth: 2048,
        maxHeight: 2048,
        quality: 0.85,
      });

      const requestBody = {
        image: base64Image,
        user_context: {
          userId: currentUserId,
          trackHistory,
        },
      };

      const result = await this.makeRequest<LabelScanResult>(
        WIHY_CONFIG.endpoints.scanLabel,
        {
          method: 'POST',
          body: JSON.stringify(requestBody),
        }
      );

      const processingTime = Date.now() - startTime;
      console.log(`[WIHYApiService] Label scan completed in ${processingTime}ms`);

      // Invalidate history cache after successful scan
      if (trackHistory) {
        this.cache.invalidate(currentUserId);
      }

      return {
        ...result,
        success: true,
      };
    } catch (error) {
      console.error('[WIHYApiService] Label scan failed:', error);
      return {
        success: false,
        error: (error as WIHYError).message || 'Failed to scan label',
      } as LabelScanResponse;
    }
  }

  // ==========================================
  // SCAN HISTORY
  // ==========================================

  /**
   * Get scan history for the current user
   * @param limit - Maximum number of scans to return
   * @param scanType - Optional filter by scan type
   * @param useCache - Whether to use cached results
   * @returns Scan history result
   */
  async getScanHistory(
    limit: number = 50,
    scanType?: 'barcode' | 'image' | 'pill' | 'label',
    useCache: boolean = true
  ): Promise<ScanHistoryResult> {
    console.log('[WIHYApiService] Getting scan history...');

    try {
      // Get the current authenticated user ID
      const currentUserId = await this.getCurrentUserId();
      
      // Check cache first
      if (useCache) {
        const cached = this.cache.getCached(currentUserId);
        if (cached) {
          console.log('[WIHYApiService] Returning cached history');
          return cached;
        }
      }

      const params = new URLSearchParams({
        userId: currentUserId,
        limit: limit.toString(),
        includeImages: 'true',
      });

      if (scanType) {
        params.append('scanType', scanType);
      }

      // API returns { success, data, pagination } but we expect { success, scans, count }
      const apiResponse = await this.makeRequest<{
        success: boolean;
        data: ScanHistoryItem[];
        pagination?: { total: number; limit: number; offset: number; page: number; pages: number };
        error?: string;
      }>(
        `${WIHY_CONFIG.endpoints.scanHistory}?${params}`,
        {
          method: 'GET',
        }
      );

      // Transform API response to match ScanHistoryResult type
      const result: ScanHistoryResult = {
        success: apiResponse.success,
        scans: apiResponse.data || [],
        count: apiResponse.pagination?.total || apiResponse.data?.length || 0,
        error: apiResponse.error,
      };

      // Cache the result
      this.cache.setCached(currentUserId, result);

      console.log(`[WIHYApiService] Retrieved ${result.count} scan history items for user: ${currentUserId}`);

      return result;
    } catch (error) {
      console.error('[WIHYApiService] Failed to get scan history:', error);
      return {
        success: false,
        count: 0,
        scans: [],
        error: (error as WIHYError).message || 'Failed to get scan history',
      };
    }
  }

  /**
   * Delete a scan from history
   * @param scanId - The ID of the scan to delete
   * @returns Success status
   */
  async deleteScan(scanId: number): Promise<{ success: boolean; error?: string }> {
    console.log('[WIHYApiService] Deleting scan:', scanId);

    try {
      // Get the current authenticated user ID
      const currentUserId = await this.getCurrentUserId();
      
      const requestBody = {
        userId: currentUserId,
      };

      await this.makeRequest<{ success: boolean }>(
        `${WIHY_CONFIG.endpoints.scanHistory}/${scanId}`,
        {
          method: 'DELETE',
          body: JSON.stringify(requestBody),
        }
      );

      // Invalidate cache
      this.cache.invalidate(currentUserId);

      return { success: true };
    } catch (error) {
      console.error('[WIHYApiService] Failed to delete scan:', error);
      return {
        success: false,
        error: (error as WIHYError).message || 'Failed to delete scan',
      };
    }
  }

  /**
   * Clear the history cache
   */
  async clearCache(): Promise<void> {
    const currentUserId = await this.getCurrentUserId();
    this.cache.invalidate(currentUserId);
  }

  // ==========================================
  // UTILITY METHODS
  // ==========================================

  /**
   * Get health trends from scan history
   * @param timeRange - Time range for trends
   * @returns Calculated health trends
   */
  async getHealthTrends(
    timeRange: 'day' | 'week' | 'month' | 'all' = 'week'
  ): Promise<HealthTrends> {
    const history = await this.getScanHistory(100);

    if (!history.success || !history.scans.length) {
      return {
        trends: [],
        averageHealthScore: 0,
        totalScans: 0,
        scansByType: {
          barcode: 0,
          food_photo: 0,
          image: 0,
          pill: 0,
          product_label: 0,
          label: 0,
        },
      };
    }

    // Group by date and count by type
    const grouped = new Map<string, Array<{ health_score: number }>>();
    const scansByType = {
      barcode: 0,
      food_photo: 0,
      image: 0,
      pill: 0,
      product_label: 0,
      label: 0,
    };
    const cutoffDate = new Date();

    switch (timeRange) {
      case 'day':
        cutoffDate.setDate(cutoffDate.getDate() - 1);
        break;
      case 'week':
        cutoffDate.setDate(cutoffDate.getDate() - 7);
        break;
      case 'month':
        cutoffDate.setMonth(cutoffDate.getMonth() - 1);
        break;
    }

    let filteredScans = 0;
    history.scans.forEach((scan) => {
      const scanDate = new Date(scan.scan_timestamp);
      
      if (timeRange !== 'all' && scanDate < cutoffDate) {
        return;
      }
      
      filteredScans++;
      
      // Count by scan type
      const scanType = scan.scan_type as keyof typeof scansByType;
      if (scanType in scansByType) {
        scansByType[scanType]++;
      }

      const dateStr = scanDate.toLocaleDateString();
      
      if (!grouped.has(dateStr)) {
        grouped.set(dateStr, []);
      }
      
      if (scan.health_score !== undefined) {
        grouped.get(dateStr)!.push({ health_score: scan.health_score });
      }
    });

    // Calculate trends
    const trends = Array.from(grouped.entries())
      .map(([date, scans]) => {
        const validScans = scans.filter((s) => s.health_score !== undefined);
        if (validScans.length === 0) return null;

        const avgScore =
          validScans.reduce((sum, s) => sum + s.health_score, 0) / validScans.length;

        return {
          date,
          avgScore: Math.round(avgScore),
          scanCount: validScans.length,
        };
      })
      .filter((t): t is NonNullable<typeof t> => t !== null)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Calculate overall average
    const allScores = trends.flatMap((t) =>
      Array(t.scanCount).fill(t.avgScore)
    );
    const averageHealthScore =
      allScores.length > 0
        ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length)
        : 0;

    return {
      trends,
      averageHealthScore,
      totalScans: filteredScans,
      scansByType,
    };
  }
}

// Export singleton instance
export const wihyApiService = new WIHYApiService();

// Export types
export type { BarcodeScanResult, FoodPhotoScanResult, PillScanResult, LabelScanResult, ScanHistoryResult };
