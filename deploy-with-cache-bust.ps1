# Cache Busting Deployment Script for Windows PowerShell
# Run this script after each deployment to force client cache refresh

Write-Host "🚀 Starting cache-busting deployment..." -ForegroundColor Green

# 1. Update cache version in API config
$configFile = "client/src/config/apiConfig.ts"
$content = Get-Content $configFile -Raw

# Extract current version
$currentVersion = if ($content -match "CACHE_VERSION = '(v[\d\.]+)'") { $matches[1] } else { "v2.0.0" }
Write-Host "📦 Current cache version: $currentVersion" -ForegroundColor Yellow

# Generate new version (increment patch number)
$versionParts = $currentVersion.Substring(1).Split('.')
$versionParts[2] = [int]$versionParts[2] + 1
$newVersion = "v" + ($versionParts -join '.')
Write-Host "📦 New cache version: $newVersion" -ForegroundColor Yellow

# Update the version in apiConfig.ts
$content = $content -replace "CACHE_VERSION = '$currentVersion'", "CACHE_VERSION = '$newVersion'"
Set-Content -Path $configFile -Value $content
Write-Host "✅ Updated cache version in apiConfig.ts" -ForegroundColor Green

# 2. Build the application
Write-Host "🔨 Building application..." -ForegroundColor Cyan
Set-Location client
npm run build
Set-Location ..

# 3. Deploy (add your deployment commands here)
Write-Host "🚀 Ready for deployment..." -ForegroundColor Green
Write-Host "📝 Add your deployment commands here" -ForegroundColor White
# Add your deployment commands here
# Example: 
# Copy-Item -Path "client/build/*" -Destination "\\server\share\www\" -Recurse -Force

Write-Host "✅ Cache busting preparation complete!" -ForegroundColor Green
Write-Host "📱 After deployment, mobile users will see updated configuration" -ForegroundColor White
Write-Host "🔍 New cache version: $newVersion" -ForegroundColor Yellow