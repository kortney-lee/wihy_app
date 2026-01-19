/**
 * Subscribe Complete Screen (Web)
 * Handles the OAuth-first, then pay flow
 * 
 * URL: /subscribe/complete
 * 
 * Flow:
 * 1. User clicked OAuth button on subscribe modal
 * 2. OAuth completed, user is now authenticated
 * 3. This screen reads pendingSubscription from sessionStorage
 * 4. Creates a checkout session for the authenticated user
 * 5. Redirects to Stripe checkout
 */

import React, { useEffect, useState, useContext } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { AuthContext } from '../context/AuthContext';
import { checkoutService } from '../services/checkoutService';
import { colors } from '../theme/design-tokens';

interface PendingSubscription {
  planId: string;
  planName: string;
  billingCycle: 'monthly' | 'yearly';
  returnUrl?: string;
}

export default function SubscribeCompleteScreen() {
  const navigation = useNavigation<any>();
  const { user } = useContext(AuthContext);
  const [status, setStatus] = useState<'processing' | 'redirecting' | 'error'>('processing');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    completeSubscription();
  }, []);

  const completeSubscription = async () => {
    try {
      console.log('=== SUBSCRIBE COMPLETE ===');
      
      // Only works on web
      if (Platform.OS !== 'web' || typeof window === 'undefined') {
        throw new Error('This page is only available on web');
      }

      // Check if user is authenticated
      if (!user) {
        console.error('User not authenticated');
        // Redirect to login/subscribe
        setTimeout(() => {
          window.location.href = '/subscription';
        }, 2000);
        throw new Error('Please sign in first to complete your subscription');
      }

      // Check if user already has a paid plan
      const isPaidPlan = user.plan && user.plan !== 'free';
      if (isPaidPlan) {
        console.log('User already has paid plan:', user.plan);
        setStatus('redirecting');
        // Clear pending subscription and redirect to main
        sessionStorage.removeItem('pendingSubscription');
        setTimeout(() => {
          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{ name: 'Main' }],
            })
          );
        }, 1500);
        return;
      }

      // Get pending subscription from sessionStorage
      const pendingJson = sessionStorage.getItem('pendingSubscription');
      if (!pendingJson) {
        console.error('No pending subscription found');
        // Redirect to subscription page
        setTimeout(() => {
          window.location.href = '/subscription';
        }, 2000);
        throw new Error('No pending subscription. Please select a plan.');
      }

      const pending: PendingSubscription = JSON.parse(pendingJson);
      console.log('Pending subscription:', pending);

      // Create checkout session for authenticated user
      setStatus('redirecting');
      
      const response = await checkoutService.initiateCheckout(
        pending.planId,
        user.email // User is authenticated, use their email
      );

      if (response.success && response.checkoutUrl) {
        console.log('Checkout session created, redirecting to Stripe...');
        
        // Clear pending subscription
        sessionStorage.removeItem('pendingSubscription');
        
        // Store checkout info for post-payment
        sessionStorage.setItem('pendingCheckout', JSON.stringify({
          email: user.email,
          planId: pending.planId,
          planName: pending.planName,
          isAuthenticated: true, // User is already logged in
        }));

        // Redirect to Stripe
        window.location.href = response.checkoutUrl;
      } else {
        throw new Error(response.error || 'Failed to create checkout session');
      }
    } catch (error) {
      console.error('Subscribe complete error:', error);
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Failed to complete subscription');
      
      // Redirect to subscription page after delay
      setTimeout(() => {
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          window.location.href = '/subscription';
        } else {
          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{ name: 'Subscription' }],
            })
          );
        }
      }, 3000);
    }
  };

  return (
    <View style={styles.container}>
      {status === 'processing' && (
        <>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.title}>Setting up your subscription...</Text>
          <Text style={styles.subtitle}>Please wait while we prepare your checkout</Text>
        </>
      )}

      {status === 'redirecting' && (
        <>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.title}>Redirecting to payment...</Text>
          <Text style={styles.subtitle}>You'll be taken to Stripe to complete your purchase</Text>
        </>
      )}

      {status === 'error' && (
        <>
          <View style={[styles.iconContainer, styles.errorIcon]}>
            <Text style={styles.errorIconText}>✕</Text>
          </View>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.subtitle}>{errorMessage}</Text>
          <Text style={styles.redirectText}>Redirecting to subscription page...</Text>
        </>
      )}
    </View>
  );
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
