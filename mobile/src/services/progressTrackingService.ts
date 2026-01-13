/**
 * Progress Tracking Service
 * 
 * Client for Progress Photos and Measurements API (services.wihy.ai)
 * Handles progress photos and body measurements.
 * 
 * Endpoints:
 * - POST   /api/progress/photos       Upload progress photo
 * - GET    /api/progress/photos       Get photo timeline
 * - DELETE /api/progress/photos/:id   Delete photo
 * - POST   /api/measurements          Log measurement
 * - GET    /api/measurements          Get measurement history
 * - GET    /api/measurements/latest   Get latest measurements
 */

import { servicesApi, CachedApiResponse } from './servicesApiClient';
import { storageService } from './storage/storageService';
import {
  ProgressPhoto,
  Measurement,
  UploadPhotoRequest,
  PhotoFilters,
  LogMeasurementRequest,
  MeasurementFilters,
  UploadPhotoResponse,
  GetPhotosResponse,
  DeletePhotoResponse,
  LogMeasurementResponse,
  GetMeasurementsResponse,
  GetLatestMeasurementsResponse,
  MeasurementType,
  PhotoType,
} from '../types/progress.types';

// ============================================
// CACHE KEYS
// ============================================

const CACHE_KEYS = {
  ALL_PHOTOS: 'progress_photos',
  PHOTOS_BY_TYPE: (type: string) => `progress_photos_${type}`,
  ALL_MEASUREMENTS: 'measurements_all',
  MEASUREMENTS_BY_TYPE: (type: string) => `measurements_${type}`,
  LATEST_MEASUREMENTS: 'measurements_latest',
};

const CACHE_TTL_MINUTES = 5;

// ============================================
// PROGRESS SERVICE CLASS
// ============================================

class ProgressService {
  private photosPath = '/api/progress/photos';
  private measurementsPath = '/api/measurements';

  // ==========================================
  // PROGRESS PHOTOS
  // ==========================================

  /**
   * Upload a progress photo
   * Note: Image should already be uploaded to GCS, this saves the URL reference
   */
  async uploadPhoto(photoData: UploadPhotoRequest): Promise<UploadPhotoResponse> {
    const response = await servicesApi.post<UploadPhotoResponse>(
      this.photosPath,
      photoData
    );

    // Invalidate cache
    await this.invalidatePhotoCache();

    return response;
  }

  /**
   * Get photo timeline with filters
   */
  async getPhotos(filters?: PhotoFilters): Promise<CachedApiResponse<GetPhotosResponse>> {
    const cacheKey = filters?.type
      ? CACHE_KEYS.PHOTOS_BY_TYPE(filters.type)
      : CACHE_KEYS.ALL_PHOTOS;

    return servicesApi.getWithCache<GetPhotosResponse>(
      this.photosPath,
      cacheKey,
      CACHE_TTL_MINUTES,
      filters
    );
  }

  /**
   * Get photos by type
   */
  async getPhotosByType(type: PhotoType, limit?: number): Promise<CachedApiResponse<GetPhotosResponse>> {
    return this.getPhotos({ type, limit });
  }

  /**
   * Delete a progress photo
   */
  async deletePhoto(photoId: string): Promise<DeletePhotoResponse> {
    const response = await servicesApi.delete<DeletePhotoResponse>(
      `${this.photosPath}/${photoId}`
    );

    // Invalidate cache
    await this.invalidatePhotoCache();

    return response;
  }

  /**
   * Get photos for comparison (front, side, back from two dates)
   */
  async getComparisonPhotos(
    startDate: string,
    endDate: string
  ): Promise<{
    startPhotos: ProgressPhoto[];
    endPhotos: ProgressPhoto[];
  }> {
    const [startResult, endResult] = await Promise.all([
      servicesApi.get<GetPhotosResponse>(this.photosPath, {
        start_date: startDate,
        end_date: startDate,
      }),
      servicesApi.get<GetPhotosResponse>(this.photosPath, {
        start_date: endDate,
        end_date: endDate,
      }),
    ]);

    return {
      startPhotos: startResult.photos,
      endPhotos: endResult.photos,
    };
  }

