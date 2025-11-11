#!/bin/bash
# Cache Busting Deployment Script
# Run this script after each deployment to force client cache refresh

echo "🚀 Starting cache-busting deployment..."

# 1. Update cache version in API config
CURRENT_VERSION=$(grep "CACHE_VERSION = " client/src/config/apiConfig.ts | grep -o "v[0-9]\+\.[0-9]\+\.[0-9]\+")
echo "📦 Current cache version: $CURRENT_VERSION"

# Generate new version (increment patch number)
NEW_VERSION=$(echo $CURRENT_VERSION | awk -F. '{$NF = $NF + 1;} 1' | sed 's/ /./g')
echo "📦 New cache version: $NEW_VERSION"

# Update the version in apiConfig.ts
sed -i "s/CACHE_VERSION = '$CURRENT_VERSION'/CACHE_VERSION = '$NEW_VERSION'/g" client/src/config/apiConfig.ts
echo "✅ Updated cache version in apiConfig.ts"

# 2. Build the application
echo "🔨 Building application..."
cd client
npm run build
cd ..

# 3. Deploy (add your deployment commands here)
echo "🚀 Deploying application..."
# Add your deployment commands here
# Example: 
# scp -r client/build/* user@server:/var/www/html/
# or
# aws s3 sync client/build/ s3://your-bucket/

echo "✅ Deployment complete!"
echo "📱 Mobile users should now see the updated configuration"
echo "🔍 New cache version: $NEW_VERSION"