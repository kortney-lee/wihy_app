#!/bin/bash
# WiHy UI VM Environment Setup Script
# This script ensures the VM is properly configured for Docker deployments

set -e

echo "🔧 WiHy UI VM Environment Setup Starting..."
echo "================================================="

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if service is active
service_active() {
    systemctl is-active --quiet "$1" 2>/dev/null
}

# Update system packages
echo "📦 Updating system packages..."
sudo apt-get update -qq

# Install essential packages
echo "📦 Installing essential packages..."
sudo apt-get install -y curl wget unzip jq

# Install Docker if not present
if ! command_exists docker; then
    echo "🐳 Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    rm get-docker.sh
    
    # Add current user to docker group
    sudo usermod -aG docker $USER
    echo "✅ Docker installed successfully"
else
    echo "✅ Docker is already installed"
fi

# Ensure Docker is running
echo "🚀 Starting Docker service..."
sudo systemctl start docker
sudo systemctl enable docker

# Stop conflicting web services
echo "🛑 Stopping conflicting web services..."
for service in nginx apache2 httpd; do
    if service_active "$service"; then
        echo "  Stopping $service..."
        sudo systemctl stop "$service"
        sudo systemctl disable "$service"
    fi
done

# Check Docker access
echo "🔍 Verifying Docker access..."
if sudo docker ps >/dev/null 2>&1; then
    echo "✅ Docker is accessible"
else
    echo "❌ Docker is not accessible"
    exit 1
fi

# Setup directories
echo "📁 Setting up directories..."
sudo mkdir -p /opt/wihy-ui
sudo chown $USER:$USER /opt/wihy-ui

# Check if ports are available
echo "🔍 Checking port availability..."
if sudo lsof -i :80 >/dev/null 2>&1; then
    echo "⚠️  Port 80 is in use, will be cleared during deployment"
else
    echo "✅ Port 80 is available"
fi

if sudo lsof -i :443 >/dev/null 2>&1; then
    echo "⚠️  Port 443 is in use, will be cleared during deployment"
else
    echo "✅ Port 443 is available"
fi

# Setup log rotation for container logs
echo "📝 Setting up log rotation..."
sudo tee /etc/logrotate.d/docker-containers > /dev/null << 'LOGROTATE_EOF'
/var/lib/docker/containers/*/*.log {
    rotate 5
    weekly
    compress
    size 10M
    missingok
    delaycompress
    copytruncate
}
LOGROTATE_EOF

# Setup basic firewall (if ufw is available)
if command_exists ufw; then
    echo "🔥 Configuring basic firewall..."
    sudo ufw --force reset
    sudo ufw default deny incoming
    sudo ufw default allow outgoing
    sudo ufw allow ssh
    sudo ufw allow 80/tcp
    sudo ufw allow 443/tcp
    sudo ufw --force enable
    echo "✅ Firewall configured"
fi

# Setup Docker cleanup script
echo "🧹 Setting up Docker cleanup script..."
sudo tee /opt/wihy-ui/docker-cleanup.sh > /dev/null << 'CLEANUP_EOF'
#!/bin/bash
# Docker cleanup script to manage disk space
echo "🧹 Running Docker cleanup..."
docker system prune -f --volumes
docker image prune -af --filter "until=24h"
echo "✅ Docker cleanup completed"
CLEANUP_EOF

sudo chmod +x /opt/wihy-ui/docker-cleanup.sh

# Setup weekly cleanup cron job
echo "⏰ Setting up weekly cleanup cron job..."
(sudo crontab -l 2>/dev/null || true; echo "0 2 * * 0 /opt/wihy-ui/docker-cleanup.sh") | sudo crontab -

# Install Azure CLI (optional for firewall management)
if ! command_exists az; then
    echo "☁️  Installing Azure CLI..."
    curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash
    echo "✅ Azure CLI installed"
else
    echo "✅ Azure CLI is already installed"
fi

# Create deployment status file
echo "📊 Creating deployment status file..."
sudo tee /opt/wihy-ui/deployment-info.json > /dev/null << JSON_EOF
{
    "setupDate": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "dockerVersion": "$(docker --version)",
    "systemInfo": {
        "os": "$(lsb_release -d | cut -f2)",
        "kernel": "$(uname -r)",
        "architecture": "$(uname -m)"
    },
    "ports": {
        "http": 80,
        "https": 443
    },
    "status": "ready"
}
JSON_EOF

echo "================================================="
echo "🎉 VM Environment Setup Completed Successfully!"
echo "================================================="
echo "📋 Summary:"
echo "  ✅ Docker installed and configured"
echo "  ✅ Conflicting services stopped"
echo "  ✅ Ports 80 and 443 prepared"
echo "  ✅ Firewall configured (if available)"
echo "  ✅ Cleanup automation setup"
echo "  ✅ Azure CLI installed"
echo ""
echo "🚀 VM is ready for Docker deployments!"
echo "📁 Setup files located in: /opt/wihy-ui/"
echo ""

# Display system status
echo "📊 Current System Status:"
echo "  Docker: $(docker --version)"
echo "  Disk Usage: $(df -h / | awk 'NR==2{print $5}')"
echo "  Memory Usage: $(free -h | awk 'NR==2{printf "%.1f/%.1fGB (%.0f%%)\n", $3/1024/1024, $2/1024/1024, $3*100/$2}')"
echo "  Load Average: $(uptime | awk -F'load average:' '{print $2}')"

echo "================================================="