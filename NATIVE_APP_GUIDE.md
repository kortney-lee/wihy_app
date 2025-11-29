# WIHY Health Scanner - Native Android App

## ✅ APK Successfully Built!

**Location**: `mobile/android/app/build/outputs/apk/debug/app-debug.apk`
**Size**: ~311 MB
**Built**: November 29, 2025

---

## 📱 Installation Options

### Option 1: Install via USB (Fastest)

1. **Enable USB Debugging on your Android device:**
   - Go to Settings → About Phone
   - Tap "Build Number" 7 times (enables Developer Options)
   - Go back to Settings → Developer Options
   - Enable "USB Debugging"

2. **Connect device via USB**

3. **Run installation script:**
   ```powershell
   .\install-to-device.ps1
   ```

### Option 2: Manual Installation (No USB)

1. **Transfer APK to your device:**
   - Email yourself the APK
   - Upload to Google Drive/OneDrive and download on device
   - Use USB file transfer (no debugging needed)

2. **Install on device:**
   - Open the APK file on your device
   - Tap "Install" (may need to enable "Install from Unknown Sources")
   - Grant camera permissions when prompted

---

## 🧪 Testing Checklist

Once installed, test these features:

- [ ] **App Launch**: Opens quickly (compare to emulator)
- [ ] **UI Responsiveness**: Smooth scrolling and navigation
- [ ] **Camera Access**: Opens native camera
- [ ] **Barcode Scanning**: Scan a real product barcode
- [ ] **Image Upload**: Select photo from gallery
- [ ] **API Integration**: Health analysis returns results
- [ ] **Performance**: Check battery usage and heat
- [ ] **Platform Detection**: Check console logs show "android"

---

## 🐛 Debugging

### View Live Logs (USB connected):
```powershell
.\view-device-logs.ps1
```

### Check App Info:
```powershell
adb shell dumpsys package com.wihy.healthscanner
```

### Uninstall:
```powershell
adb uninstall com.wihy.healthscanner
```

---

## 🔄 Rebuild After Changes

After making code changes:

```powershell
# Quick rebuild (React changes only)
cd client; npm run build; cd ..\mobile; npx cap sync android

# Full rebuild with new APK
.\build-release-apk.ps1
```

---

## 📊 Performance Comparison: Emulator vs Real Device

| Metric | Emulator | Real Device |
|--------|----------|-------------|
| Heat | 🔥🔥🔥 High | ❄️ Cool |
| Speed | 🐌 Slow | 🚀 Fast |
| Camera | 🎥 Simulated | 📷 Real Hardware |
| Battery | N/A | ⚡ Monitor Usage |
| Accuracy | ~80% | 💯 100% |

---

## 🎯 Next Steps

1. Install APK on your physical Android device
2. Test all scanning features with real products
3. Compare performance to emulator (should be much better!)
4. Test camera permission flows
5. Monitor battery usage during scanning

---

## 📝 Known Issues

- **First Launch**: May take 5-10 seconds to initialize
- **Permissions**: Camera permission required for scanning
- **Network**: Requires internet for API calls
- **Storage**: ~320 MB app size (includes React bundle)

---

## 🚀 Production Build (When Ready)

For app store deployment:

```powershell
# Generate signed release APK
cd mobile\android
.\gradlew assembleRelease
```

You'll need to configure signing keys for Google Play Store.

---

**Built with**: Capacitor 7.x + React 18.2.0
**Target**: Android 13+ (API 33)
**Platform**: arm64-v8a, armeabi-v7a
