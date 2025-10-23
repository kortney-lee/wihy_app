# WiHy UI Production VM Deployment Instructions

## VM Details
- **Name**: wihy-ui-prod-vm
- **Public IP**: 
- **FQDN**: 
- **SSH Key**: C:\Users\Kortn\.ssh\wihy-ui-vm-key

## Connect to VM
```bash
ssh -i C:\Users\Kortn\.ssh\wihy-ui-vm-key wihyadmin@
```

## Setup Application (run these commands on the VM)

### 1. Copy the setup script to your VM
```bash
# From your local machine, copy the setup script
scp -i C:\Users\Kortn\.ssh\wihy-ui-vm-key vm-setup-script.sh wihyadmin@:~/
```

### 2. Run the setup script on the VM
```bash
# Connect to VM
ssh -i C:\Users\Kortn\.ssh\wihy-ui-vm-key wihyadmin@

# Run setup script
chmod +x vm-setup-script.sh
./vm-setup-script.sh
```

### 3. Deploy your application
```bash
# Clone your repository
cd /opt/wihy-ui
git clone https://github.com/kortney-lee/wihy_ui.git .

# Run the deployment script
sudo /opt/deploy-wihy-ui.sh
```

## Access Your Application
- **HTTP**: http://
- **Direct IP**: http://

## Useful Commands
```bash
# Check system status
sudo /opt/wihy-status.sh

# Check nginx status
sudo systemctl status nginx

# View logs
sudo tail -f /var/log/nginx/access.log

# Redeploy application
sudo /opt/deploy-wihy-ui.sh
```
