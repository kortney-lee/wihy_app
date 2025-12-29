# SSL Certificate Setup Guide for wihy.ai

## Overview
This guide provides step-by-step instructions to set up Let's Encrypt SSL certificates for the wihy.ai domain on an Azure VM running the WIHY UI application.

## Prerequisites
- Azure VM with Ubuntu (tested on Ubuntu 22.04)
- Domain `wihy.ai` and `www.wihy.ai` pointing to the VM's public IP
- WIHY UI Docker container running on port 80 internally
- SSH access to the VM
- VM IP: 4.246.82.249 (current production)

## DNS Configuration Required

Before starting SSL setup, ensure DNS records are configured:

```bash
# Check current DNS resolution
nslookup wihy.ai
nslookup www.wihy.ai

# Both should resolve to: 4.246.82.249
```

**Required DNS Records:**
```
wihy.ai         A    4.246.82.249
www.wihy.ai     A    4.246.82.249
```

## Quick Setup Commands

### 1. Connect to VM and Install Prerequisites
```bash
# Connect to your Azure VM
ssh wihyadmin@4.246.82.249

# Update package list and install nginx and certbot
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx

# Verify nginx installation
nginx -v
certbot --version
```

### 2. Create Nginx Configuration for wihy.ai
```bash
# Create the nginx site configuration
sudo tee /etc/nginx/sites-available/wihy.ai << 'EOF'
server {
    listen 80;
    server_name wihy.ai www.wihy.ai;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    
    # Proxy to Docker container
    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Health check endpoint
    location /health {
        proxy_pass http://localhost:80/health;
        proxy_set_header Host $host;
        access_log off;
    }
}
EOF

# Enable the site and disable default
sudo ln -sf /etc/nginx/sites-available/wihy.ai /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test nginx configuration
sudo nginx -t

# Start nginx if not running
sudo systemctl start nginx
sudo systemctl enable nginx
sudo systemctl status nginx
```

### 3. Ensure WIHY UI Docker Container is Running
```bash
# Check if Docker container is running
sudo docker ps

# If not running, start it (adjust container name as needed)
sudo docker run -d \
  --name wihy-ui-app \
  --restart unless-stopped \
  -p 80:80 \
  wihy-ui:latest

# Test internal application
curl -s http://localhost:80/health | head -3
curl -s http://localhost/ | head -10
```

### 4. Test HTTP Setup Before SSL
```bash
# Test nginx proxy to Docker container
curl -H "Host: wihy.ai" http://localhost/
curl -H "Host: www.wihy.ai" http://localhost/

# Test from external (if DNS is working)
curl http://wihy.ai/health
curl http://www.wihy.ai/health
```

### 5. Get SSL Certificate with Certbot
```bash
# Request SSL certificate for wihy.ai and www.wihy.ai
sudo certbot --nginx -d wihy.ai -d www.wihy.ai \
  --non-interactive \
  --agree-tos \
  --email admin@wihy.ai \
  --redirect

# Certbot will automatically:
# - Verify domain ownership
# - Download and install certificate
# - Update nginx configuration for SSL
# - Set up HTTP to HTTPS redirect
# - Configure auto-renewal
```

### 6. Verify SSL Setup
```bash
# Test HTTPS locally
curl -s https://wihy.ai/health | head -3
curl -s https://www.wihy.ai/health | head -3

# Check certificate status
sudo certbot certificates

# Verify auto-renewal is configured
sudo systemctl list-timers | grep certbot
sudo systemctl status snap.certbot.renew.timer

# Test auto-renewal (dry run)
sudo certbot renew --dry-run
```

## Post-SSL Nginx Configuration

After SSL installation, nginx configuration will be automatically updated to:

```nginx
# /etc/nginx/sites-available/wihy.ai (after certbot)
server {
    listen 80;
    server_name wihy.ai www.wihy.ai;
    
    # HTTP to HTTPS redirect (added by certbot)
    if ($host = www.wihy.ai) {
        return 301 https://$host$request_uri;
    }
    if ($host = wihy.ai) {
        return 301 https://$host$request_uri;
    }
    return 404;
}

server {
    listen 443 ssl http2;
    server_name wihy.ai www.wihy.ai;

    # SSL certificate files (managed by certbot)
    ssl_certificate /etc/letsencrypt/live/wihy.ai/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/wihy.ai/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Proxy to Docker container
    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # WebSocket support (if needed)
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
    
    # Health check endpoint
    location /health {
        proxy_pass http://localhost:80/health;
        proxy_set_header Host $host;
        access_log off;
    }
}
```

