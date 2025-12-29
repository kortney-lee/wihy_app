# VM Change and Migration Guide

## Overview
This guide provides step-by-step procedures for changing VMs, migrating the WIHY UI application, and updating deployment infrastructure when VM configurations change.

## Current Production Setup
- **VM Name**: wihy-ui-prod-vm
- **VM IP**: 4.246.82.249
- **Username**: wihyadmin
- **Domain**: wihy.ai, www.wihy.ai
- **Container**: wihy-ui-app (Docker)
- **Ports**: 80 (HTTP), 443 (HTTPS)

## Pre-Migration Checklist

### 1. Backup Current VM Data
```bash
# Connect to current VM
ssh wihyadmin@4.246.82.249

# Backup application data (if any)
sudo docker exec wihy-ui-app tar -czf /tmp/app-data-backup.tar.gz /app/data 2>/dev/null || echo "No app data to backup"

# Backup SSL certificates
sudo tar -czf /tmp/ssl-backup.tar.gz /etc/letsencrypt/

# Backup nginx configuration
sudo tar -czf /tmp/nginx-backup.tar.gz /etc/nginx/sites-available/ /etc/nginx/sites-enabled/

# Download backups locally
scp wihyadmin@4.246.82.249:/tmp/*-backup.tar.gz ./backups/
```

### 2. Document Current Configuration
```bash
# Document current VM specs
echo "Current VM Configuration:" > vm-migration-log.txt
echo "=========================" >> vm-migration-log.txt
echo "IP: $(curl -s ifconfig.me)" >> vm-migration-log.txt
echo "OS: $(lsb_release -d | cut -f2-)" >> vm-migration-log.txt
echo "Docker Version: $(docker --version)" >> vm-migration-log.txt
echo "Nginx Version: $(nginx -v 2>&1)" >> vm-migration-log.txt
echo "SSL Certificates:" >> vm-migration-log.txt
sudo certbot certificates >> vm-migration-log.txt 2>&1 || echo "No certificates found" >> vm-migration-log.txt
echo "Docker Containers:" >> vm-migration-log.txt
sudo docker ps -a >> vm-migration-log.txt
```

### 3. Test Current Deployment
```bash
# Verify current deployment is working
curl -f https://wihy.ai/health
curl -f https://www.wihy.ai/health

# Check certificate status
sudo certbot certificates

# Check auto-renewal
sudo certbot renew --dry-run
```

## New VM Setup Procedure

### 1. Create New Azure VM
```bash
# Using Azure CLI (adjust parameters as needed)
az vm create \
  --resource-group wihy-ui-rg \
  --name wihy-ui-prod-vm-new \
  --image Ubuntu2204 \
  --admin-username wihyadmin \
  --generate-ssh-keys \
  --size Standard_B2s \
  --public-ip-sku Standard \
  --security-type TrustedLaunch

# Get new VM public IP
NEW_VM_IP=$(az vm show -d -g wihy-ui-rg -n wihy-ui-prod-vm-new --query publicIps -o tsv)
echo "New VM IP: $NEW_VM_IP"
```

### 2. Initial VM Configuration
```bash
# Connect to new VM
ssh wihyadmin@$NEW_VM_IP

# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker wihyadmin

# Install required packages
sudo apt install -y nginx certbot python3-certbot-nginx curl unzip

# Restart session to apply docker group
logout
```

### 3. Configure SSH Access
```bash
# Copy SSH key to new VM (run from local machine)
ssh-copy-id wihyadmin@$NEW_VM_IP

# Test SSH access
ssh wihyadmin@$NEW_VM_IP "echo 'SSH access working'"

# Configure SSH for GitHub Actions (from local machine with your SSH key)
cat ~/.ssh/id_rsa | ssh wihyadmin@$NEW_VM_IP "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys"
```

### 4. Copy Setup Scripts to New VM
```bash
# Copy all setup scripts from repository
scp setup-ssl.sh setup-ssl-template.sh setup-vm-environment.sh wihyadmin@$NEW_VM_IP:~/

# Make scripts executable
ssh wihyadmin@$NEW_VM_IP "chmod +x *.sh"
```

