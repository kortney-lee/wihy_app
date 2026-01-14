# iOS OAuth Setup - Implementation Checklist

## ✅ Completed Steps

### Infrastructure
- [x] Created Expo OAuth service (`mobile/src/services/googleAuthService.ts`)
- [x] Created Google Sign-In button component (`mobile/src/components/GoogleSignInButton.tsx`)
- [x] Created app.json with iOS OAuth configuration
- [x] Installed `expo-auth-session` and `expo-web-browser`
- [x] Existing AuthContext supports Google authentication via enhancedAuthService
- [x] MultiAuthLogin component already displays Google provider option

### Current Architecture
Your app uses an **enhanced OAuth flow** through:
1. **MultiAuthLogin component** - displays provider options including Google
2. **AuthContext.signIn('google')** - handles the sign-in
3. **enhancedAuthService** - manages OAuth with WebView
4. **appleAuthService** - handles Apple Sign-In
5. **authService** - backend API communication

## 🔧 Required Configuration

### Step 1: Get Your Apple Team ID
**Location:** https://developer.apple.com/account
1. Go to **Membership** section
2. Copy your **Team ID** (format: `A1B2C3D4E5`)
3. Save it for the next step

**Current value in app.json:** [NEEDS TO BE UPDATED]

### Step 2: Create iOS OAuth Client in Google Cloud

1. Go to https://console.cloud.google.com/apis/credentials
2. Click **+ CREATE CREDENTIALS** → **OAuth client ID**
3. Select **Application type**: **iOS**
4. Fill in the form:
   - **Bundle ID**: `com.wihy.app`
   - **Team ID**: [Your Apple Team ID from Step 1]
   - **App Store ID**: Leave blank for now (add after publishing)
