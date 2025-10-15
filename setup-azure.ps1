# Azure Container Apps Setup Script for PowerShell
# Run this script to set up Azure authentication for GitHub Actions

Write-Host "🚀 Setting up Azure Container Apps deployment..." -ForegroundColor Green

# Check if Azure CLI is installed
if (!(Get-Command az -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Azure CLI not found. Please install it first:" -ForegroundColor Red
    Write-Host "   https://docs.microsoft.com/en-us/cli/azure/install-azure-cli" -ForegroundColor Yellow
    exit 1
}

# Login to Azure
Write-Host "🔐 Logging into Azure..." -ForegroundColor Blue
az login

# Get subscription info
$SUBSCRIPTION_ID = az account show --query id -o tsv
$TENANT_ID = az account show --query tenantId -o tsv

Write-Host "📋 Current Azure context:" -ForegroundColor Cyan
Write-Host "   Subscription ID: $SUBSCRIPTION_ID" -ForegroundColor White
Write-Host "   Tenant ID: $TENANT_ID" -ForegroundColor White

# Create service principal
Write-Host "🔧 Creating service principal for GitHub Actions..." -ForegroundColor Blue
$APP_NAME = "wihy-ui-github-actions"
$RESOURCE_GROUP = "rg-wihy"

# Create the service principal
$SP_OUTPUT = az ad sp create-for-rbac `
  --name $APP_NAME `
  --role contributor `
  --scopes "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP" `
  --query "{clientId: appId, clientSecret: password, subscriptionId: '$SUBSCRIPTION_ID', tenantId: tenant}" `
  -o json | ConvertFrom-Json

$CLIENT_ID = $SP_OUTPUT.clientId
$CLIENT_SECRET = $SP_OUTPUT.clientSecret

Write-Host "✅ Service principal created!" -ForegroundColor Green

# Set up federated credential for OIDC
Write-Host "🔗 Setting up federated credential for OIDC..." -ForegroundColor Blue
$federatedCredParams = @{
    name = "wihy-ui-main"
    issuer = "https://token.actions.githubusercontent.com"
    subject = "repo:kortney-lee/wihy_ui:ref:refs/heads/main"
    audiences = @("api://AzureADTokenExchange")
} | ConvertTo-Json -Compress

az ad app federated-credential create --id $CLIENT_ID --parameters $federatedCredParams

# Get container registry password
Write-Host "🔐 Getting container registry password..." -ForegroundColor Blue
try {
    $REGISTRY_PASSWORD = az acr credential show --name wihy --query "passwords[0].value" -o tsv
} catch {
    $REGISTRY_PASSWORD = "REGISTRY_NOT_FOUND"
}

Write-Host ""
Write-Host "🎉 Setup complete! Add these secrets to GitHub:" -ForegroundColor Green
Write-Host "   Go to: https://github.com/kortney-lee/wihy_ui/settings/secrets/actions" -ForegroundColor Yellow
Write-Host ""
Write-Host "   AZURE_CLIENT_ID:       $CLIENT_ID" -ForegroundColor White
Write-Host "   AZURE_TENANT_ID:       $TENANT_ID" -ForegroundColor White
Write-Host "   AZURE_SUBSCRIPTION_ID: $SUBSCRIPTION_ID" -ForegroundColor White
Write-Host "   REGISTRY_PASSWORD:     $REGISTRY_PASSWORD" -ForegroundColor White
Write-Host ""

if ($REGISTRY_PASSWORD -eq "REGISTRY_NOT_FOUND") {
    Write-Host "⚠️  Container registry 'wihy' not found. You may need to:" -ForegroundColor Yellow
    Write-Host "   1. Create the registry: az acr create --name wihy --resource-group $RESOURCE_GROUP --sku Basic" -ForegroundColor White
    Write-Host "   2. Enable admin access: az acr update --name wihy --admin-enabled true" -ForegroundColor White
}

Write-Host "📝 After adding secrets, re-enable the workflow by uncommenting the push trigger in:" -ForegroundColor Cyan
Write-Host "   .github/workflows/azure-container-apps.yml" -ForegroundColor White