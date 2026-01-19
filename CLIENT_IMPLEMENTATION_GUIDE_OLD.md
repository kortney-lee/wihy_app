# Client Implementation Guide - Complete

## Overview

This guide shows how to integrate the WIHY authentication and profile services into your React/React Native application with complete examples and best practices.

---

## Quick Start

### 1. Installation

```bash
npm install @react-native-async-storage/async-storage
npm install expo-local-authentication expo-secure-store
```

**For Web (React):** The services already include web polyfills using `localStorage`.

**For React Native:** Replace the polyfills in each service file with actual imports.

---

### 2. Setup AuthProvider

Wrap your app with `AuthProvider`:

```tsx
// App.tsx
import { AuthProvider } from './src/context/AuthContext';

export default function App() {
  return (
    <AuthProvider 
      onAuthStateChange={(user) => {
        console.log('Auth state changed:', user?.id);
      }}
    >
      <YourApp />
    </AuthProvider>
  );
}
```

---

## Basic Usage Examples

### Email/Password Login

```tsx
import { useAuth } from './src/context/AuthContext';

function LoginScreen() {
  const { signIn, loading, error } = useAuth();

  const handleLogin = async () => {
    try {
      await signIn('local', {
        email: 'user@example.com',
        password: 'password123',
      });
      // User is now authenticated
      navigation.navigate('Home');
    } catch (err) {
      console.error('Login failed:', err);
    }
  };

  return (
    <View>
      {loading ? <ActivityIndicator /> : null}
      {error ? <Text>{error}</Text> : null}
      <Button title="Login" onPress={handleLogin} />
    </View>
  );
}
```

---

### Registration

```tsx
function RegisterScreen() {
  const { register, loading } = useAuth();

  const handleRegister = async () => {
    try {
      await register(
        'user@example.com',
        'password123',
        'John Doe'
      );
      navigation.navigate('Home');
    } catch (err) {
      console.error('Registration failed:', err);
    }
  };

  return <Button title="Sign Up" onPress={handleRegister} />;
}
```

---

### OAuth Login (Google, Facebook, etc.)

```tsx
import { WebView } from 'react-native-webview';

function OAuthScreen() {
  const { getOAuthUrl, handleOAuthCallback } = useAuth();
  const [authUrl, setAuthUrl] = useState('');

  const startOAuth = (provider: 'google' | 'facebook' | 'microsoft') => {
    const url = getOAuthUrl(provider);
    setAuthUrl(url);
  };

  const onNavigationStateChange = async (navState: any) => {
    // Check if it's the callback URL
    if (navState.url.startsWith('wihy://oauth/callback')) {
      try {
        await handleOAuthCallback('google', navState.url);
        navigation.navigate('Home');
      } catch (err) {
        console.error('OAuth failed:', err);
      }
    }
  };

  return (
    <View>
      <Button title="Login with Google" onPress={() => startOAuth('google')} />
      <Button title="Login with Facebook" onPress={() => startOAuth('facebook')} />
      
      {authUrl ? (
        <WebView 
          source={{ uri: authUrl }}
          onNavigationStateChange={onNavigationStateChange}
        />
      ) : null}
    </View>
  );
}
```

---

### Biometric Authentication

```tsx
function BiometricLoginScreen() {
  const { 
    signInWithBiometric, 
    isBiometricAvailable, 
    biometricType,
    enableBiometric,
  } = useAuth();

  const handleBiometricLogin = async () => {
    if (!isBiometricAvailable) {
      Alert.alert('Biometric not available');
      return;
    }

    try {
      await signInWithBiometric();
      navigation.navigate('Home');
    } catch (err) {
      console.error('Biometric login failed:', err);
    }
  };

  const handleEnableBiometric = async () => {
    const success = await enableBiometric();
    if (success) {
      Alert.alert('Biometric login enabled!');
    }
  };

  return (
    <View>
      {isBiometricAvailable && (
        <>
          <Text>Use {biometricType} to login</Text>
          <Button title="Login with Biometric" onPress={handleBiometricLogin} />
          <Button title="Enable Biometric" onPress={handleEnableBiometric} />
        </>
      )}
    </View>
  );
}
```

