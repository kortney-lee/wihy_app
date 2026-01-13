# WIHY Mobile Client - Service Integration Guide

## Overview

Complete implementation guide for integrating WIHY scanning services into your mobile application (iOS/Android).

**Production Service URL**: `https://services.wihy.ai`  
**API Version**: v1  
**Last Updated**: January 6, 2026

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Authentication](#authentication)
3. [Image Handling](#image-handling)
4. [Scan Modes Implementation](#scan-modes-implementation)
5. [Error Handling](#error-handling)
6. [Best Practices](#best-practices)
7. [Integration with Screens](#integration-with-screens)
8. [Code Examples](#code-examples)

---

## Quick Start

### Base Configuration

```javascript
// React Native - JavaScript
const WIHYConfig = {
  baseURL: 'https://services.wihy.ai',
  apiVersion: 'v1',
  timeout: 30000, // 30 seconds
  maxImageSize: 10 * 1024 * 1024, // 10MB
  endpoints: {
    scan: '/api/scan',
    scanPhoto: '/api/scan/photo',
    scanLabel: '/api/scan/label',
    scanHistory: '/api/scan/history',
    pillScan: '/api/v1/medications/pills/scan',
    pillConfirm: '/api/v1/medications/pills/confirm'
  }
};
```

---

## Authentication

### Current Implementation (userId-based)

All endpoints require a `userId` parameter for user tracking and history management.

```typescript
// React Native - TypeScript
class WIHYAPIClient {
  private userId: string;
  private timeout: number;

  constructor(userId: string) {
    this.userId = userId;
    this.timeout = WIHYConfig.timeout;
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers
    };

    const response = await fetch(endpoint, {
      ...options,
      headers,
      timeout: this.timeout
    });

    if (!response.ok) {
      throw new WIHYError(`Request failed: ${response.status}`);
    }

    return response.json();
  }
}
```

### Future Authentication (JWT)

For production deployment with user authentication:

```typescript
// React Native - TypeScript (Future)
const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${authToken}`
};
```

---

## Image Handling

### Image Compression & Encoding

**Important**: Images must be compressed before encoding to avoid request size limits.

#### React Native - JavaScript

```javascript
import { Image } from 'react-native';

export const ImageUtils = {
  /**
   * Compress image for upload
   * @param {string} uri - Image URI
   * @param {number} maxSizeKB - Maximum size in KB (default 500)
   * @returns {Promise<string>} Base64 encoded image
   */
  async compressAndEncode(uri, maxSizeKB = 500) {
    try {
      // Get image dimensions first
      const { width, height } = await new Promise((resolve, reject) => {
        Image.getSize(uri, (width, height) => {
          resolve({ width, height });
        }, reject);
      });

      // Calculate scaling if needed
      const maxDimension = 4000;
      const scale = Math.min(maxDimension / width, maxDimension / height, 1.0);

      const manipResult = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: width * scale, height: height * scale } }],
        { compress: 0.9, format: 'jpeg' }
      );

      // Read and compress the file
      let quality = 90;
      let base64 = null;

      while (quality > 10) {
        const manipResult = await ImageManipulator.manipulateAsync(
          uri,
          [],
          { compress: quality / 100, format: 'jpeg' }
        );

        const base64Data = await FileSystem.readAsStringAsync(
          manipResult.uri,
          { encoding: 'base64' }
        );

        const sizeKB = (base64Data.length * 0.75) / 1024; // Rough estimate

        if (sizeKB <= maxSizeKB) {
          base64 = base64Data;
          break;
        }

        quality -= 10;
      }

      if (!base64) {
        throw new Error('Failed to compress image to target size');
      }

      return `data:image/jpeg;base64,${base64}`;
    } catch (error) {
      throw new WIHYError('Image compression failed: ' + error.message);
    }
  },

  /**
   * Validate image before processing
   */
  async validateImage(uri) {
    try {
      const fileInfo = await FileSystem.getInfoAsync(uri);

      if (!fileInfo.exists) {
        throw new WIHYError('Image file does not exist');
      }

      if (fileInfo.size > WIHYConfig.maxImageSize) {
        throw new WIHYError(
          `Image size ${fileInfo.size} exceeds maximum ${WIHYConfig.maxImageSize}`
        );
      }

      return true;
    } catch (error) {
      throw new WIHYError('Image validation failed: ' + error.message);
    }
  }
};
```

---

## Scan Modes Implementation

### 1. Barcode Scan

#### React Native - TypeScript

```typescript
export async function scanBarcode(
  barcode: string,
  userId: string,
  trackHistory: boolean = true
): Promise<BarcodeScanResult> {
  const endpoint = `${WIHYConfig.baseURL}${WIHYConfig.endpoints.scan}`;

  const request = {
    barcode,
    user_context: {
      userId,
      trackHistory
    },
    include_charts: true
  };

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request),
      timeout: WIHYConfig.timeout
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return response.json() as Promise<BarcodeScanResult>;
  } catch (error) {
    throw new WIHYError('Barcode scan failed: ' + error.message);
  }
}

