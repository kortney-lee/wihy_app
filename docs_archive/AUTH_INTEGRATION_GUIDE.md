# WIHY Authentication Integration Guide

## Overview
This guide explains how to use the WIHY Authentication Service in the React Native mobile app.

## Implementation Status

✅ **Completed:**
- Authentication service (`authService.ts`)
- Local authentication (email/password login and registration)
- OAuth2 URL generation (Google, Facebook, Microsoft)
- Session management with AsyncStorage
- Token storage and refresh
- AuthContext integration
- Comprehensive API logging

⏳ **Pending:**
- OAuth flow implementation with WebView/browser
- Biometric authentication
- Deep linking for OAuth callbacks

## Quick Start

### 1. Basic Usage

```typescript
import { authService } from '../services/authService';

// Check service health
const health = await authService.checkHealth();
console.log('Auth service status:', health.status);

// Local login
const result = await authService.loginLocal('user@example.com', 'password123');
if (result.success) {
  console.log('Logged in as:', result.user.email);
}

// Local registration
const registerResult = await authService.registerLocal(
  'newuser@example.com',
  'securePassword123',
  'John Doe'
);

// Verify session
const session = await authService.verifySession();
if (session.valid) {
  console.log('Session is valid for:', session.user.email);
}

// Logout
await authService.logout();
```

### 2. Using with AuthContext

The AuthContext automatically uses the authentication service:

```typescript
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

function MyComponent() {
  const { user, signIn, signOut, loading } = useContext(AuthContext);

  const handleLogin = async () => {
    try {
      // For email login
      await signIn('email', {
        email: 'user@example.com',
        password: 'password123'
      });

      // For registration
      await signIn('email', {
        email: 'newuser@example.com',
        password: 'password123',
        name: 'John Doe',
        isRegister: true
      });

      // For OAuth providers (Google, Microsoft, Facebook)
      await signIn('google');
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <View>
      {user ? (
        <Text>Welcome, {user.name}!</Text>
      ) : (
        <Button title="Login" onPress={handleLogin} />
      )}
    </View>
  );
}
```

## Service Configuration

### Base URLs
```typescript
// Production
baseUrl: 'https://auth.wihy.ai'

// Development
baseUrl: 'http://localhost:5000'
```

### Client Configuration
```typescript
const AUTH_CONFIG = {
  baseUrl: 'https://auth.wihy.ai',
  clientId: 'wihy_native_2025',
  redirectUri: 'com.wihy.app://auth/callback',
  scopes: ['profile', 'email', 'health_data', 'offline_access'],
};
```

## API Methods

### Authentication

#### `loginLocal(email, password)`
Login with email and password.

```typescript
const result = await authService.loginLocal(
  'user@example.com',
  'password123'
);

if (result.success) {
  // Session token is automatically stored
  console.log('User:', result.user);
}
```

#### `registerLocal(email, password, name)`
Register a new user account.

```typescript
const result = await authService.registerLocal(
  'newuser@example.com',
  'securePassword123',
  'John Doe'
);
```

#### `getOAuthUrl(provider, state?)`
Get OAuth authorization URL for provider.

```typescript
// For Google
const googleUrl = authService.getOAuthUrl('google');

// For Facebook
const facebookUrl = authService.getOAuthUrl('facebook');

// For Microsoft
const microsoftUrl = authService.getOAuthUrl('microsoft');
```

### OAuth2 Flow

#### `getAuthorizationUrl(state?)`
Get OAuth2 authorization code flow URL.

```typescript
const authUrl = authService.getAuthorizationUrl();
// Open this URL in browser/WebView
```

#### `exchangeCodeForToken(code, clientSecret?)`
Exchange authorization code for access token.

```typescript
// After OAuth callback with code
const tokens = await authService.exchangeCodeForToken(code);
if (tokens) {
  // Tokens are automatically stored
  console.log('Access token expires in:', tokens.expires_in);
}
```

#### `refreshAccessToken()`
Refresh expired access token using refresh token.

```typescript
const newTokens = await authService.refreshAccessToken();
if (newTokens) {
  console.log('Token refreshed successfully');
}
```

### Session Management

#### `verifySession()`
Verify current session is valid.

```typescript
const session = await authService.verifySession();
if (session.valid) {
  console.log('Session valid for:', session.user);
} else {
  // Redirect to login
}
```

#### `getUserInfo()`
Get user information using access token.

```typescript
const user = await authService.getUserInfo();
if (user) {
  console.log('User email:', user.email);
}
```

#### `logout()`
Logout and clear all stored data.

```typescript
await authService.logout();
// User is now logged out
```

### Utility Methods

#### `getAuthHeaders()`
Get authenticated request headers for API calls.

```typescript
const headers = await authService.getAuthHeaders();

fetch('https://api.wihy.ai/protected', {
  headers: headers
});
```

#### `checkHealth()`
Check authentication service health.

```typescript
const health = await authService.checkHealth();
console.log('Service status:', health.status);
console.log('Available providers:', health.providers);
```

#### `getProviders()`
Get available authentication providers.