---

### Accessing User Data

```tsx
function ProfileScreen() {
  const { user, profile, settings, userId } = useAuth();

  if (!user) {
    return <Text>Not logged in</Text>;
  }

  return (
    <View>
      <Text>Name: {user.name}</Text>
      <Text>Email: {user.email}</Text>
      <Text>Plan: {user.plan}</Text>
      
      {/* Extended Profile */}
      {profile && (
        <>
          <Text>Phone: {profile.phone}</Text>
          <Text>Member Since: {profile.memberSince}</Text>
        </>
      )}

      {/* Settings */}
      {settings && (
        <Text>Theme: {settings.appPreferences.theme}</Text>
      )}
    </View>
  );
}
```

---

### Checking Capabilities

```tsx
function FeatureScreen() {
  const { capabilities, user } = useAuth();

  // Check if user has access to a feature
  const canAccessMeals = capabilities?.meals;
  const canAccessCoaching = capabilities?.coachPlatform;

  return (
    <View>
      {canAccessMeals ? (
        <Button title="View Meals" />
      ) : (
        <Text>Upgrade to access meals</Text>
      )}

      {canAccessCoaching ? (
        <Button title="Coach Dashboard" />
      ) : null}
    </View>
  );
}
```

---

### Updating Profile

```tsx
function EditProfileScreen() {
  const { updateProfile, profile } = useAuth();
  
  const handleSave = async () => {
    try {
      await updateProfile({
        phone: '+1234567890',
        dateOfBirth: '1990-01-01',
        gender: 'male',
        height: 180,
        weight: 75,
      });
      Alert.alert('Profile updated!');
    } catch (err) {
      console.error('Update failed:', err);
    }
  };

  return (
    <View>
      <TextInput placeholder="Phone" />
      <Button title="Save" onPress={handleSave} />
    </View>
  );
}
```

---

### Updating Settings

```tsx
function SettingsScreen() {
  const { settings, updateSettings } = useAuth();

  const handleThemeChange = async (theme: 'light' | 'dark' | 'system') => {
    await updateSettings({
      appPreferences: {
        ...settings?.appPreferences,
        theme,
      },
    });
  };

  const handleNotificationsToggle = async (enabled: boolean) => {
    await updateSettings({
      notifications: {
        ...settings?.notifications,
        pushEnabled: enabled,
      },
    });
  };

  return (
    <View>
      <Text>Theme</Text>
      <Button title="Light" onPress={() => handleThemeChange('light')} />
      <Button title="Dark" onPress={() => handleThemeChange('dark')} />
      
      <Switch
        value={settings?.notifications.pushEnabled}
        onValueChange={handleNotificationsToggle}
      />
    </View>
  );
}
```

---

### Logout

```tsx
function HomeScreen() {
  const { signOut } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut();
      navigation.navigate('Login');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  return (
    <Button title="Logout" onPress={handleLogout} />
  );
}
```

---

## Advanced Usage

### Protected Routes

```tsx
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
}

// Usage
<ProtectedRoute>
  <DashboardScreen />
</ProtectedRoute>
```

---

### Auto-Refresh User Data

```tsx
function Dashboard() {
  const { refreshUser, refreshProfile, refreshSettings } = useAuth();

  useEffect(() => {
    // Refresh data every 5 minutes
    const interval = setInterval(() => {
      refreshUser();
      refreshProfile();
      refreshSettings();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return <YourDashboard />;
}
```

---

### Using Profile Service Directly

```tsx
import { profileService } from './src/services/profileService';

function AdvancedSettings() {
  const { userId } = useAuth();

  const enable2FA = async () => {
    const result = await profileService.enable2FA(userId!, 'authenticator');
    console.log('2FA Secret:', result.secret);
    console.log('QR Code:', result.qrCode);
  };

  const exportData = async () => {
    const { downloadUrl } = await profileService.exportUserData(userId!);
    window.open(downloadUrl);
  };

  const deleteAccount = async () => {
    if (confirm('Are you sure?')) {
      await profileService.deleteAccount(userId!, 'DELETE');
      // User will be logged out
    }
  };

  return (
    <View>
      <Button title="Enable 2FA" onPress={enable2FA} />
      <Button title="Export My Data" onPress={exportData} />
      <Button title="Delete Account" onPress={deleteAccount} />
    </View>
  );
}
```

