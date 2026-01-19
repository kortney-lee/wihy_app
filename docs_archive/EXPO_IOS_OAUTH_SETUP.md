# Expo iOS OAuth Setup Guide - Google Sign-In

This guide covers setting up Google Sign-In for iOS in your Expo React Native app.

## 📱 Step 1: Find Your Bundle ID

Your **Bundle ID** identifies your iOS app uniquely.

### In Xcode:
1. Open `mobile/ios/wihy_native.xcworkspace` in Xcode
2. Select your app target
3. Go to **General** tab
4. Find **Bundle Identifier**

Example: `com.wihy.app`

### In app.json:
```json
{
  "expo": {
    "ios": {
      "bundleIdentifier": "com.wihy.app"
    }
  }
}
```

---

## 🔑 Step 2: Find Your Team ID

Your **Team ID** is a unique 10-character string from Apple.

### Method 1: Apple Developer Portal
1. Go to https://developer.apple.com/account
2. Click **Membership** in the sidebar
3. Find **Team ID** (10 characters, e.g., `A1B2C3D4E5`)

### Method 2: Xcode
1. Open Xcode
2. Go to **Xcode** → **Settings** → **Accounts**
3. Select your Apple ID
4. Click **Manage Certificates**
5. Your **Team ID** appears next to your team name

---

## 🔧 Step 3: Create iOS OAuth Client in Google Cloud Console

### Go to Google Cloud Console

1. Navigate to: https://console.cloud.google.com/apis/credentials
2. Click **+ CREATE CREDENTIALS** → **OAuth client ID**
3. Select **Application type**: **iOS**

### Fill in the Form

| Field | Value |
|-------|-------|
| **Name** | `WIHY iOS (Expo)` |
| **Bundle ID** | `com.wihy.app` |
| **Team ID** | `A1B2C3D4E5` (from Apple Developer Portal) |
| **App Store ID** | Leave blank (add after publishing) |

Click **CREATE**

---

## 📋 Step 4: Get Your Web Client ID

You also need the **Web OAuth Client ID** for Expo:

1. In Google Cloud Console → Credentials
2. Find your **Web application** OAuth 2.0 Client ID
3. Copy the Client ID

**Web Client ID Format:**
```
12913076533-nm1hkjat1b8ho52m6p5m5odonki2l3n7.apps.googleusercontent.com
```

---

## 🛠️ Step 5: Install Expo Auth Dependencies

```bash
cd /Users/kortney/Desktop/wihy_app/mobile
npm install expo-auth-session expo-web-browser
```

Or with yarn:
```bash
yarn add expo-auth-session expo-web-browser
```

---

## ⚙️ Step 6: Configure app.json for iOS

Update your `mobile/app.json` with iOS OAuth configuration:

```json
{
  "expo": {
    "name": "wihy",
    "slug": "wihy-ai",
    "version": "1.0.0",
    "ios": {
      "bundleIdentifier": "com.wihy.app",
      "buildNumber": "20",
      "supportsTablet": true,
      "infoPlist": {
        "GIDClientID": "12913076533-nm1hkjat1b8ho52m6p5m5odonki2l3n7.apps.googleusercontent.com",
        "CFBundleURLTypes": [
          {
            "CFBundleURLSchemes": [
              "com.googleusercontent.apps.12913076533-nm1hkjat1b8ho52m6p5m5odonki2l3n7"
            ]
          },
          {
            "CFBundleURLSchemes": [
              "com.wihy.app"
            ]
          }
        ]
      }
    }
  }
}
```

---

## 📝 Step 7: Create OAuth Service (Expo)

Create `mobile/src/services/googleAuthService.ts`:

