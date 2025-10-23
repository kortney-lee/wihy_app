# GitHub Actions Setup for Automated Docker Deployment

This guide will help you configure GitHub secrets for automated Docker deployment to your Azure VM.

## Required GitHub Secrets

You need to add these secrets to your GitHub repository:

### 1. Navigate to GitHub Repository Settings:
- Go to your GitHub repository: `https://github.com/YOUR_USERNAME/wihy_ui`
- Click **Settings** tab
- In the left sidebar, click **Secrets and variables** → **Actions**
- Click **New repository secret** for each of the following:

### 2. Add These Secrets:

#### `VM_HOST`
```
4.246.82.249
```
*This is your Azure VM's public IP address*

#### `VM_USERNAME`
```
wihyadmin
```
*This is the username you created for the VM*

#### `VM_SSH_PRIVATE_KEY`
The content of your private SSH key file. To get this:

**On Windows (PowerShell):**
```powershell
Get-Content C:\Users\Kortn\.ssh\wihy-ui-vm-key -Raw
```

**Copy the entire output** (including `-----BEGIN OPENSSH PRIVATE KEY-----` and `-----END OPENSSH PRIVATE KEY-----`)

## How to Add Secrets:

1. **VM_HOST**:
   - Name: `VM_HOST`
   - Secret: `4.246.82.249`
   - Click **Add secret**

2. **VM_USERNAME**:
   - Name: `VM_USERNAME`
   - Secret: `wihyadmin`
   - Click **Add secret**

3. **VM_SSH_PRIVATE_KEY**:
   - Name: `VM_SSH_PRIVATE_KEY`
   - Secret: [Paste the entire SSH private key content]
   - Click **Add secret**

## Verify Setup

Once you've added all three secrets, you should see them listed in the GitHub Actions secrets section:

✅ VM_HOST  
✅ VM_USERNAME  
✅ VM_SSH_PRIVATE_KEY  

## Test Automated Docker Deployment

1. **Make a small change** to trigger deployment (e.g., update README.md)
2. **Commit and push** to the main branch:
   ```bash
   git add .
   git commit -m "test: trigger automated docker deployment"
   git push origin main
   ```
3. **Watch the deployment** in GitHub Actions tab
4. **Verify success** at: http://wihy-ui-prod.westus2.cloudapp.azure.com

## What the Automated Workflow Does:

1. 🏗️ **Build** - Creates Docker image with your latest code
2. 🧪 **Test** - Runs health checks on the container locally
3. 📦 **Package** - Compresses the Docker image
4. 🚀 **Deploy** - Transfers and runs the container on your VM
5. ✅ **Verify** - Confirms the application is running correctly

## Expected Deployment Time:
- **Total**: ~3-5 minutes
- **Build**: ~1-2 minutes
- **Transfer**: ~30 seconds
- **Deploy**: ~1 minute
- **Verify**: ~30 seconds

## Benefits of This Setup:

✅ **Zero-downtime deployments** - Old container stops only after new one starts  
✅ **Automatic rollback** - If health checks fail, deployment stops  
✅ **Consistent environment** - Docker ensures same behavior everywhere  
✅ **Resource optimization** - Automatic cleanup of old images  
✅ **Health monitoring** - Built-in health checks at `/health`  
✅ **Easy rollback** - Previous images are tagged for quick restoration  

## Monitoring Your Deployment:

After successful deployment, you can monitor your application:

- **Application**: http://wihy-ui-prod.westus2.cloudapp.azure.com
- **Health Check**: http://wihy-ui-prod.westus2.cloudapp.azure.com/health
- **GitHub Actions**: Check the "Actions" tab in your repository
- **VM Logs**: SSH to VM and run `docker logs wihy-ui-app`

## Troubleshooting:

### If deployment fails:
1. Check GitHub Actions logs for specific error
2. Verify all three secrets are correctly added
3. Ensure VM is running and accessible
4. Check Docker logs on VM: `docker logs wihy-ui-app`

### Common issues:
- **SSH key format**: Make sure you copied the entire private key including headers
- **VM access**: Ensure VM is running and port 80/443 are open
- **Docker space**: VM might need cleanup: `docker system prune -f`

## Manual Deployment (Backup):

If you need to deploy manually, you can still use the traditional method:
```bash
# On your VM
cd /opt/wihy-ui
git pull origin main
docker build -t wihy-ui:latest .
docker stop wihy-ui-app || true
docker rm wihy-ui-app || true
docker run -d --name wihy-ui-app --restart unless-stopped -p 80:80 -p 443:443 wihy-ui:latest
```

Your automated Docker deployment is now ready! 🚀🐳

✅ **Consistent deployments** - Same process every time  
✅ **Zero downtime** - Nginx reload without service interruption  
✅ **Automatic testing** - Build verification before deployment  
✅ **Rollback capability** - Git-based deployment allows easy rollbacks  
✅ **Deployment history** - Track all deployments in GitHub Actions  
✅ **Team collaboration** - Any team member can deploy by merging to main  

## Next Steps

1. Add the GitHub secrets as described above
2. Finish the current manual deployment to test the VM setup
3. Push this workflow to GitHub to enable automated deployments
4. Test the automated deployment by making a small change and pushing to main

Your WiHy UI application will then be automatically deployed whenever you update the code! 🚀