---

### Password Management

```tsx
import { authService } from './src/services/authService';

function PasswordScreen() {
  const handleForgotPassword = async (email: string) => {
    const result = await authService.forgotPassword(email);
    if (result.success) {
      Alert.alert('Check your email for reset link');
    }
  };

  const handleResetPassword = async (token: string, newPassword: string) => {
    const result = await authService.resetPassword(token, newPassword);
    if (result.success) {
      Alert.alert('Password reset successful');
      navigation.navigate('Login');
    }
  };

  const handleChangePassword = async () => {
    const result = await authService.changePassword(
      'currentPassword123',
      'newPassword456'
    );
    if (result.success) {
      Alert.alert('Password changed');
    }
  };

  return <View>...</View>;
}
```

---

### Feature Flags

```tsx
import { profileService } from './src/services/profileService';

function ExperimentalFeature() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    profileService.isFeatureEnabled('new_dashboard').then(setEnabled);
  }, []);

  if (!enabled) return null;

  return <NewDashboard />;
}

// Enable feature flag
await profileService.setFeatureFlag('new_dashboard', true);
```

---

### Deep Link Handling (OAuth Callback)

```tsx
import { enhancedAuthService } from './src/services/enhancedAuthService';
import { Linking } from 'react-native';

function App() {
  const { handleOAuthCallback } = useAuth();

  useEffect(() => {
    // Handle initial URL (app opened via deep link)
    Linking.getInitialURL().then((url) => {
      if (url) {
        enhancedAuthService.handleDeepLink(url);
      }
    });

    // Listen for deep links while app is running
    const subscription = Linking.addEventListener('url', ({ url }) => {
      enhancedAuthService.handleDeepLink(url);
    });

    return () => subscription.remove();
  }, []);

  return <Navigation />;
}
```

---

## API Endpoints

### Auth Service (`auth.wihy.ai` / GCP Cloud Run)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/auth/local/login` | POST | Email/password login |
| `/api/auth/local/register` | POST | Create account |
| `/api/auth/verify` | GET | Verify session |
| `/api/auth/refresh` | POST | Refresh access token |
| `/api/auth/logout` | POST | Logout |
| `/api/auth/forgot-password` | POST | Request password reset |
| `/api/auth/reset-password` | POST | Reset password with token |
| `/api/auth/change-password` | POST | Change password (authenticated) |
| `/api/auth/{provider}/authorize` | GET | OAuth authorization URL |
| `/api/auth/{provider}/callback` | POST | OAuth token exchange |

### Profile Service (`services.wihy.ai`)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/users/:userId/profile` | GET | Get extended profile |
| `/api/users/:userId/profile` | PUT | Update profile |
| `/api/users/:userId/avatar` | POST | Upload avatar |
| `/api/users/:userId/settings` | GET | Get all settings |
| `/api/users/:userId/settings` | PUT | Update settings |
| `/api/users/:userId/privacy` | GET | Get privacy settings |
| `/api/users/:userId/2fa/enable` | POST | Enable 2FA |
| `/api/users/:userId/2fa/verify` | POST | Verify 2FA code |
| `/api/users/:userId/2fa/disable` | POST | Disable 2FA |
| `/api/users/:userId/devices` | GET | Get trusted devices |
| `/api/users/:userId/devices/:id` | DELETE | Remove device |
| `/api/users/:userId/login-history` | GET | Get login history |
| `/api/users/:userId/export` | POST | Export user data (GDPR) |
| `/api/users/:userId` | DELETE | Delete account |

---

## Type Definitions

All types are exported from `src/types/user.ts`:

```tsx
import {
  AuthUser,
  ExtendedUserProfile,
  ProfileSettings,
  AppPreferences,
  NotificationSettings,
  PrivacySettings,
  SecuritySettings,
  UserCapabilities,
  AuthProvider,
  PlanType,
} from './src/types/user';
```