## Certificate Management

### Check Certificate Status
```bash
# View all certificates
sudo certbot certificates

# Check certificate expiration
sudo certbot certificates | grep -A 5 "Certificate Name: wihy.ai"

# Check certificate details
openssl x509 -in /etc/letsencrypt/live/wihy.ai/fullchain.pem -text -noout | grep -A 2 "Validity"
```

### Manual Certificate Renewal
```bash
# Test renewal (dry run)
sudo certbot renew --dry-run

# Force renewal if needed (only if expiring soon)
sudo certbot renew --force-renewal

# Renew specific certificate
sudo certbot renew --cert-name wihy.ai
```

### Auto-Renewal Verification
```bash
# Check if auto-renewal timer is active
sudo systemctl status snap.certbot.renew.timer

# View renewal schedule
sudo systemctl list-timers | grep certbot

# Check auto-renewal logs
sudo journalctl -u snap.certbot.renew.service
```

## Troubleshooting

### Common Issues and Solutions

#### 1. DNS Not Resolving
```bash
# Check if domain points to correct IP
nslookup wihy.ai
dig wihy.ai A

# Expected output should show: 4.246.82.249
# If not resolving, update DNS records at domain registrar
```

#### 2. Port 80/443 Already in Use
```bash
# Check what's using port 80
sudo ss -tlnp | grep :80
sudo ss -tlnp | grep :443

# Stop conflicting services
sudo docker stop $(sudo docker ps -q --filter "publish=80")
sudo systemctl stop apache2  # if apache is running
```

#### 3. Nginx Configuration Errors
```bash
# Test nginx configuration
sudo nginx -t

# View nginx error logs
sudo tail -f /var/log/nginx/error.log

# Restart nginx
sudo systemctl restart nginx
sudo systemctl status nginx
```

#### 4. Docker Container Not Running
```bash
# Check Docker containers
sudo docker ps -a

# Start WIHY UI container
sudo docker start wihy-ui-app

# Check container logs
sudo docker logs wihy-ui-app

# Test container directly
curl http://localhost:80/health
```

#### 5. Certbot Domain Validation Failed
```bash
# Check certbot logs
sudo tail -f /var/log/letsencrypt/letsencrypt.log

# Ensure nginx is serving the domain correctly
curl -H "Host: wihy.ai" http://localhost/
curl -H "Host: www.wihy.ai" http://localhost/

# Test domain accessibility from external
curl -I http://wihy.ai/
curl -I http://www.wihy.ai/

# Manual verification method
sudo certbot certonly --webroot -w /var/www/html -d wihy.ai -d www.wihy.ai
```

#### 6. Certificate Renewal Issues
```bash
# Check renewal logs
sudo journalctl -u snap.certbot.renew.service
sudo journalctl -u snap.certbot.renew.timer

# Test renewal with verbose output
sudo certbot renew --dry-run --verbose

# Force delete and recreate certificate
sudo certbot delete --cert-name wihy.ai
sudo certbot --nginx -d wihy.ai -d www.wihy.ai --non-interactive --agree-tos --email admin@wihy.ai
```

## Security Configuration

### 1. Firewall Setup
```bash
# Configure UFW firewall
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status
```

### 2. SSL Security Test
```bash
# Test SSL configuration with SSL Labs
# Visit: https://www.ssllabs.com/ssltest/analyze.html?d=wihy.ai

# Local SSL test
echo | openssl s_client -servername wihy.ai -connect wihy.ai:443 2>/dev/null | openssl x509 -noout -dates
```

### 3. Security Headers Verification
```bash
# Test security headers
curl -I https://wihy.ai/

# Should include:
# Strict-Transport-Security: max-age=31536000; includeSubDomains
# X-Frame-Options: SAMEORIGIN
# X-Content-Type-Options: nosniff
# X-XSS-Protection: 1; mode=block
```

## Monitoring and Maintenance