## DNS Update Procedure

### 1. Update DNS Records
**[!] Critical: Update DNS before SSL setup**

Update the following DNS records at your domain registrar:
```
Record Type: A
Name: wihy.ai
Value: [NEW_VM_IP]
TTL: 300 (5 minutes for quick propagation)

Record Type: A  
Name: www.wihy.ai
Value: [NEW_VM_IP]
TTL: 300 (5 minutes for quick propagation)
```

### 2. Verify DNS Propagation
```bash
# Check DNS propagation (repeat until correct)
nslookup wihy.ai
nslookup www.wihy.ai

# Use online tools for global check
# https://dnschecker.org/#A/wihy.ai
# https://dnschecker.org/#A/www.wihy.ai

# Wait for propagation (typically 5-30 minutes with TTL 300)
```

### 3. Test DNS Resolution
```bash
# From new VM
dig wihy.ai +short
dig www.wihy.ai +short

# Should return the new VM IP
```

## Application Deployment on New VM

### 1. Manual Deployment Test
```bash
# Connect to new VM
ssh wihyadmin@$NEW_VM_IP

# Run VM environment setup
./setup-vm-environment.sh

# Test Docker installation
docker --version
docker run hello-world

# Pull latest application image (if available in registry)
# Or wait for GitHub Actions deployment
```

### 2. Run SSL Setup Template
```bash
# Run the SSL setup template
./setup-ssl-template.sh wihy.ai admin@wihy.ai 80

# This will:
# - Install nginx and certbot
# - Create nginx configuration
# - Test HTTP setup
# - Install SSL certificates
# - Configure auto-renewal
# - Set up monitoring
```

### 3. Verify Manual Setup
```bash
# Test HTTP (should redirect to HTTPS)
curl -I http://wihy.ai/

# Test HTTPS
curl -f https://wihy.ai/health
curl -f https://www.wihy.ai/health

# Check SSL certificate
echo | openssl s_client -servername wihy.ai -connect wihy.ai:443 2>/dev/null | openssl x509 -noout -dates

# Check nginx status
sudo systemctl status nginx
```

## Update GitHub Actions Configuration

### 1. Update Repository Secrets
```bash
# Update VM_HOST secret with new IP
gh secret set VM_HOST --body "$NEW_VM_IP" --repo kortney-lee/wihy_app

# Update VM_SSH_PRIVATE_KEY if using new key
gh secret set VM_SSH_PRIVATE_KEY --body "$(cat ~/.ssh/id_rsa)" --repo kortney-lee/wihy_app

# Verify secrets updated
gh secret list --repo kortney-lee/wihy_app | grep VM_
```

### 2. Test GitHub Actions Deployment
```bash
# Trigger deployment by pushing a small change
git commit --allow-empty -m "Test deployment on new VM"
git push

# Monitor deployment
gh run list --repo kortney-lee/wihy_app
gh run view --repo kortney-lee/wihy_app  # View latest run
```

### 3. Verify Automated Deployment
```bash
# After GitHub Actions completes, verify:
# 1. Docker container is running
ssh wihyadmin@$NEW_VM_IP "sudo docker ps"

# 2. Application is accessible
curl -f https://wihy.ai/health

# 3. SSL is working
curl -I https://wihy.ai/

# 4. Auto-renewal is configured
ssh wihyadmin@$NEW_VM_IP "sudo systemctl list-timers | grep certbot"
```

## Rollback Procedure

### 1. Quick Rollback (DNS Change)
If new VM has issues, quickly revert DNS:
```bash
# Revert DNS records to old VM IP
# wihy.ai     A    4.246.82.249
# www.wihy.ai A    4.246.82.249

# Wait for DNS propagation (5-30 minutes)
```

### 2. Emergency Rollback Checklist
- [ ] Revert DNS records to old VM
- [ ] Update GitHub secrets back to old VM
- [ ] Verify old VM is still functional
- [ ] Check SSL certificates on old VM
- [ ] Test application functionality

