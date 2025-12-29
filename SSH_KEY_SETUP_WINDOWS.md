# SSH Key Setup Instructions for Windows

## [KEY] **Issue:** Your GitHub secret `VM_SSH_PRIVATE_KEY` contains an invalid SSH key

## [TOOLS] **Solution:** Generate a new SSH key pair and update GitHub secrets

### **Step 1: Generate SSH Key (Windows)**

Open PowerShell and run:

```powershell
# Create .ssh directory if it doesn't exist
if (!(Test-Path "$env:USERPROFILE\.ssh")) {
    New-Item -ItemType Directory -Path "$env:USERPROFILE\.ssh"
}

# Generate SSH key pair
ssh-keygen -t rsa -b 4096 -C "github-actions-wihy-deployment" -f "$env:USERPROFILE\.ssh\wihy_github_actions"
```

When prompted:
- **Enter passphrase:** Press Enter (leave empty for automation)
- **Enter same passphrase again:** Press Enter

### **Step 2: Copy Private Key for GitHub Secret**

```powershell
# Display the private key
Get-Content "$env:USERPROFILE\.ssh\wihy_github_actions"
```

**Copy the ENTIRE output** (including `-----BEGIN` and `-----END` lines) to your GitHub secret.

### **Step 3: Copy Public Key for VM**

```powershell
# Display the public key  
Get-Content "$env:USERPROFILE\.ssh\wihy_github_actions.pub"
```

**Copy this output** - you'll need it for the VM.

### **Step 4: Update GitHub Secrets**

1. Go to your GitHub repository: https://github.com/kortney-lee/wihy_app
2. Click **Settings** > **Secrets and variables** > **Actions**
3. Find `VM_SSH_PRIVATE_KEY` and click **Update**
4. Paste the **complete private key** from Step 2
5. Ensure these secrets exist:
   - `VM_HOST`: `4.246.82.249`
   - `VM_USERNAME`: `wihyadmin`
   - `VM_SSH_PRIVATE_KEY`: Your complete private key

### **Step 5: Add Public Key to VM**

SSH to your VM and add the public key:

```bash
# SSH to your VM (you may need to use password first time)
ssh wihyadmin@4.246.82.249

# Create .ssh directory if needed
mkdir -p ~/.ssh
chmod 700 ~/.ssh

# Add your public key (replace with your actual public key from Step 3)
echo "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQ... github-actions-wihy-deployment" >> ~/.ssh/authorized_keys

# Set proper permissions
chmod 600 ~/.ssh/authorized_keys

# Verify it was added
cat ~/.ssh/authorized_keys
```

### **Step 6: Test SSH Connection**

From your Windows machine:

```powershell
# Test the connection
ssh -i "$env:USERPROFILE\.ssh\wihy_github_actions" wihyadmin@4.246.82.249 "echo 'SSH test successful'"
```

If this works, your GitHub Actions deployment will work too.

### **Step 7: Deploy Again**

After updating the GitHub secret:

```bash
git add .
git commit -m "Update: Fixed SSH key for deployment"
git push origin main
```

##  **Common Issues & Solutions**

### **Issue: "Load key error in libcrypto"**
- Your private key is malformed or incomplete
- Make sure you copied the ENTIRE key including headers/footers

### **Issue: "Permission denied (publickey)"**  
- Public key not added to VM's authorized_keys
- Wrong username or hostname
- Private key doesn't match public key

### **Issue: Key format not recognized**
- Use RSA format: `ssh-keygen -t rsa -b 4096`
- Don't use newer formats like Ed25519 if VM doesn't support them

## [OK] **Expected Private Key Format**

Your GitHub secret should look exactly like this:

```
-----BEGIN RSA PRIVATE KEY-----
MIIJKAIBAAKCAgEA1234567890abcdef...
...multiple lines of base64 encoded data...
...
-----END RSA PRIVATE KEY-----
```

## [TARGET] **Quick Fix Command Sequence**

If you want to do this quickly:

```powershell
# 1. Generate key
ssh-keygen -t rsa -b 4096 -C "wihy-deploy" -f "$env:USERPROFILE\.ssh\wihy_deploy" -N ""

# 2. Show private key (copy to GitHub secret)
Write-Host "=== PRIVATE KEY FOR GITHUB SECRET ===" -ForegroundColor Green
Get-Content "$env:USERPROFILE\.ssh\wihy_deploy"
Write-Host "=== END PRIVATE KEY ===" -ForegroundColor Green

# 3. Show public key (copy to VM)
Write-Host "`n=== PUBLIC KEY FOR VM ===" -ForegroundColor Yellow
Get-Content "$env:USERPROFILE\.ssh\wihy_deploy.pub"
Write-Host "=== END PUBLIC KEY ===" -ForegroundColor Yellow
```

After running this, copy the private key to GitHub secret `VM_SSH_PRIVATE_KEY` and add the public key to your VM's authorized_keys file.

## [ROCKET] **Ready to Deploy!**

Once you've completed these steps, your GitHub Actions deployment will authenticate successfully and deploy your application to the VM.