export interface BarcodeScanResult {
  success: boolean;
  timestamp: string;
  processing_time_ms: number;
  scan_type: string;

  // Product Info
  product_name: string;
  brand: string;
  barcode: string;
  image_url?: string;
  categories: string[];

  // Scores
  health_score: number;
  nutrition_score: number;
  nutrition_grade: string;
  confidence_score: number;

  // Processing
  nova_group: number;
  processing_level: string;

  // Nutrition (per 100g)
  calories: number;
  calories_per_serving: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  saturated_fat_g: number;
  fiber_g: number;
  sugar_g: number;
  sodium_mg: number;

  // Serving Info
  serving_size: string;
  servings_per_container: number;

  // Health Analysis
  summary: string;
  health_alerts: HealthAlert[];
  positive_aspects: PositiveAspect[];
  areas_of_concern: ConcernArea[];

  // Ingredients
  ingredients_text: string;
  total_ingredients: number;
  allergens: string[];
  additives: string[];
  total_additives: number;

  // Ask Wihy AI context
  ask_wihy: string;

  // Quick booleans for UI
  is_healthy: boolean;
  is_processed: boolean;
  has_allergens: boolean;
  has_additives: boolean;
}

export interface HealthAlert {
  message: string;
  recommendation: string;
  severity?: string;
}

export interface PositiveAspect {
  message: string;
  benefit: string;
}

export interface ConcernArea {
  message: string;
  impact: string;
}
```

---

### 2. Food Photo Analysis

#### React Native - TypeScript

```typescript
export async function scanFoodPhoto(
  imageBase64: string,
  userId: string,
  trackHistory: boolean = true
): Promise<FoodPhotoResult> {
  const endpoint = `${WIHYConfig.baseURL}${WIHYConfig.endpoints.scanPhoto}`;

  const request = {
    image: imageBase64,
    user_context: {
      userId,
      trackHistory
    },
    include_charts: true
  };

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request),
      timeout: WIHYConfig.timeout
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return response.json() as Promise<FoodPhotoResult>;
  } catch (error) {
    throw new WIHYError('Food photo scan failed: ' + error.message);
  }
}

// FoodPhotoResult is identical to BarcodeScanResult
export type FoodPhotoResult = BarcodeScanResult;
```

---

### 3. Pill Identification

#### React Native - TypeScript

```typescript
export async function scanPill(
  imageBase64: string,
  userId: string,
  context?: PillContext
): Promise<PillScanResult> {
  const endpoint = `${WIHYConfig.baseURL}${WIHYConfig.endpoints.pillScan}`;

  const request = {
    images: [imageBase64],
    context: context || { userId }
  };

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request),
      timeout: WIHYConfig.timeout
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return response.json() as Promise<PillScanResult>;
  } catch (error) {
    throw new WIHYError('Pill scan failed: ' + error.message);
  }
}

