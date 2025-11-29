# Quick Development Build Script
# Builds React app and syncs to mobile WITHOUT opening Android Studio
# Useful for iterative development

Write-Host "⚡ Quick build for mobile testing..." -ForegroundColor Cyan

# Build and sync
Set-Location client
npm run build
Set-Location ..\mobile
npx cap sync android
Set-Location ..

Write-Host "✅ Build synced! Now run the app from Android Studio." -ForegroundColor Green
