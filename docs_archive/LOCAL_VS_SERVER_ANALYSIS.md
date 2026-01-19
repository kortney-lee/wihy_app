# Local vs Server Deployment Analysis

## 🎯 Issue Summary
**Problem:** `npx expo` works perfectly locally (all tabs, navigation, features work) but fails on server/production.

## 📊 Key Findings

### ✅ What Works Locally
1. All tabs functional
2. Navigation working
3. API calls successful
4. Full app experience

### ❌ What Fails on Server
1. Tabs not working
2. Navigation broken
3. Possible API connection issues
4. User interface frozen/unresponsive

---

## 🔍 Root Cause Analysis

### 1. **Environment Variables Not Being Injected at Runtime**

**Problem:** Expo web bundles are **static** - environment variables must be injected at BUILD TIME, not runtime.

#### Local Setup ✅
```bash
# .env file exists in mobile/.env
EXPO_PUBLIC_API_URL=https://services.wihy.ai
EXPO_PUBLIC_AUTH_URL=https://auth.wihy.ai
EXPO_PUBLIC_WIHY_SERVICES_CLIENT_ID=xxx
# ... etc
```

When you run locally:
```bash
npm run web  # or expo start --web
```
Expo reads `.env` file and injects variables into the bundle.

#### Server Setup ❌
```yaml
# .github/workflows/deploy-web.yml
- name: Build web application
  run: npx expo export --platform web
  env:
    EXPO_PUBLIC_API_URL: ${{ secrets.REACT_APP_API_BASE_URL }}  # ← WRONG KEY!
    EXPO_PUBLIC_AUTH_URL: ${{ secrets.REACT_APP_AUTH_API_URL }} # ← WRONG KEY!
```

**Issue #1:** GitHub Actions uses `REACT_APP_*` secrets but sets `EXPO_PUBLIC_*` env vars at build time.
- If `secrets.REACT_APP_API_BASE_URL` is not set, env var will be empty
- Code falls back to hardcoded URLs, but may not match production

**Issue #2:** The .env file is NOT committed to git (in .gitignore), so server doesn't have it.

---

### 2. **Client-Side Routing Not Configured for Web Hosting**

#### Firebase Hosting Configuration
```json
// firebase.json
"rewrites": [
  {
    "source": "**",
    "destination": "/index.html"  // ✅ Correct - SPA routing
  }
]
```

This looks correct ✅ - all routes redirect to index.html for client-side routing.

**However, potential issue:**
- If JavaScript bundle fails to load or has errors, routing won't work
- Tabs depend on React Navigation, which requires JS to be fully loaded

---

### 3. **Bundle Cache Issues**

#### From Production Analysis Doc:
```
Production loads OLD bundle (b09a0932...)
New bundle exists locally (29996a06...)
```

**Problem:** Even after fixing code and building, old bundle may still be served due to:

1. **Firebase CDN Cache:**
   - Static assets (JS bundles) cached for 1 year: `max-age=31536000`
   - index.html cached with `max-age=0, must-revalidate`
   - But if index.html still references old bundle hash, browser will load cached version

2. **Browser Cache:**
   - Users' browsers cache the old bundle
   - Even if new bundle deployed, users may not get it without hard refresh

---

### 4. **Missing Dependencies or Build Differences**

#### Local Build:
```bash
npm run build:web
# Uses:
# - Local node_modules (all dev dependencies available)
# - Local .env file
# - expo export --platform web
# - node scripts/inject-seo.js
```

#### Server Build (Docker):
```dockerfile
RUN cd mobile && npm ci && npm cache clean --force
RUN cd mobile && npx expo export --platform web
```

**Potential Issues:**
- `npm ci` installs from package-lock.json - if lock file out of sync, wrong versions installed
- Docker build may have different Node version
- `--force` cache clean might cause issues
- SEO injection script NOT run in Docker build (only in Firebase deploy workflow)

---

### 5. **Tab Navigation Implementation Details**

Let me check how tabs are implemented:

**If using React Navigation for web**, need to ensure:
- `react-navigation` web dependencies installed
- Linking configuration set up correctly
- No platform-specific code breaking web build

---

## 🔧 Diagnostic Steps

### Step 1: Check if Bundle is Being Loaded

Open browser console on production site and look for:
```
Failed to load resource: net::ERR_FILE_NOT_FOUND
or
SyntaxError: Unexpected token '<'  (HTML served instead of JS)
```

### Step 2: Verify Environment Variables in Build

The deployed bundle should have API URLs baked in. To check:

```bash
# View the built bundle
code mobile/dist/_expo/static/js/web/AppEntry-29996a069a88cff8049839365b19f0aa.js

# Search for API URLs - should see:
# "https://services.wihy.ai"
# "https://auth.wihy.ai"
# NOT undefined or empty strings
```

### Step 3: Check Firebase Hosting Deployment

```bash
# See what's currently deployed
firebase hosting:sites:list

# Check deployed files
firebase hosting:clone wihy-ai:production /tmp/deployed-site
ls -la /tmp/deployed-site
```

### Step 4: Verify GitHub Secrets

Go to GitHub repo → Settings → Secrets and Variables → Actions

Required secrets:
- `REACT_APP_API_BASE_URL` (or better: `EXPO_PUBLIC_API_URL`)
- `REACT_APP_AUTH_API_URL` (or better: `EXPO_PUBLIC_AUTH_URL`)
- `WIHY_FRONTEND_CLIENT_ID`
- `WIHY_FRONTEND_CLIENT_SECRET`
- etc.

