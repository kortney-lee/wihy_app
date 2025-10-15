# Azure Container Apps Deployment Setup

## Required GitHub Secrets

You need to configure these secrets in your GitHub repository settings:

### Option 1: OIDC Authentication (Recommended - More Secure)

1. **AZURE_CLIENT_ID** - Application (client) ID of your Azure AD app
2. **AZURE_TENANT_ID** - Directory (tenant) ID of your Azure AD
3. **AZURE_SUBSCRIPTION_ID** - Your Azure subscription ID
4. **REGISTRY_PASSWORD** - Password for Azure Container Registry

### Option 2: Service Principal (Legacy)

If you prefer the legacy approach, you can use:
- **AZURE_CREDENTIALS** - JSON credential string

## Setup Instructions

### 1. Create Azure Service Principal

```bash
# Login to Azure
az login

# Create service principal with contributor access to your resource group
az ad sp create-for-rbac \
  --name "wihy-ui-github-actions" \
  --role contributor \
  --scopes /subscriptions/{subscription-id}/resourceGroups/rg-wihy \
  --sdk-auth

# For OIDC, also create federated credentials
az ad app federated-credential create \
  --id {app-id} \
  --parameters '{"name":"wihy-ui-main","issuer":"https://token.actions.githubusercontent.com","subject":"repo:kortney-lee/wihy_ui:ref:refs/heads/main","audiences":["api://AzureADTokenExchange"]}'
```

### 2. Set GitHub Secrets

Go to: `https://github.com/kortney-lee/wihy_ui/settings/secrets/actions`

Add the secrets from the Azure CLI output.

### 3. Azure Resources Required

Make sure you have these Azure resources:
- Resource Group: `rg-wihy`
- Container Registry: `wihy.azurecr.io`
- Container App Environment: `wihy-env`

### 4. Container Registry Setup

```bash
# Enable admin access (for REGISTRY_PASSWORD)
az acr update --name wihy --admin-enabled true

# Get the password
az acr credential show --name wihy --query "passwords[0].value" -o tsv
```

## Troubleshooting

### If deployment still fails:

1. **Check Azure permissions**: Ensure the service principal has `Contributor` access to your resource group
2. **Verify resource names**: Double-check the environment variables in the workflow match your Azure resources
3. **Container Registry**: Ensure the registry exists and the password is correct
4. **Use manual trigger**: Try running the workflow manually first to test the setup

### Test the setup:

```bash
# Manually trigger the workflow
gh workflow run "Deploy to Azure Container Apps"
```