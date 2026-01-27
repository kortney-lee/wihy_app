import React, { useEffect, useRef, useState } from 'react';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Alert, AppState, Platform, LogBox, ActivityIndicator, View } from 'react-native';
import * as Font from 'expo-font';
import { Ionicons as CrossPlatformIonicons } from './components/shared';
import AppNavigator from './navigation/AppNavigator';
import { SessionProvider } from './contexts/SessionContext';
import { AuthProvider } from './context/AuthContext';
import { useDeepLinkHandler } from './utils/deepLinkHandler';
import { debugLogService } from './services';

// Only import Ionicons on native platforms to prevent font preloading on web
let NativeIonicons: any = null;
if (Platform.OS !== 'web') {
  NativeIonicons = require('@expo/vector-icons').Ionicons;
}

// Suppress expo-notifications warnings in Expo Go - log them instead
// These are expected in Expo Go and should not be shown to users
LogBox.ignoreLogs([
  'expo-notifications: Android Push notifications',
  'expo-notifications functionality is not fully supported in Expo Go',
  '`expo-notifications` functionality is not fully supported',
]);

// Log these warnings to our logging service instead of showing to users
if (__DEV__) {
  debugLogService.warning(
    'expo-notifications has limited functionality in Expo Go. Push notifications require a development build.',
    { 
      docsUrl: 'https://docs.expo.dev/develop/development-builds/introduction/',
      platform: Platform.OS 
    },
    'NotificationService'
  );
}

const AppContent: React.FC = () => {
  const sessionIdRef = useRef<string>('');

  // Initialize debug session
  useEffect(() => {
    // Generate unique session ID
    sessionIdRef.current = `${Platform.OS}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create debug session
    debugLogService.createSession(sessionIdRef.current);

    // Log app start
    debugLogService.info('Application started', {
      version: '1.0.0',
      platform: Platform.OS,
      platformVersion: Platform.Version,
    }, 'App');

    // Handle app state changes (background/foreground)
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'background') {
        debugLogService.info('App moved to background', undefined, 'App');
        debugLogService.flush();
      } else if (nextAppState === 'active') {
        debugLogService.info('App became active', undefined, 'App');
      }
    });

    return () => {
      subscription.remove();
      debugLogService.closeSession(sessionIdRef.current);
    };
  }, []);

  // Handle OAuth deep link callbacks
  useDeepLinkHandler({
    onAuthCallback: (params) => {
      console.log('OAuth callback received:', params);
      if (params.session_token) {
        console.log(`Successfully authenticated with ${params.provider}`);
        // AuthContext will automatically update when session is verified
      }
    },
    onError: (error) => {
      Alert.alert('Authentication Error', error);
    },
  });

  return <AppNavigator />;
};

const App: React.FC = () => {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    async function loadFonts() {
      try {
        // Only load Ionicons fonts on native platforms - web uses inline SVGs
        if (Platform.OS !== 'web' && NativeIonicons?.font) {
          await Font.loadAsync({
            ...NativeIonicons.font,
          });
        }
        setFontsLoaded(true);
      } catch (error) {
        console.error('Error loading fonts:', error);
        // Still set to true to prevent infinite loading
        setFontsLoaded(true);
      }
    }

    loadFonts();
  }, []);

  // Show loading indicator while fonts load (native only)
  if (!fontsLoaded && Platform.OS !== 'web') {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#4cbb17" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <SessionProvider>
          <SafeAreaProvider>
            <AppContent />
          </SafeAreaProvider>
        </SessionProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
};

export default App;
