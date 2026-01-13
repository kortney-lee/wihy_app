# 🚀 Android Release Build Guide for Google Play Store

**Date:** January 8, 2026  
**App:** WiHY Health  
**Package:** `com.wihy.app`

---

## 📋 Pre-Release Checklist

- [ ] Version number updated in `app.json`
- [ ] Version code incremented for Play Store
- [ ] Release keystore created and secured
- [ ] App icons in all required sizes
- [ ] Privacy policy URL ready
- [ ] Play Store listing prepared (description, screenshots)
- [ ] Testing completed on multiple devices

---

## 🔐 Step 1: Generate Release Keystore

**IMPORTANT:** Store your keystore file and passwords securely. If lost, you cannot update your app!

### Generate Keystore (Run Once)

```powershell
# Navigate to android/app directory
cd android/app

# Generate release keystore
keytool -genkeypair -v -storetype PKCS12 -keystore wihy-release.keystore -alias wihy-key -keyalg RSA -keysize 2048 -validity 10000

# You will be prompted for:
# - Keystore password (SAVE THIS!)
# - Key password (SAVE THIS!)
# - Your name, organization, city, state, country
```

### Example Prompts
```
Enter keystore password: [YOUR_SECURE_PASSWORD]
Re-enter new password: [YOUR_SECURE_PASSWORD]
What is your first and last name? WiHY Team
What is the name of your organizational unit? Mobile
What is the name of your organization? WiHY Inc
What is the name of your City or Locality? New York
What is the name of your State or Province? NY
What is the two-letter country code for this unit? US
Is CN=WiHY Team, OU=Mobile, O=WiHY Inc, L=New York, ST=NY, C=US correct? yes
```

---

## 🔧 Step 2: Configure Gradle for Release Signing

### Option A: Using gradle.properties (Recommended for CI/CD)

Add to `android/gradle.properties`:

```properties
# Release signing config (DO NOT COMMIT TO GIT!)
WIHY_RELEASE_STORE_FILE=wihy-release.keystore
WIHY_RELEASE_KEY_ALIAS=wihy-key
WIHY_RELEASE_STORE_PASSWORD=YOUR_STORE_PASSWORD
WIHY_RELEASE_KEY_PASSWORD=YOUR_KEY_PASSWORD
```

### Option B: Using Environment Variables (More Secure)

Set environment variables in PowerShell:

```powershell
$env:WIHY_RELEASE_STORE_PASSWORD = "your_store_password"
$env:WIHY_RELEASE_KEY_PASSWORD = "your_key_password"
```

---

## 📝 Step 3: Update build.gradle for Release

The `android/app/build.gradle` has been configured with release signing. Ensure this block exists:

```gradle
android {
    signingConfigs {
        debug {
            storeFile file('debug.keystore')
            storePassword 'android'
            keyAlias 'androiddebugkey'
            keyPassword 'android'
        }
        release {
            if (project.hasProperty('WIHY_RELEASE_STORE_FILE')) {
                storeFile file(WIHY_RELEASE_STORE_FILE)
                storePassword WIHY_RELEASE_STORE_PASSWORD
                keyAlias WIHY_RELEASE_KEY_ALIAS
                keyPassword WIHY_RELEASE_KEY_PASSWORD
            }
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            shrinkResources true
            minifyEnabled true
            proguardFiles getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro"
        }
    }
}
```

---

## 🏗️ Step 4: Build Release APK/AAB

### Build Android App Bundle (AAB) - Recommended for Play Store

```powershell
# Navigate to project root
cd c:\repo\wihy_native

# Clean previous builds
cd android
.\gradlew clean
cd ..

# Build release AAB
cd android
.\gradlew bundleRelease
```

**Output location:** `android/app/build/outputs/bundle/release/app-release.aab`

### Build Release APK (For Testing/Direct Distribution)

```powershell
cd android
.\gradlew assembleRelease
```

**Output location:** `android/app/build/outputs/apk/release/app-release.apk`

---

## 🧪 Step 5: Test Release Build

### Install APK on Device

```powershell
# List connected devices
adb devices

# Install APK
adb install android/app/build/outputs/apk/release/app-release.apk
```

### Verify Signing

