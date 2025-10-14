# WIHY UI - Complete Azure Deployment Script (PowerShell)
# Run this script to deploy your containerized React app to Azure Container Apps

param(
    [string]$ResourceGroup = "rg-wihy",
    [string]$Location = "eastus",
    [string]$ContainerAppEnv = "wihy-env",
    [string]$ContainerAppName = "wihy-ui",
    [string]$ImageName = "wihy-ui"
)

Write-Host "🚀 WIHY UI - Azure Container Apps Deployment" -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Green

# Generate unique registry name
$RegistryName = "wihyregistry$(Get-Date -Format 'yyyyMMddHHmm')"

Write-Host "📋 Configuration:" -ForegroundColor Yellow
Write-Host "   Resource Group: $ResourceGroup"
Write-Host "   Location: $Location"
Write-Host "   Registry: $RegistryName"
Write-Host "   Container App: $ContainerAppName"
Write-Host ""

try {
    # Step 1: Login to Azure
    Write-Host "🔐 Step 1: Login to Azure..." -ForegroundColor Cyan
    az login --use-device-code
    
    # Step 2: Create Resource Group
    Write-Host "📁 Step 2: Creating resource group..." -ForegroundColor Cyan
    az group create --name $ResourceGroup --location $Location
    
    # Step 3: Create Container Registry
    Write-Host "📦 Step 3: Creating Azure Container Registry..." -ForegroundColor Cyan
    az acr create --resource-group $ResourceGroup --name $RegistryName --sku Basic --admin-enabled true
    
    # Get registry login server
    $RegistryServer = az acr show --name $RegistryName --resource-group $ResourceGroup --query loginServer --output tsv
    Write-Host "   Registry Server: $RegistryServer" -ForegroundColor Green
    
    # Step 4: Build and Push Container
    Write-Host "🐳 Step 4: Building and pushing container..." -ForegroundColor Cyan
    
    # Login to ACR
    az acr login --name $RegistryName
    
    # Build and tag image
    Write-Host "   Building Docker image..." -ForegroundColor Yellow
    docker build -t "$RegistryServer/$ImageName`:latest" .
    
    # Push to registry
    Write-Host "   Pushing to registry..." -ForegroundColor Yellow
    docker push "$RegistryServer/$ImageName`:latest"
    
    Write-Host "   ✅ Container pushed to: $RegistryServer/$ImageName`:latest" -ForegroundColor Green
    
    # Step 5: Create Container Apps Environment
    Write-Host "🌐 Step 5: Creating Container Apps environment..." -ForegroundColor Cyan
    az containerapp env create --name $ContainerAppEnv --resource-group $ResourceGroup --location $Location
    
    # Step 6: Deploy Container App
    Write-Host "🚀 Step 6: Deploying Container App..." -ForegroundColor Cyan
    
    # Get registry credentials
    $RegistryUsername = az acr credential show --name $RegistryName --query username --output tsv
    $RegistryPassword = az acr credential show --name $RegistryName --query passwords[0].value --output tsv
    
    az containerapp create `
        --name $ContainerAppName `
        --resource-group $ResourceGroup `
        --environment $ContainerAppEnv `
        --image "$RegistryServer/$ImageName`:latest" `
        --target-port 80 `
        --ingress external `
        --registry-server $RegistryServer `
        --registry-username $RegistryUsername `
        --registry-password $RegistryPassword `
        --min-replicas 0 `
        --max-replicas 10 `
        --cpu 0.25 `
        --memory 0.5Gi
    
    # Step 7: Get App URL
    Write-Host "🎉 Step 7: Deployment complete!" -ForegroundColor Green
    $AppUrl = az containerapp show --name $ContainerAppName --resource-group $ResourceGroup --query properties.configuration.ingress.fqdn --output tsv
    
    Write-Host ""
    Write-Host "✅ SUCCESS! Your app is deployed:" -ForegroundColor Green
    Write-Host "   🌐 App URL: https://$AppUrl" -ForegroundColor White
    Write-Host "   🔍 Health Check: https://$AppUrl/health" -ForegroundColor White
    Write-Host "   📊 Azure Portal: https://portal.azure.com" -ForegroundColor White
    Write-Host ""
    Write-Host "🔧 Useful commands:" -ForegroundColor Yellow
    Write-Host "   View logs: az containerapp logs show --name $ContainerAppName --resource-group $ResourceGroup --follow"
    Write-Host "   Update app: az containerapp update --name $ContainerAppName --resource-group $ResourceGroup --image $RegistryServer/$ImageName`:latest"
    Write-Host "   Scale app: az containerapp update --name $ContainerAppName --resource-group $ResourceGroup --min-replicas 1 --max-replicas 20"
    Write-Host ""
    Write-Host "🎊 Your serverless React app is now live!" -ForegroundColor Magenta
    
    # Open the app in browser
    Write-Host "🌐 Opening app in browser..." -ForegroundColor Cyan
    Start-Process "https://$AppUrl"
    
} catch {
    Write-Host "❌ Error during deployment: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "💡 Try running the commands manually or check the Azure portal for more details." -ForegroundColor Yellow
    exit 1
}