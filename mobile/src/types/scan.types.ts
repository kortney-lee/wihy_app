/**
 * Scan History Types
 * 
 * Type definitions for the Scan History API (services.wihy.ai)
 */

// ============================================
// SCAN TYPES
// ============================================

export type ScanType = 'barcode' | 'photo' | 'pill' | 'label' | 'prescription';

export interface ScanHistoryItem {
  id: number;
  user_id: string;
  scan_type: ScanType;
  scan_input?: string;
  scan_timestamp: string;
  
  // Product info (for food scans)
  product_name?: string;
  barcode?: string;
  health_score?: number;
  nova_classification?: number;
  nutrition_grade?: string;
  image_url?: string;
  image_blob_name?: string;
  
  // Medication info (for pill/prescription scans)
  medication_name?: string;
  rxcui?: string;
  ndc?: string;
  
  // Additional analysis
  detected_claims?: any;
  greenwashing_score?: number;
  metadata?: ScanMetadata;
}

export interface ScanMetadata {
  confidence_score?: number;
  data_source?: string;
  processing_time_ms?: number;
  [key: string]: any;
}

// ============================================
// REQUEST TYPES
// ============================================

export interface ScanHistoryFilters {
  limit?: number;
  includeImages?: boolean;
  scan_type?: ScanType;
  start_date?: string;
  end_date?: string;
}

// ============================================
// RESPONSE TYPES
// ============================================

export interface GetScanHistoryResponse {
  success: boolean;
  count: number;
  scans: ScanHistoryItem[];
  timestamp: string;
}

export interface GetScanByIdResponse {
  success: boolean;
  scan: ScanHistoryItem;
}

// ============================================
// UPLOAD URL TYPES
// ============================================

export interface GetUploadUrlRequest {
  extension: string;
}

export interface GetUploadUrlResponse {
  uploadUrl: string;
  blobName: string;
  expiresAt: string;
  publicUrl?: string;
}

// ============================================
// HELPER TYPES
// ============================================

export interface ScanSummary {
  totalScans: number;
  scansByType: {
    [key in ScanType]?: number;
  };
  averageHealthScore?: number;
  recentScans: ScanHistoryItem[];
}

export const SCAN_TYPE_LABELS: { [key in ScanType]: string } = {
  barcode: 'Barcode Scan',
  photo: 'Food Photo',
  pill: 'Pill ID',
  label: 'Label Scan',
  prescription: 'Prescription',
};
