#!/bin/bash

# WiHy UI Production VM Setup Script
# Run this script on your Ubuntu VM to set up the production environment

set -e

echo "🚀 Setting up WiHy UI Production Environment..."

# Update system
echo "📦 Updating system packages..."
sudo apt-get update
sudo apt-get upgrade -y

# Install Node.js 18.x
echo "📦 Installing Node.js 18.x..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify Node.js installation
echo "✅ Node.js version: $(node --version)"
echo "✅ NPM version: $(npm --version)"

# Install nginx
echo "📦 Installing Nginx..."
sudo apt-get install -y nginx

# Install PM2 for process management
echo "📦 Installing PM2..."
sudo npm install -g pm2

# Install Git
echo "📦 Installing Git..."
sudo apt-get install -y git

# Install other useful tools
sudo apt-get install -y htop curl wget unzip

# Create application directory
echo "📁 Creating application directory..."
sudo mkdir -p /opt/wihy-ui
sudo chown $USER:$USER /opt/wihy-ui

# Configure nginx for React app
echo "⚙️ Configuring Nginx..."
sudo tee /etc/nginx/sites-available/wihy-ui > /dev/null << 'EOF'
server {
    listen 80;
    server_name _;
    
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

# Enable the site
sudo ln -sf /etc/nginx/sites-available/wihy-ui /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test nginx configuration
sudo nginx -t

# Start and enable services
sudo systemctl start nginx
sudo systemctl enable nginx

# Create deployment script
echo "📝 Creating deployment script..."
sudo tee /opt/deploy-wihy-ui.sh > /dev/null << 'EOF'
#!/bin/bash
set -e

echo "🚀 Deploying WiHy UI..."

# Navigate to app directory
cd /opt/wihy-ui

# Pull latest code if git repo exists
if [ -d ".git" ]; then
    echo "📥 Pulling latest code..."
    git pull origin main
else
    echo "⚠️  No git repository found. Please clone your repository first:"
    echo "   cd /opt/wihy-ui"
    echo "   git clone https://github.com/kortney-lee/wihy_ui.git ."
    echo "   Or copy your files manually"
fi

# Check if client directory exists
if [ ! -d "client" ]; then
    echo "❌ Client directory not found! Please ensure your code is properly deployed."
    exit 1
fi

# Install dependencies and build
echo "📦 Installing dependencies..."
cd client
npm ci --production=false

echo "🔨 Building application..."
npm run build

# Verify build directory exists
if [ ! -d "build" ]; then
    echo "❌ Build failed! No build directory found."
    exit 1
fi

# Set proper permissions
sudo chown -R www-data:www-data /opt/wihy-ui/client/build

# Test nginx configuration
sudo nginx -t

# Reload nginx to serve new build
echo "🔄 Reloading Nginx..."
sudo systemctl reload nginx

# Get public IP for display
PUBLIC_IP=$(curl -s ifconfig.me || echo "Unable to detect")

echo ""
echo "✅ Deployment complete!"
echo "🌐 Access your app at:"
echo "   http://$PUBLIC_IP"
echo "   http://$(hostname -f) (if DNS is configured)"
echo ""
echo "📊 Build info:"
echo "   Build size: $(du -sh /opt/wihy-ui/client/build | cut -f1)"
echo "   Build time: $(date)"
EOF

sudo chmod +x /opt/deploy-wihy-ui.sh

# Create a quick status script
sudo tee /opt/wihy-status.sh > /dev/null << 'EOF'
#!/bin/bash

echo "🏥 WiHy UI System Status"
echo "======================="

echo ""
echo "📊 System Resources:"
echo "CPU: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | awk -F'%' '{print $1}')% used"
echo "Memory: $(free -h | awk '/^Mem:/{print $3 "/" $2}')"
echo "Disk: $(df -h / | awk 'NR==2{print $3 "/" $2 " (" $5 " used)"}')"

echo ""
echo "🌐 Services Status:"
echo "Nginx: $(systemctl is-active nginx)"
echo "VM Uptime: $(uptime -p)"

echo ""
echo "🔗 Network:"
echo "Public IP: $(curl -s ifconfig.me || echo "Unable to detect")"
echo "Local IP: $(hostname -I | awk '{print $1}')"

echo ""
echo "📁 Application:"
if [ -d "/opt/wihy-ui/client/build" ]; then
    echo "Build exists: ✅"
    echo "Build size: $(du -sh /opt/wihy-ui/client/build | cut -f1)"
    echo "Last modified: $(stat -c %y /opt/wihy-ui/client/build | cut -d'.' -f1)"
else
    echo "Build exists: ❌"
fi

echo ""
echo "📊 Recent Nginx Access:"
sudo tail -5 /var/log/nginx/access.log 2>/dev/null || echo "No recent access logs"
EOF

sudo chmod +x /opt/wihy-status.sh

# Create systemd service for monitoring
sudo tee /etc/systemd/system/wihy-ui-monitor.service > /dev/null << 'EOF'
[Unit]
Description=WiHy UI Monitor Service
After=network.target nginx.service

[Service]
Type=oneshot
ExecStart=/opt/wihy-status.sh
User=root

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload

# Set up log rotation for nginx
sudo tee /etc/logrotate.d/nginx-wihy > /dev/null << 'EOF'
/var/log/nginx/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 0644 www-data adm
    sharedscripts
    prerotate
        if [ -d /etc/logrotate.d/httpd-prerotate ]; then \
            run-parts /etc/logrotate.d/httpd-prerotate; \
        fi \
    endscript
    postrotate
        invoke-rc.d nginx reload >/dev/null 2>&1
    endscript
}
EOF

# Create firewall rules (if ufw is available)
if command -v ufw &> /dev/null; then
    echo "🛡️ Configuring firewall..."
    sudo ufw allow 22/tcp
    sudo ufw allow 80/tcp
    sudo ufw allow 443/tcp
    sudo ufw --force enable
fi

echo ""
echo "🎉 VM Setup Complete!"
echo ""
echo "📋 Next Steps:"
echo "1. Clone your repository to /opt/wihy-ui:"
echo "   cd /opt/wihy-ui"
echo "   git clone https://github.com/kortney-lee/wihy_ui.git ."
echo ""
echo "2. Deploy the application:"
echo "   sudo /opt/deploy-wihy-ui.sh"
echo ""
echo "3. Check system status anytime:"
echo "   sudo /opt/wihy-status.sh"
echo ""
echo "🌐 Your VM is ready for production deployment!"

# Get public IP for final message
PUBLIC_IP=$(curl -s ifconfig.me || echo "Unable to detect")
echo "🔗 Access your VM at: http://$PUBLIC_IP (after deployment)"