# Android Build Commands

## Build Debug APK

### PowerShell Command
```powershell
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"; cd c:\repo\wihy_ui_clean\mobile\android; .\gradlew assembleDebug
```

### Step-by-Step
1. Set JAVA_HOME to Android Studio's bundled JDK:
   ```powershell
   $env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
   ```

2. Navigate to Android project directory:
   ```powershell
   cd c:\repo\wihy_ui_clean\mobile\android
   ```

3. Build the debug APK:
   ```powershell
   .\gradlew assembleDebug
   ```

### Output Location
The APK will be created at:
```
mobile/android/app/build/outputs/apk/debug/app-debug.apk
```

## Quick Build & Sync Workflow

### 1. Build React App
```powershell
cd c:\repo\wihy_ui_clean\client
npm run build
```

### 2. Sync to Android
```powershell
cd c:\repo\wihy_ui_clean\mobile
npx cap sync android
```

### 3. Build APK
```powershell
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
cd c:\repo\wihy_ui_clean\mobile\android
.\gradlew assembleDebug
```

## Alternative: Use Android Studio

1. Open project in Android Studio:
   ```powershell
   cd c:\repo\wihy_ui_clean\mobile
   npx cap open android
   ```

2. In Android Studio:
   - Wait for Gradle sync
   - Build → Build Bundle(s) / APK(s) → Build APK(s)
   - Or click Run button to install on device

## Install to Device

### Via ADB
```powershell
adb install mobile/android/app/build/outputs/apk/debug/app-debug.apk
```

### Via PowerShell Script
```powershell
.\install-to-device.ps1
```
