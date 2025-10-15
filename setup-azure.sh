#!/bin/bash
# Azure Container Apps Setup Script
# Run this script to set up Azure authentication for GitHub Actions

echo "🚀 Setting up Azure Container Apps deployment..."

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    echo "❌ Azure CLI not found. Please install it first:"
    echo "   https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
    exit 1
fi

# Login to Azure
echo "🔐 Logging into Azure..."
az login

# Get subscription info
SUBSCRIPTION_ID=$(az account show --query id -o tsv)
TENANT_ID=$(az account show --query tenantId -o tsv)

echo "📋 Current Azure context:"
echo "   Subscription ID: $SUBSCRIPTION_ID"
echo "   Tenant ID: $TENANT_ID"

# Create service principal
echo "🔧 Creating service principal for GitHub Actions..."
APP_NAME="wihy-ui-github-actions"
RESOURCE_GROUP="rg-wihy"

# Create the service principal
SP_OUTPUT=$(az ad sp create-for-rbac \
  --name "$APP_NAME" \
  --role contributor \
  --scopes "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP" \
  --query "{clientId: appId, clientSecret: password, subscriptionId: '$SUBSCRIPTION_ID', tenantId: tenant}" \
  -o json)

CLIENT_ID=$(echo $SP_OUTPUT | jq -r '.clientId')
CLIENT_SECRET=$(echo $SP_OUTPUT | jq -r '.clientSecret')

echo "✅ Service principal created!"

# Set up federated credential for OIDC
echo "🔗 Setting up federated credential for OIDC..."
az ad app federated-credential create \
  --id "$CLIENT_ID" \
  --parameters "{
    \"name\": \"wihy-ui-main\",
    \"issuer\": \"https://token.actions.githubusercontent.com\",
    \"subject\": \"repo:kortney-lee/wihy_ui:ref:refs/heads/main\",
    \"audiences\": [\"api://AzureADTokenExchange\"]
  }"

# Get container registry password
echo "🔐 Getting container registry password..."
REGISTRY_PASSWORD=$(az acr credential show --name wihy --query "passwords[0].value" -o tsv 2>/dev/null || echo "REGISTRY_NOT_FOUND")

echo ""
echo "🎉 Setup complete! Add these secrets to GitHub:"
echo "   Go to: https://github.com/kortney-lee/wihy_ui/settings/secrets/actions"
echo ""
echo "   AZURE_CLIENT_ID:       $CLIENT_ID"
echo "   AZURE_TENANT_ID:       $TENANT_ID"
echo "   AZURE_SUBSCRIPTION_ID: $SUBSCRIPTION_ID"
echo "   REGISTRY_PASSWORD:     $REGISTRY_PASSWORD"
echo ""

if [ "$REGISTRY_PASSWORD" = "REGISTRY_NOT_FOUND" ]; then
    echo "⚠️  Container registry 'wihy' not found. You may need to:"
    echo "   1. Create the registry: az acr create --name wihy --resource-group $RESOURCE_GROUP --sku Basic"
    echo "   2. Enable admin access: az acr update --name wihy --admin-enabled true"
fi

echo "📝 After adding secrets, re-enable the workflow by uncommenting the push trigger in:"
echo "   .github/workflows/azure-container-apps.yml"