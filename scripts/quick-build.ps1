# Quick Development Build Script
# Starts Expo development server in mobile directory
# Useful for iterative development

Write-Host "⚡ Starting Expo development server..." -ForegroundColor Cyan

# Navigate to mobile and start Expo
Set-Location mobile
npx expo start
Set-Location ..

Write-Host "✅ Expo server started!" -ForegroundColor Green
