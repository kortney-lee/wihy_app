/**
 * WIHY Scan Service Hook
 * React hook for integrating WIHY scanning services
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { wihyApiService, WIHYApiService, HealthTrends } from '../services/wihyApiService';
import { WIHYError } from '../services/errors';
import type {
  BarcodeScanResult,
  FoodPhotoScanResult,
  PillScanResult,
  LabelScanResult,
  ScanHistoryResult,
  ScanHistoryItem,
} from '../services/types';

// Helper function to format errors for display
function formatErrorForDisplay(error: unknown): string {
  if (error instanceof WIHYError) {
    return error.getUserMessage();
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
}

interface ScanState {
  loading: boolean;
  error: string | null;
  lastScan: BarcodeScanResult | FoodPhotoScanResult | PillScanResult | LabelScanResult | null;
}

interface HistoryState {
  loading: boolean;
  error: string | null;
  data: ScanHistoryItem[];
  count: number;
}

/**
 * Hook for WIHY scan service operations
 */
export function useScanService(userId?: string) {
  const serviceRef = useRef<WIHYApiService>(wihyApiService);
  
  const [scanState, setScanState] = useState<ScanState>({
    loading: false,
    error: null,
    lastScan: null,
  });

  const [historyState, setHistoryState] = useState<HistoryState>({
    loading: false,
    error: null,
    data: [],
    count: 0,
  });

  // Update user ID when it changes
  useEffect(() => {
    if (userId) {
      serviceRef.current.setUserId(userId);
    }
  }, [userId]);

  // ==========================================
  // SCANNING OPERATIONS
  // ==========================================

  /**
   * Scan a barcode
   */
  const scanBarcode = useCallback(async (barcode: string): Promise<BarcodeScanResult> => {
    setScanState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const result = await serviceRef.current.scanBarcode(barcode);
      
      setScanState({
        loading: false,
        error: result.success ? null : (result.error || 'Scan failed'),
        lastScan: result,
      });
      
      // Refresh history in background
      if (result.success) {
        refreshHistory();
      }
      
      return result;
    } catch (error) {
      const errorMessage = formatErrorForDisplay(error);
      setScanState({
        loading: false,
        error: errorMessage,
        lastScan: null,
      });
      throw error;
    }
  }, []);

  /**
   * Scan a food photo
   */
  const scanFoodPhoto = useCallback(async (imageUri: string): Promise<FoodPhotoScanResult> => {
    setScanState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const result = await serviceRef.current.scanFoodPhoto(imageUri);
      
      setScanState({
        loading: false,
        error: result.success ? null : (result.error || 'Scan failed'),
        lastScan: result,
      });
      
      // Refresh history in background
      if (result.success) {
        refreshHistory();
      }
      
      return result;
    } catch (error) {
      const errorMessage = formatErrorForDisplay(error);
      setScanState({
        loading: false,
        error: errorMessage,
        lastScan: null,
      });
      throw error;
    }
  }, []);

  /**
   * Scan a pill
   */
  const scanPill = useCallback(async (
    imageUri: string,
    context?: { imprint?: string; color?: string; shape?: string }
  ): Promise<PillScanResult> => {
    setScanState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const result = await serviceRef.current.scanPill(imageUri, context);
      
      setScanState({
        loading: false,
        error: result.success ? null : (result.error || 'Scan failed'),
        lastScan: result,
      });
      
      return result;
    } catch (error) {
      const errorMessage = formatErrorForDisplay(error);
      setScanState({
        loading: false,
        error: errorMessage,
        lastScan: null,
      });
      throw error;
    }
  }, []);

  /**
   * Confirm a pill identification
   */
  const confirmPill = useCallback(async (
    scanId: string,
    selectedRxcui: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      return await serviceRef.current.confirmPill(scanId, selectedRxcui);
    } catch (error) {
      return {
        success: false,
        error: formatErrorForDisplay(error),
      };
    }
  }, []);

  /**
   * Scan a product label
   */
  const scanProductLabel = useCallback(async (imageUri: string): Promise<LabelScanResult> => {
    setScanState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const result = await serviceRef.current.scanProductLabel(imageUri);
      
      setScanState({
        loading: false,
        error: result.success ? null : (result.error || 'Scan failed'),
        lastScan: result,
      });
      
      // Refresh history in background
      if (result.success) {
        refreshHistory();
      }
      
      return result;
    } catch (error) {
      const errorMessage = formatErrorForDisplay(error);
      setScanState({
        loading: false,
        error: errorMessage,
        lastScan: null,
      });
      throw error;
    }
  }, []);

  // ==========================================
  // HISTORY OPERATIONS
  // ==========================================

  /**
   * Load scan history
   */
  const loadHistory = useCallback(async (
    limit: number = 50,
    scanType?: 'barcode' | 'image' | 'pill' | 'label'
  ): Promise<ScanHistoryResult> => {
    setHistoryState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const result = await serviceRef.current.getScanHistory(limit, scanType, false);
      
      setHistoryState({
        loading: false,
        error: result.success ? null : (result.error || 'Failed to load history'),
        data: result.scans || [],
        count: result.count || 0,
      });
      
      return result;
    } catch (error) {
      const errorMessage = formatErrorForDisplay(error);
      setHistoryState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      throw error;
    }
  }, []);

  /**
   * Refresh history (uses cache)
   */
  const refreshHistory = useCallback(async () => {
    try {
      const result = await serviceRef.current.getScanHistory(50, undefined, false);
      
      if (result.success) {
        setHistoryState(prev => ({
          ...prev,
          data: result.scans || [],
          count: result.count || 0,
          error: null,
        }));
      }
    } catch (error) {
      console.error('[useScanService] Failed to refresh history:', error);
    }
  }, []);

  /**
   * Delete a scan from history
   */
  const deleteScan = useCallback(async (scanId: number): Promise<{ success: boolean }> => {
    try {
      const result = await serviceRef.current.deleteScan(scanId);
      
      if (result.success) {
        // Update local state
        setHistoryState(prev => ({
          ...prev,
          data: prev.data.filter(scan => scan.id !== scanId),
          count: prev.count - 1,
        }));
      }
      
      return result;
    } catch (error) {
      return { success: false };
    }
  }, []);

  // ==========================================
  // TRENDS & ANALYTICS
  // ==========================================

  /**
   * Get health trends
   */
  const getHealthTrends = useCallback(async (
    timeRange: 'day' | 'week' | 'month' | 'all' = 'week'
  ): Promise<HealthTrends> => {
    try {
      return await serviceRef.current.getHealthTrends(timeRange);
    } catch (error) {
      console.error('[useScanService] Failed to get health trends:', error);
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
  }, []);

  // ==========================================
  // UTILITY FUNCTIONS
  // ==========================================

  /**
   * Clear scan state
   */
  const clearScanState = useCallback(() => {
    setScanState({
      loading: false,
      error: null,
      lastScan: null,
    });
  }, []);

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setScanState(prev => ({ ...prev, error: null }));
  }, []);

  /**
   * Clear cache
   */
  const clearCache = useCallback(() => {
    serviceRef.current.clearCache();
    setHistoryState({
      loading: false,
      error: null,
      data: [],
      count: 0,
    });
  }, []);

  return {
    // Scanning
    scanBarcode,
    scanFoodPhoto,
    scanPill,
    confirmPill,
    scanProductLabel,
    
    // History
    loadHistory,
    refreshHistory,
    deleteScan,
    
    // Trends
    getHealthTrends,
    
    // State
    scanState,
    historyState,
    
    // Utilities
    clearScanState,
    clearError,
    clearCache,
    
    // Convenience getters
    isScanning: scanState.loading,
    scanError: scanState.error,
    lastScanResult: scanState.lastScan,
    scanHistory: historyState.data,
    historyLoading: historyState.loading,
    historyError: historyState.error,
  };
}

/**
 * Hook for health trends data
 */
export function useHealthTrends(timeRange: 'week' | 'month' | 'all' = 'week') {
  const [trends, setTrends] = useState<HealthTrends>({
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
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTrends = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await wihyApiService.getHealthTrends(timeRange);
      setTrends(data);
    } catch (err) {
      setError(formatErrorForDisplay(err));
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    loadTrends();
  }, [loadTrends]);

  return {
    trends: trends.trends,
    averageHealthScore: trends.averageHealthScore,
    totalScans: trends.totalScans,
    scansByType: trends.scansByType,
    loading,
    error,
    refresh: loadTrends,
  };
}

/**
 * Hook for recent scans (simplified)
 */
export function useRecentScans(limit: number = 10) {
  const [scans, setScans] = useState<ScanHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadScans = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await wihyApiService.getScanHistory(limit);
      if (result.success) {
        setScans(result.scans || []);
      } else {
        setError(result.error || 'Failed to load scans');
      }
    } catch (err) {
      setError(formatErrorForDisplay(err));
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    loadScans();
  }, [loadScans]);

  return {
    scans,
    loading,
    error,
    refresh: loadScans,
  };
}
