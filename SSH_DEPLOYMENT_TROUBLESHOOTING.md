# GitHub Actions SSH Deployment - Complete Guide

## [PAGE] Overview

This guide explains how SSH authentication is configured for automated deployments from GitHub Actions to the Azure VM. The system uses public key authentication for secure, passwordless deployments.

## ️ Architecture

```
GitHub Actions Workflow
    ↓ (uses SSH private key from secrets)
    ↓
SSH Connection
    ↓
Azure VM (4.246.82.249)
    ↓ (validates against authorized_keys)
    ↓
Deployment Complete
```

##  How It Works

### 1. **SSH Key Pair**
- **Private Key**: Stored in GitHub Secrets (`VM_SSH_PRIVATE_KEY`)
- **Public Key**: Stored on VM in `~/.ssh/authorized_keys`
- **Algorithm**: RSA 4096-bit or ED25519 (recommended)

### 2. **Authentication Flow**
1. GitHub Actions reads the private key from secrets
2. SSH client uses the private key to initiate connection
3. VM checks if the corresponding public key exists in `authorized_keys`
4. If matched, connection is established (no password needed)
5. Deployment commands execute on the VM

### 3. **Current Configuration**
- **VM Host**: `4.246.82.249` (wihy-ui-prod-vm)
- **VM User**: `wihyadmin`
- **SSH Port**: `22` (default)
- **Key Location on VM**: `/home/wihyadmin/.ssh/authorized_keys`
- **Authentication Method**: Public key only (password auth disabled for security)

## [OK] Current Status

SSH authentication is **configured and working**. Last successful connection: `Mon Dec 8 03:42:40 UTC 2025`

---

## [TOOL] Configuration Steps (For Reference)

### Initial Setup (Already Completed)

### Initial Setup (Already Completed)

#### Step 1: Generate SSH Key Pair

```bash
# Generate a new SSH key pair (done once)
ssh-keygen -t rsa -b 4096 -C "github-actions@wihy.ai" -f ~/.ssh/wihy_github_actions

# This creates two files:
# - ~/.ssh/wihy_github_actions (private key - NEVER share this)
# - ~/.ssh/wihy_github_actions.pub (public key - safe to share)
```

#### Step 2: Add Public Key to VM

```bash
# SSH to the VM
ssh wihyadmin@4.246.82.249

# Create .ssh directory if it doesn't exist
mkdir -p ~/.ssh
chmod 700 ~/.ssh

# Add your public key to authorized_keys
cat ~/.ssh/wihy_github_actions.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys

# Verify the key was added
cat ~/.ssh/authorized_keys
```

#### Step 3: Add Private Key to GitHub Secrets

1. Go to your GitHub repository: `https://github.com/kortney-lee/wihy_app`
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Add the following secrets:

| Secret Name | Value | Description |
|-------------|-------|-------------|
| `VM_HOST` | `4.246.82.249` | Azure VM IP address |
| `VM_USERNAME` | `wihyadmin` | SSH username on the VM |
| `VM_SSH_PRIVATE_KEY` | `<full private key content>` | Complete private key including `-----BEGIN` and `-----END` lines |

#### Step 4: Configure GitHub Actions Workflow

The workflow file (`.github/workflows/deploy.yml`) uses these secrets:

```yaml
- name: Copy Docker image to VM
  env:
    VM_HOST: ${{ secrets.VM_HOST }}
    VM_USERNAME: ${{ secrets.VM_USERNAME }}
    VM_SSH_PRIVATE_KEY: ${{ secrets.VM_SSH_PRIVATE_KEY }}
  run: |
    # Create SSH key file
    echo "$VM_SSH_PRIVATE_KEY" > /tmp/ssh_key
    chmod 600 /tmp/ssh_key
    
    # Copy files using SCP
    scp -i /tmp/ssh_key -o StrictHostKeyChecking=no \
      wihy-ui-image.tar.gz $VM_USERNAME@$VM_HOST:~/
    
    # Execute deployment commands via SSH
    ssh -i /tmp/ssh_key -o StrictHostKeyChecking=no \
      $VM_USERNAME@$VM_HOST "docker load < wihy-ui-image.tar.gz"
```

