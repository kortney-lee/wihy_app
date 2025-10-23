#!/bin/bash

# WIHY.AI SSL Setup Template
# Reusable script for setting up SSL certificates on any new VM
# Usage: ./setup-ssl-template.sh [domain] [email] [container_port]

set -e

# Configuration variables (can be overridden)
DOMAIN=${1:-"wihy.ai"}
EMAIL=${2:-"admin@wihy.ai"}
CONTAINER_PORT=${3:-"80"}
ADDITIONAL_DOMAINS="www.${DOMAIN}"

echo "🔒 WIHY.AI SSL Setup Template"
echo "=========================================="
echo "Domain: ${DOMAIN}"
echo "Additional domains: ${ADDITIONAL_DOMAINS}"
echo "Email: ${EMAIL}"
echo "Container port: ${CONTAINER_PORT}"
echo "VM IP: $(curl -s ifconfig.me || echo 'Unknown')"
echo "=========================================="

# Function to check prerequisites
check_prerequisites() {
    echo "📋 Checking prerequisites..."
    
    # Check if running as root or with sudo
    if [[ $EUID -eq 0 ]]; then
        echo "❌ Do not run this script as root. Use sudo for individual commands."
        exit 1
    fi
    
    # Check if domain resolves to this server
    echo "🌐 Checking DNS resolution..."
    SERVER_IP=$(curl -s ifconfig.me || echo "")
    DOMAIN_IP=$(nslookup ${DOMAIN} | grep -A1 "Name:" | tail -1 | awk '{print $2}' 2>/dev/null || echo "")
    
    if [ "$SERVER_IP" != "$DOMAIN_IP" ]; then
        echo "⚠️  DNS Warning: ${DOMAIN} resolves to ${DOMAIN_IP}, but server IP is ${SERVER_IP}"
        echo "   Please update DNS records before continuing with SSL setup."
        echo "   Required DNS records:"
        echo "   ${DOMAIN}     A    ${SERVER_IP}"
        echo "   www.${DOMAIN} A    ${SERVER_IP}"
        read -p "Continue anyway? (y/n): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo "Exiting. Please fix DNS records first."
            exit 1
        fi
    else
        echo "✅ DNS resolution correct: ${DOMAIN} → ${SERVER_IP}"
    fi
    
    # Check if Docker container is running
    if ! sudo docker ps | grep -q ":${CONTAINER_PORT}->"; then
        echo "⚠️  No Docker container found running on port ${CONTAINER_PORT}"
        echo "   Please ensure WIHY UI container is running before SSL setup"
        echo "   Example: sudo docker run -d --name wihy-ui-app -p ${CONTAINER_PORT}:80 wihy-ui:latest"
        read -p "Continue anyway? (y/n): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo "Exiting. Please start Docker container first."
            exit 1
        fi
    else
        echo "✅ Docker container running on port ${CONTAINER_PORT}"
    fi
}

# Function to install dependencies
install_dependencies() {
    echo "📦 Installing dependencies..."
    
    # Update package list
    sudo apt update
    
    # Install nginx if not present
    if ! command -v nginx &> /dev/null; then
        echo "Installing nginx..."
        sudo apt install -y nginx
    else
        echo "✅ nginx already installed"
    fi
    
    # Install certbot if not present
    if ! command -v certbot &> /dev/null; then
        echo "Installing certbot..."
        sudo apt install -y certbot python3-certbot-nginx
    else
        echo "✅ certbot already installed"
    fi
    
    # Ensure nginx is enabled and started
    sudo systemctl enable nginx
    sudo systemctl start nginx
    
    echo "✅ Dependencies installed"
}

# Function to create nginx configuration
create_nginx_config() {
    echo "⚙️  Creating nginx configuration for ${DOMAIN}..."
    
    # Backup existing nginx config if it exists
    if [ -f /etc/nginx/sites-available/${DOMAIN} ]; then
        sudo cp /etc/nginx/sites-available/${DOMAIN} "/etc/nginx/sites-available/${DOMAIN}.backup.$(date +%Y%m%d_%H%M%S)"
        echo "📋 Backed up existing configuration"
    fi
    
    # Create nginx site configuration
    sudo tee /etc/nginx/sites-available/${DOMAIN} > /dev/null << EOF
server {
    listen 80;
    server_name ${DOMAIN} ${ADDITIONAL_DOMAINS};
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    
    # Proxy to Docker container
    location / {
        proxy_pass http://localhost:${CONTAINER_PORT};
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # WebSocket support
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
    }
    
    # Health check endpoint
    location /health {
        proxy_pass http://localhost:${CONTAINER_PORT}/health;
        proxy_set_header Host \$host;
        access_log off;
    }
    
    # Let's Encrypt verification
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }
}
EOF
    
    # Enable the site
    sudo ln -sf /etc/nginx/sites-available/${DOMAIN} /etc/nginx/sites-enabled/
    
    # Remove default site if it exists
    sudo rm -f /etc/nginx/sites-enabled/default
    
    # Test nginx configuration
    if sudo nginx -t; then
        sudo systemctl reload nginx
        echo "✅ Nginx configuration created and loaded"
    else
        echo "❌ Nginx configuration test failed"
        exit 1
    fi
}

