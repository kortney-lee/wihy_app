# app.json Changes for Apple App Store / TestFlight

**Last Updated:** January 8, 2026  
**Purpose:** Document required `app.json` modifications for iOS App Store submission

---

## Overview

The following changes need to be applied to `app.json` before submitting to Apple App Store or TestFlight. These changes are Apple-specific and should be applied when building for iOS distribution.

---

## Required Changes

### 1. Add Export Compliance Declaration

Add `ITSAppUsesNonExemptEncryption` to the iOS infoPlist to avoid App Store Connect questionnaire delays:

```json
"ios": {
  "infoPlist": {
    "ITSAppUsesNonExemptEncryption": false,
    // ... other keys
  }
}
```

**Why:** Apple requires apps to declare if they use encryption. Setting this to `false` indicates the app only uses standard HTTPS/TLS encryption (exempt from export regulations).

---

### 2. Add EAS Updates Configuration

Add runtime version and updates URL for over-the-air updates:

```json
"runtimeVersion": {
  "policy": "appVersion"
},
"updates": {
  "url": "https://u.expo.dev/a60de855-4859-40e4-9765-eff58cfa207d"
}
```

**Why:** Enables Expo Updates for pushing JavaScript bundle updates without going through App Store review (for non-native changes).

---

### 3. Duplicate Associated Domain (Optional Cleanup)

The current config has a duplicate entry that should be consolidated:

**Current (with duplicate):**
```json
"associatedDomains": [
  "applinks:auth.wihy.ai",
  "applinks:auth.wihy.ai"
]
```

**Should be:**
```json
"associatedDomains": [
  "applinks:auth.wihy.ai"
]
```

---

### 4. Android Permissions Format (Cross-Platform Note)

For consistency, Android permissions can use either short or full format:

**Short format (current):**
```json
"permissions": [
  "CAMERA",
  "READ_MEDIA_IMAGES"
]
```

**Full format (alternative):**
```json
"permissions": [
  "android.permission.CAMERA",
  "android.permission.READ_MEDIA_IMAGES"
]
```

Both formats work. The short format is cleaner; full format is more explicit.

---

## Complete iOS Section (Recommended)

Here's the complete recommended `ios` section for App Store submission:

```json
"ios": {
  "supportsTablet": true,
  "usesIcloudStorage": false,
  "infoPlist": {
    "ITSAppUsesNonExemptEncryption": false,
    "NSCameraUsageDescription": "WiHY uses the camera to scan barcodes and capture food photos for analysis.",
    "NSMicrophoneUsageDescription": "WiHY uses the microphone for audio capture in health interactions.",
    "NSPhotoLibraryUsageDescription": "WiHY needs photo library access to select images for analysis.",
    "NSPhotoLibraryAddUsageDescription": "WiHY saves analysis-related images to your library when you choose to export.",
    "NSContactsUsageDescription": "WiHY uses contacts to personalize and share health insights with people you select.",
    "NSHealthShareUsageDescription": "WiHY reads your Health data including steps, distance, calories, heart rate, weight, sleep, and exercise time to provide personalized fitness and nutrition insights.",
    "NSHealthUpdateUsageDescription": "WiHY writes workout and nutrition data to Apple Health to keep your health data synchronized."
  },
  "entitlements": {
    "com.apple.developer.healthkit": true,
    "com.apple.developer.in-app-payments": true
  },
  "bundleIdentifier": "com.wihy.app",
  "associatedDomains": [
    "applinks:auth.wihy.ai"
  ]
}
```

---

## Pre-Submission Checklist

Before submitting to TestFlight/App Store:

- [ ] Add `ITSAppUsesNonExemptEncryption: false` to infoPlist
- [ ] Verify `bundleIdentifier` matches Apple Developer account
- [ ] Ensure all `NS*UsageDescription` keys have user-friendly descriptions
- [ ] Configure EAS Updates if using OTA updates
- [ ] Remove duplicate `associatedDomains` entries
- [ ] Enroll in Apple Developer Program ($99/year) - **Required for TestFlight**

---

## Apple Developer Program Requirement

⚠️ **Important:** TestFlight and App Store distribution require an active Apple Developer Program membership.

- **Cost:** $99/year
- **Enrollment:** https://developer.apple.com/programs/enroll/
- **Current Status:** Account `kortney@wihy.ai` needs enrollment

Without enrollment, you can only run the app on simulators or your own devices via Xcode.

---

## Related Files

- [MACOS_IOS_SETUP.md](./MACOS_IOS_SETUP.md) - Complete iOS development setup guide
- [eas.json](./eas.json) - EAS Build configuration
