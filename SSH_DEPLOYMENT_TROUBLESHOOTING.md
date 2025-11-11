# GitHub Actions SSH Setup - Troubleshooting Guide

## Current Error: Permission denied (publickey)

The deployment is failing because of SSH authentication issues. Here's how to fix it:

## 🔑 Step 1: Check Your SSH Key Format

Your `VM_SSH_PRIVATE_KEY` GitHub secret must contain a properly formatted private key:

### ✅ Correct Format (OpenSSH):
```
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAGwAAAAdzc2gtcn
NhAAAAAwEAAQAAAQEA2...
...
-----END OPENSSH PRIVATE KEY-----
```

### ✅ Correct Format (RSA):
```
-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA2...
...
-----END RSA PRIVATE KEY-----
```

### ❌ Common Issues:
- Missing `-----BEGIN` or `-----END` lines
- Extra spaces or characters
- Windows line endings (`\r\n` instead of `\n`)
- Partial key content

## 🖥️ Step 2: Generate a New SSH Key Pair (If Needed)

If your current key is invalid, generate a new one:

```bash
# On your local machine or in the VM
ssh-keygen -t rsa -b 4096 -C "github-actions@wihy.ai" -f ~/.ssh/wihy_github_actions

# This creates:
# - ~/.ssh/wihy_github_actions (private key - goes in GitHub secret)
# - ~/.ssh/wihy_github_actions.pub (public key - goes on VM)
```

## 🔧 Step 3: Add Public Key to VM

SSH to your VM and add the public key:

```bash
# SSH to your VM
ssh wihyadmin@4.246.82.249

# Create .ssh directory if it doesn't exist
mkdir -p ~/.ssh
chmod 700 ~/.ssh

# Add your public key to authorized_keys
echo "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQC... github-actions@wihy.ai" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys

# Verify the file
cat ~/.ssh/authorized_keys
```

## 📋 Step 4: Update GitHub Secrets

In your GitHub repository, go to **Settings > Secrets and variables > Actions** and verify/update:

### Required Secrets:
```
VM_HOST=4.246.82.249
VM_USERNAME=wihyadmin
VM_SSH_PRIVATE_KEY=<paste your ENTIRE private key including BEGIN/END lines>
```

### ⚠️ Common Secret Issues:
- **VM_SSH_PRIVATE_KEY**: Must include the complete private key with headers
- **Whitespace**: Don't add extra spaces before/after the key
- **Line endings**: GitHub handles this, but ensure you copy the entire key

## 🧪 Step 5: Test SSH Connection Locally

Test the connection from your local machine:

```bash
# Save your private key to a temporary file
echo "-----BEGIN OPENSSH PRIVATE KEY-----
your-private-key-content-here
-----END OPENSSH PRIVATE KEY-----" > /tmp/test_key

# Set proper permissions
chmod 600 /tmp/test_key

# Test SSH connection
ssh -i /tmp/test_key wihyadmin@4.246.82.249 "echo 'SSH test successful'"

# Clean up
rm /tmp/test_key
```

## 🚀 Step 6: Re-run Deployment

After fixing the SSH setup:

```bash
git add .
git commit -m "Fix: Update SSH configuration for deployment"
git push origin main
```

## 🔍 Advanced Troubleshooting

### Check VM SSH Configuration
SSH to your VM and verify SSH daemon config:

```bash
# Check SSH daemon config
sudo cat /etc/ssh/sshd_config | grep -E "(PubkeyAuthentication|PasswordAuthentication|PermitRootLogin)"

# Should show:
# PubkeyAuthentication yes
# PasswordAuthentication no (recommended)
# PermitRootLogin no (recommended)

# Restart SSH daemon if you made changes
sudo systemctl restart ssh
```

### Check VM Firewall
```bash
# Check if SSH port 22 is open
sudo ufw status | grep 22

# If not open:
sudo ufw allow ssh
sudo ufw reload
```

### Generate SSH Key Specifically for GitHub Actions
```bash
# Create a dedicated key for GitHub Actions
ssh-keygen -t ed25519 -C "github-actions-wihy-deployment" -f ~/.ssh/github_actions_key

# Copy the private key content for GitHub secret
cat ~/.ssh/github_actions_key

# Copy the public key for VM authorized_keys
cat ~/.ssh/github_actions_key.pub
```

## 📊 Alternative: Use GitHub SSH Agent

If you continue having issues, you can use the ssh-agent action:

```yaml
- name: Setup SSH Agent
  uses: webfactory/ssh-agent@v0.7.0
  with:
    ssh-private-key: ${{ secrets.VM_SSH_PRIVATE_KEY }}

- name: Copy files to VM
  run: |
    scp -o StrictHostKeyChecking=no wihy-ui-image.tar.gz ${{ secrets.VM_USERNAME }}@${{ secrets.VM_HOST }}:~/
```

## ✅ Verification Checklist

Before the next deployment, verify:

- [ ] Private key in GitHub secret includes `-----BEGIN` and `-----END` lines
- [ ] Public key is added to VM's `~/.ssh/authorized_keys`
- [ ] VM SSH daemon allows public key authentication
- [ ] VM firewall allows SSH connections (port 22)
- [ ] SSH connection test passes from local machine
- [ ] GitHub secrets are correctly named and formatted

The improved deployment workflow now includes:
- SSH key format validation
- Connection testing before deployment
- Retry logic for file transfers
- Better error messages

Your next deployment should succeed! 🚀