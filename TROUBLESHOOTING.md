# 🚨 Deployment Troubleshooting Guide

## Step 1: Check GitHub Actions Status

1. Go to: https://github.com/kortney-lee/wihy_ui/actions
2. Look for the latest workflow run named "Deploy to Azure Static Web Apps"
3. Click on it to see detailed logs

### Common GitHub Actions Errors:

#### ❌ Error: "azure_static_web_apps_api_token not found"
**Solution**: You need to set up Azure Static Web App first:
1. Go to Azure Portal → Create a resource → Static Web Apps
2. Connect to GitHub repository: `kortney-lee/wihy_ui`
3. Build Details:
   - Build Presets: React
   - App location: `/client`  
   - Output location: `build`
4. This will automatically add the secret to your GitHub repository

#### ❌ Error: "npm ci failed" or dependency issues
**Solution**: Clear and reinstall dependencies:
```bash
cd client
rm -rf node_modules package-lock.json
npm install
npm run build
```

#### ❌ Error: "Build failed" with TypeScript errors
**Solution**: The package.json versions have been updated, but you may need to:
1. Delete `node_modules` and `package-lock.json` in both root and client folders
2. Run `npm install` in root directory
3. Run `npm install` in client directory
4. Try building again: `npm run build`

## Step 2: If GitHub Actions is Working, Check Azure Configuration

### Azure Static Web Apps Settings:
1. Go to Azure Portal → Your Static Web App
2. Click "Configuration" in the left menu
3. Add these Application settings:

```
REACT_APP_API_BASE_URL=https://your-api-domain.azurewebsites.net/api
REACT_APP_ENVIRONMENT=production
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id
REACT_APP_MICROSOFT_CLIENT_ID=your_microsoft_client_id
REACT_APP_APPLE_CLIENT_ID=your_apple_client_id
REACT_APP_FACEBOOK_CLIENT_ID=your_facebook_client_id
```

### OAuth Redirect URIs:
For each OAuth provider, add your Azure Static Web App URL:
- Google: Add `https://your-app-name.azurestaticapps.net` to authorized origins
- Microsoft: Add redirect URI in Azure AD app registration
- Facebook: Add to valid OAuth redirect URIs
- Apple: Configure in Apple Developer console

## Step 3: Manual Local Testing

Test your build locally first:
```bash
cd client
npm run build
npx serve -s build
```

Visit `http://localhost:3000` to test the production build.

## Step 4: Alternative Deployment Methods

### Option A: Deploy to Azure App Service
1. Use the GitHub Actions workflow: `.github/workflows/azure-app-service.yml`
2. Create an Azure App Service (Node.js 18)
3. Download the publish profile and add as `AZURE_WEBAPP_PUBLISH_PROFILE` secret

### Option B: Deploy using Docker
```bash
docker build -t wihy-ui .
docker run -p 3000:3000 wihy-ui
```

### Option C: Deploy to Vercel (Quick Alternative)
```bash
npm install -g vercel
cd client
vercel --prod
```

## Step 5: Check Application Logs

### Azure Static Web Apps:
1. Go to Azure Portal → Your Static Web App
2. Click "Functions" (if using API)
3. Check "Log stream" for runtime errors

### Browser Console:
1. Open your deployed app
2. Press F12 → Console tab
3. Look for any JavaScript errors

## Common Application Issues:

### ❌ "Cannot read properties of undefined"
Usually OAuth configuration issues. Check:
1. OAuth client IDs are set correctly
2. Redirect URIs match your deployment URL
3. Environment variables are available in production

### ❌ API calls failing (CORS errors)
1. Make sure your API server allows requests from your Static Web App domain
2. Check `REACT_APP_API_BASE_URL` is correctly set
3. Verify API endpoints are accessible

### ❌ Routing not working (404 on refresh)
The `staticwebapp.config.json` should handle this, but verify:
1. File exists in root directory
2. Contains the proper fallback configuration
3. Azure Static Web Apps is reading the config

## Need Help?

1. **Check the deployment logs**: GitHub Actions → Latest run → View logs
2. **Check Azure logs**: Azure Portal → Static Web App → Log stream
3. **Check browser console**: F12 → Console for client-side errors
4. **Test locally first**: `npm run build` and `npx serve -s build`

## Quick Fix Commands:

```bash
# Clean everything and rebuild
cd client
rm -rf node_modules package-lock.json
npm install
npm run build

# Test locally
npx serve -s build

# Redeploy
git add . && git commit -m "Fix deployment" && git push
```