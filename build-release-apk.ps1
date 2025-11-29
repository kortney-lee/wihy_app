# Build Release APK for Physical Device Testing

Write-Host "Building WiHY - Release APK" -ForegroundColor Cyan
Write-Host ""

# Step 1: Build React app
Write-Host "Step 1/4: Building React production bundle..." -ForegroundColor Yellow
Set-Location "c:\repo\wihy_ui_clean\client"
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "React build failed!" -ForegroundColor Red
    exit 1
}
Write-Host "React build complete" -ForegroundColor Green
Write-Host ""

# Step 2: Sync to Android
Write-Host "Step 2/4: Syncing to Android project..." -ForegroundColor Yellow
Set-Location "c:\repo\wihy_ui_clean\mobile"
npx cap sync android
if ($LASTEXITCODE -ne 0) {
    Write-Host "Capacitor sync failed!" -ForegroundColor Red
    exit 1
}
Write-Host "Sync complete" -ForegroundColor Green
Write-Host ""

# Step 3: Generate debug keystore if needed
Write-Host "Step 3/4: Checking for debug keystore..." -ForegroundColor Yellow
$keystorePath = "c:\repo\wihy_ui_clean\mobile\android\app\debug.keystore"
if (-not (Test-Path $keystorePath)) {
    Write-Host "Creating debug keystore..." -ForegroundColor Yellow
    keytool -genkey -v -keystore $keystorePath -storepass android -alias androiddebugkey -keypass android -keyalg RSA -keysize 2048 -validity 10000 -dname "CN=Android Debug,O=Android,C=US"
}
Write-Host "Keystore ready" -ForegroundColor Green
Write-Host ""

# Step 4: Build APK
Write-Host "Step 4/4: Building release APK..." -ForegroundColor Yellow
Write-Host "This may take 2-5 minutes on first build..." -ForegroundColor Gray
Set-Location "c:\repo\wihy_ui_clean\mobile\android"

# Use gradlew to build
.\gradlew assembleDebug
if ($LASTEXITCODE -ne 0) {
    Write-Host "APK build failed!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "BUILD SUCCESSFUL!" -ForegroundColor Green
Write-Host ""
Write-Host "APK Location:" -ForegroundColor Cyan
Write-Host "mobile/android/app/build/outputs/apk/debug/app-debug.apk" -ForegroundColor White
Write-Host ""
Write-Host "Installation Instructions:" -ForegroundColor Yellow
Write-Host "1. Copy APK to your Android device" -ForegroundColor White
Write-Host "2. Enable Unknown Sources in device settings" -ForegroundColor White
Write-Host "3. Open the APK file to install" -ForegroundColor White
Write-Host "4. Grant camera permissions when prompted" -ForegroundColor White
Write-Host ""
Write-Host "Quick Install (USB connected):" -ForegroundColor Yellow
Write-Host "Run: install-to-device.ps1" -ForegroundColor White
Write-Host ""
