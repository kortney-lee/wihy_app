# WIHY UI - Serverless Container Architecture

## 🏗️ Architecture Overview

This project has been configured as a **serverless containerized React application** optimized for Azure Container Apps deployment with auto-scaling capabilities.

## 📦 Container Architecture

### Multi-Stage Docker Build
```dockerfile
# Stage 1: Builder
FROM node:18-alpine AS builder
- Installs dependencies
- Builds React application
- Optimizes for production

# Stage 2: Production
FROM nginx:alpine AS production
- Lightweight nginx server
- Serves optimized static files
- Health check endpoints
- Security headers
```

### Container Features
- **Size Optimized**: Multi-stage build reduces image size
- **Security**: Non-root user, minimal attack surface
- **Health Monitoring**: Built-in health check at `/health`
- **Performance**: Nginx with gzip compression and caching
- **SPA Support**: Proper routing fallback for React Router

## 🚀 Deployment Options

### 1. Azure Container Apps (Recommended)
**Serverless, auto-scaling container platform**

```yaml
# Container Apps Configuration
resource: Azure Container Apps
scaling: 0-10 instances (auto)
pricing: Pay-per-use
features:
  - HTTPS/SSL automatic
  - Custom domains
  - Auto-scaling
  - Zero cold start
```

**Deployment Command:**
```bash
az containerapp create \
  --name wihy-ui \
  --resource-group rg-wihy \
  --environment wihy-env \
  --image ghcr.io/your-username/wihy-ui:latest \
  --target-port 80 \
  --ingress external \
  --min-replicas 0 \
  --max-replicas 10
```

### 2. Azure Container Instances
**Simple container hosting**

```bash
az container create \
  --resource-group rg-wihy \
  --name wihy-ui \
  --image ghcr.io/your-username/wihy-ui:latest \
  --ports 80 \
  --ip-address public
```

### 3. Azure App Service
**Traditional web app hosting**

```bash
az webapp create \
  --resource-group rg-wihy \
  --plan asp-wihy \
  --name wihy-ui \
  --deployment-container-image-name ghcr.io/your-username/wihy-ui:latest
```

## 🔄 CI/CD Workflows

### GitHub Actions Pipelines

#### 1. Container Apps Workflow (`.github/workflows/container-apps.yml`)
- **Trigger**: Push to main branch
- **Steps**: Build → Test → Containerize → Deploy
- **Target**: Azure Container Apps
- **Features**: Auto-scaling, HTTPS, custom domains

#### 2. App Service Workflow (`.github/workflows/app-service.yml`)
- **Trigger**: Manual or specific branch
- **Steps**: Build → Test → Containerize → Deploy
- **Target**: Azure App Service
- **Features**: Traditional hosting, easier management

#### 3. Static Web Apps Workflow (`.github/workflows/static-web-apps.yml`)
- **Trigger**: Manual deployment
- **Steps**: Build → Deploy static files
- **Target**: Azure Static Web Apps
- **Features**: Global CDN, serverless functions

## 🛠️ Development Workflow

### Local Development
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Test client application
cd client && npm start

# Test user dashboard
cd user && npm start
```

### Container Testing
```bash
# Build container locally
npm run docker:build

# Run container locally
npm run docker:run

# Test container health
curl http://localhost:80/health
```

### Production Build
```bash
# Build optimized production bundle
npm run build:prod

# Test production build locally
npm run serve:prod
```

## 📊 Scaling & Performance

### Auto-Scaling Configuration
```yaml
# Container Apps Scaling Rules
scale:
  minReplicas: 0      # Scale to zero when idle
  maxReplicas: 10     # Maximum instances
  rules:
    - http:
        metadata:
          concurrentRequests: 100
    - cpu:
        metadata:
          type: Utilization
          value: 70
```

### Performance Optimizations
- **Nginx Compression**: Gzip enabled for all text assets
- **Static Caching**: Browser caching for static assets
- **Bundle Optimization**: Code splitting and tree shaking
- **Image Optimization**: Compressed assets and lazy loading

## 🔒 Security Features

### Container Security
- **Non-root User**: Application runs as unprivileged user
- **Minimal Base Image**: Alpine Linux reduces attack surface
- **Security Headers**: CSP, HSTS, and other protective headers
- **Health Monitoring**: Continuous health checks

### Application Security
- **OAuth Integration**: Google, Microsoft, Apple, Facebook
- **Environment Variables**: Secure configuration management
- **HTTPS Enforcement**: Automatic SSL/TLS termination
- **CORS Configuration**: Proper cross-origin resource sharing

## 🌍 Environment Management

### Environment Configuration
```bash
# Development
REACT_APP_API_URL=http://localhost:3001
REACT_APP_ENV=development

# Production
REACT_APP_API_URL=https://api.wihy.com
REACT_APP_ENV=production
```

### Deployment Environments
- **Development**: Local containers and development APIs
- **Staging**: Container Apps with staging configuration
- **Production**: Container Apps with production optimizations

## 📈 Monitoring & Observability

### Health Monitoring
- **Health Endpoint**: `/health` returns container status
- **Application Insights**: Automatic telemetry collection
- **Container Logs**: Centralized logging in Azure
- **Performance Metrics**: Request duration, error rates

### Alerting
- **Container Health**: Alert on health check failures
- **Scaling Events**: Monitor auto-scaling behavior
- **Error Rates**: Alert on application errors
- **Performance**: Monitor response times

## 🚢 Migration Path

### From Static to Container Apps
1. **Current State**: Static web app deployment
2. **Container Build**: Multi-stage Docker optimization
3. **Container Registry**: GitHub Container Registry
4. **Serverless Deploy**: Azure Container Apps
5. **Auto-scaling**: 0-10 instance scaling
6. **Domain Setup**: Custom domain configuration

### Benefits of Migration
- **Cost Optimization**: Pay only for actual usage
- **Auto-scaling**: Handle traffic spikes automatically
- **Zero Maintenance**: Serverless infrastructure
- **Global Performance**: Edge deployment capabilities
- **Container Flexibility**: Easy scaling and updates

## 🎯 Next Steps

### Immediate Actions
1. **Install Docker** (if testing locally)
2. **Create Azure Resources** (Container Registry, Container Apps)
3. **Configure GitHub Secrets** (Azure credentials)
4. **Deploy via GitHub Actions**
5. **Configure Custom Domain**

### Future Enhancements
- **CDN Integration**: Azure Front Door for global performance
- **Database Integration**: Serverless database connections
- **API Gateway**: Centralized API management
- **Monitoring Dashboard**: Custom metrics and alerts
- **A/B Testing**: Traffic splitting capabilities

## 📚 Resources

### Documentation
- [Azure Container Apps Documentation](https://docs.microsoft.com/azure/container-apps/)
- [Docker Multi-stage Builds](https://docs.docker.com/develop/dev-best-practices/dockerfile_best-practices/)
- [React Production Deployment](https://create-react-app.dev/docs/deployment/)

### Support
- **GitHub Issues**: Report bugs and feature requests
- **Azure Support**: Azure Container Apps support
- **Community**: React and containerization communities

---

**Architecture Status**: ✅ Complete - Ready for deployment
**Last Updated**: December 2024
**Version**: 1.0.0 - Serverless Container Architecture