### 3. Restore from Backup (if needed)
```bash
# If old VM has issues, restore from backups
scp ./backups/*-backup.tar.gz wihyadmin@4.246.82.249:~/

# Restore SSL certificates
ssh wihyadmin@4.246.82.249 "sudo tar -xzf ssl-backup.tar.gz -C /"

# Restore nginx configuration  
ssh wihyadmin@4.246.82.249 "sudo tar -xzf nginx-backup.tar.gz -C /"
ssh wihyadmin@4.246.82.249 "sudo systemctl reload nginx"
```

## Post-Migration Cleanup

### 1. Verify New VM is Stable
Wait 24-48 hours and monitor:
- [ ] Application uptime and response times
- [ ] SSL certificate auto-renewal
- [ ] GitHub Actions deployments
- [ ] Log files for errors

### 2. Update Documentation
- [ ] Update this guide with new VM IP
- [ ] Update README.md with new deployment info
- [ ] Update any monitoring or alerting systems
- [ ] Update team documentation with new VM details

### 3. Clean Up Old VM
**[!] Only after confirming new VM is stable**
```bash
# Shutdown old VM (don't delete yet)
az vm deallocate --resource-group wihy-ui-rg --name wihy-ui-prod-vm

# After 1 week of stable operation, delete old VM
az vm delete --resource-group wihy-ui-rg --name wihy-ui-prod-vm --yes
```

## Emergency Contact Information

### VM Issues Checklist
1. **DNS Issues**: Check domain registrar DNS settings
2. **SSL Issues**: Run `./setup-ssl-template.sh` on VM
3. **Docker Issues**: Check `sudo docker ps` and container logs
4. **Nginx Issues**: Check `sudo systemctl status nginx` and logs
5. **GitHub Actions Issues**: Check secrets and workflow logs

### Quick Recovery Commands
```bash
# Restart all services
sudo systemctl restart nginx
sudo docker restart wihy-ui-app

# Check application health
curl -f https://wihy.ai/health

# Check logs
sudo tail -f /var/log/nginx/error.log
sudo docker logs wihy-ui-app

# Renew SSL if expired
sudo certbot renew --force-renewal
```

## Testing Checklist

### Pre-Migration Testing
- [ ] Current VM backup completed
- [ ] Current VM configuration documented
- [ ] Application health verified on current VM
- [ ] SSL certificates status checked

### During Migration Testing
- [ ] New VM created and accessible
- [ ] SSH access configured
- [ ] Docker installed and working
- [ ] DNS updated and propagated
- [ ] SSL setup completed successfully

### Post-Migration Testing
- [ ] Application accessible via HTTPS
- [ ] Health endpoints responding
- [ ] SSL certificates valid and auto-renewing
- [ ] GitHub Actions deployment working
- [ ] Monitoring and logging functional

### Performance Testing
- [ ] Response times acceptable
- [ ] SSL handshake times normal
- [ ] Container startup times reasonable
- [ ] Overall system performance stable

## Useful Commands Reference

```bash
# Check VM status
az vm list --resource-group wihy-ui-rg --output table

# Get VM IP
az vm show -d -g wihy-ui-rg -n wihy-ui-prod-vm --query publicIps -o tsv

# Check DNS propagation
dig wihy.ai +short
nslookup wihy.ai

# Test SSL certificate
echo | openssl s_client -servername wihy.ai -connect wihy.ai:443 2>/dev/null | openssl x509 -noout -dates

# Check GitHub Actions
gh run list --repo kortney-lee/wihy_app
gh secret list --repo kortney-lee/wihy_app

# Monitor application
curl -f https://wihy.ai/health
curl -I https://wihy.ai/

# Check container status
ssh wihyadmin@VM_IP "sudo docker ps"
ssh wihyadmin@VM_IP "sudo docker logs wihy-ui-app"
```

---

*Keep this guide updated when VM configurations change. Test the migration procedure in a development environment before applying to production.*