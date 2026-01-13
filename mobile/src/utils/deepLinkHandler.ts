/**
 * Deep Link Handler for OAuth Callbacks
 * Handles wihy:// scheme deep links from auth service
 */

import { useEffect, useCallback, useRef } from 'react';
import * as Linking from 'expo-linking';
import { authService } from '../services/authService';

interface DeepLinkParams {
  session_token?: string;
  provider?: string;
  state?: string;
  error?: string;
  error_description?: string;
}

interface DeepLinkHandler {
  onAuthCallback?: (params: DeepLinkParams) => void;
  onError?: (error: string) => void;
}

/**
 * Hook to handle deep link OAuth callbacks
 */
export function useDeepLinkHandler({ onAuthCallback, onError }: DeepLinkHandler = {}) {
  const handledUrls = useRef<Set<string>>(new Set());

  const handleDeepLink = useCallback(async (url: string | null) => {
    if (!url) return;

    // Prevent handling the same URL twice
    if (handledUrls.current.has(url)) {
      console.log('Deep link already handled:', url);
      return;
    }

    console.log('=== DEEP LINK RECEIVED ===');
    console.log('URL:', url);

    // Only handle auth callbacks
    if (!url.startsWith('wihy://auth/callback') && !url.includes('auth.wihy.ai/auth/callback')) {
      console.log('Not an auth callback, ignoring');
      return;
    }

    // Mark as handled
    handledUrls.current.add(url);

    try {
      // Extract parameters from URL
      const queryString = url.split('?')[1];
      if (!queryString) {
        console.log('No query parameters in deep link');
        return;
      }

      const params = new URLSearchParams(queryString);
      const deepLinkParams: DeepLinkParams = {
        session_token: params.get('session_token') || undefined,
        provider: params.get('provider') || undefined,
        state: params.get('state') || undefined,
        error: params.get('error') || undefined,
        error_description: params.get('error_description') || undefined,
      };

      console.log('Deep link params:', deepLinkParams);

      // Handle error response
      if (deepLinkParams.error) {
        const errorMsg = deepLinkParams.error_description || deepLinkParams.error;
        console.error('OAuth error:', errorMsg);
        onError?.(errorMsg);
        return;
      }

      // Handle success response with session_token
      if (deepLinkParams.session_token) {
        console.log('Session token received via deep link');
        console.log('Provider:', deepLinkParams.provider);

        // Store the session token
        await authService.storeSessionToken(deepLinkParams.session_token);

        // Verify the session
        const session = await authService.verifySession();
        if (session.valid && session.user) {
          console.log('Session verified, user logged in:', session.user.email);
        }

        // Notify callback
        onAuthCallback?.(deepLinkParams);
      } else {
        console.log('No session_token in deep link');
      }
    } catch (error) {
      console.error('Error handling deep link:', error);
      onError?.(error instanceof Error ? error.message : 'Failed to handle deep link');
    }
  }, [onAuthCallback, onError]);

  useEffect(() => {
    console.log('Setting up deep link listener');

    // Handle deep link when app is already open
    const subscription = Linking.addEventListener('url', (event) => {
      handleDeepLink(event.url);
    });

    // Check if app was opened via deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        console.log('App opened with deep link:', url);
        handleDeepLink(url);
      }
    });

    return () => {
      subscription?.remove();
    };
  }, [handleDeepLink]);

  return {
    handleDeepLink,
  };
}

/**
 * Parse deep link URL parameters
 */
export function parseDeepLinkParams(url: string): DeepLinkParams {
  const queryString = url.split('?')[1];
  if (!queryString) {
    return {};
  }

  const params = new URLSearchParams(queryString);
  return {
    session_token: params.get('session_token') || undefined,
    provider: params.get('provider') || undefined,
    state: params.get('state') || undefined,
    error: params.get('error') || undefined,
    error_description: params.get('error_description') || undefined,
  };
}

/**
 * Test deep link (for development)
 */
export async function testDeepLink(provider: 'google' | 'facebook' | 'microsoft' = 'google') {
  const testUrl = `wihy://auth/callback?session_token=test_token_${Date.now()}&provider=${provider}&state=test_state`;
  console.log('Testing deep link:', testUrl);
  await Linking.openURL(testUrl);
}
