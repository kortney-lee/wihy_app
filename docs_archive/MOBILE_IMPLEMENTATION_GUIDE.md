# WIHY Mobile Service Integration - Implementation Guide

## ✅ Implementation Status

All scan features from the WIHY Service Integration Guide have been successfully implemented for React Native.

**Production Service URL**: `https://services.wihy.ai`  
**Implementation**: React Native with TypeScript  
**Last Updated**: December 30, 2025

---

## 📦 Installation

### Required Dependencies

Install the image manipulation library:

```bash
npx expo install expo-image-manipulator
```

### Already Installed
- ✅ expo-camera
- ✅ expo-image-picker
- ✅ @react-navigation/native
- ✅ @react-navigation/stack

---

## ✨ Features Implemented

### 1. Image Compression ✅
**File**: `src/utils/imageCompression.ts`

Automatic image optimization before upload:
- Compresses images to target size (default: 500KB)
- Resizes large images (max 4000x4000)
- Progressive quality reduction
- Base64 encoding for API upload

**Usage**:
```typescript
import { compressImageForUpload } from '../utils/imageCompression';

const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
const compressedImage = await compressImageForUpload(photo.uri, { maxSizeKB: 500 });
// Returns: "data:image/jpeg;base64,..."
```

### 2. Rate Limiting ✅
**File**: `src/utils/rateLimiter.ts`

Client-side rate limiting to prevent API abuse:
- Minimum 1 second between requests
- Maximum 10 requests per minute
- Automatic request queuing
- Status tracking

**Usage**:
```typescript
import { globalRateLimiter } from '../utils/rateLimiter';

if (!globalRateLimiter.canMakeRequest()) {
  throw new Error('Rate limit exceeded');
}
// Or wait for next available slot:
await globalRateLimiter.waitForNextSlot();
```

### 3. Error Handling ✅
**File**: `src/services/errors.ts`

Standardized error types and handling:
- Typed error codes (`WIHYErrorCode`)
- User-friendly error messages
- Retry detection
- Detailed error logging

**Usage**:
```typescript
import { WIHYError, WIHYErrorCode, createErrorFromResponse } from '../services/errors';

try {
  const result = await scanService.scanBarcode(barcode);
} catch (error) {
  if (error instanceof WIHYError) {
    Alert.alert('Error', error.getUserMessage());
    if (error.isRetryable()) {
      // Retry logic
    }
  }
}
```

### 4. Scan Services ✅
**File**: `src/services/scanService.ts`

All scan modes implemented with comprehensive logging:

#### Barcode Scan
```typescript
const result = await scanService.scanBarcode(barcode, userContext);
// Returns: Complete product info, nutrition facts, health score
```

#### Food Photo Analysis
```typescript
const compressedImage = await compressImageForUpload(photoUri);
const result = await scanService.scanFoodPhoto(compressedImage, userContext);
// Returns: Detected foods, nutrition estimate, health analysis
```

#### Pill Identification
```typescript
const compressedImage = await compressImageForUpload(photoUri);
const result = await scanService.scanPill(compressedImage, { userId });
// Returns: Pill matches with RxNorm data, requires confirmation
```

#### Label Reader (Greenwashing Detection)
```typescript
const compressedImage = await compressImageForUpload(photoUri);
const result = await scanService.scanLabel(compressedImage, userContext);
// Returns: Marketing claims, greenwashing analysis
```

#### Scan History
```typescript
// Get history
const history = await scanService.getScanHistory(userId, { limit: 50 });

// Delete scan
await scanService.deleteScan(scanId, userId);
```

### 5. Camera Integration ✅
**File**: `src/screens/CameraScreen.tsx`

Complete camera implementation with 4 scan modes:
- ✅ Barcode scanning (with auto-scan option)
- ✅ Food photo capture & analysis
- ✅ Pill identification
- ✅ Label reading & greenwashing detection

**Features**:
- Real-time camera view
- Auto-scan for barcodes (optional)
- Image compression before upload
- Loading states & error handling
- Scan history navigation

---

## 🔧 Configuration

### Base Configuration
**File**: `src/services/config.ts`

```typescript
export const API_CONFIG = {
  baseUrl: 'https://services.wihy.ai',
  endpoints: {
    scan: '/api/scan',
    scanPhoto: '/api/scan/photo',
    scanLabel: '/api/scan/label',
    scanHistory: '/api/scan/history',
    pillScan: '/api/v1/medications/pills/scan',
    pillConfirm: '/api/v1/medications/pills/confirm',
    ask: '/api/ask',
    fdaIngredient: '/api/openfda/ingredient',
  },
  timeout: 30000, // 30 seconds
};
```

