# Deploy WIHY UI Without Azure CLI

## 🌐 Browser-Based Deployment Guide

Since you don't have Azure CLI installed, here's how to deploy using the Azure Portal and GitHub Actions:

### **Step 1: Create Azure Resources in Portal**

1. **Go to [Azure Portal](https://portal.azure.com)**

2. **Create Container Registry:**
   - Search "Container Registry" → Create
   - Resource Group: Create new `rg-wihy`
   - Registry name: `wihyregistry` (must be globally unique)
   - Location: `East US`
   - SKU: `Basic`
   - Click **Review + Create**

3. **Create Container Apps Environment:**
   - Search "Container Apps" → Create
   - Resource Group: `rg-wihy`
   - Environment name: `wihy-env`
   - Location: `East US`
   - Click **Review + Create**

### **Step 2: Get Azure Credentials**

1. **Create Service Principal:**
   - Go to Azure Portal → Azure Active Directory
   - App registrations → New registration
   - Name: `wihy-ui-deployment`
   - Click **Register**

2. **Get Required Values:**
   ```
   AZURE_CLIENT_ID: Application (client) ID from app registration
   AZURE_TENANT_ID: Directory (tenant) ID from app registration
   AZURE_SUBSCRIPTION_ID: Your subscription ID from portal
   ```

3. **Create Client Secret:**
   - In your app registration → Certificates & secrets
   - New client secret → Copy the value
   - This is your `AZURE_CLIENT_SECRET`

4. **Assign Permissions:**
   - Go to your Container Registry → Access control (IAM)
   - Add role assignment → Contributor
   - Assign to your service principal

### **Step 3: Configure GitHub Secrets**

1. **Go to your GitHub repository**
2. **Settings → Secrets and variables → Actions**
3. **Add these secrets:**

```
AZURE_CLIENT_ID: [from step 2]
AZURE_TENANT_ID: [from step 2]
AZURE_SUBSCRIPTION_ID: [from step 2]
AZURE_CLIENT_SECRET: [from step 2]
REGISTRY_LOGIN_SERVER: wihyregistry.azurecr.io
REGISTRY_USERNAME: wihyregistry
```

### **Step 4: Deploy via GitHub Actions**

1. **Trigger Deployment:**
   - Go to your repo → Actions tab
   - Select "Deploy to Azure Container Apps"
   - Click "Run workflow"
   - Select main branch → Run

2. **Monitor Deployment:**
   - Watch the workflow progress
   - Check for any errors in the logs
   - Get your app URL from the output

### **Step 5: Alternative - Docker Hub Deployment**

If Azure setup is complex, you can use Docker Hub instead:

1. **Create Docker Hub account**
2. **Add Docker Hub secrets to GitHub:**
   ```
   DOCKER_USERNAME: your-dockerhub-username
   DOCKER_PASSWORD: your-dockerhub-token
   ```

3. **Modified workflow for Docker Hub:**
   ```yaml
   # Uses docker.io instead of Azure Container Registry
   - name: Build and push Docker image
     uses: docker/build-push-action@v4
     with:
       push: true
       tags: your-username/wihy-ui:latest
   ```

### **Step 6: Local Testing (No Azure CLI needed)**

Test your container locally with Docker Desktop:

```bash
# Build the container
docker build -t wihy-ui:local .

# Run the container
docker run -p 8080:80 wihy-ui:local

# Test the application
# Open http://localhost:8080 in browser
```

### **Step 7: Manual Container Apps Creation**

If GitHub Actions fail, create Container App manually:

1. **Azure Portal → Container Apps → Create**
2. **Configuration:**
   - Name: `wihy-ui`
   - Resource Group: `rg-wihy`
   - Environment: `wihy-env`
   - Container image: `ghcr.io/kortney-lee/wihy-ui:latest`
   - Target port: `80`
   - Ingress: `Enabled`
   - Traffic: `100% to latest revision`

3. **Scaling:**
   - Min replicas: `0`
   - Max replicas: `10`
   - Scale rule: HTTP concurrent requests: `100`

### **Troubleshooting**

**If GitHub Actions fail:**
1. Check secrets are correctly set
2. Verify service principal has contributor access
3. Ensure container registry name is globally unique
4. Check workflow logs for specific errors

**If deployment succeeds but app doesn't work:**
1. Check container logs in Azure Portal
2. Verify environment variables are set
3. Test the health endpoint: `https://your-app.azurecontainerapps.io/health`

### **Cost Optimization**

- **Container Apps**: Pay-per-use (starts at $0)
- **Container Registry**: Basic tier (~$5/month)
- **Total estimated cost**: $5-15/month depending on usage

### **Next Steps After Deployment**

1. **Custom Domain**: Add your own domain in Container Apps settings
2. **SSL Certificate**: Automatic HTTPS with custom domains
3. **Monitoring**: Enable Application Insights for monitoring
4. **Scaling Rules**: Adjust auto-scaling based on usage patterns

---

**No Azure CLI Required!** 🎉
Everything can be done through the Azure Portal and GitHub Actions.