export async function confirmPill(
  scanId: string,
  selectedRxcui: string,
  userId: string
): Promise<PillConfirmation> {
  const endpoint = `${WIHYConfig.baseURL}${WIHYConfig.endpoints.pillConfirm}`;

  const request = {
    scanId,
    selectedRxcui,
    userId
  };

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request),
      timeout: WIHYConfig.timeout
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return response.json() as Promise<PillConfirmation>;
  } catch (error) {
    throw new WIHYError('Pill confirmation failed: ' + error.message);
  }
}

export interface PillContext {
  userId: string;
  imprint?: string;
  color?: string;
  shape?: string;
}

export interface PillScanResult {
  success: boolean;
  timestamp: string;
  scan_type: string;
  scanId: string;
  matches: PillMatch[];
  requiresConfirmation: boolean;
  status: string;
  confidence: number;
  ask_wihy: string; // AI context for pill identification
}

export interface PillMatch {
  rxcui: string;
  name: string;
  brandName?: string;
  ndc11: string;
  imprint: string;
  color: string;
  shape: string;
  confidence: number;
  image_url?: string;
}

export interface PillConfirmation {
  success: boolean;
  scanId: string;
  rxcui: string;
  medicationAdded: boolean;
}
```

---

### 4. Label Reader (Greenwashing Detection)

#### React Native - TypeScript

```typescript
export async function scanProductLabel(
  imageBase64: string,
  userId: string,
  trackHistory: boolean = true
): Promise<LabelScanResult> {
  const endpoint = `${WIHYConfig.baseURL}${WIHYConfig.endpoints.scanLabel}`;

  const request = {
    image: imageBase64,
    user_context: {
      userId,
      trackHistory
    }
  };

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request),
      timeout: WIHYConfig.timeout
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return response.json() as Promise<LabelScanResult>;
  } catch (error) {
    throw new WIHYError('Label scan failed: ' + error.message);
  }
}

export interface LabelScanResult {
  success: boolean;
  timestamp: string;
  scan_id: string;
  scan_type: string;
  image_url?: string;
  product_name: string;
  confidence_score: number;
  greenwashing_score: number;
  greenwashing_flags: GreenwashingFlag[];
  detected_claims: MarketingClaim[];
  claim_count: number;
  full_text: string;
  recommendations: string[];
  ask_wihy: string; // AI context for label analysis
  analysis: LabelAnalysis;
}

export interface LabelAnalysis {
  product_name: string;
  detected_claims: MarketingClaim[];
  greenwashing_score: number;
  greenwashing_flags: GreenwashingFlag[];
  claim_count: number;
  confidence: number;
  recommendations: string[];
}

export interface MarketingClaim {
  claim: string;
  category: string;
  type: string;
  count: number;
  needs_verification: boolean;
}

export interface GreenwashingFlag {
  severity: string;
  flag: string;
  detail: string;
}
```

---

### 5. Scan History

#### React Native - TypeScript

```typescript
export async function getScanHistory(
  userId: string,
  limit: number = 50,
  scanType?: string
): Promise<ScanHistoryResult> {
  const params = new URLSearchParams({
    userId,
    limit: limit.toString(),
    includeImages: 'true'
  });

  if (scanType) {
    params.append('scanType', scanType);
  }

  const endpoint = `${WIHYConfig.baseURL}${WIHYConfig.endpoints.scanHistory}?${params}`;

  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: WIHYConfig.timeout
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return response.json() as Promise<ScanHistoryResult>;
  } catch (error) {
    throw new WIHYError('Failed to get history: ' + error.message);
  }
}

export async function deleteScan(scanId: number, userId: string): Promise<void> {
  const endpoint = `${WIHYConfig.baseURL}${WIHYConfig.endpoints.scanHistory}/${scanId}`;

  const request = { userId };

  try {
    const response = await fetch(endpoint, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request),
      timeout: WIHYConfig.timeout
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
  } catch (error) {
    throw new WIHYError('Failed to delete scan: ' + error.message);
  }
}