5. Click **CREATE**
6. Google will provide an **iOS Client ID** (you don't need to use this directly - it's for Apple's records)

### Step 3: Update app.json with Your Team ID

Once you have your Team ID, update the file:

**File:** `mobile/app.json`

Change this section:
```json
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
```

**Key values to verify:**
- `bundleIdentifier`: Must match **exactly** what's in Google Console (currently `com.wihy.app`)
- `GIDClientID`: Web OAuth Client ID from Google Cloud (currently set)
- `CFBundleURLSchemes`: Reverse client ID (format: `com.googleusercontent.apps.{CLIENT_ID}`)

### Step 4: Test the OAuth Flow

#### A. Local Testing (Simulator/Expo Go)

The current setup works with:
1. **Expo Go** - scan QR code to test immediately
2. **iOS Simulator** - after `expo prebuild`

Flow:
1. App shows login screen
2. Tap "Continue with Google" 
3. Browser opens for Google login
4. Returns to app with token
5. AuthContext processes the token

#### B. Pre-built Testing (Real Device)

```bash
cd /Users/kortney/Desktop/wihy_app/mobile

# Prebuild native project
npx expo prebuild --platform ios --clean

# Run on simulator
npx expo run:ios

# Or open in Xcode for real device testing
open ios/wihy_native.xcworkspace
```

---

## 📋 Configuration Summary

### app.json Structure
```json
{
  "expo": {
    "ios": {
      "bundleIdentifier": "com.wihy.app",
      "buildNumber": "20",
      "infoPlist": {
        "GIDClientID": "[WEB_CLIENT_ID]",
        "CFBundleURLTypes": [
          {
            "CFBundleURLSchemes": ["com.googleusercontent.apps.[REVERSED_CLIENT_ID]"]
          }
        ]
      }
    }
  }
}
```

### Environment Variables (app.json)
- ✅ Bundle ID: `com.wihy.app` (set)
- ✅ Web Client ID: `12913076533-nm1hkjat1b8ho52m6p5m5odonki2l3n7.apps.googleusercontent.com` (set)
- ⚠️ iOS Client ID: (created in Google Console, not needed here)
- ⚠️ Team ID: (required for prebuild, not in app.json but in Google Console)

---

## 🔌 Integration Points

### 1. Login Screen (`src/screens/Login.tsx`)
- Already integrated ✅
- Shows "Continue" button that opens MultiAuthLogin
- No changes needed

### 2. MultiAuthLogin Component (`src/components/auth/MultiAuthLogin.tsx`)
- Already displays Google provider ✅
- Calls `signIn('google')` on provider press
- No changes needed

### 3. AuthContext (`src/context/AuthContext.tsx`)
- Already has `handleGoogleAuth()` ✅
- Uses `enhancedAuthService.authenticateWithOAuth('google')`
- No changes needed

### 4. Enhanced Auth Service (`src/services/enhancedAuthService.ts`)
- Handles the actual OAuth flow ✅
- Opens browser for login
- Returns user data on success

---

## 🚀 Deployment Workflow

### For EAS Build

```bash
cd /Users/kortney/Desktop/wihy_app/mobile

# Build for iOS TestFlight
eas build --platform ios --profile production

# After build completes
eas submit --platform ios --latest
```

### Prerequisites for EAS Build:
1. [ ] EAS account (https://expo.dev)
2. [ ] `eas login` authenticated
3. [ ] `eas.json` configured (already present)
4. [ ] Apple Developer account connected to Expo
5. [ ] Team ID in Google Cloud OAuth settings

---

## 🧪 Testing Checklist

### Local Testing (Expo Go)
- [ ] Run `npx expo start --clear`
- [ ] Scan QR code with Expo Go app (iOS)
- [ ] Tap login → "Continue with Google"
- [ ] Complete Google sign-in in browser
- [ ] Returns to app with authenticated user

### Simulator Testing
- [ ] Run `npx expo run:ios`
- [ ] Tap login → "Continue with Google"
- [ ] Browser opens with Google login
- [ ] Successfully authenticates

### Real Device Testing
- [ ] Run on actual iPhone/iPad via Xcode
- [ ] Complete full sign-in flow
- [ ] Verify token is sent to backend
- [ ] Check backend logs for OAuth validation

---

## ⚠️ Common Issues & Solutions

### "Invalid Client" Error
**Cause:** Bundle ID mismatch
**Solution:** 
- Verify `bundleIdentifier` in app.json
- Verify Bundle ID in Google Console match **exactly**
- No spaces, correct case

### OAuth Window Doesn't Open
**Cause:** `expo-web-browser` not initialized
**Solution:**
- Ensure app is running with Expo
- Test on real device (simulator has limitations)
- Check console for error messages

### "Invalid Team ID"
**Cause:** Wrong or missing Team ID in Google Console
**Solution:**
- Double-check Team ID format (10 characters)
- Verify it matches your Apple Developer account
- Re-create the iOS OAuth client if needed

### Token Not Sent to Backend
**Cause:** enhancedAuthService not configured properly
**Solution:**
- Check `src/services/enhancedAuthService.ts` configuration
- Verify backend endpoint accepts Google tokens
- Enable debug logging in auth service

---

## 📞 Next Steps

1. **Get Team ID** from Apple Developer Portal
2. **Create iOS OAuth Client** in Google Cloud Console
3. **Verify app.json** has all correct values
4. **Test with Expo Go** on iOS device
5. **Run `expo prebuild`** to generate native project
6. **Test on real device** via Xcode
7. **Build with EAS** for TestFlight distribution

---

## 🔗 Resources

- Expo OAuth Docs: https://docs.expo.dev/versions/latest/sdk/auth-session/
- Google OAuth Setup: https://developers.google.com/identity/protocols/oauth2
- Apple Team ID: https://developer.apple.com/account
- WIHY OAuth Guide: `/EXPO_IOS_OAUTH_SETUP.md`

---

## 📝 Implementation Status

| Component | Status | Notes |
|-----------|--------|-------|
| OAuth Service | ✅ Complete | `googleAuthService.ts` created |
| Sign-In Button | ✅ Complete | `GoogleSignInButton.tsx` created |
| app.json | ✅ Complete | iOS config in place |
| AuthContext | ✅ Complete | Existing setup supports Google |
| MultiAuthLogin | ✅ Complete | Shows Google provider option |
| enhancedAuthService | ✅ Complete | Handles OAuth flow |
| EAS Configuration | ✅ Complete | Ready for build |
| **Deployment** | ⏳ Pending | Awaiting credentials |
