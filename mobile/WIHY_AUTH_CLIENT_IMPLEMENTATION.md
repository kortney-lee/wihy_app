# WIHY Authentication Service - Client Implementation Guide

## 🚀 **Quick Start for Developers**

This guide provides step-by-step instructions for implementing WIHY Authentication in your applications.

### **Before You Start**
- ✅ Get your client credentials from [`.env.local`](.env.local)
- ✅ Choose your implementation type: Web App, Mobile App, or Backend Service
- ✅ Verify service is running: `https://auth.wihy.ai/api/health`

### **🏗️ WIHY Authentication Architecture**

**Clients (2):**
- **Mobile App** (`wihy_native_2025`) - React Native/iOS/Android
- **Web App** (`wihy_frontend_2025`) - React/Next.js/Browser

**Services (2):**
- **WIHY Services** (`wihy_services_2025`) - Main backend API
- **ML Service** (`wihy_ml_2025`) - Machine learning platform

**Authentication Flow:**
```
Mobile/Web → Auth Service → Session Token
     ↓
Mobile/Web → WIHY Services → Validates token with Auth Service
     ↓
Mobile/Web → ML Service → Validates token with Auth Service
```

### **🔑 Key Principle: Clients Only Need Their Own Credentials**

**Important:** Your client applications only need to know:
- **Their own `client_id`** (e.g., `wihy_frontend_2025`, `wihy_native_2025`)
- **Their own `client_secret`** (for confidential clients only)

**Backend services validate client tokens by checking with auth service:**
- Services receive tokens from mobile/web clients
- Services validate tokens using `/api/oauth/userinfo` or `/api/auth/verify`
- Services can also use service-to-service authentication for admin operations

**The auth service handles all OAuth provider configurations internally:**
- Google/Facebook/Microsoft client IDs and secrets
- OAuth provider endpoints and scopes
- Token exchange and session management