export interface ScanHistoryResult {
  success: boolean;
  count: number;
  scans: HistoryScan[];
}

export interface HistoryScan {
  id: number;
  scan_type: string;
  scan_timestamp: string;
  health_score?: number;
  image_url?: string;
  product?: ProductInfo;
  medication?: MedicationInfo;
}

export interface ProductInfo {
  product_name: string;
  brand: string;
  barcode: string;
  image_url?: string;
}

export interface MedicationInfo {
  name: string;
  rxcui: string;
  ndc11: string;
}
```

---

## Error Handling

### Error Types

```typescript
// React Native - TypeScript
export class WIHYError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'WIHYError';
  }

  static fromResponse(response: Response, body: string): WIHYError {
    const errorCode = `HTTP_${response.status}`;
    const errorMessage = body || `HTTP ${response.status} Error`;
    return new WIHYError(errorCode, errorMessage, response.status);
  }
}

export enum ErrorCode {
  INVALID_IMAGE = 'INVALID_IMAGE',
  IMAGE_PROCESSING_FAILED = 'IMAGE_PROCESSING_FAILED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  INVALID_RESPONSE = 'INVALID_RESPONSE',
  DECODING_ERROR = 'DECODING_ERROR',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE'
}

export const ErrorMessages: Record<ErrorCode, string> = {
  [ErrorCode.INVALID_IMAGE]: 'Invalid image format',
  [ErrorCode.IMAGE_PROCESSING_FAILED]: 'Failed to process image',
  [ErrorCode.NETWORK_ERROR]: 'Network connection error',
  [ErrorCode.SERVER_ERROR]: 'Server error occurred',
  [ErrorCode.INVALID_RESPONSE]: 'Invalid server response',
  [ErrorCode.DECODING_ERROR]: 'Failed to parse response',
  [ErrorCode.RATE_LIMIT_EXCEEDED]: 'Too many requests. Please try again later.',
  [ErrorCode.SERVICE_UNAVAILABLE]: 'Service temporarily unavailable'
};
```

### Error Handling Example

```typescript
// React Native - TypeScript
async function scanWithErrorHandling(imageUri: string, userId: string) {
  try {
    // Validate image first
    await ImageUtils.validateImage(imageUri);

    // Compress and encode
    const base64Image = await ImageUtils.compressAndEncode(imageUri);

    // Perform scan
    const result = await scanFoodPhoto(base64Image, userId);

    // Handle success
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof WIHYError) {
      // Handle WIHY-specific errors
      console.error(`Scan failed [${error.code}]:`, error.message);

      if (error.code === ErrorCode.RATE_LIMIT_EXCEEDED) {
        // Show rate limit message
        return { success: false, error: 'Please wait before scanning again' };
      }

      if (error.statusCode === 503) {
        // Handle service unavailable
        return { success: false, error: 'Service temporarily unavailable' };
      }

      return { success: false, error: error.message };
    }

    // Handle unexpected errors
    console.error('Unexpected error:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}
```

---

## Best Practices

### 1. Image Optimization

- ✅ **Always compress images** before encoding to base64
- ✅ Target size: 500KB or less per image
- ✅ Use JPEG format for photos (better compression)
- ✅ Validate image dimensions (max 4000x4000)

### 2. Request Timeout Handling

- ✅ Set appropriate timeout (30 seconds recommended)
- ✅ Show loading indicators during requests
- ✅ Allow users to cancel long-running requests

### 3. Caching

```typescript
// React Native - TypeScript
class ScanHistoryCache {
  private cache: Map<string, { data: ScanHistoryResult; timestamp: number }> =
    new Map();
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

  setCached(userId: string, result: ScanHistoryResult) {
    this.cache.set(userId, { data: result, timestamp: Date.now() });
  }

  invalidate(userId?: string) {
    if (userId) {
      this.cache.delete(userId);
    } else {
      this.cache.clear();
    }
  }
}
```

### 4. Rate Limiting

```typescript
// React Native - TypeScript
class RateLimiter {
  private lastRequestTime: number = 0;
  private minInterval = 1000; // 1 second between requests

  canMakeRequest(): boolean {
    const now = Date.now();
    const elapsed = now - this.lastRequestTime;

    if (elapsed >= this.minInterval) {
      this.lastRequestTime = now;
      return true;
    }

    return false;
  }

  getWaitTime(): number {
    const now = Date.now();
    const elapsed = now - this.lastRequestTime;
    return Math.max(0, this.minInterval - elapsed);
  }
}
```

---

## Integration with Screens

### Health Overview Screen

The Health Overview screen should integrate with the scanning services to display scanned product data.

```typescript
// src/screens/HealthOverviewScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getScanHistory } from '../services/scanService';
import { useAuth } from '../hooks/useAuth';

interface RecentScan {
  id: number;
  product_name: string;
  health_score: number;
  scan_timestamp: string;
  scan_type: string;
  image_url?: string;
}

export const HealthOverviewScreen = () => {
  const { user } = useAuth();
  const [recentScans, setRecentScans] = useState<RecentScan[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadScanHistory = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const result = await getScanHistory(user.id, 10); // Get last 10 scans
      setRecentScans(result.scans);
    } catch (error) {
      console.error('Failed to load scan history:', error);
      Alert.alert('Error', 'Failed to load health data');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadScanHistory();
    }, [user?.id])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadScanHistory();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Health Score Summary */}
      {recentScans.length > 0 && (
        <HealthSummaryCard scans={recentScans} />
      )}

      {/* Recent Scans List */}
      <RecentScansSection scans={recentScans} />

      {/* Health Insights */}
      <HealthInsightsCard scans={recentScans} />
    </ScrollView>
  );
};

