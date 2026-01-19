#!/bin/bash
# Expo + React Native Setup Script for WIHY Health Scanner
# This script sets up the React Native environment alongside the existing web app

set -e  # Exit on error

echo "🚀 Setting up React Native + Expo for WIHY Health Scanner"
echo "=================================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the root of wihy_ui_clean directory"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if Expo CLI is available
if ! command -v npx &> /dev/null; then
    echo "❌ Error: npx is not available. Please update Node.js/npm."
    exit 1
fi

echo "✅ Prerequisites check passed"

# Create expo app
echo "📱 Creating Expo React Native app..."
npx create-expo-app@latest expo-app --template tabs

cd expo-app

echo "📦 Installing required dependencies..."

# Install navigation dependencies
npx expo install expo-router expo-linking expo-constants
npx expo install @react-navigation/native @react-navigation/native-stack
npx expo install react-native-screens react-native-safe-area-context

# Install camera and image picker
npx expo install expo-camera expo-image-picker expo-barcode-scanner

# Install chart libraries (React Native compatible)
npm install react-native-chart-kit react-native-svg
npx expo install react-native-svg

# Install shared dependencies
npm install axios

# Install development dependencies
npm install --save-dev @types/react @types/react-native typescript

echo "⚙️ Configuring Expo app..."

# Create app.json configuration
cat > app.json << 'EOF'
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
      "bundleIdentifier": "com.wihy.healthscanner",
      "infoPlist": {
        "NSCameraUsageDescription": "This app uses the camera to scan food items and analyze nutrition information.",
        "NSPhotoLibraryUsageDescription": "This app accesses your photo library to analyze food images for nutrition information."
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "package": "com.wihy.healthscanner",
      "permissions": [
        "CAMERA",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE"
      ]
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "plugins": [
      [
        "expo-camera",
        {
          "cameraPermission": "Allow $(PRODUCT_NAME) to access your camera to scan foods and barcodes.",
          "microphonePermission": "Allow $(PRODUCT_NAME) to access your microphone for video recording.",
          "recordAudioAndroid": false
        }
      ],
      [
        "expo-image-picker",
        {
          "photosPermission": "Allow $(PRODUCT_NAME) to access your photo library to analyze food images."
        }
      ]
    ],
    "extra": {
      "eas": {
        "projectId": "wihy-health-scanner"
      }
    }
  }
}
EOF

echo "📁 Creating shared services directory..."
cd ..
mkdir -p shared/{services,types,utils,constants}

echo "🔄 Copying shared services from web app..."

# Copy API services (these can be reused 100%)
if [ -f "client/src/services/wihyAPI.ts" ]; then
    cp client/src/services/wihyAPI.ts shared/services/
    echo "✅ Copied wihyAPI.ts"
fi

if [ -f "client/src/services/newsService.ts" ]; then
    cp client/src/services/newsService.ts shared/services/
    echo "✅ Copied newsService.ts"
fi

# Copy session manager
if [ -f "client/src/services/sessionManager.ts" ]; then
    cp client/src/services/sessionManager.ts shared/services/
    echo "✅ Copied sessionManager.ts"
fi

# Copy platform detection service
if [ -f "client/src/services/shared/platformDetectionService.ts" ]; then
    cp client/src/services/shared/platformDetectionService.ts shared/services/
    echo "✅ Copied platformDetectionService.ts"
fi

