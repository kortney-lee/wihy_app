# WiHy UI - Azure Configuration Standards

## 🏛️ **Azure Resource Group Standard**

**IMPORTANT**: This project always uses the **`vhealth`** resource group in **West US 2**.

### 📍 **Current Azure Resources**

| Resource Type | Name | Location | Resource Group |
|---------------|------|----------|----------------|
| Resource Group | `vhealth` | West US 2 | - |
| Container Registry | `wihymlregistry` | West US 2 | `vhealth` |
| Container App Environment | `wihy-ml-env` | West US 2 | `vhealth` |
| Container App | `wihy-ui` | West US 2 | `vhealth` |

### 🌐 **Live URLs**
- **Production**: https://wihy-ui.graypebble-2c416c49.westus2.azurecontainerapps.io

### 📋 **GitHub Secrets Configuration**

All GitHub Actions workflows expect these secrets to be configured:

```
AZURE_SUBSCRIPTION_ID: Your Azure subscription ID
AZURE_TENANT_ID: Your Azure tenant ID  
AZURE_CLIENT_ID: Service principal app ID
REGISTRY_PASSWORD: Container registry password
```

### 🚀 **Deployment Workflows**

1. **Container Build & Publish**: Builds Docker images and publishes to GitHub Container Registry
2. **Azure Container Apps**: Deploys to Azure Container Apps in the `vhealth` resource group

### ⚠️ **IMPORTANT NOTES**

- **Always use `vhealth` resource group** - Never create resources in other groups
- **West US 2 region** - All resources must be in this region for consistency
- **Service Principal**: Must have Contributor access to `vhealth` resource group
- **Container Registry**: Use existing `wihymlregistry` - do not create new registries

### 🔧 **Setup Instructions**

See the setup guides:
- `QUICK-AZURE-SETUP.md` - Step-by-step manual setup
- `AZURE-SETUP.md` - Detailed setup with troubleshooting
- `get-azure-values.ps1` - Script to collect all required values

### 📖 **Development Standards**

When working with Azure resources:
1. Always check resources exist in `vhealth` first
2. Use the existing Container Registry (`wihymlregistry`)
3. Ensure service principal has access to `vhealth`
4. Test deployments manually before enabling auto-deployment