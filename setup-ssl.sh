#!/bin/bash

# SSL Certificate Setup for Docker Deployment
# This script is called during automated deployment

set -e

echo "🔒 Starting SSL certificate setup..."

# Check if SSL certificates already exist
if [ -f /etc/letsencrypt/live/wihy.ai/fullchain.pem ]; then
    echo "✅ SSL certificates already exist"
    
    # Check certificate expiry
    CERT_EXPIRY=$(sudo certbot certificates 2>/dev/null | grep "Expiry Date" | head -1 | awk '{print $3, $4}' 2>/dev/null || echo "Unknown")
    echo "📅 Certificate expires: $CERT_EXPIRY"
    
    # Test auto-renewal
    sudo certbot renew --dry-run --quiet && echo "✅ Auto-renewal test passed" || echo "⚠️ Auto-renewal test failed"
    
    exit 0
fi

echo "📋 SSL certificates not found. Checking prerequisites..."

# Install certbot if not present
if ! command -v certbot &> /dev/null; then
    echo "📦 Installing Certbot..."
    sudo apt update
    sudo apt install -y snapd
    sudo snap install core
    sudo snap refresh core
    sudo snap install --classic certbot
    sudo ln -sf /snap/bin/certbot /usr/bin/certbot
    echo "✅ Certbot installed"
fi

# Check if nginx is running
if ! systemctl is-active --quiet nginx; then
    echo "🔄 Starting Nginx..."
    sudo systemctl start nginx
    sudo systemctl enable nginx
fi

# Create nginx configuration for SSL domains (proxy to Docker container)
if [ ! -f /etc/nginx/sites-available/wihy.ai ]; then
    echo "📝 Creating Nginx configuration for SSL setup..."
    
    # Backup current nginx config
    sudo cp /etc/nginx/nginx.conf "/etc/nginx/nginx.conf.backup.$(date +%Y%m%d_%H%M%S)" 2>/dev/null || true
    
    # Create nginx configuration for wihy.ai (proxy to Docker container)
    sudo tee /etc/nginx/sites-available/wihy.ai > /dev/null << 'EOF'
server {
    listen 80;
    server_name wihy.ai www.wihy.ai;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    
    # Proxy to Docker container running on port 3000
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $server_name;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Health check endpoint
    location /health {
        proxy_pass http://localhost:3000/health;
        proxy_set_header Host $host;
        access_log off;
    }
}
EOF
    
    # Enable the site
    sudo ln -sf /etc/nginx/sites-available/wihy.ai /etc/nginx/sites-enabled/
    
    # Remove default site if it exists
    sudo rm -f /etc/nginx/sites-enabled/default
    
    # Test nginx configuration
    if sudo nginx -t; then
        sudo systemctl reload nginx
        echo "✅ Nginx configuration updated"
    else
        echo "❌ Nginx configuration test failed"
        exit 1
    fi
fi

# Check DNS resolution
echo "🌐 Checking DNS resolution..."
DNS_CHECK=true
for domain in wihy.ai www.wihy.ai; do
    if ! nslookup $domain > /dev/null 2>&1; then
        echo "⚠️  DNS resolution failed for $domain"
        DNS_CHECK=false
    else
        RESOLVED_IP=$(nslookup $domain | grep -A1 "Name:" | tail -1 | awk '{print $2}' 2>/dev/null || echo "unknown")
        echo "✅ $domain resolves to: $RESOLVED_IP"
    fi
done

if [ "$DNS_CHECK" = false ]; then
    echo ""
    echo "⚠️  DNS resolution issues detected"
    echo "📋 Please ensure DNS records are configured:"
    echo "   - wihy.ai A record → $(curl -s ifconfig.me || echo 'Your VM IP')"
    echo "   - www.wihy.ai A record → $(curl -s ifconfig.me || echo 'Your VM IP')"
    echo ""
    echo "🔧 You can manually install SSL later with:"
    echo "   sudo /opt/wihy-ui/setup-ssl.sh"
    exit 0
fi

# Check if port 3000 is accessible (Docker container)
echo "🔌 Testing port 3000 accessibility..."
if curl -s -m 5 http://localhost:3000/health > /dev/null; then
    echo "✅ Port 3000 is accessible locally"
else
    echo "⚠️  Port 3000 not accessible locally"
    echo "🔧 Check if Docker container is running: docker ps"
    exit 0
fi

echo ""
echo "🔐 Attempting to install SSL certificates..."
echo "📋 This requires:"
echo "   1. DNS records pointing to this server"
echo "   2. Port 80/443 accessible from internet"
echo "   3. No firewall blocking Let's Encrypt"
echo ""

# Try to install SSL certificates (non-interactive)
if sudo certbot --nginx -d wihy.ai -d www.wihy.ai --non-interactive --agree-tos --email admin@wihy.ai --redirect --quiet; then
    echo "✅ SSL certificates installed successfully!"
    echo "🔒 HTTPS URLs:"
    echo "   https://wihy.ai"
    echo "   https://www.wihy.ai"
    
    # Setup auto-renewal
    sudo systemctl enable --now snap.certbot.renew.timer 2>/dev/null || true
    echo "⏰ Auto-renewal configured"
    
    # Test the HTTPS endpoints
    echo "🧪 Testing HTTPS endpoints..."
    sleep 5
    if curl -s -m 10 https://wihy.ai/health > /dev/null; then
        echo "✅ HTTPS health check passed"
    else
        echo "⚠️  HTTPS health check failed (this may be normal during initial setup)"
    fi
    
else
    echo "⚠️  SSL certificate installation failed"
    echo ""
    echo "📋 Common reasons:"
    echo "   1. DNS records not pointing to this server yet"
    echo "   2. Firewall blocking port 80/443"
    echo "   3. Domain validation failed"
    echo "   4. Rate limiting from Let's Encrypt"
    echo ""
    echo "🔧 Manual installation command:"
    echo "   sudo certbot --nginx -d wihy.ai -d www.wihy.ai"
    echo ""
    echo "🔍 Check logs for details:"
    echo "   sudo tail -f /var/log/letsencrypt/letsencrypt.log"
fi

echo "🔒 SSL setup script completed"