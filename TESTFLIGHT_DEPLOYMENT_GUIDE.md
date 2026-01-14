# WIHY App Deployment Guide

Complete guide for building and deploying the WIHY app to TestFlight.

## Prerequisites

- Node.js 18+ installed
- Expo CLI: `npm install -g expo-cli`
- EAS CLI: `npm install -g eas-cli`
- Apple Developer Account
- Expo account (https://expo.dev)

## Initial Setup

### 1. Clone and Install

```bash
git clone https://github.com/kortney-lee/wihy_native_app.git
cd wihy_native_app
npm install
```

### 2. Login to Expo/EAS

```bash
eas login
# Enter your Expo credentials
```

### 3. Configure EAS Build (First Time Only)

```bash
eas build:configure
```

This creates/updates `eas.json` with build profiles.

## Building for iOS

### Step 1: Clean Prebuild (Optional but Recommended)

```bash
npx expo prebuild --clean
```

This regenerates the native iOS project from your Expo config.

### Step 2: Build for Production

```bash
eas build --platform ios --profile production
```

The build runs on Expo's servers. You'll receive a URL to track progress.

**Build output:**
- Build ID (e.g., `4943ca44-8060-458f-8170-1c4f8cb23902`)
- IPA file URL when complete

### Step 3: Check Build Status

```bash
# List recent builds
eas build:list --platform ios --limit 5

# View specific build
eas build:view <build-id>
```

## Submitting to TestFlight

### Option A: Submit Latest Build

```bash
eas submit --platform ios --latest
```

### Option B: Submit Specific Build

```bash
eas submit --platform ios --id <build-id>
```

Example:
```bash
eas submit --platform ios --id 4943ca44-8060-458f-8170-1c4f8cb23902
```

### What Happens During Submit

1. EAS connects to App Store Connect
2. Authenticates with your Apple ID
3. Uploads the IPA to TestFlight
4. Apple processes the build (5-30 minutes)

## Complete Deployment Workflow

```bash
# 1. Make sure code is committed
git add .
git commit -m "Release: v1.0.0 build 20"
git push

# 2. Build for iOS
eas build --platform ios --profile production

# 3. Wait for build to complete, then submit
eas submit --platform ios --latest
```

## Managing Builds

### Cancel a Build in Progress

```bash
eas build:cancel <build-id>
```

### View Build Logs

```bash
eas build:view <build-id>
# Or visit the URL provided during build
```

## Configuration Files

### eas.json

```json
{
  "cli": {
    "version": ">= 3.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {
      "distribution": "store"
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "kortney.lee@snackingwell.com",
        "ascAppId": "6757577375"
      }
    }
  }
}
```

### app.json (Key iOS Fields)

```json
{
  "expo": {
    "name": "wihy",
    "slug": "wihy-ai",
    "version": "1.0.0",
    "ios": {
      "bundleIdentifier": "com.wihy.app",
      "buildNumber": "20",
      "supportsTablet": true
    }
  }
}
```

## Incrementing Build Numbers

Before each new build, update `buildNumber` in `app.json`:

```json
"ios": {
  "buildNumber": "21"  // Increment this
}
```

Or let EAS auto-increment:
```bash
eas build --platform ios --profile production --auto-submit
```

## Troubleshooting

### Build Failed

1. Check build logs: `eas build:view <build-id>`
2. Common issues:
   - Missing provisioning profiles
   - Bundle identifier mismatch
   - Invalid app.json configuration

### Submit Failed

1. Verify Apple credentials are correct
2. Check App Store Connect for the app
3. Ensure build number is higher than previous

### Authentication Issues

```bash
# Re-login to EAS
eas logout
eas login

# Clear Apple credentials cache
rm -rf ~/.app-store/auth
```

## App Store Connect

After TestFlight submission:

1. Go to https://appstoreconnect.apple.com
2. Select your app (WIHY)
3. Go to TestFlight tab
4. Wait for build processing
5. Add test notes and submit for review (if needed)
6. Add testers via email or public link

## Quick Reference

| Action | Command |
|--------|---------|
| Start dev server | `npx expo start --clear` |
| Build iOS | `eas build --platform ios --profile production` |
| Build Android | `eas build --platform android --profile production` |
| List builds | `eas build:list` |
| Cancel build | `eas build:cancel <id>` |
| Submit to TestFlight | `eas submit --platform ios --latest` |
| Submit specific build | `eas submit --platform ios --id <id>` |

## Current App Info

- **Bundle ID**: `com.wihy.app`
- **App Store Connect ID**: `6757577375`
- **Expo Project**: `@wihy-ai/wihy-ai`
- **Latest Build**: #20 (as of Jan 13, 2026)