# Function to test HTTP setup
test_http_setup() {
    echo "🧪 Testing HTTP setup..."
    
    # Test local proxy
    if curl -s -f -H "Host: ${DOMAIN}" http://localhost/ > /dev/null; then
        echo "✅ Local proxy test passed"
    else
        echo "⚠️  Local proxy test failed"
        echo "   Check if Docker container is accessible on port ${CONTAINER_PORT}"
    fi
    
    # Test health endpoint
    if curl -s -f -H "Host: ${DOMAIN}" http://localhost/health > /dev/null; then
        echo "✅ Health endpoint test passed"
    else
        echo "⚠️  Health endpoint test failed"
        echo "   Container may not have /health endpoint"
    fi
    
    # Test external access (if DNS is working)
    if curl -s -f http://${DOMAIN}/health > /dev/null; then
        echo "✅ External HTTP access test passed"
    else
        echo "⚠️  External HTTP access test failed"
        echo "   This may be normal if DNS is not propagated yet"
    fi
}

# Function to install SSL certificate
install_ssl_certificate() {
    echo "🔐 Installing SSL certificate..."
    
    # Prepare certbot command
    CERTBOT_DOMAINS="-d ${DOMAIN}"
    for additional_domain in ${ADDITIONAL_DOMAINS}; do
        CERTBOT_DOMAINS="${CERTBOT_DOMAINS} -d ${additional_domain}"
    done
    
    echo "📋 Requesting certificate for: ${DOMAIN} ${ADDITIONAL_DOMAINS}"
    
    # Run certbot
    if sudo certbot --nginx ${CERTBOT_DOMAINS} \
        --non-interactive \
        --agree-tos \
        --email ${EMAIL} \
        --redirect \
        --hsts \
        --staple-ocsp; then
        
        echo "✅ SSL certificate installed successfully!"
        
        # Setup auto-renewal
        sudo systemctl enable --now snap.certbot.renew.timer 2>/dev/null || {
            # Fallback for systems without snap
            echo "0 12 * * * /usr/bin/certbot renew --quiet" | sudo crontab -
        }
        
        echo "⏰ Auto-renewal configured"
        
    else
        echo "❌ SSL certificate installation failed"
        echo "📋 Common causes:"
        echo "   - DNS not pointing to this server"
        echo "   - Firewall blocking port 80/443"
        echo "   - Domain validation failed"
        echo "   - Rate limiting from Let's Encrypt"
        echo ""
        echo "🔧 Manual installation command:"
        echo "   sudo certbot --nginx ${CERTBOT_DOMAINS} --email ${EMAIL}"
        return 1
    fi
}

# Function to verify SSL setup
verify_ssl_setup() {
    echo "✅ Verifying SSL setup..."
    
    # Wait a moment for configuration to propagate
    sleep 5
    
    # Test HTTPS endpoints
    for domain in ${DOMAIN} ${ADDITIONAL_DOMAINS}; do
        if curl -s -f https://${domain}/health > /dev/null; then
            echo "✅ HTTPS test passed for ${domain}"
        else
            echo "⚠️  HTTPS test failed for ${domain}"
        fi
    done
    
    # Check certificate details
    if sudo certbot certificates | grep -q "${DOMAIN}"; then
        echo "✅ Certificate found in certbot"
        CERT_EXPIRY=$(sudo certbot certificates | grep -A 10 "${DOMAIN}" | grep "Expiry Date" | awk '{print $3, $4}')
        echo "📅 Certificate expires: ${CERT_EXPIRY}"
    else
        echo "⚠️  Certificate not found in certbot"
    fi
    
    # Test auto-renewal
    if sudo certbot renew --dry-run --quiet; then
        echo "✅ Auto-renewal test passed"
    else
        echo "⚠️  Auto-renewal test failed"
    fi
}

