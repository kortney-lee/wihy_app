# React Native + Expo Integration Strategy

## Overview
This document outlines the strategy to integrate React Native with Expo into the existing WIHY application while maximizing code reuse and minimizing recreation.

## Current State Analysis

### Existing Architecture Strengths
- [OK] React-based component architecture
- [OK] Platform detection service (`PlatformDetectionService`)
- [OK] Adaptive services (Camera, Platform-specific logic)
- [OK] Shared business logic (API services, utilities)
- [OK] Capacitor integration for mobile
- [OK] TypeScript throughout

### Current Mobile Setup
- Capacitor for Android/iOS
- Native camera integration
- Platform-specific UI adaptations
- Bottom navigation for mobile

## Integration Strategy: Expo + React Native Web

### Why This Approach?
1. **Maximum Code Sharing**: 70-80% code reuse between platforms
2. **Rapid Development**: Expo's managed workflow
3. **Hot Reload**: Fast development cycle
4. **Easy Deployment**: Expo's build services
5. **OTA Updates**: Update apps without app store approval

## Project Structure

```
wihy_ui_clean/
├── client/                    # Existing React web app
├── mobile/                    # Existing Capacitor (keep for comparison)
├── expo-app/                  # New Expo React Native app
│   ├── app/                   # Expo Router v2 structure
│   ├── components/            # Shared/adapted components
│   ├── services/              # Business logic (shared)
│   ├── hooks/                 # Shared React hooks
│   ├── utils/                 # Shared utilities
│   └── assets/               # Mobile-specific assets
├── shared/                    # Cross-platform shared code
│   ├── services/             # API services, business logic
│   ├── types/                # TypeScript types
│   ├── utils/                # Utility functions
│   └── constants/            # App constants
└── packages/                  # Optional: Monorepo packages
```

## Phase 1: Environment Setup (Week 1)

### Step 1: Initialize Expo App
```bash
cd c:\repo\wihy_ui_clean
npx create-expo-app@latest expo-app --template tabs
cd expo-app
npx expo install expo-dev-client
```

### Step 2: Configure Expo for Custom Dev Client
```javascript
// expo-app/app.json
{
  "expo": {
    "name": "WIHY Health Scanner",
    "slug": "wihy-health-scanner",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "automatic",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "assetBundlePatterns": ["**/*"],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.wihy.healthscanner"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "package": "com.wihy.healthscanner"
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "plugins": [
      [
        "expo-camera",
        {
          "cameraPermission": "Allow $(PRODUCT_NAME) to access your camera to scan foods and barcodes."
        }
      ],
      [
        "expo-image-picker",
        {
          "photosPermission": "Allow $(PRODUCT_NAME) to access your photo library to analyze food images."
        }
      ]
    ]
  }
}
```

### Step 3: Install Required Dependencies
```bash
cd expo-app
npx expo install expo-camera expo-image-picker expo-barcode-scanner
npx expo install expo-router expo-linking expo-constants
npx expo install @react-navigation/native @react-navigation/native-stack
npx expo install react-native-screens react-native-safe-area-context
npm install axios chart.js react-chartjs-2
npm install @types/react @types/react-native typescript
```

## Phase 2: Shared Services Migration (Week 1-2)

### Step 1: Create Shared Package Structure
```bash
mkdir -p shared/{services,types,utils,constants}
```

### Step 2: Move Shared Services
```typescript
// shared/services/wihyAPI.ts
export class WihyAPIService {
  // Move existing API logic from client/src/services/wihyAPI.ts
  // No changes needed - pure TypeScript/JavaScript
}

// shared/services/platformDetectionService.ts
export class PlatformDetectionService {
  static isNative(): boolean {
    // React Native always returns true
    return true;
  }
  
  static isExpo(): boolean {
    return typeof expo !== 'undefined';
  }
  
  // Adapt existing logic for React Native
}
```

### Step 3: Adaptive Camera Service for React Native
```typescript
// expo-app/services/adaptiveCameraService.ts
import * as ImagePicker from 'expo-image-picker';
import * as Camera from 'expo-camera';
import { WihyAPIService } from '../../shared/services/wihyAPI';

export class ExpoAdaptiveCameraService {
  static async captureImage(): Promise<string> {
    const { status } = await Camera.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Camera permission not granted');
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      aspect: [4, 3],
      quality: 0.8,
      base64: true
    });

    if (!result.canceled) {
      return `data:image/jpeg;base64,${result.assets[0].base64}`;
    }
    throw new Error('Camera capture cancelled');
  }

  static async selectImage(): Promise<string> {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Photo library permission not granted');
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      aspect: [4, 3],
      quality: 0.8,
      base64: true
    });

    if (!result.canceled) {
      return `data:image/jpeg;base64,${result.assets[0].base64}`;
    }
    throw new Error('Image selection cancelled');
  }
}
```

## Phase 3: Component Adaptation (Week 2-3)

### Core Components to Adapt

