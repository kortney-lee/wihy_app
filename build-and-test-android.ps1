# WIHY Health Scanner - Android Build & Test Script
# Usage: .\build-and-test-android.ps1

Write-Host "🏗️  Building WIHY for Android..." -ForegroundColor Cyan
Write-Host ""

# Step 1: Navigate to mobile directory
Write-Host "📱 Step 1: Navigating to mobile directory..." -ForegroundColor Yellow
Set-Location mobile

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to navigate to mobile directory!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Directory set!" -ForegroundColor Green
Write-Host ""

# Step 2: Start Expo development server
Write-Host "🚀 Step 2: Starting Expo development server..." -ForegroundColor Yellow
npx expo start

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Expo start failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Expo server started!" -ForegroundColor Green
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