```powershell
# Check APK signature
keytool -printcert -jarfile android/app/build/outputs/apk/release/app-release.apk

# Check AAB signature
jarsigner -verify -verbose -certs android/app/build/outputs/bundle/release/app-release.aab
```

---

## 📤 Step 6: Upload to Google Play Store

### Google Play Console Setup

1. Go to [play.google.com/console](https://play.google.com/console)
2. Create developer account ($25 one-time fee)
3. Create new app → Enter app details

### Upload AAB

1. Navigate to **Release** → **Production** → **Create new release**
2. Upload `app-release.aab`
3. Add release notes
4. Review and roll out

### Required Store Listing Assets

| Asset | Dimensions | Required |
|-------|------------|----------|
| App icon | 512 x 512 px | ✅ |
| Feature graphic | 1024 x 500 px | ✅ |
| Phone screenshots | Min 2, 16:9 or 9:16 | ✅ |
| Tablet screenshots | 7" and 10" | Optional |

---

## 🔄 Version Management

### Update Version for Each Release

Edit `app.json`:

```json
{
  "expo": {
    "version": "1.0.1",  // Semantic version (shown to users)
    "android": {
      "versionCode": 2   // Integer, must increment each release
    }
  }
}
```

### Version Code Rules
- Must be **higher** than previous release
- Integer only (1, 2, 3...)
- Can jump (1 → 5 is OK)

---

## 🔒 Security Best Practices

### 1. Protect Your Keystore

```powershell
# Add to .gitignore
echo "*.keystore" >> .gitignore
echo "*.jks" >> .gitignore
```

### 2. Backup Keystore Securely
- Store in password manager (1Password, LastPass)
- Keep encrypted backup in secure cloud storage
- Document passwords in secure location

### 3. Use Play App Signing (Recommended)
- Google manages your app signing key
- You keep an upload key
- Recovery possible if upload key lost

---

## 🚀 EAS Build Alternative (Expo)

For cloud-based builds without local Android SDK:

```powershell
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure EAS
eas build:configure

# Build for Android
eas build --platform android --profile production

# Submit to Play Store
eas submit --platform android
```

### EAS Build Profiles (eas.json)

```json
{
  "build": {
    "preview": {
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      }
    }
  }
}
```

---

## 🐛 Troubleshooting

### Build Fails: "Keystore was tampered with"
```powershell
# Regenerate keystore with correct password
keytool -genkeypair -v -storetype PKCS12 -keystore wihy-release.keystore -alias wihy-key -keyalg RSA -keysize 2048 -validity 10000
```

### Build Fails: "Could not find method"
```powershell
# Clean and rebuild
cd android
.\gradlew clean
.\gradlew bundleRelease --stacktrace
```

### App Crashes on Launch (Release Only)
- Check ProGuard rules in `proguard-rules.pro`
- Add keep rules for libraries that use reflection:
```proguard
-keep class com.facebook.hermes.** { *; }
-keep class com.facebook.react.** { *; }
```

### AAB Too Large (>150MB)
- Enable App Bundle optimization
- Check for unused assets
- Enable `shrinkResources true`

---

## 📊 Build Outputs Summary

| Build Type | Command | Output | Use Case |
|------------|---------|--------|----------|
| Debug APK | `gradlew assembleDebug` | `/apk/debug/` | Development |
| Release APK | `gradlew assembleRelease` | `/apk/release/` | Testing, Direct install |
| Release AAB | `gradlew bundleRelease` | `/bundle/release/` | **Play Store** |

---

## ✅ Final Checklist Before Submission

- [ ] App tested on release build (not debug)
- [ ] Version code incremented
- [ ] All permissions justified in Play Console
- [ ] Privacy policy linked
- [ ] Data safety form completed
- [ ] Content rating questionnaire completed
- [ ] App screenshots uploaded
- [ ] Store listing complete
- [ ] Target API level ≥ 34 (Android 14)

---

## 📞 Support

For build issues:
- Check [React Native Release Docs](https://reactnative.dev/docs/signed-apk-android)
- Check [Expo EAS Build](https://docs.expo.dev/build/introduction/)
- Review Android Studio logcat for runtime errors

---

*Last Updated: January 8, 2026*