---

##  Testing & Verification

### Test SSH Connection Locally

```bash
# Test connection from your local machine
ssh wihyadmin@4.246.82.249 "echo 'Connection successful'; hostname"

# Expected output:
# Connection successful
# wihy-ui-prod-vm
```

### Test with Private Key File

```bash
# Save your private key to a test file
cat > /tmp/test_key << 'EOF'
-----BEGIN OPENSSH PRIVATE KEY-----
<your private key content>
-----END OPENSSH PRIVATE KEY-----
EOF

# Set proper permissions
chmod 600 /tmp/test_key

# Test connection
ssh -i /tmp/test_key wihyadmin@4.246.82.249 "echo 'Key authentication works'"

# Clean up
rm /tmp/test_key
```

### Verify VM Configuration

```bash
# SSH to the VM
ssh wihyadmin@4.246.82.249

# Check SSH daemon configuration
sudo cat /etc/ssh/sshd_config | grep -E "(PubkeyAuthentication|PasswordAuthentication|PermitRootLogin)"

# Expected output:
# PubkeyAuthentication yes
# PasswordAuthentication no
# PermitRootLogin no

# Check authorized_keys permissions
ls -la ~/.ssh/authorized_keys
# Should show: -rw------- (600)

# Check .ssh directory permissions
ls -ld ~/.ssh
# Should show: drwx------ (700)
```

---

##  Troubleshooting

### Common Issues & Solutions

### Common Issues & Solutions

#### Issue 1: Permission Denied (publickey)

**Symptoms:**
```
Permission denied (publickey).
```

**Causes:**
- Private key doesn't match public key on VM
- Wrong key format in GitHub secret
- Incorrect permissions on VM

**Solutions:**
```bash
# 1. Verify public key is on VM
ssh wihyadmin@4.246.82.249
cat ~/.ssh/authorized_keys

# 2. Check GitHub secret format
# Must include -----BEGIN and -----END lines
# No extra spaces or line breaks

# 3. Regenerate key pair if needed
ssh-keygen -t rsa -b 4096 -C "github-actions@wihy.ai" -f ~/.ssh/new_key
```

#### Issue 2: Key Format Problems

**Valid Private Key Formats:**

**OpenSSH Format** (Recommended):
```
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAGwAAAAdzc2gtcn
NhAAAAAwEAAQAAAQEA2...
...
-----END OPENSSH PRIVATE KEY-----
```

**RSA Format**:
```
-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA2...
...
-----END RSA PRIVATE KEY-----
```

**Common Problems:**
- [X] Missing `-----BEGIN` or `-----END` lines
- [X] Extra spaces before/after the key
- [X] Windows line endings (`\r\n` instead of `\n`)
- [X] Partial key content (must be complete)
- [X] Encrypted key (should be unencrypted for automation)

#### Issue 3: Connection Timeout

**Symptoms:**
```
Connection timed out
```

**Solutions:**
```bash
# Check VM firewall
sudo ufw status | grep 22

# If SSH not allowed:
sudo ufw allow ssh
sudo ufw reload

# Check Azure NSG (Network Security Group)
# Ensure port 22 is open from GitHub Actions IPs
```

#### Issue 4: Host Key Verification Failed

**Symptoms:**
```
Host key verification failed
```

**Solution:**
Add `StrictHostKeyChecking=no` to SSH commands:
```bash
ssh -o StrictHostKeyChecking=no wihyadmin@4.246.82.249
```

---

## [LOCK] Security Best Practices

### Current Implementation [OK]

1. **Public Key Authentication Only**
   - Password authentication disabled
   - Root login disabled
   - Key-based auth only

2. **Private Key Protection**
   - Stored in GitHub Secrets (encrypted at rest)
   - Never committed to repository
   - Temporary files deleted after use

