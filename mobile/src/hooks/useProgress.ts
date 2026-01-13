/**
 * useProgress Hook
 * 
 * React hook for managing progress photos and measurements.
 * Provides data fetching, caching, and state management.
 */

import { useState, useEffect, useCallback } from 'react';
import progressService from '../services/progressTrackingService';
import {
  ProgressPhoto,
  Measurement,
  PhotoType,
  MeasurementType,
  UploadPhotoRequest,
  LogMeasurementRequest,
  LatestMeasurements,
} from '../types/progress.types';

// ============================================
// TYPES
// ============================================

interface UseProgressReturn {
  // Photo Data
  photos: ProgressPhoto[];
  photosByType: {
    front: ProgressPhoto[];
    side: ProgressPhoto[];
    back: ProgressPhoto[];
  };
  
  // Measurement Data
  measurements: Measurement[];
  latestMeasurements: LatestMeasurements | null;
  weightHistory: Measurement[];
  
  // State
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  isStale: boolean;
  
  // Photo Actions
  uploadPhoto: (data: UploadPhotoRequest) => Promise<ProgressPhoto>;
  deletePhoto: (photoId: string) => Promise<void>;
  fetchPhotos: (type?: PhotoType) => Promise<void>;
  
  // Measurement Actions
  logMeasurement: (data: LogMeasurementRequest) => Promise<Measurement>;
  logWeight: (value: number, unit?: 'lbs' | 'kg', notes?: string) => Promise<Measurement>;
  fetchMeasurements: (type?: MeasurementType) => Promise<void>;
  fetchLatestMeasurements: () => Promise<void>;
  
  // Common Actions
  refresh: () => Promise<void>;
  clearError: () => void;
  
  // Helpers
  getWeightChange: () => { change: number; percentChange: number; trend: 'up' | 'down' | 'stable' };
  getMeasurementTrend: (type: MeasurementType) => 'up' | 'down' | 'stable';
}

// ============================================
// HOOK IMPLEMENTATION
// ============================================

export function useProgress(): UseProgressReturn {
  // Photo State
  const [photos, setPhotos] = useState<ProgressPhoto[]>([]);
  
  // Measurement State
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [latestMeasurements, setLatestMeasurements] = useState<LatestMeasurements | null>(null);
  
  // Common State
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isStale, setIsStale] = useState(false);

  // Computed
  const photosByType = {
    front: photos.filter(p => p.type === 'front'),
    side: photos.filter(p => p.type === 'side'),
    back: photos.filter(p => p.type === 'back'),
  };

  const weightHistory = measurements.filter(m => m.type === 'weight');

  // ==========================================
  // PHOTO ACTIONS
  // ==========================================

  const fetchPhotos = useCallback(async (type?: PhotoType) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = type
        ? await progressService.getPhotosByType(type)
        : await progressService.getPhotos();
      
      setPhotos(response.data.photos);
      setIsStale(response.isStale);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch photos');
    } finally {
      setLoading(false);
    }
  }, []);

  const uploadPhoto = useCallback(async (data: UploadPhotoRequest): Promise<ProgressPhoto> => {
    setError(null);
    
    try {
      const response = await progressService.uploadPhoto(data);
      setPhotos(prev => [response.photo, ...prev]);
      return response.photo;
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to upload photo';
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  }, []);

  const deletePhoto = useCallback(async (photoId: string): Promise<void> => {
    setError(null);
    
    try {
      await progressService.deletePhoto(photoId);
      setPhotos(prev => prev.filter(p => p.id !== photoId));
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to delete photo';
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  }, []);

  // ==========================================
  // MEASUREMENT ACTIONS
  // ==========================================

  const fetchMeasurements = useCallback(async (type?: MeasurementType) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = type
        ? await progressService.getMeasurementsByType(type)
        : await progressService.getMeasurements();
      
      setMeasurements(response.data.measurements);
      setIsStale(response.isStale);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch measurements');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchLatestMeasurements = useCallback(async () => {
    try {
      const response = await progressService.getLatestMeasurements();
      setLatestMeasurements(response.data.latest);
      setIsStale(prev => prev || response.isStale);
    } catch (err: any) {
      console.error('Failed to fetch latest measurements:', err);
    }
  }, []);

  const logMeasurement = useCallback(async (data: LogMeasurementRequest): Promise<Measurement> => {
    setError(null);
    
    try {
      const response = await progressService.logMeasurement(data);
      setMeasurements(prev => [response.measurement, ...prev]);
      
      // Update latest measurements
      if (latestMeasurements) {
        setLatestMeasurements({
          ...latestMeasurements,
          [data.type]: {
            value: data.value,
            unit: data.unit,
            recorded_at: new Date().toISOString(),
          },
        });
      }
      
      return response.measurement;
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to log measurement';
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  }, [latestMeasurements]);

  const logWeight = useCallback(async (
    value: number,
    unit: 'lbs' | 'kg' = 'lbs',
    notes?: string
  ): Promise<Measurement> => {
    return logMeasurement({
      type: 'weight',
      value,
      unit,
      date: new Date().toISOString().split('T')[0],
      notes,
    });
  }, [logMeasurement]);

  // ==========================================
  // COMMON ACTIONS
  // ==========================================

  const refresh = useCallback(async (): Promise<void> => {
    setRefreshing(true);
    await Promise.all([
      fetchPhotos(),
      fetchMeasurements(),
      fetchLatestMeasurements(),
    ]);
    setRefreshing(false);
  }, [fetchPhotos, fetchMeasurements, fetchLatestMeasurements]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // ==========================================
  // HELPERS
  // ==========================================

  const getWeightChange = useCallback(() => {
    return progressService.calculateChange(weightHistory);
  }, [weightHistory]);

  const getMeasurementTrend = useCallback((type: MeasurementType): 'up' | 'down' | 'stable' => {
    const typeMeasurements = measurements.filter(m => m.type === type);
    const result = progressService.calculateChange(typeMeasurements);
    return result.trend;
  }, [measurements]);

  // ==========================================
  // INITIAL LOAD
  // ==========================================

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      await Promise.all([
        fetchPhotos(),
        fetchMeasurements(),
        fetchLatestMeasurements(),
      ]);
      setLoading(false);
    };
    
    loadInitialData();
  }, []);

  return {
    // Photo Data
    photos,
    photosByType,
    
    // Measurement Data
    measurements,
    latestMeasurements,
    weightHistory,
    
    // State
    loading,
    refreshing,
    error,
    isStale,
    
    // Photo Actions
    uploadPhoto,
    deletePhoto,
    fetchPhotos,
    
    // Measurement Actions
    logMeasurement,
    logWeight,
    fetchMeasurements,
    fetchLatestMeasurements,
    
    // Common Actions
    refresh,
    clearError,
    
    // Helpers
    getWeightChange,
    getMeasurementTrend,
  };
}

export default useProgress;
