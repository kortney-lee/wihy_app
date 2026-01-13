import AsyncStorage from '@react-native-async-storage/async-storage';
import { Linking } from 'react-native';

const AUTH_BASE_URL = __DEV__ 
  ? 'http://localhost:5000' 
  : 'https://auth.wihy.ai';

class MobileAuthService {
  constructor() {
    // Only client_id needed - auth service handles all OAuth provider configs
    this.clientId = 'wihy_native_2025';
    this.redirectUri = 'wihy://auth/callback';
  }

  // Initialize deep linking
  initializeDeepLinking(onAuthSuccess, onAuthError) {
    const handleURL = (event) => {
      this.handleDeepLink(event.url, onAuthSuccess, onAuthError);
    };

    const subscription = Linking.addEventListener('url', handleURL);
    
    // Check if app was opened via deep link
    Linking.getInitialURL().then(url => {
      if (url) handleURL({ url });
    });
    
    return subscription;
  }

  // Handle deep link from auth service
  async handleDeepLink(url, onAuthSuccess, onAuthError) {
    if (url && url.startsWith('wihy://auth/callback')) {
      try {
        const params = new URLSearchParams(url.split('?')[1]);
        const sessionToken = params.get('session_token');
        const provider = params.get('provider');
        const state = params.get('state');
        const error = params.get('error');
        
        // Validate state parameter
        const storedState = await AsyncStorage.getItem('auth_state');
        if (state !== storedState) {
          const err = new Error('Invalid state parameter - possible CSRF attack');
          if (onAuthError) onAuthError(err);
          throw err;
        }
        await AsyncStorage.removeItem('auth_state');
        
        if (error) {
          const err = new Error(decodeURIComponent(error));
          if (onAuthError) onAuthError(err);
          throw err;
        }
        
        if (sessionToken) {
          await this.setToken(sessionToken);
          if (onAuthSuccess) onAuthSuccess({ provider, sessionToken });
        } else {
          const err = new Error('No session token received from auth service');
          if (onAuthError) onAuthError(err);
          throw err;
        }
      } catch (error) {
        console.error('Deep link handling failed:', error);
        if (onAuthError) onAuthError(error);
        throw error;
      }
    }
  }

  // Start Google OAuth - Auth service handles all provider configuration
  async loginWithGoogle() {
    try {
      const state = this.generateRandomState();
      await AsyncStorage.setItem('auth_state', state);
      
      // Simple redirect to auth service - it handles Google OAuth configuration
      const authUrl = `${AUTH_BASE_URL}/api/auth/google/authorize?` +
        `client_id=${this.clientId}&` +
        `redirect_uri=${encodeURIComponent(this.redirectUri)}&` +
        `state=${state}`;
      
      await Linking.openURL(authUrl);
    } catch (error) {
      console.error('Google login failed:', error);
      throw error;
    }
  }

  // Start Facebook OAuth
  async loginWithFacebook() {
    try {
      const state = this.generateRandomState();
      await AsyncStorage.setItem('auth_state', state);
      
      const authUrl = `${AUTH_BASE_URL}/api/auth/facebook/authorize?` +
        `client_id=${this.clientId}&` +
        `redirect_uri=${encodeURIComponent(this.redirectUri)}&` +
        `state=${state}`;
      
      await Linking.openURL(authUrl);
    } catch (error) {
      console.error('Facebook login failed:', error);
      throw error;
    }
  }

  // Start Microsoft OAuth
  async loginWithMicrosoft() {
    try {
      const state = this.generateRandomState();
      await AsyncStorage.setItem('auth_state', state);
      
      const authUrl = `${AUTH_BASE_URL}/api/auth/microsoft/authorize?` +
        `client_id=${this.clientId}&` +
        `redirect_uri=${encodeURIComponent(this.redirectUri)}&` +
        `state=${state}`;
      
      await Linking.openURL(authUrl);
    } catch (error) {
      console.error('Microsoft login failed:', error);
      throw error;
    }
  }

  // Standard OAuth2 Authorization Code Flow (alternative to provider-specific OAuth)
  async loginWithOAuth2() {
    try {
      const state = this.generateRandomState();
      await AsyncStorage.setItem('auth_state', state);
      
      const authUrl = `${AUTH_BASE_URL}/api/oauth/authorize?` +
        `response_type=code&` +
        `client_id=${this.clientId}&` +
        `redirect_uri=${encodeURIComponent(this.redirectUri)}&` +
        `scope=profile%20email&` +
        `state=${state}`;
      
      await Linking.openURL(authUrl);
    } catch (error) {
      console.error('OAuth2 login failed:', error);
      throw error;
    }
  }

  // Login user
  async login(email, password) {
    try {
      const response = await fetch(`${AUTH_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();
      
      if (data.success) {
        await this.setToken(data.session_token);
        return data;
      } else {
        throw new Error(data.error || 'Login failed');
      }
    } catch (error) {
      console.error('Local login failed:', error);
      throw error;
    }
  }

  // Register new user
  async register(email, password, name) {
    try {
      const response = await fetch(`${AUTH_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password, name, terms_accepted: true })
      });

      const data = await response.json();
      
      if (data.success) {
        await this.setToken(data.session_token);
        return data;
      } else {
        throw new Error(data.error || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  }

  // Get current user
  async getCurrentUser() {
    const token = await this.getToken();
    if (!token) return null;

    try {
      const response = await fetch(`${AUTH_BASE_URL}/api/auth/verify`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      return data.valid ? data.user : null;
    } catch (error) {
      console.error('User verification failed:', error);
      await this.clearTokens();
      return null;
    }
  }

  // Check if session is still valid
  async isSessionValid() {
    const token = await this.getToken();
    if (!token) return false;
    
    try {
      const response = await fetch(`${AUTH_BASE_URL}/api/auth/verify`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      return data.valid === true;
    } catch (error) {
      console.error('Session validation failed:', error);
      return false;
    }
  }

  // Logout
  async logout() {
    try {
      const token = await this.getToken();
      
      if (token) {
        await fetch(`${AUTH_BASE_URL}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      }
    } catch (error) {
      console.warn('Logout request failed:', error);
    } finally {
      await this.clearTokens();
    }
  }

  // Token management - simplified for session tokens
  async setToken(sessionToken) {
    await AsyncStorage.setItem('session_token', sessionToken);
  }

  async getToken() {
    return await AsyncStorage.getItem('session_token');
  }

  async clearTokens() {
    await AsyncStorage.multiRemove(['session_token', 'auth_state']);
  }

  generateRandomState() {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }
}

export default new MobileAuthService();
