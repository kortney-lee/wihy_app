/**
 * Auth Callback Screen (Web)
 * Handles OAuth redirects on web platform
 * 
 * URL format: https://wihy.ai/auth/callback?session_token=...&provider=...&state=...
 * 
 * On native (iOS/Android), deep links are handled by deepLinkHandler.ts
 * This screen is only used on web.
 */

import React, { useEffect, useState, useContext } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { useNavigation, useRoute, CommonActions } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../services/authService';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { colors } from '../theme/design-tokens';

// State storage key for CSRF verification
const OAUTH_STATE_KEY = '@wihy_oauth_state';

interface AuthCallbackParams {
  session_token?: string;
  provider?: string;
  state?: string;
  error?: string;
  error_description?: string;
}

export default function AuthCallbackScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { signIn } = useContext(AuthContext);
  const { theme } = useTheme();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    handleCallback();
  }, []);

  const handleCallback = async () => {
    try {
      console.log('=== AUTH CALLBACK (WEB) ===');
      
      // Get params from URL query string (web) or route params (native)
      let params: AuthCallbackParams = {};
      
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        // Web: parse URL query params
        const urlParams = new URLSearchParams(window.location.search);
        params = {
          session_token: urlParams.get('session_token') || undefined,
          provider: urlParams.get('provider') || undefined,
          state: urlParams.get('state') || undefined,
          error: urlParams.get('error') || undefined,
          error_description: urlParams.get('error_description') || undefined,
        };
      } else {
        // Native: use route params (though deepLinkHandler usually handles this)
        params = route.params as AuthCallbackParams || {};
      }

      console.log('Callback params:', {
        hasToken: !!params.session_token,
        provider: params.provider,
        state: params.state ? '***' : undefined,
        error: params.error,
      });

      // Check for error response
      if (params.error) {
        const errorMsg = params.error_description || params.error || 'Authentication failed';
        console.error('OAuth error:', errorMsg);
        setStatus('error');
        setErrorMessage(errorMsg);
        
        // Redirect to home after delay
        setTimeout(() => {
          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{ name: 'Main' }],
            })
          );
        }, 3000);
        return;
      }

      // Verify state (CSRF protection)
      if (params.state) {
        const savedState = await AsyncStorage.getItem(OAUTH_STATE_KEY);
        if (savedState && params.state !== savedState) {
          console.error('State mismatch - potential CSRF attack');
          setStatus('error');
          setErrorMessage('Security verification failed. Please try again.');
          return;
        }
        // Clear saved state
        await AsyncStorage.removeItem(OAUTH_STATE_KEY);
      }

      // Process session token
      if (params.session_token) {
        console.log('Session token received from provider:', params.provider);
        
        // Store the session token
        if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
          localStorage.setItem('accessToken', params.session_token);
        }
        await authService.storeSessionToken(params.session_token);

        // Verify the session and get user data (with retry and fallback)
        const session = await authService.verifySession({ maxRetries: 2, useFallback: true });
        
        if (session.valid && session.user) {
          // Log if we used fallback mode
          if (session.usedFallback) {
            console.warn('Session verified using JWT fallback:', session.error);
          } else {
            console.log('Session verified, user:', session.user.email);
          }
          
          // Store provider info
          if (params.provider) {
            await AsyncStorage.setItem('@wihy_auth_provider', params.provider);
          }
          
          setStatus('success');

          // Trigger context update via signIn
          // IMPORTANT: Always use 'oauth' provider since we already have the token
          // Using the actual provider (google, facebook, etc.) would start a NEW OAuth flow!
          try {
            await signIn('oauth', { 
              token: params.session_token 
            });
          } catch (e) {
            // signIn might fail if already authenticated via token storage
            // That's okay, the token is already stored
            console.log('Context signIn skipped:', e);
          }

          // Check for pending subscription or plan (OAuth-first, then pay flow)
          if (Platform.OS === 'web' && typeof window !== 'undefined') {
            const pendingPlan = sessionStorage.getItem('pendingPlan');
            const pendingSubscription = sessionStorage.getItem('pendingSubscription');
            
            if (pendingPlan) {
              console.log('Found pending plan, redirecting to subscribe/complete');
              sessionStorage.removeItem('pendingPlan');
              
              setTimeout(() => {
                window.location.href = `/subscribe/complete?plan=${pendingPlan}`;
              }, 1000);
              return;
            } else if (pendingSubscription) {
              console.log('Pending subscription found, checking user plan...');
              
              // Check if user already has a paid plan
              const userPlan = session.user.plan;
              const isPaidPlan = userPlan && userPlan !== 'free';
              
              if (isPaidPlan) {
                // User already has a paid plan, clear pending subscription
                console.log('User already has paid plan:', userPlan);
                sessionStorage.removeItem('pendingSubscription');
              } else {
                // User needs to complete payment - redirect to subscribe complete
                console.log('User needs to complete payment, redirecting to /subscribe/complete');
                setTimeout(() => {
                  window.location.href = '/subscribe/complete';
                }, 1500);
                return;
              }
            }
          }

          // Navigate to dashboard/main
          setTimeout(() => {
            if (Platform.OS === 'web' && typeof window !== 'undefined') {
              // Use '/' which maps to Main > Home tab in the linking config
              window.location.href = '/';
            } else {
              navigation.dispatch(
                CommonActions.reset({
                  index: 0,
                  routes: [{ name: 'Main' }],
                })
              );
            }
          }, 1500);
        } else {
          // Provide specific error message from verification
          const errorDetail = session.error || 'Unknown verification error';
          throw new Error(`Session verification failed: ${errorDetail}`);
        }
      } else {
        throw new Error('No session token received');
      }
    } catch (error) {
      console.error('Auth callback error:', error);
      setStatus('error');
      
      // Provide user-friendly error messages
      let userMessage = 'Authentication failed';
      if (error instanceof Error) {
        if (error.message.includes('Token expired')) {
          userMessage = 'Your session has expired. Please try signing in again.';
        } else if (error.message.includes('Network error') || error.message.includes('timeout')) {
          userMessage = 'Connection error. Please check your internet and try again.';
        } else if (error.message.includes('verification failed')) {
          userMessage = 'Could not verify your account. Please try again or contact support.';
        } else {
          userMessage = error.message;
        }
      }
      setErrorMessage(userMessage);
      
      // Redirect to home after delay
      setTimeout(() => {
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: 'Main' }],
          })
        );
      }, 3000);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {status === 'processing' && (
        <>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.title}>Completing sign in...</Text>
          <Text style={styles.subtitle}>Please wait while we verify your account</Text>
        </>
      )}

      {status === 'success' && (
        <>
          <View style={styles.iconContainer}>
            <Text style={styles.successIcon}>✓</Text>
          </View>
          <Text style={styles.title}>Welcome!</Text>
          <Text style={styles.subtitle}>Sign in successful. Redirecting...</Text>
        </>
      )}

      {status === 'error' && (
        <>
          <View style={[styles.iconContainer, styles.errorIcon]}>
            <Text style={styles.errorIconText}>✕</Text>
          </View>
          <Text style={styles.title}>Sign in failed</Text>
          <Text style={styles.subtitle}>{errorMessage}</Text>
          <Text style={styles.redirectText}>Redirecting to home...</Text>
        </>
      )}
    </View>
  );
}

/**
 * Save OAuth state for CSRF verification
 * Call this before initiating OAuth flow
 */
export async function saveOAuthState(state: string): Promise<void> {
  await AsyncStorage.setItem(OAUTH_STATE_KEY, state);
}

/**
 * Generate and save a random OAuth state
 */
export async function generateOAuthState(): Promise<string> {
  // Generate random state
  const array = new Uint8Array(16);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(array);
  } else {
    // Fallback for older environments
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
  }
  const state = Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
  
  await saveOAuthState(state);
  return state;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 24,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  successIcon: {
    fontSize: 40,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  errorIcon: {
    backgroundColor: '#dc2626',
  },
  errorIconText: {
    fontSize: 40,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.textMuted,
    textAlign: 'center',
    maxWidth: 300,
  },
  redirectText: {
    fontSize: 14,
    color: colors.placeholder,
    marginTop: 24,
  },
});
