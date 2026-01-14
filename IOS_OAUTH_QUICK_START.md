# iOS OAuth - Quick Setup Guide

## 🚀 What's Already Done

✅ Expo project configured  
✅ Google OAuth service created  
✅ Sign-In button component created  
✅ app.json with iOS settings created  
✅ AuthContext has Google support  
✅ MultiAuthLogin shows Google option  

## 🔧 What YOU Need To Do

### Step 1: Get Your Apple Team ID (5 min)
```
1. Go to https://developer.apple.com/account
2. Click "Membership" in left sidebar
3. Copy the 10-character Team ID (e.g., A1B2C3D4E5)
4. Save it somewhere safe
```

### Step 2: Create iOS OAuth Client (5 min)
```
1. Go to https://console.cloud.google.com/apis/credentials
2. Click "+ CREATE CREDENTIALS" → "OAuth client ID"
3. Select "iOS" as application type
4. Fill in:
   - Bundle ID: com.wihy.app
   - Team ID: [paste from Step 1]
   - App Store ID: (leave blank)
5. Click CREATE
6. Google shows you the iOS Client ID (you can close this)
```

### Step 3: Verify Your app.json (1 min)

Check that `mobile/app.json` has these values:

```json
{
  "expo": {
    "ios": {
      "bundleIdentifier": "com.wihy.app",
      "infoPlist": {
        "GIDClientID": "12913076533-nm1hkjat1b8ho52m6p5m5odonki2l3n7.apps.googleusercontent.com"
      }
    }
  }
}
```

**Note:** The GIDClientID is your **Web Client ID** from Google Cloud (already set)

---

## 🧪 Testing

### Option A: Test with Expo Go (Easiest, No Build)
```bash
cd /Users/kortney/Desktop/wihy_app/mobile

# Start dev server (already running)
npx expo start --clear

# On your iPhone:
# 1. Open Expo Go app
# 2. Scan the QR code
# 3. Tap "Continue with Google"
# 4. Complete sign-in in browser
# 5. Returns to app when done
```

### Option B: Test on iOS Simulator
```bash
cd /Users/kortney/Desktop/wihy_app/mobile

# Generate native iOS project
npx expo prebuild --platform ios --clean

# Run on simulator
npx expo run:ios

# Test Google sign-in flow
```

### Option C: Test on Real Device
```bash
cd /Users/kortney/Desktop/wihy_app/mobile

# Generate native iOS project
npx expo prebuild --platform ios --clean

# Open in Xcode
open ios/wihy_native.xcworkspace

# Select your device and press Run
# Command + R to build and run
```

---

## 📦 Build for TestFlight

Once you've verified everything works:

```bash
cd /Users/kortney/Desktop/wihy_app/mobile

# Build for iOS
eas build --platform ios --profile production

# Wait for build to complete...
# Then submit to TestFlight
eas submit --platform ios --latest
```

---

## ✅ Success Indicators

After signing in with Google, you should see:

1. ✅ Browser opens with Google login screen
2. ✅ You can select your Google account
3. ✅ You see permission consent screen
4. ✅ Browser closes and returns to app
5. ✅ You see "Welcome" or home screen
6. ✅ Your email appears in the app

---

## ❌ If Something Doesn't Work

### "Invalid Client" or OAuth Error
→ Verify Bundle ID matches exactly in Google Console and app.json

### Browser Doesn't Open
→ Make sure you're on a real iOS device or simulator  
→ Check that Expo is running with `npx expo start`

### Returns to App But Not Logged In
→ Check backend is receiving the OAuth token  
→ Verify API endpoint in `enhancedAuthService.ts`  
→ Look at console logs for errors

### Stuck on Google Login Screen
→ Refresh the page  
→ Try signing in with different Google account  
→ Clear Expo cache: `npx expo start --clear`

---

## 📞 Files Modified/Created

```
mobile/
  ├── app.json (CREATED - iOS OAuth config)
  ├── src/
  │   ├── services/
  │   │   ├── googleAuthService.ts (CREATED)
  │   │   └── enhancedAuthService.ts (existing - handles OAuth)
  │   ├── components/
  │   │   └── GoogleSignInButton.tsx (CREATED)
  │   ├── screens/
  │   │   └── Login.tsx (existing - uses MultiAuthLogin)
  │   └── context/
  │       └── AuthContext.tsx (existing - has Google support)
```

---

## 🎯 Summary

1. **Get Team ID** from Apple Developer Portal
2. **Create iOS OAuth Client** in Google Cloud Console  
3. **Run Expo** and test with your iPhone  
4. **Build with EAS** when ready for TestFlight  

That's it! Everything else is already configured. 🚀

---

## 🔗 Quick Links

- Apple Developer: https://developer.apple.com/account
- Google Cloud Console: https://console.cloud.google.com/apis/credentials
- Expo Docs: https://docs.expo.dev
- Your Guides: 
  - [Full iOS OAuth Setup](EXPO_IOS_OAUTH_SETUP.md)
  - [Implementation Checklist](IOS_OAUTH_IMPLEMENTATION_CHECKLIST.md)
