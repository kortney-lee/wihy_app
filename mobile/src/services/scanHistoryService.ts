/**
 * Scan History Service
 * 
 * Client for Scan History API (services.wihy.ai)
 * Retrieves historical scan data for food, pills, labels, etc.
 * 
 * Endpoints:
 * - GET  /api/scan/history       Get scan history
 * - GET  /api/scan/history/:id   Get scan by ID
 * - GET  /api/scan/upload-url    Get signed upload URL
 */

import { servicesApi, CachedApiResponse } from './servicesApiClient';
import { storageService } from './storage/storageService';
import {
  ScanHistoryItem,
  ScanType,
  ScanHistoryFilters,
  GetScanHistoryResponse,
  GetScanByIdResponse,
  GetUploadUrlResponse,
  ScanSummary,
  SCAN_TYPE_LABELS,
} from '../types/scan.types';

// ============================================
// CACHE KEYS
// ============================================

const CACHE_KEYS = {
  SCAN_HISTORY: 'scan_history',
  SCAN_HISTORY_FILTERED: (filters: string) => `scan_history_${filters}`,
  SCAN_BY_ID: (id: number) => `scan_${id}`,
};

const CACHE_TTL_MINUTES = 5;

// ============================================
// SCAN HISTORY SERVICE CLASS
// ============================================

class ScanHistoryService {
  private basePath = '/api/scan';

  /**
   * Get scan history with optional filters
   */
  async getScanHistory(
    filters?: ScanHistoryFilters
  ): Promise<CachedApiResponse<GetScanHistoryResponse>> {
    const params = {
      limit: filters?.limit || 50,
      includeImages: filters?.includeImages !== false,
      ...filters,
    };

    const cacheKey = filters
      ? CACHE_KEYS.SCAN_HISTORY_FILTERED(JSON.stringify(filters))
      : CACHE_KEYS.SCAN_HISTORY;

    return servicesApi.getWithCache<GetScanHistoryResponse>(
      `${this.basePath}/history`,
      cacheKey,
      CACHE_TTL_MINUTES,
      params
    );
  }

  /**
   * Get recent scans (shorthand for limit=10)
   */
  async getRecentScans(limit: number = 10): Promise<CachedApiResponse<GetScanHistoryResponse>> {
    return this.getScanHistory({ limit, includeImages: true });
  }

  /**
   * Get scans by type
   */
  async getScansByType(
    scanType: ScanType,
    limit?: number
  ): Promise<CachedApiResponse<GetScanHistoryResponse>> {
    return this.getScanHistory({ scan_type: scanType, limit });
  }

  /**
   * Get a specific scan by ID
   */
  async getScanById(scanId: number): Promise<CachedApiResponse<GetScanByIdResponse>> {
    return servicesApi.getWithCache<GetScanByIdResponse>(
      `${this.basePath}/history/${scanId}`,
      CACHE_KEYS.SCAN_BY_ID(scanId),
      CACHE_TTL_MINUTES
    );
  }

  /**
   * Get signed URL for direct upload to Google Cloud Storage
   */
  async getUploadUrl(extension: string = 'jpg'): Promise<GetUploadUrlResponse> {
    return servicesApi.get<GetUploadUrlResponse>(
      `${this.basePath}/upload-url`,
      { extension }
    );
  }

  // ==========================================
  // ANALYSIS HELPERS
  // ==========================================

  /**
   * Generate scan summary statistics
   */
  generateSummary(scans: ScanHistoryItem[]): ScanSummary {
    const scansByType: { [key in ScanType]?: number } = {};
    let totalHealthScore = 0;
    let healthScoreCount = 0;

    scans.forEach((scan) => {
      // Count by type
      const type = scan.scan_type as ScanType;
      scansByType[type] = (scansByType[type] || 0) + 1;

      // Sum health scores
      if (scan.health_score !== undefined && scan.health_score !== null) {
        totalHealthScore += scan.health_score;
        healthScoreCount++;
      }
    });

    return {
      totalScans: scans.length,
      scansByType,
      averageHealthScore: healthScoreCount > 0
        ? Math.round(totalHealthScore / healthScoreCount)
        : undefined,
      recentScans: scans.slice(0, 5),
    };
  }

  /**
   * Group scans by date
   */
  groupByDate(scans: ScanHistoryItem[]): Map<string, ScanHistoryItem[]> {
    const grouped = new Map<string, ScanHistoryItem[]>();

    scans.forEach((scan) => {
      const date = scan.scan_timestamp.split('T')[0];
      const existing = grouped.get(date) || [];
      grouped.set(date, [...existing, scan]);
    });

    return grouped;
  }

  /**
   * Get scans from last N days
   */
  filterLastDays(scans: ScanHistoryItem[], days: number): ScanHistoryItem[] {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    return scans.filter(
      (scan) => new Date(scan.scan_timestamp) >= cutoff
    );
  }

  /**
   * Get scan type label
   */
  getScanTypeLabel(scanType: ScanType): string {
    return SCAN_TYPE_LABELS[scanType] || scanType;
  }

  /**
   * Get health score color
   */
  getHealthScoreColor(score: number): string {
    if (score >= 70) return '#4CAF50'; // Green
    if (score >= 50) return '#FFC107'; // Yellow
    if (score >= 30) return '#FF9800'; // Orange
    return '#F44336'; // Red
  }

  /**
   * Get NOVA classification description
   */
  getNovaDescription(nova: number): string {
    switch (nova) {
      case 1:
        return 'Unprocessed or minimally processed';
      case 2:
        return 'Processed culinary ingredients';
      case 3:
        return 'Processed foods';
      case 4:
        return 'Ultra-processed foods';
      default:
        return 'Unknown';
    }
  }

  /**
   * Format scan date for display
   */
  formatScanDate(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return 'Today';
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return `${days} days ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      });
    }
  }

  // ==========================================
  // CACHE MANAGEMENT
  // ==========================================

  /**
   * Clear scan history cache
   */
  async clearCache(): Promise<void> {
    await storageService.remove(CACHE_KEYS.SCAN_HISTORY);
    // Note: Filtered caches will expire naturally
  }
}

// Export singleton
export const scanHistoryService = new ScanHistoryService();

export default scanHistoryService;
