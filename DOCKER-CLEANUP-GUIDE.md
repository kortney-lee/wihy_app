# Docker Image Cleanup Guide

## Overview
This document describes the Docker image cleanup system implemented for the WiHy UI production deployment to prevent disk space issues on the VM.

## Cleanup Scripts

### 1. Automated Cleanup (`cleanup-docker-images.sh`)
**When it runs**: Automatically during every GitHub Actions deployment
**Purpose**: Prevents disk space issues by removing old Docker images and containers

#### What it cleans:
- ✅ **Old WiHy images**: Keeps latest 2 of each type (`wihy-ui`, `wihy-ui-test`, `wihy-ui-prod`)
- ✅ **ML/API images**: Keeps latest 1 of each (`wihy-enhanced`, `wihy-ml`, `wihy-trained`)
- ✅ **Azure registry images**: Removes up to 10 old Azure Container Registry images
- ✅ **Dangling images**: All untagged/orphaned images
- ✅ **Old images**: Images older than 24 hours that are unused
- ✅ **Stopped containers**: All containers not currently running
- ✅ **Unused volumes**: Orphaned Docker volumes
- ✅ **Unused networks**: Custom networks no longer in use

#### Safety features:
- ✅ Checks current container is running before cleanup
- ✅ Keeps newest images to prevent breaking deployments
- ✅ Uses force removal with error handling
- ✅ Provides detailed logging of cleanup actions

### 2. Manual Cleanup (`manual-cleanup.sh`)
**When to use**: When you need to manually free disk space on the VM
**Purpose**: Interactive cleanup for maintenance and troubleshooting

#### Usage:
```bash
# SSH to the VM
ssh wihyadmin@4.246.82.249

# Run manual cleanup
~/manual-cleanup.sh
```

#### Features:
- 📊 Shows current Docker disk usage
- 📦 Lists current containers
- 🤔 Asks for confirmation before cleanup
- 📋 Uses the same comprehensive cleanup logic
- 📊 Shows before/after disk usage comparison

## Deployment Integration

### GitHub Actions Workflow
The cleanup is integrated into `.github/workflows/deploy.yml`:

```yaml
# Copy cleanup scripts to VM
copy_with_retry "cleanup-docker-images.sh" || exit 1

# Run cleanup before deployment
echo "🧹 Running comprehensive Docker cleanup..."
chmod +x ~/cleanup-docker-images.sh
~/cleanup-docker-images.sh ${{ env.CONTAINER_NAME }}
```

### Deployment Process
1. **Copy scripts** to VM during deployment
2. **Run cleanup** before starting new container
3. **Load new image** from tar.gz
4. **Stop old container** safely
5. **Start new container** on port 3000
6. **Cleanup completes** with logging

## Monitoring Disk Usage

### Quick Commands
```bash
# Check Docker disk usage
ssh wihyadmin@4.246.82.249 "sudo docker system df"

# Check overall disk usage
ssh wihyadmin@4.246.82.249 "df -h"

# List all Docker images
ssh wihyadmin@4.246.82.249 "sudo docker images"

# List running containers
ssh wihyadmin@4.246.82.249 "sudo docker ps"
```

### Disk Usage Targets
- **Docker Images**: Keep under 10GB total
- **Containers**: Only 1-2 running containers
- **Volumes**: Minimal unused volumes
- **Overall VM**: Keep under 80% disk usage

## Troubleshooting

### If Cleanup Fails
```bash
# Manual fallback cleanup
ssh wihyadmin@4.246.82.249
sudo docker system prune -a -f --volumes

# Emergency: Remove specific images
sudo docker rmi $(sudo docker images -q) --force
```

### If Disk Space Critical
```bash
# Aggressive cleanup (removes ALL unused images)
sudo docker system prune -a --force

# Check what's using space
sudo du -sh /var/lib/docker/*
```

### Common Issues
1. **"No space left on device"**: Run manual cleanup immediately
2. **"Image in use"**: Stop containers first, then cleanup
3. **Permission denied**: Ensure sudo access for Docker commands

## Best Practices

### For Developers
- ✅ Let automatic cleanup handle routine maintenance
- ✅ Monitor deployment logs for cleanup warnings
- ✅ Run manual cleanup if deployment fails due to space

### For Operations
- 🔍 Check disk usage weekly: `ssh wihyadmin@4.246.82.249 "df -h"`
- 📊 Review Docker usage monthly: `sudo docker system df`
- 🧹 Run manual cleanup if disk usage > 80%

### Emergency Contacts
If cleanup scripts fail or disk space becomes critical:
1. **Stop non-essential containers**: `sudo docker stop $(sudo docker ps -q)`
2. **Emergency cleanup**: `sudo docker system prune -a --force --volumes`
3. **Restart deployment**: Push to main branch again

## Files Modified
- `.github/workflows/deploy.yml`: Integrated automated cleanup
- `cleanup-docker-images.sh`: Comprehensive cleanup script
- `manual-cleanup.sh`: Interactive cleanup tool
- `DEPLOYMENT-QUICK-REFERENCE.md`: Updated emergency procedures

## Monitoring Commands
```bash
# Complete health check
ssh wihyadmin@4.246.82.249 "
  echo '=== DISK USAGE ==='
  df -h
  echo '=== DOCKER USAGE ==='
  sudo docker system df
  echo '=== CONTAINERS ==='
  sudo docker ps
  echo '=== IMAGES ==='
  sudo docker images | head -10
"
```

This cleanup system ensures the production VM maintains optimal disk space usage while preserving deployment reliability.