### User Context
All API calls include user context for tracking:

```typescript
const userContext = {
  userId: user?.email || 'mobile-user',
  trackHistory: true,
  health_goals: ['weight_loss', 'muscle_gain'],
  dietary_restrictions: ['vegetarian'],
};
```

---

## 📊 API Console Logging

All API calls are logged to console for debugging:

### Barcode Scan
```
=== BARCODE SCAN API CALL ===
Endpoint: https://services.wihy.ai/api/scan
Barcode: 012345678901
User Context: {...}
Request Body: {...}
Response Status: 200 (1234ms)
Response Data: {...}
=== BARCODE SCAN SUCCESS ===
```

### Food Photo
```
=== FOOD PHOTO SCAN API CALL ===
Endpoint: https://services.wihy.ai/api/scan/photo
Image URI: data:image/jpeg;base64... [truncated]
Converting image to base64...
Image converted, size: 450 KB
Response Status: 200 (2345ms)
=== FOOD PHOTO SCAN SUCCESS ===
```

### Error Logging
```
=== BARCODE SCAN ERROR ===
Error after 5000 ms: Error
Error message: HTTP error 404
Error stack: Error: HTTP error 404...
=== BARCODE SCAN FAILED ===
```

---

## 🎯 Usage Examples

### Complete Barcode Scan Flow

```typescript
import { scanService } from '../services';
import { globalRateLimiter } from '../utils/rateLimiter';
import { WIHYError } from '../services/errors';

async function handleBarcodeScan(barcode: string) {
  try {
    // Check rate limit
    if (!globalRateLimiter.canMakeRequest()) {
      Alert.alert('Please Wait', 'Too many requests. Please wait a moment.');
      return;
    }

    // Scan barcode
    const result = await scanService.scanBarcode(barcode, {
      userId: user?.email,
      trackHistory: true,
    });

    if (result.success && result.analysis?.metadata) {
      // Navigate to results
      navigation.navigate('NutritionFacts', {
        foodItem: {
          name: result.analysis.metadata.product_name,
          nutrition_facts: result.analysis.metadata.nutrition_facts,
          health_score: result.analysis.metadata.health_score,
          // ... more data
        },
      });
    }
  } catch (error) {
    if (error instanceof WIHYError) {
      error.logError(); // Log for debugging
      Alert.alert('Scan Failed', error.getUserMessage());
    } else {
      Alert.alert('Error', 'An unexpected error occurred');
    }
  }
}
```

### Complete Food Photo Scan Flow

```typescript
import { compressImageForUpload } from '../utils/imageCompression';

async function handleFoodPhotoScan() {
  try {
    // Check rate limit
    await globalRateLimiter.waitForNextSlot();

    // Capture photo
    const photo = await cameraRef.current.takePictureAsync({
      quality: 0.8,
    });

    if (!photo?.uri) {
      throw new Error('Failed to capture photo');
    }

    // Compress image
    console.log('Compressing image...');
    const compressedImage = await compressImageForUpload(photo.uri, {
      maxSizeKB: 500,
      maxWidth: 4000,
      maxHeight: 4000,
    });

    // Scan
    const result = await scanService.scanFoodPhoto(compressedImage, {
      userId: user?.email,
      trackHistory: true,
    });

    if (result.success && result.analysis) {
      // Process results
      navigation.navigate('NutritionFacts', {
        foodItem: {
          name: result.analysis.detected_foods?.join(', ') || 'Food Item',
          nutrition_facts: result.analysis.nutrition_estimate,
          health_score: result.analysis.health_score,
          // ... more data
        },
      });
    }
  } catch (error) {
    handleError(error);
  }
}
```

---

## 🛡️ Error Handling Patterns

### Retry Logic

```typescript
async function scanWithRetry(
  scanFn: () => Promise<any>,
  maxRetries: number = 3
): Promise<any> {
  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await scanFn();
    } catch (error) {
      lastError = error;
      
      if (error instanceof WIHYError && error.isRetryable()) {
        console.log(`Retry attempt ${attempt}/${maxRetries}`);
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        continue;
      }
      
      throw error; // Non-retryable error
    }
  }

  throw lastError;
}

// Usage
const result = await scanWithRetry(() => 
  scanService.scanBarcode(barcode)
);
```

### User-Friendly Error Display

```typescript
function handleScanError(error: any) {
  if (error instanceof WIHYError) {
    error.logError(); // Console logging
    
    const buttons = [
      { text: 'OK', style: 'cancel' },
    ];
    
    if (error.isRetryable()) {
      buttons.push({
        text: 'Retry',
        onPress: () => retryLastScan(),
      });
    }
    
    Alert.alert(
      'Scan Failed',
      error.getUserMessage(),
      buttons
    );
  } else {
    Alert.alert('Error', 'An unexpected error occurred. Please try again.');
  }
}
```