```typescript
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';

// Configure web browser behavior
WebBrowser.maybeCompleteAuthSession();

const GOOGLE_OAUTH_CLIENT_ID = '12913076533-nm1hkjat1b8ho52m6p5m5odonki2l3n7.apps.googleusercontent.com';
const GOOGLE_OAUTH_WEB_CLIENT_ID = '12913076533-nm1hkjat1b8ho52m6p5m5odonki2l3n7.apps.googleusercontent.com';

// Get the redirect URL for your app
const redirectUrl = AuthSession.makeRedirectUrl();

export class GoogleAuthService {
  static async signIn(): Promise<string | null> {
    try {
      // Create request object for Google OAuth
      const request = new AuthSession.GoogleAuthRequest({
        clientId: GOOGLE_OAUTH_WEB_CLIENT_ID,
        iosClientId: GOOGLE_OAUTH_CLIENT_ID,
        redirectUrl: redirectUrl,
        scopes: ['profile', 'email'],
      });

      // Perform the authentication
      const result = await request.promptAsync();

      if (result.type === 'success') {
        const idToken = result.params.id_token;
        return idToken;
      } else if (result.type === 'error') {
        console.error('OAuth Error:', result.params.error);
        return null;
      }

      return null;
    } catch (error) {
      console.error('Google Sign-In Error:', error);
      return null;
    }
  }

  static async signOut(): Promise<void> {
    // Expo handles sign-out internally
    // No additional action needed
  }

  static getRedirectUrl(): string {
    return redirectUrl;
  }
}
```

---

## 🎨 Step 8: Create Google Sign-In Button Component

Create `mobile/src/components/GoogleSignInButton.tsx`:

```typescript
import React, { useState } from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  View,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { GoogleAuthService } from '../services/googleAuthService';

interface GoogleSignInButtonProps {
  onSignInSuccess: (idToken: string) => Promise<void>;
  onSignInError?: (error: Error) => void;
}

export function GoogleSignInButton({
  onSignInSuccess,
  onSignInError,
}: GoogleSignInButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      const idToken = await GoogleAuthService.signIn();

      if (idToken) {
        // Send token to your backend
        await onSignInSuccess(idToken);
      } else {
        Alert.alert('Sign-In Failed', 'No token received from Google');
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      onSignInError?.(err);
      Alert.alert('Sign-In Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableOpacity
      style={styles.button}
      onPress={handleGoogleSignIn}
      disabled={loading}
    >
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <View style={styles.buttonContent}>
          <MaterialIcons name="login" size={20} color="#fff" />
          <Text style={styles.buttonText}>Sign in with Google</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#EA4335',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
    minHeight: 50,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
```

---

## 🔐 Step 9: Update Auth Service to Handle Google Token

Update `mobile/src/services/authService.ts`:

```typescript
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'https://api.wihy.ai';

export class AuthService {
  static async loginWithGoogle(idToken: string) {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/google`, {
        id_token: idToken,
      });

      if (response.data.success) {
        // Save token
        await AsyncStorage.setItem('auth_token', response.data.data.token);
        return response.data.data.user;
      }

      throw new Error(response.data.error || 'Login failed');
    } catch (error) {
      throw error;
    }
  }

  static async getToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('auth_token');
    } catch {
      return null;
    }
  }

  static async logout() {
    try {
      await AsyncStorage.removeItem('auth_token');
    } catch {
      console.error('Logout error');
    }
  }
}
```

---

## 💻 Step 10: Integrate into Login Screen

Update your login screen component:

```typescript
import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { GoogleSignInButton } from '../components/GoogleSignInButton';
import { AuthService } from '../services/authService';
import { useAuth } from '../context/AuthContext';

