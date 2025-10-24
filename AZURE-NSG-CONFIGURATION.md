# Azure Network Security Group Configuration for WiHy UI

## Overview
This document explains the Azure NSG configuration required for WiHy UI to work properly, based on the working configuration from `wihy-ml-vmNSG`.

## Problem We Solved
The original deployment used `az vm open-port` which created conflicting rules with the same priority, causing HTTPS access to fail. The solution was to create specific NSG rules with different priorities.

## Working Configuration

### Resource Group: `vHealth`
### NSG Name: `wihy-ui-prod-vm-nsg`

### Required NSG Rules:

| Rule Name | Priority | Protocol | Direction | Port | Source | Destination | Access |
|-----------|----------|----------|-----------|------|--------|-------------|--------|
| `default-allow-ssh` | 1000 | Tcp | Inbound | 22 | * | * | Allow |
| `open-port-80` | 900 | * | Inbound | 80 | * | * | Allow |
| `allow-https` | 910 | Tcp | Inbound | 443 | * | * | Allow |

## Manual Configuration Commands

If Azure CLI authentication fails during deployment, use these commands manually:

### 1. List NSGs to confirm name:
```bash
az network nsg list --resource-group vHealth --output table
```

### 2. Check current rules:
```bash
az network nsg rule list --resource-group vHealth --nsg-name wihy-ui-prod-vm-nsg --output table
```

### 3. Create missing HTTP rule (if needed):
```bash
az network nsg rule create \
  --resource-group vHealth \
  --nsg-name wihy-ui-prod-vm-nsg \
  --name open-port-80 \
  --protocol '*' \
  --priority 900 \
  --destination-port-range 80 \
  --access Allow \
  --source-address-prefix '*' \
  --destination-address-prefix '*'
```

### 4. Create missing HTTPS rule (if needed):
```bash
az network nsg rule create \
  --resource-group vHealth \
  --nsg-name wihy-ui-prod-vm-nsg \
  --name allow-https \
  --protocol Tcp \
  --priority 910 \
  --destination-port-range 443 \
  --access Allow \
  --source-address-prefix '*' \
  --destination-address-prefix '*'
```

## Deployment Workflow Integration

The updated `.github/workflows/deploy.yml` now:

1. **Detects the NSG name automatically** using Azure CLI queries
2. **Checks if rules exist** before creating them (prevents conflicts)
3. **Uses specific priorities** (900 for HTTP, 910 for HTTPS)
4. **Provides fallback instructions** if Azure CLI authentication fails
5. **Includes detailed logging** for troubleshooting

## Verification

After configuration, verify with:

```bash
# Test HTTP (should work)
curl -I http://wihy.ai/health

# Test HTTPS (should work)
curl -I https://wihy.ai/health

# Check NSG rules
az network nsg rule list --resource-group vHealth --nsg-name wihy-ui-prod-vm-nsg --output table
```

## Architecture Flow

```
Internet Request
    ↓
Azure NSG (vHealth/wihy-ui-prod-vm-nsg)
├── Rule: open-port-80 (Priority 900) → Port 80
├── Rule: allow-https (Priority 910) → Port 443
└── Rule: default-allow-ssh (Priority 1000) → Port 22
    ↓
VM (4.246.82.249)
    ↓
Nginx (Reverse Proxy)
├── Port 80 → HTTP redirects to HTTPS
└── Port 443 → HTTPS → proxy_pass http://localhost:3000
    ↓
Docker Container (wihy-ui-app)
├── External Port: 3000
├── Internal Port: 80
└── Application: WiHy UI React App
    ↓
API Calls → https://ml.wihy.ai (Enhanced Model)
```

## Troubleshooting

### Common Issues:

1. **"SecurityRuleConflict" error**:
   - Caused by using `az vm open-port` multiple times
   - Solution: Delete conflicting rules and recreate with specific priorities

2. **HTTPS not accessible but HTTP works**:
   - Missing or misconfigured port 443 rule
   - Solution: Add `allow-https` rule with priority 910

3. **Neither HTTP nor HTTPS work**:
   - NSG rules missing entirely
   - Solution: Create both port 80 and 443 rules

### Debug Commands:

```bash
# Check VM status
az vm get-instance-view --resource-group vHealth --name wihy-ui-prod-vm

# Check NSG association
az vm show --resource-group vHealth --name wihy-ui-prod-vm --query "networkProfile.networkInterfaces[0].id" -o tsv

# Test connectivity
telnet wihy.ai 80
telnet wihy.ai 443
```

## Reference: Working vs Broken Configuration

### ✅ Working (`wihy-ml-vmNSG`):
```
open-port-80    | Priority 900 | Protocol * | Port 80
allow-https     | Priority 910 | Protocol Tcp | Port 443
```

### ❌ Broken (original `wihy-ui-prod-vm-nsg`):
```
open-port-80    | Priority 900 | Protocol * | Port 80
# Missing HTTPS rule - caused external access failure
```

### ✅ Fixed (`wihy-ui-prod-vm-nsg`):
```
open-port-80    | Priority 900 | Protocol * | Port 80
allow-https     | Priority 910 | Protocol Tcp | Port 443
```

This configuration ensures reliable HTTPS access for any new WiHy UI deployment.