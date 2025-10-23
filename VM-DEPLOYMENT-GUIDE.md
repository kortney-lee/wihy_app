# WiHy UI Production VM Deployment Guide

## Overview

This guide will help you set up a production-ready Azure VM for hosting the WiHy UI React application with optimized performance, security, and monitoring.

## Prerequisites

- Azure CLI installed
- PowerShell (for Windows) or Bash (for Linux/macOS)
- SSH client
- Git access to the repository

## Step 1: Create Azure VM

Run the PowerShell script to create and configure your Azure VM:

```powershell
.\setup-vm-production.ps1
```

### Script Parameters (Optional)

```powershell
.\setup-vm-production.ps1 -ResourceGroupName "vhealth" -VMName "wihy-ui-prod" -DomainName "wihy-prod"
```

### What the script creates:

- **VM**: Ubuntu 22.04 LTS with Standard_B2s size (2 vCPUs, 4GB RAM)
- **Networking**: Virtual network, public IP with DNS name, security group
- **Security**: SSH key pair, firewall rules for web traffic
- **DNS**: Custom domain name for easy access

## Step 2: Connect to Your VM

After the script completes, connect to your VM:

```bash
# Use the SSH command provided by the setup script
ssh -i ~/.ssh/wihy-ui-vm-key wihyadmin@your-vm-ip
```

## Step 3: Setup Production Environment

Copy the setup script to your VM and run it:

```bash
# Copy the setup script (you can use scp or copy-paste)
scp -i ~/.ssh/wihy-ui-vm-key vm-setup-script.sh wihyadmin@your-vm-ip:~/

# Connect to VM and run setup
ssh -i ~/.ssh/wihy-ui-vm-key wihyadmin@your-vm-ip
chmod +x vm-setup-script.sh
./vm-setup-script.sh
```

This will install and configure:
- Node.js 18.x
- Nginx web server
- PM2 process manager
- Git and development tools
- Firewall rules
- Log rotation
- Monitoring scripts

## Step 4: Deploy Your Application

Clone your repository and deploy:

```bash
# Navigate to application directory
cd /opt/wihy-ui

# Clone your repository
git clone https://github.com/kortney-lee/wihy_ui.git .

# Deploy the application
sudo /opt/deploy-wihy-ui.sh
```

## Step 5: Configure Environment Variables

Update the production environment configuration:

```bash
# Edit the production environment file
nano /opt/wihy-ui/client/.env.production
```

Ensure it contains:
```env
REACT_APP_WIHY_API_URL=http://wihymlapi.westus2.cloudapp.azure.com
REACT_APP_ENVIRONMENT=production
REACT_APP_ENABLE_ANALYTICS=true
REACT_APP_ENABLE_CACHING=true
```

## Step 6: Setup SSL (Optional but Recommended)

Install and configure SSL certificate:

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate (replace with your domain)
sudo certbot --nginx -d your-domain.westus2.cloudapp.azure.com

# Test automatic renewal
sudo certbot renew --dry-run
```

## Monitoring and Maintenance

### Check System Status

```bash
# Run the status script
sudo /opt/wihy-status.sh
```

### View Logs

```bash
# Nginx access logs
sudo tail -f /var/log/nginx/access.log

# Nginx error logs
sudo tail -f /var/log/nginx/error.log

# System logs
sudo journalctl -u nginx -f
```

### Performance Monitoring

```bash
# System resources
htop

# Disk usage
df -h

# Network connections
ss -tuln

# VM performance
iostat 1
```

### Application Management

```bash
# Redeploy application
sudo /opt/deploy-wihy-ui.sh

# Restart Nginx
sudo systemctl restart nginx

# Check Nginx configuration
sudo nginx -t

# View Nginx status
sudo systemctl status nginx
```

## Troubleshooting

### Common Issues

1. **Build Fails**
   ```bash
   # Check Node.js version
   node --version
   
   # Clear npm cache
   npm cache clean --force
   
   # Remove node_modules and reinstall
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **Nginx Errors**
   ```bash
   # Check configuration
   sudo nginx -t
   
   # View error logs
   sudo tail -f /var/log/nginx/error.log
   
   # Restart nginx
   sudo systemctl restart nginx
   ```

3. **Permission Issues**
   ```bash
   # Fix build directory permissions
   sudo chown -R www-data:www-data /opt/wihy-ui/client/build
   
   # Fix application directory permissions
   sudo chown -R $USER:$USER /opt/wihy-ui
   ```

4. **Connectivity Issues**
   ```bash
   # Check firewall status
   sudo ufw status
   
   # Test API connectivity
   curl -v http://wihymlapi.westus2.cloudapp.azure.com/health
   
   # Check DNS resolution
   nslookup wihymlapi.westus2.cloudapp.azure.com
   ```

## Security Best Practices

1. **Regular Updates**
   ```bash
   # Update system packages weekly
   sudo apt update && sudo apt upgrade -y
   ```

2. **Monitor Access Logs**
   ```bash
   # Check for suspicious activity
   sudo grep "404\|403\|500" /var/log/nginx/access.log
   ```

3. **Backup Configuration**
   ```bash
   # Backup nginx configuration
   sudo cp -r /etc/nginx /opt/nginx-backup-$(date +%Y%m%d)
   
   # Backup application
   tar -czf /opt/wihy-ui-backup-$(date +%Y%m%d).tar.gz /opt/wihy-ui
   ```

## Performance Optimization

### Nginx Tuning

Edit `/etc/nginx/nginx.conf` for better performance:

```nginx
worker_processes auto;
worker_connections 1024;

http {
    # Enable compression
    gzip on;
    gzip_vary on;
    gzip_comp_level 6;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
    
    # Client upload limits
    client_max_body_size 10M;
    
    # Timeout settings
    client_body_timeout 12;
    client_header_timeout 12;
    keepalive_timeout 15;
    send_timeout 10;
}
```

### Resource Monitoring

Set up automated monitoring:

```bash
# Create monitoring cron job
echo "0 */6 * * * /opt/wihy-status.sh >> /var/log/wihy-monitor.log" | sudo crontab -
```

## Scaling Considerations

For high traffic, consider:

1. **Upgrade VM Size**: Standard_B4ms (4 vCPUs, 16GB RAM)
2. **Load Balancer**: Azure Load Balancer for multiple VMs
3. **CDN**: Azure CDN for static asset delivery
4. **Database**: Separate database server if needed

## Support

For issues:
1. Check logs: `/var/log/nginx/` and `journalctl`
2. Review this deployment guide
3. Test connectivity to API endpoints
4. Verify environment variables

---

**Estimated Deployment Time**: 15-30 minutes
**Monthly Cost**: ~$15-30 USD (Standard_B2s VM in West US 2)
**Uptime Target**: 99.9%