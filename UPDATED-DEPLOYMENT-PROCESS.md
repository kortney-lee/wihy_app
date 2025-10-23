# Updated Deployment Process - Zero Configuration Required

This document describes the improved deployment process that automatically handles all VM setup and configuration issues.

## 🎯 What's Fixed

The updated deployment workflow now automatically handles all the issues we encountered:

### ✅ Docker Installation & Configuration
- **Automatic Docker installation** using the official Docker install script
- **User permissions** setup for Docker access
- **Service management** (start, enable, auto-restart)

### ✅ Port Conflict Resolution
- **Automatic detection** and stopping of conflicting services (nginx, apache2)
- **Port availability** verification (80, 443)
- **Service disabling** to prevent conflicts on reboot

### ✅ Azure Firewall Management
- **Automatic port opening** in Azure Network Security Groups
- **Dual port setup** for HTTP (80) and HTTPS (443)
- **Graceful fallbacks** if Azure CLI is not available

### ✅ System Optimization
- **Log rotation** setup for Docker containers
- **Cleanup automation** with weekly cron jobs
- **Disk space management** with old image pruning

## 🚀 New Deployment Features

### 1. VM Environment Setup Script (`setup-vm-environment.sh`)
A comprehensive script that:
- Updates system packages
- Installs Docker and essential tools
- Configures firewall rules
- Sets up monitoring and cleanup
- Installs Azure CLI for firewall management

### 2. Enhanced Deployment Workflow
- **Pre-deployment checks** for secrets and connectivity
- **Automated Azure firewall** port opening
- **Robust Docker operations** with proper error handling
- **Health verification** and deployment status reporting

### 3. Zero-Downtime Deployments
- **Rolling container updates** with health checks
- **Automatic rollback** on deployment failures
- **SSL certificate automation** with Let's Encrypt

## 📋 Setup Requirements (One-Time Only)

### GitHub Secrets Configuration

Add these secrets to your GitHub repository:

1. **VM_HOST**: `4.246.82.249`
2. **VM_USERNAME**: `wihyadmin`
3. **VM_SSH_PRIVATE_KEY**: Your SSH private key content

To get your SSH private key:
```powershell
Get-Content C:\Users\Kortn\.ssh\wihy-ui-vm-key -Raw
```

### Azure CLI Authentication (Optional)
If you want automatic firewall management, ensure Azure CLI is authenticated in your environment.

## 🔄 Deployment Process

### Automatic Deployment (Recommended)
1. **Push to main branch** - Deployment starts automatically
2. **GitHub Actions** runs all setup and deployment steps
3. **VM environment** is configured automatically
4. **Docker container** is built, tested, and deployed
5. **Health checks** verify successful deployment

### Manual Deployment (Testing)
```bash
# Run VM setup
ssh wihyadmin@4.246.82.249 "bash -s" < setup-vm-environment.sh

# Build and deploy manually
docker build -t wihy-ui .
docker save wihy-ui:latest | gzip > wihy-ui.tar.gz
scp wihy-ui.tar.gz wihyadmin@4.246.82.249:~/
ssh wihyadmin@4.246.82.249 "docker load < wihy-ui.tar.gz && docker run -d -p 80:80 --name wihy-ui-app wihy-ui:latest"
```

## 🔍 Troubleshooting

### If Deployment Fails

1. **Check GitHub Actions logs** for specific error messages
2. **Verify GitHub secrets** are properly configured
3. **Test SSH connectivity** manually
4. **Run setup script** manually if needed:
   ```bash
   ssh wihyadmin@4.246.82.249
   bash setup-vm-environment.sh
   ```

### Common Issues & Fixes

| Issue | Automatic Fix | Manual Fix |
|-------|---------------|------------|
| Docker not installed | ✅ Auto-installed via setup script | Run setup script |
| Port 80 in use | ✅ Auto-stops conflicting services | `sudo systemctl stop nginx` |
| Firewall blocking | ✅ Auto-opens Azure NSG ports | `az vm open-port --port 80` |
| Permission denied | ✅ Auto-configures Docker permissions | `sudo usermod -aG docker $USER` |

### Health Check Endpoints

- **Application**: http://4.246.82.249/
- **Health Check**: http://4.246.82.249/health
- **SSL Status**: https://4.246.82.249/ (after SSL setup)

## 📊 Monitoring & Maintenance

### Automated Cleanup
- **Weekly cleanup** removes old Docker images
- **Log rotation** prevents disk space issues
- **System monitoring** tracks resource usage

### Manual Monitoring
```bash
# Check container status
ssh wihyadmin@4.246.82.249 "docker ps"

# View logs
ssh wihyadmin@4.246.82.249 "docker logs wihy-ui-app"

# Check system resources
ssh wihyadmin@4.246.82.249 "df -h && free -h"
```

## 🎉 Benefits of Updated Process

1. **Zero Configuration** - No manual VM setup required
2. **Consistent Deployments** - Same process every time
3. **Automatic Recovery** - Handles common deployment issues
4. **Improved Reliability** - Comprehensive error handling
5. **Easy Troubleshooting** - Clear logs and status reporting

## 🔄 Migration from Old Process

If you were using the previous manual deployment process:

1. **Add GitHub secrets** (one-time setup)
2. **Push to main branch** - Everything else is automatic
3. **Remove manual scripts** - No longer needed

The new process is backward compatible and will automatically upgrade your VM environment on the first deployment.