3. **VM Hardening**
   - Firewall enabled (UFW)
   - Only necessary ports open (22, 80, 443)
   - Regular security updates applied

4. **Least Privilege**
   - Dedicated user (`wihyadmin`) for deployments
   - No root access via SSH
   - Limited sudo permissions

### Recommended Practices

- **Rotate Keys Regularly**: Change SSH keys every 90 days
- **Monitor Access**: Review SSH logs periodically
- **Use ED25519**: Consider migrating to ED25519 keys (more secure, faster)
- **IP Restrictions**: Limit SSH access to specific IPs if possible
- **2FA for GitHub**: Protect GitHub account with 2FA

---

## [CHART] Monitoring & Logs

### Check SSH Logs on VM

```bash
# View recent SSH authentication attempts
sudo tail -f /var/log/auth.log | grep sshd

# Check for failed login attempts
sudo grep "Failed password" /var/log/auth.log

# View successful connections
sudo grep "Accepted publickey" /var/log/auth.log
```

### GitHub Actions Logs

View deployment logs at:
```
https://github.com/kortney-lee/wihy_app/actions
```

Look for:
- SSH connection establishment
- File transfer progress
- Command execution output
- Any error messages

---

## [CYCLE] Key Rotation Procedure

When rotating SSH keys:

1. **Generate New Key Pair**
   ```bash
   ssh-keygen -t rsa -b 4096 -C "github-actions-$(date +%Y%m%d)" -f ~/.ssh/wihy_new
   ```

2. **Add New Public Key to VM** (keep old one temporarily)
   ```bash
   cat ~/.ssh/wihy_new.pub >> ~/.ssh/authorized_keys
   ```

3. **Update GitHub Secret**
   - Replace `VM_SSH_PRIVATE_KEY` with new private key content

4. **Test Deployment**
   - Run a test deployment to verify new key works

5. **Remove Old Public Key**
   ```bash
   # Edit authorized_keys and remove the old key
   nano ~/.ssh/authorized_keys
   ```

---

## [OK] Verification Checklist

Before each deployment, verify:

- [ ] Private key in GitHub secret includes complete key with headers
- [ ] Public key exists in VM's `~/.ssh/authorized_keys`
- [ ] VM SSH daemon allows public key authentication (`PubkeyAuthentication yes`)
- [ ] VM firewall allows SSH connections on port 22
- [ ] Azure NSG allows inbound SSH traffic
- [ ] GitHub Actions workflow references correct secrets
- [ ] Test connection succeeds from local machine

---

## [BOOKS] Additional Resources

- [GitHub Actions SSH Setup Guide](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/using-secrets-in-github-actions)
- [SSH Key Generation Guide](https://docs.github.com/en/authentication/connecting-to-github-with-ssh/generating-a-new-ssh-key-and-adding-it-to-the-ssh-agent)
- [Azure VM Security Best Practices](https://learn.microsoft.com/en-us/azure/virtual-machines/security-recommendations)

---

## [TARGET] Quick Reference

### Essential Commands

```bash
# Test SSH connection
ssh wihyadmin@4.246.82.249 "hostname"

# Check VM authorized keys
ssh wihyadmin@4.246.82.249 "cat ~/.ssh/authorized_keys"

# View SSH daemon config
ssh wihyadmin@4.246.82.249 "sudo cat /etc/ssh/sshd_config"

# Check firewall status
ssh wihyadmin@4.246.82.249 "sudo ufw status"

# View recent auth logs
ssh wihyadmin@4.246.82.249 "sudo tail -20 /var/log/auth.log"
```

### GitHub Secrets

```yaml
VM_HOST: 4.246.82.249
VM_USERNAME: wihyadmin
VM_SSH_PRIVATE_KEY: <complete private key with BEGIN/END lines>
```

---

**Last Updated**: December 8, 2025  
**Status**: [OK] SSH authentication working correctly  
**Last Successful Connection**: Mon Dec 8 03:42:40 UTC 2025