### 1. Health Check Script
```bash
# Create SSL health monitoring script
sudo tee /usr/local/bin/wihy-ssl-health.sh << 'EOF'
#!/bin/bash
DOMAIN="wihy.ai"
EXPIRY_TIMESTAMP=$(echo | openssl s_client -servername $DOMAIN -connect $DOMAIN:443 2>/dev/null | openssl x509 -noout -dates | grep 'notAfter' | cut -d= -f2)
EXPIRY_EPOCH=$(date -d "$EXPIRY_TIMESTAMP" +%s)
CURRENT_EPOCH=$(date +%s)
DAYS_UNTIL_EXPIRY=$(( ($EXPIRY_EPOCH - $CURRENT_EPOCH) / 86400 ))

echo "=== WIHY.AI SSL Health Check ==="
echo "Domain: $DOMAIN"
echo "Certificate expires: $EXPIRY_TIMESTAMP"
echo "Days until expiry: $DAYS_UNTIL_EXPIRY"

if [ $DAYS_UNTIL_EXPIRY -lt 30 ]; then
    echo "STATUS: [!]  WARNING - Certificate expires in $DAYS_UNTIL_EXPIRY days"
    exit 1
elif [ $DAYS_UNTIL_EXPIRY -lt 60 ]; then
    echo "STATUS: [LIGHTNING] CAUTION - Certificate expires in $DAYS_UNTIL_EXPIRY days"
    exit 0
else
    echo "STATUS: [OK] OK - Certificate expires in $DAYS_UNTIL_EXPIRY days"
    exit 0
fi
EOF

sudo chmod +x /usr/local/bin/wihy-ssl-health.sh

# Test the health check
/usr/local/bin/wihy-ssl-health.sh
```

### 2. Daily Health Check Cron
```bash
# Add daily SSL health check
echo "0 9 * * * /usr/local/bin/wihy-ssl-health.sh >> /var/log/wihy-ssl-health.log 2>&1" | sudo crontab -

# View health check logs
sudo tail -f /var/log/wihy-ssl-health.log
```

## VM Change Procedures

### When Moving to a New VM:

1. **Update DNS Records:**
   ```bash
   # Update A records to point to new VM IP
   wihy.ai     A    <NEW_VM_IP>
   www.wihy.ai A    <NEW_VM_IP>
   ```

2. **Wait for DNS Propagation:**
   ```bash
   # Check DNS propagation (can take up to 48 hours)
   nslookup wihy.ai
   nslookup www.wihy.ai
   ```

3. **Run Complete Setup:**
   ```bash
   # Copy this guide to new VM
   # Follow all steps in "Quick Setup Commands" section
   # Use setup-ssl-template.sh (see templates section)
   ```

4. **Update GitHub Secrets:**
   ```bash
   # Update VM_HOST secret with new IP
   gh secret set VM_HOST --body "<NEW_VM_IP>" --repo kortney-lee/wihy_app
   ```

5. **Test Deployment:**
   ```bash
   # Trigger deployment from GitHub Actions
   # Verify SSL setup works automatically
   ```

## Quick Reference Commands

```bash
# Check SSL certificate status
sudo certbot certificates

# Renew certificates
sudo certbot renew

# Test renewal (dry run)
sudo certbot renew --dry-run

# Restart nginx
sudo systemctl restart nginx

# Check nginx status
sudo systemctl status nginx

# View nginx logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# Test HTTPS endpoints
curl -I https://wihy.ai/health
curl -I https://www.wihy.ai/health

# Check auto-renewal timer
sudo systemctl list-timers | grep certbot

# Check certificate expiry
echo | openssl s_client -servername wihy.ai -connect wihy.ai:443 2>/dev/null | openssl x509 -noout -dates

# Test Docker container
sudo docker ps
sudo docker logs wihy-ui-app
curl http://localhost:80/health
```

## Emergency Recovery

### If SSL Breaks:
```bash
# Remove SSL configuration and start over
sudo certbot delete --cert-name wihy.ai
sudo rm -f /etc/nginx/sites-enabled/wihy.ai
sudo systemctl restart nginx

# Re-run setup from step 2 onwards
```

### If Nginx Breaks:
```bash
# Reset nginx configuration
sudo rm -f /etc/nginx/sites-enabled/*
sudo systemctl restart nginx

# Re-run setup from step 2 onwards
```

### If Docker Container Stops:
```bash
# Restart Docker container
sudo docker start wihy-ui-app

# Or redeploy from GitHub Actions
```

## Support Checklist

Before requesting help, verify:
- [ ] DNS resolves to correct IP: `nslookup wihy.ai`
- [ ] Nginx is running: `sudo systemctl status nginx`
- [ ] Docker container is running: `sudo docker ps`
- [ ] Ports 80/443 are accessible: `curl http://localhost/health`
- [ ] Certificate exists: `sudo certbot certificates`
- [ ] No nginx errors: `sudo nginx -t`

---

*This document provides complete SSL certificate setup for wihy.ai domain. Keep this guide updated when VM configuration changes.*