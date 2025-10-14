# 🚀 WIHY UI - One-Command Deployment

Now that you have Docker and Azure CLI, you can deploy your serverless React app with simple commands!

## 🧪 Test Locally First (Recommended)

```powershell
# Test your container locally
.\test-local.ps1
```

This will:
- ✅ Build your Docker container
- ✅ Run it on http://localhost:8080
- ✅ Test the health endpoint
- ✅ Open it in your browser

## 🚀 Deploy to Azure (One Command)

```powershell
# Deploy everything to Azure Container Apps
.\deploy-azure.ps1
```

This single command will:
- 🔐 Login to Azure
- 📁 Create resource group (`rg-wihy`)
- 📦 Create Azure Container Registry
- 🐳 Build and push your container
- 🌐 Create Container Apps environment
- 🚀 Deploy your serverless app
- 🌍 Give you the live URL

**Deployment takes ~5-10 minutes total!**

## 🎛️ Custom Configuration

```powershell
# Deploy with custom settings
.\deploy-azure.ps1 -ResourceGroup "my-rg" -Location "westus2" -ContainerAppName "my-app"
```

## 🔧 After Deployment

Your app will be live with:
- ✅ **Auto-scaling**: 0-10 instances
- ✅ **HTTPS**: Automatic SSL certificate
- ✅ **Custom domains**: Add your own domain
- ✅ **Health monitoring**: Built-in health checks
- ✅ **Zero maintenance**: Serverless infrastructure

## 📊 Monitoring & Management

```powershell
# View live logs
az containerapp logs show --name wihy-ui --resource-group rg-wihy --follow

# Scale your app
az containerapp update --name wihy-ui --resource-group rg-wihy --min-replicas 1 --max-replicas 20

# Update with new container
docker build -t <registry>.azurecr.io/wihy-ui:latest .
docker push <registry>.azurecr.io/wihy-ui:latest
az containerapp update --name wihy-ui --resource-group rg-wihy --image <registry>.azurecr.io/wihy-ui:latest
```

## 🆘 Troubleshooting

**If local testing fails:**
- Make sure Docker Desktop is running
- Check Windows features: Hyper-V and Containers
- Try: `docker --version` and `az --version`

**If Azure deployment fails:**
- Make sure you're logged in: `az login`
- Check your Azure subscription: `az account show`
- Verify resource naming (must be globally unique)

**If app doesn't work after deployment:**
- Check container logs in Azure Portal
- Test health endpoint: `https://your-app.azurecontainerapps.io/health`
- Verify environment variables in Container Apps settings

## 💰 Cost Information

- **Container Registry**: ~$5/month (Basic tier)
- **Container Apps**: Pay-per-use, starts at $0
- **Total estimated cost**: $5-15/month depending on traffic

**The app scales to zero when not in use = No idle costs!** 🎉

---

**Ready to go live?** Run `.\test-local.ps1` first, then `.\deploy-azure.ps1`! 🚀