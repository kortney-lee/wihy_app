# Quick Setup - Azure GitHub Secrets

## Step 1: Get Your Azure Information

Run these commands in Azure CLI or Cloud Shell:

```bash
# Login and get basic info
az login
az account show --query "{subscriptionId: id, tenantId: tenantId}" -o table
```

## Step 2: Create Service Principal

```bash
# Replace with your actual subscription ID and resource group
SUBSCRIPTION_ID="your-subscription-id"
RESOURCE_GROUP="rg-wihy"

# Create service principal
az ad sp create-for-rbac \
  --name "wihy-ui-github-actions" \
  --role contributor \
  --scopes "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP" \
  --query "{clientId: appId, tenantId: tenant}" \
  -o table
```

## Step 3: Set Up OIDC (Optional but Recommended)

```bash
# Get the client ID from step 2, then run:
CLIENT_ID="your-client-id-from-step-2"

az ad app federated-credential create \
  --id "$CLIENT_ID" \
  --parameters '{
    "name": "wihy-ui-main",
    "issuer": "https://token.actions.githubusercontent.com", 
    "subject": "repo:kortney-lee/wihy_ui:ref:refs/heads/main",
    "audiences": ["api://AzureADTokenExchange"]
  }'
```

## Step 4: Get Container Registry Password

```bash
az acr credential show --name wihy --query "passwords[0].value" -o tsv
```

## Step 5: Add GitHub Secrets

Go to: https://github.com/kortney-lee/wihy_ui/settings/secrets/actions

Add these secrets:
- **AZURE_CLIENT_ID**: From step 2
- **AZURE_TENANT_ID**: From step 1  
- **AZURE_SUBSCRIPTION_ID**: From step 1
- **REGISTRY_PASSWORD**: From step 4

## Step 6: Re-enable Workflow

In `.github/workflows/azure-container-apps.yml`, uncomment the push trigger:

```yaml
on:
  push:
    branches: [ main ]
  workflow_dispatch:
```

That's it! Your deployment should work after these steps.