# WIHY Mobile Authentication Implementation

## Overview

This directory contains the complete authentication implementation for the WIHY mobile application (React Native). It includes OAuth2 support for Google, Facebook, and Microsoft, as well as local email/password authentication.

## Files Created

### Core Services

**`src/services/auth/authService.js`**
- Main authentication service class
- Handles OAuth flows (Google, Facebook, Microsoft)
- Handles local authentication (email/password)
- Manages session tokens
- Deep linking support for OAuth callbacks
- Token storage and retrieval

**`src/config/authConfig.ts`**
- Environment-specific configuration
- OAuth scopes
- Storage keys
- API endpoints
- Error messages
- Token refresh settings

### Hooks & Context

**`src/hooks/useAuth.ts`**
- AuthProvider: Wraps the app with authentication context
- useAuth: Hook to access authentication state and methods
- Automatic session restoration on app load
- Deep link initialization for OAuth callbacks

**`src/hooks/useApi.ts`**
- useApi: Hook for making authenticated API requests
- useFetch: Hook for fetching data with auto-authentication
- Automatic error handling and loading states
- Convenience methods: get, post, put, patch, delete

### Utilities

**`src/services/api.js`**
- makeAuthenticatedRequest: Base function for authenticated requests
- API helper functions (apiGet, apiPost, etc.)
- Automatic token injection
- Session expiration handling

### Screens

**`src/screens/AuthenticationScreen.tsx`**
- Complete authentication UI
- OAuth provider buttons (Google, Facebook, Microsoft)
- Local authentication form (login and register)
- Error handling and loading states

## Installation

### 1. Dependencies Already Installed

The implementation uses only native React and React Native APIs. No additional packages are required beyond what's already in the project.

### 2. Environment Configuration

Create or update `.env.local` with your configuration:

```bash
# .env.local
AUTH_SERVICE_URL=https://auth.wihy.ai
API_BASE_URL=https://api.wihy.ai
NODE_ENV=production
```

### 3. Deep Linking Setup

#### iOS Configuration

In `ios/WihyApp/Info.plist`, add:

```xml
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLName</key>
    <string>com.wihy.app</string>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>com.wihy.app</string>
    </array>
  </dict>
</array>
```

#### Android Configuration

In `android/app/src/main/AndroidManifest.xml`, update the MainActivity intent filter:

```xml
<activity
  android:name=".MainActivity"
  android:label="@string/app_name"
  android:configChanges="keyboard|keyboardHidden|orientation|screenSize"
  android:windowSoftInputMode="adjustResize"
  android:launchMode="singleTask"
>
  <intent-filter>
    <action android:name="android.intent.action.MAIN" />
    <category android:name="android.intent.category.LAUNCHER" />
  </intent-filter>
  <intent-filter>
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data
      android:scheme="com.wihy.app"
      android:host="auth"
      android:pathPrefix="/callback" />
  </intent-filter>
</activity>
```

## Usage

### Basic Setup in App

The app is already configured with AuthProvider in `src/App.tsx`:

```tsx
import { AuthProvider } from './hooks/useAuth';

const App = () => {
  return (
    <AuthProvider>
      {/* Your app content */}
    </AuthProvider>
  );
};
```

### Using Authentication in Components

```tsx
import { useAuth } from '../hooks/useAuth';
import { useApi } from '../hooks/useApi';

const MyComponent = () => {
  const { user, isAuthenticated, login, logout } = useAuth();
  const { get, loading, error } = useApi();

  // Google login
  const handleGoogleLogin = async () => {
    try {
      await login.google();
    } catch (err) {
      console.error('Login failed:', err);
    }
  };

  // Fetch user data
  const fetchUserData = async () => {
    try {
      const data = await get('/api/user/profile');
      console.log('User profile:', data);
    } catch (err) {
      console.error('Failed to fetch profile:', err);
    }
  };

  // Local login
  const handleLocalLogin = async () => {
    try {
      await login.local('user@example.com', 'password123');
    } catch (err) {
      console.error('Login failed:', err);
    }
  };

  return (
    <View>
      {isAuthenticated ? (
        <>
          <Text>Welcome, {user?.email}</Text>
          <Button title="Fetch Profile" onPress={fetchUserData} />
          <Button title="Logout" onPress={logout} />
        </>
      ) : (
        <>
          <Button title="Google Sign In" onPress={handleGoogleLogin} />
          <Button title="Email Sign In" onPress={handleLocalLogin} />
        </>
      )}
    </View>
  );
};
```

### Making Authenticated API Calls

```tsx
import { useApi } from '../hooks/useApi';

const UserProfile = () => {
  const { post, loading, error } = useApi();

  const updateProfile = async (name, email) => {
    try {
      const result = await post('/api/user/profile', {
        name,
        email
      });
      console.log('Profile updated:', result);
    } catch (err) {
      console.error('Update failed:', err);
    }
  };

  return (
    // Your UI
  );
};
```

### Using useFetch Hook

```tsx
import { useFetch } from '../hooks/useApi';

const HealthData = () => {
  const { data, loading, error, refetch } = useFetch('/api/health/today');

  if (loading) return <Text>Loading...</Text>;
  if (error) return <Text>Error: {error.message}</Text>;

  return (
    <View>
      <Text>Calories: {data?.calories}</Text>
      <Button title="Refresh" onPress={refetch} />
    </View>
  );
};
```

