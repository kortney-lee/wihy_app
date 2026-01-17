/**
 * Enhanced Authentication Features
 * - Biometric authentication
 * - Token refresh automation
 * - OAuth WebView flow helpers
 */

import * as LocalAuthentication from 'expo-local-authentication';
import * as WebBrowser from 'expo-web-browser';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from './authService';

// Biometric settings storage
const BIOMETRIC_ENABLED_KEY = '@wihy_biometric_enabled';
const AUTO_REFRESH_KEY = '@wihy_auto_refresh_enabled';

// Token refresh interval (check every 5 minutes)
const REFRESH_CHECK_INTERVAL = 5 * 60 * 1000;

export interface BiometricCapability {
  available: boolean;
  enrolled: boolean;
  types: string[];
  supportsFaceID: boolean;
  supportsTouchID: boolean;
  supportsFingerprint: boolean;
}

export interface AuthEnhancements {
  biometricEnabled: boolean;
  autoRefreshEnabled: boolean;
}

class EnhancedAuthService {
  private refreshInterval: NodeJS.Timeout | null = null;

  /**
   * Check biometric capabilities
   */
  async checkBiometricCapability(): Promise<BiometricCapability> {
    console.log('=== CHECKING BIOMETRIC CAPABILITY ===');
    
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
      
      const types: string[] = [];
      let supportsFaceID = false;
      let supportsTouchID = false;
      let supportsFingerprint = false;
      
      supportedTypes.forEach(type => {
        switch (type) {
          case LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION:
            types.push('Face ID');
            supportsFaceID = true;
            break;
          case LocalAuthentication.AuthenticationType.FINGERPRINT:
            types.push('Touch ID / Fingerprint');
            supportsTouchID = true;
            supportsFingerprint = true;
            break;
          case LocalAuthentication.AuthenticationType.IRIS:
            types.push('Iris');
            break;
        }
      });
      
      const capability = {
        available: hasHardware && isEnrolled,
        enrolled: isEnrolled,
        types,
        supportsFaceID,
        supportsTouchID,
        supportsFingerprint,
      };
      
      console.log('Biometric capability:', capability);
      return capability;
    } catch (error) {
      console.error('Error checking biometric capability:', error);
      return {
        available: false,
        enrolled: false,
        types: [],
        supportsFaceID: false,
        supportsTouchID: false,
        supportsFingerprint: false,
      };
    }
  }

  /**
   * Authenticate using biometrics
   */
  async authenticateWithBiometrics(reason?: string): Promise<boolean> {
    console.log('=== BIOMETRIC AUTHENTICATION ===');
    
    try {
      const capability = await this.checkBiometricCapability();
      
      if (!capability.available) {
        console.log('Biometric authentication not available');
        return false;
      }
      
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: reason || 'Authenticate to access WIHY',
        fallbackLabel: 'Use passcode',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });
      
      console.log('Biometric auth result:', result.success);
      return result.success;
    } catch (error) {
      console.error('Biometric authentication error:', error);
      return false;
    }
  }

  /**
   * Enable biometric login
   */
  async enableBiometricLogin(): Promise<boolean> {
    console.log('=== ENABLING BIOMETRIC LOGIN ===');
    
    // First check if biometrics are available
    const capability = await this.checkBiometricCapability();
    
    if (!capability.available) {
      console.log('Cannot enable - biometrics not available');
      return false;
    }
    
    // Test authentication
    const success = await this.authenticateWithBiometrics(
      'Enable biometric login for WIHY'
    );
    
    if (success) {
      await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, 'true');
      console.log('Biometric login enabled');
      return true;
    }
    
    console.log('Biometric login not enabled');
    return false;
  }

  /**
   * Disable biometric login
   */
  async disableBiometricLogin(): Promise<void> {
    await AsyncStorage.removeItem(BIOMETRIC_ENABLED_KEY);
    console.log('Biometric login disabled');
  }

  /**
   * Check if biometric login is enabled
   */
  async isBiometricLoginEnabled(): Promise<boolean> {
    const enabled = await AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY);
    return enabled === 'true';
  }

  /**
   * Login with biometric authentication
   */
  async loginWithBiometrics(): Promise<boolean> {
    console.log('=== BIOMETRIC LOGIN ===');
    
    const isEnabled = await this.isBiometricLoginEnabled();
    
    if (!isEnabled) {
      console.log('Biometric login not enabled');
      return false;
    }
    
    // Authenticate with biometrics
    const authenticated = await this.authenticateWithBiometrics(
      'Login to WIHY'
    );
    
    if (!authenticated) {
      return false;
    }
    
    // Verify existing session
    const session = await authService.verifySession();
    
    if (session.valid) {
      console.log('Biometric login successful - session valid');
      return true;
    }
    
    // Try to refresh token
    const refreshed = await authService.refreshAccessToken();
    
    if (refreshed) {
      console.log('Biometric login successful - token refreshed');
      return true;
    }
    
    console.log('Biometric login failed - session invalid');
    return false;
  }

  /**
   * OAuth WebView flow for Google/Facebook/Microsoft
   * Auth service handles provider OAuth and returns session_token directly
   * On web, uses redirect-based OAuth flow
   */
  async authenticateWithOAuth(
    provider: 'google' | 'facebook' | 'microsoft'
  ): Promise<{ success: boolean; user?: any; error?: string; sessionToken?: string }> {
    console.log(`=== OAUTH ${provider.toUpperCase()} WEBVIEW FLOW ===`);
    
    try {
      // On web, use redirect-based OAuth instead of popup
      if (typeof window !== 'undefined' && window.location) {
        console.log('Web detected - using redirect OAuth flow');
        const webAuthUrl = authService.getWebOAuthUrl(provider);
        console.log('Redirecting to:', webAuthUrl);
        window.location.href = webAuthUrl;
        // Return a pending state - the callback screen will handle completion
        return {
          success: false,
          error: 'Redirecting to OAuth provider...',
        };
      }
      
      // Get OAuth URL for native
      const authUrl = authService.getOAuthUrl(provider);
      console.log('Opening OAuth URL:', authUrl);
      console.log('Expected redirect: wihy://auth/callback?session_token=...');
      
      // Open browser for authentication
      const result = await WebBrowser.openAuthSessionAsync(
        authUrl,
        'wihy://auth/callback'
      );
      
      console.log('OAuth result type:', result.type);
      
      if (result.type === 'success' && result.url) {
        console.log('OAuth callback URL:', result.url);
        
        // Extract session_token from URL
        const sessionToken = this.extractSessionTokenFromUrl(result.url);
        const providerParam = this.extractParamFromUrl(result.url, 'provider');
        const state = this.extractParamFromUrl(result.url, 'state');
        
        if (!sessionToken) {
          console.error('No session_token in callback URL');
          return {
            success: false,
            error: 'No session token received',
          };
        }
        
        console.log('Session token received from auth service');
        console.log('Provider:', providerParam);
        
        // Store session token
        await authService.storeSessionToken(sessionToken);
        
        // Verify session and get user info
        const session = await authService.verifySession();
        
        if (!session.valid || !session.user) {
          return {
            success: false,
            error: 'Failed to verify session',
          };
        }
        
        console.log(`=== OAUTH ${provider.toUpperCase()} SUCCESS ===`);
        return {
          success: true,
          user: session.user,
          sessionToken,
        };
      } else if (result.type === 'cancel') {
        console.log('OAuth cancelled by user');
        return {
          success: false,
          error: 'Authentication cancelled',
        };
      } else {
        console.log('OAuth failed:', result.type);
        return {
          success: false,
          error: 'Authentication failed',
        };
      }
    } catch (error: any) {
      console.error(`=== OAUTH ${provider.toUpperCase()} ERROR ===`);
      console.error('Error:', error);
      
      return {
        success: false,
        error: error.message || 'OAuth authentication failed',
      };
    }
  }

  /**
   * Extract session_token from OAuth callback URL
   */
  private extractSessionTokenFromUrl(url: string): string | null {
    return this.extractParamFromUrl(url, 'session_token');
  }

  /**
   * Extract parameter from URL (handles both URL query params and custom schemes)
   */
  private extractParamFromUrl(url: string, param: string): string | null {
    try {
      // Handle custom scheme URLs like wihy://auth/callback?session_token=...
      if (url.includes('?')) {
        const queryString = url.split('?')[1];
        const params = new URLSearchParams(queryString);
        return params.get(param);
      }
      return null;
    } catch (error) {
      console.error('Error parsing URL:', error);
      return null;
    }
  }

  /**
   * Start automatic token refresh
   */
  async startAutoTokenRefresh(): Promise<void> {
    console.log('=== STARTING AUTO TOKEN REFRESH ===');
    
    // Stop any existing interval
    this.stopAutoTokenRefresh();
    
    // Enable auto refresh
    await AsyncStorage.setItem(AUTO_REFRESH_KEY, 'true');
    
    // Check and refresh immediately
    await this.checkAndRefreshToken();
    
    // Set up interval
    this.refreshInterval = setInterval(async () => {
      await this.checkAndRefreshToken();
    }, REFRESH_CHECK_INTERVAL);
    
    console.log('Auto token refresh started (checks every 5 minutes)');
  }

  /**
   * Stop automatic token refresh
   */
  async stopAutoTokenRefresh(): Promise<void> {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
    
    await AsyncStorage.removeItem(AUTO_REFRESH_KEY);
    console.log('Auto token refresh stopped');
  }

  /**
   * Check if auto refresh is enabled
   */
  async isAutoRefreshEnabled(): Promise<boolean> {
    const enabled = await AsyncStorage.getItem(AUTO_REFRESH_KEY);
    return enabled === 'true';
  }

  /**
   * Check token expiration and refresh if needed
   */
  async checkAndRefreshToken(): Promise<boolean> {
    const isExpired = await authService.isTokenExpired();
    
    if (!isExpired) {
      // Token still valid, check if it will expire soon (within 10 minutes)
      const expiryStr = await AsyncStorage.getItem('@wihy_token_expiry');
      if (expiryStr) {
        const expiry = parseInt(expiryStr);
        const now = Date.now();
        const timeUntilExpiry = expiry - now;
        const tenMinutes = 10 * 60 * 1000;
        
        if (timeUntilExpiry > tenMinutes) {
          // Token is fresh, no need to refresh
          console.log('Token is fresh, expires in:', Math.round(timeUntilExpiry / 60000), 'minutes');
          return false;
        }
      }
    }
    
    console.log('=== AUTO TOKEN REFRESH ===');
    console.log('Token expired or expiring soon, refreshing...');
    
    const newTokens = await authService.refreshAccessToken();
    
    if (newTokens) {
      console.log('Token refreshed successfully');
      return true;
    } else {
      console.log('Token refresh failed - user may need to re-authenticate');
      return false;
    }
  }

  /**
   * Get current enhancement settings
   */
  async getEnhancementSettings(): Promise<AuthEnhancements> {
    const [biometricEnabled, autoRefreshEnabled] = await Promise.all([
      this.isBiometricLoginEnabled(),
      this.isAutoRefreshEnabled(),
    ]);
    
    return {
      biometricEnabled,
      autoRefreshEnabled,
    };
  }

  /**
   * Initialize auto-refresh if enabled
   */
  async initializeAutoRefresh(): Promise<void> {
    const isEnabled = await this.isAutoRefreshEnabled();
    
    if (isEnabled) {
      await this.startAutoTokenRefresh();
    }
  }

  /**
   * Clean up on logout
   */
  async cleanup(): Promise<void> {
    await this.stopAutoTokenRefresh();
    await this.disableBiometricLogin();
  }
}

export const enhancedAuthService = new EnhancedAuthService();

// Auto-initialize on import
enhancedAuthService.initializeAutoRefresh().catch(error => {
  console.error('Failed to initialize auto-refresh:', error);
});