```typescript
const providers = await authService.getProviders();
// Returns: ['local', 'google', 'facebook', 'microsoft']
```

## Storage

The service uses AsyncStorage for secure token storage:

- `@wihy_session_token` - Session token from local auth
- `@wihy_access_token` - OAuth2 access token
- `@wihy_refresh_token` - OAuth2 refresh token
- `@wihy_user_data` - User profile data
- `@wihy_token_expiry` - Token expiration timestamp

### Direct Storage Access

```typescript
// Get tokens
const sessionToken = await authService.getSessionToken();
const accessToken = await authService.getAccessToken();
const refreshToken = await authService.getRefreshToken();

// Get user data
const userData = await authService.getUserData();

// Check token expiration
const isExpired = await authService.isTokenExpired();
```

## Error Handling

All authentication methods include comprehensive error handling:

```typescript
try {
  const result = await authService.loginLocal(email, password);
  
  if (!result.success) {
    console.error('Login failed:', result.error);
    // Show error to user
  }
} catch (error) {
  console.error('Network error:', error.message);
  // Handle network error
}
```

## Console Logging

All API calls are logged to console with detailed information:

```
=== LOCAL LOGIN API CALL ===
Endpoint: https://auth.wihy.ai/api/auth/local/login
Email: user@example.com
Response Status: 200 (543ms)
Response Data: {
  "success": true,
  "user": {...},
  "session_token": "..."
}
=== LOCAL LOGIN SUCCESS ===
```

## OAuth Flow Implementation

The OAuth flow for mobile apps uses a simplified redirect pattern where the auth service handles the OAuth provider exchange:

1. **Open Auth URL in Browser**
   ```typescript
   import * as WebBrowser from 'expo-web-browser';
   
   const authUrl = authService.getOAuthUrl('google');
   // Opens: https://auth.wihy.ai/api/auth/google/authorize?client_id=...&redirect_uri=wihy://auth/callback
   
   const result = await WebBrowser.openAuthSessionAsync(
     authUrl,
     'wihy://auth/callback'
   );
   ```

2. **Auth Service Handles OAuth**
   - User authenticates with provider
   - Auth service exchanges code for tokens (server-side, secure)
   - Redirects back to app with session_token

3. **Handle Deep Link Callback**
   ```typescript
   // Redirect: wihy://auth/callback?session_token=abc123&provider=google&state=xyz
   
   if (result.type === 'success') {
     const params = new URLSearchParams(result.url.split('?')[1]);
     const sessionToken = params.get('session_token');
     
     await authService.storeSessionToken(sessionToken);
     const session = await authService.verifySession();
   }
   ```

**Benefits:**
- No client secret needed in app
- Auth service handles OAuth securely
- Simple session token management
- Works with expo-web-browser

## Best Practices

1. **Always verify session on app start**
   ```typescript
   useEffect(() => {
     const verifyAuth = async () => {
       const session = await authService.verifySession();
       if (!session.valid) {
         // Redirect to login
       }
     };
     verifyAuth();
   }, []);
   ```

2. **Handle token expiration**
   ```typescript
   const makeAuthenticatedRequest = async () => {
     const isExpired = await authService.isTokenExpired();
     if (isExpired) {
       await authService.refreshAccessToken();
     }
     
     const headers = await authService.getAuthHeaders();
     // Make request with headers
   };
   ```

3. **Graceful error handling**
   ```typescript
   const handleLogin = async () => {
     try {
       const result = await authService.loginLocal(email, password);
       if (!result.success) {
         Alert.alert('Login Failed', result.error || 'Please try again');
       }
     } catch (error) {
       Alert.alert('Network Error', 'Please check your connection');
     }
   };
   ```

## Security Considerations

1. **Never store client secret in the app** - Use PKCE flow for mobile
2. **Always use HTTPS** in production
3. **Validate redirect URIs** - Ensure deep link security
4. **Implement biometric authentication** for better UX
5. **Clear sensitive data** on logout
6. **Use secure storage** for tokens (AsyncStorage is encrypted on iOS)

## Testing

### Development Mode
```typescript
// Use dev authentication for testing
await signIn('dev', {
  email: 'dev@wihy.app',
  name: 'Dev User'
});
```

### Health Check
```typescript
const health = await authService.checkHealth();
console.log('Service healthy:', health.status === 'healthy');
console.log('Registered clients:', health.oauth2_server.client_ids);
```

## Next Steps

1. ✅ Install AsyncStorage package
2. ✅ Create authentication service
3. ✅ Integrate with AuthContext
4. ✅ Add console logging
5. ⏳ Implement OAuth flow with WebView
6. ⏳ Add deep linking support
7. ⏳ Implement biometric authentication
8. ⏳ Add token refresh automation

## Support

For issues or questions:
- Check service health: `GET https://auth.wihy.ai/api/health`
- View available endpoints in server logs
- Test with dev authentication mode
- Review console logs for detailed API information

---

**Last Updated:** December 30, 2025  
**Service Version:** 2.0.0  
**Base URL:** https://auth.wihy.ai