  // ==========================================
  // MEASUREMENTS
  // ==========================================

  /**
   * Log a new measurement
   */
  async logMeasurement(data: LogMeasurementRequest): Promise<LogMeasurementResponse> {
    const response = await servicesApi.post<LogMeasurementResponse>(
      this.measurementsPath,
      data
    );

    // Invalidate cache
    await this.invalidateMeasurementCache();

    return response;
  }

  /**
   * Get measurement history with filters
   */
  async getMeasurements(filters?: MeasurementFilters): Promise<CachedApiResponse<GetMeasurementsResponse>> {
    const cacheKey = filters?.type
      ? CACHE_KEYS.MEASUREMENTS_BY_TYPE(filters.type)
      : CACHE_KEYS.ALL_MEASUREMENTS;

    return servicesApi.getWithCache<GetMeasurementsResponse>(
      this.measurementsPath,
      cacheKey,
      CACHE_TTL_MINUTES,
      filters
    );
  }

  /**
   * Get measurements by type
   */
  async getMeasurementsByType(
    type: MeasurementType,
    limit?: number
  ): Promise<CachedApiResponse<GetMeasurementsResponse>> {
    return this.getMeasurements({ type, limit });
  }

  /**
   * Get latest measurement for each type
   */
  async getLatestMeasurements(): Promise<CachedApiResponse<GetLatestMeasurementsResponse>> {
    return servicesApi.getWithCache<GetLatestMeasurementsResponse>(
      `${this.measurementsPath}/latest`,
      CACHE_KEYS.LATEST_MEASUREMENTS,
      CACHE_TTL_MINUTES
    );
  }

  /**
   * Log weight measurement (convenience method)
   */
  async logWeight(value: number, unit: 'lbs' | 'kg' = 'lbs', notes?: string): Promise<LogMeasurementResponse> {
    return this.logMeasurement({
      type: 'weight',
      value,
      unit,
      date: new Date().toISOString().split('T')[0],
      notes,
    });
  }

  /**
   * Get weight history
   */
  async getWeightHistory(limit: number = 30): Promise<CachedApiResponse<GetMeasurementsResponse>> {
    return this.getMeasurementsByType('weight', limit);
  }

  /**
   * Calculate measurement change over time
   */
  calculateChange(measurements: Measurement[]): {
    change: number;
    percentChange: number;
    trend: 'up' | 'down' | 'stable';
  } {
    if (measurements.length < 2) {
      return { change: 0, percentChange: 0, trend: 'stable' };
    }

    const sorted = [...measurements].sort(
      (a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime()
    );

    const latest = sorted[0].value;
    const oldest = sorted[sorted.length - 1].value;
    const change = latest - oldest;
    const percentChange = oldest > 0 ? (change / oldest) * 100 : 0;

    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (Math.abs(percentChange) > 0.5) {
      trend = change > 0 ? 'up' : 'down';
    }

    return {
      change: Math.round(change * 10) / 10,
      percentChange: Math.round(percentChange * 10) / 10,
      trend,
    };
  }

  // ==========================================
  // CACHE MANAGEMENT
  // ==========================================

  private async invalidatePhotoCache(): Promise<void> {
    await storageService.remove(CACHE_KEYS.ALL_PHOTOS);
    for (const type of ['front', 'side', 'back']) {
      await storageService.remove(CACHE_KEYS.PHOTOS_BY_TYPE(type));
    }
  }

  private async invalidateMeasurementCache(): Promise<void> {
    await storageService.remove(CACHE_KEYS.ALL_MEASUREMENTS);
    await storageService.remove(CACHE_KEYS.LATEST_MEASUREMENTS);
    const types: MeasurementType[] = [
      'weight', 'body_fat_percentage', 'waist', 'chest',
      'hips', 'bicep', 'thigh', 'neck'
    ];
    for (const type of types) {
      await storageService.remove(CACHE_KEYS.MEASUREMENTS_BY_TYPE(type));
    }
  }
}

// Export singleton
export const progressService = new ProgressService();

export default progressService;
