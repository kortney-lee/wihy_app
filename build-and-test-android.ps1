# WIHY Health Scanner - Android Build & Test Script
# Usage: .\build-and-test-android.ps1

Write-Host "🏗️  Building WIHY for Android..." -ForegroundColor Cyan
Write-Host ""

# Step 1: Build React app
Write-Host "📦 Step 1: Building React production bundle..." -ForegroundColor Yellow
Set-Location client
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ React build failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ React build complete!" -ForegroundColor Green
Write-Host ""

# Step 2: Sync to Android
Write-Host "🔄 Step 2: Syncing to Android native project..." -ForegroundColor Yellow
Set-Location ..\mobile
npx cap sync android

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Capacitor sync failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Sync complete!" -ForegroundColor Green
Write-Host ""

# Step 3: Open in Android Studio
Write-Host "🚀 Step 3: Opening Android Studio..." -ForegroundColor Yellow
Write-Host ""
Write-Host "📱 Next steps in Android Studio:" -ForegroundColor Cyan
Write-Host "   1. Wait for Gradle sync to complete" -ForegroundColor White
Write-Host "   2. Start your Android emulator (Device Manager)" -ForegroundColor White
Write-Host "   3. Click the green ▶️ Run button" -ForegroundColor White
Write-Host ""

# Try to open Android Studio
$androidStudioPath = "C:\Program Files\Android\Android Studio\bin\studio64.exe"
if (Test-Path $androidStudioPath) {
    Start-Process $androidStudioPath -ArgumentList "$PSScriptRoot\mobile\android"
    Write-Host "✅ Android Studio opened!" -ForegroundColor Green
} else {
    Write-Host "⚠️  Please open Android Studio manually and open:" -ForegroundColor Yellow
    Write-Host "   $PSScriptRoot\mobile\android" -ForegroundColor White
}

# Return to root directory
Set-Location ..
