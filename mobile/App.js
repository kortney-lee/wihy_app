import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { StatusBar, View, ActivityIndicator, Platform } from 'react-native';
import * as Font from 'expo-font';
import * as Updates from 'expo-updates';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { AuthProvider } from './src/context/AuthContext';

// Only import Ionicons on native platforms - web uses inline SVGs
let Ionicons = null;
if (Platform.OS !== 'web') {
  Ionicons = require('@expo/vector-icons').Ionicons;
}

export default function App() {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    let mounted = true;

    // Handle Expo Updates errors gracefully
    const handleUpdates = async () => {
      try {
        // Only check for updates in production builds, not in development
        if (!__DEV__ && Platform.OS !== 'web') {
          const update = await Updates.checkForUpdateAsync();
          if (update.isAvailable) {
            await Updates.fetchUpdateAsync();
            // Optionally reload the app
            // await Updates.reloadAsync();
          }
        }
      } catch (error) {
        // Silently log update errors - don't crash the app
        console.warn('Update check failed:', error.message);
        // App will continue to run with current version
      }
    };

    const loadResources = async () => {
      try {
        // Check for updates first (non-blocking)
        handleUpdates();

        // Only load fonts on native platforms - web handles icons via inline SVG
        if (Platform.OS !== 'web' && Ionicons?.font) {
          await Font.loadAsync({ ...Ionicons.font });
        }
      } catch (error) {
        console.warn('Ionicons font failed to load', error);
      } finally {
        mounted && setFontsLoaded(true);
      }
    };

    loadResources();

    return () => {
      mounted = false;
    };
  }, []);

  // Skip loading gate on web - fonts are CSS-based
  if (Platform.OS !== 'web' && !fontsLoaded) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#4cbb17" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <AppNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
