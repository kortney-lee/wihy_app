#!/bin/bash
# Manual Docker Cleanup Script for WiHy UI Production VM
# Run this manually when you need to free up disk space

echo "🧹 Manual Docker Cleanup for WiHy UI Production"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Show current disk usage
echo "📊 Current Docker disk usage:"
sudo docker system df
echo ""

# Show current containers
echo "📦 Current containers:"
sudo docker ps -a --format "table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}"
echo ""

# Confirm before proceeding
read -p "🤔 Do you want to proceed with cleanup? This will remove old images and containers. (y/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Cleanup cancelled"
    exit 0
fi

echo "🚀 Starting cleanup..."

# Use the comprehensive cleanup script
if [ -f ~/cleanup-docker-images.sh ]; then
    echo "📋 Running comprehensive cleanup script..."
    chmod +x ~/cleanup-docker-images.sh
    ~/cleanup-docker-images.sh wihy-ui-app
else
    echo "⚠️  Cleanup script not found, running basic cleanup..."
    
    # Basic cleanup if script is missing
    echo "🗑️  Removing dangling images..."
    sudo docker image prune -f
    
    echo "📅 Removing images older than 7 days..."
    sudo docker image prune -a --filter "until=168h" -f
    
    echo "📦 Removing stopped containers..."
    sudo docker container prune -f
    
    echo "💾 Removing unused volumes..."
    sudo docker volume prune -f
    
    echo "🌐 Removing unused networks..."
    sudo docker network prune -f
fi

echo ""
echo "📊 Docker disk usage after cleanup:"
sudo docker system df

echo ""
echo "✅ Manual cleanup completed!"
echo "🔄 For automatic cleanup during deployments, the cleanup runs automatically"