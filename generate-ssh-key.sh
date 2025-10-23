#!/bin/bash
# SSH Key Generation Script for GitHub Actions Deployment
# This script generates a new SSH key pair for automated deployment

set -e

echo "🔑 Generating SSH Key Pair for GitHub Actions Deployment"
echo "======================================================"

# Create .ssh directory if it doesn't exist
mkdir -p ~/.ssh
chmod 700 ~/.ssh

# Generate SSH key pair
echo "📋 Generating new SSH key pair..."
ssh-keygen -t rsa -b 4096 -C "github-actions-wihy-deployment" -f ~/.ssh/wihy_github_actions -N ""

echo "✅ SSH key pair generated successfully!"
echo ""

# Display the private key for GitHub secret
echo "🔐 COPY THIS PRIVATE KEY TO GITHUB SECRET 'VM_SSH_PRIVATE_KEY':"
echo "================================================================"
cat ~/.ssh/wihy_github_actions
echo "================================================================"
echo ""

# Display the public key for VM authorized_keys
echo "🔓 COPY THIS PUBLIC KEY TO VM authorized_keys:"
echo "=============================================="
cat ~/.ssh/wihy_github_actions.pub
echo "=============================================="
echo ""

# Provide instructions
echo "📋 NEXT STEPS:"
echo "1. Copy the PRIVATE KEY above to GitHub Secrets > VM_SSH_PRIVATE_KEY"
echo "2. SSH to your VM: ssh wihyadmin@4.246.82.249"
echo "3. Run: echo '$(cat ~/.ssh/wihy_github_actions.pub)' >> ~/.ssh/authorized_keys"
echo "4. Run: chmod 600 ~/.ssh/authorized_keys"
echo "5. Test: ssh -i ~/.ssh/wihy_github_actions wihyadmin@4.246.82.249 'echo SSH test successful'"
echo ""

# Test the key format
echo "🧪 Testing SSH key format..."
if ssh-keygen -l -f ~/.ssh/wihy_github_actions >/dev/null 2>&1; then
    echo "✅ SSH private key format is valid"
else
    echo "❌ SSH private key format is invalid"
    exit 1
fi

echo "🎉 SSH key generation completed!"
echo "Follow the instructions above to configure GitHub Actions deployment."