# Copy types if they exist
if [ -d "client/src/types" ]; then
    cp -r client/src/types/* shared/types/ 2>/dev/null || true
    echo "✅ Copied type definitions"
fi

echo "📱 Creating React Native app structure..."
cd expo-app

# Create screens directory
mkdir -p screens components services hooks utils

# Create a simple navigation structure
cat > app/_layout.tsx << 'EOF'
import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="index" 
        options={{ 
          title: 'WIHY Health Scanner',
          headerStyle: { backgroundColor: '#4285f4' },
          headerTintColor: '#ffffff',
          headerTitleStyle: { fontWeight: 'bold' }
        }} 
      />
      <Stack.Screen 
        name="results" 
        options={{ 
          title: 'Analysis Results',
          headerStyle: { backgroundColor: '#4285f4' },
          headerTintColor: '#ffffff',
          headerBackTitle: 'Back'
        }} 
      />
      <Stack.Screen 
        name="research" 
        options={{ 
          title: 'Research Dashboard',
          headerStyle: { backgroundColor: '#4285f4' },
          headerTintColor: '#ffffff'
        }} 
      />
    </Stack>
  );
}
EOF

# Create main search screen (index)
cat > app/index.tsx << 'EOF'
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Camera from 'expo-camera';

const rotatingPrompts = [
  "Scan food and explain it",
  "Analyze my meals", 
  "Create a nutrition plan for me",
  "Build me a workout plan",
  "Review this health claim"
];

export default function SearchScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [placeholder, setPlaceholder] = useState(rotatingPrompts[0]);

  // Rotating placeholder effect
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholder(prev => {
        const nextIndex = (rotatingPrompts.indexOf(prev) + 1) % rotatingPrompts.length;
        return rotatingPrompts[nextIndex];
      });
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsLoading(true);
    
    try {
      // TODO: Integrate with shared WiHy API service
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      router.push({
        pathname: '/results',
        params: { 
          query: searchQuery,
          results: JSON.stringify({
            summary: `Analysis for: ${searchQuery}`,
            recommendations: ['Sample recommendation 1', 'Sample recommendation 2']
          })
        }
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to search. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCameraCapture = async () => {
    try {
      const { status } = await Camera.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Camera access is needed to scan food items.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        // TODO: Process image with shared scanning service
        Alert.alert('Success', 'Image captured! Processing...');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to capture image.');
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#4285f4" />
        <ActivityIndicator size="large" color="#4285f4" />
        <Text style={styles.loadingText}>Analyzing...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4285f4" />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>What is Healthy?</Text>
        </View>
        
        <View style={styles.searchInputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={placeholder}
              style={styles.searchInput}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              placeholderTextColor="#9ca3af"
            />
          </View>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.primaryButton, !searchQuery.trim() && styles.disabledButton]}
            onPress={handleSearch}
            disabled={!searchQuery.trim()}
          >
            <Text style={styles.primaryButtonText}>Analyze Nutrition</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.push('/research')}
          >
            <Text style={styles.secondaryButtonText}>Verify With Evidence</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.cameraButtons}>
          <TouchableOpacity style={styles.cameraButton} onPress={handleCameraCapture}>
            <Text style={styles.cameraButtonText}>📷 Scan Food</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#ffffff' },
  logoContainer: { alignItems: 'center', marginBottom: 40 },
  logoText: { fontSize: 28, fontWeight: 'bold', color: '#1f2937', textAlign: 'center' },
  searchInputContainer: { marginBottom: 30 },
  inputWrapper: { borderWidth: 2, borderColor: '#e5e7eb', borderRadius: 24, backgroundColor: '#ffffff', elevation: 3 },
  searchInput: { padding: 16, fontSize: 16, color: '#1f2937', minHeight: 60, maxHeight: 120 },
  actionButtons: { gap: 15, marginBottom: 30 },
  primaryButton: { backgroundColor: '#4285f4', paddingVertical: 16, borderRadius: 24, alignItems: 'center', elevation: 3 },
  disabledButton: { backgroundColor: '#9ca3af', opacity: 0.6 },
  primaryButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
  secondaryButton: { backgroundColor: '#f8f9fa', paddingVertical: 16, borderRadius: 24, alignItems: 'center', borderWidth: 1, borderColor: '#e5e7eb' },
  secondaryButtonText: { color: '#374151', fontSize: 16, fontWeight: '500' },
  cameraButtons: { alignItems: 'center' },
  cameraButton: { backgroundColor: '#10b981', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 20 },
  cameraButtonText: { color: '#ffffff', fontSize: 14, fontWeight: '500' },
  loadingText: { fontSize: 18, fontWeight: '600', color: '#1f2937', marginTop: 20, textAlign: 'center' }
});
EOF

# Create results screen
cat > app/results.tsx << 'EOF'
import React from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView, StatusBar } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

export default function ResultsScreen() {
  const params = useLocalSearchParams();
  const query = params.query as string;
  const results = params.results ? JSON.parse(params.results as string) : null;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4285f4" />
      
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <Text style={styles.title}>Analysis Results</Text>
          <Text style={styles.query}>Query: {query}</Text>
          
          {results && (
            <View style={styles.resultsContainer}>
              <Text style={styles.summary}>{results.summary}</Text>
              
              {results.recommendations && results.recommendations.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Recommendations</Text>
                  {results.recommendations.map((rec: string, index: number) => (
                    <Text key={index} style={styles.recommendation}>• {rec}</Text>
                  ))}
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  scrollView: { flex: 1 },
  content: { padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1f2937', marginBottom: 10 },
  query: { fontSize: 16, color: '#6b7280', marginBottom: 20 },
  resultsContainer: { backgroundColor: '#f9fafb', padding: 15, borderRadius: 12 },
  summary: { fontSize: 16, color: '#1f2937', lineHeight: 24, marginBottom: 20 },
  section: { marginTop: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#1f2937', marginBottom: 10 },
  recommendation: { fontSize: 14, color: '#374151', lineHeight: 20, marginBottom: 5 }
});
EOF

# Create research screen placeholder
cat > app/research.tsx << 'EOF'
import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, StatusBar } from 'react-native';

export default function ResearchScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4285f4" />
      
      <View style={styles.content}>
        <Text style={styles.title}>Research Dashboard</Text>
        <Text style={styles.description}>
          Verify health claims with evidence-based research.
        </Text>
        <Text style={styles.comingSoon}>Coming Soon...</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1f2937', marginBottom: 10 },
  description: { fontSize: 16, color: '#6b7280', textAlign: 'center', marginBottom: 20 },
  comingSoon: { fontSize: 18, color: '#4285f4', fontWeight: '600' }
});
EOF

echo "🎨 Creating shared services adapter..."

# Create a simple adapter for shared services
cat > services/sharedServicesAdapter.ts << 'EOF'
// Adapter to use shared services from the web app in React Native
// This file bridges the gap between web and React Native implementations

// Import shared services
// Note: Update paths based on your actual shared services location
// import { WihyAPIService } from '../../shared/services/wihyAPI';
// import { sessionManager } from '../../shared/services/sessionManager';

// For now, create mock implementations
export class WihyAPIService {
  async searchHealth(query: string) {
    // TODO: Implement actual API call using shared service
    console.log('Mock WiHy API search for:', query);
    return {
      success: true,
      data: {
        response: `Mock analysis for: ${query}`,
        recommendations: [
          'This is a mock recommendation',
          'Integrate with actual API service'
        ]
      }
    };
  }

  async analyzeImage(imageData: string) {
    // TODO: Implement actual image analysis using shared service
    console.log('Mock image analysis');
    return {
      success: true,
      analysis: {
        summary: 'Mock image analysis result',
        recommendations: ['Mock recommendation for image']
      }
    };
  }
}

export const sessionManager = {
  initialize: async () => {
    console.log('Mock session manager initialization');
    return { sessionId: 'mock-session-id' };
  },
  getSessionId: () => 'mock-session-id'
};
EOF

echo "📋 Updating package.json with workspace configuration..."
cd ..

# Update root package.json to include workspace
if command -v jq &> /dev/null; then
    # If jq is available, use it to properly update JSON
    jq '.workspaces = ["client", "expo-app", "shared"]' package.json > package.json.tmp && mv package.json.tmp package.json
else
    # Fallback: manual edit (requires manual verification)
    echo "⚠️  Please manually add workspace configuration to package.json:"
    echo '"workspaces": ["client", "expo-app", "shared"]'
fi

echo "✅ React Native + Expo setup complete!"
echo ""
echo "🎯 Next Steps:"
echo "1. cd expo-app"
echo "2. npx expo start"
echo "3. Scan QR code with Expo Go app on your device"
echo ""
echo "📱 Development Commands:"
echo "• expo-app: 'cd expo-app && npx expo start'"
echo "• web app:  'cd client && npm start'"
echo ""
echo "🔧 Integration Tasks:"
echo "1. Connect shared services (WiHy API, Session Manager)"
echo "2. Implement image analysis with camera"
echo "3. Add proper navigation between screens"
echo "4. Style components to match web design"
echo "5. Test on physical devices"
echo ""
echo "📖 See REACT_NATIVE_EXPO_INTEGRATION.md for detailed implementation guide"