# WiHY Monorepo Migration Guide

**Goal**: Combine wihy_ui (web) and wihy_native_app (mobile) into a single monorepo structure.

**Date**: January 13, 2026

---

## Table of Contents

1. [Monorepo Structure Overview](#monorepo-structure-overview)
2. [Step-by-Step Migration](#step-by-step-migration)
3. [Git History Preservation](#git-history-preservation)
4. [Updating CI/CD Workflows](#updating-cicd-workflows)
5. [Package Management](#package-management)
6. [Development Workflow](#development-workflow)

---

## Monorepo Structure Overview

### Target Structure

```
wihy-monorepo/
├── .github/
│   └── workflows/
│       ├── deploy-web.yml          # Web deployment (Firebase/GCP)
│       ├── deploy-mobile-ios.yml   # iOS app deployment
│       └── deploy-mobile-android.yml # Android app deployment
├── web/                            # Web application (current wihy_ui)
│   ├── client/
│   │   ├── src/
│   │   ├── public/
│   │   ├── package.json
│   │   └── tailwind.config.js
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── firebase.json
│   └── package.json
├── mobile/                         # Mobile app (wihy_native_app)
│   ├── android/
│   ├── ios/
│   ├── src/
│   ├── package.json
│   └── app.json
├── shared/                         # Shared code between web and mobile
│   ├── types/
│   ├── utils/
│   └── constants/
├── docs/                          # All documentation
│   ├── web/
│   ├── mobile/
│   └── deployment/
├── package.json                   # Root package.json (workspace manager)
├── .gitignore                    # Combined gitignore
└── README.md                     # Monorepo overview
```

### Benefits of Monorepo

✅ **Single Source of Truth**
- All code in one place
- Shared dependencies managed centrally
- Easier code sharing between web and mobile

✅ **Simplified Development**
- One git clone for everything
- Shared utilities and types
- Cross-platform changes in single PR

✅ **Better CI/CD**
- Single pipeline configuration
- Deploy web and mobile together
- Shared secrets and configurations

✅ **Easier Maintenance**
- One set of issues/PRs
- Unified versioning
- Single deployment documentation

---

## Step-by-Step Migration

### Phase 1: Backup Current Repositories

```bash
# Create backup directory
mkdir ~/wihy-backup
cd ~/wihy-backup

# Clone both repositories with full history
git clone https://github.com/kortney-lee/wihy_ui.git wihy_ui_backup
git clone https://github.com/kortney-lee/wihy_native_app.git wihy_native_app_backup

# Create archives
tar -czf wihy_ui_backup_$(date +%Y%m%d).tar.gz wihy_ui_backup/
tar -czf wihy_native_app_backup_$(date +%Y%m%d).tar.gz wihy_native_app_backup/

echo "✅ Backups created at ~/wihy-backup"
```

---

### Phase 2: Create New Monorepo

#### Option A: Fresh Monorepo (Clean Start)

```bash
# Create new repository on GitHub
gh repo create kortney-lee/wihy-monorepo --public --description "WiHY AI - Unified Web & Mobile Repository"

# Clone empty repo
git clone https://github.com/kortney-lee/wihy-monorepo.git
cd wihy-monorepo

# Initialize structure
mkdir -p web mobile shared docs
touch README.md package.json .gitignore
```

#### Option B: Start from wihy_ui (Keep Web History)

```bash
# Clone current web repo
git clone https://github.com/kortney-lee/wihy_ui.git wihy-monorepo
cd wihy-monorepo

# Rename remote
git remote rename origin old-web
git remote add origin https://github.com/kortney-lee/wihy-monorepo.git

# Create monorepo structure
mkdir -p mobile shared docs
```

---

### Phase 3: Migrate Web App to /web Directory

```bash
cd wihy-monorepo

# Create web directory
mkdir -p web

# Move all web files (preserving git history)
git mv client web/
git mv .github/workflows web/.github/workflows  # Temporarily
git mv Dockerfile web/
git mv nginx.conf web/
git mv firebase.json web/
git mv package.json web/
git mv package-lock.json web/
git mv tailwind.config.js web/  # If at root
git mv postcss.config.js web/   # If at root

# Move documentation
mkdir -p docs/web
git mv DEPLOYMENT*.md docs/web/
git mv ARCHITECTURE.md docs/web/
git mv VHEALTHSEARCH_CSS.md docs/web/

# Commit restructure
git add -A
git commit -m "refactor: restructure web app into /web directory"
```

---

### Phase 4: Import Mobile App (Preserving History)

This is the tricky part - we want to merge wihy_native_app into /mobile while keeping its git history.

#### Method 1: Git Subtree (Recommended)

```bash
cd wihy-monorepo

# Add native app as remote
git remote add native-app https://github.com/kortney-lee/wihy_native_app.git
git fetch native-app

# Merge native app into /mobile subdirectory
git subtree add --prefix=mobile native-app main --squash

# Or to keep full history (warning: can be large):
git subtree add --prefix=mobile native-app main

# Commit
git commit -m "feat: merge wihy_native_app into /mobile directory"

# Remove remote (no longer needed)
git remote remove native-app
```

#### Method 2: Manual Copy (Simpler, No History)

```bash
# Clone native app separately
cd ~/temp
git clone https://github.com/kortney-lee/wihy_native_app.git

# Copy to monorepo (excluding .git)
cd wihy-monorepo
rsync -av --exclude='.git' ~/temp/wihy_native_app/ mobile/

# Add and commit
git add mobile/
git commit -m "feat: add mobile app from wihy_native_app"
```

#### Method 3: Git Filter-Repo (Advanced, Full History)

```bash
# Install git-filter-repo
pip install git-filter-repo

# Clone native app
cd ~/temp
git clone https://github.com/kortney-lee/wihy_native_app.git
cd wihy_native_app

# Rewrite history to prefix all paths with 'mobile/'
git filter-repo --to-subdirectory-filter mobile

# In monorepo, add as remote and merge
cd wihy-monorepo
git remote add native-rewritten ~/temp/wihy_native_app
git fetch native-rewritten
git merge --allow-unrelated-histories native-rewritten/main -m "feat: merge mobile app with full history"

# Clean up
git remote remove native-rewritten
```

---

### Phase 5: Create Shared Directory

```bash
cd wihy-monorepo

# Create shared utilities
mkdir -p shared/{types,utils,constants,api}

# Example shared files:
cat > shared/types/index.ts << 'EOF'
// Shared TypeScript types for web and mobile
export interface User {
  id: string;
  email: string;
  name: string;
}

export interface NutritionData {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}
EOF

cat > shared/constants/api.ts << 'EOF'
// Shared API configuration
export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://ml.wihy.ai';
export const API_ENDPOINTS = {
  search: '/search',
  nutrition: '/nutrition',
  user: '/user',
};
EOF

cat > shared/utils/formatters.ts << 'EOF'
// Shared utility functions
export const formatCalories = (cal: number): string => {
  return `${cal.toFixed(0)} cal`;
};

export const formatMacro = (grams: number): string => {
  return `${grams.toFixed(1)}g`;
};
EOF

# Create shared package.json
cat > shared/package.json << 'EOF'
{
  "name": "@wihy/shared",
  "version": "1.0.0",
  "description": "Shared utilities for WiHY web and mobile",
  "main": "index.ts",
  "private": true
}
EOF

git add shared/
git commit -m "feat: add shared utilities for web and mobile"
```

---

### Phase 6: Setup Root Package.json (Workspace)

```bash
cd wihy-monorepo

cat > package.json << 'EOF'
{
  "name": "wihy-monorepo",
  "version": "1.0.0",
  "description": "WiHY AI - Unified Web & Mobile Repository",
  "private": true,
  "workspaces": [
    "web/client",
    "mobile",
    "shared"
  ],
  "scripts": {
    "web:dev": "npm run start --workspace=web/client",
    "web:build": "npm run build --workspace=web/client",
    "web:test": "npm run test --workspace=web/client",
    "mobile:ios": "npm run ios --workspace=mobile",
    "mobile:android": "npm run android --workspace=mobile",
    "mobile:start": "npm run start --workspace=mobile",
    "install:all": "npm install && npm install --workspaces",
    "clean": "npm run clean --workspaces --if-present",
    "lint": "npm run lint --workspaces --if-present",
    "test": "npm run test --workspaces --if-present"
  },
  "repository": {
    "type": "git",
    "url": "https://github.com/kortney-lee/wihy-monorepo.git"
  },
  "keywords": [
    "wihy",
    "nutrition",
    "health",
    "monorepo",
    "web",
    "mobile"
  ],
  "author": "Wihy.ai",
  "license": "MIT",
  "devDependencies": {
    "npm-run-all": "^4.1.5"
  }
}
EOF

git add package.json
git commit -m "chore: add root package.json with workspace configuration"
```

---

### Phase 7: Update .gitignore

```bash
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*
package-lock.json
yarn.lock

# Build outputs
/web/client/build/
/mobile/android/app/build/
/mobile/ios/build/
/mobile/ios/Pods/
dist/
build/

# Environment files
.env
.env.local
.env.production
.env.development

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Mobile specific
/mobile/ios/Pods/
/mobile/android/.gradle/
/mobile/android/app/build/
*.apk
*.ipa

# Logs
*.log
logs/

# Testing
coverage/
.nyc_output/

# Temporary files
tmp/
temp/
*.tmp

# Firebase
.firebase/
firebase-debug.log

# Docker
docker-compose.override.yml
EOF

git add .gitignore
git commit -m "chore: update gitignore for monorepo structure"
```

---

### Phase 8: Update CI/CD Workflows

#### Web Deployment Workflow

**`.github/workflows/deploy-web.yml`:**

```yaml
name: Deploy Web App (Firebase)

on:
  push:
    branches: [main]
    paths:
      - 'web/**'
      - 'shared/**'
      - '.github/workflows/deploy-web.yml'
  workflow_dispatch:

jobs:
  deploy-web:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: web
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'npm'
        cache-dependency-path: |
          web/package-lock.json
          web/client/package-lock.json

    - name: Install root dependencies
      run: npm ci
      working-directory: .

    - name: Install web dependencies
      run: |
        npm ci
        cd client && npm ci

    - name: Build web app
      run: npm run build
      working-directory: web/client
      env:
        REACT_APP_API_BASE_URL: ${{ secrets.REACT_APP_API_BASE_URL }}
        REACT_APP_WIHY_API_URL: https://ml.wihy.ai

    - name: Deploy to Firebase
      uses: FirebaseExtended/action-hosting-deploy@v0
      with:
        repoToken: ${{ secrets.GITHUB_TOKEN }}
        firebaseServiceAccount: ${{ secrets.FIREBASE_SERVICE_ACCOUNT_WIHY_AI }}
        channelId: live
        projectId: wihy-ai
        entryPoint: web
```

#### Mobile iOS Workflow

**`.github/workflows/deploy-mobile-ios.yml`:**

```yaml
name: Deploy Mobile App (iOS)

on:
  push:
    branches: [main]
    paths:
      - 'mobile/**'
      - 'shared/**'
      - '.github/workflows/deploy-mobile-ios.yml'
  workflow_dispatch:

jobs:
  build-ios:
    runs-on: macos-latest
    defaults:
      run:
        working-directory: mobile
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20'

    - name: Install dependencies
      run: npm ci

    - name: Install pods
      run: cd ios && pod install

    - name: Build iOS app
      run: npm run ios:build
      env:
        EXPO_PUBLIC_API_URL: ${{ secrets.REACT_APP_API_BASE_URL }}

    - name: Upload to TestFlight (optional)
      # Add TestFlight deployment steps
      run: echo "TestFlight deployment would go here"
```

#### Mobile Android Workflow

**`.github/workflows/deploy-mobile-android.yml`:**

```yaml
name: Deploy Mobile App (Android)

on:
  push:
    branches: [main]
    paths:
      - 'mobile/**'
      - 'shared/**'
      - '.github/workflows/deploy-mobile-android.yml'
  workflow_dispatch:

jobs:
  build-android:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: mobile
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20'

    - name: Setup JDK
      uses: actions/setup-java@v4
      with:
        distribution: 'temurin'
        java-version: '17'

    - name: Install dependencies
      run: npm ci

    - name: Build Android APK
      run: cd android && ./gradlew assembleRelease

    - name: Upload APK
      uses: actions/upload-artifact@v4
      with:
        name: app-release.apk
        path: mobile/android/app/build/outputs/apk/release/app-release.apk
```

---

### Phase 9: Update Documentation

#### Create Monorepo README

**`README.md`:**

```markdown
# WiHY AI - Monorepo

> Unified repository for WiHY web and mobile applications

## Repository Structure

- **`/web`** - React web application (wihy.ai)
- **`/mobile`** - React Native mobile app (iOS/Android)
- **`/shared`** - Shared code, types, and utilities
- **`/docs`** - Documentation for all platforms

## Quick Start

### Prerequisites
- Node.js 20+
- npm or yarn
- For iOS: Xcode, CocoaPods
- For Android: Android Studio, JDK 17

### Installation

```bash
# Clone repository
git clone https://github.com/kortney-lee/wihy-monorepo.git
cd wihy-monorepo

# Install all dependencies
npm run install:all
```

### Development

#### Web App
```bash
# Start web dev server
npm run web:dev

# Build for production
npm run web:build

# Run tests
npm run web:test
```

#### Mobile App
```bash
# Start Metro bundler
npm run mobile:start

# Run on iOS simulator
npm run mobile:ios

# Run on Android emulator
npm run mobile:android
```

### Deployment

- **Web**: Automatic deployment to Firebase on push to main
- **Mobile iOS**: Manual deployment via TestFlight
- **Mobile Android**: Manual deployment via Play Store

## Documentation

- [Web Deployment Guide](docs/web/DEPLOYMENT.md)
- [Mobile Deployment Guide](docs/mobile/DEPLOYMENT.md)
- [Architecture Overview](docs/ARCHITECTURE.md)
- [Contributing Guide](CONTRIBUTING.md)

## Links

- **Website**: https://wihy.ai
- **API**: https://ml.wihy.ai
- **Issues**: https://github.com/kortney-lee/wihy-monorepo/issues
```

---

### Phase 10: Test Everything

```bash
# Test web installation
cd web/client
npm ci
npm run build
cd ../..

# Test mobile installation
cd mobile
npm ci
# npm run android (if emulator available)
cd ..

# Test shared module
cd shared
npm link  # Make available to other packages
cd ..

# Test root workspace
npm install
npm run lint
npm run test
```

---

## Git History Preservation

### Comparing Methods

| Method | Pros | Cons | History Preserved? |
|--------|------|------|-------------------|
| **Git Subtree** | Simple, clean | Single commit for native | ❌ Squashed |
| **Manual Copy** | Very simple | No history | ❌ No |
| **Git Filter-Repo** | Full history | Complex setup | ✅ Yes |
| **Git Submodule** | Separate repos | Complex workflow | ✅ Yes (separate) |

### Recommended: Git Subtree with Full History

```bash
# This preserves ALL commit history from native app
git subtree add --prefix=mobile https://github.com/kortney-lee/wihy_native_app.git main

# Result: /mobile contains full git history
# Can see original commits with:
git log --follow mobile/
```

---

## Package Management

### Using npm Workspaces

```bash
# Install all workspace dependencies
npm install

# Run command in specific workspace
npm run build --workspace=web/client

# Run command in all workspaces
npm run test --workspaces

# Add dependency to specific workspace
npm install axios --workspace=mobile

# Add dependency to root
npm install -D typescript
```

### Shared Dependencies

Move common dependencies to root `package.json`:

```json
{
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "axios": "^1.6.0"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "@types/react": "^18.3.0",
    "eslint": "^8.56.0"
  }
}
```

Web and mobile can reference these without duplicating.

---

## Development Workflow

### Working on Web

```bash
# Navigate to web
cd web/client

# Start dev server
npm start

# Make changes, commit
git add .
git commit -m "feat(web): add new feature"
```

### Working on Mobile

```bash
# Navigate to mobile
cd mobile

# Start metro
npm start

# Run on iOS
npm run ios

# Make changes, commit
git add .
git commit -m "feat(mobile): add new screen"
```

### Working on Shared Code

```bash
# Edit shared utilities
cd shared
# Make changes to types/utils

# Test in web
cd ../web/client
npm start  # Verify changes work

# Test in mobile
cd ../../mobile
npm start  # Verify changes work

# Commit
git add .
git commit -m "feat(shared): add new utility function"
```

### Commit Message Convention

Use conventional commits with scope:

```
feat(web): add nutrition search feature
fix(mobile): resolve camera permissions issue
feat(shared): add shared API types
docs(web): update deployment guide
chore: update dependencies
ci(mobile): add iOS deployment workflow
```

---

## Migration Checklist

### Pre-Migration
- [ ] Backup both repositories
- [ ] Document current deployment state
- [ ] List all GitHub secrets needed
- [ ] Notify team of migration plan

### Migration Steps
- [ ] Create new monorepo repository
- [ ] Migrate web app to /web
- [ ] Import mobile app to /mobile
- [ ] Create shared utilities in /shared
- [ ] Setup root package.json with workspaces
- [ ] Update .gitignore for monorepo
- [ ] Create/update all CI/CD workflows
- [ ] Move documentation to /docs
- [ ] Create monorepo README

### Testing
- [ ] Test web build: `npm run web:build`
- [ ] Test mobile iOS (if available): `npm run mobile:ios`
- [ ] Test mobile Android (if available): `npm run mobile:android`
- [ ] Test all CI/CD workflows
- [ ] Verify shared code imports work

### Deployment
- [ ] Transfer all GitHub secrets to new repo
- [ ] Test web deployment to Firebase
- [ ] Verify wihy.ai updates correctly
- [ ] Update domain DNS (if needed)
- [ ] Test mobile builds

### Cleanup
- [ ] Archive old wihy_ui repository
- [ ] Archive old wihy_native_app repository
- [ ] Update all documentation links
- [ ] Update team documentation
- [ ] Notify stakeholders of new repo

---

## Quick Commands Reference

### Create Monorepo from Scratch

```bash
# Option 1: Fast setup (no history)
gh repo create kortney-lee/wihy-monorepo --public
git clone https://github.com/kortney-lee/wihy-monorepo.git
cd wihy-monorepo

# Copy web app
cp -r ../wihy_ui/* web/
cp -r ../wihy_native_app/* mobile/

# Commit
git add .
git commit -m "Initial monorepo structure"
git push origin main
```

### Merge with History

```bash
# Option 2: Preserve all history
cd wihy-monorepo

# Add native app with full history
git remote add native https://github.com/kortney-lee/wihy_native_app.git
git fetch native
git subtree add --prefix=mobile native main
```

### Test Deployments

```bash
# Test web deployment locally
cd web
firebase deploy --only hosting

# Test mobile builds
cd mobile
npm run ios:build
npm run android:build
```

---

## Troubleshooting

### Issue: npm workspaces not working

**Solution:**
```bash
# Ensure Node.js 18+ and npm 7+
node --version  # Should be 18+
npm --version   # Should be 7+

# Update npm if needed
npm install -g npm@latest
```

### Issue: Shared code not importing

**Solution:**
```bash
# In web/client/package.json, add:
{
  "dependencies": {
    "@wihy/shared": "file:../../shared"
  }
}

# Then:
npm install
```

### Issue: Git merge conflicts during subtree

**Solution:**
```bash
# Resolve conflicts
git status  # See conflicted files
# Edit files to resolve
git add .
git commit -m "resolve: merge conflicts from subtree"
```

### Issue: CI/CD workflows not triggering

**Solution:**
```yaml
# Ensure paths are correct in workflow:
on:
  push:
    paths:
      - 'web/**'  # Include trailing /**
      - '.github/workflows/deploy-web.yml'
```

---

## Summary

### Best Approach for Your Case

**Recommended: Start from wihy_ui, merge mobile with subtree**

```bash
# 1. Clone web repo as monorepo
git clone https://github.com/kortney-lee/wihy_ui.git wihy-monorepo
cd wihy-monorepo

# 2. Restructure to /web
mkdir web
git mv client web/
git mv Dockerfile web/
# ... move other web files
git commit -m "refactor: move web app to /web directory"

# 3. Add mobile app
git remote add mobile-source https://github.com/kortney-lee/wihy_native_app.git
git fetch mobile-source
git subtree add --prefix=mobile mobile-source main
git remote remove mobile-source

# 4. Create shared directory
mkdir -p shared/{types,utils,constants}
# Add shared files
git add shared/
git commit -m "feat: add shared utilities"

# 5. Setup workspace
# Create root package.json with workspaces
git add package.json
git commit -m "chore: setup npm workspaces"

# 6. Update workflows
# Copy workflow files to .github/workflows/
git add .github/workflows/
git commit -m "ci: update workflows for monorepo"

# 7. Push to new repo
git remote add origin https://github.com/kortney-lee/wihy-monorepo.git
git push origin main
```

**Total time**: 2-3 hours  
**Complexity**: Medium  
**History preserved**: Yes (full git history from both repos)

---

**Document Version**: 1.0  
**Last Updated**: January 13, 2026  
**Next Steps**: Execute migration, test thoroughly, then archive old repos
