#!/bin/bash

# Add local SSH key to VM authorized_keys
# This script will be run via GitHub Actions to add your local SSH key

echo "🔑 Adding local SSH key to VM..."

# Your SSH public key (replace this with your actual public key)
LOCAL_SSH_KEY="ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQDHHIe1JQIMwZFB6Nq1zDfgAhq8BT/8PlURjYKrlW8oBzBsvKlqSpa0W30zfGU2b7HR8i9cyPLFmA3bW+OYuLlFn//xLN9scHSrs2N/plLbXrWdV91Zk6lG/M54LFpK4HxejTLUFE53Xq1C6PJ5TUqlclxBpOoYFXj39fXYjprk+4tWZHLhiZY7ZZ52Wgi+elrpv4XmpoyKlHVLYtUYHUYAvqzhNVSTqm3y7HBKTMsSfnJv7tI7tH+zQLVLcrQCopHmkya7JmofATfQtMkqzFTJ+PJiiCwilfPOq7qdLnGEH5VPNn5H2gFyQg7fzjDEmjt0B21XGuh00wN0Yi/7/dbL"

# Add the key to authorized_keys if it's not already there
if ! grep -q "$LOCAL_SSH_KEY" ~/.ssh/authorized_keys 2>/dev/null; then
    echo "$LOCAL_SSH_KEY" >> ~/.ssh/authorized_keys
    echo "✅ SSH key added to authorized_keys"
else
    echo "✅ SSH key already exists in authorized_keys"
fi

# Set proper permissions
chmod 600 ~/.ssh/authorized_keys
chmod 700 ~/.ssh

echo "🔑 SSH key setup complete"
echo "📋 You can now connect with: ssh wihyadmin@4.246.82.249"