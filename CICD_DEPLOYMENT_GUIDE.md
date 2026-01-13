# WiHY.AI - Complete CI/CD Deployment Guide

**Document Purpose**: Full deployment configuration for moving wihy.ai to a new hosting solution with working CI/CD pipelines.

**Last Updated**: January 12, 2026

---

## Table of Contents

1. [Current Architecture Overview](#current-architecture-overview)
2. [Deployment Options](#deployment-options)
3. [GitHub Actions Workflows (Complete YML Files)](#github-actions-workflows-complete-yml-files)
4. [Docker Configuration](#docker-configuration)
5. [Environment Variables & Secrets](#environment-variables--secrets)
6. [Domain & DNS Configuration](#domain--dns-configuration)
7. [SSL/TLS Certificate Setup](#ssltls-certificate-setup)
8. [Step-by-Step Migration Guide](#step-by-step-migration-guide)
9. [Troubleshooting & Monitoring](#troubleshooting--monitoring)

---

## Current Architecture Overview

### What's Currently Running

- **Frontend**: React 18.3.1 + TypeScript
- **Build System**: Create React App with Tailwind CSS 3.4.18
- **Container**: Docker (nginx:alpine + Node.js 18-alpine multi-stage build)
- **Current Domain**: wihy.ai, www.wihy.ai
- **Current Deployment**: Google Cloud Platform (Firebase Hosting) + Azure VM fallback
- **API**: ml.wihy.ai (WiHY ML API)
- **Repository**: kortney-lee/wihy_ui (GitHub)

### Key Files

```
wihy_ui_clean/
├── .github/workflows/
│   ├── deploy-gcp.yml           # Active: Google Cloud Platform
│   ├── deploy-azure.yml         # Disabled: Azure Container Apps
│   └── deploy.yml               # Disabled: Azure VM with Docker
├── client/                      # React application root
│   ├── src/                     # Source code
│   ├── public/                  # Static assets
│   ├── package.json            # Frontend dependencies
│   ├── tailwind.config.js      # Tailwind configuration
│   └── postcss.config.js       # PostCSS configuration
├── Dockerfile                   # Production container build
├── nginx.conf                   # Nginx web server config
├── firebase.json               # Firebase Hosting config
└── package.json                # Root package.json
```

---

## Deployment Options

### Option 1: Google Cloud Platform (Firebase) - **RECOMMENDED**

**Advantages:**
- Global CDN distribution
- Automatic HTTPS/SSL
- Zero maintenance
- Fast deployment (< 2 minutes)
- Custom domain support
- Free tier available
- Rollback support

**Current Status**: ✅ **ACTIVE**

### Option 2: Azure Static Web Apps

**Advantages:**
- Integrated with GitHub Actions
- Custom domains + free SSL
- Serverless API support
- Staging environments

**Current Status**: Available as alternative

### Option 3: Azure Container Apps

**Advantages:**
- Full Docker container support
- Auto-scaling
- Multiple container deployment
- Microservices architecture

**Current Status**: 🚫 **DISABLED** (can be re-enabled)

### Option 4: Self-Hosted VM (Azure/AWS/GCP)

**Advantages:**
- Full control
- Custom configuration
- Cost-effective at scale

**Current Status**: 🚫 **DEPRECATED** (Azure VM deployment disabled)

---

## GitHub Actions Workflows (Complete YML Files)

### 1. GCP/Firebase Deployment (ACTIVE)

**File**: `.github/workflows/deploy-gcp.yml`

```yaml
name: Deploy to Google Cloud Platform

on:
  push:
    branches:
      - main
      - develop
  pull_request:
    branches:
      - main

permissions:
  contents: read
  id-token: write
  security-events: write

env:
  PROJECT_ID: wihy-ai
  GAR_LOCATION: us-central1
  SERVICE: wihy-frontend
  REGION: us-central1
  REPOSITORY: wihy-repo
  CUSTOM_DOMAIN: wihy.ai

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'npm'
        cache-dependency-path: |
          package-lock.json
          client/package-lock.json

    - name: Install root dependencies
      run: npm ci

    - name: Install client dependencies
      run: cd client && npm ci

    - name: Security Update - CVE-2025-55182 
      run: |
        cd client
        # Ensure React is at secure version (18.3.1+)
        npm list react --depth=0 | grep -q "react@18\.3\.[1-9]" || npm install react@^18.3.1 react-dom@^18.3.1

    - name: Run tests
      run: npm test -- --coverage --watchAll=false

    - name: Run ESLint
      run: cd client && npm run lint || true

    - name: Build application
      run: npm run build

  deploy-frontend-firebase:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    permissions:
      contents: read
      id-token: write

    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'npm'

    - name: Install dependencies
      run: |
        npm ci
        cd client && npm ci

    - name: Build application
      run: npm run build
      env:
        REACT_APP_API_BASE_URL: ${{ secrets.REACT_APP_API_BASE_URL }}
        REACT_APP_WIHY_API_URL: https://ml.wihy.ai
        REACT_APP_ENVIRONMENT: production
        REACT_APP_GOOGLE_CLIENT_ID: ${{ secrets.REACT_APP_GOOGLE_CLIENT_ID }}
        REACT_APP_MICROSOFT_CLIENT_ID: ${{ secrets.REACT_APP_MICROSOFT_CLIENT_ID }}

    - name: Deploy to Firebase
      uses: FirebaseExtended/action-hosting-deploy@v0
      with:
        repoToken: ${{ secrets.GITHUB_TOKEN }}
        firebaseServiceAccount: ${{ secrets.FIREBASE_SERVICE_ACCOUNT_WIHY_AI }}
        channelId: live
        projectId: wihy-ai
```

**Required GitHub Secrets:**
- `FIREBASE_SERVICE_ACCOUNT_WIHY_AI`
- `REACT_APP_API_BASE_URL`
- `REACT_APP_GOOGLE_CLIENT_ID`
- `REACT_APP_MICROSOFT_CLIENT_ID`

---

### 2. Azure Static Web Apps (Alternative)

**File**: `.github/workflows/deploy-azure-static.yml` (CREATE THIS)

```yaml
name: Deploy to Azure Static Web Apps

on:
  push:
    branches:
      - main
  pull_request:
    types: [opened, synchronize, reopened, closed]
    branches:
      - main

jobs:
  build_and_deploy:
    if: github.event_name == 'push' || (github.event_name == 'pull_request' && github.event.action != 'closed')
    runs-on: ubuntu-latest
    name: Build and Deploy
    steps:
      - uses: actions/checkout@v4
        with:
          submodules: true

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: client/package-lock.json

      - name: Install and Build
        run: |
          cd client
          npm ci
          npm run build
        env:
          REACT_APP_API_BASE_URL: ${{ secrets.REACT_APP_API_BASE_URL }}
          REACT_APP_WIHY_API_URL: https://ml.wihy.ai
          REACT_APP_ENVIRONMENT: production

      - name: Deploy to Azure Static Web Apps
        uses: Azure/static-web-apps-deploy@v1
        with:
          azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN }}
          repo_token: ${{ secrets.GITHUB_TOKEN }}
          action: "upload"
          app_location: "client"
          output_location: "build"
          skip_app_build: true

  close_pull_request:
    if: github.event_name == 'pull_request' && github.event.action == 'closed'
    runs-on: ubuntu-latest
    name: Close Pull Request
    steps:
      - name: Close Pull Request
        uses: Azure/static-web-apps-deploy@v1
        with:
          azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN }}
          action: "close"
```

**Required GitHub Secrets:**
- `AZURE_STATIC_WEB_APPS_API_TOKEN` (get from Azure Portal)
- `REACT_APP_API_BASE_URL`

---

### 3. Azure Container Apps (Docker-based)

**File**: `.github/workflows/deploy-azure-container.yml`

```yaml
name: Deploy to Azure Container Apps

on:
  push:
    branches: [ main ]
  workflow_dispatch:

env:
  REGISTRY_LOGIN_SERVER: <your-registry>.azurecr.io
  CONTAINER_APP_NAME: wihy-ui
  CONTAINER_APP_ENVIRONMENT: wihy-env
  RESOURCE_GROUP: wihy-rg
  IMAGE_NAME: wihy-ui
  LOCATION: westus2

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      id-token: write
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Azure Login
      uses: azure/login@v1
      with:
        creds: ${{ secrets.AZURE_CREDENTIALS }}

    - name: Login to Azure Container Registry
      uses: azure/docker-login@v1
      with:
        login-server: ${{ env.REGISTRY_LOGIN_SERVER }}
        username: ${{ secrets.REGISTRY_USERNAME }}
        password: ${{ secrets.REGISTRY_PASSWORD }}

    - name: Build and push Docker image
      run: |
        docker build -t ${{ env.REGISTRY_LOGIN_SERVER }}/${{ env.IMAGE_NAME }}:${{ github.sha }} \
          -t ${{ env.REGISTRY_LOGIN_SERVER }}/${{ env.IMAGE_NAME }}:latest .
        docker push ${{ env.REGISTRY_LOGIN_SERVER }}/${{ env.IMAGE_NAME }}:${{ github.sha }}
        docker push ${{ env.REGISTRY_LOGIN_SERVER }}/${{ env.IMAGE_NAME }}:latest

    - name: Deploy to Container App
      uses: azure/container-apps-deploy-action@v1
      with:
        acrName: <your-registry-name>
        containerAppName: ${{ env.CONTAINER_APP_NAME }}
        resourceGroup: ${{ env.RESOURCE_GROUP }}
        imageToDeploy: ${{ env.REGISTRY_LOGIN_SERVER }}/${{ env.IMAGE_NAME }}:${{ github.sha }}
        environmentVariables: |
          REACT_APP_API_BASE_URL=${{ secrets.REACT_APP_API_BASE_URL }}
          REACT_APP_WIHY_API_URL=https://ml.wihy.ai
          REACT_APP_ENVIRONMENT=production

    - name: Logout from Azure
      run: az logout
```

**Required GitHub Secrets:**
- `AZURE_CREDENTIALS` (service principal JSON)
- `REGISTRY_USERNAME`
- `REGISTRY_PASSWORD`
- `REACT_APP_API_BASE_URL`

---

### 4. Self-Hosted VM with Docker (Legacy)

**File**: `.github/workflows/deploy-vm-docker.yml`

```yaml
name: Deploy to VM with Docker

on:
  push:
    branches: [ main ]
  workflow_dispatch:

env:
  DOCKER_IMAGE: wihy-ui
  CONTAINER_NAME: wihy-ui-app

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Build Docker image
      run: |
        docker build -t ${{ env.DOCKER_IMAGE }}:latest .
        docker save ${{ env.DOCKER_IMAGE }}:latest | gzip > wihy-ui-image.tar.gz

    - name: Setup SSH
      run: |
        mkdir -p ~/.ssh
        echo "${{ secrets.VM_SSH_PRIVATE_KEY }}" > ~/.ssh/id_rsa
        chmod 600 ~/.ssh/id_rsa
        ssh-keyscan -H ${{ secrets.VM_HOST }} >> ~/.ssh/known_hosts

    - name: Transfer Docker image to VM
      run: |
        scp -i ~/.ssh/id_rsa wihy-ui-image.tar.gz ${{ secrets.VM_USERNAME }}@${{ secrets.VM_HOST }}:~/

    - name: Deploy on VM
      run: |
        ssh -i ~/.ssh/id_rsa ${{ secrets.VM_USERNAME }}@${{ secrets.VM_HOST }} << 'EOF'
          # Load new image
          docker load < ~/wihy-ui-image.tar.gz
          
          # Stop and remove old container
          docker stop ${{ env.CONTAINER_NAME }} || true
          docker rm ${{ env.CONTAINER_NAME }} || true
          
          # Start new container
          docker run -d \
            --name ${{ env.CONTAINER_NAME }} \
            --restart unless-stopped \
            -p 80:80 \
            -p 443:443 \
            ${{ env.DOCKER_IMAGE }}:latest
          
          # Cleanup
          rm ~/wihy-ui-image.tar.gz
          docker system prune -f
        EOF

    - name: Health check
      run: |
        sleep 10
        curl -f https://wihy.ai/health || exit 1
```

**Required GitHub Secrets:**
- `VM_HOST` (IP address)
- `VM_USERNAME`
- `VM_SSH_PRIVATE_KEY`

---

## Docker Configuration

### Complete Dockerfile

**File**: `Dockerfile`

```dockerfile
# Multi-stage build for WiHY UI - Optimized for React App
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app/client

# Copy package files
COPY client/package*.json ./

# Install dependencies
RUN npm ci --no-audit --no-fund

# Copy source code
COPY client/src ./src
COPY client/public ./public
COPY client/tsconfig.json ./
COPY client/.env.production ./
COPY client/tailwind.config.js ./
COPY client/postcss.config.js ./

# Build arguments (can override at build time)
ARG REACT_APP_API_BASE_URL=https://ml.wihy.ai
ARG REACT_APP_WIHY_API_URL=https://ml.wihy.ai
ARG REACT_APP_ENVIRONMENT=production

# Set environment variables
ENV NODE_ENV=production
ENV REACT_APP_API_BASE_URL=${REACT_APP_API_BASE_URL}
ENV REACT_APP_WIHY_API_URL=${REACT_APP_WIHY_API_URL}
ENV REACT_APP_ENVIRONMENT=${REACT_APP_ENVIRONMENT}

# Build application
RUN npm run build

# Production stage
FROM nginx:alpine AS production

# Install curl for health checks
RUN apk add --no-cache curl

# Copy built app
COPY --from=builder /app/client/build /usr/share/nginx/html

# Copy nginx config
COPY nginx.conf /etc/nginx/nginx.conf

# Copy health check script
COPY healthcheck.sh /usr/local/bin/healthcheck.sh
RUN chmod +x /usr/local/bin/healthcheck.sh

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD /usr/local/bin/healthcheck.sh

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
```

### Nginx Configuration

**File**: `nginx.conf`

```nginx
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    # Logging
    access_log  /var/log/nginx/access.log;
    error_log   /var/log/nginx/error.log warn;

    # Performance
    sendfile        on;
    tcp_nopush      on;
    tcp_nodelay     on;
    keepalive_timeout  65;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_comp_level 6;
    gzip_types
        application/javascript
        application/json
        text/css
        text/plain
        text/xml
        image/svg+xml;

    server {
        listen 80;
        server_name localhost;
        root /usr/share/nginx/html;
        index index.html;

        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;

        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }

        # SPA routing - serve index.html for all routes
        location / {
            try_files $uri $uri/ /index.html;
            add_header Cache-Control "no-cache";
        }

        # Health check endpoint
        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }

        error_page 404 /index.html;
    }
}
```

### Health Check Script

**File**: `healthcheck.sh`

```bash
#!/bin/sh
curl -f http://localhost/health || exit 1
```

---

## Environment Variables & Secrets

### Required Environment Variables

Create `.env.production` in `client/` directory:

```bash
# API Configuration
REACT_APP_API_BASE_URL=https://ml.wihy.ai
REACT_APP_WIHY_API_URL=https://ml.wihy.ai
REACT_APP_OPENFOODFACTS_API_URL=https://world.openfoodfacts.org

# Environment
REACT_APP_ENVIRONMENT=production
REACT_APP_DEPLOYMENT_TYPE=serverless
REACT_APP_DEBUG_MODE=false

# Features
REACT_APP_ENABLE_ANALYTICS=true
REACT_APP_ENABLE_CACHING=true

# OAuth (if using authentication)
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id
REACT_APP_MICROSOFT_CLIENT_ID=your_microsoft_client_id
REACT_APP_APPLE_CLIENT_ID=your_apple_client_id
REACT_APP_FACEBOOK_CLIENT_ID=your_facebook_client_id
```

### GitHub Secrets Configuration

Add these secrets in: **Repository Settings → Secrets and variables → Actions → New repository secret**

#### For Firebase Deployment:
```
FIREBASE_SERVICE_ACCOUNT_WIHY_AI=<service-account-json>
REACT_APP_API_BASE_URL=https://ml.wihy.ai
REACT_APP_GOOGLE_CLIENT_ID=<your-client-id>
REACT_APP_MICROSOFT_CLIENT_ID=<your-client-id>
```

#### For Azure Static Web Apps:
```
AZURE_STATIC_WEB_APPS_API_TOKEN=<api-token-from-azure>
REACT_APP_API_BASE_URL=https://ml.wihy.ai
```

#### For Azure Container Apps:
```
AZURE_CREDENTIALS={"clientId":"...","clientSecret":"...","subscriptionId":"...","tenantId":"..."}
REGISTRY_USERNAME=<acr-username>
REGISTRY_PASSWORD=<acr-password>
REACT_APP_API_BASE_URL=https://ml.wihy.ai
```

#### For VM Deployment:
```
VM_HOST=<your-vm-ip>
VM_USERNAME=<ssh-username>
VM_SSH_PRIVATE_KEY=<private-key-content>
```

### How to Get Service Account JSON (Firebase)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (wihy-ai)
3. Project Settings → Service Accounts
4. Click "Generate New Private Key"
5. Copy entire JSON content to `FIREBASE_SERVICE_ACCOUNT_WIHY_AI` secret

---

## Domain & DNS Configuration

### DNS Records for wihy.ai

**For Firebase Hosting:**

```
Type    Name    Value
A       @       151.101.1.195, 151.101.65.195
A       www     151.101.1.195, 151.101.65.195
TXT     @       firebase=wihy-ai
```

**For Azure Static Web Apps:**

```
Type    Name    Value
CNAME   @       <your-static-web-app>.azurestaticapps.net
CNAME   www     <your-static-web-app>.azurestaticapps.net
TXT     @       Verification code from Azure
```

**For Azure Container Apps:**

```
Type    Name    Value
CNAME   @       <your-container-app>.azurecontainerapps.io
CNAME   www     <your-container-app>.azurecontainerapps.io
```

**For Self-Hosted VM:**

```
Type    Name    Value
A       @       <your-vm-ip>
A       www     <your-vm-ip>
```

---

## SSL/TLS Certificate Setup

### Firebase (Automatic)

Firebase automatically provisions SSL certificates. No manual setup required.

**Verify SSL:**
```bash
curl -I https://wihy.ai
```

### Azure Static Web Apps (Automatic)

Azure automatically provisions SSL for custom domains.

**Steps:**
1. Azure Portal → Your Static Web App → Custom domains
2. Click "Add"
3. Enter domain: wihy.ai
4. Validate domain ownership
5. SSL certificate auto-provisioned

### Let's Encrypt (For VM)

**Install Certbot:**

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install certbot python3-certbot-nginx

# Run Certbot
sudo certbot --nginx -d wihy.ai -d www.wihy.ai
```

**Auto-renewal:**

```bash
# Test renewal
sudo certbot renew --dry-run

# Setup auto-renewal (cron)
sudo crontab -e
# Add line:
0 3 * * * certbot renew --quiet
```

---

## Step-by-Step Migration Guide

### Migration Path 1: Move to Firebase (Recommended)

**Time**: ~30 minutes

#### Step 1: Setup Firebase Project

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Initialize project
cd /path/to/wihy_ui_clean
firebase init hosting

# Select options:
# - Use existing project: wihy-ai
# - Public directory: client/build
# - Single-page app: Yes
# - Automatic builds with GitHub: Yes
```

#### Step 2: Configure firebase.json

Create/update `firebase.json`:

```json
{
  "hosting": {
    "public": "client/build",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "**/*.@(js|css)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "max-age=31536000"
          }
        ]
      }
    ]
  }
}
```

#### Step 3: Get Service Account

```bash
# In Firebase Console:
# Project Settings → Service Accounts → Generate New Private Key
# Save JSON file
```

#### Step 4: Add GitHub Secret

```bash
# Copy entire JSON content
# GitHub → Repository → Settings → Secrets → New secret
# Name: FIREBASE_SERVICE_ACCOUNT_WIHY_AI
# Value: <paste JSON>
```

#### Step 5: Create Workflow

Copy the "GCP/Firebase Deployment" workflow from above to `.github/workflows/deploy-gcp.yml`

#### Step 6: Configure Domain

```bash
# Firebase Console → Hosting → Add custom domain
# Enter: wihy.ai
# Follow DNS configuration instructions
# Wait for SSL provisioning (5-15 minutes)
```

#### Step 7: Deploy

```bash
git add .
git commit -m "Configure Firebase deployment"
git push origin main

# Monitor deployment
gh run watch
```

#### Step 8: Verify

```bash
# Check deployment
curl -I https://wihy.ai

# Test health
curl https://wihy.ai/health
```

---

### Migration Path 2: Move to Azure Static Web Apps

**Time**: ~45 minutes

#### Step 1: Create Static Web App in Azure

```bash
# Azure Portal → Create Resource → Static Web App

# Configuration:
# - Name: wihy-ui
# - Region: West US 2
# - Deployment: GitHub
# - Organization: kortney-lee
# - Repository: wihy_ui
# - Branch: main
# - Build Presets: React
# - App location: /client
# - Output location: build
```

#### Step 2: Get API Token

Azure will create a GitHub secret automatically: `AZURE_STATIC_WEB_APPS_API_TOKEN`

Verify in: **Repository Settings → Secrets**

#### Step 3: Create/Update Workflow

Copy the "Azure Static Web Apps" workflow from above to `.github/workflows/deploy-azure-static.yml`

#### Step 4: Configure Custom Domain

```bash
# Azure Portal → Your Static Web App → Custom domains → Add

# For wihy.ai:
# - Add CNAME record pointing to your Static Web App URL
# - Validate domain
# - Wait for SSL provisioning
```

#### Step 5: Deploy

```bash
git add .
git commit -m "Configure Azure Static Web Apps deployment"
git push origin main
```

---

## Troubleshooting & Monitoring

### Common Issues

#### Build Fails

**Symptom**: GitHub Actions build step fails

**Solutions:**

```bash
# Check Node version
# Ensure package-lock.json is committed
# Clear cache and rebuild

# Locally test build:
cd client
npm ci
npm run build

# If successful, commit package-lock.json
git add client/package-lock.json
git commit -m "Update dependencies"
```

#### Deployment Succeeds but Site Shows Blank

**Symptom**: Deployment successful, but wihy.ai shows blank page

**Solutions:**

```bash
# Check browser console for errors
# Verify PUBLIC_URL and homepage in package.json

# client/package.json should have:
{
  "homepage": "https://wihy.ai"
}

# Check build output exists:
ls -la client/build/

# Verify index.html was created:
cat client/build/index.html
```

#### SSL Certificate Not Working

**Symptom**: https://wihy.ai shows certificate error

**Solutions:**

```bash
# For Firebase: Wait 15-30 minutes after domain configuration
# For Azure: Check custom domain validation status

# Test DNS propagation:
dig wihy.ai
nslookup wihy.ai

# Check SSL certificate:
echo | openssl s_client -servername wihy.ai -connect wihy.ai:443 2>/dev/null | openssl x509 -noout -dates
```

#### Environment Variables Not Working

**Symptom**: API calls fail, authentication doesn't work

**Solutions:**

```bash
# Verify secrets are set in GitHub:
# Settings → Secrets → Actions

# Check workflow file uses secrets correctly:
env:
  REACT_APP_API_BASE_URL: ${{ secrets.REACT_APP_API_BASE_URL }}

# Rebuild with correct env vars:
git commit --allow-empty -m "Trigger rebuild with updated secrets"
git push
```

### Monitoring Commands

#### Check Deployment Status

```bash
# GitHub CLI
gh run list --limit 5
gh run view <run-id>

# Watch live deployment
gh run watch
```

#### Test Health Endpoint

```bash
# Simple health check
curl https://wihy.ai/health

# Full response with timing
curl -w "\n\nStatus: %{http_code}\nTime: %{time_total}s\n" https://wihy.ai/health

# Test main page
curl -I https://wihy.ai
```

#### Check DNS

```bash
# DNS lookup
dig wihy.ai
dig www.wihy.ai

# Trace DNS path
dig +trace wihy.ai

# Check from different DNS servers
dig @8.8.8.8 wihy.ai      # Google DNS
dig @1.1.1.1 wihy.ai      # Cloudflare DNS
```

#### Monitor Performance

```bash
# Page load time
curl -w "DNS: %{time_namelookup}s\nConnect: %{time_connect}s\nTotal: %{time_total}s\n" \
  -o /dev/null -s https://wihy.ai

# Check compression
curl -I -H "Accept-Encoding: gzip" https://wihy.ai
```

---

## Quick Commands Reference

### Local Development

```bash
# Install dependencies
npm install
cd client && npm install

# Start dev server
npm start

# Build for production
npm run build

# Test production build locally
cd client/build && npx serve -s .
```

### Docker Commands

```bash
# Build image
docker build -t wihy-ui .

# Run container
docker run -p 80:80 wihy-ui

# Test health
curl http://localhost/health

# View logs
docker logs wihy-ui-app

# Stop container
docker stop wihy-ui-app

# Clean up
docker system prune -a
```

### Firebase Commands

```bash
# Deploy manually
firebase deploy --only hosting

# View logs
firebase hosting:channel:list

# Rollback
firebase hosting:clone SOURCE_SITE_ID:SOURCE_CHANNEL_ID TARGET_SITE_ID:live
```

### Azure CLI Commands

```bash
# Login
az login

# List static web apps
az staticwebapp list --output table

# Show app details
az staticwebapp show --name wihy-ui --resource-group wihy-rg

# List custom domains
az staticwebapp hostname list --name wihy-ui --resource-group wihy-rg
```

---

## Summary Checklist

### Pre-Migration
- [ ] Choose deployment target (Firebase recommended)
- [ ] Backup current deployment
- [ ] Document current environment variables
- [ ] Test build locally: `npm run build`

### Firebase Setup
- [ ] Create Firebase project
- [ ] Install Firebase CLI: `npm install -g firebase-tools`
- [ ] Run `firebase init hosting`
- [ ] Get service account JSON
- [ ] Add `FIREBASE_SERVICE_ACCOUNT_WIHY_AI` to GitHub secrets
- [ ] Create `.github/workflows/deploy-gcp.yml`
- [ ] Update `firebase.json`

### Domain Configuration
- [ ] Configure DNS A/CNAME records
- [ ] Add custom domain in hosting platform
- [ ] Wait for SSL provisioning
- [ ] Test HTTPS: `curl -I https://wihy.ai`

### Deployment
- [ ] Commit workflow file
- [ ] Push to main branch
- [ ] Monitor GitHub Actions
- [ ] Verify deployment: `curl https://wihy.ai/health`
- [ ] Test all pages and features

### Post-Deployment
- [ ] Monitor for 24 hours
- [ ] Check analytics/logs
- [ ] Document any issues
- [ ] Update DNS TTL back to normal
- [ ] Celebrate! 🎉

---

## Support

For issues or questions:

1. **GitHub Actions Logs**: Check `.github/workflows` execution logs
2. **Browser Console**: Check for JavaScript errors
3. **Network Tab**: Verify API calls are hitting correct endpoints
4. **Health Endpoint**: `curl https://wihy.ai/health`

---

**Document Version**: 1.0  
**Last Updated**: January 12, 2026  
**Maintained By**: WiHY Development Team
