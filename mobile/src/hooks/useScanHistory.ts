/**
 * useScanHistory Hook
 * 
 * React hook for accessing scan history data.
 * Provides data fetching, caching, and analysis helpers.
 */

import { useState, useEffect, useCallback } from 'react';
import scanHistoryService from '../services/scanHistoryService';
import {
  ScanHistoryItem,
  ScanType,
  ScanSummary,
} from '../types/scan.types';

// ============================================
// TYPES
// ============================================

interface UseScanHistoryReturn {
  // Data
  scans: ScanHistoryItem[];
  recentScans: ScanHistoryItem[];
  summary: ScanSummary | null;
  selectedScan: ScanHistoryItem | null;
  
  // State
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  isStale: boolean;
  
  // Actions
  fetchHistory: (limit?: number) => Promise<void>;
  fetchByType: (type: ScanType, limit?: number) => Promise<void>;
  fetchScanById: (scanId: number) => Promise<void>;
  refresh: () => Promise<void>;
  clearError: () => void;
  clearSelectedScan: () => void;
  
  // Helpers
  groupByDate: () => Map<string, ScanHistoryItem[]>;
  filterLastDays: (days: number) => ScanHistoryItem[];
  getHealthScoreColor: (score: number) => string;
  getNovaDescription: (nova: number) => string;
  getScanTypeLabel: (type: ScanType) => string;
  formatScanDate: (timestamp: string) => string;
}

// ============================================
// HOOK IMPLEMENTATION
// ============================================

export function useScanHistory(initialLimit: number = 50): UseScanHistoryReturn {
  // State
  const [scans, setScans] = useState<ScanHistoryItem[]>([]);
  const [selectedScan, setSelectedScan] = useState<ScanHistoryItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isStale, setIsStale] = useState(false);

  // Computed
  const recentScans = scans.slice(0, 10);
  const summary = scans.length > 0 ? scanHistoryService.generateSummary(scans) : null;

  // ==========================================
  // ACTIONS
  // ==========================================

  const fetchHistory = useCallback(async (limit: number = initialLimit) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await scanHistoryService.getScanHistory({ limit, includeImages: true });
      setScans(response.data.scans);
      setIsStale(response.isStale);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch scan history');
    } finally {
      setLoading(false);
    }
  }, [initialLimit]);

  const fetchByType = useCallback(async (type: ScanType, limit?: number) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await scanHistoryService.getScansByType(type, limit);
      setScans(response.data.scans);
      setIsStale(response.isStale);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch scans by type');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchScanById = useCallback(async (scanId: number) => {
    setError(null);
    
    try {
      const response = await scanHistoryService.getScanById(scanId);
      setSelectedScan(response.data.scan);
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to fetch scan';
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  }, []);

  const refresh = useCallback(async (): Promise<void> => {
    setRefreshing(true);
    await fetchHistory();
    setRefreshing(false);
  }, [fetchHistory]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearSelectedScan = useCallback(() => {
    setSelectedScan(null);
  }, []);

  // ==========================================
  // HELPERS
  // ==========================================

  const groupByDate = useCallback((): Map<string, ScanHistoryItem[]> => {
    return scanHistoryService.groupByDate(scans);
  }, [scans]);

  const filterLastDays = useCallback((days: number): ScanHistoryItem[] => {
    return scanHistoryService.filterLastDays(scans, days);
  }, [scans]);

  const getHealthScoreColor = useCallback((score: number): string => {
    return scanHistoryService.getHealthScoreColor(score);
  }, []);

  const getNovaDescription = useCallback((nova: number): string => {
    return scanHistoryService.getNovaDescription(nova);
  }, []);

  const getScanTypeLabel = useCallback((type: ScanType): string => {
    return scanHistoryService.getScanTypeLabel(type);
  }, []);

  const formatScanDate = useCallback((timestamp: string): string => {
    return scanHistoryService.formatScanDate(timestamp);
  }, []);

  // ==========================================
  // INITIAL LOAD
  // ==========================================

  useEffect(() => {
    fetchHistory();
  }, []);

  return {
    // Data
    scans,
    recentScans,
    summary,
    selectedScan,
    
    // State
    loading,
    refreshing,
    error,
    isStale,
    
    // Actions
    fetchHistory,
    fetchByType,
    fetchScanById,
    refresh,
    clearError,
    clearSelectedScan,
    
    // Helpers
    groupByDate,
    filterLastDays,
    getHealthScoreColor,
    getNovaDescription,
    getScanTypeLabel,
    formatScanDate,
  };
}

export default useScanHistory;
