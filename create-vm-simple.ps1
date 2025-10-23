# Azure VM Setup Script for WiHy UI Production Deployment (Simplified)
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

# Set the subscription
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

# Create deployment instructions
$deployInstructions = @"
# WiHy UI Production VM Deployment Instructions

## VM Details
- **Name**: $VMName
- **Public IP**: $publicIp
- **FQDN**: $fqdn
- **SSH Key**: $sshKeyPath

## Connect to VM
``````bash
ssh -i $sshKeyPath ${AdminUsername}@${publicIp}
``````

## Setup Application (run these commands on the VM)

### 1. Copy the setup script to your VM
``````bash
# From your local machine, copy the setup script
scp -i $sshKeyPath vm-setup-script.sh ${AdminUsername}@${publicIp}:~/
``````

### 2. Run the setup script on the VM
``````bash
# Connect to VM
ssh -i $sshKeyPath ${AdminUsername}@${publicIp}

# Run setup script
chmod +x vm-setup-script.sh
./vm-setup-script.sh
``````

### 3. Deploy your application
``````bash
# Clone your repository
cd /opt/wihy-ui
git clone https://github.com/kortney-lee/wihy_ui.git .

# Run the deployment script
sudo /opt/deploy-wihy-ui.sh
``````

## Access Your Application
- **HTTP**: http://$fqdn
- **Direct IP**: http://$publicIp

## Useful Commands
``````bash
# Check system status
sudo /opt/wihy-status.sh

# Check nginx status
sudo systemctl status nginx

# View logs
sudo tail -f /var/log/nginx/access.log

# Redeploy application
sudo /opt/deploy-wihy-ui.sh
``````
"@

$instructionsPath = ".\vm-deployment-instructions.md"
$deployInstructions | Out-File -FilePath $instructionsPath -Encoding UTF8

Write-Host "📝 Deployment instructions saved to: $instructionsPath" -ForegroundColor Green

Write-Host ""
Write-Host "🎉 VM Setup Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "1. Copy vm-setup-script.sh to your VM using the scp command above" -ForegroundColor White
Write-Host "2. Connect to your VM and run the setup script" -ForegroundColor White
Write-Host "3. Clone your repository and deploy" -ForegroundColor White
Write-Host "4. Access your app at: http://$fqdn" -ForegroundColor White
Write-Host ""
Write-Host "📋 See $instructionsPath for detailed instructions" -ForegroundColor Yellow