---

## Error Handling

### Global Error Handler

```tsx
function App() {
  const { error, clearError } = useAuth();

  useEffect(() => {
    if (error) {
      Alert.alert('Error', error, [
        { text: 'OK', onPress: clearError }
      ]);
    }
  }, [error]);

  return <YourApp />;
}
```

### Service-Level Error Handling

```tsx
try {
  await authService.login({ email, password });
} catch (error) {
  if (error.message.includes('401')) {
    // Invalid credentials
  } else if (error.message.includes('Network')) {
    // Network error
  } else {
    // Other error
  }
}
```

---

## Environment Configuration

### Development

```typescript
// IS_DEV = true
// Points to: https://auth-488727584674.us-central1.run.app
```

### Production

```typescript
// IS_DEV = false
// Points to: https://auth.wihy.ai and https://services.wihy.ai
```

### Override URLs

```typescript
// In authService.ts or profileService.ts
const AUTH_BASE_URL = process.env.REACT_APP_AUTH_URL 
  || (IS_DEV 
    ? 'https://auth-488727584674.us-central1.run.app' 
    : 'https://auth.wihy.ai');
```

---

## Best Practices

### 1. Always Check Authentication

```tsx
const { isAuthenticated, loading } = useAuth();

if (loading) return <LoadingSpinner />;
if (!isAuthenticated) return <LoginScreen />;
```

### 2. Handle Token Refresh Automatically

The services handle token refresh automatically. No action needed.

### 3. Clear Errors After Displaying

```tsx
useEffect(() => {
  if (error) {
    showAlert(error);
    clearError(); // Clear after showing
  }
}, [error]);
```

### 4. Use Capabilities for Feature Access

```tsx
// ❌ Don't check plan directly
if (user.plan === 'premium') { ... }

// ✅ Check capabilities
if (capabilities?.meals) { ... }
```

### 5. Sync Biometric Settings

```tsx
// When enabling biometric via profile service
await profileService.saveLocalSecuritySettings({
  biometricEnabled: true,
});
await enhancedAuthService.enableBiometricLogin();
```

---

## Testing

### Mock Auth Context

```tsx
import { AuthContext } from './src/context/AuthContext';

const mockAuthValue = {
  user: { id: '123', email: 'test@example.com', ... },
  isAuthenticated: true,
  loading: false,
  // ... other values
};

<AuthContext.Provider value={mockAuthValue}>
  <YourComponent />
</AuthContext.Provider>
```

### Test with Dev Auth

```tsx
// Use handleDevAuth for testing (if implemented)
const handleDevAuth = async () => {
  // Bypass OAuth for testing
  await signIn('local', {
    email: 'dev@wihy.ai',
    password: 'dev123',
  });
};
```

---

## Troubleshooting

### "Not authenticated" errors

```tsx
// Check if token exists
const token = await authService.getStoredToken();
if (!token) {
  // User needs to login again
  navigation.navigate('Login');
}
```

### Session expired

```tsx
// Services automatically refresh tokens
// If refresh fails, user is logged out
// Listen to auth state changes:
onAuthStateChange={(user) => {
  if (!user) {
    navigation.navigate('Login');
  }
}}
```

### Biometric not working

```tsx
// Check availability first
const { available, type } = await enhancedAuthService.checkBiometricAvailability();
if (!available) {
  Alert.alert('Biometric not available on this device');
}
```

---

## Migration from Old Auth

If migrating from an existing auth system:

1. **Wrap app with AuthProvider**
2. **Replace old login calls with `signIn()`**
3. **Replace user context with `useAuth()`**
4. **Update capability checks** from plan-based to capability-based
5. **Sync biometric settings** if already using biometrics

---

## Support

- **Type definitions**: `src/types/user.ts`
- **Services**: `src/services/`
- **Context**: `src/context/AuthContext.tsx`
- **Integration guide**: `AUTH_PROFILE_INTEGRATION.md`
- **Service overview**: `AUTH_SERVICE_INTEGRATION.md`