---

## 📁 File Structure

```
src/
├── services/
│   ├── config.ts              # API configuration
│   ├── errors.ts              # ✨ NEW: Error types & handling
│   ├── scanService.ts         # ✅ All scan methods with logging
│   ├── fdaService.ts          # ✅ FDA ingredient analysis
│   ├── chatService.ts         # ✅ Chat/Ask API with logging
│   └── types.ts               # TypeScript type definitions
│
├── utils/
│   ├── imageCompression.ts    # ✨ NEW: Image optimization
│   ├── rateLimiter.ts         # ✨ NEW: Rate limiting
│   ├── permissions.ts         # ✅ Camera/media permissions
│   └── helpers.ts             # General utilities
│
├── screens/
│   ├── CameraScreen.tsx       # ✅ Complete scan UI (4 modes)
│   ├── NutritionFacts.tsx     # ✅ Results display + FDA analysis
│   └── ScanHistoryScreen.tsx  # Scan history view
│
└── context/
    └── AuthContext.tsx         # User authentication
```

---

## 🎨 Best Practices Implemented

### ✅ Image Optimization
- Always compress images before upload
- Target: 500KB or less per image
- Max dimensions: 4000x4000
- JPEG format with progressive quality reduction

### ✅ Rate Limiting
- 1 second minimum between requests
- 10 requests per minute maximum
- Automatic queuing with `waitForNextSlot()`
- Status tracking

### ✅ Error Handling
- Typed error codes for all scenarios
- User-friendly error messages
- Retry detection
- Comprehensive error logging

### ✅ Console Logging
- All API calls logged with timing
- Request/response data (image data truncated)
- Error details with stack traces
- Clear section markers

### ✅ User Experience
- Loading indicators during scans
- Clear error messages
- Retry options for transient failures
- Scan history for reference

---

## 🧪 Testing

### Test Barcode Scan
```typescript
// Test with a valid barcode
const result = await scanService.scanBarcode('012345678905');
console.log('Product:', result.analysis?.metadata?.product_name);
```

### Test Food Photo
```typescript
// Capture and scan food photo
const photo = await cameraRef.current.takePictureAsync();
const compressed = await compressImageForUpload(photo.uri);
const result = await scanService.scanFoodPhoto(compressed);
console.log('Detected foods:', result.analysis?.detected_foods);
```

### Test Rate Limiter
```typescript
console.log('Can make request:', globalRateLimiter.canMakeRequest());
console.log('Status:', globalRateLimiter.getStatus());
```

### Test Error Handling
```typescript
try {
  await scanService.scanBarcode('invalid-barcode');
} catch (error) {
  if (error instanceof WIHYError) {
    console.log('Error code:', error.code);
    console.log('User message:', error.getUserMessage());
    console.log('Is retryable:', error.isRetryable());
  }
}
```

---

## 📈 Next Steps

### Optional Enhancements

1. **Offline Queue** - Queue scans when offline, upload when connection restored
2. **Caching** - Cache scan history locally for faster loading
3. **Analytics** - Track scan success rates and error patterns
4. **Push Notifications** - Notify users of scan results
5. **Batch Scanning** - Scan multiple items in sequence

### Production Readiness

- ✅ All scan modes implemented
- ✅ Image compression
- ✅ Rate limiting
- ✅ Error handling
- ✅ Console logging
- ⏳ Add authentication tokens (future)
- ⏳ Implement offline queue (optional)
- ⏳ Add local caching (optional)

---

## 🔗 Related Documentation

- [Mobile Client API Endpoints](./MOBILE_CLIENT_API_ENDPOINTS.md)
- [Mobile Scan Setup Guide](./MOBILE_SCAN_SETUP_GUIDE.md)
- [Scan Features Documentation](./SCAN_FEATURES.md)

---

## ✅ Implementation Checklist

- [x] Image compression utility
- [x] Rate limiting utility
- [x] Error type definitions
- [x] Barcode scanning with logging
- [x] Food photo analysis with logging
- [x] Pill identification with logging
- [x] Label scanning with logging
- [x] Scan history management
- [x] FDA ingredient analysis
- [x] Chat/Ask integration
- [x] Camera screen UI (4 modes)
- [x] NutritionFacts display
- [x] Error handling throughout
- [x] User context tracking

**Status**: ✅ **PRODUCTION READY**

---

**Last Updated**: December 30, 2025  
**Service URL**: https://services.wihy.ai  
**Implementation**: React Native + TypeScript
