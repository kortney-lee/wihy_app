# WIHY iOS App - Complete Setup & Deployment Guide

This document covers everything needed to set up, build, and deploy the WIHY iOS app to TestFlight from scratch.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Prerequisites & Account Setup](#prerequisites--account-setup)
3. [Initial Project Setup](#initial-project-setup)
4. [Configuration Files Explained](#configuration-files-explained)
5. [Development Workflow](#development-workflow)
6. [Building for iOS](#building-for-ios)
7. [Submitting to TestFlight](#submitting-to-testflight)
8. [App Store Connect Setup](#app-store-connect-setup)
9. [Managing Builds](#managing-builds)
10. [Troubleshooting](#troubleshooting)
11. [Quick Reference](#quick-reference)

---

## Project Overview

**WIHY** is a React Native app built with Expo SDK 54, featuring:

- HealthKit integration for fitness/health data
- Camera/barcode scanning for nutrition analysis
- Biometric authentication
- In-app purchases (Apple Pay)
- Push notifications
- Google Sign-In OAuth integration

| Property | Value |
|----------|-------|
| App Name | wihy |
| Bundle ID | `com.wihy.app` |
| Expo Slug | `wihy-ai` |
| Expo Owner | `wihy-ai` |
| App Store Connect ID | `6757577375` |
| EAS Project ID | `a60de855-4859-40e4-9765-eff58cfa207d` |
| React Native | 0.81.5 |
| Expo SDK | 54.0.30 |

---

## Prerequisites & Account Setup

### 1. Required Software

```bash
# Install Node.js 18+ (via Homebrew on macOS)
brew install node

# Install Expo CLI globally
npm install -g expo-cli

# Install EAS CLI globally
npm install -g eas-cli

# Verify installations
node --version    # Should be 18+
eas --version     # Should be 15+
```

### 2. Required Accounts

| Account | URL | Purpose |
|---------|-----|---------|
| Apple Developer | https://developer.apple.com | iOS app distribution, certificates |
| App Store Connect | https://appstoreconnect.apple.com | TestFlight, App Store publishing |
| Expo | https://expo.dev | Build servers, OTA updates |

### 3. Apple Developer Setup (One-Time)

1. **Enroll in Apple Developer Program** ($99/year)
   - Go to https://developer.apple.com/programs/enroll/
   - Complete enrollment with Apple ID

2. **Note Your Team ID**
   - Go to https://developer.apple.com/account
   - Look for "Team ID" (e.g., `8FPA6366BC`)

3. **Create App ID** (if not exists)
   - Go to Certificates, Identifiers & Profiles
   - Identifiers → Add new → App IDs
   - Bundle ID: `com.wihy.app`
   - Enable capabilities:
     - HealthKit
     - In-App Purchase
     - Push Notifications
     - Sign in with Apple

### 4. App Store Connect Setup (One-Time)

1. Go to https://appstoreconnect.apple.com
2. My Apps → "+" → New App
3. Fill in:
   - Platform: iOS
   - Name: WIHY
   - Primary Language: English
   - Bundle ID: `com.wihy.app`
   - SKU: `wihy-ios-app`

### 5. Expo Account Setup

```bash
# Create account at https://expo.dev/signup

# Login via CLI
eas login
# Enter your Expo email and password

# Verify login
eas whoami
# Should show: wihy-ai
```

---

## Initial Project Setup

### 1. Clone Repository

```bash
git clone https://github.com/kortney-lee/wihy_native_app.git
cd wihy_native_app
cd mobile
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

```bash
# Copy example to .env (DO NOT commit this file)
cp .env.example .env

# Edit .env and add your credentials (see OAuth Credentials section)
nano .env
```

**Important:** Add `.env` to `.gitignore` if not already present:
```bash
echo ".env" >> .gitignore
git add .gitignore
git commit -m "Add .env to gitignore"
```

### 4. Configure EAS (First Time Only)

```bash
# This links project to Expo and creates eas.json
eas build:configure

# Select: All
# This will create/update eas.json with build profiles
```

### 5. Verify Configuration

```bash
# Check app.json is valid
npx expo config --type public

# Check EAS configuration
eas config
```

---

## Configuration Files Explained

### app.json

The main Expo configuration file. Key iOS settings:

```json
{
  "expo": {
    "name": "wihy",
    "slug": "wihy-ai",
    "version": "1.0.0",
    "scheme": "wihy",
    "owner": "wihy-ai",
    
    "ios": {
      "bundleIdentifier": "com.wihy.app",
      "buildNumber": "20",
      "supportsTablet": true,
      "infoPlist": {
        "NSCameraUsageDescription": "WIHY needs camera access to scan nutrition labels and track food",
        "NSHealthShareUsageDescription": "WIHY reads your health data to provide personalized insights",
        "NSHealthUpdateUsageDescription": "WIHY updates your health data with your workout and nutrition information",
        "NSPhotoLibraryUsageDescription": "WIHY needs photo library access to select images for nutrition analysis",
        "NSFaceIDUsageDescription": "WIHY uses Face ID for secure authentication",
        "ITSAppUsesNonExemptEncryption": false
      },
      "entitlements": {
        "com.apple.developer.healthkit": true,
        "com.apple.developer.in-app-payments": ["merchant.com.wihy.app"]
      },
      "associatedDomains": ["applinks:auth.wihy.ai"]
    },
    
    "plugins": [
      "expo-camera",
      ["expo-image-picker", { 
        "photosPermission": "WIHY needs access to your photos",
        "cameraPermission": "WIHY needs camera access"
      }],
      ["@kingstinct/react-native-healthkit", { "background": true }],
      "expo-local-authentication",
      ["expo-build-properties", { "ios": { "deploymentTarget": "15.1" } }]
    ],
    
    "extra": {
      "eas": {
        "projectId": "a60de855-4859-40e4-9765-eff58cfa207d"
      }
    }
  }
}
```

### eas.json

EAS Build and Submit configuration:

```json
{
  "cli": {
    "version": ">= 15.0.0",
    "appVersionSource": "remote"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": { "simulator": true }
    },
    "development-device": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "channel": "preview"
    },
    "production": {
      "ios": { "autoIncrement": true },
      "channel": "production"
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "kortney.lee@snackingwell.com",
        "appleTeamId": "8FPA6366BC"
      }
    }
  }
}
```

**Key Settings:**
- `autoIncrement: true` - Automatically increments build number
- `channel: "production"` - For OTA updates
- `appleTeamId` - Your Apple Developer Team ID

### .env File (OAuth Credentials)

Create `mobile/.env` with your OAuth credentials:

```bash
# 📱 WIHY Native App (iOS/Android)
EXPO_PUBLIC_WIHY_NATIVE_CLIENT_ID=wihy_native_mk1waylu
EXPO_PUBLIC_WIHY_NATIVE_CLIENT_SECRET=PxAqbUr1YBR9SkwsLHBosWnC5VYfXFWq64EPSL4ZLBZqjqe5LA7xTJjIZ8gxAtOV

# 🔧 WIHY Services API (Backend)
EXPO_PUBLIC_WIHY_SERVICES_CLIENT_ID=wihy_services_mk1waylw
EXPO_PUBLIC_WIHY_SERVICES_CLIENT_SECRET=XZM4Xqm5WlcpSEJNMFC80saG1mH8BF0tOyRYLf70uz4ErhPMzqXw4DqEt9hMud54

# 🤖 WIHY ML Platform
EXPO_PUBLIC_WIHY_ML_CLIENT_ID=wihy_ml_mk1waylw
EXPO_PUBLIC_WIHY_ML_CLIENT_SECRET=FJw-fSnViiPBKe-6aELy1kNUs7Oznw2xWZxbJQkxZcVcWUCPnCM1mbnHL2TYhDcb

# 🌐 WIHY Frontend (Web)
EXPO_PUBLIC_WIHY_FRONTEND_CLIENT_ID=wihy_frontend_mk1waylx
EXPO_PUBLIC_WIHY_FRONTEND_CLIENT_SECRET=I2c8-jBdQE9a3KK_-IELHYZzBZWnpfGQuFQaq3Z6Owz_PDwPEaG9vKgbXqSyR25F
```

**⚠️ IMPORTANT:** This file contains secrets and should:
- ✅ Be added to `.gitignore`
- ❌ NEVER be committed to git
- ✅ Be manually created on each machine
- ✅ Be stored securely in CI/CD systems

---

## Development Workflow

### Start Development Server

```bash
cd mobile

# Clear cache and start
npx expo start --clear

# Start with tunnel (for external devices)
npx expo start --tunnel
```

### Run on iOS Simulator

```bash
# iOS Simulator
npx expo start --ios

# Or after starting server, press 'i'
```

### Run on Physical Device

1. Install **Expo Go** from App Store
2. From terminal after `npx expo start --clear`:
   - Scan QR code with iPhone camera
   - Opens in Expo Go automatically

**Note:** For HealthKit features, use a development build:

```bash
# Build development client for physical device
eas build --platform ios --profile development-device

# Then install via TestFlight link or download
```

### Development Build (Recommended for HealthKit)

```bash
# Build development client
eas build --platform ios --profile development-device

# Download and install via link provided
# Or scan QR code in TestFlight
```

---

## Building for iOS

### Build Profiles

| Profile | Use Case | Distribution |
|---------|----------|--------------|
| `development` | iOS Simulator testing | Internal |
| `development-device` | Physical device testing with HealthKit | Internal |
| `preview` | Internal testing/QA | Internal |
| `production` | App Store/TestFlight | Store |

### Production Build (TestFlight/App Store)

```bash
cd mobile

# Step 1: Commit your code
git add .
git commit -m "Release: v1.0.0 build 21"
git push

# Step 2: Build for production
eas build --platform ios --profile production
```

**What happens during build:**
1. EAS uploads your code to Expo servers
2. Native iOS project is generated from app.json
3. Xcode builds the app
4. IPA file is created and stored
5. You receive build URL and ID
6. Build number auto-increments (if configured)

**Build typically takes 5-15 minutes.**

### Monitor Build Progress

```bash
# Check build status
eas build:list --platform ios --limit 5

# View specific build logs
eas build:view <build-id>

# Or visit the URL provided during build
# https://expo.dev/accounts/wihy-ai/projects/wihy-ai/builds/<build-id>
```

---

## Submitting to TestFlight

### Submit Latest Build

```bash
eas submit --platform ios --latest
```

### Submit Specific Build

```bash
# First, find the build ID
eas build:list --platform ios

# Then submit
eas submit --platform ios --id <build-id>

# Example:
eas submit --platform ios --id 4943ca44-8060-458f-8170-1c4f8cb23902
```

### What Happens During Submit

1. EAS connects to App Store Connect via API
2. Authenticates with stored Apple credentials
3. Downloads IPA from Expo servers
4. Uploads to Apple's TestFlight servers
5. Apple processes the build (5-30 minutes)
6. Build appears in TestFlight for review/testing

### First-Time Submit Setup

On first submit, you may need to:
1. Provide Apple ID credentials
2. Complete 2FA authentication
3. Create App Store Connect API key

```bash
# If authentication fails, reconfigure credentials
eas credentials --platform ios
```

---

## App Store Connect Setup

### After Build is Processed

1. Go to https://appstoreconnect.apple.com
2. Select **WIHY** app
3. Go to **TestFlight** tab
4. You'll see your build under "iOS Builds"

### Add Internal Testers

1. TestFlight → Internal Testing
2. Click "+" under Testers
3. Add Apple ID emails
4. Send invites

**Internal testers:** Up to 100 people, no App Review needed

### Add External Testers

1. TestFlight → External Testing
2. Create a test group
3. Add build to group
4. Add testers or create public link
5. **Submit for Beta App Review** (required for external testers)

**External testers:** Up to 10,000 people, requires App Review

### Test Notes

Add what's new in each build:
1. Click on build version
2. Scroll to "What to Test?"
3. Add notes (e.g., "OAuth Google Sign-In", "HealthKit fixes")
4. Save

---

## Managing Builds

### List All Builds

```bash
eas build:list --platform ios

# Limit results
eas build:list --platform ios --limit 10
```

### Cancel Build in Progress

```bash
eas build:cancel <build-id>
```

### View Build Details

```bash
eas build:view <build-id>

# View full logs
eas build:view <build-id> --log
```

### Download IPA Locally

```bash
# Get IPA URL from build
eas build:list --platform ios

# Build URL format:
# https://expo.dev/artifacts/eas/<artifact-id>.ipa

# Download via curl
curl -o wihy.ipa "https://expo.dev/artifacts/eas/xxxxx.ipa"
```

---

## Troubleshooting

### Build Failures

**Check logs first:**
```bash
eas build:view <build-id> --log
```

**Common issues:**

| Error | Solution |
|-------|----------|
| "Missing provisioning profile" | EAS auto-creates; verify Apple Developer account is active |
| "Bundle ID mismatch" | Check `bundleIdentifier` in app.json matches App Store Connect |
| "Invalid entitlements" | Verify entitlements in app.json match your App ID capabilities |
| "CocoaPods error" | Run `npx expo prebuild --clean` then rebuild |
| "Pod install failed" | Check node_modules, try `rm -rf ios && npx expo prebuild` |

### Submit Failures

| Error | Solution |
|-------|----------|
| "Invalid credentials" | Run `eas credentials --platform ios` to update |
| "App not found in App Store Connect" | Create app via https://appstoreconnect.apple.com first |
| "Build number already exists" | Enable `autoIncrement: true` in eas.json or increment manually |
| "Missing capabilities" | Check App ID has all required capabilities enabled |

### Authentication Issues

```bash
# Re-login to EAS
eas logout
eas login

# Reconfigure Apple credentials
eas credentials --platform ios

# Clear cached auth
rm -rf ~/.app-store/auth
```

### Clean Rebuild

```bash
cd mobile

# Remove native folders
rm -rf ios node_modules

# Reinstall
npm install

# Rebuild
npx expo prebuild --clean
eas build --platform ios --profile production
```

---

## Quick Reference

### Essential Commands

```bash
# Development
npx expo start --clear              # Start dev server
npx expo start --tunnel             # Start with tunnel
npx expo start --ios                # Start and open simulator

# Building
eas build --platform ios --profile production      # Production build
eas build --platform ios --profile development-device  # Dev build (physical device)
eas build:list --platform ios                      # List builds
eas build:view <id>                                 # View build details
eas build:cancel <id>                               # Cancel build

# Submitting
eas submit --platform ios --latest                 # Submit latest
eas submit --platform ios --id <id>                # Submit specific

# Credentials & Auth
eas credentials --platform ios                     # Manage credentials
eas login                                          # Login to Expo
eas logout                                         # Logout
eas whoami                                         # Check login

# Utilities
npx expo prebuild --clean --platform ios          # Regenerate native iOS project
npx expo config --type public                     # Validate config
```

### Complete Release Workflow

```bash
# 1. Ensure code is ready and committed
git status
git add .
git commit -m "Release: v1.0.0 build 21"
git push

# 2. Build for production
cd mobile
eas build --platform ios --profile production

# 3. Wait for build to complete
# Watch progress at: https://expo.dev/accounts/wihy-ai/projects/wihy-ai/builds
# Or check status:
eas build:list --platform ios

# 4. Once build is done, submit to TestFlight
eas submit --platform ios --latest

# 5. Go to App Store Connect to add testers
# https://appstoreconnect.apple.com
```

---

## Current Project Status

| Item | Value |
|------|-------|
| Bundle ID | `com.wihy.app` |
| Apple Team ID | `8FPA6366BC` |
| App Store Connect ID | `6757577375` |
| Expo Project ID | `a60de855-4859-40e4-9765-eff58cfa207d` |
| Expo Owner | `wihy-ai` |
| Apple ID for Submit | `kortney.lee@snackingwell.com` |
| Current Version | 1.0.0 |
| Latest Build | #20 (Jan 13, 2026) |

---

## Environment Variables

The app requires OAuth credentials in `.env` file. These are loaded automatically:

```bash
EXPO_PUBLIC_WIHY_NATIVE_CLIENT_ID          # App client ID
EXPO_PUBLIC_WIHY_NATIVE_CLIENT_SECRET      # App client secret
EXPO_PUBLIC_WIHY_SERVICES_CLIENT_ID        # Services API client ID
EXPO_PUBLIC_WIHY_SERVICES_CLIENT_SECRET    # Services API secret
EXPO_PUBLIC_WIHY_ML_CLIENT_ID              # ML platform client ID
EXPO_PUBLIC_WIHY_ML_CLIENT_SECRET          # ML platform secret
EXPO_PUBLIC_WIHY_FRONTEND_CLIENT_ID        # Web client ID
EXPO_PUBLIC_WIHY_FRONTEND_CLIENT_SECRET    # Web client secret
```

**Note:** Environment variables prefixed with `EXPO_PUBLIC_` are included in the build. Keep secrets secure.

---

## Additional Resources

- [Expo Documentation](https://docs.expo.dev)
- [EAS Build Guide](https://docs.expo.dev/build/introduction/)
- [EAS Submit Guide](https://docs.expo.dev/submit/introduction/)
- [Apple Developer Documentation](https://developer.apple.com/documentation/)
- [App Store Connect Help](https://developer.apple.com/help/app-store-connect/)
- [TestFlight Documentation](https://developer.apple.com/testflight/)
- [WIHY iOS OAuth Guide](EXPO_IOS_OAUTH_SETUP.md)
- [WIHY OAuth Quick Start](IOS_OAUTH_QUICK_START.md)
