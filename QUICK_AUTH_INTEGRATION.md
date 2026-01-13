# Quick Integration Guide - Add Auth to Navigation

## Overview

The authentication system is now implemented. Follow these steps to integrate it into your app navigation.

---

## Step 1: Update App.tsx (Already Done ✅)

The App.tsx already wraps the app with `AuthProvider`:

```tsx
import { AuthProvider } from './hooks/useAuth';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <SessionProvider>
        <SafeAreaProvider>
          <AppContent />
        </SafeAreaProvider>
      </SessionProvider>
    </AuthProvider>
  );
};
```

---

## Step 2: Update AppNavigator.tsx

Modify `src/navigation/AppNavigator.tsx` to conditionally show auth or home screens:

```tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../hooks/useAuth';
import { ActivityIndicator, View } from 'react-native';

// Screens
import AuthenticationScreen from '../screens/AuthenticationScreen';
import HomeScreen from '../screens/HomeScreen'; // Your main app screens
// ... import other screens

const Stack = createNativeStackNavigator();

const AuthStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animationEnabled: false
      }}
    >
      <Stack.Screen 
        name="Authentication" 
        component={AuthenticationScreen}
        options={{ title: 'Sign In' }}
      />
    </Stack.Navigator>
  );
};

const AppStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true
      }}
    >
      <Stack.Screen 
        name="Home" 
        component={HomeScreen}
        options={{ title: 'WIHY' }}
      />
      {/* Add other app screens here */}
    </Stack.Navigator>
  );
};

const AppNavigator = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0066cc" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <AppStack /> : <AuthStack />}
    </NavigationContainer>
  );
};

export default AppNavigator;
```

---

## Step 3: Configure Deep Linking (iOS)

Edit `ios/WihyApp/Info.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <!-- ... other keys ... -->
  
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
  
  <!-- ... rest of file ... -->
</dict>
</plist>
```

---

## Step 4: Configure Deep Linking (Android)

Edit `android/app/src/main/AndroidManifest.xml`, find MainActivity and update:

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
  <intent-filter
    android:autoVerify="true">
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

---

## Step 5: Update authConfig.ts

Set your actual service URLs:

```typescript
// src/config/authConfig.ts

const ENV = {
  dev: {
    AUTH_BASE_URL: 'http://192.168.1.100:5000', // Your dev machine IP
    API_BASE_URL: 'http://192.168.1.100:3000',
    // ... rest of config
  },
  prod: {
    AUTH_BASE_URL: 'https://auth.wihy.ai',
    API_BASE_URL: 'https://api.wihy.ai',
    // ... rest of config
  }
};
```

---

## Step 6: Test the Flow

### Test on iOS

```bash
# Terminal 1: Start auth service
cd auth-service
npm start

# Terminal 2: Run iOS app
cd wihy_native
npm run ios
```

### Test on Android

```bash
# Terminal 1: Start auth service
cd auth-service
npm start

# Terminal 2: Run Android app
cd wihy_native
npm run android
```

### Test Steps

1. **Open app** - Should show Authentication screen (not logged in)
2. **Tap "Sign In with Google"** - Should redirect to Google login
3. **Complete Google login** - App should redirect back to home screen
4. **App should show home** - Means authentication worked
5. **Check AsyncStorage** - Token should be stored (use React Native Debugger)
6. **Close and reopen app** - Should auto-restore session (no login needed)
7. **Tap logout** - Should return to auth screen

---

## Step 7: Testing Local Features

### Test Local Login

```tsx
// In AuthenticationScreen or test component
const { login } = useAuth();

// Test registration
await login.register('test@example.com', 'Password123', 'Test User');

// Test login
await login.local('test@example.com', 'Password123');
```

### Test API Requests

```tsx
import { useFetch } from '../hooks/useApi';

const TestComponent = () => {
  const { data, loading, error } = useFetch('/api/user/profile');

  return (
    <View>
      {loading && <Text>Loading...</Text>}
      {error && <Text>Error: {error.message}</Text>}
      {data && <Text>User: {data.name}</Text>}
    </View>
  );
};
```

---

## Troubleshooting

### "Cannot find module useAuth"

Make sure you're importing from the correct path:
```tsx
// ✅ Correct
import { useAuth } from '../hooks/useAuth';

// ❌ Wrong
import { useAuth } from '../services/useAuth';
```

### Deep linking not working

1. **iOS**: Verify `com.wihy.app` in Info.plist matches exactly
2. **Android**: Verify scheme and host in AndroidManifest.xml match
3. **App linking**: `adb shell am start -a android.intent.action.VIEW -d "com.wihy.app://auth/callback?session_token=test"`

### Auth service connection fails

1. Check AUTH_BASE_URL in authConfig.ts
2. Verify auth service is running
3. On Android emulator, use 10.0.2.2 instead of localhost
4. Check firewall settings

### Token not persisting

1. Check AsyncStorage permissions in AndroidManifest.xml
2. Restart app
3. Check RN Debugger AsyncStorage tab for token key

---

## Files to Modify

| File | Action | Status |
|------|--------|--------|
| `src/navigation/AppNavigator.tsx` | Add auth/app conditional | ⏳ TODO |
| `ios/WihyApp/Info.plist` | Add URL scheme | ⏳ TODO |
| `android/app/src/main/AndroidManifest.xml` | Add intent filter | ⏳ TODO |
| `src/config/authConfig.ts` | Update service URLs | ⏳ TODO |
| `src/App.tsx` | Already wrapped with AuthProvider | ✅ DONE |

---

## Files Already Created

| File | Purpose | Status |
|------|---------|--------|
| `src/services/auth/authService.js` | Core auth service | ✅ DONE |
| `src/hooks/useAuth.ts` | Auth context & hook | ✅ DONE |
| `src/hooks/useApi.ts` | API request hooks | ✅ DONE |
| `src/services/api.js` | API utilities | ✅ DONE |
| `src/config/authConfig.ts` | Configuration | ✅ DONE |
| `src/screens/AuthenticationScreen.tsx` | Auth UI | ✅ DONE |

---

## Complete Test Checklist

- [ ] Deep linking configured on iOS
- [ ] Deep linking configured on Android
- [ ] authConfig.ts URLs updated
- [ ] AppNavigator.tsx shows auth/app conditional
- [ ] App shows Authentication screen when not logged in
- [ ] Google OAuth redirects correctly
- [ ] Facebook OAuth redirects correctly
- [ ] Microsoft OAuth redirects correctly
- [ ] Local login works
- [ ] Local registration works
- [ ] Token is stored after login
- [ ] Session restores on app reopen
- [ ] API requests include Authorization header
- [ ] Logout clears token
- [ ] Logout returns to auth screen

---

**Once complete, your app will have full authentication integrated!**

For more details, see [MOBILE_AUTH_IMPLEMENTATION.md](./MOBILE_AUTH_IMPLEMENTATION.md)
