# Mobile App CI/CD Deployment Guide

## Overview
This repository uses **Expo EAS (Expo Application Services)** for building and deploying the mobile app to iOS and Android platforms. The CI/CD workflows are configured to automatically build and deploy when code is pushed to specific branches.

## Prerequisites

### 1. Expo Account Setup
```bash
# Install EAS CLI globally
npm install -g eas-cli

# Login to Expo
eas login
```

### 2. GitHub Secrets Configuration
Add the following secrets in your GitHub repository settings (`Settings > Secrets and variables > Actions`):

#### Required Secrets:
- **`EXPO_TOKEN`** - Expo access token for EAS builds
  - Generate at: https://expo.dev/accounts/[username]/settings/access-tokens
  - Click "Create Token" and copy the token
  
- **`REACT_APP_API_BASE_URL`** - Production API URL (e.g., `https://ml.wihy.ai`)
- **`REACT_APP_AUTH_API_URL`** - Auth API URL

#### Optional (for store submission):
- **`APPLE_ID`** - Your Apple Developer account email
- **`ASC_APP_ID`** - App Store Connect app ID
- **`APPLE_TEAM_ID`** - Apple Team ID (found in Apple Developer portal)
- **`GOOGLE_PLAY_SERVICE_ACCOUNT`** - Google Play service account JSON (for Android submission)

## Build Profiles

### Development Build
For testing on physical devices with Expo Dev Client:
```bash
cd mobile
eas build --profile development --platform android
eas build --profile development --platform ios
```

### Preview Build
Internal testing builds (APK for Android, Ad-hoc for iOS):
```bash
cd mobile
eas build --profile preview --platform android
eas build --profile preview --platform ios
```

### Production Build
Store-ready builds:
```bash
cd mobile
eas build --profile production --platform android  # AAB for Play Store
eas build --profile production --platform ios       # IPA for App Store
```

## CI/CD Workflows

### Android Workflow (`.github/workflows/build-mobile-android.yml`)

**Triggers:**
- Push to `main` or `develop` branches
- Pull requests to `main`
- Manual trigger via `workflow_dispatch`
- Changes to `mobile/**` files

**Process:**
1. Checkout code
2. Setup Node.js 20
3. Setup Expo and EAS CLI
4. Setup Java 17 (for Android builds)
5. Install dependencies
6. Create `.env` file with API URLs
7. Build with EAS:
   - **Non-main branches**: Preview build (APK) - no wait
   - **Main branch**: Production build (AAB) - wait for completion
8. Submit to Google Play Internal Testing (production only)

### iOS Workflow (`.github/workflows/build-mobile-ios.yml`)

**Triggers:**
- Push to `main` or `develop` branches
- Pull requests to `main`
- Manual trigger via `workflow_dispatch`
- Changes to `mobile/**` files

**Process:**
1. Checkout code
2. Setup Node.js 20
3. Setup Expo and EAS CLI
4. Install dependencies
5. Create `.env` file with API URLs
6. Build with EAS:
   - **Non-main branches**: Preview build (Ad-hoc) - no wait
   - **Main branch**: Production build (App Store) - wait for completion
7. Submit to TestFlight (production only)

## Environment Variables

The app uses the following environment variables (defined in `eas.json`):

- **`EXPO_PUBLIC_API_URL`** - Main API endpoint
- **`EXPO_PUBLIC_AUTH_URL`** - Authentication API endpoint
- **`APP_ENV`** - Environment indicator (development/preview/production)

These are automatically injected during the build process from GitHub Secrets.

## Local Development

### Start Expo Dev Server
```bash
cd mobile
npx expo start
```

Options:
- Press `a` - Open on Android emulator/device
- Press `i` - Open on iOS simulator (macOS only)
- Press `w` - Open in web browser

### Local Builds

#### Android Local Build
```bash
cd mobile
npx expo run:android
# or
eas build --profile development --platform android --local
```

#### iOS Local Build (macOS only)
```bash
cd mobile
npx expo run:ios
# or
eas build --profile development --platform ios --local
```

## Deployment Process

### Development Cycle
1. Make changes in `mobile/` directory
2. Test locally with `npx expo start`
3. Push to `develop` branch
4. GitHub Actions automatically builds preview version
5. Download build from Expo dashboard or email notification

### Production Release
1. Merge changes to `main` branch
2. GitHub Actions automatically:
   - Builds production version
   - Submits to Google Play (Internal Testing)
   - Submits to TestFlight
3. Promote from internal testing to production in store consoles

## EAS Build Configuration

The `mobile/eas.json` file defines build profiles:

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "android": { "buildType": "apk" },
      "ios": { "simulator": true }
    },
    "preview": {
      "distribution": "internal",
      "android": { "buildType": "apk" },
      "ios": { "simulator": false }
    },
    "production": {
      "distribution": "store",
      "android": { 
        "buildType": "app-bundle",
        "autoIncrement": true
      },
      "ios": { 
        "autoIncrement": true 
      }
    }
  }
}
```

## Troubleshooting

### Build Fails in GitHub Actions
1. Check the Actions tab for error logs
2. Verify all GitHub Secrets are set correctly
3. Ensure `EXPO_TOKEN` is valid and not expired

### Environment Variables Not Working
1. Confirm secrets are set in GitHub repository settings
2. Check that variable names match exactly (case-sensitive)
3. Rebuild the app after changing environment variables

### EAS Build Stuck
1. Check Expo dashboard: https://expo.dev
2. Look for build queue status
3. Verify your Expo account has available build credits

### Submission Fails
**Android:**
- Ensure `google-play-service-account.json` is configured
- Verify Google Play Console access

**iOS:**
- Confirm Apple Developer account credentials
- Check App Store Connect API key setup
- Verify app bundle identifier matches

## Manual Deployment

### Submit Previously Built Version
```bash
cd mobile

# Android
eas submit --platform android --latest

# iOS
eas submit --platform ios --latest
```

### Build and Submit in One Command
```bash
cd mobile

# Android
eas build --platform android --profile production --auto-submit

# iOS
eas build --platform ios --profile production --auto-submit
```

## Monitoring Builds

1. **Expo Dashboard**: https://expo.dev/accounts/[username]/projects/wihy-ai/builds
2. **GitHub Actions**: Repository > Actions tab
3. **Email Notifications**: Configured in Expo account settings

## Version Management

Version numbers are automatically incremented in production builds via the `autoIncrement` setting in `eas.json`. To manually set version:

```bash
# Update app.json
{
  "expo": {
    "version": "1.2.0",
    "ios": { "buildNumber": "42" },
    "android": { "versionCode": 42 }
  }
}
```

## Useful Commands

```bash
# View build status
eas build:list

# View build details
eas build:view [build-id]

# Cancel running build
eas build:cancel

# Configure project
eas build:configure

# Update app (OTA updates)
eas update --branch production --message "Bug fixes"
```

## Resources

- [Expo EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [EAS Submit Documentation](https://docs.expo.dev/submit/introduction/)
- [GitHub Actions for Expo](https://github.com/expo/expo-github-action)
- [Expo Application Services](https://expo.dev/eas)
