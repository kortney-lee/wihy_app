# WIHY UI Deployment Quick Reference

## Repository Structure
```
wihy_ui/
├── .github/workflows/
│   ├── deploy.yml              # Main deployment workflow
│   └── deploy-azure.yml        # Azure Container Apps (manual)
├── client/                     # React frontend
├── setup-ssl.sh               # Legacy SSL setup (automated)
├── setup-ssl-template.sh      # Reusable SSL template (manual)
├── setup-vm-environment.sh    # VM environment setup
├── SSL-SETUP-WIHY.md          # Complete SSL setup guide
├── VM-MIGRATION-GUIDE.md      # VM change procedures
└── README.md                   # Main documentation
```

## Current Production Environment
- **Domain**: wihy.ai, www.wihy.ai
- **VM IP**: 4.246.82.249
- **Username**: wihyadmin
- **Container**: wihy-ui-app
- **Internal Port**: 3000 (Docker container)
- **External Port**: 443 (HTTPS only) via Nginx SSL termination
- **SSL**: Let's Encrypt (auto-renewal)
- **API**: Enhanced WiHy ML API (ml.wihy.ai) with 2,325 training examples
- **Azure NSG**: wihy-ui-prod-vm-nsg (Rule: allow-https:910 - HTTPS only for security)

## Quick Commands

### Deploy Application
```bash
# Trigger automatic deployment
git push origin main

# Monitor deployment
gh run list --repo kortney-lee/wihy_app
```

### Check Production Status
```bash
# Application health
curl -f https://wihy.ai/health

# Container status
ssh wihyadmin@4.246.82.249 "sudo docker ps"

# SSL certificate
echo | openssl s_client -servername wihy.ai -connect wihy.ai:443 2>/dev/null | openssl x509 -noout -dates
```

### Emergency Recovery
```bash
# Restart application
ssh wihyadmin@4.246.82.249 "sudo docker restart wihy-ui-app"

# Restart nginx
ssh wihyadmin@4.246.82.249 "sudo systemctl restart nginx"

# Renew SSL (if expired)
ssh wihyadmin@4.246.82.249 "sudo certbot renew --force-renewal"

# Clean up Docker images (free disk space)
ssh wihyadmin@4.246.82.249 "~/manual-cleanup.sh"

# Check disk usage
ssh wihyadmin@4.246.82.249 "sudo docker system df"

# Fix Azure NSG if HTTPS not working
az network nsg rule list --resource-group vHealth --nsg-name wihy-ui-prod-vm-nsg --output table

# Create missing HTTPS rule
az network nsg rule create --resource-group vHealth --nsg-name wihy-ui-prod-vm-nsg --name allow-https --protocol Tcp --priority 910 --destination-port-range 443 --access Allow --source-address-prefix '*' --destination-address-prefix '*'
```

## Deployment Workflows

### 1. Automatic Deployment (Default)
**Trigger**: Push to `main` branch
**Process**:
1. Build Docker image
2. Test container locally
3. Upload to VM
4. Deploy with zero-downtime
5. Run SSL setup
6. Health check verification

### 2. Manual SSL Setup (New VM)
**When**: Setting up on a new VM
**Process**:
1. Follow `VM-MIGRATION-GUIDE.md`
2. Run `./setup-ssl-template.sh`
3. Update GitHub secrets
4. Test deployment

### 3. Azure Container Apps (Alternative)
**Trigger**: Manual workflow dispatch
**Process**: Deploy to Azure Container Apps instead of VM

## GitHub Secrets Configuration

**Required Secrets** (32 total):
```bash
# VM Access
VM_HOST=4.246.82.249
VM_USERNAME=wihyadmin
VM_SSH_PRIVATE_KEY=<private_key>

# Azure Credentials
AZURE_CLIENT_ID=<client_id>
AZURE_CLIENT_SECRET=<client_secret>
AZURE_TENANT_ID=<tenant_id>
AZURE_SUBSCRIPTION_ID=<subscription_id>

# Database & API Keys
OPENAI_API_KEY=<openai_key>
POSTGRES_CONNECTION_STRING=<postgres_string>
# ... (29 more secrets configured via GitHub-Scripts)
```

## SSL Certificate Management

### Automatic Renewal
- **Method**: Let's Encrypt with certbot
- **Schedule**: Automatic via systemd timer
- **Monitoring**: Daily health checks at 9 AM

### Manual Renewal
```bash
# Check certificate status
sudo certbot certificates

# Test renewal
sudo certbot renew --dry-run

# Force renewal
sudo certbot renew --force-renewal
```

## File Purposes

