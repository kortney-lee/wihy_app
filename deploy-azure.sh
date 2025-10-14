#!/bin/bash
# WIHY UI - Complete Azure Deployment Script
# Run this script to deploy your containerized React app to Azure Container Apps

set -e  # Exit on any error

echo "🚀 WIHY UI - Azure Container Apps Deployment"
echo "=============================================="

# Configuration
RESOURCE_GROUP="rg-wihy"
LOCATION="eastus"
REGISTRY_NAME="wihyregistry$(date +%s)"  # Add timestamp for uniqueness
CONTAINER_APP_ENV="wihy-env"
CONTAINER_APP_NAME="wihy-ui"
IMAGE_NAME="wihy-ui"

echo "📋 Configuration:"
echo "   Resource Group: $RESOURCE_GROUP"
echo "   Location: $LOCATION"
echo "   Registry: $REGISTRY_NAME"
echo "   Container App: $CONTAINER_APP_NAME"
echo ""

# Step 1: Login to Azure
echo "🔐 Step 1: Login to Azure..."
az login --use-device-code

# Step 2: Create Resource Group
echo "📁 Step 2: Creating resource group..."
az group create \
  --name $RESOURCE_GROUP \
  --location $LOCATION

# Step 3: Create Container Registry
echo "📦 Step 3: Creating Azure Container Registry..."
az acr create \
  --resource-group $RESOURCE_GROUP \
  --name $REGISTRY_NAME \
  --sku Basic \
  --admin-enabled true

# Get registry login server
REGISTRY_SERVER=$(az acr show --name $REGISTRY_NAME --resource-group $RESOURCE_GROUP --query loginServer --output tsv)
echo "   Registry Server: $REGISTRY_SERVER"

# Step 4: Build and Push Container
echo "🐳 Step 4: Building and pushing container..."

# Login to ACR
az acr login --name $REGISTRY_NAME

# Build and tag image
docker build -t $REGISTRY_SERVER/$IMAGE_NAME:latest .

# Push to registry
docker push $REGISTRY_SERVER/$IMAGE_NAME:latest

echo "   ✅ Container pushed to: $REGISTRY_SERVER/$IMAGE_NAME:latest"

# Step 5: Create Container Apps Environment
echo "🌐 Step 5: Creating Container Apps environment..."
az containerapp env create \
  --name $CONTAINER_APP_ENV \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION

# Step 6: Deploy Container App
echo "🚀 Step 6: Deploying Container App..."

# Get registry credentials
REGISTRY_USERNAME=$(az acr credential show --name $REGISTRY_NAME --query username --output tsv)
REGISTRY_PASSWORD=$(az acr credential show --name $REGISTRY_NAME --query passwords[0].value --output tsv)

az containerapp create \
  --name $CONTAINER_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --environment $CONTAINER_APP_ENV \
  --image $REGISTRY_SERVER/$IMAGE_NAME:latest \
  --target-port 80 \
  --ingress external \
  --registry-server $REGISTRY_SERVER \
  --registry-username $REGISTRY_USERNAME \
  --registry-password $REGISTRY_PASSWORD \
  --min-replicas 0 \
  --max-replicas 10 \
  --cpu 0.25 \
  --memory 0.5Gi

# Step 7: Get App URL
echo "🎉 Step 7: Deployment complete!"
APP_URL=$(az containerapp show --name $CONTAINER_APP_NAME --resource-group $RESOURCE_GROUP --query properties.configuration.ingress.fqdn --output tsv)

echo ""
echo "✅ SUCCESS! Your app is deployed:"
echo "   🌐 App URL: https://$APP_URL"
echo "   🔍 Health Check: https://$APP_URL/health"
echo "   📊 Azure Portal: https://portal.azure.com"
echo ""
echo "🔧 Useful commands:"
echo "   View logs: az containerapp logs show --name $CONTAINER_APP_NAME --resource-group $RESOURCE_GROUP --follow"
echo "   Update app: az containerapp update --name $CONTAINER_APP_NAME --resource-group $RESOURCE_GROUP --image $REGISTRY_SERVER/$IMAGE_NAME:latest"
echo "   Scale app: az containerapp update --name $CONTAINER_APP_NAME --resource-group $RESOURCE_GROUP --min-replicas 1 --max-replicas 20"
echo ""
echo "🎊 Your serverless React app is now live!"