#### 1. VHealthSearch Component
```typescript
// expo-app/screens/SearchScreen.tsx
import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text } from 'react-native';
import { WihyAPIService } from '../../shared/services/wihyAPI';
import { ExpoAdaptiveCameraService } from '../services/adaptiveCameraService';

export const SearchScreen: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim() || isLoading) return;
    
    setIsLoading(true);
    try {
      // Reuse existing API logic
      const wihyAPI = new WihyAPIService();
      const response = await wihyAPI.searchHealth(searchQuery);
      
      // Navigate to results (React Native navigation)
      // Implementation similar to web version
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCameraCapture = async () => {
    try {
      const imageData = await ExpoAdaptiveCameraService.captureImage();
      // Process image similar to web version
    } catch (error) {
      console.error('Camera error:', error);
    }
  };

  return (
    <View style={styles.container}>
      {/* Logo */}
      <View style={styles.logoContainer}>
        <Text style={styles.logoText}>What is Healthy?</Text>
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Ask about nutrition, scan food, or get health insights"
          style={styles.searchInput}
          multiline
        />
        
        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleSearch}
            disabled={!searchQuery.trim() || isLoading}
          >
            <Text style={styles.buttonText}>
              {isLoading ? 'Analyzing...' : 'Analyze Nutrition'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleCameraCapture}
          >
            <Text style={styles.buttonText}>[CAMERA] Scan Food</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};
```

#### 2. Results Display Component
```typescript
// expo-app/screens/ResultsScreen.tsx
import React from 'react';
import { ScrollView, View, Text } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';

type ResultsRouteProp = RouteProp<{
  Results: {
    results: any;
    apiResponse: any;
  };
}>;

export const ResultsScreen: React.FC = () => {
  const route = useRoute<ResultsRouteProp>();
  const { results, apiResponse } = route.params;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Analysis Results</Text>
        <Text style={styles.summary}>{results.summary}</Text>
        
        {/* Recommendations */}
        {results.recommendations && results.recommendations.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recommendations</Text>
            {results.recommendations.map((rec: string, index: number) => (
              <Text key={index} style={styles.recommendation}>
                • {rec}
              </Text>
            ))}
          </View>
        )}

        {/* Charts could be implemented with react-native-chart-kit */}
      </View>
    </ScrollView>
  );
};
```

## Phase 4: Navigation Setup (Week 3)

### Expo Router Configuration
```typescript
// expo-app/app/_layout.tsx
import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'WIHY Health Scanner' }} />
      <Stack.Screen name="results" options={{ title: 'Analysis Results' }} />
      <Stack.Screen name="camera" options={{ title: 'Scan Food' }} />
    </Stack>
  );
}
```

## Code Sharing Strategy

### What Can Be Shared 100%
- [OK] API services (`wihyAPI.ts`, `newsService.ts`)
- [OK] Business logic and utilities
- [OK] TypeScript types and interfaces
- [OK] Constants and configuration
- [OK] Data processing functions

### What Needs Platform-Specific Implementation
- [CYCLE] UI Components (React vs React Native)
- [CYCLE] Navigation (React Router vs React Navigation)
- [CYCLE] Camera/Image services (different APIs)
- [CYCLE] Styling (CSS vs StyleSheet)

### Sharing Strategy Implementation
```typescript
// Package.json workspace configuration
{
  "workspaces": [
    "client",
    "expo-app",
    "shared"
  ]
}

// Shared package structure
shared/
├── services/
│   ├── wihyAPI.ts          # 100% shareable
│   ├── newsService.ts      # 100% shareable
│   └── authService.ts      # 100% shareable
├── utils/
│   ├── formatting.ts       # 100% shareable
│   └── validation.ts       # 100% shareable
├── types/
│   └── api.ts              # 100% shareable
└── constants/
    └── config.ts           # 100% shareable
```

## Development Workflow

### Local Development
```bash
# Web development
cd client && npm start

# Expo development
cd expo-app && npx expo start

# Run on device
npx expo start --tunnel  # For testing on physical device
```

### Building and Deployment

#### Expo Build Service
```bash
# Development build
npx expo build:android --type apk

# Production build
npx expo build:android --type app-bundle
npx expo build:ios
```

#### EAS Build (Recommended)
```bash
npx eas build --platform android
npx eas build --platform ios
```

## Migration Timeline

### Week 1: Foundation
- [x] Analyze current architecture
- [ ] Setup Expo environment
- [ ] Create shared services structure

### Week 2: Core Migration
- [ ] Migrate API services to shared
- [ ] Adapt platform detection
- [ ] Implement camera services

### Week 3: UI Components
- [ ] Create React Native search screen
- [ ] Implement results display
- [ ] Setup navigation

### Week 4: Testing & Polish
- [ ] Test on physical devices
- [ ] Performance optimization
- [ ] Polish UI/UX

## Benefits of This Approach

### Development Benefits
1. **Code Reuse**: 70-80% of logic can be shared
2. **Faster Development**: Expo's tooling and hot reload
3. **Easy Testing**: Run on device immediately
4. **OTA Updates**: Update without app store

### Business Benefits
1. **Cost Effective**: Don't recreate everything
2. **Faster Time to Market**: Leverage existing work
3. **Consistent Features**: Same API services across platforms
4. **Easy Maintenance**: Shared business logic

## Risk Mitigation

### Potential Challenges
1. **Performance**: React Native vs Native performance
2. **Platform Differences**: iOS vs Android quirks
3. **Library Compatibility**: Some web libraries won't work

### Solutions
1. **Custom Development Client**: For native modules
2. **Platform-Specific Code**: When needed
3. **Progressive Migration**: Keep web app, add mobile incrementally

## Next Steps

1. **Setup Expo Environment** (This week)
2. **Create Shared Services Package** (Next week)
3. **Implement Core Screens** (Week 3)
4. **Testing and Deployment** (Week 4)

This strategy minimizes recreation while leveraging the power of React Native + Expo for native mobile development.