/**
 * Payment Success Screen (Web)
 * Handles Stripe checkout return after successful payment
 * 
 * URL format: https://wihy.ai/payment/success?session_id=...
 * 
 * On native (iOS/Android), deep links are handled by checkoutService
 * This screen is only used on web.
 */

import React, { useEffect, useState, useContext } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { useNavigation, useRoute, CommonActions } from '@react-navigation/native';
import { authService } from '../services/authService';
import { checkoutService } from '../services/checkoutService';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { colors } from '../theme/design-tokens';

interface PaymentSuccessParams {
  session_id?: string;
}

export default function PaymentSuccessScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { user, refreshUserContext } = useContext(AuthContext);
  const { theme } = useTheme();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [planName, setPlanName] = useState<string>('');

  useEffect(() => {
    handlePaymentSuccess();
  }, []);

  const completePaymentLogin = async (sessionId: string) => {
    try {
      console.log('=== COMPLETING PAYMENT LOGIN ===');
      console.log('Session ID:', sessionId);

      // Step 1: Get checkout session with login token from payment service
      const checkoutResult = await checkoutService.getCheckoutSession(sessionId);

      if (!checkoutResult.success || !checkoutResult.session) {
        throw new Error(checkoutResult.error || 'Failed to retrieve checkout session');
      }

      console.log('Checkout session retrieved:', {
        hasAuth: !!checkoutResult.auth,
        hasLoginToken: !!checkoutResult.session.loginToken,
        email: checkoutResult.session.email,
        userId: checkoutResult.auth?.userId,
        isNewUser: checkoutResult.auth?.isNewUser,
        needsSignup: checkoutResult.auth?.needsSignup,
        userExists: checkoutResult.auth?.userExists,
      });

      // Check if user needs to create an account after payment (Payment-first flow)
      // This happens when a new user paid without having an existing account
      if (checkoutResult.auth?.needsSignup === true) {
        console.log('User needs to create account after payment - redirecting to SignupWithPayment');
        
        const planName = checkoutResult.session.planName || checkoutResult.session.plan || 'Premium';
        setPlanName(planName);
        setStatus('success');
        
        // Navigate to SignupWithPayment screen with Stripe info
        setTimeout(() => {
          if (Platform.OS === 'web' && typeof window !== 'undefined') {
            const params = new URLSearchParams({
              email: checkoutResult.session?.email || '',
              name: checkoutResult.session?.name || '',
              plan: planName,
              stripeCustomerId: checkoutResult.session?.customerId || '',
              stripeSubscriptionId: checkoutResult.session?.subscriptionId || '',
            });
            window.location.href = `/signup-with-payment?${params.toString()}`;
          } else {
            navigation.navigate('SignupWithPayment', {
              email: checkoutResult.session?.email || '',
              name: checkoutResult.session?.name || '',
              plan: planName,
              stripeCustomerId: checkoutResult.session?.customerId || '',
              stripeSubscriptionId: checkoutResult.session?.subscriptionId || '',
            });
          }
        }, 1500);
        return;
      }

      // Get login token and auth info - token is in auth object
      const loginToken = checkoutResult.session.loginToken || checkoutResult.auth?.loginToken;
      const userId = checkoutResult.auth?.userId;
      const isNewUser = checkoutResult.auth?.isNewUser;

      if (!loginToken) {
        throw new Error('No login token in checkout session');
      }

      console.log('Auth data from checkout:', {
        hasLoginToken: !!loginToken,
        hasUserId: !!userId,
        isNewUser,
      });

      // Step 2: Verify payment token to get proper session tokens
      // The loginToken from checkout session must be exchanged for session/refresh tokens
      console.log('Verifying payment token...');
      const verifyResponse = await fetch('https://auth.wihy.ai/api/auth/verify-payment-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ token: loginToken }),
      });

      const verifyData = await verifyResponse.json();

      if (!verifyData.success) {
        console.warn('Token verification failed, using loginToken directly as fallback');
        // Fallback: use loginToken directly (backwards compatibility)
        if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
          localStorage.setItem('accessToken', loginToken);
          localStorage.setItem('authToken', loginToken);
          if (userId) {
            localStorage.setItem('userId', userId);
          }
        } else {
          await authService.storeSessionToken(loginToken);
        }
      } else {
        // Use verified session tokens
        const sessionToken = verifyData.data?.token || verifyData.data?.sessionToken;
        const refreshToken = verifyData.data?.refreshToken;

        if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
          localStorage.setItem('accessToken', sessionToken);
          localStorage.setItem('authToken', sessionToken);
          if (refreshToken) {
            localStorage.setItem('refreshToken', refreshToken);
          }
          if (userId) {
            localStorage.setItem('userId', userId);
          }
        } else {
          await authService.storeSessionToken(sessionToken);
        }
      }

      // Step 3: Refresh user context to load user data
      await refreshUserContext();

      // Set plan name from checkout session
      const planName = checkoutResult.session.planName || checkoutResult.session.plan || 'Premium';
      setPlanName(planName);

      console.log('Payment login complete:', {
        email: checkoutResult.session?.email,
        plan: planName,
        isNewUser,
      });

      setStatus('success');

      // Redirect based on user status
      setTimeout(() => {
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          // New users go to ProfileSetup for initial profile configuration
          // Existing users go to dashboard
          if (isNewUser) {
            // Direct to ProfileSetup with onboarding flag
            // This ensures new users complete their health profile before using the app
            window.location.href = '/ProfileSetup?isOnboarding=true&plan=' + encodeURIComponent(planName);
          } else {
            window.location.href = '/dashboard';
          }
        } else {
          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{ name: 'Main' }],
            })
          );
        }
      }, 2000);
    } catch (error) {
      console.error('Payment login error:', error);
      throw error;
    }
  };

  const handlePaymentSuccess = async () => {
    try {
      console.log('=== PAYMENT SUCCESS (WEB) ===');
      
      // Get params from URL query string (web) or route params (native)
      let params: PaymentSuccessParams = {};
      
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        // Web: parse URL query params
        const urlParams = new URLSearchParams(window.location.search);
        params = {
          session_id: urlParams.get('session_id') || undefined,
        };
      } else {
        // Native: use route params
        params = route.params as PaymentSuccessParams || {};
      }

      console.log('Payment success params:', {
        hasSessionId: !!params.session_id,
      });

      if (!params.session_id) {
        console.error('No session_id in payment success URL');
        setStatus('error');
        setErrorMessage('Invalid payment session. Please contact support if you were charged.');
        
        // Redirect to subscription page after delay
        setTimeout(() => {
          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{ name: 'Subscription' }],
            })
          );
        }, 5000);
        return;
      }

      // Complete payment login flow
      setStatus('processing');
      
      try {
        await completePaymentLogin(params.session_id);
      } catch (error) {
        console.error('Payment verification error:', error);
        setStatus('error');
        setErrorMessage('Could not verify payment. Please contact support if you were charged.');
        
        // Still redirect to main after delay
        setTimeout(() => {
          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{ name: 'Main' }],
            })
          );
        }, 5000);
      }
    } catch (error) {
      console.error('Payment success handler error:', error);
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'An unexpected error occurred');
      
      // Redirect to home after delay
      setTimeout(() => {
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: 'Main' }],
          })
        );
      }, 5000);
    }
  };

  if (Platform.OS === 'web') {
    // Web view - HTML/CSS
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '24px',
        backgroundColor: '#f8fafc',
      }}>
        {status === 'processing' && (
          <>
            <ActivityIndicator size="large" color={colors.primary} />
            <h1 style={{
              fontSize: '24px',
              fontWeight: '700',
              color: '#0f172a',
              marginTop: '24px',
              marginBottom: '8px',
              textAlign: 'center',
            }}>
              Processing your payment...
            </h1>
            <p style={{
              fontSize: '16px',
              color: '#475569',
              textAlign: 'center',
              margin: '0',
            }}>
              Please wait while we verify your subscription
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: '#10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '24px',
            }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <h1 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: '#0f172a',
              marginBottom: '8px',
              textAlign: 'center',
            }}>
              Payment Successful! 🎉
            </h1>
            <p style={{
              fontSize: '16px',
              color: '#475569',
              textAlign: 'center',
              margin: '0 0 16px 0',
            }}>
              Welcome to {planName}! Redirecting you now...
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '24px',
            }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </div>
            <h1 style={{
              fontSize: '24px',
              fontWeight: '700',
              color: '#dc2626',
              marginBottom: '8px',
              textAlign: 'center',
            }}>
              Payment Verification Issue
            </h1>
            <p style={{
              fontSize: '16px',
              color: '#475569',
              textAlign: 'center',
              margin: '0 0 16px 0',
              maxWidth: '400px',
            }}>
              {errorMessage}
            </p>
          </>
        )}
      </div>
    );
  }

  // Native view - React Native components
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {status === 'processing' && (
        <>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.title}>Processing your payment...</Text>
          <Text style={styles.subtitle}>Please wait while we verify your subscription</Text>
        </>
      )}

      {status === 'success' && (
        <>
          <View style={styles.successIcon}>
            <Text style={styles.successIconText}>✓</Text>
          </View>
          <Text style={styles.successTitle}>Payment Successful! 🎉</Text>
          <Text style={styles.subtitle}>Welcome to {planName}! Redirecting you now...</Text>
        </>
      )}

      {status === 'error' && (
        <>
          <View style={styles.errorIcon}>
            <Text style={styles.errorIconText}>✕</Text>
          </View>
          <Text style={styles.errorTitle}>Payment Verification Issue</Text>
          <Text style={styles.subtitle}>{errorMessage}</Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    // backgroundColor: '#e0f2fe', // theme.colors.background
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 24,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#475569',
    textAlign: 'center',
    marginBottom: 0,
  },
  successIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  successIconText: {
    fontSize: 32,
    color: '#ffffff',
    fontWeight: '700',
  },
  successTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  errorIconText: {
    fontSize: 32,
    color: '#ffffff',
    fontWeight: '700',
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#dc2626',
    marginBottom: 8,
    textAlign: 'center',
  },
});
