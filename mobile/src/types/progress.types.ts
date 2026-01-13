/**
 * Progress Tracking Types
 * 
 * Type definitions for Progress Photos and Measurements API (services.wihy.ai)
 */

// ============================================
// PHOTO TYPES
// ============================================

export type PhotoType = 'front' | 'side' | 'back';

export interface ProgressPhoto {
  id: string;
  user_id: string;
  url: string;
  thumbnail_url?: string;
  type: PhotoType;
  taken_at: string;
  notes?: string;
  created_at: string;
}

// ============================================
// MEASUREMENT TYPES
// ============================================

export type MeasurementType =
  | 'weight'
  | 'body_fat_percentage'
  | 'waist'
  | 'chest'
  | 'hips'
  | 'bicep'
  | 'thigh'
  | 'neck';

export type MeasurementUnit = 'lbs' | 'kg' | 'in' | 'cm' | '%';

export interface Measurement {
  id: string;
  user_id: string;
  type: MeasurementType;
  value: number;
  unit: MeasurementUnit | string;
  recorded_at: string;
  notes?: string;
  created_at: string;
}

export interface MeasurementStats {
  latest: number;
  oldest: number;
  change: number;
  average: number;
}

export interface LatestMeasurements {
  [key: string]: {
    value: number;
    unit: string;
    recorded_at: string;
  };
}

// ============================================
// REQUEST TYPES
// ============================================

export interface UploadPhotoRequest {
  image_url: string;
  thumbnail_url?: string;
  type: PhotoType;
  date: string;
  notes?: string;
}

export interface PhotoFilters {
  type?: PhotoType;
  limit?: number;
  start_date?: string;
  end_date?: string;
}

export interface LogMeasurementRequest {
  type: MeasurementType;
  value: number;
  unit: MeasurementUnit | string;
  date: string;
  notes?: string;
}

export interface MeasurementFilters {
  type?: MeasurementType;
  limit?: number;
  start_date?: string;
  end_date?: string;
}

// ============================================
// RESPONSE TYPES
// ============================================

export interface UploadPhotoResponse {
  success: boolean;
  photo: ProgressPhoto;
}

export interface GetPhotosResponse {
  success: boolean;
  photos: ProgressPhoto[];
  count: number;
}

export interface DeletePhotoResponse {
  success: boolean;
}

export interface LogMeasurementResponse {
  success: boolean;
  measurement: Measurement;
}

export interface GetMeasurementsResponse {
  success: boolean;
  measurements: Measurement[];
  count: number;
  stats?: MeasurementStats;
}

export interface GetLatestMeasurementsResponse {
  success: boolean;
  latest: LatestMeasurements;
}
