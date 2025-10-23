#!/bin/bash

# SSL Certificate Setup Script for WiHy.ai Domains
# Run this script on your Azure VM: wihyadmin@4.246.82.249

set -e

echo "🔒 Setting up SSL certificates for WiHy.ai domains..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Update system packages
echo "📦 Updating system packages..."
sudo apt update

# Install snapd if not already installed
echo "📦 Installing snapd (if needed)..."
sudo apt install -y snapd

# Install certbot via snap (recommended method)
echo "🔧 Installing Certbot..."
sudo snap install core; sudo snap refresh core
sudo snap install --classic certbot

# Create symlink for certbot command
echo "🔗 Creating Certbot command symlink..."
sudo ln -sf /snap/bin/certbot /usr/bin/certbot

# Verify certbot installation
echo "✅ Verifying Certbot installation..."
certbot --version

echo ""
echo "📋 Before proceeding with SSL certificate installation:"
echo "   1. Ensure your domains point to this server IP: 4.246.82.249"
echo "   2. Check DNS records:"
echo "      - wihy.ai A record → 4.246.82.249"
echo "      - www.wihy.ai A record → 4.246.82.249"
echo "      - api.wihy.ai A record → 4.246.82.249"
echo ""

# Check if nginx is running
if systemctl is-active --quiet nginx; then
    echo "✅ Nginx is running"
else
    echo "❌ Nginx is not running. Starting nginx..."
    sudo systemctl start nginx
    sudo systemctl enable nginx
fi

# Create basic nginx configuration for the domains
echo "📝 Setting up Nginx configuration for domains..."

# Backup existing nginx config
sudo cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.backup.$(date +%Y%m%d_%H%M%S)

# Create nginx configuration for the domains
sudo tee /etc/nginx/sites-available/wihy.ai > /dev/null << 'EOF'
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
    
    # Serve static files
    location / {
        root /opt/wihy-ui/client/build;
        index index.html;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
EOF

# Create nginx configuration for API subdomain
sudo tee /etc/nginx/sites-available/api.wihy.ai > /dev/null << 'EOF'
server {
    listen 80;
    server_name api.wihy.ai;
    
    # Proxy to your API server (update the backend URL as needed)
    location / {
        proxy_pass http://wihymlapi.westus2.cloudapp.azure.com;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # CORS headers if needed
        add_header Access-Control-Allow-Origin "*" always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization" always;
        
        if ($request_method = 'OPTIONS') {
            add_header Access-Control-Allow-Origin "*";
            add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
            add_header Access-Control-Allow-Headers "DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization";
            add_header Access-Control-Max-Age 1728000;
            add_header Content-Type 'text/plain; charset=utf-8';
            add_header Content-Length 0;
            return 204;
        }
    }
    
    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
EOF

# Enable the sites
echo "🔗 Enabling Nginx sites..."
sudo ln -sf /etc/nginx/sites-available/wihy.ai /etc/nginx/sites-enabled/
sudo ln -sf /etc/nginx/sites-available/api.wihy.ai /etc/nginx/sites-enabled/

# Remove default nginx site if it exists
sudo rm -f /etc/nginx/sites-enabled/default

# Test nginx configuration
echo "🧪 Testing Nginx configuration..."
sudo nginx -t

# Reload nginx
echo "🔄 Reloading Nginx..."
sudo systemctl reload nginx

echo ""
echo "✅ Nginx configured for domains:"
echo "   - wihy.ai, www.wihy.ai → WiHy UI React app"
echo "   - api.wihy.ai → Proxy to wihymlapi.westus2.cloudapp.azure.com"
echo ""

# Test if domains are accessible
echo "🌐 Testing domain accessibility..."
echo "Testing wihy.ai..."
curl -I http://wihy.ai 2>/dev/null | head -1 || echo "❌ wihy.ai not accessible"

echo "Testing www.wihy.ai..."
curl -I http://www.wihy.ai 2>/dev/null | head -1 || echo "❌ www.wihy.ai not accessible"

echo "Testing api.wihy.ai..."
curl -I http://api.wihy.ai 2>/dev/null | head -1 || echo "❌ api.wihy.ai not accessible"

echo ""
echo "🔒 Now installing SSL certificates..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Install SSL certificates
echo "📜 Obtaining SSL certificates for all domains..."
sudo certbot --nginx -d wihy.ai -d www.wihy.ai -d api.wihy.ai --non-interactive --agree-tos --email admin@wihy.ai

# Setup auto-renewal
echo "⏰ Setting up automatic certificate renewal..."
sudo systemctl enable --now snap.certbot.renew.timer

# Test auto-renewal
echo "🧪 Testing certificate auto-renewal..."
sudo certbot renew --dry-run

echo ""
echo "🎉 SSL Certificate Setup Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ SSL certificates installed for:"
echo "   • https://wihy.ai"
echo "   • https://www.wihy.ai"
echo "   • https://api.wihy.ai"
echo ""
echo "🔄 Auto-renewal configured and tested"
echo "📝 Nginx configurations saved to:"
echo "   • /etc/nginx/sites-available/wihy.ai"
echo "   • /etc/nginx/sites-available/api.wihy.ai"
echo ""
echo "🌐 Your sites should now be accessible via HTTPS!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"