#!/bin/bash
# Docker Image Cleanup Script for WiHy UI Deployment
# Removes old images while keeping current deployment safe

set -e

echo "🧹 Starting Docker image cleanup..."

# Function to safely remove images
cleanup_images() {
    local image_pattern=$1
    local keep_count=${2:-1}
    
    echo "📋 Cleaning up images matching: $image_pattern (keeping latest $keep_count)"
    
    # Get images sorted by creation date (newest first)
    local images=$(sudo docker images --format "table {{.Repository}}:{{.Tag}}\t{{.ID}}\t{{.CreatedAt}}" | grep "$image_pattern" | tail -n +2 | sort -k3 -r || true)
    
    if [ -z "$images" ]; then
        echo "   No images found matching pattern: $image_pattern"
        return 0
    fi
    
    # Skip the newest images (keep_count)
    local images_to_remove=$(echo "$images" | tail -n +$((keep_count + 1)) || true)
    
    if [ -z "$images_to_remove" ]; then
        echo "   No old images to remove (${keep_count} or fewer total images)"
        return 0
    fi
    
    # Remove old images
    echo "$images_to_remove" | while read -r line; do
        local image_id=$(echo "$line" | awk '{print $2}')
        local image_name=$(echo "$line" | awk '{print $1}')
        echo "   Removing: $image_name ($image_id)"
        sudo docker rmi "$image_id" --force 2>/dev/null || echo "     ⚠️  Failed to remove $image_id (may be in use)"
    done
}

# Stop script if current container is running (safety check)
CURRENT_CONTAINER="${1:-wihy-ui-app}"
if sudo docker ps --filter name="$CURRENT_CONTAINER" --format '{{.Names}}' | grep -q "^${CURRENT_CONTAINER}$"; then
    echo "✅ Current container $CURRENT_CONTAINER is running - proceeding with cleanup"
else
    echo "⚠️  Warning: Current container $CURRENT_CONTAINER is not running"
fi

# Clean up WiHy-related images (keep latest 2 of each type)
echo "🏷️  Cleaning up WiHy application images..."
cleanup_images "wihy-ui" 2
cleanup_images "wihy-ui-test" 1
cleanup_images "wihy-ui-prod" 1

# Clean up any leftover WiHy ML/API images (keep latest 1)
echo "🤖 Cleaning up WiHy ML/API images..."
cleanup_images "wihy-enhanced" 1
cleanup_images "wihy-ml" 1
cleanup_images "wihy-trained" 1
cleanup_images "rss-ml-service" 1

# Clean up Azure Container Registry images (these can be re-pulled)
echo "☁️  Cleaning up Azure registry images..."
sudo docker images --format "table {{.Repository}}:{{.Tag}}\t{{.ID}}" | grep -E "(azurecr\.io|wihyregistry)" | awk '{print $2}' | head -10 | while read -r image_id; do
    if [ -n "$image_id" ]; then
        echo "   Removing Azure registry image: $image_id"
        sudo docker rmi "$image_id" --force 2>/dev/null || echo "     ⚠️  Failed to remove $image_id"
    fi
done

# Remove dangling images
echo "🗑️  Removing dangling images..."
sudo docker image prune -f

# Remove unused images older than 24 hours
echo "📅 Removing unused images older than 24 hours..."
sudo docker image prune -a --filter "until=24h" -f

# Clean up stopped containers
echo "📦 Removing stopped containers..."
sudo docker container prune -f

# Clean up unused volumes
echo "💾 Removing unused volumes..."
sudo docker volume prune -f

# Clean up unused networks
echo "🌐 Removing unused networks..."
sudo docker network prune -f

# Show disk usage after cleanup
echo "📊 Docker disk usage after cleanup:"
sudo docker system df

# Show remaining images
echo "🏷️  Remaining images:"
sudo docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}" | head -20

# Calculate space saved (approximate)
echo "✅ Docker cleanup completed!"
echo "💡 Tip: Run 'sudo docker system df' to see current disk usage"
echo "🔄 This script ran during deployment to prevent disk space issues"