# WiHy UI - Azure Deployment Guide

## Overview
This guide explains how to deploy the WiHy UI React application to Azure using multiple deployment options.

## Prerequisites
- Azure subscription
- GitHub account
- Node.js 18+ installed locally
- Azure CLI (optional, for manual deployment)

## Deployment Options

### Option 1: Azure Static Web Apps (Recommended)

Azure Static Web Apps is perfect for React applications as it provides:
- Global CDN distribution
- Automatic SSL certificates
- Custom domains
- Integrated GitHub Actions CI/CD
- API integration capabilities

#### Steps:

1. **Create Azure Static Web App**
   - Go to Azure Portal
   - Create new resource → Static Web Apps
   - Choose GitHub as source
   - Select your repository: `kortney-lee/wihy_ui`
   - Build Presets: React
   - App location: `/client`
   - Output location: `build`

2. **Configure GitHub Secrets**
   - Azure will automatically create a GitHub secret: `AZURE_STATIC_WEB_APPS_API_TOKEN`
   - Verify it exists in your repository settings → Secrets and variables → Actions

3. **Environment Variables**
   - In Azure Portal, go to your Static Web App → Configuration
   - Add the following application settings:
     ```
     REACT_APP_API_BASE_URL=https://your-api-domain.azurewebsites.net/api
     REACT_APP_ENVIRONMENT=production
     REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id
     REACT_APP_MICROSOFT_CLIENT_ID=your_microsoft_client_id
     REACT_APP_APPLE_CLIENT_ID=your_apple_client_id
     REACT_APP_FACEBOOK_CLIENT_ID=your_facebook_client_id
     ```

4. **Deploy**
   - Push to main branch
   - GitHub Actions will automatically build and deploy
   - Check the Actions tab for deployment status

### Option 2: Azure App Service

For more control and server-side capabilities:

1. **Create Azure App Service**
   - Go to Azure Portal
   - Create new resource → App Service
   - Runtime stack: Node 18 LTS
   - Operating System: Linux

2. **Configure Deployment**
   - In App Service → Deployment Center
   - Choose GitHub as source
   - Configure the workflow file (already created: `.github/workflows/azure-app-service.yml`)

3. **Download Publish Profile**
   - In App Service → Overview → Get publish profile
   - Add as GitHub secret: `AZURE_WEBAPP_PUBLISH_PROFILE`

4. **Update Workflow**
   - Edit `.github/workflows/azure-app-service.yml`
   - Update `AZURE_WEBAPP_NAME` to your App Service name

### Option 3: Docker Container

For containerized deployment:

1. **Build Docker Image**
   ```bash
   docker build -t wihy-ui .
   docker run -p 3000:3000 wihy-ui
   ```

2. **Deploy to Azure Container Instances**
   ```bash
   az container create \
     --resource-group myResourceGroup \
     --name wihy-ui \
     --image wihy-ui:latest \
     --dns-name-label wihy-ui \
     --ports 3000
   ```

## Configuration Files

### staticwebapp.config.json
- Configures routing for Single Page Application
- Handles API routes
- Sets up security headers
- Defines fallback routes

### GitHub Actions Workflows
- **azure-static-web-apps.yml**: Deploys to Static Web Apps
- **azure-app-service.yml**: Deploys to App Service

### Environment Configuration
- **.env.example**: Template for environment variables
- **client/.env.production**: Production environment settings

## Local Development

1. **Install Dependencies**
   ```bash
   npm install
   cd client && npm install
   ```

2. **Start Development Server**
   ```bash
   # From root directory
   npm run start
   # Or from client directory
   cd client && npm start
   ```

3. **Build for Production**
   ```bash
   # From root directory
   npm run build
   # Or from client directory
   cd client && npm run build
   ```

4. **Docker Development**
   ```bash
   docker-compose up wihy-ui-dev
   ```

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check TypeScript errors in the Actions logs
   - Ensure all dependencies are correctly installed
   - Verify environment variables are set

2. **Routing Issues**
   - Check `staticwebapp.config.json` for correct routes
   - Ensure `homepage` field in `package.json` is set correctly

3. **API Connection Issues**
   - Verify `REACT_APP_API_BASE_URL` is correct
   - Check CORS settings on your API
   - Ensure API endpoints are accessible

4. **Authentication Problems**
   - Verify OAuth client IDs are correct for production domain
   - Check redirect URIs in OAuth provider settings
   - Ensure HTTPS is used for production

### Monitoring

1. **Azure Application Insights**
   - Add Application Insights to your Static Web App or App Service
   - Monitor performance and errors
   - Set up alerts for critical issues

2. **GitHub Actions Monitoring**
   - Check Actions tab for deployment status
   - Review logs for build/deployment issues
   - Set up notifications for failed deployments

## Security Considerations

1. **Environment Variables**
   - Never commit sensitive data to repository
   - Use Azure Key Vault for sensitive configuration
   - Rotate secrets regularly

2. **Content Security Policy**
   - Review CSP headers in `staticwebapp.config.json`
   - Adjust based on your specific needs
   - Test thoroughly after changes

3. **Authentication**
   - Use HTTPS only in production
   - Implement proper session management
   - Consider using Azure AD B2C for user management

## Performance Optimization

1. **Build Optimization**
   - Use production builds only
   - Enable tree shaking
   - Optimize bundle size

2. **CDN Configuration**
   - Static Web Apps includes global CDN
   - Configure caching headers appropriately
   - Use Azure CDN for additional performance

3. **Monitoring**
   - Set up performance monitoring
   - Monitor Core Web Vitals
   - Optimize based on real user metrics

## Next Steps

1. Set up custom domain
2. Configure SSL certificate
3. Set up monitoring and alerts
4. Implement CI/CD pipeline testing
5. Configure backup and disaster recovery

## Support

For issues with this deployment:
1. Check Azure service health
2. Review GitHub Actions logs
3. Check Azure portal for error messages
4. Consult Azure documentation