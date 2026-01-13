# Repository Archival with Deployment Pipeline Preservation

**Document Purpose**: Guide for archiving the wihy_ui repository while maintaining active deployment capabilities.

**Date**: January 13, 2026  
**Repository**: kortney-lee/wihy_ui  
**Domain**: wihy.ai  

---

## Table of Contents

1. [Understanding GitHub Archive Limitations](#understanding-github-archive-limitations)
2. [Option 1: Don't Archive - Mark as Legacy](#option-1-dont-archive---mark-as-legacy)
3. [Option 2: Fork to New Active Repo](#option-2-fork-to-new-active-repo)
4. [Option 3: Deployment-Only Repository](#option-3-deployment-only-repository)
5. [Exporting GitHub Secrets](#exporting-github-secrets)
6. [Preserving Deployment Configuration](#preserving-deployment-configuration)
7. [Migration Checklist](#migration-checklist)

---

## Understanding GitHub Archive Limitations

### What Happens When You Archive a Repository

When you archive a GitHub repository:

❌ **STOPS WORKING:**
- ✗ GitHub Actions workflows stop running
- ✗ No new commits can be pushed
- ✗ No pull requests can be opened
- ✗ Issues and discussions are locked
- ✗ Repository settings cannot be changed
- ✗ **Deployments stop working**

✅ **STILL WORKS:**
- ✓ Code remains publicly visible (if public)
- ✓ Can still clone/fork the repository
- ✓ README and documentation readable
- ✓ Git history preserved
- ✓ Releases remain accessible
- ✓ GitHub Pages stays active (if enabled)

### ⚠️ CRITICAL: Archiving Breaks Deployments

**GitHub Actions workflows are disabled on archived repositories**, which means:
- Your deploy-gcp.yml workflow won't run on pushes
- Manual deployments via workflow_dispatch won't work
- Automated deployments stop completely
- wihy.ai will NOT receive updates

---

## Option 1: Don't Archive - Mark as Legacy

**Best for**: You want to keep deployment pipeline active but discourage new development.

### Implementation

#### Step 1: Add Archive Notice to README

```markdown
# 🏛️ WIHY UI (Legacy Repository - Archived for Reference)

> **⚠️ NOTICE: This repository is archived for reference only.**  
> **Active development has moved to:** [new-repo-link]  
> **Deployment pipeline remains active for wihy.ai maintenance.**

## Archive Status

- **Archived Date**: January 13, 2026
- **Reason**: Codebase consolidated into new repository
- **Current Status**: Deployment pipeline active, no new features
- **Support**: Security updates only

## For New Development

Please use the new repository: [link-to-new-repo]

---

[Rest of original README...]
```

#### Step 2: Lock Repository Settings

1. **Settings → General → Features**
   - ✅ Disable: Issues
   - ✅ Disable: Projects
   - ✅ Disable: Discussions
   - ✅ Keep: Wikis (for documentation)
   
2. **Settings → Branches**
   - Add branch protection to `main`:
     - ✅ Require pull request reviews
     - ✅ Require status checks
     - ✅ Do not allow bypassing (even for admins)

3. **Settings → Actions**
   - ✅ Keep enabled: "Allow all actions and reusable workflows"
   - ⚠️ Do NOT disable Actions

#### Step 3: Create Deprecation Branch

```bash
# Create a deprecation notice branch
git checkout -b archive/legacy-notice
echo "This repository is archived. See README for details." > .github/ARCHIVED_NOTICE.md
git add .github/ARCHIVED_NOTICE.md
git commit -m "docs: add archive notice"
git push origin archive/legacy-notice
```

#### Step 4: Add Repository Topics

GitHub Settings → Topics:
```
archived, legacy, deprecated, reference-only, wihy-ai
```

### Pros & Cons

✅ **Advantages:**
- Deployment pipeline keeps working
- Can still push emergency fixes
- Can revert to active development easily
- GitHub Actions secrets stay intact

❌ **Disadvantages:**
- Not truly "archived" in GitHub sense
- Still shows as active repository
- Requires manual management to prevent new issues/PRs

---

## Option 2: Fork to New Active Repo

**Best for**: Starting fresh with a new repository while preserving the old one for reference.

### Implementation Steps

#### Step 1: Create New Repository

```bash
# On GitHub:
# 1. Create new repo: kortney-lee/wihy-ui-v2 (or similar name)
# 2. Initialize empty (no README, no .gitignore)
```

#### Step 2: Mirror Repository Content

```bash
# Clone old repo
git clone https://github.com/kortney-lee/wihy_ui.git wihy_ui_backup
cd wihy_ui_backup

# Add new remote
git remote add new-origin https://github.com/kortney-lee/wihy-ui-v2.git

# Push all branches and tags
git push new-origin --all
git push new-origin --tags

# Set new repo as default
git remote set-url origin https://github.com/kortney-lee/wihy-ui-v2.git
```

#### Step 3: Transfer GitHub Secrets (Manual)

**You cannot export secrets directly**, so you must re-create them:

```bash
# Using GitHub CLI (gh)
# Note: You must have access to secret values from your secure storage

# List secrets from old repo (shows names only, not values)
gh secret list --repo kortney-lee/wihy_ui

# Set secrets in new repo (requires values)
gh secret set FIREBASE_SERVICE_ACCOUNT_WIHY_AI --repo kortney-lee/wihy-ui-v2 --body "$(cat firebase-service-account.json)"
gh secret set REACT_APP_API_BASE_URL --repo kortney-lee/wihy-ui-v2 --body "https://ml.wihy.ai"
gh secret set REACT_APP_GOOGLE_CLIENT_ID --repo kortney-lee/wihy-ui-v2 --body "$GOOGLE_CLIENT_ID"
gh secret set REACT_APP_MICROSOFT_CLIENT_ID --repo kortney-lee/wihy-ui-v2 --body "$MICROSOFT_CLIENT_ID"

# Continue for all 32+ secrets...
```

#### Step 4: Update Repository References

**Files to update in new repo:**

```bash
# package.json
{
  "repository": {
    "type": "git",
    "url": "https://github.com/kortney-lee/wihy-ui-v2.git"
  },
  "bugs": {
    "url": "https://github.com/kortney-lee/wihy-ui-v2/issues"
  }
}

# .github/workflows/deploy-gcp.yml
# Update any repository-specific references
```

#### Step 5: Test Deployment

```bash
# Push a test commit to main
git commit --allow-empty -m "test: verify deployment pipeline"
git push origin main

# Monitor GitHub Actions
gh run watch --repo kortney-lee/wihy-ui-v2
```

#### Step 6: Update DNS/Domain Configuration

**No changes needed** - Firebase Hosting connects to GitHub repo via service account, not repo URL.

**Verify:**
1. Firebase Console → Hosting → Settings
2. GitHub connection should auto-update or can be re-linked
3. Test: Push commit → Check if wihy.ai updates

#### Step 7: Archive Old Repository

```bash
# In GitHub UI:
# Settings → General → Danger Zone → Archive this repository
```

**Add archive banner to old README:**
```markdown
# ⚠️ ARCHIVED REPOSITORY

**This repository has been archived and is read-only.**

**Active repository:** https://github.com/kortney-lee/wihy-ui-v2

All development and deployments have moved to the new repository.
```

### Pros & Cons

✅ **Advantages:**
- Clean separation between old and new
- Old repo properly archived in GitHub
- New repo has clean activity history going forward
- Can reorganize/restructure in new repo

❌ **Disadvantages:**
- Must manually transfer ALL secrets (32+ secrets)
- GitHub Actions run history lost in new repo
- Must update external references (docs, links)
- More complex initial setup

---

## Option 3: Deployment-Only Repository

**Best for**: Minimal deployment repo that references archived code.

### Concept

Create a small repository containing **only** deployment configuration:

```
wihy-deployment/
├── .github/workflows/
│   └── deploy.yml           # Simplified deployment workflow
├── firebase.json            # Firebase config
├── deployment-config.json   # Deployment metadata
└── README.md               # Deployment instructions
```

### Implementation

#### Step 1: Create Deployment Repository

```bash
mkdir wihy-deployment
cd wihy-deployment
git init

# Create minimal structure
mkdir -p .github/workflows
```

#### Step 2: Create Deployment Workflow

**`.github/workflows/deploy.yml`:**

```yaml
name: Deploy WIHY AI to Firebase

on:
  workflow_dispatch:
    inputs:
      source_repo:
        description: 'Source repository to deploy'
        required: true
        default: 'kortney-lee/wihy_ui'
      source_ref:
        description: 'Branch/tag/commit to deploy'
        required: true
        default: 'main'

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout deployment config
      uses: actions/checkout@v4

    - name: Checkout source code
      uses: actions/checkout@v4
      with:
        repository: ${{ github.event.inputs.source_repo }}
        ref: ${{ github.event.inputs.source_ref }}
        path: source

    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20'

    - name: Install and Build
      run: |
        cd source/client
        npm ci
        npm run build
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
        entryPoint: source
```

#### Step 3: Archive Original Repo

Original repo can be fully archived since deployments run from deployment-only repo.

### Pros & Cons

✅ **Advantages:**
- Original repo can be fully archived
- Deployment config isolated and clean
- Can deploy from archived repo
- Easy to understand deployment process

❌ **Disadvantages:**
- Manual workflow dispatch only (no auto-deploy on push)
- Must maintain two repositories
- More complex for emergency fixes
- Requires public source repo or deploy keys

---

## Exporting GitHub Secrets

### ⚠️ Critical Information

**GitHub does NOT allow exporting secret values** for security reasons. You can only:
- List secret names
- Delete secrets
- Update secrets with new values

### How to Preserve Secrets

#### Option A: Document Secret Names and Sources

Create `SECRETS_INVENTORY.md` in private secure location:

```markdown
# GitHub Secrets Inventory - wihy_ui

## Firebase/GCP Secrets
- `FIREBASE_SERVICE_ACCOUNT_WIHY_AI`
  - Source: Firebase Console → Project Settings → Service Accounts
  - Type: JSON service account key
  - Location: Secure vault / 1Password entry "WIHY Firebase SA"

## API Keys
- `REACT_APP_API_BASE_URL`
  - Value: https://ml.wihy.ai
  - Type: Public URL
  
- `REACT_APP_GOOGLE_CLIENT_ID`
  - Source: Google Cloud Console → APIs & Services → Credentials
  - Project: wihy-ai
  - Location: Secure vault / 1Password entry "WIHY Google OAuth"

- `REACT_APP_MICROSOFT_CLIENT_ID`
  - Source: Azure Portal → App Registrations → wihy-ai
  - Location: Secure vault / 1Password entry "WIHY Microsoft OAuth"

## Database Secrets
- `POSTGRES_CONNECTION_STRING`
  - Source: Azure Portal → PostgreSQL Database → Connection strings
  - Format: postgresql://user:pass@host:5432/dbname
  - Location: Secure vault / 1Password entry "WIHY DB Prod"

[... continue for all 32+ secrets ...]
```

#### Option B: Use GitHub CLI to List Secrets

```bash
# List all secret names (values are never shown)
gh secret list --repo kortney-lee/wihy_ui

# Output example:
# FIREBASE_SERVICE_ACCOUNT_WIHY_AI       Updated 2024-12-15
# REACT_APP_API_BASE_URL                 Updated 2024-11-20
# REACT_APP_GOOGLE_CLIENT_ID             Updated 2024-10-05
# ... (32 total)

# Save to file
gh secret list --repo kortney-lee/wihy_ui > secrets-inventory.txt
```

#### Option C: Script to Copy Secrets to New Repo

**⚠️ Requires secret values from secure storage**

```bash
#!/bin/bash
# copy-secrets.sh

OLD_REPO="kortney-lee/wihy_ui"
NEW_REPO="kortney-lee/wihy-ui-v2"

# You must have secret values stored securely
# This script assumes you have them in environment variables or secure vault

declare -A SECRETS=(
  ["FIREBASE_SERVICE_ACCOUNT_WIHY_AI"]="$FIREBASE_SA_JSON"
  ["REACT_APP_API_BASE_URL"]="https://ml.wihy.ai"
  ["REACT_APP_GOOGLE_CLIENT_ID"]="$GOOGLE_CLIENT_ID"
  ["REACT_APP_MICROSOFT_CLIENT_ID"]="$MICROSOFT_CLIENT_ID"
  # ... add all secrets
)

for secret_name in "${!SECRETS[@]}"; do
  echo "Setting $secret_name in $NEW_REPO..."
  echo "${SECRETS[$secret_name]}" | gh secret set "$secret_name" --repo "$NEW_REPO"
done

echo "✅ All secrets copied to $NEW_REPO"
```

### Complete Secrets List (wihy_ui)

Based on deployment workflows, here are all required secrets:

```bash
# Firebase/GCP
FIREBASE_SERVICE_ACCOUNT_WIHY_AI

# API Configuration
REACT_APP_API_BASE_URL
REACT_APP_WIHY_API_URL

# OAuth Providers
REACT_APP_GOOGLE_CLIENT_ID
REACT_APP_MICROSOFT_CLIENT_ID
REACT_APP_APPLE_CLIENT_ID
REACT_APP_FACEBOOK_CLIENT_ID

# Azure (if using Azure deployment)
AZURE_CREDENTIALS
AZURE_CLIENT_ID
AZURE_CLIENT_SECRET
AZURE_TENANT_ID
AZURE_SUBSCRIPTION_ID
REGISTRY_USERNAME
REGISTRY_PASSWORD

# VM Deployment (if using VM)
VM_HOST
VM_USERNAME
VM_SSH_PRIVATE_KEY

# Database
POSTGRES_CONNECTION_STRING

# Additional API Keys
OPENAI_API_KEY

# Environment Flags
REACT_APP_ENVIRONMENT
REACT_APP_DEPLOYMENT_TYPE
REACT_APP_ENABLE_ANALYTICS
```

---

## Preserving Deployment Configuration

### Files to Back Up

Create backups of these critical files:

```bash
# Workflow files
.github/workflows/deploy-gcp.yml
.github/workflows/deploy-azure.yml
.github/workflows/deploy.yml

# Configuration
firebase.json
firestore.rules
firestore.indexes.json
Dockerfile
nginx.conf
package.json
client/package.json
tailwind.config.js

# Documentation
DEPLOYMENT.md
DEPLOYMENT-QUICK-REFERENCE.md
CICD_DEPLOYMENT_GUIDE.md
```

### Export to Secure Archive

```bash
# Create deployment archive
mkdir wihy-deployment-backup-2026-01-13
cd wihy-deployment-backup-2026-01-13

# Copy critical files
cp ../.github/workflows/*.yml ./workflows/
cp ../firebase.json ./
cp ../Dockerfile ./
cp ../nginx.conf ./
cp ../DEPLOYMENT*.md ./

# Create archive
tar -czf wihy-deployment-backup-2026-01-13.tar.gz *

# Store in secure location
# - Cloud storage (encrypted)
# - Password manager vault
# - Secure backup server
```

---

## Migration Checklist

### Before Archiving Old Repository

- [ ] **Export/Document All Secrets**
  - [ ] List all secret names: `gh secret list`
  - [ ] Document secret sources (where to get values)
  - [ ] Store secret values in secure vault (1Password, etc.)
  - [ ] Create secrets inventory document

- [ ] **Backup Deployment Configuration**
  - [ ] Copy all `.github/workflows/*.yml` files
  - [ ] Copy `firebase.json`, `Dockerfile`, `nginx.conf`
  - [ ] Copy all deployment documentation
  - [ ] Create compressed archive with timestamp

- [ ] **Document Current Deployment State**
  - [ ] Current Firebase project ID
  - [ ] Current domain (wihy.ai)
  - [ ] DNS configuration (A records, CNAME)
  - [ ] SSL certificate setup
  - [ ] Deployment frequency/schedule

- [ ] **Verify Access to External Services**
  - [ ] Firebase Console access
  - [ ] Google Cloud Console access
  - [ ] Domain registrar access
  - [ ] DNS provider access
  - [ ] OAuth provider consoles

### Setting Up New Repository (If Forking)

- [ ] **Create New Repository**
  - [ ] Create on GitHub: wihy-ui-v2 (or chosen name)
  - [ ] Set to public/private as needed
  - [ ] Do NOT initialize with README

- [ ] **Mirror Code**
  - [ ] Clone old repo
  - [ ] Push to new repo (all branches + tags)
  - [ ] Verify all code transferred

- [ ] **Re-create All Secrets**
  - [ ] Set `FIREBASE_SERVICE_ACCOUNT_WIHY_AI`
  - [ ] Set all `REACT_APP_*` variables
  - [ ] Set OAuth client IDs
  - [ ] Set database credentials
  - [ ] Verify secret count matches old repo

- [ ] **Update Repository References**
  - [ ] Update `package.json` repository URL
  - [ ] Update bug tracker URL
  - [ ] Update any hardcoded repo references
  - [ ] Update documentation links

- [ ] **Test Deployment Pipeline**
  - [ ] Push test commit to main
  - [ ] Monitor GitHub Actions workflow
  - [ ] Verify build succeeds
  - [ ] Verify Firebase deployment works
  - [ ] Check wihy.ai loads correctly

### Update External Services

- [ ] **Firebase Hosting**
  - [ ] Verify GitHub connection in Firebase Console
  - [ ] Re-link repository if needed
  - [ ] Test deployment from new repo

- [ ] **DNS (If Needed)**
  - [ ] Update A records (if changing hosting)
  - [ ] Update CNAME records
  - [ ] Verify SSL certificate auto-renews

- [ ] **OAuth Providers**
  - [ ] Update redirect URIs (if repo URL changed)
  - [ ] Test OAuth login flows
  - [ ] Verify all providers working

### Archive Old Repository

- [ ] **Add Archive Notice**
  - [ ] Update README with archive notice
  - [ ] Link to new repository
  - [ ] Add archive date and reason

- [ ] **Lock Down Old Repo**
  - [ ] Disable Issues
  - [ ] Disable Projects
  - [ ] Add branch protection
  - [ ] Add repository topics: `archived`, `legacy`

- [ ] **Archive Repository**
  - [ ] GitHub Settings → Archive this repository
  - [ ] Confirm deployment is working from new repo
  - [ ] Verify old repo shows "Archived" banner

### Post-Archive Verification

- [ ] **Test Full Deployment**
  - [ ] Make code change in new repo
  - [ ] Push to main branch
  - [ ] Verify GitHub Actions runs
  - [ ] Verify wihy.ai updates
  - [ ] Test all functionality

- [ ] **Update Documentation**
  - [ ] Update internal documentation with new repo URL
  - [ ] Update team wiki/knowledge base
  - [ ] Notify team of repo change
  - [ ] Update deployment runbooks

- [ ] **Monitor for 7 Days**
  - [ ] Check deployments working
  - [ ] Check analytics for errors
  - [ ] Monitor uptime
  - [ ] Verify SSL certificate valid

---

## Recommended Approach

### 🎯 Best Practice: Option 2 (Fork to New Repo)

**Why:**
1. ✅ Clean separation - old repo truly archived
2. ✅ New repo has fresh start
3. ✅ Deployment pipeline fully functional
4. ✅ Can reorganize code without affecting archive
5. ✅ GitHub Actions secrets properly isolated

**Timeline:**
- **Day 1**: Create new repo, mirror code
- **Day 2**: Transfer secrets, test deployment
- **Day 3-7**: Monitor new repo deployments
- **Day 8**: Archive old repo

### Alternative: Option 1 (Mark as Legacy)

**Use if:**
- You might need to reactivate old repo
- You want minimal disruption
- You're okay with "soft archive" approach

---

## Quick Start Commands

### GitHub CLI Setup (Required)

```bash
# Install GitHub CLI (if not installed)
# Windows: winget install GitHub.cli
# macOS: brew install gh

# Login to GitHub
gh auth login

# Verify access
gh repo view kortney-lee/wihy_ui
```

### Export Current Secrets List

```bash
# List all secrets (names only)
gh secret list --repo kortney-lee/wihy_ui > secrets-inventory.txt

# Count secrets
gh secret list --repo kortney-lee/wihy_ui | wc -l
```

### Create New Repository and Mirror

```bash
# Create new repo
gh repo create kortney-lee/wihy-ui-v2 --public --description "WIHY AI - Active deployment repository"

# Mirror content
git clone https://github.com/kortney-lee/wihy_ui.git wihy_mirror
cd wihy_mirror
git remote add new https://github.com/kortney-lee/wihy-ui-v2.git
git push new --all
git push new --tags
```

### Test Deployment in New Repo

```bash
# Trigger manual deployment
gh workflow run deploy-gcp.yml --repo kortney-lee/wihy-ui-v2

# Watch workflow
gh run watch --repo kortney-lee/wihy-ui-v2
```

---

## Emergency Procedures

### If Deployment Breaks After Archive

**Scenario**: Archived old repo, deployment stopped working.

**Fix:**

```bash
# Option 1: Unarchive temporarily
# GitHub Settings → Unarchive this repository
# Make emergency fix
# Re-archive after fix deployed

# Option 2: Deploy from local
cd wihy_ui_backup
npm run build
firebase deploy --only hosting

# Option 3: Restore from new repo
# Push fix to new repo (if created)
# Deployment should auto-trigger
```

### If Secrets Are Lost

**Scenario**: Cannot find secret values after archiving.

**Recovery:**

1. **Firebase Service Account**
   - Firebase Console → Project Settings → Service Accounts
   - Generate new private key
   - Replace in GitHub secrets

2. **OAuth Client IDs**
   - Google Cloud Console → Credentials → Copy client ID
   - Azure Portal → App Registrations → Copy client ID
   - Update secrets with current values

3. **Database Credentials**
   - Azure Portal → PostgreSQL → Connection strings
   - Copy new connection string
   - Update secret

---

## Support Contacts

| Service | Console URL | Purpose |
|---------|------------|---------|
| Firebase | https://console.firebase.google.com/ | Hosting, service accounts |
| Google Cloud | https://console.cloud.google.com/ | OAuth, APIs |
| Azure Portal | https://portal.azure.com/ | Database, OAuth |
| GitHub | https://github.com/settings/tokens | Personal access tokens |
| Domain DNS | (Your DNS provider) | DNS records |

---

## Summary

### If You Want Deployments to Keep Working:

**DO THIS:**
1. ✅ **Fork to new repo** (kortney-lee/wihy-ui-v2)
2. ✅ **Transfer all secrets manually** (use secure vault)
3. ✅ **Test deployment pipeline** thoroughly
4. ✅ **Then archive old repo**

**DON'T DO THIS:**
1. ❌ Archive repo first (breaks deployments immediately)
2. ❌ Delete secrets before backing up
3. ❌ Forget to test new repo deployment

### Key Takeaway

> **GitHub Actions do NOT run on archived repositories.**  
> To keep deployments working, you MUST have an active (non-archived) repository.

---

**Document Version**: 1.0  
**Last Updated**: January 13, 2026  
**Next Review**: Before archiving repository
