# Set GitHub Secrets for WIHY OAuth Credentials
# Run this script to push all OAuth credentials to GitHub repository secrets
# Usage: .\set-github-secrets.ps1

Write-Host "Setting GitHub Secrets for WIHY OAuth Credentials..." -ForegroundColor Cyan
Write-Host ""

# Check if gh CLI is installed
if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
    Write-Host "Error: GitHub CLI (gh) is not installed." -ForegroundColor Red
    Write-Host "Install it from: https://cli.github.com/" -ForegroundColor Yellow
    exit 1
}

# Check if user is authenticated
$authStatus = gh auth status 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Not authenticated with GitHub CLI." -ForegroundColor Red
    Write-Host "Run: gh auth login" -ForegroundColor Yellow
    exit 1
}

Write-Host "GitHub CLI is ready" -ForegroundColor Green
Write-Host ""

# Define secrets
$secrets = @{
    # Native App (iOS/Android)
    "WIHY_NATIVE_CLIENT_ID" = "wihy_native_mk1waylu"
    "WIHY_NATIVE_CLIENT_SECRET" = "PxAqbUr1YBR9SkwsLHBosWnC5VYfXFWq64EPSL4ZLBZqjqe5LA7xTJjIZ8gxAtOV"
    
    # Services API (Backend)
    "WIHY_SERVICES_CLIENT_ID" = "wihy_services_mk1waylw"
    "WIHY_SERVICES_CLIENT_SECRET" = "XZM4Xqm5WlcpSEJNMFC80saG1mH8BF0tOyRYLf70uz4ErhPMzqXw4DqEt9hMud54"
    
    # ML Platform
    "WIHY_ML_CLIENT_ID" = "wihy_ml_mk1waylw"
    "WIHY_ML_CLIENT_SECRET" = "FJw-fSnViiPBKe-6aELy1kNUs7Oznw2xWZxbJQkxZcVcWUCPnCM1mbnHL2TYhDcb"
    
    # Frontend (Web)
    "WIHY_FRONTEND_CLIENT_ID" = "wihy_frontend_mk1waylx"
    "WIHY_FRONTEND_CLIENT_SECRET" = "I2c8-jBdQE9a3KK_-IELHYZzBZWnpfGQuFQaq3Z6Owz_PDwPEaG9vKgbXqSyR25F"
    
    # Also set with REACT_APP_ and EXPO_PUBLIC_ prefixes for different environments
    "REACT_APP_WIHY_FRONTEND_CLIENT_ID" = "wihy_frontend_mk1waylx"
    "REACT_APP_WIHY_FRONTEND_CLIENT_SECRET" = "I2c8-jBdQE9a3KK_-IELHYZzBZWnpfGQuFQaq3Z6Owz_PDwPEaG9vKgbXqSyR25F"
    
    "EXPO_PUBLIC_WIHY_FRONTEND_CLIENT_ID" = "wihy_frontend_mk1waylx"
    "EXPO_PUBLIC_WIHY_FRONTEND_CLIENT_SECRET" = "I2c8-jBdQE9a3KK_-IELHYZzBZWnpfGQuFQaq3Z6Owz_PDwPEaG9vKgbXqSyR25F"
}

$successCount = 0
$failCount = 0

# Set each secret
foreach ($secretName in $secrets.Keys) {
    Write-Host "Setting secret: $secretName..." -ForegroundColor Yellow
    
    try {
        $secretValue = $secrets[$secretName]
        echo $secretValue | gh secret set $secretName
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  Success: $secretName set successfully" -ForegroundColor Green
            $successCount++
        } else {
            Write-Host "  Failed to set $secretName" -ForegroundColor Red
            $failCount++
        }
    }
    catch {
        Write-Host "  Error setting $secretName : $_" -ForegroundColor Red
        $failCount++
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Summary:" -ForegroundColor Cyan
Write-Host "  Successful: $successCount" -ForegroundColor Green
Write-Host "  Failed: $failCount" -ForegroundColor Red
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if ($failCount -eq 0) {
    Write-Host "All secrets have been set successfully!" -ForegroundColor Green
} else {
    Write-Host "Some secrets failed to set. Please review the errors above." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "To view your secrets, run: gh secret list" -ForegroundColor Cyan
