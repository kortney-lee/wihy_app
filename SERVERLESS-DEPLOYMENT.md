# 🚀 WiHy UI - Serverless Container Deployment Guide

## Overview
WiHy UI is now configured for serverless container deployment using Azure Container Apps with auto-scaling from 0 to 10 instances based on demand.

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client App    │───▶│  Azure Container │───▶│ Serverless APIs │
│  (React SPA)    │    │      Apps        │    │ (Functions/etc) │
│   in Container  │    │   (0-10 scale)   │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Key Features:
- **Scale to Zero**: No costs when not in use
- **Auto-scaling**: 0-10 instances based on demand
- **Container Optimized**: Nginx + React SPA
- **Serverless Ready**: No server dependencies

## 🐳 Container Configuration

### Multi-Stage Dockerfile:
1. **Builder Stage**: Builds React app with optimized dependencies
2. **Production Stage**: Nginx Alpine with security optimizations
3. **Health Checks**: Built-in health monitoring
4. **Security**: Non-root user, security headers

### Resource Allocation:
- **CPU**: 0.25 cores (burstable)
- **Memory**: 0.5 GB
- **Storage**: Ephemeral (stateless)

## 🚀 Deployment Options

### Option 1: Azure Container Apps (Recommended)

#### Prerequisites:
1. Azure Container Registry
2. Azure Container Apps Environment
3. GitHub repository secrets

#### Setup:
```bash
# Create resource group
az group create --name rg-wihy --location eastus

# Create container registry
az acr create --resource-group rg-wihy --name wihy --sku Basic

# Create container apps environment
az containerapp env create \
  --name wihy-env \
  --resource-group rg-wihy \
  --location eastus
```

#### GitHub Secrets Required:
```
REGISTRY_PASSWORD=<acr-password>
AZURE_CREDENTIALS=<service-principal-json>
API_BASE_URL=<your-serverless-api-url>
GOOGLE_CLIENT_ID=<oauth-client-id>
MICROSOFT_CLIENT_ID=<oauth-client-id>
APPLE_CLIENT_ID=<oauth-client-id>
FACEBOOK_CLIENT_ID=<oauth-client-id>
```

#### Deployment:
```bash
# Push triggers automatic deployment via GitHub Actions
git push origin main
```

### Option 2: Azure Container Instances (Simple)

```bash
# Build and push to ACR
docker build -t wihy.azurecr.io/wihy-ui .
docker push wihy.azurecr.io/wihy-ui

# Deploy to ACI
az container create \
  --resource-group rg-wihy \
  --name wihy-ui \
  --image wihy.azurecr.io/wihy-ui \
  --dns-name-label wihy-ui \
  --ports 80 \
  --cpu 0.5 \
  --memory 1
```

### Option 3: Local Development

```bash
# Development with hot reload
docker-compose up wihy-ui-dev

# Production testing
docker-compose up wihy-ui-prod

# Visit: http://localhost:3000 (dev) or http://localhost:8080 (prod)
```

## 🔧 Configuration

### Environment Variables

#### Production (Required):
```bash
REACT_APP_ENVIRONMENT=production
REACT_APP_API_BASE_URL=https://your-api.azurewebsites.net/api
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id
REACT_APP_MICROSOFT_CLIENT_ID=your_microsoft_client_id
```

#### Optional:
```bash
REACT_APP_ENABLE_ANALYTICS=true
REACT_APP_DEBUG_MODE=false
REACT_APP_SERVERLESS=true
```

### Container Configuration

#### Health Check:
- **Endpoint**: `/health`
- **Interval**: 30 seconds
- **Timeout**: 3 seconds
- **Retries**: 3

#### Security Headers:
- X-Frame-Options: SAMEORIGIN
- X-Content-Type-Options: nosniff
- X-XSS-Protection: 1; mode=block
- Content-Security-Policy: Configured

## 📊 Monitoring & Scaling

### Auto-scaling Triggers:
- **CPU**: > 70% for 60 seconds → scale up
- **Memory**: > 80% for 60 seconds → scale up
- **HTTP Queue**: > 10 requests → scale up
- **Idle**: No requests for 5 minutes → scale to zero

### Monitoring:
```bash
# View logs
az containerapp logs show \
  --name wihy-ui \
  --resource-group rg-wihy \
  --follow

# View metrics
az monitor metrics list \
  --resource /subscriptions/.../containerApps/wihy-ui \
  --metric "Requests"
```

## 🎯 Serverless API Integration

### Recommended API Stack:
1. **Azure Functions** (Recommended)
2. **Azure Static Web Apps API**
3. **Azure API Management**
4. **Third-party APIs** (Auth0, Firebase, etc.)

### API Configuration:
```typescript
// In your React app
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

// Example API calls
const response = await fetch(`${API_BASE_URL}/health`, {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  }
});
```

## 🔐 Security Considerations

### Container Security:
- Non-root user execution
- Minimal Alpine Linux base
- No sensitive data in container
- Read-only file system where possible

### Application Security:
- Environment variables for secrets
- OAuth for authentication
- HTTPS only in production
- Content Security Policy headers

## 💰 Cost Optimization

### Container Apps Pricing:
- **Consumption**: Pay per second of execution
- **Scale to Zero**: No cost when idle
- **Resource Based**: 0.25 CPU × 0.5GB RAM
- **Estimated**: $5-20/month for typical usage

### Cost Monitoring:
```bash
# Set up billing alerts
az consumption budget create \
  --budget-name wihy-ui-budget \
  --amount 50 \
  --time-grain Monthly
```

## 🔍 Troubleshooting

### Common Issues:

#### Container Won't Start:
```bash
# Check logs
az containerapp logs show --name wihy-ui --resource-group rg-wihy

# Check health endpoint
curl https://wihy-ui.azurecontainerapps.io/health
```

#### Environment Variables Not Loading:
```bash
# Verify environment variables
az containerapp show --name wihy-ui --resource-group rg-wihy \
  --query properties.configuration.ingress
```

#### Build Failures:
```bash
# Test build locally
docker build -t wihy-ui-test .
docker run -p 8080:80 wihy-ui-test
```

## 🚀 Quick Start Commands

```bash
# Clone and setup
git clone https://github.com/kortney-lee/wihy_ui.git
cd wihy_ui

# Local development
docker-compose up wihy-ui-dev

# Production test
docker-compose up wihy-ui-prod

# Deploy to Azure (after setup)
git push origin main
```

## 📚 Next Steps

1. **Set up Azure resources** using the Azure CLI commands above
2. **Configure GitHub secrets** for automated deployment
3. **Set up serverless APIs** (Azure Functions recommended)
4. **Configure OAuth providers** with your container app URL
5. **Set up monitoring** and alerts
6. **Configure custom domain** (optional)

The application is now fully containerized and ready for serverless deployment! 🎉