**Correct OAuth Flow:**
1. Client → Auth Service (`/api/auth/google/authorize?client_id=wihy_native_2025`)
2. Auth Service → Google/Facebook/Microsoft (using auth service's provider credentials)
3. Provider → Auth Service (with provider's authorization code)
4. Auth Service → Client (with `session_token` via redirect)
5. Client → Backend Service (with `session_token` in Authorization header)
6. Backend Service → Auth Service (validates token via `/api/oauth/userinfo`)

**Your clients never directly communicate with OAuth providers!**

---

## 📱 **Implementation by Client Type**

### **1. Web Application (Frontend)**

#### **React/Next.js Implementation**

**Install Dependencies:**
```bash
npm install axios
# No additional dependencies needed for basic implementation
```

**Create Auth Service (`auth.js`):**
```javascript
import axios from 'axios';

const AUTH_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://auth.wihy.ai' 
  : 'http://localhost:5000';

class AuthService {
  constructor() {
    // Only your client credentials needed
    this.clientId = 'wihy_frontend_2025';
    this.redirectUri = `${window.location.origin}/auth/callback`;
  }

  // Start OAuth2 flow
  initiateLogin() {
    const state = this.generateRandomState();
    localStorage.setItem('auth_state', state);
    
    const authUrl = `${AUTH_BASE_URL}/api/oauth/authorize?` +
      `response_type=code&` +
      `client_id=${this.clientId}&` +
      `redirect_uri=${encodeURIComponent(this.redirectUri)}&` +
      `scope=profile%20email&` +
      `state=${state}`;
    
    window.location.href = authUrl;
  }

  // Start Google OAuth - Auth service handles Google configuration
  loginWithGoogle() {
    const state = this.generateRandomState();
    localStorage.setItem('auth_state', state);
    
    // Simple redirect - auth service handles all Google OAuth configuration
    const authUrl = `${AUTH_BASE_URL}/api/auth/google/authorize?` +
      `client_id=${this.clientId}&` +
      `redirect_uri=${encodeURIComponent(this.redirectUri)}&` +
      `state=${state}`;
    
    window.location.href = authUrl;
  }

  // Start Facebook OAuth
  loginWithFacebook() {
    const state = this.generateRandomState();
    localStorage.setItem('auth_state', state);
    
    const authUrl = `${AUTH_BASE_URL}/api/auth/facebook/authorize?` +
      `client_id=${this.clientId}&` +
      `redirect_uri=${encodeURIComponent(this.redirectUri)}&` +
      `state=${state}`;
    
    window.location.href = authUrl;
  }

  // Start Microsoft OAuth
  loginWithMicrosoft() {
    const state = this.generateRandomState();
    localStorage.setItem('auth_state', state);
    
    const authUrl = `${AUTH_BASE_URL}/api/auth/microsoft/authorize?` +
      `client_id=${this.clientId}&` +
      `redirect_uri=${encodeURIComponent(this.redirectUri)}&` +
      `state=${state}`;
    
    window.location.href = authUrl;
  }

  // Handle OAuth callback
  async handleCallback() {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    const sessionToken = urlParams.get('session_token');
    const provider = urlParams.get('provider');
    
    // Check state parameter
    const storedState = localStorage.getItem('auth_state');
    if (state !== storedState) {
      throw new Error('Invalid state parameter');
    }
    localStorage.removeItem('auth_state');

    if (sessionToken) {
      // Direct session token (from OAuth providers)
      this.setToken(sessionToken);
      return { success: true, provider };
    }

    if (code) {
      // Exchange code for token (OAuth2 flow)
      return await this.exchangeCodeForToken(code);
    }

    throw new Error('No authorization code or session token received');
  }

  // Exchange authorization code for access token
  async exchangeCodeForToken(code) {
    try {
      const response = await axios.post(`${AUTH_BASE_URL}/api/oauth/token`, 
        new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: this.clientId,
          client_secret: process.env.REACT_APP_CLIENT_SECRET, // Only for confidential clients
          code: code,
          redirect_uri: this.redirectUri
        }), {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      const { access_token, refresh_token } = response.data;
      this.setToken(access_token, refresh_token);
      
      return { success: true, provider: 'oauth2' };
    } catch (error) {
      console.error('Token exchange failed:', error);
      throw error;
    }
  }

  // Local login with email/password
  async loginLocal(email, password) {
    try {
      const response = await axios.post(`${AUTH_BASE_URL}/api/auth/local/login`, {
        email,
        password
      });

      if (response.data.success) {
        this.setToken(response.data.session_token);
        return response.data;
      } else {
        throw new Error(response.data.error || 'Login failed');
      }
    } catch (error) {
      console.error('Local login failed:', error);
      throw error;
    }
  }

  // Register new user
  async register(email, password, name) {
    try {
      const response = await axios.post(`${AUTH_BASE_URL}/api/auth/local/register`, {
        email,
        password,
        name
      });

      if (response.data.success) {
        this.setToken(response.data.session_token);
        return response.data;
      } else {
        throw new Error(response.data.error || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  }

  // Get current user info
  async getCurrentUser() {
    const token = this.getToken();
    if (!token) return null;

    try {
      const response = await axios.get(`${AUTH_BASE_URL}/api/auth/verify`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      return response.data.valid ? response.data.user : null;
    } catch (error) {
      console.error('User verification failed:', error);
      this.logout(); // Clear invalid token
      return null;
    }
  }

  // Logout user
  async logout() {
    const token = this.getToken();
    
    if (token) {
      try {
        await axios.post(`${AUTH_BASE_URL}/api/auth/logout`, {}, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      } catch (error) {
        console.warn('Logout request failed:', error);
      }
    }
    
    this.clearTokens();
  }

  // Token management
  setToken(accessToken, refreshToken = null) {
    localStorage.setItem('access_token', accessToken);
    if (refreshToken) {
      localStorage.setItem('refresh_token', refreshToken);
    }
  }

  getToken() {
    return localStorage.getItem('access_token');
  }

  clearTokens() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('auth_state');
  }

  generateRandomState() {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }
}

export default new AuthService();
```

**React Hook (`useAuth.js`):**
```javascript
import { useState, useEffect, useContext, createContext } from 'react';
import AuthService from './auth';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      const currentUser = await AuthService.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = {
    google: () => AuthService.loginWithGoogle(),
    facebook: () => AuthService.loginWithFacebook(),
    microsoft: () => AuthService.loginWithMicrosoft(),
    oauth2: () => AuthService.initiateLogin(),
    local: async (email, password) => {
      const result = await AuthService.loginLocal(email, password);
      setUser(result.user);
      return result;
    }
  };

  const register = async (email, password, name) => {
    const result = await AuthService.register(email, password, name);
    setUser(result.user);
    return result;
  };

  const logout = async () => {
    await AuthService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      register,
      logout,
      isAuthenticated: !!user
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

**Auth Callback Component (`AuthCallback.jsx`):**
```javascript
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import AuthService from '../services/auth';

const AuthCallback = () => {
  const navigate = useNavigate();
  const { checkAuthState } = useAuth();

  useEffect(() => {
    handleAuthCallback();
  }, []);

  const handleAuthCallback = async () => {
    try {
      await AuthService.handleCallback();
      await checkAuthState(); // Refresh user state
      navigate('/dashboard'); // Redirect to protected route
    } catch (error) {
      console.error('Auth callback failed:', error);
      navigate('/login?error=callback_failed');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h2>Completing authentication...</h2>
        <div className="spinner">Loading...</div>
      </div>
    </div>
  );
};

export default AuthCallback;
```

---

### **2. Mobile Application (React Native)**

#### **React Native Implementation**

**Install Dependencies:**
```bash
npm install @react-native-async-storage/async-storage
# No additional native dependencies needed - just deep linking
```

**Auth Service (`authService.js`):**
```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Linking } from 'react-native';

const AUTH_BASE_URL = __DEV__ 
  ? 'http://localhost:5000' 
  : 'https://auth.wihy.ai';

class MobileAuthService {
  constructor() {
    // Only client_id needed - auth service handles all OAuth provider configs
    this.clientId = 'wihy_native_2025';
    this.redirectUri = 'com.wihy.app://auth/callback';
  }

  // Initialize deep linking
  initializeDeepLinking(onAuthSuccess) {
    const handleURL = (event) => {
      this.handleDeepLink(event.url, onAuthSuccess);
    };

    const subscription = Linking.addEventListener('url', handleURL);
    
    // Check if app was opened via deep link
    Linking.getInitialURL().then(url => {
      if (url) handleURL({ url });
    });
    
    return subscription;
  }

  // Handle deep link from auth service
  async handleDeepLink(url, onAuthSuccess) {
    if (url && url.startsWith('com.wihy.app://auth/callback')) {
      try {
        const params = new URLSearchParams(url.split('?')[1]);
        const sessionToken = params.get('session_token');
        const provider = params.get('provider');
        const state = params.get('state');
        const error = params.get('error');
        
        // Validate state parameter
        const storedState = await AsyncStorage.getItem('auth_state');
        if (state !== storedState) {
          throw new Error('Invalid state parameter - possible CSRF attack');
        }
        await AsyncStorage.removeItem('auth_state');
        
        if (error) {
          throw new Error(decodeURIComponent(error));
        }
        
        if (sessionToken) {
          await this.setToken(sessionToken);
          onAuthSuccess({ provider, sessionToken });
        } else {
          throw new Error('No session token received from auth service');
        }
      } catch (error) {
        console.error('Deep link handling failed:', error);
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

  // Local login
  async loginLocal(email, password) {
    try {
      const response = await fetch(`${AUTH_BASE_URL}/api/auth/local/login`, {
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
      const response = await fetch(`${AUTH_BASE_URL}/api/auth/local/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password, name })
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
```

**React Native Hook (`useAuth.js`):**
```javascript
import { useState, useEffect, createContext, useContext } from 'react';
import MobileAuthService from '../services/authService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthState();
    
    // Initialize deep linking
    const subscription = MobileAuthService.initializeDeepLinking(handleAuthSuccess);
    
    return () => subscription?.remove();
  }, []);

  const checkAuthState = async () => {
    try {
      const currentUser = await MobileAuthService.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthSuccess = async (authData) => {
    await checkAuthState(); // Refresh user state
  };

  const login = {
    google: () => MobileAuthService.loginWithGoogle(),
    facebook: () => MobileAuthService.loginWithFacebook(),
    microsoft: () => MobileAuthService.loginWithMicrosoft(),
    oauth2: () => MobileAuthService.loginWithOAuth2(),
    local: async (email, password) => {
      const result = await MobileAuthService.loginLocal(email, password);
      setUser(result.user);
      return result;
    }
  };

  const register = async (email, password, name) => {
    const result = await MobileAuthService.register(email, password, name);
    setUser(result.user);
    return result;
  };

  const logout = async () => {
    await MobileAuthService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      register,
      logout,
      isAuthenticated: !!user
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

---

### **3. Backend Service (WIHY Services & ML Service)**

#### **Token Validation for Client Requests**

Backend services receive tokens from mobile/web clients and need to validate them with the auth service.

**Install Dependencies:**
```bash
npm install axios dotenv
```

**Service Client (`serviceAuth.js`):**
```javascript
const axios = require('axios');
require('dotenv').config();

class ServiceAuthClient {
  constructor() {
    this.baseURL = process.env.NODE_ENV === 'production' 
      ? 'https://auth.wihy.ai' 
      : 'http://localhost:5000';
    
    // For service-to-service calls (admin operations)
    this.clientId = 'wihy_services_2025'; // or 'wihy_ml_2025' for ML service
    this.clientSecret = process.env.WIHY_SERVICES_2025_CLIENT_SECRET; // or WIHY_ML_2025_CLIENT_SECRET
    this.accessToken = null;
    this.tokenExpiry = null;
  }

  // PRIMARY: Verify user token from mobile/web clients
  async verifyUserToken(userToken) {
    try {
      const response = await axios.get(`${this.baseURL}/api/oauth/userinfo`, {
        headers: {
          'Authorization': `Bearer ${userToken}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Token verification failed:', error);
      return null;
    }
  }

  // Alternative: Verify using session endpoint
  async verifySession(sessionToken) {
    try {
      const response = await axios.get(`${this.baseURL}/api/auth/verify`, {
        headers: {
          'Authorization': `Bearer ${sessionToken}`
        }
      });
      
      return response.data.valid ? response.data : null;
    } catch (error) {
      console.error('Session verification failed:', error);
      return null;
    }
  }

  // Get access token for service-to-service calls
  async getAccessToken() {
    if (this.accessToken && this.tokenExpiry > Date.now()) {
      return this.accessToken;
    }

    try {
      const response = await axios.post(`${this.baseURL}/api/oauth/token`, 
        new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: this.clientId,
          client_secret: this.clientSecret,
          scope: 'admin user_management'
        }), {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      this.accessToken = response.data.access_token;
      this.tokenExpiry = Date.now() + (response.data.expires_in * 1000);
      
      return this.accessToken;
    } catch (error) {
      console.error('Service token request failed:', error);
      throw error;
    }
  }

  // Make authenticated API call
  async makeAuthenticatedRequest(endpoint, options = {}) {
    const token = await this.getAccessToken();
    
    const config = {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    try {
      const response = await axios(endpoint, config);
      return response.data;
    } catch (error) {
      // Token might have expired, try once more with fresh token
      if (error.response?.status === 401) {
        this.accessToken = null; // Force token refresh
        const newToken = await this.getAccessToken();
        config.headers['Authorization'] = `Bearer ${newToken}`;
        
        const retryResponse = await axios(endpoint, config);
        return retryResponse.data;
      }
      throw error;
    }
  }
}

module.exports = new ServiceAuthClient();
```

**Express Middleware (`authMiddleware.js`):**
```javascript
const ServiceAuth = require('./serviceAuth');

// PRIMARY: Middleware to verify tokens from mobile/web clients
const authenticateUser = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    // Validate token with auth service
    const userInfo = await ServiceAuth.verifyUserToken(token);
    
    if (!userInfo) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }

    // Add user info to request
    req.user = userInfo;
    next();
  } catch (error) {
    console.error('Authentication middleware error:', error);
    res.status(500).json({ error: 'Authentication service unavailable' });
  }
};

// SECONDARY: Middleware for service-to-service authentication (admin operations)
const authenticateService = async (req, res, next) => {
  try {
    // This ensures we have a valid service token for admin operations
    await ServiceAuth.getAccessToken();
    req.serviceAuth = ServiceAuth;
    next();
  } catch (error) {
    console.error('Service authentication failed:', error);
    res.status(500).json({ error: 'Service authentication failed' });
  }
};

// Middleware for routes that need both user and service auth
const authenticateUserAndService = async (req, res, next) => {
  // First verify user token
  await authenticateUser(req, res, async () => {
    // Then ensure service auth is available
    await authenticateService(req, res, next);
  });
};

module.exports = {
  authenticateUser,           // For validating mobile/web client tokens
  authenticateService,        // For service-to-service admin operations
  authenticateUserAndService  // For operations requiring both
};
```

**Usage Example:**
```javascript
const express = require('express');
const { authenticateUser, authenticateService, authenticateUserAndService } = require('./middleware/authMiddleware');
const ServiceAuth = require('./services/serviceAuth');

const app = express();
app.use(express.json());

// PRIMARY USE CASE: Endpoints that validate mobile/web client tokens
app.get('/api/user/profile', authenticateUser, (req, res) => {
  res.json({
    message: 'User profile data',
    user: req.user  // User info from validated token
  });
});

app.get('/api/user/health-data', authenticateUser, (req, res) => {
  // ML Service or WIHY Services validating mobile/web client tokens
  res.json({
    user_id: req.user.id,
    health_data: 'User-specific health insights',
    provider: req.user.provider
  });
});

// SECONDARY: Service-to-service admin operations
app.get('/api/admin/users', authenticateService, async (req, res) => {
  try {
    // Make authenticated call to another service using service credentials
    const users = await req.serviceAuth.makeAuthenticatedRequest(
      'https://admin-api.wihy.ai/api/users', {
        method: 'GET'
      }
    );
    
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// COMBINED: User operation that requires service-level access
app.post('/api/user/ml-analysis', authenticateUserAndService, async (req, res) => {
  try {
    // Use both user context and service auth
    const analysis = await req.serviceAuth.makeAuthenticatedRequest(
      'https://ml-engine.wihy.ai/api/analyze', {
        method: 'POST',
        data: {
          user_id: req.user.id,
          user_data: req.body,
          requesting_service: 'wihy_services'
        }
      }
    );
    
    res.json({
      user: req.user.email,
      analysis: analysis
    });
  } catch (error) {
    res.status(500).json({ error: 'ML analysis failed' });
  }
});

app.listen(3000, () => {
  console.log('WIHY Services running on port 3000');
  console.log('Ready to validate mobile/web client tokens');
});
```

---

## ⚡ **Quick Implementation Checklist**

### **Mobile Client (`wihy_native_2025`):**
- [ ] Install dependencies: `@react-native-async-storage/async-storage`
- [ ] Configure deep linking in app manifest  
- [ ] Create `MobileAuthService` class
- [ ] Implement deep link handling
- [ ] Set up `AuthProvider` context
- [ ] Test OAuth redirect flows
- [ ] Configure platform-specific URL schemes

### **Web Client (`wihy_frontend_2025`):**
- [ ] Install dependencies: `axios`
- [ ] Create `AuthService` class
- [ ] Implement `useAuth` hook
- [ ] Create `AuthCallback` component
- [ ] Set up routing for `/auth/callback`
- [ ] Test OAuth and local login flows

### **WIHY Services Backend (`wihy_services_2025`):**
- [ ] Install dependencies: `axios`, `dotenv`
- [ ] Create `ServiceAuthClient` class with token validation
- [ ] Implement `authenticateUser` middleware for mobile/web tokens
- [ ] Implement `authenticateService` middleware for admin operations
- [ ] Configure environment variables
- [ ] Test token validation from mobile/web clients
- [ ] Test service-to-service authentication

### **ML Service Backend (`wihy_ml_2025`):**
- [ ] Install dependencies: `axios`, `dotenv`
- [ ] Create `ServiceAuthClient` class (same as WIHY Services)
- [ ] Implement `authenticateUser` middleware for mobile/web tokens
- [ ] Configure environment variables with ML service credentials
- [ ] Test token validation from mobile/web clients
- [ ] Test ML-specific endpoints with authenticated users

---

## 🔧 **Environment Configuration**

Create your `.env.local` file:
```bash
# Copy from .env.template
cp .env.template .env.local

# Edit with your actual credentials
# See CREDENTIALS_README.md for details
```

**Required Environment Variables by Service:**

**Mobile Client (`wihy_native_2025`):**
- No environment variables needed (public client)
- Uses only `client_id` in code

**Web Client (`wihy_frontend_2025`):**
- `WIHY_FRONTEND_2025_CLIENT_SECRET` (for confidential operations)

**WIHY Services Backend (`wihy_services_2025`):**
- `WIHY_SERVICES_2025_CLIENT_SECRET` (for service-to-service auth)

**ML Service Backend (`wihy_ml_2025`):**
- `WIHY_ML_2025_CLIENT_SECRET` (for service-to-service auth)

**Example `.env.local` for backend services:**
```bash
# WIHY Services
WIHY_SERVICES_2025_CLIENT_SECRET=your_services_secret_here

# ML Service  
WIHY_ML_2025_CLIENT_SECRET=your_ml_secret_here

# Auth service URL
AUTH_SERVICE_URL=https://auth.wihy.ai
NODE_ENV=production
```

---

## 🚨 **Common Implementation Issues**

### **❌ WRONG: Trying to Configure OAuth Providers on Client Side**
```javascript
// ❌ DON'T DO THIS - Client doesn't need OAuth provider credentials
const config = {
  google: {
    clientId: 'your-google-client-id',  // ❌ Wrong
    clientSecret: 'google-secret'       // ❌ Wrong
  },
  facebook: {
    appId: 'your-facebook-app-id'       // ❌ Wrong
  }
};
```

### **✅ CORRECT: Only Use Your Own Client Credentials**
```javascript
// ✅ Correct - Only your client credentials
class AuthService {
  constructor() {
    this.clientId = 'wihy_frontend_2025';  // ✅ Your client ID only
    // Auth service handles all OAuth provider configurations
  }
}
```

### **CORS Errors**
```javascript
// Solution: Configure CORS_ORIGIN in auth service
CORS_ORIGIN=https://yourapp.com,http://localhost:3000
```

### **Redirect URI Mismatch**
```javascript
// Ensure exact match with registered URIs
const redirectUri = 'https://yourapp.com/auth/callback'; // No trailing slash
```

### **State Parameter Validation**
```javascript
// Always validate state parameter to prevent CSRF
const storedState = localStorage.getItem('auth_state');
if (state !== storedState) {
  throw new Error('Invalid state parameter');
}
```

### **Token Storage Security**
```javascript
// Web: Use httpOnly cookies for production
// Mobile: Use secure storage (Keychain/Keystore)
// Never store tokens in plain localStorage in production
```

---

## 📞 **Testing Your Implementation**

### **Test Endpoints:**
```bash
# Health check
curl https://auth.wihy.ai/api/health

# Test service authentication
curl -X POST https://auth.wihy.ai/api/oauth/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials&client_id=wihy_services_2025&client_secret=YOUR_SECRET&scope=admin"
```

### **Debug Mode:**
```bash
# Enable debug logging
NODE_ENV=development
```

---

**Need Help?** Check the [API Documentation](API_DOCUMENTATION.md) for detailed endpoint information or [CREDENTIALS_README.md](CREDENTIALS_README.md) for credential setup.
