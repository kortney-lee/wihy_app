# Azure VM Setup Script for WiHy UI Production Deployment
# This script creates an Azure VM optimized for hosting the WiHy UI React application

param(
    [string]$ResourceGroupName = "vhealth",
    [string]$Location = "westus2",
    [string]$VMName = "wihy-ui-prod-vm",
    [string]$VMSize = "Standard_B2s",
    [string]$AdminUsername = "wihyadmin",
    [string]$DomainName = "wihy-ui-prod"
)

Write-Host "🚀 Setting up Azure VM for WiHy UI Production..." -ForegroundColor Green

# Check if Azure CLI is installed
if (!(Get-Command az -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Azure CLI not found. Please install it first:" -ForegroundColor Red
    Write-Host "   https://docs.microsoft.com/en-us/cli/azure/install-azure-cli" -ForegroundColor Yellow
    exit 1
}

# Login to Azure
Write-Host "🔐 Logging into Azure..." -ForegroundColor Blue
az login

# Set the subscription (you may need to change this)
Write-Host "📋 Setting Azure subscription..." -ForegroundColor Blue
$SUBSCRIPTION_ID = az account show --query id -o tsv
Write-Host "   Using Subscription: $SUBSCRIPTION_ID" -ForegroundColor White

# Create resource group if it doesn't exist
Write-Host "📁 Ensuring resource group exists..." -ForegroundColor Blue
az group create --name $ResourceGroupName --location $Location

# Generate SSH key pair
Write-Host "🔑 Generating SSH key pair..." -ForegroundColor Blue
$sshKeyPath = "$env:USERPROFILE\.ssh\wihy-ui-vm-key"
if (!(Test-Path "$sshKeyPath.pub")) {
    ssh-keygen -t rsa -b 2048 -f $sshKeyPath -N '""'
    Write-Host "   SSH key generated: $sshKeyPath" -ForegroundColor Green
} else {
    Write-Host "   SSH key already exists: $sshKeyPath" -ForegroundColor Yellow
}

# Create Network Security Group with web traffic rules
Write-Host "🛡️ Creating Network Security Group..." -ForegroundColor Blue
$nsgName = "$VMName-nsg"
az network nsg create --resource-group $ResourceGroupName --name $nsgName

# Add security rules for web traffic
az network nsg rule create --resource-group $ResourceGroupName --nsg-name $nsgName --name "AllowSSH" --protocol tcp --priority 1000 --destination-port-range 22 --access allow
az network nsg rule create --resource-group $ResourceGroupName --nsg-name $nsgName --name "AllowHTTP" --protocol tcp --priority 1010 --destination-port-range 80 --access allow
az network nsg rule create --resource-group $ResourceGroupName --nsg-name $nsgName --name "AllowHTTPS" --protocol tcp --priority 1020 --destination-port-range 443 --access allow
az network nsg rule create --resource-group $ResourceGroupName --nsg-name $nsgName --name "AllowNodeJS" --protocol tcp --priority 1030 --destination-port-range 3000 --access allow

# Create Virtual Network
Write-Host "🌐 Creating Virtual Network..." -ForegroundColor Blue
$vnetName = "$VMName-vnet"
az network vnet create --resource-group $ResourceGroupName --name $vnetName --address-prefix 10.0.0.0/16 --subnet-name default --subnet-prefix 10.0.1.0/24

# Create Public IP with DNS name
Write-Host "🌍 Creating Public IP with DNS name..." -ForegroundColor Blue
$publicIpName = "$VMName-ip"
az network public-ip create --resource-group $ResourceGroupName --name $publicIpName --dns-name $DomainName --allocation-method Static --sku Standard

# Create VM
Write-Host "💻 Creating Virtual Machine..." -ForegroundColor Blue
Write-Host "   VM Name: $VMName" -ForegroundColor White
Write-Host "   VM Size: $VMSize" -ForegroundColor White
Write-Host "   Location: $Location" -ForegroundColor White

az vm create `
  --resource-group $ResourceGroupName `
  --name $VMName `
  --image "Ubuntu2204" `
  --size $VMSize `
  --admin-username $AdminUsername `
  --ssh-key-values "$sshKeyPath.pub" `
  --vnet-name $vnetName `
  --subnet default `
  --nsg $nsgName `
  --public-ip-address $publicIpName `
  --location $Location

# Get VM details
Write-Host "📊 Getting VM details..." -ForegroundColor Blue
$vmDetails = az vm show --resource-group $ResourceGroupName --name $VMName --show-details | ConvertFrom-Json
$publicIp = $vmDetails.publicIps
$fqdn = $vmDetails.fqdns

Write-Host "✅ VM Created Successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "🔗 Connection Details:" -ForegroundColor Cyan
Write-Host "   Public IP: $publicIp" -ForegroundColor White
Write-Host "   FQDN: $fqdn" -ForegroundColor White
Write-Host "   SSH Command: ssh -i $sshKeyPath $AdminUsername@$publicIp" -ForegroundColor White
Write-Host ""

# Create cloud-init script for automatic setup
Write-Host "☁️ Creating cloud-init script for application deployment..." -ForegroundColor Blue

$cloudInitScript = @"
#!/bin/bash

# Update system
apt-get update
apt-get upgrade -y

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt-get install -y nodejs

# Install nginx
apt-get install -y nginx

# Install PM2 for process management
npm install -g pm2

# Install Git
apt-get install -y git

# Create application directory
mkdir -p /opt/wihy-ui
chown `$AdminUsername:`$AdminUsername /opt/wihy-ui

# Configure nginx for React app
cat > /etc/nginx/sites-available/wihy-ui << 'EOF'
server {
    listen 80;
    server_name _;
    
    # Serve static files
    location / {
        root /opt/wihy-ui/build;
        index index.html;
        try_files `$uri `$uri/ /index.html;
    }
    
    # API proxy (if needed)
    location /api/ {
        proxy_pass http://localhost:3001/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade `$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host `$host;
        proxy_set_header X-Real-IP `$remote_addr;
        proxy_set_header X-Forwarded-For `$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto `$scheme;
        proxy_cache_bypass `$http_upgrade;
    }
}
EOF

# Enable the site
ln -sf /etc/nginx/sites-available/wihy-ui /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test nginx configuration
nginx -t

# Start and enable services
systemctl start nginx
systemctl enable nginx

# Create deployment script
cat > /opt/deploy-wihy-ui.sh << 'EOF'
#!/bin/bash
set -e

echo "🚀 Deploying WiHy UI..."

# Navigate to app directory
cd /opt/wihy-ui

# Pull latest code (you'll need to set up git repo)
if [ -d ".git" ]; then
    git pull origin main
else
    echo "⚠️  No git repository found. Please clone your repository first:"
    echo "   git clone https://github.com/kortney-lee/wihy_ui.git ."
fi

# Install dependencies and build
cd client
npm ci
npm run build

# Restart nginx to serve new build
systemctl reload nginx

echo "✅ Deployment complete!"
echo "🌐 Access your app at: http://$fqdn"
EOF

chmod +x /opt/deploy-wihy-ui.sh

# Create systemd service for auto-deployment
cat > /etc/systemd/system/wihy-ui-deploy.service << 'EOF'
[Unit]
Description=WiHy UI Deployment Service
After=network.target

[Service]
Type=oneshot
ExecStart=/opt/deploy-wihy-ui.sh
User=root
WorkingDirectory=/opt/wihy-ui

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload

echo "VM setup complete! 🎉"
"@

# Save cloud-init script
$cloudInitPath = ".\cloud-init-wihy-ui.sh"
$cloudInitScript | Out-File -FilePath $cloudInitPath -Encoding UTF8

Write-Host "💾 Cloud-init script saved to: $cloudInitPath" -ForegroundColor Green

# Create deployment instructions
$deployInstructions = @"
# WiHy UI Production VM Deployment Instructions

## VM Details
- **Name**: $VMName
- **Public IP**: $publicIp
- **FQDN**: $fqdn
- **SSH Key**: $sshKeyPath

## Connect to VM
\`\`\`bash
ssh -i $sshKeyPath $AdminUsername@$publicIp
\`\`\`

## Setup Application (run on VM)
\`\`\`bash
# Clone your repository
cd /opt/wihy-ui
git clone https://github.com/kortney-lee/wihy_ui.git .

# Make sure you're on the right branch
git checkout main

# Run the deployment script
sudo /opt/deploy-wihy-ui.sh
\`\`\`

## Configure SSL (Optional)
\`\`\`bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d $fqdn
\`\`\`

## Access Your Application
- **HTTP**: http://$fqdn
- **HTTPS**: https://$fqdn (after SSL setup)

## Useful Commands
\`\`\`bash
# Check nginx status
sudo systemctl status nginx

# View nginx logs
sudo tail -f /var/log/nginx/access.log

# Redeploy application
sudo /opt/deploy-wihy-ui.sh

# Check VM resources
htop
df -h
\`\`\`

## Environment Configuration
Update these files on the VM:
- `/opt/wihy-ui/client/.env.production`

Make sure to set:
\`\`\`
REACT_APP_WIHY_API_URL=http://wihymlapi.westus2.cloudapp.azure.com
\`\`\`
"@

$instructionsPath = ".\vm-deployment-instructions.md"
$deployInstructions | Out-File -FilePath $instructionsPath -Encoding UTF8

Write-Host "📝 Deployment instructions saved to: $instructionsPath" -ForegroundColor Green

Write-Host ""
Write-Host "🎉 VM Setup Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "1. Copy the cloud-init script to your VM and run it" -ForegroundColor White
Write-Host "2. Clone your repository to /opt/wihy-ui" -ForegroundColor White
Write-Host "3. Run the deployment script" -ForegroundColor White
Write-Host "4. Access your app at: http://$fqdn" -ForegroundColor White
Write-Host ""
Write-Host "📋 See $instructionsPath for detailed instructions" -ForegroundColor Yellow