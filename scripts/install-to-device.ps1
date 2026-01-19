# Install APK to Connected Android Device via USB
# Connect your device with USB debugging enabled first

Write-Host "📱 Installing WiHY to Android Device" -ForegroundColor Cyan
Write-Host ""

$apkPath = "c:\repo\wihy_ui_clean\mobile\android\app\build\outputs\apk\debug\app-debug.apk"

# Check if APK exists
if (-not (Test-Path $apkPath)) {
    Write-Host "❌ APK not found! Run build-release-apk.ps1 first" -ForegroundColor Red
    exit 1
}

# Check if device is connected
Write-Host "🔍 Checking for connected devices..." -ForegroundColor Yellow
adb devices
Write-Host ""

$devices = adb devices | Select-String "device$"
if ($devices.Count -eq 0) {
    Write-Host "❌ No devices found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "1. Connect your Android device via USB"
    Write-Host "2. Enable Developer Options:"
    Write-Host "   - Settings > About Phone > Tap 'Build Number' 7 times"
    Write-Host "3. Enable USB Debugging:"
    Write-Host "   - Settings > Developer Options > USB Debugging"
    Write-Host "4. Accept USB debugging prompt on device"
    Write-Host "5. Run this script again"
    Write-Host ""
    exit 1
}

Write-Host "✅ Device detected!" -ForegroundColor Green
Write-Host ""
Write-Host "📦 Installing APK..." -ForegroundColor Yellow
Write-Host "This will:"
Write-Host "  - Uninstall previous version (if exists)"
Write-Host "  - Install new version"
Write-Host "  - Preserve app data"
Write-Host ""

adb install -r $apkPath

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ INSTALLATION SUCCESSFUL!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🎉 WiHY is now installed on your device!" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "📋 Next Steps:" -ForegroundColor Yellow
    Write-Host "1. Open the app on your device"
    Write-Host "2. Grant camera permissions when prompted"
    Write-Host "3. Test barcode scanning with a real product"
    Write-Host "4. Compare performance to emulator"
    Write-Host ""
    Write-Host "🐛 Debug Logs:" -ForegroundColor Yellow
    Write-Host "   Run: adb logcat | Select-String 'WIHY'"
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "❌ Installation failed!" -ForegroundColor Red
    Write-Host "Try:" -ForegroundColor Yellow
    Write-Host "1. Manually uninstall the app from device"
    Write-Host "2. Run this script again"
    Write-Host "3. Check device storage space"
    Write-Host ""
}