### Scripts
- **setup-ssl.sh**: Automated SSL setup (used by GitHub Actions)
- **setup-ssl-template.sh**: Manual SSL setup (for new VMs)
- **setup-vm-environment.sh**: VM initialization (Docker, firewall, etc.)
- **cleanup-docker-images.sh**: Comprehensive Docker cleanup (automated during deployment)
- **manual-cleanup.sh**: Interactive cleanup script for manual disk space management

### Documentation
- **SSL-SETUP-WIHY.md**: Complete SSL setup instructions
- **VM-MIGRATION-GUIDE.md**: VM change and migration procedures
- **TROUBLESHOOTING.md**: Common issues and solutions

### Configuration
- **Dockerfile**: Container build configuration
- **nginx.conf**: Nginx configuration template
- **.env.example**: Environment variables template

## Common Tasks

### Adding New Environment Variable
1. Add to `.env.example`
2. Update GitHub secret: `gh secret set VAR_NAME --body "value" --repo kortney-lee/wihy_app`
3. Update Dockerfile if needed
4. Deploy: `git push origin main`

### Updating Domain Configuration
1. Update DNS records
2. Run `./setup-ssl-template.sh new-domain.com`
3. Update nginx configuration
4. Test deployment

### Scaling/Performance Tuning
1. Monitor with: `curl -w "%{time_total}" https://wihy.ai/health`
2. Check container resources: `sudo docker stats wihy-ui-app`
3. Upgrade VM size if needed (see VM-MIGRATION-GUIDE.md)

## Monitoring URLs

### Health Checks
- https://wihy.ai/health
- https://www.wihy.ai/health

### SSL Testing
- https://www.ssllabs.com/ssltest/analyze.html?d=wihy.ai
- https://dnschecker.org/#A/wihy.ai

### GitHub Actions
- https://github.com/kortney-lee/wihy_app/actions

## Support Workflow

### 1. Check Application Health
```bash
curl -f https://wihy.ai/health || echo "Application down"
```

### 2. Check Infrastructure
```bash
# VM accessibility
ssh wihyadmin@4.246.82.249 "uptime"

# Container status
ssh wihyadmin@4.246.82.249 "sudo docker ps"

# SSL status
echo | openssl s_client -servername wihy.ai -connect wihy.ai:443 2>/dev/null | openssl x509 -noout -dates
```

### 3. Check Recent Deployments
```bash
gh run list --repo kortney-lee/wihy_app --limit 5
```

### 4. View Logs
```bash
# Application logs
ssh wihyadmin@4.246.82.249 "sudo docker logs --tail 100 wihy-ui-app"

# Nginx logs
ssh wihyadmin@4.246.82.249 "sudo tail -100 /var/log/nginx/error.log"

# SSL monitoring logs
ssh wihyadmin@4.246.82.249 "sudo tail -50 /var/log/wihy-ssl-monitor.log"
```

## Development Tips

### Local Testing
```bash
# Build locally
docker build -t wihy-ui:local .

# Test locally
docker run -p 8080:80 wihy-ui:local

# Test health
curl http://localhost:8080/health
```

### Environment Setup
```bash
# Copy environment template
cp .env.example .env

# Edit environment variables
nano .env

# Test with environment
docker run --env-file .env -p 8080:80 wihy-ui:local
```

## Emergency Procedures

### Application Down
1. Check container: `ssh wihyadmin@4.246.82.249 "sudo docker ps"`
2. Restart if needed: `ssh wihyadmin@4.246.82.249 "sudo docker restart wihy-ui-app"`
3. Check logs: `ssh wihyadmin@4.246.82.249 "sudo docker logs wihy-ui-app"`
4. Redeploy if needed: `git push origin main`

### SSL Certificate Expired
1. Check expiry: `echo | openssl s_client -servername wihy.ai -connect wihy.ai:443 2>/dev/null | openssl x509 -noout -dates`
2. Renew: `ssh wihyadmin@4.246.82.249 "sudo certbot renew --force-renewal"`
3. Restart nginx: `ssh wihyadmin@4.246.82.249 "sudo systemctl restart nginx"`

### VM Inaccessible
1. Check Azure portal for VM status
2. Restart VM if needed
3. Verify SSH access
4. Follow VM-MIGRATION-GUIDE.md if replacement needed

### GitHub Actions Failing
1. Check workflow logs: `gh run view --repo kortney-lee/wihy_app`
2. Verify secrets: `gh secret list --repo kortney-lee/wihy_app`
3. Test VM access manually
4. Re-run failed workflow

---

*This quick reference covers the most common deployment tasks. For detailed procedures, refer to the specific documentation files.*