---

## ✅ Solutions

### Solution 1: Fix Environment Variable Names in GitHub Actions

**Update `.github/workflows/deploy-web.yml`:**

```yaml
- name: Create .env file
  run: |
    cd mobile
    echo "EXPO_PUBLIC_API_URL=${{ secrets.EXPO_PUBLIC_API_URL }}" >> .env
    echo "EXPO_PUBLIC_AUTH_URL=${{ secrets.EXPO_PUBLIC_AUTH_URL }}" >> .env
    echo "EXPO_PUBLIC_WIHY_SERVICES_CLIENT_ID=${{ secrets.WIHY_SERVICES_CLIENT_ID }}" >> .env
    echo "EXPO_PUBLIC_WIHY_SERVICES_CLIENT_SECRET=${{ secrets.WIHY_SERVICES_CLIENT_SECRET }}" >> .env
    echo "EXPO_PUBLIC_WIHY_ML_CLIENT_ID=${{ secrets.WIHY_ML_CLIENT_ID }}" >> .env
    echo "EXPO_PUBLIC_WIHY_ML_CLIENT_SECRET=${{ secrets.WIHY_ML_CLIENT_SECRET }}" >> .env

- name: Build web application
  run: |
    cd mobile
    npx expo export --platform web
    node scripts/inject-seo.js
```

**Key changes:**
1. Create `.env` file in mobile directory BEFORE building
2. Use proper `EXPO_PUBLIC_*` prefix
3. Ensure secrets exist in GitHub

### Solution 2: Add Environment Variable Logging

Add debug step to see what's actually being set:

```yaml
- name: Debug - Show env vars
  run: |
    echo "Building with:"
    echo "API_URL: ${{ secrets.EXPO_PUBLIC_API_URL }}"
    echo "AUTH_URL: ${{ secrets.EXPO_PUBLIC_AUTH_URL }}"
    # Don't print secrets, just confirm they exist
    echo "Has CLIENT_ID: ${{ secrets.WIHY_SERVICES_CLIENT_ID != '' }}"
```

### Solution 3: Clear All Caches After Deploy

```yaml
- name: Deploy to Firebase Hosting
  uses: FirebaseExtended/action-hosting-deploy@v0
  with:
    repoToken: '${{ secrets.GITHUB_TOKEN }}'
    firebaseServiceAccount: '${{ secrets.GCP_SA_KEY }}'
    projectId: '${{ env.PROJECT_ID }}'
    channelId: live
    entryPoint: ./

- name: Clear Firebase CDN Cache
  run: |
    firebase hosting:channel:deploy production --only hosting --expire 0
```

### Solution 4: Fix Docker Build to Match Local Build

Update Dockerfile to create .env properly:

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package files
COPY mobile/package*.json ./mobile/

# Install dependencies
RUN cd mobile && npm ci

# Copy source code
COPY mobile ./mobile

# Create .env file with build args
ARG EXPO_PUBLIC_API_URL
ARG EXPO_PUBLIC_AUTH_URL
ARG EXPO_PUBLIC_WIHY_SERVICES_CLIENT_ID
ARG EXPO_PUBLIC_WIHY_SERVICES_CLIENT_SECRET
RUN cd mobile && \
    echo "EXPO_PUBLIC_API_URL=${EXPO_PUBLIC_API_URL}" > .env && \
    echo "EXPO_PUBLIC_AUTH_URL=${EXPO_PUBLIC_AUTH_URL}" >> .env && \
    echo "EXPO_PUBLIC_WIHY_SERVICES_CLIENT_ID=${EXPO_PUBLIC_WIHY_SERVICES_CLIENT_ID}" >> .env && \
    echo "EXPO_PUBLIC_WIHY_SERVICES_CLIENT_SECRET=${EXPO_PUBLIC_WIHY_SERVICES_CLIENT_SECRET}" >> .env

# Build the Expo web app
RUN cd mobile && npx expo export --platform web && node scripts/inject-seo.js

# ... rest of Dockerfile
```

---

## 🧪 Testing Checklist

After implementing fixes:

- [ ] Build locally and verify bundle contains correct URLs
- [ ] Check GitHub Actions logs for env var values
- [ ] Deploy to Firebase and verify files uploaded
- [ ] Clear browser cache (Ctrl+Shift+R / Cmd+Shift+R)
- [ ] Test in incognito/private window
- [ ] Check browser console for errors
- [ ] Test all tabs work
- [ ] Test navigation between routes
- [ ] Test API calls work

---

## 📋 Quick Fix Commands

```bash
# 1. Rebuild locally with fresh install
cd mobile
rm -rf node_modules dist .expo
npm ci
npm run build:web

# 2. Deploy to Firebase
cd ..
firebase deploy --only hosting

# 3. Verify deployment
curl -I https://wihy.ai

# 4. Force cache clear
firebase hosting:channel:deploy production --only hosting --force
```

---

## 🎯 Most Likely Root Cause

**Environment variables not being injected during server build**

The app works locally because your `.env` file has all the correct values. On the server, the `.env` file doesn't exist, and GitHub Actions secrets aren't being properly mapped to `EXPO_PUBLIC_*` environment variables during the build process.

This causes:
1. API URLs to be undefined or wrong
2. Client IDs/secrets missing
3. API calls fail
4. App crashes or freezes
5. Tabs don't work because navigation depends on working API/auth

**Fix:** Update GitHub Actions workflow to create `.env` file with correct values before building.