# Function to create monitoring script
create_monitoring() {
    echo "📊 Creating SSL monitoring script..."
    
    sudo tee /usr/local/bin/wihy-ssl-monitor.sh > /dev/null << EOF
#!/bin/bash
# WIHY SSL Monitoring Script
# Created by SSL setup template

DOMAIN="${DOMAIN}"
LOG_FILE="/var/log/wihy-ssl-monitor.log"

check_ssl() {
    echo "\$(date): Checking SSL for \${DOMAIN}" >> \${LOG_FILE}
    
    # Check certificate expiry
    EXPIRY_TIMESTAMP=\$(echo | openssl s_client -servername \${DOMAIN} -connect \${DOMAIN}:443 2>/dev/null | openssl x509 -noout -dates | grep 'notAfter' | cut -d= -f2)
    
    if [ -n "\${EXPIRY_TIMESTAMP}" ]; then
        EXPIRY_EPOCH=\$(date -d "\${EXPIRY_TIMESTAMP}" +%s)
        CURRENT_EPOCH=\$(date +%s)
        DAYS_UNTIL_EXPIRY=\$(( (\${EXPIRY_EPOCH} - \${CURRENT_EPOCH}) / 86400 ))
        
        echo "\$(date): Certificate expires in \${DAYS_UNTIL_EXPIRY} days" >> \${LOG_FILE}
        
        if [ \${DAYS_UNTIL_EXPIRY} -lt 30 ]; then
            echo "\$(date): WARNING - Certificate expires in \${DAYS_UNTIL_EXPIRY} days" >> \${LOG_FILE}
            return 1
        fi
    else
        echo "\$(date): ERROR - Could not check certificate expiry" >> \${LOG_FILE}
        return 1
    fi
    
    # Check HTTPS accessibility
    if curl -s -f https://\${DOMAIN}/health > /dev/null; then
        echo "\$(date): HTTPS health check passed" >> \${LOG_FILE}
        return 0
    else
        echo "\$(date): ERROR - HTTPS health check failed" >> \${LOG_FILE}
        return 1
    fi
}

check_ssl
EOF
    
    sudo chmod +x /usr/local/bin/wihy-ssl-monitor.sh
    
    # Add to crontab for daily monitoring
    (sudo crontab -l 2>/dev/null || echo "") | grep -v "wihy-ssl-monitor" | {
        cat
        echo "0 9 * * * /usr/local/bin/wihy-ssl-monitor.sh"
    } | sudo crontab -
    
    echo "✅ SSL monitoring configured (daily at 9 AM)"
}

# Function to display final summary
display_summary() {
    echo ""
    echo "🎉 SSL Setup Complete!"
    echo "=========================================="
    echo "Domain: ${DOMAIN}"
    echo "Additional domains: ${ADDITIONAL_DOMAINS}"
    echo "Certificate email: ${EMAIL}"
    echo ""
    echo "🔗 Your site is now accessible at:"
    echo "   https://${DOMAIN}"
    for additional_domain in ${ADDITIONAL_DOMAINS}; do
        echo "   https://${additional_domain}"
    done
    echo ""
    echo "📋 Important files:"
    echo "   Nginx config: /etc/nginx/sites-available/${DOMAIN}"
    echo "   SSL certificates: /etc/letsencrypt/live/${DOMAIN}/"
    echo "   Monitor script: /usr/local/bin/wihy-ssl-monitor.sh"
    echo "   Monitor logs: /var/log/wihy-ssl-monitor.log"
    echo ""
    echo "🔧 Useful commands:"
    echo "   Check certificates: sudo certbot certificates"
    echo "   Renew certificates: sudo certbot renew"
    echo "   Test renewal: sudo certbot renew --dry-run"
    echo "   Monitor SSL: /usr/local/bin/wihy-ssl-monitor.sh"
    echo "   View nginx logs: sudo tail -f /var/log/nginx/error.log"
    echo ""
    echo "⚠️  Remember to update GitHub secrets if VM IP changed:"
    echo "   VM_HOST: $(curl -s ifconfig.me || echo 'Current VM IP')"
    echo ""
}

# Main execution
main() {
    echo "Starting SSL setup for ${DOMAIN}..."
    
    check_prerequisites
    install_dependencies
    create_nginx_config
    test_http_setup
    
    if install_ssl_certificate; then
        verify_ssl_setup
        create_monitoring
        display_summary
        echo "✅ SSL setup completed successfully!"
        exit 0
    else
        echo "❌ SSL setup failed at certificate installation"
        echo "📋 HTTP setup is complete. You can manually install SSL with:"
        echo "   sudo certbot --nginx -d ${DOMAIN} -d ${ADDITIONAL_DOMAINS} --email ${EMAIL}"
        exit 1
    fi
}

# Script usage information
usage() {
    echo "Usage: $0 [domain] [email] [container_port]"
    echo ""
    echo "Examples:"
    echo "  $0                           # Use defaults: wihy.ai, admin@wihy.ai, port 80"
    echo "  $0 wihy.ai admin@wihy.ai 80  # Specify all parameters"
    echo "  $0 test.wihy.ai              # Different domain, default email and port"
    echo ""
    echo "Default values:"
    echo "  domain: wihy.ai"
    echo "  email: admin@wihy.ai"
    echo "  container_port: 80"
    echo ""
}

# Handle command line arguments
if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    usage
    exit 0
fi

# Run main function
main "$@"