/**
 * WIHY Apple Sign-In Service
 * 
 * Handles Apple Authentication for iOS and Web platforms.
 * Uses expo-apple-authentication for native iOS and web fallback for other platforms.
 */

import { Platform } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from './config';
import { fetchWithLogging } from '../utils/apiLogger';
import { UserData, LoginResponse } from './authService';

// ============= TYPES =============

export interface AppleCredential {
  user: string; // Apple's unique user identifier
  email: string | null;
  fullName: {
    givenName: string | null;
    familyName: string | null;
  } | null;
  identityToken: string;
  authorizationCode: string;
  realUserStatus: number;
}

export interface AppleAuthResult {
  success: boolean;
  user?: UserData;
  token?: string;
  error?: string;
}

// ============= CONSTANTS =============

const APPLE_USER_KEY = '@wihy_apple_user_id';
const API_BASE_URL = API_CONFIG.authUrl || 'https://auth.wihy.ai';

// ============= SERVICE =============

class AppleAuthService {
  /**
   * Check if Apple Sign-In is available on this device
   */
  async isAvailable(): Promise<boolean> {
    if (Platform.OS === 'ios') {
      return await AppleAuthentication.isAvailableAsync();
    }
    // Web can use Apple JS SDK but requires more setup
    // Android typically doesn't support Apple Sign-In
    return Platform.OS === 'web';
  }

  /**
   * Generate a random nonce for Apple Sign-In
   * Used for security to prevent replay attacks
   */
  async generateNonce(): Promise<string> {
    const nonce = await Crypto.getRandomBytesAsync(32);
    const nonceString = Array.from(nonce)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    return nonceString;
  }

  /**
   * Sign in with Apple (iOS)
   */
  async signInWithApple(): Promise<AppleAuthResult> {
    console.log('=== APPLE SIGN-IN START ===');
    console.log('Platform:', Platform.OS);

    if (Platform.OS !== 'ios') {
      // Web/Android fallback - redirect to backend OAuth
      return this.signInViaWeb();
    }

    try {
      // Check if Apple Sign-In is available
      const isAvailable = await this.isAvailable();
      if (!isAvailable) {
        return {
          success: false,
          error: 'Apple Sign-In is not available on this device',
        };
      }

      // Generate nonce for security
      const nonce = await this.generateNonce();

      // Request Apple Sign-In
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      console.log('=== APPLE CREDENTIAL RECEIVED ===');
      console.log('User ID:', credential.user);
      console.log('Email:', credential.email);
      console.log('Has identity token:', !!credential.identityToken);

      // Store Apple user ID for credential state checks
      await AsyncStorage.setItem(APPLE_USER_KEY, credential.user);

      // Send to backend for verification and user creation/login
      return this.authenticateWithBackend({
        user: credential.user,
        email: credential.email,
        fullName: credential.fullName,
        identityToken: credential.identityToken!,
        authorizationCode: credential.authorizationCode!,
        realUserStatus: credential.realUserStatus,
      });
    } catch (error: any) {
      console.error('=== APPLE SIGN-IN ERROR ===', error);

      if (error.code === 'ERR_REQUEST_CANCELED') {
        return {
          success: false,
          error: 'Sign-in was cancelled',
        };
      }

      return {
        success: false,
        error: error.message || 'Apple Sign-In failed',
      };
    }
  }

  /**
   * Sign in via web redirect (for web platform or fallback)
   */
  private async signInViaWeb(): Promise<AppleAuthResult> {
    console.log('=== APPLE SIGN-IN VIA WEB ===');

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      // Redirect to backend Apple OAuth endpoint
      window.location.href = `${API_BASE_URL}/api/auth/apple`;
      return { success: true }; // Will redirect
    }

    return {
      success: false,
      error: 'Apple Sign-In is not available on this platform',
    };
  }

  /**
   * Send Apple credentials to backend for verification
   */
  private async authenticateWithBackend(
    credential: AppleCredential
  ): Promise<AppleAuthResult> {
    console.log('=== SENDING APPLE CREDENTIAL TO BACKEND ===');

    try {
      const response = await fetchWithLogging(
        `${API_BASE_URL}/api/auth/apple/callback`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            identityToken: credential.identityToken,
            authorizationCode: credential.authorizationCode,
            user: credential.user,
            email: credential.email,
            fullName: credential.fullName,
          }),
        }
      );

      const data: LoginResponse = await response.json();

      console.log('=== BACKEND RESPONSE ===');
      console.log('Success:', data.success);

      if (response.ok && data.success) {
        return {
          success: true,
          user: data.user,
          token: data.token || data.session_token,
        };
      }

      return {
        success: false,
        error: data.error || 'Apple authentication failed',
      };
    } catch (error: any) {
      console.error('=== BACKEND ERROR ===', error);
      return {
        success: false,
        error: error.message || 'Network error during Apple authentication',
      };
    }
  }

  /**
   * Check if user has previously signed in with Apple
   * and if their credential is still valid
   */
  async getCredentialState(): Promise<{
    isValid: boolean;
    userId: string | null;
  }> {
    if (Platform.OS !== 'ios') {
      return { isValid: false, userId: null };
    }

    try {
      const userId = await AsyncStorage.getItem(APPLE_USER_KEY);
      if (!userId) {
        return { isValid: false, userId: null };
      }

      const credentialState = await AppleAuthentication.getCredentialStateAsync(userId);
      
      const isValid = credentialState === AppleAuthentication.AppleAuthenticationCredentialState.AUTHORIZED;
      
      console.log('=== APPLE CREDENTIAL STATE ===');
      console.log('User ID:', userId);
      console.log('State:', credentialState);
      console.log('Is Valid:', isValid);

      return { isValid, userId };
    } catch (error) {
      console.error('Failed to check Apple credential state:', error);
      return { isValid: false, userId: null };
    }
  }

  /**
   * Clear stored Apple user ID on sign out
   */
  async clearCredential(): Promise<void> {
    await AsyncStorage.removeItem(APPLE_USER_KEY);
  }

  /**
   * Handle Apple credential revocation
   * Should be called when receiving a credentialRevoked notification
   */
  async handleCredentialRevoked(): Promise<void> {
    console.log('=== APPLE CREDENTIAL REVOKED ===');
    await this.clearCredential();
    // The app should handle signing out the user
  }

  /**
   * Build the user's display name from Apple credential
   */
  buildDisplayName(fullName: AppleCredential['fullName']): string {
    if (!fullName) return 'Apple User';
    
    const parts = [fullName.givenName, fullName.familyName]
      .filter(Boolean);
    
    return parts.length > 0 ? parts.join(' ') : 'Apple User';
  }
}

// Export singleton instance
export const appleAuthService = new AppleAuthService();
export default appleAuthService;