export function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleEmailLogin = async () => {
    try {
      setLoading(true);
      // Your email login logic
      await login(email, password);
    } catch (error) {
      Alert.alert('Login Failed', (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignInSuccess = async (idToken: string) => {
    try {
      setLoading(true);
      const user = await AuthService.loginWithGoogle(idToken);
      
      // Update auth context
      await login(user.email, user.id);
      
      Alert.alert('Success', `Welcome ${user.name}!`);
    } catch (error) {
      Alert.alert('Login Failed', (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>WIHY</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        editable={!loading}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        editable={!loading}
      />

      <TouchableOpacity
        style={[styles.button, styles.primaryButton]}
        onPress={handleEmailLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Login</Text>
        )}
      </TouchableOpacity>

      <Text style={styles.divider}>OR</Text>

      <GoogleSignInButton
        onSignInSuccess={handleGoogleSignInSuccess}
        onSignInError={(error) => {
          Alert.alert('Google Sign-In Error', error.message);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    marginBottom: 15,
    borderRadius: 8,
  },
  button: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 10,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    textAlign: 'center',
    color: '#999',
    marginVertical: 15,
    fontWeight: '500',
  },
});
```

---

## 🧪 Step 11: Test iOS OAuth Setup

### Build for iOS Development

```bash
cd /Users/kortney/Desktop/wihy_app/mobile

# Clean rebuild (recommended first time)
npx expo prebuild --clean --platform ios

# Or just rebuild
npx expo prebuild --platform ios
```

### Run on iOS Simulator

```bash
npx expo run:ios
```

Or press `i` in the running Expo dev server.

### Test on Real Device

1. Connect iPhone/iPad via USB
2. In Xcode: Select your device from device dropdown
3. Press `Cmd + R` to build and run

### Test the Flow

1. Tap "Sign in with Google"
2. You should see:
   - Safari opens with Google login
   - Account picker (if multiple accounts)
   - Permission consent screen
   - Redirect back to app
3. Check that your backend receives the ID token

---

## 🔧 Troubleshooting

### "Invalid Client" Error
**Cause:** Bundle ID or Team ID mismatch

**Solution:**
1. Verify `bundleIdentifier` in `app.json` matches Google Console
2. Verify `Team ID` in Google Console matches Apple Developer account
3. Wait 5-10 minutes for Google to process changes

### OAuth Button Does Nothing
**Cause:** `expo-web-browser` not initialized properly

**Solution:**
1. Ensure `WebBrowser.maybeCompleteAuthSession()` is called at app startup
2. Check that you're using `expo-auth-session` latest version

### "Redirect URI mismatch"
**Cause:** `redirectUrl` doesn't match configured URI

**Solution:**
1. Log the redirect URL: `console.log(AuthSession.makeRedirectUrl())`
2. Add it to Google Console → Credentials → Authorized redirect URIs
3. Format should be: `com.wihy.app://oauth/redirect` (for Expo Go)

### Safari Doesn't Open
**Cause:** `expo-web-browser` not available on simulator

**Solution:**
- Test on a real device, not simulator
- Simulator has limited OAuth support

---

## 📋 Configuration Checklist

- [ ] Find Bundle ID: `com.wihy.app`
- [ ] Find Team ID from Apple Developer Portal
- [ ] Create iOS OAuth client in Google Console
- [ ] Get Web Client ID
- [ ] Update `app.json` with `bundleIdentifier` and `infoPlist`
- [ ] Install `expo-auth-session` and `expo-web-browser`
- [ ] Create `googleAuthService.ts`
- [ ] Create `GoogleSignInButton.tsx`
- [ ] Update auth service to handle Google tokens
- [ ] Integrate button into login screen
- [ ] Test on real iOS device
- [ ] Verify backend receives ID token

---

## 🚀 Your Expo iOS OAuth Config

**Bundle ID:** `com.wihy.app`  
**Team ID:** [Get from Apple Developer Portal]  
**Web Client ID:** `12913076533-nm1hkjat1b8ho52m6p5m5odonki2l3n7.apps.googleusercontent.com`  
**iOS Client ID:** [Created in Google Console]

---

## 📖 app.json Template

```json
{
  "expo": {
    "name": "wihy",
    "slug": "wihy-ai",
    "version": "1.0.0",
    "ios": {
      "bundleIdentifier": "com.wihy.app",
      "buildNumber": "20",
      "supportsTablet": true,
      "infoPlist": {
        "GIDClientID": "12913076533-nm1hkjat1b8ho52m6p5m5odonki2l3n7.apps.googleusercontent.com",
        "CFBundleURLTypes": [
          {
            "CFBundleURLSchemes": [
              "com.googleusercontent.apps.12913076533-nm1hkjat1b8ho52m6p5m5odonki2l3n7"
            ]
          }
        ]
      }
    }
  }
}
```

---

## ℹ️ Key Differences from Native iOS

| Aspect | Native iOS | Expo |
|--------|-----------|------|
| OAuth Library | GoogleSignIn SDK | expo-auth-session |
| Web Browser | Native | expo-web-browser |
| Config | Info.plist | app.json → infoPlist |
| Token Handling | Direct | Via expo-auth-session response |
| Deployment | TestFlight/App Store | EAS Build |

---

## 📞 Support Resources

- Expo Auth Session Docs: https://docs.expo.dev/versions/latest/sdk/auth-session/
- Google OAuth Setup: https://developers.google.com/identity/protocols/oauth2
- Expo iOS Build: https://docs.expo.dev/build/setup/
