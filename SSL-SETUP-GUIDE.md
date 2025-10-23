# SSL Certificate Setup Guide for WiHy.ai

## Prerequisites
1. Ensure your domains point to your VM IP: `4.246.82.249`
2. Check DNS records are configured:
   - `wihy.ai` A record → `4.246.82.249`
   - `www.wihy.ai` A record → `4.246.82.249` 
   - `api.wihy.ai` A record → `4.246.82.249`

## Step 1: Install Certbot
```bash
# Update packages
sudo apt update

# Install snapd
sudo apt install -y snapd

# Install certbot via snap
sudo snap install core
sudo snap refresh core
sudo snap install --classic certbot

# Create symlink
sudo ln -sf /snap/bin/certbot /usr/bin/certbot

# Verify installation
certbot --version
```

## Step 2: Configure Nginx for Your Domains

### Create main site configuration:
```bash
sudo nano /etc/nginx/sites-available/wihy.ai
```

Add this content:
```nginx
server {
    listen 80;
    server_name wihy.ai www.wihy.ai;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    
    location / {
        root /opt/wihy-ui/client/build;
        index index.html;
        try_files $uri $uri/ /index.html;
        
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
```

### Create API site configuration:
```bash
sudo nano /etc/nginx/sites-available/api.wihy.ai
```

Add this content:
```nginx
server {
    listen 80;
    server_name api.wihy.ai;
    
    location / {
        proxy_pass http://wihymlapi.westus2.cloudapp.azure.com;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # CORS headers
        add_header Access-Control-Allow-Origin "*" always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization" always;
    }
    
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
```

## Step 3: Enable Sites and Test Configuration
```bash
# Enable sites
sudo ln -sf /etc/nginx/sites-available/wihy.ai /etc/nginx/sites-enabled/
sudo ln -sf /etc/nginx/sites-available/api.wihy.ai /etc/nginx/sites-enabled/

# Remove default site
sudo rm -f /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

## Step 4: Install SSL Certificates
```bash
# Install certificates for all domains
sudo certbot --nginx -d wihy.ai -d www.wihy.ai -d api.wihy.ai

# Follow the prompts:
# 1. Enter email address for notifications
# 2. Agree to terms of service (Y)
# 3. Choose whether to share email with EFF (Y/N)
# 4. Choose redirect option (recommended: 2 for redirect HTTP to HTTPS)
```

## Step 5: Setup Auto-Renewal
```bash
# Enable auto-renewal timer
sudo systemctl enable --now snap.certbot.renew.timer

# Test renewal
sudo certbot renew --dry-run
```

## Step 6: Verify SSL Installation
Test your sites:
- https://wihy.ai
- https://www.wihy.ai  
- https://api.wihy.ai

## Troubleshooting

### If DNS not propagated yet:
```bash
# Check DNS resolution
nslookup wihy.ai
nslookup www.wihy.ai
nslookup api.wihy.ai
```

### If certbot fails:
```bash
# Check nginx logs
sudo tail -f /var/log/nginx/error.log

# Check if ports 80/443 are open
sudo ufw status
sudo netstat -tlnp | grep :80
sudo netstat -tlnp | grep :443
```

### Certificate renewal check:
```bash
# Check certificate expiry
sudo certbot certificates

# Manual renewal
sudo certbot renew
```

## Security Notes
- Certificates auto-renew every 60 days
- Monitor renewal logs: `sudo journalctl -u snap.certbot.renew.service`
- Keep nginx and certbot updated
- Consider setting up monitoring for certificate expiry