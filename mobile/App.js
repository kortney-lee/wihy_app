import 'react-native-gesture-handler';
import React, { useEffect, useState, Component } from 'react';
import { StatusBar, View, ActivityIndicator, Platform, Text, ScrollView, TouchableOpacity } from 'react-native';
import * as Font from 'expo-font';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { AuthProvider } from './src/context/AuthContext';
import { ThemeProvider } from './src/context/ThemeContext';

// Only import Ionicons on native platforms - web uses inline SVGs
let Ionicons = null;
if (Platform.OS !== 'web') {
  Ionicons = require('@expo/vector-icons').Ionicons;
}

// Error Boundary to catch JS errors and show them instead of white screen
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('App Error:', error, errorInfo);
  }

  handleReload = async () => {
    try {
      // Simple state reset - Updates module removed
      this.setState({ hasError: false, error: null, errorInfo: null });
    } catch (e) {
      console.error('Failed to reload:', e);
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, backgroundColor: '#fff', padding: 20, paddingTop: 60 }}>
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#ef4444', marginBottom: 16 }}>
            Something went wrong
          </Text>
          <Text style={{ fontSize: 16, color: '#374151', marginBottom: 16 }}>
            The app encountered an unexpected error. Please try reloading.
          </Text>
          <TouchableOpacity 
            onPress={this.handleReload}
            style={{ 
              backgroundColor: '#4cbb17', 
              padding: 16, 
              borderRadius: 8,
              alignItems: 'center',
              marginBottom: 20
            }}
          >
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>Reload App</Text>
          </TouchableOpacity>
          <ScrollView style={{ flex: 1, backgroundColor: '#f3f4f6', borderRadius: 8, padding: 12 }}>
            <Text style={{ fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', fontSize: 12, color: '#dc2626' }}>
              {this.state.error?.toString()}
            </Text>
            <Text style={{ fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', fontSize: 10, color: '#6b7280', marginTop: 8 }}>
              {this.state.errorInfo?.componentStack}
            </Text>
          </ScrollView>
        </View>
      );
    }

    return this.props.children;
  }
}

export default function App() {
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [loadStage, setLoadStage] = useState('init'); // Debug: track loading stages

  useEffect(() => {
    let mounted = true;
    setLoadStage('starting');

    // Force continue after timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      if (!fontsLoaded && mounted) {
        console.warn('App loading timed out - forcing continue');
        setLoadStage('timeout-forced');
        setFontsLoaded(true);
      }
    }, 5000); // 5 second timeout

    const loadResources = async () => {
      try {
        setLoadStage('loading-fonts');
        // Only load fonts on native platforms - web handles icons via inline SVG
        if (Platform.OS !== 'web' && Ionicons?.font) {
          await Font.loadAsync({ ...Ionicons.font });
        }
        setLoadStage('fonts-loaded');
      } catch (error) {
        console.warn('Ionicons font failed to load', error);
        setLoadStage('font-error');
      } finally {
        setLoadStage('ready');
        mounted && setFontsLoaded(true);
        clearTimeout(timeout);
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
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#e0f2fe' }}>
        <ActivityIndicator size="large" color="#4cbb17" />
        <Text style={{ marginTop: 20, fontSize: 16, color: '#374151' }}>Loading WiHY...</Text>
        <Text style={{ marginTop: 10, fontSize: 12, color: '#6b7280' }}>Stage: {loadStage}</Text>
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <ThemeProvider>
          <AuthProvider>
            <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
            <AppNavigator />
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
