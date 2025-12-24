# Google Cloud Platform Setup Scripts

## Initial GCP Project Setup

Run these commands to set up your Google Cloud project and enable required services:

```bash
# Set your project ID
export PROJECT_ID="wihy-health-app"

# Create new project (if needed)
gcloud projects create $PROJECT_ID --name="WIHY Health App"

# Set the project as default
gcloud config set project $PROJECT_ID

# Enable billing (you'll need to link a billing account)
# gcloud billing accounts list
# gcloud billing projects link $PROJECT_ID --billing-account=BILLING_ACCOUNT_ID

# Enable required APIs
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable cloudfunctions.googleapis.com
gcloud services enable firestore.googleapis.com
gcloud services enable storage-component.googleapis.com
gcloud services enable artifactregistry.googleapis.com
gcloud services enable vision.googleapis.com
gcloud services enable firebase.googleapis.com

echo "✅ GCP project setup complete!"
```

## Service Account Setup

Create service accounts for GitHub Actions:

```bash
# Create service account for deployment
gcloud iam service-accounts create github-actions-deploy \
    --description="Service account for GitHub Actions deployment" \
    --display-name="GitHub Actions Deploy"

# Grant necessary permissions
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:github-actions-deploy@$PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/cloudbuild.builds.editor"

gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:github-actions-deploy@$PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/run.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:github-actions-deploy@$PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/cloudfunctions.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:github-actions-deploy@$PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/artifactregistry.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:github-actions-deploy@$PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/storage.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:github-actions-deploy@$PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/datastore.owner"

# Create and download service account key
gcloud iam service-accounts keys create github-actions-key.json \
    --iam-account=github-actions-deploy@$PROJECT_ID.iam.gserviceaccount.com

echo "✅ Service account created! Store github-actions-key.json content in GitHub secret 'GCP_SA_KEY'"
```

## Firebase Setup

Set up Firebase for hosting and authentication:

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in your project
firebase init

# Select:
# - Hosting: Configure files for Firebase Hosting
# - Firestore: Configure security rules and indexes files for Firestore
# - Authentication: Configure authentication

# Link to your GCP project
firebase use $PROJECT_ID

# Create Firebase service account for GitHub Actions
firebase projects:addfirebase $PROJECT_ID

echo "✅ Firebase setup complete!"
```

## Required GitHub Secrets

Add these secrets to your GitHub repository (Settings > Secrets and variables > Actions):

### Google Cloud Secrets
- **GCP_SA_KEY**: Content of `github-actions-key.json` file
- **FIREBASE_SERVICE_ACCOUNT**: Firebase service account JSON (from Firebase console)
- **FIREBASE_TOKEN**: Firebase CI token (`firebase login:ci`)

### Application Environment Variables
- **REACT_APP_API_BASE_URL**: Your backend API URL
- **FIREBASE_API_KEY**: Firebase Web API key
- **FIREBASE_AUTH_DOMAIN**: `${PROJECT_ID}.firebaseapp.com`
- **FIREBASE_PROJECT_ID**: Your project ID
- **FIREBASE_STORAGE_BUCKET**: `${PROJECT_ID}.appspot.com`
- **FIREBASE_MESSAGING_SENDER_ID**: Firebase messaging sender ID
- **FIREBASE_APP_ID**: Firebase app ID

### Optional Notification Secrets
- **SLACK_WEBHOOK**: Slack webhook URL for deployment notifications

## Firebase Configuration Files

### firebase.json
```json
{
  "hosting": {
    "public": "build",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "**/*.@(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "max-age=31536000"
          }
        ]
      }
    ]
  },
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  }
}
```

### firestore.rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read and write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Public nutrition data (read-only for users)
    match /nutrition/{document=**} {
      allow read: if true;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // User meals - private to user
    match /meals/{mealId} {
      allow read, write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
    }
    
    // User health data - private to user
    match /health/{document=**} {
      allow read, write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
    }
  }
}
```

## Local Development Setup

For local development with GCP services:

```bash
# Install Google Cloud SDK
# https://cloud.google.com/sdk/docs/install

# Authenticate for local development
gcloud auth application-default login

# Set up local environment variables
cp .env.example .env.local

# Add to .env.local:
echo "GOOGLE_CLOUD_PROJECT=$PROJECT_ID" >> .env.local
echo "REACT_APP_API_BASE_URL=http://localhost:8080" >> .env.local

# Install dependencies and start development server
npm install
npm start
```

## Deployment Commands

### Manual Deployment
```bash
# Deploy frontend to Firebase
npm run build
firebase deploy --only hosting

# Deploy backend function
cd functions
npm install
firebase deploy --only functions

# Deploy to Cloud Run (alternative)
gcloud run deploy wihy-frontend \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

### Monitor Deployments
```bash
# Check Cloud Run services
gcloud run services list

# Check Firebase hosting sites
firebase hosting:sites:list

# View logs
gcloud logs read --filter="resource.type=cloud_run_revision"

# Check function status
gcloud functions list
```

## Cost Optimization Tips

1. **Use Firebase Hosting for static files** (free tier available)
2. **Set Cloud Run min instances to 0** (scale to zero when not in use)
3. **Use Cloud Functions for lightweight APIs** (pay per request)
4. **Enable Cloud Storage lifecycle policies** (automatically delete old files)
5. **Set up budget alerts** to monitor spending

```bash
# Create budget alert
gcloud beta billing budgets create \
  --billing-account=BILLING_ACCOUNT_ID \
  --display-name="WIHY Health App Budget" \
  --budget-amount=50USD \
  --threshold-rule=percent:0.8,basis:CURRENT_SPEND
```

## Security Checklist

- [ ] Service account has minimal required permissions
- [ ] Firestore security rules are properly configured
- [ ] API endpoints are protected with authentication
- [ ] Secrets are stored in GitHub repository secrets
- [ ] CORS is properly configured for your domain
- [ ] Cloud functions have appropriate timeout and memory limits
- [ ] Regular security scans are enabled in CI/CD

## Troubleshooting Common Issues

### Build Failures
```bash
# Check build logs
gcloud builds list --limit=5
gcloud builds log BUILD_ID
```

### Permission Issues
```bash
# Check service account permissions
gcloud projects get-iam-policy $PROJECT_ID

# Test service account locally
gcloud auth activate-service-account --key-file=github-actions-key.json
```

### Firebase Deployment Issues
```bash
# Check Firebase projects
firebase projects:list

# Verify Firebase configuration
firebase use --add $PROJECT_ID
```

## Next Steps After Setup

1. **Configure custom domain** for Firebase Hosting
2. **Set up monitoring and alerting** with Cloud Monitoring
3. **Implement backup strategies** for Firestore data
4. **Configure CDN** for static assets
5. **Set up staging environment** for testing
6. **Implement proper error tracking** with Cloud Error Reporting