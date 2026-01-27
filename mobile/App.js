import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { StatusBar, View, ActivityIndicator, Platform } from 'react-native';
import * as Font from 'expo-font';
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
    (async () => {
      try {
        // Only load fonts on native platforms - web handles icons via inline SVG
        if (Platform.OS !== 'web' && Ionicons?.font) {
          await Font.loadAsync({ ...Ionicons.font });
        }
      } catch (error) {
        console.warn('Ionicons font failed to load', error);
      } finally {
        mounted && setFontsLoaded(true);
      }
    })();

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