## Authentication Flow

### OAuth Flow (Google, Facebook, Microsoft)

1. User taps "Sign In with Google"
2. App redirects to auth service: `https://auth.wihy.ai/api/auth/google/authorize?client_id=wihy_native_2025&...`
3. Auth service redirects to Google with its own OAuth credentials
4. User authenticates with Google
5. Google redirects back to auth service with authorization code
6. Auth service exchanges code for session token
7. Auth service redirects to app: `com.wihy.app://auth/callback?session_token=...`
8. App receives deep link, stores session token, updates user state

### Local Authentication Flow

1. User enters email and password
2. App sends POST to `https://auth.wihy.ai/api/auth/local/login`
3. Auth service validates credentials
4. Auth service returns session token
5. App stores token and updates user state

### Authenticated API Requests

1. Component calls `useApi()` or `useFetch()`
2. Hook retrieves session token from storage
3. Hook includes `Authorization: Bearer <token>` header
4. Backend service receives request and validates token with auth service
5. Backend service returns user-specific data

## Error Handling

All authentication errors are captured and can be accessed via the `error` state:

```tsx
const { user, error, login } = useAuth();

if (error) {
  console.error('Auth error:', error);
}
```

Common errors:
- `INVALID_STATE`: CSRF attack detected
- `NO_SESSION_TOKEN`: Auth service didn't return a token
- `TOKEN_EXPIRED`: User needs to log in again
- `NETWORK_ERROR`: No internet connection
- `AUTH_SERVICE_UNAVAILABLE`: Auth service is down

## Security Considerations

1. **State Parameter Validation**: Prevents CSRF attacks
2. **Secure Token Storage**: Tokens stored in AsyncStorage (encrypted on device)
3. **HTTPS Only**: All auth service communication uses HTTPS
4. **No OAuth Provider Credentials**: App never sees Google/Facebook/Microsoft credentials
5. **Automatic Token Refresh**: Tokens refresh before expiration
6. **Session Validation**: App verifies token validity on launch

## Configuration

See `src/config/authConfig.ts` for:
- Environment-specific URLs
- OAuth scopes
- Storage keys
- API endpoints
- Error messages

To change environments, modify the `getEnvironment()` function in authConfig.ts.

## Testing

### Test OAuth Flow

1. Start auth service: `npm start` (in auth service directory)
2. Run app: `npm run android` or `npm run ios`
3. Tap "Sign In with Google"
4. Complete authentication
5. App should navigate to dashboard

### Test Local Login

1. Register account: Email, Password, Name
2. Login with registered credentials
3. Verify token is stored
4. Verify user data is accessible

### Test API Requests

1. Login first
2. Navigate to screen using `useApi()` or `useFetch()`
3. Verify requests include Authorization header
4. Verify responses contain user-specific data

## Troubleshooting

### Deep Link Not Working

**iOS**: Check CFBundleURLSchemes in Info.plist
**Android**: Check AndroidManifest.xml intent filter

### Token Not Being Stored

Check AsyncStorage permissions (usually automatic on newer React Native)

### Auth Service Connection Errors

Verify AUTH_BASE_URL in authConfig.ts matches actual service URL

### OAuth Redirect Loop

Ensure redirect_uri exactly matches registered URI in auth service

## API Reference

### useAuth Hook

```tsx
const {
  user,                    // Current user object or null
  isAuthenticated,         // Boolean
  loading,                 // Boolean
  error,                   // Error message or null
  login: {
    google: () => void,
    facebook: () => void,
    microsoft: () => void,
    oauth2: () => void,
    local: (email, password) => Promise
  },
  register: (email, password, name) => Promise,
  logout: () => Promise,
  clearError: () => void
} = useAuth();
```

### useApi Hook

```tsx
const {
  loading,                              // Boolean
  error,                                // Error or null
  execute: (fn: () => Promise) => Promise,
  get: (endpoint, options?) => Promise,
  post: (endpoint, body, options?) => Promise,
  put: (endpoint, body, options?) => Promise,
  patch: (endpoint, body, options?) => Promise,
  delete: (endpoint, options?) => Promise
} = useApi();
```

### useFetch Hook

```tsx
const {
  data,                    // Response data or null
  loading,                 // Boolean
  error,                   // Error or null
  refetch: () => Promise   // Manually refresh data
} = useFetch('/api/endpoint');
```

## Next Steps

1. ✅ Integrate AuthenticationScreen into navigation
2. ✅ Set up auth service backend (see `WIHY_AUTH_CLIENT_IMPLEMENTATION.md`)
3. ✅ Test OAuth flows
4. ✅ Configure deep linking on device
5. ✅ Test API authentication
6. ✅ Implement session refresh
7. ✅ Add biometric authentication (optional)

---

**For more details, see:**
- [WIHY_AUTH_CLIENT_IMPLEMENTATION.md](../WIHY_AUTH_CLIENT_IMPLEMENTATION.md) - Full implementation guide
- [src/services/auth/authService.js](./services/auth/authService.js) - Service code
- [src/config/authConfig.ts](./config/authConfig.ts) - Configuration