interface HealthSummaryCardProps {
  scans: RecentScan[];
}

const HealthSummaryCard = ({ scans }: HealthSummaryCardProps) => {
  const avgHealthScore =
    scans.reduce((sum, scan) => sum + (scan.health_score || 0), 0) /
    Math.max(scans.length, 1);

  return (
    <Card style={styles.summaryCard}>
      <Text style={styles.summaryTitle}>Overall Health Score</Text>
      <Text style={styles.healthScore}>{Math.round(avgHealthScore)}</Text>
      <Text style={styles.summarySubtext}>
        Based on {scans.length} recent scans
      </Text>
    </Card>
  );
};
```

### My Progress Screen

The My Progress screen should display trends from scanned products and health metrics.

```typescript
// src/screens/MyProgressScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  ActivityIndicator,
  Alert,
  Dimensions
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { getScanHistory } from '../services/scanService';
import { useAuth } from '../hooks/useAuth';

interface HealthTrend {
  date: string;
  avgScore: number;
  scanCount: number;
}

export const MyProgressScreen = () => {
  const { user } = useAuth();
  const [trends, setTrends] = useState<HealthTrend[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('week');

  useEffect(() => {
    loadProgressData();
  }, [user?.id, timeRange]);

  const loadProgressData = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const result = await getScanHistory(user.id, 100); // Get more scans for trending

      // Group by date and calculate trends
      const grouped = groupScansbyDate(result.scans);
      const calculatedTrends = calculateTrends(grouped, timeRange);

      setTrends(calculatedTrends);
    } catch (error) {
      console.error('Failed to load progress data:', error);
      Alert.alert('Error', 'Failed to load progress data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const chartData = {
    labels: trends.map((t) => t.date),
    datasets: [
      {
        data: trends.map((t) => t.avgScore),
        color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
        strokeWidth: 2
      }
    ]
  };

  return (
    <ScrollView style={styles.container}>
      {/* Time Range Selector */}
      <TimeRangeSelector
        selected={timeRange}
        onSelect={setTimeRange}
      />

      {/* Health Trend Chart */}
      <Card style={styles.chartCard}>
        <Text style={styles.chartTitle}>Health Score Trend</Text>
        <LineChart
          data={chartData}
          width={Dimensions.get('window').width - 40}
          height={220}
          chartConfig={{
            backgroundColor: '#fff',
            backgroundGradientFrom: '#fff',
            backgroundGradientTo: '#fff',
            color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
            strokeWidth: 2,
            propsForDots: {
              r: '6',
              strokeWidth: '2',
              stroke: '#4CAF50'
            }
          }}
        />
      </Card>

      {/* Statistics */}
      <StatisticsCard trends={trends} />

      {/* Recommendations */}
      <RecommendationsCard trends={trends} />
    </ScrollView>
  );
};

function groupScansbyDate(scans: HistoryScan[]) {
  const grouped: Map<string, HistoryScan[]> = new Map();

  scans.forEach((scan) => {
    const date = new Date(scan.scan_timestamp).toLocaleDateString();
    if (!grouped.has(date)) {
      grouped.set(date, []);
    }
    grouped.get(date)!.push(scan);
  });

  return grouped;
}

function calculateTrends(
  grouped: Map<string, HistoryScan[]>,
  timeRange: 'week' | 'month' | 'all'
): HealthTrend[] {
  const trends: HealthTrend[] = [];
  const cutoffDate = new Date();

  switch (timeRange) {
    case 'week':
      cutoffDate.setDate(cutoffDate.getDate() - 7);
      break;
    case 'month':
      cutoffDate.setMonth(cutoffDate.getMonth() - 1);
      break;
  }

  Array.from(grouped.entries())
    .filter(([dateStr]) => {
      return timeRange === 'all' || new Date(dateStr) >= cutoffDate;
    })
    .forEach(([date, scans]) => {
      const validScans = scans.filter((s) => s.health_score !== undefined);
      if (validScans.length > 0) {
        const avgScore =
          validScans.reduce((sum, s) => sum + (s.health_score || 0), 0) /
          validScans.length;
        trends.push({
          date,
          avgScore: Math.round(avgScore),
          scanCount: validScans.length
        });
      }
    });

  return trends.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
}
```

---

## Complete Integration Example

### Complete Scan Service for React Native

```typescript
// src/services/scanService.ts
import { ImageUtils } from '../utils/imageUtils';
import {
  scanBarcode,
  scanFoodPhoto,
  scanPill,
  scanProductLabel,
  getScanHistory,
  deleteScan,
  BarcodeScanResult,
  FoodPhotoResult,
  PillScanResult,
  LabelScanResult,
  ScanHistoryResult
} from './wihyApi';
import { WIHYError } from './errorHandler';

export class ScanService {
  private userId: string;
  private rateLimiter = new RateLimiter();
  private cache = new ScanHistoryCache();

  constructor(userId: string) {
    this.userId = userId;
  }

  /**
   * Scan product by barcode
   */
  async scanBarcode(barcode: string): Promise<BarcodeScanResult> {
    if (!this.rateLimiter.canMakeRequest()) {
      throw new WIHYError(
        ErrorCode.RATE_LIMIT_EXCEEDED,
        ErrorMessages[ErrorCode.RATE_LIMIT_EXCEEDED]
      );
    }

    return scanBarcode(barcode, this.userId);
  }

  /**
   * Scan food by photo
   */
  async scanFoodPhoto(imageUri: string): Promise<FoodPhotoResult> {
    if (!this.rateLimiter.canMakeRequest()) {
      throw new WIHYError(
        ErrorCode.RATE_LIMIT_EXCEEDED,
        ErrorMessages[ErrorCode.RATE_LIMIT_EXCEEDED]
      );
    }

    // Validate and process image
    await ImageUtils.validateImage(imageUri);
    const base64Image = await ImageUtils.compressAndEncode(imageUri);

    // Perform scan
    const result = await scanFoodPhoto(base64Image, this.userId);

    // Invalidate cache
    this.cache.invalidate(this.userId);

    return result;
  }

  /**
   * Scan pill
   */
  async scanPill(imageUri: string): Promise<PillScanResult> {
    if (!this.rateLimiter.canMakeRequest()) {
      throw new WIHYError(
        ErrorCode.RATE_LIMIT_EXCEEDED,
        ErrorMessages[ErrorCode.RATE_LIMIT_EXCEEDED]
      );
    }

    // Validate and process image
    await ImageUtils.validateImage(imageUri);
    const base64Image = await ImageUtils.compressAndEncode(imageUri);

    return scanPill(base64Image, this.userId);
  }

  /**
   * Scan product label for greenwashing
   */
  async scanProductLabel(imageUri: string): Promise<LabelScanResult> {
    if (!this.rateLimiter.canMakeRequest()) {
      throw new WIHYError(
        ErrorCode.RATE_LIMIT_EXCEEDED,
        ErrorMessages[ErrorCode.RATE_LIMIT_EXCEEDED]
      );
    }

    // Validate and process image
    await ImageUtils.validateImage(imageUri);
    const base64Image = await ImageUtils.compressAndEncode(imageUri);

    // Perform scan
    const result = await scanProductLabel(base64Image, this.userId);

    // Invalidate cache
    this.cache.invalidate(this.userId);

    return result;
  }

  /**
   * Get scan history with caching
   */
  async getHistory(
    limit: number = 50,
    scanType?: string,
    useCache = true
  ): Promise<ScanHistoryResult> {
    // Check cache first
    if (useCache) {
      const cached = this.cache.getCached(this.userId);
      if (cached) {
        return cached;
      }
    }

    // Fetch from API
    const result = await getScanHistory(this.userId, limit, scanType);

    // Cache result
    this.cache.setCached(this.userId, result);

    return result;
  }

  /**
   * Delete a scan
   */
  async deleteScan(scanId: number): Promise<void> {
    await deleteScan(scanId, this.userId);

    // Invalidate cache
    this.cache.invalidate(this.userId);
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.invalidate(this.userId);
  }
}
```

---

## Testing

### Manual Testing URLs

```bash
# Production
https://services.wihy.ai/api/scan/photo
https://services.wihy.ai/api/v1/medications/pills/scan
https://services.wihy.ai/api/scan/history

# Health check
https://services.wihy.ai/api/news/debug/health
```

### Test with cURL

```bash
# Test barcode scan
curl -X POST https://services.wihy.ai/api/scan \
  -H "Content-Type: application/json" \
  -d '{
    "barcode": "5449000109014",
    "user_context": {
      "userId": "test-user",
      "trackHistory": true
    },
    "include_charts": true
  }'

# Test food photo scan
curl -X POST https://services.wihy.ai/api/scan/photo \
  -H "Content-Type: application/json" \
  -d '{
    "image": "data:image/jpeg;base64,/9j/...",
    "user_context": {
      "userId": "test-user",
      "trackHistory": true
    },
    "include_charts": true
  }'

# Get scan history
curl -X GET "https://services.wihy.ai/api/scan/history?userId=test-user&limit=50" \
  -H "Content-Type: application/json"
```

---

## Support

For questions or issues:
- **Service Status**: https://services.wihy.ai/api/news/debug/health
- **Main Documentation**: See [WIHY_AUTH_CLIENT_IMPLEMENTATION.md](./WIHY_AUTH_CLIENT_IMPLEMENTATION.md)
- **Health Overview Integration**: See [HEALTH_OVERVIEW_SPEC.md](./HEALTH_OVERVIEW_SPEC.md)
- **My Progress Integration**: See [MY_PROGRESS_SPEC.md](./MY_PROGRESS_SPEC.md)

---

**Last Updated**: January 6, 2026  
**API Version**: v1  
**Service Status**: ✅ Production Ready
