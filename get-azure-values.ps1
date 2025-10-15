# Quick Azure Values Collection Script
# Run this to get all the values you need for GitHub secrets
# ⚠️ IMPORTANT: This project uses the 'vhealth' resource group in West US 2

Write-Host "🔍 Collecting Azure values for GitHub secrets..." -ForegroundColor Green
Write-Host "📍 Using resource group: vhealth (West US 2)" -ForegroundColor Cyan
Write-Host ""

# Check if logged in
try {
    $account = az account show 2>$null | ConvertFrom-Json
    if (!$account) {
        Write-Host "❌ Not logged into Azure. Running 'az login'..." -ForegroundColor Red
        az login
        $account = az account show | ConvertFrom-Json
    }
} catch {
    Write-Host "❌ Azure CLI not found or not logged in. Please install Azure CLI and run 'az login'" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Logged in as: $($account.user.name)" -ForegroundColor Green
Write-Host ""

# Get basic values
$SUBSCRIPTION_ID = $account.id
$TENANT_ID = $account.tenantId

Write-Host "📋 Basic Azure Information:" -ForegroundColor Cyan
Write-Host "   Subscription ID: $SUBSCRIPTION_ID" -ForegroundColor White
Write-Host "   Tenant ID: $TENANT_ID" -ForegroundColor White
Write-Host ""

# Check if service principal exists
Write-Host "🔍 Checking for existing service principal..." -ForegroundColor Blue
$APP_NAME = "wihy-ui-github-actions"
$RESOURCE_GROUP = "vhealth"  # Always use vhealth resource group
$existing_sp = az ad sp list --display-name $APP_NAME --query "[0].appId" -o tsv 2>$null

if ($existing_sp -and $existing_sp -ne "null" -and $existing_sp.Trim() -ne "") {
    $CLIENT_ID = $existing_sp
    Write-Host "✅ Found existing service principal: $CLIENT_ID" -ForegroundColor Green
} else {
    Write-Host "⚠️  Service principal '$APP_NAME' not found." -ForegroundColor Yellow
    Write-Host "   Create it with:" -ForegroundColor White
    Write-Host "   az ad sp create-for-rbac --name `"$APP_NAME`" --role contributor --scopes `"/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP`"" -ForegroundColor Gray
    $CLIENT_ID = "NOT_CREATED_YET"
}

# Get registry password
Write-Host "🔐 Getting container registry password..." -ForegroundColor Blue
try {
    $REGISTRY_PASSWORD = az acr credential show --name wihymlregistry --query "passwords[0].value" -o tsv 2>$null
    if ($REGISTRY_PASSWORD -and $REGISTRY_PASSWORD -ne "null") {
        Write-Host "✅ Found registry password for wihymlregistry" -ForegroundColor Green
    } else {
        throw "Registry not found"
    }
} catch {
    Write-Host "⚠️  Container registry 'wihymlregistry' not found or no access." -ForegroundColor Yellow
    Write-Host "   Check access to vhealth resource group" -ForegroundColor White
    $REGISTRY_PASSWORD = "REGISTRY_NOT_FOUND"
}

Write-Host ""
Write-Host "🎯 GitHub Secrets to Add:" -ForegroundColor Green
Write-Host "   Go to: https://github.com/kortney-lee/wihy_ui/settings/secrets/actions" -ForegroundColor Yellow
Write-Host ""
Write-Host "   Secret Name                Value" -ForegroundColor Cyan
Write-Host "   ================================" -ForegroundColor Cyan
Write-Host "   AZURE_SUBSCRIPTION_ID      $SUBSCRIPTION_ID" -ForegroundColor White
Write-Host "   AZURE_TENANT_ID            $TENANT_ID" -ForegroundColor White
Write-Host "   AZURE_CLIENT_ID            $CLIENT_ID" -ForegroundColor White
Write-Host "   REGISTRY_PASSWORD          $REGISTRY_PASSWORD" -ForegroundColor White
Write-Host ""

if ($CLIENT_ID -eq "NOT_CREATED_YET") {
    Write-Host "❗ Next step: Create the service principal first!" -ForegroundColor Red
    Write-Host "   Run this command:" -ForegroundColor White
    Write-Host "   az ad sp create-for-rbac --name `"wihy-ui-github-actions`" --role contributor --scopes `"/subscriptions/$SUBSCRIPTION_ID/resourceGroups/rg-wihy`"" -ForegroundColor Gray
} elseif ($REGISTRY_PASSWORD -eq "REGISTRY_NOT_FOUND") {
    Write-Host "❗ Next step: Create the container registry!" -ForegroundColor Red
} else {
    Write-Host "🎉 All values ready! Add them to GitHub secrets and you're good to go!" -ForegroundColor Green
}